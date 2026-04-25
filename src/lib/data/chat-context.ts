import { createClient } from '@/lib/supabase/server'
import type { ChatMessage, InventoryItem } from '@/types'

// ─── Build Comprehensive Chat Context ────────────────────
export async function buildChatContext(businessId: string): Promise<string> {
  const supabase = await createClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  const monthAgo = new Date(now)
  monthAgo.setDate(monthAgo.getDate() - 30)
  const monthAgoStr = monthAgo.toISOString().split('T')[0]

  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0]

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const sevenDaysFromNow = new Date(now)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]

  // ── Parallel fetches ──
  const [
    { data: business },
    { data: staff },
    { data: salesRecords },
    { data: inventoryItems },
    { data: expenses },
  ] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('staff_members').select('*').eq('business_id', businessId),
    supabase
      .from('sales_records')
      .select('*')
      .eq('business_id', businessId)
      .gte('sale_date', monthAgoStr)
      .order('sale_date', { ascending: true }),
    supabase
      .from('inventory_items')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true }),
    supabase
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .gte('expense_date', monthAgoStr),
  ])

  const allSales = salesRecords || []
  const allInventory = (inventoryItems || []) as InventoryItem[]
  const allExpenses = expenses || []
  const allStaff = staff || []

  // ═══ BUSINESS PROFILE ═══
  const daysSinceRegistration = business?.created_at
    ? Math.floor((now.getTime() - new Date(business.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // ═══ SALES DATA (Last 30 days) ═══
  const totalRevenue = allSales.reduce((sum, r) => sum + Number(r.total_revenue), 0)
  const dailyAverage = totalRevenue / 30

  // Today's revenue
  const todaySales = allSales.filter((r) => r.sale_date === today)
  const todayRevenue = todaySales.reduce((sum, r) => sum + Number(r.total_revenue), 0)

  // Yesterday's revenue
  const yesterdaySales = allSales.filter((r) => r.sale_date === yesterdayStr)
  const yesterdayRevenue = yesterdaySales.reduce((sum, r) => sum + Number(r.total_revenue), 0)

  // Week-over-week change
  const thisWeekSales = allSales.filter((r) => r.sale_date >= weekAgoStr)
  const thisWeekRevenue = thisWeekSales.reduce((sum, r) => sum + Number(r.total_revenue), 0)
  const lastWeekSales = allSales.filter(
    (r) => r.sale_date >= twoWeeksAgoStr && r.sale_date < weekAgoStr
  )
  const lastWeekRevenue = lastWeekSales.reduce((sum, r) => sum + Number(r.total_revenue), 0)
  const weekOverWeekChange =
    lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0

  // Best/worst day of week by revenue
  const dayOfWeekMap = new Map<string, { total: number; count: number }>()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  for (const r of allSales) {
    const dayName = dayNames[new Date(r.sale_date).getDay()]
    const existing = dayOfWeekMap.get(dayName) || { total: 0, count: 0 }
    existing.total += Number(r.total_revenue)
    existing.count += 1
    dayOfWeekMap.set(dayName, existing)
  }
  const dayAvgs = Array.from(dayOfWeekMap.entries()).map(([day, data]) => ({
    day,
    avg: data.count > 0 ? data.total / data.count : 0,
  }))
  dayAvgs.sort((a, b) => b.avg - a.avg)
  const bestDay = dayAvgs[0] || { day: 'N/A', avg: 0 }
  const worstDay = dayAvgs[dayAvgs.length - 1] || { day: 'N/A', avg: 0 }

  // Top 10 items by revenue
  const itemMap = new Map<string, { revenue: number; quantity: number }>()
  for (const r of allSales) {
    const existing = itemMap.get(r.item_name) || { revenue: 0, quantity: 0 }
    existing.revenue += Number(r.total_revenue)
    existing.quantity += Number(r.quantity_sold)
    itemMap.set(r.item_name, existing)
  }
  const sortedItems = Array.from(itemMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  const topItems = sortedItems.slice(0, 10)
  const bottomItems = sortedItems.slice(-5).reverse()

  // Average transaction value
  const totalTransactions = allSales.length
  const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

  // ═══ INVENTORY ═══
  const updatedInventory = allInventory.map((item) => {
    let status: InventoryItem['status'] = 'ok'
    if (item.expiry_date && new Date(item.expiry_date) < now) {
      status = 'expired'
    } else if (item.quantity <= 0) {
      status = 'critical'
    } else if (item.quantity <= item.reorder_level) {
      status = 'low'
    }
    return { ...item, status }
  })

  const totalStockValue = updatedInventory.reduce(
    (sum, i) => sum + Number(i.quantity) * Number(i.cost_per_unit),
    0
  )
  const criticalItems = updatedInventory.filter((i) => i.status === 'critical')
  const lowItems = updatedInventory.filter((i) => i.status === 'low')
  const expiringItems = updatedInventory.filter((i) => {
    if (!i.expiry_date) return false
    const exp = new Date(i.expiry_date)
    return exp >= now && exp <= sevenDaysFromNow
  })

  // Estimated waste value from critical/expired items
  const wasteItems = updatedInventory.filter(
    (i) => i.status === 'expired' || i.status === 'critical'
  )
  const estimatedWasteValue = wasteItems.reduce(
    (sum, i) => sum + Number(i.quantity) * Number(i.cost_per_unit),
    0
  )

  // ═══ EXPENSES ═══
  const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Breakdown by category
  const expCatMap = new Map<string, number>()
  for (const e of allExpenses) {
    expCatMap.set(e.category, (expCatMap.get(e.category) || 0) + Number(e.amount))
  }
  const expenseBreakdown = Array.from(expCatMap.entries())
    .map(([cat, amount]) => ({ category: cat, amount }))
    .sort((a, b) => b.amount - a.amount)

  // Largest single expense
  const largestExpense = allExpenses.reduce(
    (max, e) => (Number(e.amount) > max.amount ? { desc: e.description, amount: Number(e.amount) } : max),
    { desc: 'None', amount: 0 }
  )

  // Labor costs
  const laborCost =
    expenseBreakdown.find((c) => c.category === 'Staff Salary')?.amount || 0
  const laborCostRatio = totalRevenue > 0 ? (laborCost / totalRevenue) * 100 : 0

  // Food cost ratio
  const ingredientCost =
    expenseBreakdown.find((c) => c.category === 'Ingredients')?.amount || 0
  const foodCostRatio = totalRevenue > 0 ? (ingredientCost / totalRevenue) * 100 : 0

  // Gross profit margin
  const grossProfitMargin =
    totalRevenue > 0 ? ((totalRevenue - ingredientCost) / totalRevenue) * 100 : 0

  // ═══ STAFF ═══
  const totalMonthlySalary = allStaff.reduce((sum, s) => sum + Number(s.salary), 0)
  const salaryAsPercentOfRevenue =
    totalRevenue > 0 ? (totalMonthlySalary / totalRevenue) * 100 : 0

  // ═══ FORMAT CONTEXT ═══
  const lines: string[] = []

  lines.push('=== BUSINESS PROFILE ===')
  lines.push(`Name: ${business?.name || 'Unknown'}`)
  lines.push(`Type: ${business?.type || 'Unknown'}`)
  lines.push(`Operating since: ${daysSinceRegistration} days`)
  lines.push(`Staff count: ${allStaff.length}`)
  lines.push(`Operating hours: ${business?.operating_hours || 'Not set'}`)
  lines.push(`Currency: ${business?.currency || 'MYR'}`)
  lines.push(`Menu categories: ${(business?.menu_categories || []).join(', ') || 'Not set'}`)
  lines.push('')

  lines.push('=== SALES PERFORMANCE (Last 30 days) ===')
  lines.push(`Total revenue: RM${totalRevenue.toFixed(2)}`)
  lines.push(`Daily average: RM${dailyAverage.toFixed(2)}`)
  lines.push(`Today so far: RM${todayRevenue.toFixed(2)}`)
  lines.push(`Yesterday: RM${yesterdayRevenue.toFixed(2)}`)
  lines.push(`Week-over-week change: ${weekOverWeekChange >= 0 ? '+' : ''}${weekOverWeekChange.toFixed(1)}%`)
  lines.push(`Best day: ${bestDay.day} (avg RM${bestDay.avg.toFixed(2)})`)
  lines.push(`Worst day: ${worstDay.day} (avg RM${worstDay.avg.toFixed(2)})`)
  lines.push(`Total transactions: ${totalTransactions}`)
  lines.push('')

  if (topItems.length > 0) {
    lines.push('Top 10 items by revenue:')
    topItems.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.name}: RM${item.revenue.toFixed(2)} (${item.quantity} sold)`)
    })
    lines.push('')
  }

  if (bottomItems.length > 0) {
    lines.push('Bottom 5 items (least sold):')
    bottomItems.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.name}: RM${item.revenue.toFixed(2)} (${item.quantity} sold)`)
    })
    lines.push('')
  }

  lines.push('=== INVENTORY STATUS ===')
  lines.push(
    `Total items: ${updatedInventory.length} | Total value: RM${totalStockValue.toFixed(2)}`
  )

  if (criticalItems.length > 0) {
    lines.push(
      `Critical (reorder now): ${criticalItems.map((i) => `${i.name} (${i.quantity}${i.unit})`).join(', ')}`
    )
  }
  if (lowItems.length > 0) {
    lines.push(
      `Low stock: ${lowItems.map((i) => `${i.name} (${i.quantity}${i.unit})`).join(', ')}`
    )
  }
  if (expiringItems.length > 0) {
    lines.push(
      `Expiring within 7 days: ${expiringItems.map((i) => `${i.name} (exp: ${i.expiry_date})`).join(', ')}`
    )
  }
  lines.push('')

  lines.push('All inventory:')
  for (const item of updatedInventory) {
    lines.push(
      `- ${item.name}: ${item.quantity} ${item.unit} @ RM${Number(item.cost_per_unit).toFixed(2)}/${item.unit} — ${item.status}${item.expiry_date ? ` (expires: ${item.expiry_date})` : ''}`
    )
  }
  lines.push('')

  lines.push('=== FINANCIAL SUMMARY (Last 30 days) ===')
  lines.push(`Total expenses: RM${totalExpenses.toFixed(2)}`)
  for (const cat of expenseBreakdown) {
    lines.push(`  - ${cat.category}: RM${cat.amount.toFixed(2)}`)
  }
  lines.push(`Largest single expense: ${largestExpense.desc} (RM${largestExpense.amount.toFixed(2)})`)
  lines.push(`Labor cost ratio: ${laborCostRatio.toFixed(1)}%`)
  lines.push(`Food cost ratio: ${foodCostRatio.toFixed(1)}%`)
  lines.push(`Gross profit margin: ${grossProfitMargin.toFixed(1)}%`)
  lines.push('')

  lines.push('=== STAFF ===')
  if (allStaff.length > 0) {
    for (const s of allStaff) {
      lines.push(`${s.name} (${s.role}): RM${Number(s.salary).toFixed(2)}/month`)
    }
    lines.push(`Total salary: RM${totalMonthlySalary.toFixed(2)}/month`)
    lines.push(`Salary as % of revenue: ${salaryAsPercentOfRevenue.toFixed(1)}%`)
  } else {
    lines.push('No staff records.')
  }
  lines.push('')

  lines.push('=== KEY METRICS ===')
  lines.push(`Average transaction value: RM${avgTransactionValue.toFixed(2)}`)
  lines.push(`Estimated weekly waste risk: RM${estimatedWasteValue.toFixed(2)}`)
  lines.push(`Net profit (revenue - expenses): RM${(totalRevenue - totalExpenses).toFixed(2)}`)

  return lines.join('\n')
}

