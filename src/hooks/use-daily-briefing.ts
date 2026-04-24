'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BriefingContent } from '@/types'

interface DailyBriefingState {
  briefing: {
    content: BriefingContent
    cached: boolean
    date: string
    generatedAt: string
  } | null
  isLoading: boolean
  isGenerating: boolean
  error: string | null
  hasSeenToday: boolean
  markAsSeen: () => void
  regenerate: () => Promise<void>
}

function getTodayKey(businessId: string): string {
  // Use a Malaysia-timezone-aware date for the localStorage key
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const myt = new Date(utc + 8 * 3600000)
  const dateStr = myt.toISOString().split('T')[0]
  return `briefing_seen_${businessId}_${dateStr}`
}

export function useDailyBriefing(businessId: string): DailyBriefingState {
  const [briefing, setBriefing] = useState<DailyBriefingState['briefing']>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSeenToday, setHasSeenToday] = useState(false)

  // Check localStorage on mount
  useEffect(() => {
    const key = getTodayKey(businessId)
    const seen = localStorage.getItem(key)
    if (seen === 'true') {
      setHasSeenToday(true)
    }
  }, [businessId])

  // Fetch briefing on mount
  useEffect(() => {
    let cancelled = false

    async function fetchBriefing() {
      try {
        setIsLoading(true)
        setIsGenerating(true)
        setError(null)

        const res = await fetch('/api/ai/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_id: businessId }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to fetch briefing')
        }

        const data = await res.json()

        if (!cancelled) {
          setBriefing({
            content: data.briefing,
            cached: data.cached,
            date: data.date,
            generatedAt: data.generatedAt,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load briefing')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setIsGenerating(false)
        }
      }
    }

    fetchBriefing()
    return () => {
      cancelled = true
    }
  }, [businessId])

  const markAsSeen = useCallback(() => {
    const key = getTodayKey(businessId)
    localStorage.setItem(key, 'true')
    setHasSeenToday(true)
  }, [businessId])

  const regenerate = useCallback(async () => {
    try {
      setIsGenerating(true)
      setError(null)

      // Delete today's cached briefing
      await fetch(`/api/ai/briefing/${businessId}`, {
        method: 'DELETE',
      })

      // Re-fetch fresh briefing
      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to regenerate briefing')
      }

      const data = await res.json()
      setBriefing({
        content: data.briefing,
        cached: data.cached,
        date: data.date,
        generatedAt: data.generatedAt,
      })

      // Clear seen status so modal can re-appear
      const key = getTodayKey(businessId)
      localStorage.removeItem(key)
      setHasSeenToday(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate briefing')
    } finally {
      setIsGenerating(false)
    }
  }, [businessId])

  return {
    briefing,
    isLoading,
    isGenerating,
    error,
    hasSeenToday,
    markAsSeen,
    regenerate,
  }
}
