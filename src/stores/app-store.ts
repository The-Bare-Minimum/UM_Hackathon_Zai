import { create } from 'zustand'
import { Business } from '@/types'

interface AppState {
  business: Business | null
  setBusiness: (business: Business | null) => void
  isOnboarded: boolean
  setIsOnboarded: (value: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  business: null,
  setBusiness: (business) => set({ business }),
  isOnboarded: false,
  setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
}))
