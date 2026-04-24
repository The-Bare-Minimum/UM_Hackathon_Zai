'use client'

import { useState } from 'react'
import { Upload, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboardContext } from '@/context/dashboard-context'

interface TopbarProps {
  title: string
  hasAlerts?: boolean
}

export function Topbar({ title, hasAlerts = false }: TopbarProps) {
  const { setIsCsvModalOpen } = useDashboardContext()

  return (
    <header className="h-14 bg-background border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <h1 className="text-lg font-semibold truncate hidden md:block">{title}</h1>
      
      <div className="flex items-center gap-3 ml-auto">
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
