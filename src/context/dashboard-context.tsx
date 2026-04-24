'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DashboardContextValue {
  isCsvModalOpen: boolean
  setIsCsvModalOpen: (open: boolean) => void
  refreshKey: number
  refreshDashboard: () => void
}

const DashboardContext = createContext<DashboardContextValue>({
  isCsvModalOpen: false,
  setIsCsvModalOpen: () => {},
  refreshKey: 0,
  refreshDashboard: () => {},
})

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshDashboard = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <DashboardContext.Provider
      value={{ isCsvModalOpen, setIsCsvModalOpen, refreshKey, refreshDashboard }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardContext must be used within DashboardProvider')
  }
  return context
}
