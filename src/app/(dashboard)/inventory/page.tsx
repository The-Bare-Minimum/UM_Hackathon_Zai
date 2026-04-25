import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllInventoryItems, getInventoryStats, getInventoryLogs } from '@/lib/data/inventory'
import { InventoryClient } from '@/components/inventory/inventory-client'

export const metadata = {
  title: 'Inventory | FnB.ai',
}

export default async function InventoryPage() {
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

  // Fetch initial data
  const [items, stats, logs] = await Promise.all([
    getAllInventoryItems(business.id),
    getInventoryStats(business.id),
    getInventoryLogs(business.id, 10), // Get last 10 logs
  ])

  return (
    <InventoryClient 
      initialItems={items}
      initialStats={stats}
      initialLogs={logs}
      businessId={business.id}
    />
  )
}
