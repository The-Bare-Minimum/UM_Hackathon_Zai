import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from '@/components/layout/dashboard-layout'
import { DashboardProvider } from '@/context/dashboard-context'
import { CsvImportModal } from '@/components/dashboard/csv-import-modal'
import type { Business } from '@/types'
import { getCriticalItemCount } from '@/lib/data/inventory'
import { getBusinessRules } from '@/lib/data/rules'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check authentication
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  if (!user) {
    redirect('/login')
  }

  // Check if business exists — redirect to onboarding if not
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    redirect('/onboarding')
  }

  const criticalItemsCount = await getCriticalItemCount(business.id)
  const rules = await getBusinessRules(business.id)
  const rulesConfigured = rules?.is_configured ?? false

  return (
    <DashboardProvider>
      <DashboardLayoutClient 
        business={business as Business}
        criticalItemsCount={criticalItemsCount}
        rulesConfigured={rulesConfigured}
      >
        {children}
        <CsvImportModal businessId={business.id} />
      </DashboardLayoutClient>
    </DashboardProvider>
  )
}
