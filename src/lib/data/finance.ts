import { createClient } from '@/lib/supabase/server'
import type {
  Expense,
  ProfitLossSummary,
  BurnRateData,
  FinanceAnomaly,
  RecurringExpenses,
} from '@/types'

// ─── Helper: get date string N days ago ─────────────────
function daysAgoStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// ─── Profit & Loss Summary ─────────────────────────────
export async function getProfitLoss(
  business_id: string,
  period: 'week' | 'month' | 'quarter' = 'month'
): Promise<ProfitLossSummary> {
  const supabase = await createClient()

  const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90
  const startDate = daysAgoStr(periodDays)

  // Fetch sales
  const { data: sales } = await supabase
    .from('sales_records')
    .select('*')
    .eq('business_id', business_id)
    .gte('sale_date', startDate)
    .order('sale_date', { ascending: true })

  // Fetch expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('business_id', business_id)
    .gte('expense_date', startDate)
    .order('expense_date', { ascending: true })

  // Fetch staff salaries
  const { data: staff } = await supabase
    .from('staff_members')
    .select('salary')
    .eq('business_id', business_id)

  const allSales = sales || []
  const allExpenses = (expenses || []) as Expense[]
  const allStaff = staff || []

  // Revenue
  const totalRevenue = allSales.reduce(
    (s, r) => s + Number(r.total_revenue), 0
  )
  const totalTransactions = allSales.length

  // Staff salary: monthly total, prorated for period
  const monthlyStaffCost = allStaff.reduce(
    (s, st) => s + Number(st.salary), 0
  )
  const salaryTotal = (monthlyStaffCost / 30) * periodDays

  // Expense totals
  const expenseTotal = allExpenses.reduce(
    (s, e) => s + Number(e.amount), 0
  )
  const totalExpenses = expenseTotal + salaryTotal

  // Profit
  const grossProfit = totalRevenue - totalExpenses
  const profitMarginPct = totalRevenue > 0
    ? (grossProfit / totalRevenue) * 100
    : 0

  // Revenue by day
  const dayMap = new Map<string, { revenue: number; expenses: number }>()
  for (let i = periodDays - 1; i >= 0; i--) {
    const dateStr = daysAgoStr(i)
    dayMap.set(dateStr, { revenue: 0, expenses: 0 })
  }
  for (const s of allSales) {
    const existing = dayMap.get(s.sale_date)
    if (existing) existing.revenue += Number(s.total_revenue)
  }
  for (const e of allExpenses) {
    const existing = dayMap.get(e.expense_date)
    if (existing) existing.expenses += Number(e.amount)
  }
  const revenueByDay = Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue * 100) / 100,
    expenses: Math.round(data.expenses * 100) / 100,
    profit: Math.round((data.revenue - data.expenses) * 100) / 100,
  }))

  // Expenses by category
  const catMap = new Map<string, { amount: number; isRecurring: boolean }>()
  for (const e of allExpenses) {
    const existing = catMap.get(e.category) || { amount: 0, isRecurring: false }
    existing.amount += Number(e.amount)
    if (e.is_recurring) existing.isRecurring = true
    catMap.set(e.category, existing)
  }
  // Add salary as a category
  if (salaryTotal > 0) {
    const existing = catMap.get('Staff Salary') || { amount: 0, isRecurring: true }
    existing.amount += salaryTotal
    existing.isRecurring = true
    catMap.set('Staff Salary', existing)
  }

  const expensesByCategory = Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      amount: Math.round(data.amount * 100) / 100,
      pct: totalExpenses > 0
        ? Math.round((data.amount / totalExpenses) * 10000) / 100
        : 0,
      isRecurring: data.isRecurring,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Split recurring / one-time
  const recurringExpenses = allExpenses.filter(e => e.is_recurring)
  const oneTimeExpenses = allExpenses.filter(e => !e.is_recurring)

  // Category totals
  const ingredientTotal = allExpenses
    .filter(e => e.category === 'Ingredients')
    .reduce((s, e) => s + Number(e.amount), 0)
  const otherExpensesTotal = totalExpenses - salaryTotal - ingredientTotal

  return {
    period,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    profitMarginPct: Math.round(profitMarginPct * 100) / 100,
    totalTransactions,
    revenueByDay,
    expensesByCategory,
    recurringExpenses,
    oneTimeExpenses,
    salaryTotal: Math.round(salaryTotal * 100) / 100,
    ingredientTotal: Math.round(ingredientTotal * 100) / 100,
    otherExpensesTotal: Math.round(otherExpensesTotal * 100) / 100,
  }
}

