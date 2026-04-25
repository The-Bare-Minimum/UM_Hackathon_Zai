import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'
import { getBurnRate } from '@/lib/data/finance'
import { getBusinessRules, buildRulesContext } from '@/lib/data/rules'

const burnRateCache = new Map<string, { narrative: string; timestamp: number }>()
const CACHE_HOURS = 2

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { business_id } = await request.json()
    if (!business_id) return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })

    const { data: business } = await supabase
      .from('businesses').select('id').eq('id', business_id).eq('user_id', user.id).single()
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const [burnRateData, rules] = await Promise.all([
      getBurnRate(business_id),
      getBusinessRules(business_id),
    ])
    const rulesContext = buildRulesContext(rules)
    const targetRevenue = rules?.monthly_revenue_target || null

    const cached = burnRateCache.get(business_id)
    if (cached && Date.now() - cached.timestamp < CACHE_HOURS * 3600000) {
      return NextResponse.json({ burnRateData, narrative: cached.narrative, generatedAt: new Date().toISOString(), cached: true })
    }

    const systemPrompt = `You are a financial advisor for a Malaysian F&B business owner. Be direct and practical. Give specific MYR numbers. Max 150 words.`
    const userPrompt = `Analyse this burn rate data and give a clear assessment:

Daily burn rate: RM${burnRateData.dailyBurnRate.toFixed(2)}
Daily revenue: RM${burnRateData.dailyRevenue.toFixed(2)}
Net daily position: RM${(burnRateData.dailyRevenue - burnRateData.dailyBurnRate).toFixed(2)}
Trend: ${burnRateData.trend} (${burnRateData.trendPct > 0 ? '+' : ''}${burnRateData.trendPct.toFixed(1)}% change vs last week)
Monthly revenue target: ${targetRevenue ? `RM${targetRevenue}` : 'not set'}
${rulesContext ? '\n' + rulesContext : ''}

Give:
1. One sentence assessment of financial health
2. Whether they are on track for monthly target
3. The single most important thing to change
4. If trend is worsening: one specific urgent action

Keep under 120 words. Use MYR.`

    let narrative = ''
    try {
      narrative = await callGemini(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        { temperature: 0.5, max_tokens: 300 }
      )
    } catch {
      const status = burnRateData.isProfilePositive ? 'positive' : 'negative'
      narrative = `Your daily cash position is ${status}. You're spending RM${burnRateData.dailyBurnRate.toFixed(2)}/day against RM${burnRateData.dailyRevenue.toFixed(2)} in revenue. ${burnRateData.trend === 'worsening' ? 'Burn rate is increasing — review recent expenses immediately.' : 'Maintain current expense discipline.'}`
    }

    burnRateCache.set(business_id, { narrative, timestamp: Date.now() })

    return NextResponse.json({ burnRateData, narrative, generatedAt: new Date().toISOString(), cached: false })
  } catch (error) {
    console.error('[Burn Rate] Error:', error)
    return NextResponse.json({ error: 'Failed to generate burn rate analysis' }, { status: 500 })
  }
}
