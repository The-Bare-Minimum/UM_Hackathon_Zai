'use client'

import { Upload, BellRing, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardContext } from '@/context/dashboard-context'

interface TopbarProps {
  title: string
  hasAlerts?: boolean
}

export function Topbar({ title, hasAlerts = false }: TopbarProps) {
  const {
    setIsCsvModalOpen,
    setIsBriefingOpen,
    hasSeenBriefingToday,
  } = useDashboardContext()

  return (
    <header className="h-14 bg-background border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <h1 className="text-lg font-semibold truncate hidden md:block">{title}</h1>
      
      <div className="flex items-center gap-3 ml-auto">
        {/* Today's Briefing button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 relative"
          onClick={() => setIsBriefingOpen(true)}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Today&apos;s Briefing</span>
          {!hasSeenBriefingToday && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-br from-amber-400 to-orange-500" />
            </span>
          )}
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5"
          onClick={() => setIsCsvModalOpen(true)}
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import CSV</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <BellRing className="w-4 h-4 text-muted-foreground" />
          {hasAlerts && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
          )}
        </Button>
      </div>
    </header>
  )
}
