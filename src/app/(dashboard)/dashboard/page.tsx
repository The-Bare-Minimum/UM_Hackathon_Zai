import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import {
  getSalesSummary,
  getInventorySummary,
  getExpenseSummary,
  hasSalesData,
} from '@/lib/data/dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (!user) return null

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!business) return null

  // Check if we have data
  const hasData = await hasSalesData(business.id)

  // Fetch all dashboard data server-side
  // We fetch even if empty so the UI gets default 0 values
  const [salesSummary, inventorySummary, expenseSummary] = await Promise.all([
    getSalesSummary(business.id),
    getInventorySummary(business.id),
    getExpenseSummary(business.id),
  ])

  return (
    <DashboardClient
      business={business}
      hasData={hasData}
      salesSummary={salesSummary}
      inventorySummary={inventorySummary}
      expenseSummary={expenseSummary}
    />
  )
}
