import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'
import { getBusinessContext } from '@/lib/data/dashboard'
import { getBusinessRules, buildRulesContext } from '@/lib/data/rules'
import { getMalaysiaDateString, getTimeGreeting, getMalaysiaDayName, formatBriefingDate } from '@/lib/utils'
import type { BriefingContent } from '@/types'

// ─── Prompt Templates ────────────────────────────────────

const SYSTEM_PROMPT = `You are a friendly but professional AI business advisor for a Malaysian F&B SME owner. You speak like a trusted advisor who genuinely cares about the business.

Your daily briefing must:
1. Start with a warm time-appropriate greeting using the business name
2. Give 3-5 specific insights based purely on the data
3. Highlight the single most urgent issue requiring attention today
4. End with one motivating but realistic closing line

Rules:
- Always use MYR for currency
- Be specific — use real numbers from the data
- Never give generic advice not backed by the data
- Keep total length to 150-200 words
- Use simple, clear Malaysian business English
- Structure with clear sections using these exact markers:
  [GREETING], [INSIGHTS], [URGENT], [CLOSING]`

function buildUserPrompt(
  businessContext: string,
  yesterdayRevenue: number,
  businessAgeDays: number,
  totalTransactions: number,
  expiringItems: string,
  businessName: string
): string {
  const day = getMalaysiaDayName()
  const date = formatBriefingDate()

  return `Generate today's daily briefing for this business.
Today is ${day}, ${date} (Malaysia time).

${businessContext}

Additional context:
- Yesterday's revenue: RM${yesterdayRevenue.toFixed(2)}
- Business age: ${businessAgeDays} days
- Total historical transactions: ${totalTransactions}
- Items expiring soon: ${expiringItems}

Generate the briefing now.`
}

function buildFallbackPrompt(
  businessName: string,
  weekRevenue: number,
  topItem: string,
  lowStockItems: string,
  weekExpenses: number
): string {
  const timeGreeting = getTimeGreeting()
  return `You are a business advisor. Based on this data, write a 150 word morning briefing for ${businessName}:

Revenue this week: RM${weekRevenue.toFixed(2)}
Top item: ${topItem}
Low stock items: ${lowStockItems}
Total expenses this week: RM${weekExpenses.toFixed(2)}

Start with "Good ${timeGreeting}, ${businessName}!" and give 3 specific insights with numbers.

Use these exact section markers: [GREETING], [INSIGHTS], [URGENT], [CLOSING]`
}

// ─── Response Parser ─────────────────────────────────────

