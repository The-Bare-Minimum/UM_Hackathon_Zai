import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'
import { buildFinanceContext } from '@/lib/data/finance'
import { getBusinessRules, buildRulesContext } from '@/lib/data/rules'
import type { ProfitForecast } from '@/types'

export const maxDuration = 60

// Simple in-memory cache
const forecastCache = new Map<string, { data: ProfitForecast; timestamp: number }>()
const CACHE_HOURS = 6

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

    // Check cache
    const cached = forecastCache.get(business_id)
    if (cached && Date.now() - cached.timestamp < CACHE_HOURS * 3600000) {
      return NextResponse.json({ forecast: cached.data, cached: true })
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

    // Gather data
    const [financeContext, rules] = await Promise.all([
      buildFinanceContext(business_id),
      getBusinessRules(business_id),
    ])
    const rulesContext = buildRulesContext(rules)
    const targetRevenue = rules?.monthly_revenue_target || null

    // Build prompt
    const systemPrompt = `You are a financial forecasting analyst for a Malaysian F&B SME. You speak clearly and practically. Always use MYR. Base all projections strictly on the data provided. Return ONLY valid JSON. No markdown. No explanation outside the JSON.`

    const userPrompt = `Based on this financial data, generate a 30-day profit forecast with 3 scenarios.

${financeContext}

${rulesContext ? rulesContext : ''}

Monthly revenue target: ${targetRevenue ? `RM${targetRevenue}` : 'not set'}

Return this exact JSON structure:
{
  "forecastPeriod": "Next 30 days",
  "scenarios": [
    {
      "label": "optimistic",
      "projectedRevenue": number,
      "projectedExpenses": number,
      "projectedProfit": number,
      "projectedMarginPct": number,
      "assumptions": ["string"],
      "actions": ["string"]
    },
    {
      "label": "likely",
      "projectedRevenue": number,
      "projectedExpenses": number,
      "projectedProfit": number,
      "projectedMarginPct": number,
      "assumptions": ["string"],
      "actions": ["string"]
    },
    {
      "label": "pessimistic",
      "projectedRevenue": number,
      "projectedExpenses": number,
      "projectedProfit": number,
      "projectedMarginPct": number,
      "assumptions": ["string"],
      "actions": ["string"]
    }
  ],
  "recommendation": "string — single most important action to improve forecast",
  "onTrackForTarget": ${targetRevenue ? 'boolean' : 'null'},
  "targetRevenue": ${targetRevenue || 'null'}
}

Make projections realistic based on trends. Optimistic: 15-20% above likely. Pessimistic: 15-20% below likely. Each scenario needs 2-3 assumptions and 2-3 specific actions.`

    const rawResponse = await callGemini(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4, max_tokens: 1200 }
    )

    // Parse JSON from response
    let forecast: ProfitForecast
    try {
      // Try to extract JSON from response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      const parsed = JSON.parse(jsonMatch[0])

      // Validate
      if (!parsed.scenarios || parsed.scenarios.length !== 3) {
        throw new Error('Invalid scenario count')
      }

      forecast = {
        forecastPeriod: parsed.forecastPeriod || 'Next 30 days',
        scenarios: parsed.scenarios.map((s: any) => ({
          label: s.label,
          projectedRevenue: Math.abs(Number(s.projectedRevenue) || 0),
          projectedExpenses: Math.abs(Number(s.projectedExpenses) || 0),
          projectedProfit: Number(s.projectedProfit) || 0,
          projectedMarginPct: Number(s.projectedMarginPct) || 0,
          assumptions: Array.isArray(s.assumptions) ? s.assumptions : [],
          actions: Array.isArray(s.actions) ? s.actions : [],
        })),
        recommendation: parsed.recommendation || 'Focus on maintaining current revenue while reducing variable costs.',
        onTrackForTarget: parsed.onTrackForTarget ?? null,
        targetRevenue: parsed.targetRevenue ?? targetRevenue,
        generatedAt: new Date().toISOString(),
      }
    } catch (parseErr) {
      console.error('[Finance Forecast] Parse error:', parseErr)
      return NextResponse.json(
        { error: 'Failed to parse AI forecast response' },
        { status: 422 }
      )
    }

    // Cache
    forecastCache.set(business_id, { data: forecast, timestamp: Date.now() })

    return NextResponse.json({ forecast, cached: false })
  } catch (error) {
    console.error('[Finance Forecast] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    )
  }
}
