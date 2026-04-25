'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, RefreshCw, CheckCircle2, Loader2, X } from 'lucide-react'
import type { FinanceAnomaly } from '@/types'
import { EmptyState } from '@/components/shared/empty-state'

interface Props {
  anomalies: FinanceAnomaly[]
  isDetecting: boolean
  onDismiss: (id: string) => void
  onRescan: () => void
}

export function AnomalyAlerts({ anomalies, isDetecting, onDismiss, onRescan }: Props) {
  const severityConfig = {
    danger: { icon: AlertTriangle, border: 'border-l-red-500', bg: 'bg-red-50', iconColor: 'text-red-600' },
    warning: { icon: AlertTriangle, border: 'border-l-amber-500', bg: 'bg-amber-50', iconColor: 'text-amber-600' },
    info: { icon: Info, border: 'border-l-blue-500', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
  }

  // Group by severity
  const dangerAnomalies = anomalies.filter(a => a.severity === 'danger')
  const warningAnomalies = anomalies.filter(a => a.severity === 'warning')
  const infoAnomalies = anomalies.filter(a => a.severity === 'info')
  const sorted = [...dangerAnomalies, ...warningAnomalies, ...infoAnomalies]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Financial Anomalies</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {anomalies.length > 0 ? `${anomalies.length} active` : 'No issues'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRescan}
            disabled={isDetecting}
            className="gap-1.5"
          >
            {isDetecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Scan
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isDetecting && anomalies.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Scanning transactions for anomalies...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isDetecting && anomalies.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 className="w-12 h-12 text-emerald-500" />}
          title="No anomalies detected"
          description="Your finances look consistent with recent patterns."
          className="border rounded-xl bg-card py-20"
        />
      )}

      {/* Anomaly cards */}
      {sorted.map(anomaly => {
        const config = severityConfig[anomaly.severity]
        const Icon = config.icon

        return (
          <Card
            key={anomaly.id}
            className={`shadow-sm border-l-4 ${config.border} transition-all duration-300`}
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-1.5 ${config.bg} shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold">{anomaly.title}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => onDismiss(anomaly.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {anomaly.description}
                  </p>
                  {anomaly.current_value != null && anomaly.baseline_value != null && (
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-muted-foreground">
                        This week: <strong className="text-foreground">RM{anomaly.current_value.toFixed(2)}</strong>
                      </span>
                      <span className="text-muted-foreground">
                        vs avg: <strong className="text-foreground">RM{anomaly.baseline_value.toFixed(2)}</strong>
                      </span>
                      {anomaly.deviation_pct != null && (
                        <span className={`font-semibold ${
                          anomaly.deviation_pct > 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {anomaly.deviation_pct > 0 ? '+' : ''}{anomaly.deviation_pct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Detected {new Date(anomaly.detected_at).toLocaleDateString('en-MY', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
