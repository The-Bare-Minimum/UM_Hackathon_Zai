import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'
import { getBusinessRules } from '@/lib/data/rules'
import { ANOMALY_THRESHOLD_PCT } from '@/lib/constants'
import type { FinanceAnomaly } from '@/types'

interface DetectedAnomaly {
  type: string
  category: string | null
  currentValue: number
  baselineValue: number
  deviationPct: number
  description: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { business_id } = body as { business_id: string }
    if (!business_id) {
      return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .eq('user_id', user.id)
      .single()
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const twentyEightDaysAgo = new Date()
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28)
    const twentyEightDaysAgoStr = twentyEightDaysAgo.toISOString().split('T')[0]

    // Fetch comparison data in parallel
    const [
      { data: thisWeekExpenses },
      { data: prevExpenses },
      { data: thisWeekRevenue },
      { data: prevRevenue },
      rules,
    ] = await Promise.all([
      supabase
        .from('expenses')
        .select('category, amount')
        .eq('business_id', business_id)
        .gte('expense_date', sevenDaysAgoStr),
      supabase
        .from('expenses')
        .select('category, amount')
        .eq('business_id', business_id)
        .gte('expense_date', twentyEightDaysAgoStr)
        .lt('expense_date', sevenDaysAgoStr),
      supabase
        .from('sales_records')
        .select('total_revenue')
        .eq('business_id', business_id)
        .gte('sale_date', sevenDaysAgoStr),
      supabase
        .from('sales_records')
        .select('total_revenue')
        .eq('business_id', business_id)
        .gte('sale_date', twentyEightDaysAgoStr)
        .lt('sale_date', sevenDaysAgoStr),
      getBusinessRules(business_id),
    ])

    // Calculate expense categories this week
    const thisWeekByCategory = new Map<string, number>()
    for (const e of thisWeekExpenses || []) {
      thisWeekByCategory.set(
        e.category,
        (thisWeekByCategory.get(e.category) || 0) + Number(e.amount)
      )
    }

    // Calculate 4-week average by category
    const avgByCategory = new Map<string, number>()
    for (const e of prevExpenses || []) {
      avgByCategory.set(
        e.category,
        (avgByCategory.get(e.category) || 0) + Number(e.amount)
      )
    }
    // Divide by 3 (3 weeks of historical data)
    for (const [cat, total] of avgByCategory) {
      avgByCategory.set(cat, total / 3)
    }

    // Revenue comparison
    const thisWeekRevenueTotal = (thisWeekRevenue || []).reduce(
      (s, r) => s + Number(r.total_revenue), 0
    )
    const prevWeeklyRevenueAvg = (prevRevenue || []).reduce(
      (s, r) => s + Number(r.total_revenue), 0
    ) / 3

    const detectedAnomalies: DetectedAnomaly[] = []

    // Check expense deviations
    for (const [category, thisWeekTotal] of thisWeekByCategory) {
      const avg = avgByCategory.get(category)
      if (avg && avg > 0) {
        const deviation = ((thisWeekTotal - avg) / avg) * 100
        if (Math.abs(deviation) > ANOMALY_THRESHOLD_PCT) {
          detectedAnomalies.push({
            type: 'expense_spike',
            category,
            currentValue: thisWeekTotal,
            baselineValue: avg,
            deviationPct: Math.round(deviation * 100) / 100,
            description: `${category} expenses this week (RM${thisWeekTotal.toFixed(2)}) are ${Math.abs(deviation).toFixed(0)}% ${deviation > 0 ? 'above' : 'below'} the weekly average (RM${avg.toFixed(2)})`,
          })
        }
      }
    }

    // Check revenue drop
    if (prevWeeklyRevenueAvg > 0) {
      const revenueDeviation = ((thisWeekRevenueTotal - prevWeeklyRevenueAvg) / prevWeeklyRevenueAvg) * 100
      if (revenueDeviation < -ANOMALY_THRESHOLD_PCT) {
        detectedAnomalies.push({
          type: 'revenue_drop',
          category: null,
          currentValue: thisWeekRevenueTotal,
          baselineValue: prevWeeklyRevenueAvg,
          deviationPct: Math.round(revenueDeviation * 100) / 100,
          description: `Revenue dropped ${Math.abs(revenueDeviation).toFixed(0)}% this week (RM${thisWeekRevenueTotal.toFixed(2)}) vs weekly average (RM${prevWeeklyRevenueAvg.toFixed(2)})`,
        })
      }
    }

    // Check new categories
    for (const category of thisWeekByCategory.keys()) {
      if (!avgByCategory.has(category)) {
        const amount = thisWeekByCategory.get(category) || 0
        detectedAnomalies.push({
          type: 'new_expense_category',
          category,
          currentValue: amount,
          baselineValue: 0,
          deviationPct: 100,
          description: `New expense category "${category}" appeared this week with RM${amount.toFixed(2)} in spending`,
        })
      }
    }

