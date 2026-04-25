'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Activity, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { CostAlertPanel } from './cost-alert-panel'
import { AiInsightCard } from './ai-insight-card'
import { FinanceHealthCard } from './finance-health-card'
import { useDashboardContext } from '@/context/dashboard-context'
import { Upload, BellRing, FileText } from 'lucide-react'
import type { SalesSummary, InventorySummaryData, ExpenseSummaryData } from '@/lib/data/dashboard'
import { useRouter } from 'next/navigation'
import type { RuleViolation } from '@/types'

interface DashboardClientProps {
  business: { id: string; name: string }
  hasData: boolean
  salesSummary: SalesSummary
  inventorySummary: InventorySummaryData
  expenseSummary: ExpenseSummaryData
}

export function DashboardClient({
  business,
  hasData,
  salesSummary,
  inventorySummary,
  expenseSummary,
}: DashboardClientProps) {
  const router = useRouter()
  const { 
    refreshKey,
    setIsCsvModalOpen,
    setIsBriefingOpen,
    hasSeenBriefingToday,
  } = useDashboardContext()
  const [isSeeding, setIsSeeding] = useState(false)
  const [showDemoBanner, setShowDemoBanner] = useState(!hasData)
  const [violations, setViolations] = useState<RuleViolation[]>([])

  // Fetch rule violations
  useEffect(() => {
    async function fetchViolations() {
      try {
        const res = await fetch(`/api/rules/violations?business_id=${business.id}`)
        if (res.ok) {
          const data = await res.json()
          setViolations(data.violations || [])
        }
      } catch {}
    }
    if (hasData) fetchViolations()
  }, [business.id, hasData])

  const handleLoadDemoData = async () => {
    try {
      setIsSeeding(true)
      const res = await fetch('/api/seed/demo', { method: 'POST' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to seed demo data')
      }
      toast.success('Demo data loaded successfully!')
      setShowDemoBanner(false)
      // Hard refresh to reload server data
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load demo data')
    } finally {
      setIsSeeding(false)
    }
  }

  // Calculate trends
  const revenueTrend = salesSummary.lastWeekRevenue > 0
    ? ((salesSummary.weekRevenue - salesSummary.lastWeekRevenue) / salesSummary.lastWeekRevenue) * 100
    : 0

  const todayTrend = salesSummary.yesterdayRevenue > 0
    ? ((salesSummary.todayRevenue - salesSummary.yesterdayRevenue) / salesSummary.yesterdayRevenue) * 100
    : 0

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const currentDate = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col min-h-screen pb-10" key={refreshKey}>
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {greeting()}, {business.name}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">{currentDate}</p>
          </div>
          
          {/* Action buttons moved from Topbar */}
          <div className="flex items-center gap-3">
            {/* Today's Briefing button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 relative"
              onClick={() => setIsBriefingOpen(true)}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Today&apos;s Briefing</span>
              {!hasSeenBriefingToday && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-br from-amber-400 to-orange-500" />
                </span>
              )}
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1.5"
              onClick={() => setIsCsvModalOpen(true)}
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import CSV</span>
            </Button>
            
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <BellRing className="w-4 h-4 text-muted-foreground" />
              {inventorySummary.criticalItems.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
              )}
            </Button>
          </div>
        </div>

        {showDemoBanner && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">No sales data yet</h3>
                <p className="text-amber-700 text-sm">Load our demo dataset to see the dashboard in action, or import your own CSV data.</p>
              </div>
            </div>
            <Button onClick={handleLoadDemoData} disabled={isSeeding} className="shrink-0">
              {isSeeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Load Demo Data
            </Button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-sm font-medium text-muted-foreground">Today's Revenue</span>
              <div className="rounded-full bg-emerald-100 p-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM{salesSummary.todayRevenue.toFixed(2)}</div>
              <div className="flex items-center text-xs mt-1">
                {todayTrend >= 0 ? (
                  <span className="text-emerald-500 flex items-center font-medium">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{todayTrend.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-destructive flex items-center font-medium">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {todayTrend.toFixed(1)}%
                  </span>
                )}
                <span className="text-muted-foreground ml-2">{salesSummary.todayTransactions} transactions</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-sm font-medium text-muted-foreground">This Week's Revenue</span>
              <div className="rounded-full bg-orange-100 p-2">
                <Activity className="w-4 h-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM{salesSummary.weekRevenue.toFixed(2)}</div>
              <div className="flex items-center text-xs mt-1">
                {revenueTrend >= 0 ? (
                  <span className="text-emerald-500 flex items-center font-medium">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{revenueTrend.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-destructive flex items-center font-medium">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {revenueTrend.toFixed(1)}%
                  </span>
                )}
                <span className="text-muted-foreground ml-2">vs last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-sm font-medium text-muted-foreground">Inventory Alerts</span>
              <div className="rounded-full bg-red-100 p-2">
                <Package className="w-4 h-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${inventorySummary.criticalItems.length > 0 ? 'text-destructive' : ''}`}>
                {inventorySummary.criticalItems.length + inventorySummary.lowStockItems.length} items
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className={inventorySummary.criticalItems.length > 0 ? 'text-destructive font-medium' : ''}>
                  {inventorySummary.criticalItems.length} critical
                </span>
                {', '}
                <span className={inventorySummary.lowStockItems.length > 0 ? 'text-amber-600 font-medium' : ''}>
                  {inventorySummary.lowStockItems.length} low stock
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-sm font-medium text-muted-foreground">This Week's Expenses</span>
              <div className="rounded-full bg-blue-100 p-2">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM{expenseSummary.weekExpenses.toFixed(2)}</div>
              <div className="text-xs mt-1 font-medium">
                <span className={expenseSummary.laborCostRatio > 35 ? 'text-destructive' : expenseSummary.laborCostRatio < 28 ? 'text-emerald-500' : 'text-amber-600'}>
                  Labor: {expenseSummary.laborCostRatio.toFixed(1)}% of revenue
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rule Violations Banner */}
        {violations.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 text-sm">
                  {violations.length} business rule violation{violations.length > 1 ? 's' : ''} detected
                </h3>
                <ul className="mt-1.5 space-y-1">
                  {violations.map((v, i) => (
                    <li key={i} className="text-xs text-amber-700">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${v.severity === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <span className="font-medium">{v.rule}:</span> {v.current} (limit: {v.limit})
                    </li>
                  ))}
                </ul>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-amber-700 hover:text-amber-900 mt-1.5 text-xs"
                  onClick={() => router.push('/customization')}
                >
                  View Customization →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}

        {/* Finance Health */}
        {hasData && <FinanceHealthCard businessId={business.id} currency="MYR" />}

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart (spans 2 columns) */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-semibold text-lg">Revenue — Last 14 Days</h3>
                <div className="w-full sm:w-2/3">
                  {hasData && <AiInsightCard section="revenue" businessId={business.id} title="Revenue Insight" />}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesSummary.revenueByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => {
                        const d = new Date(val)
                        return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`
                      }}
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      className="text-xs text-muted-foreground"
                      tickFormatter={(val) => `RM${val}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg shadow-sm p-3">
                              <p className="text-sm font-medium mb-1">{label}</p>
                              <p className="text-sm font-bold text-primary">
                                RM{Number(payload[0].value).toFixed(2)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="revenue" fill="url(#purpleGradient)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          <Card className="shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Top Selling Items</h3>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => router.push('/inventory')}>View all</Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {salesSummary.revenueByItem.length > 0 ? (
                <div className="space-y-4 mt-2">
                  {salesSummary.revenueByItem.slice(0, 6).map((item, idx) => {
                    const maxRev = salesSummary.revenueByItem[0].revenue
                    const widthPercent = Math.max((item.revenue / maxRev) * 100, 5)
                    
                    return (
                      <div key={item.name} className="relative">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate pr-4">{idx + 1}. {item.name}</span>
                          <span className="font-bold shrink-0">RM{item.revenue.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" 
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 text-right">
                          {item.quantity} sold
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-10">
                  No sales data to display
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lower Two Columns */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Expenses */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader>
              <h3 className="font-semibold text-lg">Expense Breakdown</h3>
              {hasData && (
                <div className="mt-2">
                  <AiInsightCard section="expenses" businessId={business.id} title="Expense Insight" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {expenseSummary.expensesByCategory.length > 0 ? (
                <div className="h-[220px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseSummary.expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {expenseSummary.expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => {
                          const numValue = typeof value === 'number' ? value : 0
                          return [`RM${numValue.toFixed(2)}`, 'Amount']
                        }}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  No expense data to display
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Alerts */}
          <Card className="lg:col-span-2 shadow-sm flex flex-col">
            <CardHeader>
              <h3 className="font-semibold text-lg">Stock Alerts</h3>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {hasData && (
                <div className="mb-4">
                  <AiInsightCard section="inventory" businessId={business.id} title="Inventory Insight" />
                </div>
              )}
              
              <div className="space-y-3 flex-1 overflow-auto pr-2">
                {inventorySummary.criticalItems.length === 0 && inventorySummary.lowStockItems.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    All stock levels are looking good!
                  </div>
                ) : (
                  <>
                    {inventorySummary.criticalItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-destructive/10 border border-destructive/20">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} remaining</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/20 px-2 py-0.5 rounded">
                          Critical
                        </span>
                      </div>
                    ))}
                    {inventorySummary.lowStockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} remaining</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-500/20 px-2 py-0.5 rounded">
                          Low
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost & Waste Alerts Panel */}
        {hasData && <CostAlertPanel businessId={business.id} />}

        {/* Overall Business Health Insight */}
        {hasData && (
          <div className="mt-8">
            <AiInsightCard section="overview" businessId={business.id} title="Overall Business Health" />
          </div>
        )}
      </div>
    </div>
  )
}
