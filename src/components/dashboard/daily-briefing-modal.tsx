'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  X,
  WifiOff,
} from 'lucide-react'
import { useDailyBriefing } from '@/hooks/use-daily-briefing'
import { useDashboardContext } from '@/context/dashboard-context'
import { formatBriefingDate } from '@/lib/utils'

interface DailyBriefingModalProps {
  businessId: string
  businessName: string
}

export function DailyBriefingModal({ businessId, businessName }: DailyBriefingModalProps) {
  const {
    briefing,
    isLoading,
    isGenerating,
    error,
    hasSeenToday,
    markAsSeen,
    regenerate,
  } = useDailyBriefing(businessId)

  const {
    isBriefingOpen,
    setIsBriefingOpen,
    setHasSeenBriefingToday,
  } = useDashboardContext()

  const [isRegenerating, setIsRegenerating] = useState(false)

  // Sync hasSeenToday to context for topbar dot indicator
  useEffect(() => {
    setHasSeenBriefingToday(hasSeenToday)
  }, [hasSeenToday, setHasSeenBriefingToday])

  // Auto-show logic: open when briefing loads and user hasn't seen it today
  useEffect(() => {
    if (!hasSeenToday && !isLoading && (briefing || error)) {
      setIsBriefingOpen(true)
    }
  }, [hasSeenToday, isLoading, briefing, error, setIsBriefingOpen])

  const handleDismiss = () => {
    setIsBriefingOpen(false)
    markAsSeen()
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    await regenerate()
    setIsRegenerating(false)
  }

  const isLoadingState = isLoading || isGenerating || isRegenerating

  // Yesterday's date for data freshness display
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayFormatted = yesterday.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <Dialog open={isBriefingOpen} onOpenChange={(open) => {
      if (!open) handleDismiss()
      else setIsBriefingOpen(true)
    }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0 border-none shadow-2xl">
        {/* ── Custom Header ── */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Daily Briefing
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {formatBriefingDate()}
            </span>
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* ── Body ── */}
        <div className="px-5 pb-2 max-h-[65vh] overflow-y-auto">
          {isLoadingState ? (
            <LoadingState />
          ) : error ? (
            <ErrorState
              error={error}
              businessName={businessName}
              onRetry={handleRegenerate}
            />
          ) : briefing ? (
            <>
              {/* Greeting */}
              <p className="text-lg font-medium text-foreground leading-relaxed mb-5">
                {briefing.content.greeting}
              </p>

              {/* Insights */}
              <div className="mb-5">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-3">
                  Today&apos;s Highlights
                </h3>
                <div className="space-y-3">
                  {briefing.content.insights.map((insight, i) => (
                    <div key={i} className="flex gap-3 items-start group">
                      <div className="mt-[7px] shrink-0">
                        <div className="w-[6px] h-[6px] rounded-full bg-gradient-to-br from-amber-400 to-orange-500 group-hover:scale-125 transition-transform" />
                      </div>
                      <p className="text-sm text-foreground/90 leading-[1.7]">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Urgent Alert */}
              {briefing.content.urgent && (
                <div className="mb-5 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 p-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                      Needs Attention
                    </span>
                  </div>
                  <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                    {briefing.content.urgent}
                  </p>
                </div>
              )}

              {/* Closing */}
              {briefing.content.closing && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3" />
                  <p className="text-sm italic text-muted-foreground leading-relaxed mb-2">
                    {briefing.content.closing}
                  </p>
                </>
              )}
            </>
          ) : null}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-4 pt-2">
          {/* Data freshness + action buttons */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] text-muted-foreground/70">
              {briefing?.cached ? (
                <span>Generated earlier today</span>
              ) : briefing ? (
                <span>Just generated</span>
              ) : null}
              {briefing && (
                <span className="block mt-0.5">
                  Based on data up to {yesterdayFormatted}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleRegenerate}
                disabled={isLoadingState}
                title="Regenerate briefing"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleDismiss}
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Primary dismiss button */}
          <Button
            className="w-full h-10 font-medium gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm transition-all duration-200 hover:shadow-md"
            onClick={handleDismiss}
          >
            Start your day
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Loading Skeleton ────────────────────────────────────

function LoadingState() {
  return (
    <div className="space-y-5 py-2">
      {/* Greeting skeleton */}
      <Skeleton className="h-6 w-[65%]" />

      {/* Generating message */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-5 h-5">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 animate-ping opacity-20" />
          <Sparkles className="w-3 h-3 text-amber-500" />
        </div>
        <span className="text-sm text-muted-foreground">
          Analysing your business data
          <span className="inline-flex w-6">
            <span className="animate-pulse">...</span>
          </span>
        </span>
      </div>

      {/* Insight skeletons */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-[30%]" />
        <div className="space-y-3 mt-3">
          <div className="flex gap-3 items-start">
            <Skeleton className="w-[6px] h-[6px] rounded-full mt-1 shrink-0" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex gap-3 items-start">
            <Skeleton className="w-[6px] h-[6px] rounded-full mt-1 shrink-0" />
            <Skeleton className="h-4 w-[85%]" />
          </div>
          <div className="flex gap-3 items-start">
            <Skeleton className="w-[6px] h-[6px] rounded-full mt-1 shrink-0" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
        </div>
      </div>

      {/* Urgent skeleton */}
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  )
}

// ─── Error State ─────────────────────────────────────────

function ErrorState({
  error,
  businessName,
  onRetry,
}: {
  error: string
  businessName: string
  onRetry: () => void
}) {
  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <WifiOff className="w-5 h-5 text-destructive shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Unable to generate briefing right now
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {error}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Here&apos;s a summary of your key metrics instead:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-foreground/80">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
            <span>Check your dashboard for today&apos;s revenue figures</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
            <span>Review stock alerts for any critical items</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
            <span>Compare this week&apos;s expenses to last week</span>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={onRetry}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </Button>
    </div>
  )
}
