import { createClient } from '@/lib/supabase/server'
import type { InventoryItem, InventoryLog, InventoryStats } from '@/types'

// ─── Get All Inventory Items ────────────────────────────
export async function getAllInventoryItems(
  businessId: string
): Promise<InventoryItem[]> {
  const supabase = await createClient()

  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('business_id', businessId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching inventory:', error)
    return []
  }

  const allItems = (items || []) as InventoryItem[]

  // Auto-update status based on current quantity and expiry
  const now = new Date()
  const updatedItems = allItems.map((item) => {
    let status: InventoryItem['status'] = 'ok'

    // Check expiry first
    if (item.expiry_date && new Date(item.expiry_date) < now) {
      status = 'expired'
    } else if (item.quantity <= 0) {
      status = 'critical'
    } else if (item.quantity <= item.reorder_level) {
      status = 'low'
    }

    return { ...item, status }
  })

  // Sort: critical first, then low, then ok, then expired — then alphabetically
  const statusOrder: Record<string, number> = {
    critical: 0,
    low: 1,
    ok: 2,
    expired: 3,
  }

  updatedItems.sort((a, b) => {
    const aOrder = statusOrder[a.status] ?? 4
    const bOrder = statusOrder[b.status] ?? 4
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name)
  })

  return updatedItems
}

// ─── Get Inventory Stats ────────────────────────────────
export async function getInventoryStats(
  businessId: string
): Promise<InventoryStats> {
  const items = await getAllInventoryItems(businessId)
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const totalItems = items.length
  const totalValue = items.reduce(
    (sum, i) => sum + Number(i.quantity) * Number(i.cost_per_unit),
    0
  )
  const criticalCount = items.filter((i) => i.status === 'critical').length
  const lowCount = items.filter((i) => i.status === 'low').length
  const okCount = items.filter((i) => i.status === 'ok').length
  const expiringThisWeek = items.filter((i) => {
    if (!i.expiry_date) return false
    const expiryDate = new Date(i.expiry_date)
    return expiryDate >= now && expiryDate <= weekFromNow
  })

  return {
    totalItems,
    totalValue,
    criticalCount,
    lowCount,
    okCount,
    expiringThisWeek,
  }
}

// ─── Get Inventory Logs ─────────────────────────────────
export async function getInventoryLogs(
  businessId: string,
  limit: number = 20
): Promise<InventoryLog[]> {
  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from('inventory_logs')
    .select(`
      id,
      inventory_item_id,
      business_id,
      change_type,
      quantity_change,
      notes,
      created_at,
      inventory_items!inner(name)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching inventory logs:', error)
    // Fallback: try without join
    const { data: fallbackLogs } = await supabase
      .from('inventory_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return (fallbackLogs || []).map((log: any) => ({
      ...log,
      item_name: 'Unknown Item',
    }))
  }

  return (logs || []).map((log: any) => ({
    id: log.id,
    inventory_item_id: log.inventory_item_id,
    business_id: log.business_id,
    item_name: log.inventory_items?.name || 'Unknown Item',
    change_type: log.change_type,
    quantity_change: log.quantity_change,
    notes: log.notes,
    created_at: log.created_at,
  }))
}

// ─── Get Critical Item Count (for sidebar badge) ────────
export async function getCriticalItemCount(
  businessId: string
): Promise<number> {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('inventory_items')
    .select('quantity, reorder_level')
    .eq('business_id', businessId)

  if (!items) return 0

  return items.filter(
    (i: any) => Number(i.quantity) <= 0 || Number(i.quantity) <= Number(i.reorder_level)
  ).length
}