function parseBriefingResponse(raw: string, businessName: string): BriefingContent {
  const timeGreeting = getTimeGreeting()

  // Try to extract sections using markers
  const greetingMatch = raw.match(/\[GREETING\]([\s\S]*?)(?=\[INSIGHTS\])/i)
  const insightsMatch = raw.match(/\[INSIGHTS\]([\s\S]*?)(?=\[URGENT\])/i)
  const urgentMatch = raw.match(/\[URGENT\]([\s\S]*?)(?=\[CLOSING\])/i)
  const closingMatch = raw.match(/\[CLOSING\]([\s\S]*?)$/i)

  const hasAllMarkers = greetingMatch && insightsMatch

  if (hasAllMarkers) {
    const greeting = (greetingMatch[1] || '').trim()
    const insightsRaw = (insightsMatch![1] || '').trim()
    const urgent = urgentMatch ? urgentMatch[1].trim() : null
    const closing = closingMatch ? closingMatch[1].trim() : null

    // Split insights by newline, filtering empty lines and bullet markers
    const insights = insightsRaw
      .split('\n')
      .map((line) => line.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter((line) => line.length > 5)

    return {
      greeting: greeting || `Good ${timeGreeting}, ${businessName}!`,
      insights: insights.length > 0 ? insights : [insightsRaw],
      urgent: urgent && urgent.length > 5 ? urgent : null,
      closing: closing && closing.length > 5 ? closing : null,
      raw,
    }
  }

  // Fallback: use raw response as insights
  const lines = raw
    .split('\n')
    .map((line) => line.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter((line) => line.length > 10)

  return {
    greeting: `Good ${timeGreeting}, ${businessName}!`,
    insights: lines.length > 0 ? lines.slice(0, 5) : [raw.substring(0, 500)],
    urgent: null,
    closing: null,
    raw,
  }
}

// ─── Quality Validation ──────────────────────────────────

function validateResponse(response: string): boolean {
  if (!response || response.length < 50) return false
  const wordCount = response.split(/\s+/).length
  if (wordCount < 50) return false
  if (response.toLowerCase().includes('i cannot') || response.toLowerCase().includes("i don't have")) {
    return false
  }
  return true
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
    const { business_id } = body as { business_id: string }

    if (!business_id) {
      return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })
    }

    // Verify business belongs to user
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, staff_count, created_at')
      .eq('id', business_id)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const today = getMalaysiaDateString()

    // ── STEP 1: Check cache ──
    const { data: cached } = await supabase
      .from('ai_briefings')
      .select('*')
      .eq('business_id', business_id)
      .eq('briefing_date', today)
      .single()

    if (cached) {
      let content: BriefingContent
      try {
        content = typeof cached.content === 'string' ? JSON.parse(cached.content) : cached.content
      } catch {
        content = {
          greeting: `Good ${getTimeGreeting()}, ${business.name}!`,
          insights: [cached.content as string],
          urgent: null,
          closing: null,
          raw: cached.content as string,
        }
      }

      return NextResponse.json({
        briefing: content,
        cached: true,
        date: today,
        generatedAt: cached.created_at,
      })
    }

    // ── STEP 2: Gather business data ──
    const businessContext = await getBusinessContext(business_id)

    // Yesterday's revenue
    const yesterday = new Date(getMalaysiaDateString())
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: yesterdaySales } = await supabase
      .from('sales_records')
      .select('total_revenue')
      .eq('business_id', business_id)
      .eq('sale_date', yesterdayStr)

    const yesterdayRevenue = (yesterdaySales || []).reduce(
      (sum, r) => sum + Number(r.total_revenue),
      0
    )

    // Business age
    const createdDate = new Date(business.created_at)
    const now = new Date()
    const businessAgeDays = Math.floor(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Total sales count
    const { count: totalTransactions } = await supabase
      .from('sales_records')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business_id)

    // Expiring items (within 3 days)
    const threeDaysOut = new Date()
    threeDaysOut.setDate(threeDaysOut.getDate() + 3)
    const threeDaysStr = threeDaysOut.toISOString().split('T')[0]

    const { data: expiringItems } = await supabase
      .from('inventory_items')
      .select('name, expiry_date')
      .eq('business_id', business_id)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', threeDaysStr)
      .gte('expiry_date', today)

    const expiringList =
      expiringItems && expiringItems.length > 0
        ? expiringItems.map((i) => `${i.name} (expires ${i.expiry_date})`).join(', ')
        : 'none'

    // Also get week revenue and top item for fallback prompt
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: weekSales } = await supabase
      .from('sales_records')
      .select('item_name, total_revenue')
      .eq('business_id', business_id)
      .gte('sale_date', weekAgo.toISOString().split('T')[0])

    const weekRevenue = (weekSales || []).reduce((sum, r) => sum + Number(r.total_revenue), 0)
    const itemMap = new Map<string, number>()
    for (const s of weekSales || []) {
      itemMap.set(s.item_name, (itemMap.get(s.item_name) || 0) + Number(s.total_revenue))
    }
    const topItem = [...itemMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    // Low stock for fallback
    const { data: lowStock } = await supabase
      .from('inventory_items')
      .select('name')
      .eq('business_id', business_id)
      .in('status', ['low', 'critical'])

    const lowStockNames = (lowStock || []).map((i) => i.name).join(', ') || 'none'

    // Week expenses for fallback
    const { data: weekExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('business_id', business_id)
      .gte('expense_date', weekAgo.toISOString().split('T')[0])

    const weekExpenseTotal = (weekExpenses || []).reduce((sum, e) => sum + Number(e.amount), 0)

    // ── STEP 3: Generate briefing with AI ──
    const rules = await getBusinessRules(business_id)
    const rulesContext = buildRulesContext(rules)

    const userPrompt = buildUserPrompt(
      businessContext,
      yesterdayRevenue,
      businessAgeDays,
      totalTransactions || 0,
      expiringList,
      business.name
    )

    let rawResponse: string
    let retried = false

    const systemWithRules = rulesContext
      ? SYSTEM_PROMPT + '\n\n' + rulesContext + '\nPay special attention to any rule violations in the urgent section.'
      : SYSTEM_PROMPT

    try {
      rawResponse = await callGemini(
        [
          { role: 'system', content: systemWithRules },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.7, max_tokens: 400 }
      )

      // Quality check — retry once with simplified prompt
      if (!validateResponse(rawResponse)) {
        console.warn('[Briefing] Quality check failed, retrying with fallback prompt')
        retried = true
        rawResponse = await callGemini(
          [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: buildFallbackPrompt(
                business.name,
                weekRevenue,
                topItem,
                lowStockNames,
                weekExpenseTotal
              ),
            },
          ],
          { temperature: 0.5, max_tokens: 400 }
        )
      }
    } catch (aiError) {
      console.error('[Briefing] AI generation failed:', aiError)
      return NextResponse.json(
        { error: 'Briefing temporarily unavailable' },
        { status: 503 }
      )
    }

    // ── STEP 4: Parse response ──
    const briefingContent = parseBriefingResponse(rawResponse, business.name)

    // ── STEP 5: Save to cache (upsert) ──
    const contentJson = JSON.stringify(briefingContent)
    const { error: upsertError } = await supabase.from('ai_briefings').upsert(
      {
        business_id,
        content: contentJson,
        briefing_date: today,
      },
      { onConflict: 'business_id,briefing_date' }
    )

    if (upsertError) {
      console.error('[Briefing] Cache save error:', upsertError)
      // Non-fatal — still return the briefing
    }

    // ── STEP 6: Return response ──
    return NextResponse.json({
      briefing: briefingContent,
      cached: false,
      date: today,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Briefing] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
