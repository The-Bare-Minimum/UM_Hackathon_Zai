import { createClient } from '@/lib/supabase/server'
import { getProfitLoss, getBurnRate, getAnomalies, getRecurringExpenses } from '@/lib/data/finance'
import { getBusinessRules } from '@/lib/data/rules'
import { FinanceClient } from '@/components/finance/finance-client'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  if (!user) return null

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency')
    .eq('user_id', user.id)
    .single()

  if (!business) return null

  const [initialPnL, initialBurnRate, initialAnomalies, initialRecurring, rules] =
    await Promise.all([
      getProfitLoss(business.id, 'month'),
      getBurnRate(business.id),
      getAnomalies(business.id),
      getRecurringExpenses(business.id),
      getBusinessRules(business.id),
    ])

  return (
    <FinanceClient
      businessId={business.id}
      currency={business.currency || 'MYR'}
      initialPnL={initialPnL}
      initialBurnRate={initialBurnRate}
      initialAnomalies={initialAnomalies}
      initialRecurring={initialRecurring}
      rules={rules}
    />
  )
}
