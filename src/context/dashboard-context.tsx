'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DashboardContextValue {
  isCsvModalOpen: boolean
  setIsCsvModalOpen: (open: boolean) => void
  refreshKey: number
  refreshDashboard: () => void
  isBriefingOpen: boolean
  setIsBriefingOpen: (open: boolean) => void
  hasSeenBriefingToday: boolean
  setHasSeenBriefingToday: (seen: boolean) => void
  unreadChatCount: number
  setUnreadChatCount: (count: number) => void
}

const DashboardContext = createContext<DashboardContextValue>({
  isCsvModalOpen: false,
  setIsCsvModalOpen: () => {},
  refreshKey: 0,
  refreshDashboard: () => {},
  isBriefingOpen: false,
  setIsBriefingOpen: () => {},
  hasSeenBriefingToday: false,
  setHasSeenBriefingToday: () => {},
  unreadChatCount: 0,
  setUnreadChatCount: () => {},
})

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isBriefingOpen, setIsBriefingOpen] = useState(false)
  const [hasSeenBriefingToday, setHasSeenBriefingToday] = useState(false)
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  const refreshDashboard = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <DashboardContext.Provider
      value={{
        isCsvModalOpen,
        setIsCsvModalOpen,
        refreshKey,
        refreshDashboard,
        isBriefingOpen,
        setIsBriefingOpen,
        hasSeenBriefingToday,
        setHasSeenBriefingToday,
        unreadChatCount,
        setUnreadChatCount,
      }}
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
