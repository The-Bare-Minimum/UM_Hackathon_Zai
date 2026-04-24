import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'
import { getBusinessContext } from '@/lib/data/dashboard'

// Simple in-memory cache (1 hour TTL)
const insightCache = new Map<string, { insight: string; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

const SYSTEM_PROMPT = `You are an AI business analyst for a Malaysian F&B SME. 
You speak concisely and practically. 
Always give specific numbers and actionable recommendations.
Never give generic advice. Base everything on the data provided.
Format: 2-3 sentences maximum. End with one specific action.
Currency is MYR (Malaysian Ringgit).`

const SECTION_PROMPTS: Record<string, (ctx: string) => string> = {
  revenue: (ctx) => `Analyse this revenue data for a Malaysian F&B business:
${ctx}

Give a 2-3 sentence insight about revenue performance and one specific recommendation to improve it.
Include an estimated MYR impact of following the recommendation.`,

  inventory: (ctx) => `Analyse this inventory data for a Malaysian F&B business:
${ctx}

Identify the most urgent inventory risk and give a specific recommendation including what to order and estimated cost.`,

  expenses: (ctx) => `Analyse this expense data for a Malaysian F&B business:
${ctx}

Identify the biggest cost concern and give a specific recommendation to reduce costs. Include estimated monthly savings.`,

  overview: (ctx) => `Give an overall business health assessment for this Malaysian F&B business in 3 sentences:
${ctx}

End with the single most important action the owner should take today.`,
}

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
    const { business_id, section } = body as {
      business_id: string
      section: string
    }

    if (!business_id || !section) {
      return NextResponse.json({ error: 'Missing business_id or section' }, { status: 400 })
    }

    if (!SECTION_PROMPTS[section]) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }

    // Check cache
    const cacheKey = `${business_id}:${section}`
    const cached = insightCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ insight: cached.insight, section, cached: true })
    }

    // Get business context
    const context = await getBusinessContext(business_id)

    // Call Gemini
    const insight = await callGemini(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: SECTION_PROMPTS[section](context) },
      ],
      { temperature: 0.7, max_tokens: 300 }
    )

    // Cache the result
    insightCache.set(cacheKey, { insight, timestamp: Date.now() })

    return NextResponse.json({ insight, section })
  } catch (error) {
    console.error('AI insight error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insight' },
      { status: 500 }
    )
  }
}
