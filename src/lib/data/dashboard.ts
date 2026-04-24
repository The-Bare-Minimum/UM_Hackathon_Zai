import { createClient } from '@/lib/supabase/server'
import type { InventoryItem } from '@/types'

// ─── Sales Summary ─────────────────────────────────────
export interface SalesSummary {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  todayTransactions: number
  weekTransactions: number
  yesterdayRevenue: number
  lastWeekRevenue: number
  revenueByDay: Array<{ date: string; revenue: number }>
  revenueByItem: Array<{ name: string; revenue: number; quantity: number }>
  peakHours: string
}

export async function getSalesSummary(businessId: string): Promise<SalesSummary> {
  const supabase = await createClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Calculate date boundaries
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0]

  const monthAgo = new Date(now)
  monthAgo.setDate(monthAgo.getDate() - 30)
  const monthAgoStr = monthAgo.toISOString().split('T')[0]

  // Fetch all sales in the last 30 days for calculations
  const { data: sales } = await supabase
    .from('sales_records')
    .select('*')
    .eq('business_id', businessId)
    .gte('sale_date', monthAgoStr)
    .order('sale_date', { ascending: true })

  const records = sales || []

  // Today's revenue & transactions
  const todayRecords = records.filter((r) => r.sale_date === today)
  const todayRevenue = todayRecords.reduce((sum, r) => sum + Number(r.total_revenue), 0)
  const todayTransactions = todayRecords.length

  // Yesterday's revenue (for trend comparison)
  const yesterdayRecords = records.filter((r) => r.sale_date === yesterdayStr)
  const yesterdayRevenue = yesterdayRecords.reduce((sum, r) => sum + Number(r.total_revenue), 0)

  // This week
  const weekRecords = records.filter((r) => r.sale_date >= weekAgoStr)
  const weekRevenue = weekRecords.reduce((sum, r) => sum + Number(r.total_revenue), 0)
  const weekTransactions = weekRecords.length

  // Last week (7-14 days ago) for trend
  const lastWeekRecords = records.filter(
    (r) => r.sale_date >= twoWeeksAgoStr && r.sale_date < weekAgoStr
  )
  const lastWeekRevenue = lastWeekRecords.reduce((sum, r) => sum + Number(r.total_revenue), 0)

  // Month revenue
  const monthRevenue = records.reduce((sum, r) => sum + Number(r.total_revenue), 0)

  // Revenue by day (last 14 days)
  const revenueByDay: Array<{ date: string; revenue: number }> = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayRecords = records.filter((r) => r.sale_date === dateStr)
    const dayRevenue = dayRecords.reduce((sum, r) => sum + Number(r.total_revenue), 0)
    revenueByDay.push({ date: dateStr, revenue: dayRevenue })
  }

  // Revenue by item (top 8)
  const itemMap = new Map<string, { revenue: number; quantity: number }>()
  for (const r of records) {
    const existing = itemMap.get(r.item_name) || { revenue: 0, quantity: 0 }
    existing.revenue += Number(r.total_revenue)
    existing.quantity += Number(r.quantity_sold)
    itemMap.set(r.item_name, existing)
  }
  const revenueByItem = Array.from(itemMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  return {
    todayRevenue,
    weekRevenue,
    monthRevenue,
    todayTransactions,
    weekTransactions,
    yesterdayRevenue,
    lastWeekRevenue,
    revenueByDay,
    revenueByItem,
    peakHours: 'Based on your data patterns',
  }
}

// ─── Inventory Summary ──────────────────────────────────
export interface InventorySummaryData {
  totalItems: number
  lowStockItems: InventoryItem[]
  criticalItems: InventoryItem[]
  totalStockValue: number
}

export async function getInventorySummary(businessId: string): Promise<InventorySummaryData> {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('business_id', businessId)

  const allItems = (items || []) as InventoryItem[]

  const totalItems = allItems.length
  const lowStockItems = allItems.filter((i) => i.status === 'low')
  const criticalItems = allItems.filter((i) => i.status === 'critical')
  const totalStockValue = allItems.reduce(
    (sum, i) => sum + Number(i.quantity) * Number(i.cost_per_unit),
    0
  )

  return { totalItems, lowStockItems, criticalItems, totalStockValue }
}

