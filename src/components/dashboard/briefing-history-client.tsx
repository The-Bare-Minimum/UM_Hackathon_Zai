'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Topbar } from '@/components/layout/topbar'
import {
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
} from 'lucide-react'
import type { AiBriefing, BriefingContent } from '@/types'

interface BriefingHistoryClientProps {
  briefings: AiBriefing[]
  businessName: string
}

function parseBriefingContent(raw: string): BriefingContent | null {
  try {
    return JSON.parse(raw) as BriefingContent
  } catch {
    return null
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function BriefingHistoryClient({ briefings, businessName }: BriefingHistoryClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    briefings.length > 0 ? briefings[0].id : null
  )

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="flex flex-col min-h-screen pb-10">
      <Topbar title="Briefing History" />

      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Past Briefings</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Your AI-generated daily briefings for {businessName}
          </p>
        </div>

        {briefings.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No briefings yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Your daily AI briefings will appear here once generated. Visit your dashboard to trigger the first one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {briefings.map((briefing) => {
              const content = parseBriefingContent(briefing.content)
              const isExpanded = expandedId === briefing.id
              const previewText = content
                ? content.insights[0]?.substring(0, 80) + '...'
                : briefing.content.substring(0, 80) + '...'

              return (
                <Card
                  key={briefing.id}
                  className={`shadow-sm transition-all duration-200 ${isExpanded ? 'ring-1 ring-amber-500/30' : ''}`}
                >
                  <button
                    onClick={() => toggleExpand(briefing.id)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors rounded-t-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 shrink-0">
                        <Calendar className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {formatDate(briefing.briefing_date)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {previewText}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isExpanded && content && (
                    <CardContent className="pt-0 pb-5 px-5 border-t">
                      {/* Greeting */}
                      <p className="text-base font-medium text-foreground leading-relaxed mt-4 mb-4">
                        {content.greeting}
                      </p>

                      {/* Insights */}
                      <div className="mb-4">
                        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-2.5">
                          Highlights
                        </h4>
                        <div className="space-y-2.5">
                          {content.insights.map((insight, i) => (
                            <div key={i} className="flex gap-2.5 items-start">
                              <div className="mt-[7px] shrink-0">
                                <div className="w-[5px] h-[5px] rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                              </div>
                              <p className="text-sm text-foreground/85 leading-relaxed">
                                {insight}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Urgent */}
                      {content.urgent && (
                        <div className="mb-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                              Needed Attention
                            </span>
                          </div>
                          <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                            {content.urgent}
                          </p>
                        </div>
                      )}

                      {/* Closing */}
                      {content.closing && (
                        <p className="text-sm italic text-muted-foreground leading-relaxed border-t pt-3">
                          {content.closing}
                        </p>
                      )}
                    </CardContent>
                  )}

                  {isExpanded && !content && (
                    <CardContent className="pt-0 pb-5 px-5 border-t">
                      <p className="text-sm text-foreground/80 leading-relaxed mt-4 whitespace-pre-wrap">
                        {briefing.content}
                      </p>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
