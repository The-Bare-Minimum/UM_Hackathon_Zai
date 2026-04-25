'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface CostAlert {
  type: 'warning' | 'danger' | 'success'
  message: string
  action: string
}

interface CostAlertPanelProps {
  businessId: string
}

export function CostAlertPanel({ businessId }: CostAlertPanelProps) {
  const [alerts, setAlerts] = useState<CostAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(false)
      const res = await fetch('/api/ai/cost-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      })

      if (!res.ok) throw new Error('Failed to fetch alerts')

      const data = await res.json()
      if (data.alerts && Array.isArray(data.alerts)) {
        setAlerts(data.alerts)
      } else {
        throw new Error('Invalid format')
      }
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [businessId])

  const getIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <TrendingDown className="w-5 h-5 text-destructive" />
      case 'success':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
    }
  }

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'border-l-destructive'
      case 'success':
        return 'border-l-emerald-500'
      default:
        return 'border-l-amber-500'
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Zara Cost & Waste Alerts</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchAlerts}
          disabled={loading}
          className="h-8 w-8 text-muted-foreground"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 border-l-4 border-l-muted pl-4 py-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))
        ) : error ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>Unable to load cost alerts.</p>
            <Button variant="link" size="sm" onClick={fetchAlerts}>
              Try again
            </Button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No active alerts at this time.
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex gap-3 items-start border-l-4 ${getBorderColor(
                alert.type
              )} pl-3 py-1.5`}
            >
              <div className="mt-0.5">{getIcon(alert.type)}</div>
              <div>
                <p className="text-sm font-medium leading-snug">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Action: {alert.action}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
