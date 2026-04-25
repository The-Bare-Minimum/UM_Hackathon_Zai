'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { ProfitLossSummary, RecurringExpenses } from '@/types'

interface Props {
  pnl: ProfitLossSummary
  recurring: RecurringExpenses
  currency: string
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#06b6d4', '#d946ef', '#78716c']

export function ExpenseBreakdown({ pnl, recurring, currency }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Donut Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-lg">Expense Breakdown</h3>
          </CardHeader>
          <CardContent>
            {pnl.expensesByCategory.length > 0 ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pnl.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {pnl.expensesByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                              <p className="font-medium">{data.category}</p>
                              <p className="text-muted-foreground">RM{data.amount.toFixed(2)} ({data.pct.toFixed(1)}%)</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                No expense data to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category List */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-lg">By Category</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pnl.expensesByCategory.map((cat, idx) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{cat.category}</span>
                      <span className="text-sm font-bold ml-2 shrink-0">
                        RM{cat.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${cat.pct}%`,
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-10 text-right">{cat.pct.toFixed(1)}%</span>
                      {cat.isRecurring && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">Recurring</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recurring Expenses Summary */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold">Monthly Commitments</h3>
            <Badge variant="secondary" className="text-xs">
              RM{recurring.totalMonthlyCommitment.toFixed(2)}/mo
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recurring.monthly.length + recurring.weekly.length + recurring.yearly.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...recurring.monthly, ...recurring.weekly, ...recurring.yearly].map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{exp.subscription_name || exp.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.recurrence_period} · {exp.vendor || 'No vendor'}
                    </p>
                  </div>
                  <span className="text-sm font-bold ml-2 shrink-0">
                    RM{Number(exp.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recurring expenses recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
