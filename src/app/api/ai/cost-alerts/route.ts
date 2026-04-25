import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'
import { getBusinessContext } from '@/lib/data/dashboard'
import { getBusinessRules, buildRulesContext } from '@/lib/data/rules'

// Simple in-memory cache (1 hour TTL)
const alertCache = new Map<string, { alerts: CostAlert[]; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000

export interface CostAlert {
  type: 'warning' | 'danger' | 'success'
  message: string
  action: string
}

const SYSTEM_PROMPT = `You are a financial analyst for a Malaysian F&B SME.
Return ONLY a JSON array of alert objects. 
No explanation text outside the JSON.
Each alert object has:
- type: 'warning' | 'danger' | 'success'
- message: string (specific, with MYR amounts where possible)
- action: string (one specific action to take)

Generate 3-4 alerts based on this business data.

Examples of good alerts:
{"type":"danger","message":"Teh Tarik Powder is critically low at 0.4kg — potential revenue loss: RM140/week","action":"Order 2kg immediately from supplier (est. RM36)"}
{"type":"warning","message":"Staff cost is 34% of revenue this week — above ideal 28%","action":"Reduce 1 shift on Tuesday (slowest day)"}
{"type":"success","message":"Nasi Lemak margin is 68% — your best performing item","action":"Feature it in your weekend promotion"}`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { business_id } = body as { business_id: string }

    if (!business_id) {
      return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })
    }

    // Check cache
    const cached = alertCache.get(business_id)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ alerts: cached.alerts, cached: true })
    }

    const context = await getBusinessContext(business_id)

    // Get business rules for custom thresholds
    const rules = await getBusinessRules(business_id)
    const rulesContext = buildRulesContext(rules)
    const systemWithRules = rulesContext
      ? SYSTEM_PROMPT + '\nUse the owner\'s custom targets (not industry defaults) to determine what counts as a warning vs danger alert.\n' + rulesContext
      : SYSTEM_PROMPT

    const response = await callGemini(
      [
        { role: 'system', content: systemWithRules },
        {
          role: 'user',
          content: `Analyse this business data and generate cost/waste alerts:\n\n${context}`,
        },
      ],
      { temperature: 0.6, max_tokens: 500 }
    )

    // Parse JSON response — handle potential markdown wrapping
    let alerts: CostAlert[] = []
    try {
      let jsonStr = response.trim()
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      alerts = JSON.parse(jsonStr)
    } catch {
      // If parsing fails, try to extract JSON array from the response
      const match = response.match(/\[[\s\S]*\]/)
      if (match) {
        alerts = JSON.parse(match[0])
      } else {
        // Fallback: create a single alert from the text
        alerts = [
          {
            type: 'warning',
            message: response.slice(0, 150),
            action: 'Review your business data for more details',
          },
        ]
      }
    }

    // Cache
    alertCache.set(business_id, { alerts, timestamp: Date.now() })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Cost alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to generate alerts' },
      { status: 500 }
    )
  }
}
