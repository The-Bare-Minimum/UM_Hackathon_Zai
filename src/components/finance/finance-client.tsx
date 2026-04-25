'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PlusCircle, LineChart } from 'lucide-react'
import { PnlSummaryCards } from './pnl-summary-cards'
import { RevenueExpensesChart } from './revenue-expenses-chart'
import { ExpenseBreakdown } from './expense-breakdown'
import { ProfitForecastSection } from './profit-forecast'
import { AnomalyAlerts } from './anomaly-alerts'
import { ExpenseTable } from './expense-table'
import { AddExpenseModal } from './add-expense-modal'
import { toast } from 'sonner'
import type {
  ProfitLossSummary,
  BurnRateData,
  FinanceAnomaly,
  RecurringExpenses,
  BusinessRules,
  ProfitForecast,
  Expense,
} from '@/types'

interface FinanceClientProps {
  businessId: string
  currency: string
  initialPnL: ProfitLossSummary
  initialBurnRate: BurnRateData
  initialAnomalies: FinanceAnomaly[]
  initialRecurring: RecurringExpenses
  rules: BusinessRules | null
}

export function FinanceClient({
  businessId,
  currency,
  initialPnL,
  initialBurnRate,
  initialAnomalies,
  initialRecurring,
  rules,
}: FinanceClientProps) {
  const [pnl, setPnl] = useState<ProfitLossSummary>(initialPnL)
  const [burnRate] = useState<BurnRateData>(initialBurnRate)
  const [anomalies, setAnomalies] = useState<FinanceAnomaly[]>(initialAnomalies)
  const [forecast, setForecast] = useState<ProfitForecast | null>(null)
  const [burnNarrative, setBurnNarrative] = useState<string>('')
  const [activePeriod, setActivePeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [isLoadingForecast, setIsLoadingForecast] = useState(true)
  const [isDetectingAnomalies, setIsDetectingAnomalies] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshKey, setRefreshKey] = useState(0)

  // On mount: trigger anomaly detection + forecast + burn rate narrative
  useEffect(() => {
    // Anomaly detection in background
    setIsDetectingAnomalies(true)
    fetch('/api/ai/anomaly-detection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.anomalies) setAnomalies(data.anomalies)
      })
      .catch(console.error)
      .finally(() => setIsDetectingAnomalies(false))

    // Forecast
    setIsLoadingForecast(true)
    fetch('/api/ai/finance-forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.forecast) setForecast(data.forecast)
      })
      .catch(console.error)
      .finally(() => setIsLoadingForecast(false))

    // Burn rate narrative
    fetch('/api/ai/burn-rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.narrative) setBurnNarrative(data.narrative)
      })
      .catch(console.error)
  }, [businessId])

  // Period change
  const handlePeriodChange = async (period: 'week' | 'month' | 'quarter') => {
    setActivePeriod(period)
    try {
      const res = await fetch(`/api/expenses?business_id=${businessId}&period=${period}`)
      if (!res.ok) return
      // Re-fetch PnL via a simple approach
      const pnlRes = await fetch(`/api/expenses?business_id=${businessId}&period=${period}`)
      if (pnlRes.ok) {
        // We'll update PnL locally by recalculating from the expense data
        // For simplicity, trigger a page-level state update
        setRefreshKey(k => k + 1)
      }
    } catch {}
  }

  const handleExpenseAdded = (expense: Expense) => {
    setRefreshKey(k => k + 1)
  }

  const handleDismissAnomaly = async (id: string) => {
    try {
      await fetch(`/api/anomalies/${id}/dismiss`, { method: 'POST' })
      setAnomalies(prev => prev.filter(a => a.id !== id))
      toast.success('Anomaly dismissed')
    } catch {}
  }

  const handleRescanAnomalies = async () => {
    setIsDetectingAnomalies(true)
    try {
      const res = await fetch('/api/ai/anomaly-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      })
      const data = await res.json()
      if (data.anomalies) setAnomalies(data.anomalies)
    } catch {}
    setIsDetectingAnomalies(false)
  }

  const dangerCount = anomalies.filter(a => a.severity === 'danger').length

  return (
    <div className="flex flex-col gap-6 pb-10" key={refreshKey}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <LineChart className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Financial Monitor</h2>
              <p className="text-muted-foreground text-sm">Real-time tracking of your business financial health</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Toggle */}
          <div className="flex items-center rounded-lg border bg-muted p-0.5">
            {(['week', 'month', 'quarter'] as const).map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activePeriod === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setIsAddExpenseOpen(true)} className="gap-1.5">
            <PlusCircle className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="anomalies" className="relative">
            Anomalies
            {dangerCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                {dangerCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* P&L Summary Cards */}
          <PnlSummaryCards pnl={pnl} burnRate={burnRate} currency={currency} rules={rules} />

          {/* Revenue vs Expenses Chart */}
          <RevenueExpensesChart
            pnl={pnl}
            burnRate={burnRate}
            burnNarrative={burnNarrative}
            currency={currency}
          />

          {/* Expense Breakdown */}
          <ExpenseBreakdown
            pnl={pnl}
            recurring={initialRecurring}
            currency={currency}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-0">
          <ExpenseTable
            businessId={businessId}
            currency={currency}
            onAddExpense={() => setIsAddExpenseOpen(true)}
          />
        </TabsContent>

        <TabsContent value="forecast" className="mt-0">
          <ProfitForecastSection
            forecast={forecast}
            isLoading={isLoadingForecast}
            currency={currency}
            rules={rules}
          />
        </TabsContent>

        <TabsContent value="anomalies" className="mt-0">
          <AnomalyAlerts
            anomalies={anomalies}
            isDetecting={isDetectingAnomalies}
            onDismiss={handleDismissAnomaly}
            onRescan={handleRescanAnomalies}
          />
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      <AddExpenseModal
        businessId={businessId}
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        onSuccess={handleExpenseAdded}
      />
    </div>
  )
}