    // Budget exceeded check
    if (rules?.weekly_ingredient_budget) {
      const ingredientTotal = thisWeekByCategory.get('Ingredients') || 0
      if (ingredientTotal > rules.weekly_ingredient_budget) {
        detectedAnomalies.push({
          type: 'budget_exceeded',
          category: 'Ingredients',
          currentValue: ingredientTotal,
          baselineValue: rules.weekly_ingredient_budget,
          deviationPct: ((ingredientTotal - rules.weekly_ingredient_budget) / rules.weekly_ingredient_budget) * 100,
          description: `Ingredient spending (RM${ingredientTotal.toFixed(2)}) exceeded weekly budget of RM${rules.weekly_ingredient_budget}`,
        })
      }
    }

    // If no anomalies, return empty
    if (detectedAnomalies.length === 0) {
      return NextResponse.json({
        anomalies: [],
        detectedAt: new Date().toISOString(),
        summary: { danger: 0, warning: 0, info: 0 },
      })
    }

    // Use AI to generate narratives
    const systemPrompt = `You are a financial analyst. For each anomaly detected, write a clear 1-2 sentence explanation and a specific action. Return ONLY a valid JSON array. No markdown.`

    const userPrompt = `These financial anomalies were detected for a Malaysian F&B restaurant:

${detectedAnomalies.map((a, i) => `${i + 1}. ${a.description}`).join('\n')}

For each anomaly, return a JSON array where each element has:
{
  "anomaly_type": "${detectedAnomalies[0].type}",
  "title": "Short title (max 8 words)",
  "description": "1-2 sentences explaining what happened and why it matters, with specific MYR amounts",
  "affected_category": "category or null",
  "severity": "info|warning|danger",
  "current_value": number,
  "baseline_value": number,
  "deviation_pct": number
}

Severity guide:
- danger: > 50% deviation or revenue drop > 30%
- warning: 25-50% deviation
- info: new category or minor pattern change`

    let anomaliesToSave: Partial<FinanceAnomaly>[] = []

    try {
      const rawResponse = await callGemini(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.3, max_tokens: 1000 }
      )

      // Parse JSON array from response
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        anomaliesToSave = parsed.map((a: any, i: number) => ({
          business_id,
          anomaly_type: (detectedAnomalies[i]?.type || a.anomaly_type || 'unusual_pattern') as any,
          title: a.title || 'Financial anomaly detected',
          description: a.description || detectedAnomalies[i]?.description || '',
          affected_category: a.affected_category || detectedAnomalies[i]?.category || null,
          current_value: Number(a.current_value) || detectedAnomalies[i]?.currentValue || null,
          baseline_value: Number(a.baseline_value) || detectedAnomalies[i]?.baselineValue || null,
          deviation_pct: Number(a.deviation_pct) || detectedAnomalies[i]?.deviationPct || null,
          severity: (['info', 'warning', 'danger'].includes(a.severity) ? a.severity : 'warning') as any,
        }))
      }
    } catch (aiErr) {
      console.error('[Anomaly Detection] AI error:', aiErr)
      // Fallback: save raw anomalies without AI narratives
      anomaliesToSave = detectedAnomalies.map(a => ({
        business_id,
        anomaly_type: a.type as any,
        title: `${a.category || 'Revenue'} anomaly detected`,
        description: a.description,
        affected_category: a.category,
        current_value: a.currentValue,
        baseline_value: a.baselineValue,
        deviation_pct: a.deviationPct,
        severity: Math.abs(a.deviationPct) > 50 ? 'danger' as const : 'warning' as const,
      }))
    }

    // Delete today's existing anomalies for this business to avoid duplicates
    const todayStr = new Date().toISOString().split('T')[0]
    await supabase
      .from('finance_anomalies')
      .delete()
      .eq('business_id', business_id)
      .gte('detected_at', `${todayStr}T00:00:00`)

    // Insert new anomalies
    if (anomaliesToSave.length > 0) {
      await supabase.from('finance_anomalies').insert(anomaliesToSave)
    }

    // Fetch freshly saved anomalies
    const { data: savedAnomalies } = await supabase
      .from('finance_anomalies')
      .select('*')
      .eq('business_id', business_id)
      .eq('is_dismissed', false)
      .order('detected_at', { ascending: false })

    const all = (savedAnomalies || []) as FinanceAnomaly[]
    const summary = {
      danger: all.filter(a => a.severity === 'danger').length,
      warning: all.filter(a => a.severity === 'warning').length,
      info: all.filter(a => a.severity === 'info').length,
    }

    return NextResponse.json({
      anomalies: all,
      detectedAt: new Date().toISOString(),
      summary,
    })
  } catch (error) {
    console.error('[Anomaly Detection] Error:', error)
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    )
  }
}