// ─── Get Recent Chat History ─────────────────────────────
export async function getRecentChatHistory(
  businessId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  const supabase = await createClient()

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, business_id, role, content, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching chat history:', error)
    return []
  }

  // Reverse for chronological order (oldest first)
  return (messages || [])
    .reverse()
    .map((m) => ({
      id: m.id,
      business_id: m.business_id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      created_at: m.created_at,
    }))
}

// ─── Quick Context Stats (for suggestions) ───────────────
export async function getQuickContextStats(businessId: string) {
  const supabase = await createClient()
  const now = new Date()
  const weekAgoStr = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]
  const twoWeeksAgoStr = new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0]
  const sevenDaysStr = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]
  const monthAgoStr = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]

  const [
    { data: criticalItems },
    { data: expiringItems },
    { data: thisWeekSales },
    { data: lastWeekSales },
    { data: monthExpenses },
    { data: monthSales },
  ] = await Promise.all([
    supabase
      .from('inventory_items')
      .select('name, quantity, reorder_level')
      .eq('business_id', businessId)
      .or('quantity.lte.0,quantity.lte.reorder_level'),
    supabase
      .from('inventory_items')
      .select('name, expiry_date')
      .eq('business_id', businessId)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', sevenDaysStr)
      .gte('expiry_date', today),
    supabase
      .from('sales_records')
      .select('total_revenue')
      .eq('business_id', businessId)
      .gte('sale_date', weekAgoStr),
    supabase
      .from('sales_records')
      .select('total_revenue')
      .eq('business_id', businessId)
      .gte('sale_date', twoWeeksAgoStr)
      .lt('sale_date', weekAgoStr),
    supabase
      .from('expenses')
      .select('amount, category')
      .eq('business_id', businessId)
      .gte('expense_date', monthAgoStr),
    supabase
      .from('sales_records')
      .select('total_revenue')
      .eq('business_id', businessId)
      .gte('sale_date', monthAgoStr),
  ])

  const thisWeekRevenue = (thisWeekSales || []).reduce((s, r) => s + Number(r.total_revenue), 0)
  const lastWeekRevenue = (lastWeekSales || []).reduce((s, r) => s + Number(r.total_revenue), 0)
  const revenueDropped = lastWeekRevenue > 0 && thisWeekRevenue < lastWeekRevenue

  const monthRevenue = (monthSales || []).reduce((s, r) => s + Number(r.total_revenue), 0)
  const laborExpenses = (monthExpenses || [])
    .filter((e) => e.category === 'Staff Salary')
    .reduce((s, e) => s + Number(e.amount), 0)
  const laborRatio = monthRevenue > 0 ? (laborExpenses / monthRevenue) * 100 : 0

  const ingredientExpenses = (monthExpenses || [])
    .filter((e) => e.category === 'Ingredients')
    .reduce((s, e) => s + Number(e.amount), 0)
  const foodCostRatio = monthRevenue > 0 ? (ingredientExpenses / monthRevenue) * 100 : 0

  // Filter critical items properly
  const actualCritical = (criticalItems || []).filter(
    (i) => Number(i.quantity) <= 0 || Number(i.quantity) <= Number(i.reorder_level)
  )

  return {
    hasCriticalItems: actualCritical.length > 0,
    hasExpiringItems: (expiringItems || []).length > 0,
    revenueDropped,
    laborRatioHigh: laborRatio > 32,
    foodCostRatioHigh: foodCostRatio > 35,
  }
}
