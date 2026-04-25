import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecentChatHistory, getQuickContextStats } from '@/lib/data/chat-context'
import { ChatbotClient } from '@/components/chatbot/chatbot-client'

export default async function ChatbotPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    redirect('/onboarding')
  }

  // Fetch initial data in parallel
  const [chatHistory, stats] = await Promise.all([
    getRecentChatHistory(business.id, 10),
    getQuickContextStats(business.id),
  ])

  // Build contextual suggestions
  const suggestions: string[] = []

  suggestions.push('How did my business perform this week?')
  suggestions.push('What are my top selling items?')
  suggestions.push('Give me a full business health report')

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

  suggestions.push("What's my profit margin?")
  suggestions.push('Which items should I remove from the menu?')

  const initialSuggestions = suggestions.slice(0, 6)

  return (
    <ChatbotClient
      businessId={business.id}
      businessName={business.name}
      initialMessages={chatHistory}
      initialSuggestions={initialSuggestions}
    />
  )
}
