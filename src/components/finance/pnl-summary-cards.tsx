'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Receipt, Flame, PiggyBank } from 'lucide-react'
import type { ProfitLossSummary, BurnRateData, BusinessRules } from '@/types'

interface PnlSummaryCardsProps {
  pnl: ProfitLossSummary
  burnRate: BurnRateData
  currency: string
  rules: BusinessRules | null
}

export function PnlSummaryCards({ pnl, burnRate, currency, rules }: PnlSummaryCardsProps) {
  const targetMargin = rules?.target_profit_margin_pct || 20
  const marginStatus = pnl.profitMarginPct >= targetMargin
    ? 'on-target'
    : pnl.profitMarginPct >= targetMargin - 5
      ? 'close'
      : 'below'

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue */}
      <Card className="shadow-sm border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
          <div className="rounded-full bg-emerald-100 p-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">RM{pnl.totalRevenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {pnl.totalTransactions} transactions
          </p>
        </CardContent>
      </Card>

      {/* Total Expenses */}
      <Card className={`shadow-sm border-l-4 ${pnl.totalExpenses > pnl.totalRevenue ? 'border-l-red-500' : 'border-l-orange-400'}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <span className="text-sm font-medium text-muted-foreground">Total Expenses</span>
          <div className="rounded-full bg-orange-100 p-2">
            <Receipt className="w-4 h-4 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${pnl.totalExpenses > pnl.totalRevenue ? 'text-red-600' : ''}`}>
            RM{pnl.totalExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            RM{pnl.salaryTotal.toFixed(0)} staff salaries included
          </p>
        </CardContent>
      </Card>

      {/* Gross Profit */}
      <Card className={`shadow-sm border-l-4 ${pnl.grossProfit >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <span className="text-sm font-medium text-muted-foreground">Gross Profit</span>
          <div className={`rounded-full p-2 ${pnl.grossProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <PiggyBank className={`w-4 h-4 ${pnl.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${pnl.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            RM{Math.abs(pnl.grossProfit).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              marginStatus === 'on-target' ? 'bg-emerald-100 text-emerald-700' :
              marginStatus === 'close' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {pnl.profitMarginPct.toFixed(1)}% margin
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Burn Rate */}
      <Card className="shadow-sm border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <span className="text-sm font-medium text-muted-foreground">Burn Rate</span>
          <div className="rounded-full bg-purple-100 p-2">
            <Flame className="w-4 h-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">RM{burnRate.dailyBurnRate.toFixed(2)}/day</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-xs font-medium ${burnRate.isProfilePositive ? 'text-emerald-600' : 'text-red-600'}`}>
              Net: RM{Math.abs(burnRate.netDailyBurn).toFixed(2)}/day
            </span>
            {burnRate.trend === 'improving' ? (
              <TrendingDown className="w-3 h-3 text-emerald-500" />
            ) : burnRate.trend === 'worsening' ? (
              <TrendingUp className="w-3 h-3 text-red-500" />
            ) : null}
            <span className={`text-[10px] ${
              burnRate.trend === 'improving' ? 'text-emerald-500' :
              burnRate.trend === 'worsening' ? 'text-red-500' :
              'text-muted-foreground'
            }`}>
              {burnRate.trendPct > 0 ? '+' : ''}{burnRate.trendPct.toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