// ─── Burn Rate ──────────────────────────────────────────
export async function getBurnRate(
  business_id: string
): Promise<BurnRateData> {
  const supabase = await createClient()
  const thirtyDaysAgo = daysAgoStr(30)

  // Fetch last 30 days expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, expense_date')
    .eq('business_id', business_id)
    .gte('expense_date', thirtyDaysAgo)

  // Fetch last 30 days revenue
  const { data: sales } = await supabase
    .from('sales_records')
    .select('total_revenue, sale_date')
    .eq('business_id', business_id)
    .gte('sale_date', thirtyDaysAgo)

  const allExpenses = expenses || []
  const allSales = sales || []

  // Build daily map
  const dayMap = new Map<string, { expenses: number; revenue: number }>()
  for (let i = 29; i >= 0; i--) {
    dayMap.set(daysAgoStr(i), { expenses: 0, revenue: 0 })
  }
  for (const e of allExpenses) {
    const existing = dayMap.get(e.expense_date)
    if (existing) existing.expenses += Number(e.amount)
  }
  for (const s of allSales) {
    const existing = dayMap.get(s.sale_date)
    if (existing) existing.revenue += Number(s.total_revenue)
  }

  const last30Days = Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    expenses: Math.round(data.expenses * 100) / 100,
    revenue: Math.round(data.revenue * 100) / 100,
    net: Math.round((data.revenue - data.expenses) * 100) / 100,
  }))

  const totalExpenses30 = allExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalRevenue30 = allSales.reduce((s, r) => s + Number(r.total_revenue), 0)

  const dailyBurnRate = totalExpenses30 / 30
  const dailyRevenue = totalRevenue30 / 30
  const netDailyBurn = dailyBurnRate - dailyRevenue

  // Trend: compare last 7 days vs previous 7 days
  const last7 = last30Days.slice(-7)
  const prev7 = last30Days.slice(-14, -7)

  const last7Burn = last7.reduce((s, d) => s + d.expenses, 0) / 7
  const prev7Burn = prev7.reduce((s, d) => s + d.expenses, 0) / 7

  let trend: 'improving' | 'stable' | 'worsening' = 'stable'
  let trendPct = 0
  if (prev7Burn > 0) {
    trendPct = ((last7Burn - prev7Burn) / prev7Burn) * 100
    if (last7Burn < prev7Burn * 0.95) trend = 'improving'
    else if (last7Burn > prev7Burn * 1.05) trend = 'worsening'
  }

  return {
    dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
    weeklyBurnRate: Math.round(dailyBurnRate * 7 * 100) / 100,
    monthlyBurnRate: Math.round(dailyBurnRate * 30 * 100) / 100,
    dailyRevenue: Math.round(dailyRevenue * 100) / 100,
    netDailyBurn: Math.round(netDailyBurn * 100) / 100,
    runwayDays: null, // No cash balance tracked
    isProfilePositive: dailyRevenue > dailyBurnRate,
    trend,
    trendPct: Math.round(trendPct * 100) / 100,
    last30Days,
  }
}

