'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { ProfitLossSummary, BurnRateData } from '@/types'
import React from 'react'

interface Props {
  pnl: ProfitLossSummary
  burnRate: BurnRateData
  burnNarrative: string
  currency: string
}

export const RevenueExpensesChart = React.memo(function RevenueExpensesChart({ pnl, burnRate, burnNarrative, currency }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-lg">Revenue vs Expenses</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={pnl.revenueByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => {
                      const d = new Date(val)
                      return `${d.getDate()}/${d.getMonth() + 1}`
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `RM${val}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                            <p className="font-medium mb-1.5">{label}</p>
                            <p className="text-emerald-600">Revenue: RM{Number(payload[0]?.value || 0).toFixed(2)}</p>
                            <p className="text-red-500">Expenses: RM{Number(payload[1]?.value || 0).toFixed(2)}</p>
                            <p className={`font-semibold mt-1 ${Number(payload[2]?.value || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              Profit: RM{Number(payload[2]?.value || 0).toFixed(2)}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="url(#revenueGrad)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="expenses" name="Expenses" fill="url(#expenseGrad)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 2"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Burn Rate Narrative */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Zara Burn Rate Analysis</h3>
            </div>
          </CardHeader>
          <CardContent>
            {burnNarrative ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {burnNarrative}
              </p>
            ) : (
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-full" />
                <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/5" />
                <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Burn Rate Stats Row */}
      <Card className="shadow-sm">
        <CardContent className="py-3">
          <div className="grid grid-cols-3 divide-x">
            <div className="text-center px-4">
              <p className="text-xs text-muted-foreground">Daily Burn</p>
              <p className="text-lg font-bold">RM{burnRate.dailyBurnRate.toFixed(2)}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-muted-foreground">Weekly Burn</p>
              <p className="text-lg font-bold">RM{burnRate.weeklyBurnRate.toFixed(2)}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-muted-foreground">Monthly Burn</p>
              <p className="text-lg font-bold">RM{burnRate.monthlyBurnRate.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
