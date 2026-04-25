'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BusinessRules, BusinessRulesFormData } from '@/types'

export function useBusinessRules(businessId: string) {
  const [rules, setRules] = useState<BusinessRules | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch rules on mount
  useEffect(() => {
    async function fetchRules() {
      try {
        setIsLoading(true)
        const res = await fetch('/api/rules')
        if (!res.ok) throw new Error('Failed to fetch rules')
        const data = await res.json()
        setRules(data.rules)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rules')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRules()
  }, [businessId])

  // Save rules
  const saveRules = useCallback(
    async (formData: BusinessRulesFormData): Promise<BusinessRules | null> => {
      const previousRules = rules
      setIsSaving(true)
      setError(null)

      try {
        const res = await fetch('/api/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to save rules')
        }

        const data = await res.json()
        setRules(data.rules)
        return data.rules
      } catch (err) {
        // Revert on error
        setRules(previousRules)
        const message = err instanceof Error ? err.message : 'Failed to save'
        setError(message)
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [rules]
  )

  // Reset rules to defaults
  const resetRules = useCallback(async () => {
    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/rules/reset', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to reset rules')
      const data = await res.json()
      setRules(data.rules)
      return data.rules
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Check if a specific rule is violated
  const isRuleViolated = useCallback(
    (rule: keyof BusinessRules, currentValue: number): boolean => {
      if (!rules) return false

      const ruleValue = rules[rule]
      if (typeof ruleValue !== 'number') return false

      // For percentage targets, check if current exceeds target
      if (rule.includes('pct') || rule.includes('tolerance')) {
        return currentValue > ruleValue
      }

      return false
    },
    [rules]
  )

  return {
    rules,
    isLoading,
    isSaving,
    error,
    saveRules,
    resetRules,
    isRuleViolated,
  }
}