// ─── Expenses by Month ─────────────────────────────────
export async function getExpensesByMonth(
  business_id: string,
  months: number = 3
): Promise<Array<{
  month: string
  total: number
  byCategory: Record<string, number>
}>> {
  const supabase = await createClient()
  const startDate = daysAgoStr(months * 30)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category, expense_date')
    .eq('business_id', business_id)
    .gte('expense_date', startDate)

  const monthMap = new Map<string, { total: number; byCategory: Record<string, number> }>()

  for (const e of expenses || []) {
    const month = e.expense_date.substring(0, 7) // YYYY-MM
    const existing = monthMap.get(month) || { total: 0, byCategory: {} }
    existing.total += Number(e.amount)
    existing.byCategory[e.category] = (existing.byCategory[e.category] || 0) + Number(e.amount)
    monthMap.set(month, existing)
  }

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

// ─── Recurring Expenses ────────────────────────────────
export async function getRecurringExpenses(
  business_id: string
): Promise<RecurringExpenses> {
  const supabase = await createClient()

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('business_id', business_id)
    .eq('is_recurring', true)
    .order('amount', { ascending: false })

  const allRecurring = (expenses || []) as Expense[]

  const monthly = allRecurring.filter(e => e.recurrence_period === 'monthly')
  const weekly = allRecurring.filter(e => e.recurrence_period === 'weekly')
  const yearly = allRecurring.filter(e => e.recurrence_period === 'yearly')

  const totalMonthlyCommitment =
    monthly.reduce((s, e) => s + Number(e.amount), 0) +
    weekly.reduce((s, e) => s + Number(e.amount) * 4.33, 0) +
    yearly.reduce((s, e) => s + Number(e.amount) / 12, 0)

  return {
    monthly,
    weekly,
    yearly,
    totalMonthlyCommitment: Math.round(totalMonthlyCommitment * 100) / 100,
  }
}

// ─── Anomalies ─────────────────────────────────────────
export async function getAnomalies(
  business_id: string,
  includeDismissed: boolean = false
): Promise<FinanceAnomaly[]> {
  const supabase = await createClient()

  let query = supabase
    .from('finance_anomalies')
    .select('*')
    .eq('business_id', business_id)
    .order('detected_at', { ascending: false })

  if (!includeDismissed) {
    query = query.eq('is_dismissed', false)
  }

  const { data } = await query
  return (data || []) as FinanceAnomaly[]
}

// ─── Build Finance Context for AI ──────────────────────
export async function buildFinanceContext(
  business_id: string
): Promise<string> {
  const [pnl, burnRate, anomalies] = await Promise.all([
    getProfitLoss(business_id, 'month'),
    getBurnRate(business_id),
    getAnomalies(business_id),
  ])

  const recurring = await getRecurringExpenses(business_id)

  const expenseBreakdown = pnl.expensesByCategory
    .map(c => `- ${c.category}: RM${c.amount.toFixed(2)} (${c.pct.toFixed(1)}%)`)
    .join('\n')

  const anomalyList = anomalies.length > 0
    ? anomalies.map(a => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.description}`).join('\n')
    : 'None'

  return `=== FINANCIAL SUMMARY ===
Period: Last 30 days

P&L:
- Revenue: RM${pnl.totalRevenue.toFixed(2)}
- Total expenses: RM${pnl.totalExpenses.toFixed(2)}
- Gross profit: RM${pnl.grossProfit.toFixed(2)}
- Profit margin: ${pnl.profitMarginPct.toFixed(1)}%

Burn Rate:
- Daily burn rate: RM${burnRate.dailyBurnRate.toFixed(2)}
- Daily revenue: RM${burnRate.dailyRevenue.toFixed(2)}
- Net daily position: RM${(burnRate.dailyRevenue - burnRate.dailyBurnRate).toFixed(2)}
- Cash position: ${burnRate.isProfilePositive ? 'positive' : 'negative'}
- Trend: ${burnRate.trend} (${burnRate.trendPct > 0 ? '+' : ''}${burnRate.trendPct.toFixed(1)}% vs last week)

Expense breakdown:
${expenseBreakdown}

Recurring monthly commitments: RM${recurring.totalMonthlyCommitment.toFixed(2)}

Active anomalies: ${anomalies.length}
${anomalyList}`.trim()
}