// ─── Expense Summary ────────────────────────────────────
export interface ExpenseSummaryData {
  weekExpenses: number
  monthExpenses: number
  expensesByCategory: Array<{ category: string; amount: number }>
  laborCostRatio: number
}

export async function getExpenseSummary(businessId: string): Promise<ExpenseSummaryData> {
  const supabase = await createClient()
  const now = new Date()

  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const monthAgo = new Date(now)
  monthAgo.setDate(monthAgo.getDate() - 30)
  const monthAgoStr = monthAgo.toISOString().split('T')[0]

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('business_id', businessId)
    .gte('expense_date', monthAgoStr)

  const allExpenses = expenses || []

  const weekExpenses = allExpenses
    .filter((e) => e.expense_date >= weekAgoStr)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const monthExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Expenses by category
  const catMap = new Map<string, number>()
  for (const e of allExpenses) {
    catMap.set(e.category, (catMap.get(e.category) || 0) + Number(e.amount))
  }
  const expensesByCategory = Array.from(catMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  // Labor cost ratio: total staff salary from expenses / month revenue
  const { data: salesData } = await supabase
    .from('sales_records')
    .select('total_revenue')
    .eq('business_id', businessId)
    .gte('sale_date', monthAgoStr)

  const monthRevenue = (salesData || []).reduce((sum, r) => sum + Number(r.total_revenue), 0)
  const staffSalary = allExpenses
    .filter((e) => e.category === 'Staff Salary')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const laborCostRatio = monthRevenue > 0 ? (staffSalary / monthRevenue) * 100 : 0

  return { weekExpenses, monthExpenses, expensesByCategory, laborCostRatio }
}

// ─── Business Context for Z.AI ──────────────────────────
export async function getBusinessContext(businessId: string): Promise<string> {
  const supabase = await createClient()

  // Get business info
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  // Get staff count
  const { data: staff } = await supabase
    .from('staff_members')
    .select('name, role, salary')
    .eq('business_id', businessId)

  const salesSummary = await getSalesSummary(businessId)
  const inventorySummary = await getInventorySummary(businessId)
  const expenseSummary = await getExpenseSummary(businessId)

  const topItems = salesSummary.revenueByItem
    .slice(0, 5)
    .map((i) => `${i.name} (RM${i.revenue.toFixed(2)})`)
    .join(', ')

  const lowNames = inventorySummary.lowStockItems.map((i) => i.name).join(', ')
  const criticalNames = inventorySummary.criticalItems.map((i) => i.name).join(', ')

  const expenseBreakdown = expenseSummary.expensesByCategory
    .map((c) => `${c.category}: RM${c.amount.toFixed(2)}`)
    .join(', ')

  return `Business: ${business?.name || 'Unknown'}, Type: ${business?.type || 'Unknown'}, Staff: ${(staff || []).length}

SALES (Last 7 days):
- Revenue: RM${salesSummary.weekRevenue.toFixed(2)}
- Transactions: ${salesSummary.weekTransactions}
- Top items: ${topItems || 'None'}

INVENTORY:
- ${inventorySummary.lowStockItems.length} items low on stock: ${lowNames || 'None'}
- ${inventorySummary.criticalItems.length} items critical: ${criticalNames || 'None'}
- Total stock value: RM${inventorySummary.totalStockValue.toFixed(2)}

EXPENSES (Last 7 days):
- Total: RM${expenseSummary.weekExpenses.toFixed(2)}
- Labor cost ratio: ${expenseSummary.laborCostRatio.toFixed(1)}%
- Breakdown: ${expenseBreakdown || 'None'}

STAFF:
${(staff || []).map((s) => `- ${s.name} (${s.role}): RM${Number(s.salary).toFixed(2)}/month`).join('\n') || '- None'}`
}

// ─── Check if demo data exists ──────────────────────────
export async function hasSalesData(businessId: string): Promise<boolean> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('sales_records')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)

  return (count || 0) > 0
}
