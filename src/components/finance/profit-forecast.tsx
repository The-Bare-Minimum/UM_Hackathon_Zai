'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Sparkles, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { ProfitForecast, BusinessRules } from '@/types'

interface Props {
  forecast: ProfitForecast | null
  isLoading: boolean
  currency: string
  rules: BusinessRules | null
}

export function ProfitForecastSection({ forecast, isLoading, currency, rules }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="shadow-sm">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Generating 30-day profit forecast...</p>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!forecast) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Unable to generate forecast. Try again later.</p>
        </CardContent>
      </Card>
    )
  }

  const scenarioConfig = {
    optimistic: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', barColor: '#10b981' },
    likely: { icon: Minus, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', barColor: '#3b82f6' },
    pessimistic: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', barColor: '#ef4444' },
  }

  const chartData = forecast.scenarios.map(s => ({
    name: s.label.charAt(0).toUpperCase() + s.label.slice(1),
    Revenue: s.projectedRevenue,
    Expenses: s.projectedExpenses,
    Profit: s.projectedProfit,
  }))

  const targetRevenue = forecast.targetRevenue || rules?.monthly_revenue_target

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">30-Day Profit Forecast</h3>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="w-3 h-3" />
          Powered by Zara
        </Badge>
      </div>

      {/* 3 Scenario Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {forecast.scenarios.map(scenario => {
          const config = scenarioConfig[scenario.label]
          const Icon = config.icon
          const isLikely = scenario.label === 'likely'

          return (
            <Card
              key={scenario.label}
              className={`shadow-sm relative ${isLikely ? `border-2 ${config.border}` : ''}`}
            >
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full p-1.5 ${config.bg}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <span className="font-semibold capitalize">{scenario.label}</span>
                  </div>
                  {isLikely && (
                    <Badge className="bg-blue-600 text-white text-[10px]">
                      Most Likely
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className={`text-2xl font-bold ${config.color}`}>
                    RM{scenario.projectedProfit.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Revenue: RM{scenario.projectedRevenue.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expenses: RM{scenario.projectedExpenses.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Margin: {scenario.projectedMarginPct.toFixed(1)}%
                  </p>
                </div>

                <div className="border-t pt-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">If:</p>
                  <ul className="space-y-0.5">
                    {scenario.assumptions.slice(0, 3).map((a, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground leading-snug">• {a}</li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: config.barColor }}>Do:</p>
                  <ul className="space-y-0.5">
                    {scenario.actions.slice(0, 3).map((a, i) => (
                      <li key={i} className="text-[11px] leading-snug" style={{ color: config.barColor }}>• {a}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Target Progress */}
      {targetRevenue && (
        <Card className="shadow-sm">
          <CardContent className="py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Monthly Target: RM{targetRevenue.toLocaleString()}</span>
              <span className={`text-xs font-semibold ${forecast.onTrackForTarget ? 'text-emerald-600' : 'text-red-600'}`}>
                {forecast.onTrackForTarget ? '✓ On Track' : '✗ Off Track'}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${forecast.onTrackForTarget ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{
                  width: `${Math.min(((forecast.scenarios.find(s => s.label === 'likely')?.projectedRevenue || 0) / targetRevenue) * 100, 100)}%`
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      <Card className="shadow-sm border-l-4 border-l-primary">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold mb-1">Zara Recommendation</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{forecast.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <h3 className="font-semibold">Scenario Comparison</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `RM${v}`} />
                <Tooltip formatter={(v: any) => `RM${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 0 })}`} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={35} />
                <Bar dataKey="Expenses" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={35} />
                <Bar dataKey="Profit" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
