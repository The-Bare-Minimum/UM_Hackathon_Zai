'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  businessId: string
  currency: string
}

interface FinanceHealth {
  profit: number
  margin: number
  dailyBurn: number
  trend: string
  trendPct: number
  netDaily: number
  anomalyCount: number
  dangerCount: number
}

export function FinanceHealthCard({ businessId, currency }: Props) {
  const [data, setData] = useState<FinanceHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchHealth() {
      try {
        const [burnRes, anomalyRes] = await Promise.all([
          fetch('/api/ai/burn-rate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_id: businessId }),
          }),
          fetch('/api/ai/anomaly-detection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_id: businessId }),
          }),
        ])

        const burnData = await burnRes.json()
        const anomalyData = await anomalyRes.json()

        const br = burnData.burnRateData
        if (br) {
          setData({
            profit: (br.dailyRevenue - br.dailyBurnRate) * 30,
            margin: br.dailyRevenue > 0 ? ((br.dailyRevenue - br.dailyBurnRate) / br.dailyRevenue) * 100 : 0,
            dailyBurn: br.dailyBurnRate,
            trend: br.trend,
            trendPct: br.trendPct,
            netDaily: br.dailyRevenue - br.dailyBurnRate,
            anomalyCount: anomalyData.anomalies?.length || 0,
            dangerCount: anomalyData.summary?.danger || 0,
          })
        }
      } catch {}
      setIsLoading(false)
    }

    fetchHealth()
  }, [businessId])

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading financial health...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const isHealthy = data.profit >= 0

  return (
    <Card className={`shadow-sm border-l-4 ${isHealthy ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
      <CardContent className="py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Left: Profit */}
          <div>
            <p className="text-xs text-muted-foreground font-medium">Financial Health</p>
            <p className={`text-xl font-bold mt-1 ${isHealthy ? 'text-emerald-600' : 'text-red-600'}`}>
              RM{Math.abs(data.profit).toFixed(0)}/mo
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {data.margin.toFixed(1)}% margin
              </span>
            </div>
          </div>

          {/* Middle: Burn Rate */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-medium">Burn Rate</p>
            <p className="text-lg font-bold mt-1">RM{data.dailyBurn.toFixed(0)}/day</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              {data.trend === 'improving' ? (
                <TrendingDown className="w-3 h-3 text-emerald-500" />
              ) : data.trend === 'worsening' ? (
                <TrendingUp className="w-3 h-3 text-red-500" />
              ) : null}
              <span className={`text-xs ${
                data.trend === 'improving' ? 'text-emerald-600' :
                data.trend === 'worsening' ? 'text-red-600' :
                'text-muted-foreground'
              }`}>
                Net: RM{data.netDaily.toFixed(0)}/day
              </span>
            </div>
          </div>

          {/* Right: Anomalies + Link */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="text-right">
              {data.anomalyCount > 0 ? (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className={`w-4 h-4 ${data.dangerCount > 0 ? 'text-red-600' : 'text-amber-600'}`} />
                  <span className={`text-sm font-semibold ${data.dangerCount > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {data.anomalyCount} alert{data.anomalyCount > 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-600">All clear</span>
                </div>
              )}
            </div>
            <Link href="/finance">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                Details
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
