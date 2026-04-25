'use client'

import { ArrowRight } from 'lucide-react'

interface SuggestionChipsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  visible: boolean
}

export function SuggestionChips({ suggestions, onSelect, visible }: SuggestionChipsProps) {
  if (!visible || suggestions.length === 0) return null

  return (
    <div className="px-4 pt-3 pb-1 animate-in fade-in duration-500">
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">
        Suggested questions
      </p>
      <div className="flex gap-2 flex-wrap">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion}
            onClick={() => onSelect(suggestion)}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium
              border border-border 
              bg-primary/5
              text-foreground
              hover:bg-primary/10
              hover:border-primary/30
              transition-all duration-200 cursor-pointer
              animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
          >
            <ArrowRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
