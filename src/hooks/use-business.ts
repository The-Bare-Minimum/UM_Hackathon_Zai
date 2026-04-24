'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import type { Business } from '@/types'

export function useBusiness() {
  const { business, setBusiness } = useAppStore()
  const [loading, setLoading] = useState(!business)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If already in Zustand store, skip fetch
    if (business) {
      setLoading(false)
      return
    }

    const fetchBusiness = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data, error: dbError } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (dbError) {
          if (dbError.code === 'PGRST116') {
            // No business found — not an error, user needs onboarding
            setLoading(false)
            return
          }
          throw dbError
        }

        if (data) {
          setBusiness(data as Business)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business')
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [business, setBusiness])

  return { business, loading, error }
}
