'use client'

import { useState } from 'react'
import { Trash2, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatHeaderProps {
  businessName: string
  onClearChat: () => void
}

export function ChatHeader({ businessName, onClearChat }: ChatHeaderProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-sm z-10">
      {/* Left: Zara avatar + info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
            Z
          </div>
          {/* Online pulse */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>
        </div>
        <div>
          <h2 className="text-sm font-semibold leading-none">Zara</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">AI Business Advisor</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 relative">
        {/* Info button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => { setShowInfo(!showInfo); setShowClearConfirm(false) }}
        >
          <Info className="w-4 h-4" />
        </Button>

        {/* Clear button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => { setShowClearConfirm(!showClearConfirm); setShowInfo(false) }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Info popover */}
        {showInfo && (
          <div className="absolute right-0 top-10 w-64 bg-popover border rounded-lg shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium">About Zara</p>
              <button onClick={() => setShowInfo(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Zara knows your: <strong>sales data</strong>, <strong>inventory</strong>,{' '}
              <strong>expenses</strong>, <strong>staff info</strong> and{' '}
              <strong>business profile</strong>. Data refreshes with each message.
            </p>
          </div>
        )}

        {/* Clear confirmation popover */}
        {showClearConfirm && (
          <div className="absolute right-0 top-10 w-56 bg-popover border rounded-lg shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-medium mb-2">Clear conversation?</p>
            <p className="text-[11px] text-muted-foreground mb-3">
              This will remove all chat history.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  onClearChat()
                  setShowClearConfirm(false)
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
