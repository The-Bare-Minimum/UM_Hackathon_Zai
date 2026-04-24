import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BriefingHistoryClient } from '@/components/dashboard/briefing-history-client'

export default async function BriefingsPage() {
  const supabase = await createClient()

  const { data } = await supabase.auth.getUser()
  const user = data?.user
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!business) redirect('/onboarding')

  // Fetch last 7 briefings
  const { data: briefings } = await supabase
    .from('ai_briefings')
    .select('*')
    .eq('business_id', business.id)
    .order('briefing_date', { ascending: false })
    .limit(7)

  return (
    <BriefingHistoryClient
      briefings={briefings || []}
      businessName={business.name}
    />
  )
}
