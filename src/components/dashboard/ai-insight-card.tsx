'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface AiInsightCardProps {
  section: 'revenue' | 'inventory' | 'expenses' | 'overview'
  businessId: string
  title?: string
}

export function AiInsightCard({ section, businessId, title }: AiInsightCardProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchInsight = async () => {
    try {
      setLoading(true)
      setError(false)
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, section }),
      })

      if (!res.ok) throw new Error('Failed to fetch insight')

      const data = await res.json()
      setInsight(data.insight)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsight()
  }, [businessId, section])

  const accentColor = section === 'expenses' 
    ? 'before:bg-green-700' 
    : section === 'inventory' 
    ? 'before:bg-red-600' 
    : section === 'overview'
    ? 'before:bg-blue-600'
    : section === 'revenue'
    ? 'before:bg-purple-500'
    : 'before:bg-primary'
  const iconColor = section === 'expenses' 
    ? 'text-green-700' 
    : section === 'inventory' 
    ? 'text-red-600' 
    : section === 'overview'
    ? 'text-blue-600'
    : section === 'revenue'
    ? 'text-purple-500'
    : 'text-primary'

  return (
    <div className={`relative overflow-hidden rounded-md border border-border bg-secondary/30 px-4 py-3 before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${accentColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1.5 ${iconColor}`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wide uppercase">
            {title || 'Z.AI Insight'}
          </span>
        </div>
        <button
          onClick={fetchInsight}
          disabled={loading}
          className={`transition-colors disabled:opacity-50 ${
            section === 'expenses' 
              ? 'text-green-700/60 hover:text-green-700' 
              : section === 'inventory'
              ? 'text-red-600/60 hover:text-red-600'
              : section === 'overview'
              ? 'text-blue-600/60 hover:text-blue-600'
              : section === 'revenue'
              ? 'text-purple-500/60 hover:text-purple-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Refresh insight"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="text-sm leading-relaxed">
        {loading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Unable to load insight.</span>
            <button
              onClick={fetchInsight}
              className="text-primary hover:underline font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <p className="text-foreground/90">{insight}</p>
        )}
      </div>
    </div>
  )
}
