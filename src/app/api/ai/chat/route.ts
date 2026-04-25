import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'
import { buildChatContext } from '@/lib/data/chat-context'
import { getBusinessRules, buildRulesContext } from '@/lib/data/rules'
import { getMalaysiaDateString, getTimeGreeting } from '@/lib/utils'

export const maxDuration = 60

// ─── System Prompt Builder ───────────────────────────────
function buildSystemPrompt(businessContext: string): string {
  const today = getMalaysiaDateString()
  const now = new Date()
  const malaysiaHour = (now.getUTCHours() + 8) % 24
  const timeStr = `${String(malaysiaHour).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`
  const greeting = getTimeGreeting()

  return `You are Zara, an AI business advisor for a Malaysian F&B restaurant. You are friendly, direct, and always base your answers on the actual business data provided.

Your personality:
- Warm but professional — like a trusted advisor
- Concise — get to the point quickly
- Data-driven — always cite specific numbers
- Practical — focus on actionable insights
- Malaysian context — understand local F&B market, use MYR, reference local ingredients and practices

Your capabilities:
- Analyse sales trends and performance
- Identify inventory risks and opportunities
- Calculate financial ratios and margins
- Compare performance across time periods
- Suggest menu optimizations
- Flag cost inefficiencies
- Answer questions about specific items or staff

Rules:
- ALWAYS reference actual data from the business context
- NEVER make up numbers not in the data
- If asked about something not in the data, say so clearly and explain what data would be needed
- Keep responses under 200 words unless a detailed breakdown is explicitly requested
- Use bullet points for lists of 3+ items
- Always end with a follow-up question or suggestion when relevant
- If the question is ambiguous, answer the most likely interpretation and note the assumption
- Format currency as RM[amount] always
- You are speaking to the business OWNER — be respectful of their expertise

Current business data:
${businessContext}

Today's date: ${today}
Current time: ${timeStr} (${greeting})
`
}

// ─── POST Handler ────────────────────────────────────────
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
    const { business_id, message, conversation_history } = body as {
      business_id: string
      message: string
      conversation_history: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    // Validate inputs
    if (!business_id || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message too long. Maximum 500 characters.' },
        { status: 400 }
      )
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', business_id)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Rate limiting: check messages in last hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    const { count: recentCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business_id)
      .eq('role', 'user')
      .gte('created_at', oneHourAgo)

    if ((recentCount || 0) >= 20) {
      return NextResponse.json(
        { error: 'Too many messages. Please wait a moment.' },
        { status: 429 }
      )
    }

    // Build context
    const businessContext = await buildChatContext(business_id)
    const rules = await getBusinessRules(business_id)
    const rulesContext = buildRulesContext(rules)
    const systemPrompt = buildSystemPrompt(businessContext)
    const fullSystemPrompt = rulesContext
      ? systemPrompt + '\n\n' + rulesContext + '\nAlways check recommendations against these rules before responding. If the user asks for something that conflicts with a rule, flag the conflict and suggest alternatives.'
      : systemPrompt

    // Build messages array — take last 8 from history
    const recentHistory = (conversation_history || []).slice(-8)
    const messagesForAI = [
      { role: 'system' as const, content: fullSystemPrompt },
      ...recentHistory.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // Call Gemini
    let aiResponse: string
    try {
      aiResponse = await callGemini(messagesForAI, {
        temperature: 0.7,
        max_tokens: 800,
      })
    } catch (aiError) {
      console.error('[Chat] AI generation failed:', aiError)
      return NextResponse.json(
        { error: 'AI assistant temporarily unavailable. Please try again.' },
        { status: 503 }
      )
    }

    // Save both messages to database (non-blocking)
    const savePromises = [
      supabase.from('chat_messages').insert({
        business_id,
        role: 'user',
        content: message,
      }),
      supabase.from('chat_messages').insert({
        business_id,
        role: 'assistant',
        content: aiResponse,
        context_snapshot: businessContext.substring(0, 2000), // truncate for storage
      }),
    ]

    // Fire and forget — don't block response on DB writes
    Promise.all(savePromises).catch((err) => {
      console.error('[Chat] Failed to save messages:', err)
    })

    return NextResponse.json({
      message: aiResponse,
      role: 'assistant',
    })
  } catch (error) {
    console.error('[Chat] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
