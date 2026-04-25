import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getInventoryLogsPaginated } from '@/lib/data/inventory'
import { ActivityHistoryClient } from '@/components/activity-history/activity-history-client'

export const metadata = {
  title: 'Activity History | FnB.ai',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    changeType?: string
    dateRange?: string
    customStartDate?: string
    customEndDate?: string
    itemName?: string
    sortBy?: string
  }>
}

export default async function ActivityHistoryPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  // Get user and business
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) redirect('/onboarding')

  // Await and parse search params
  const params = await searchParams
  const page = Number(params.page) || 1
  const changeType = (params.changeType as 'all' | 'add' | 'deduct' | 'adjust' | 'invoice') || 'all'
  const dateRange = (params.dateRange as 'all' | 'today' | 'week' | 'month' | 'custom') || 'all'
  const customStartDate = params.customStartDate
  const customEndDate = params.customEndDate
  const itemName = params.itemName || ''
  const sortBy = (params.sortBy as 'newest' | 'oldest') || 'newest'

  // Fetch paginated logs with filters and sort
  const result = await getInventoryLogsPaginated(business.id, {
    page,
    limit: 50,
    changeType,
    dateRange,
    customStartDate,
    customEndDate,
    itemName,
    sortBy,
  })

  return (
    <ActivityHistoryClient
      initialLogs={result.logs}
      initialTotalPages={result.totalPages}
      initialTotalCount={result.totalCount}
      initialPage={result.currentPage}
      initialFilters={{
        changeType,
        dateRange,
        customStartDate,
        customEndDate,
        itemName,
      }}
      initialSort={sortBy}
      businessId={business.id}
    />
  )
}
