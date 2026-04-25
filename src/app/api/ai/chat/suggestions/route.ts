import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQuickContextStats } from '@/lib/data/chat-context'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')

    if (!businessId) {
      return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get quick stats for contextual suggestions
    const stats = await getQuickContextStats(businessId)

    const suggestions: string[] = []

    // Base questions (always)
    suggestions.push('How did my business perform this week?')
    suggestions.push('What are my top selling items?')
    suggestions.push('Give me a full business health report')

    // Contextual questions
    if (stats.hasCriticalItems) {
      suggestions.push('What should I restock urgently?')
    }

    if (stats.laborRatioHigh) {
      suggestions.push('How can I reduce my staff costs?')
    }

    if (stats.revenueDropped) {
      suggestions.push('Why did my revenue drop this week?')
    }

    if (stats.hasExpiringItems) {
      suggestions.push('What items are expiring soon?')
    }

    if (stats.foodCostRatioHigh) {
      suggestions.push('How can I reduce my food costs?')
    }

    // Closing questions (always)
    suggestions.push("What's my profit margin?")
    suggestions.push('Which items should I remove from the menu?')

    // Return max 6, prioritizing contextual ones in the middle
    const limited = suggestions.slice(0, 6)

    return NextResponse.json({ suggestions: limited })
  } catch (error) {
    console.error('[Suggestions] Error:', error)
    return NextResponse.json(
      { suggestions: [
        'How did my business perform this week?',
        'What are my top selling items?',
        'Give me a full business health report',
        "What's my profit margin?",
      ]},
      { status: 200 }
    )
  }
}
