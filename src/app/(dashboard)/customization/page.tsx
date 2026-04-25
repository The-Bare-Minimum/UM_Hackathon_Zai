import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessRules } from '@/lib/data/rules'
import { CustomizationClient } from '@/components/customization/customization-client'
import type { Business } from '@/types'

export default async function CustomizationPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!business) redirect('/onboarding')

  const rules = await getBusinessRules(business.id)

  return (
    <CustomizationClient
      businessId={business.id}
      initialRules={rules}
      currency={business.currency || 'MYR'}
    />
  )
}
