'use client'

import { useRef, useCallback, useEffect } from 'react'
import { ArrowUp, Loader2, Square } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (message: string) => void
  isStreaming: boolean
  disabled: boolean
  onStopStreaming: () => void
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isStreaming,
  disabled,
  onStopStreaming,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = 120 // ~4 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isStreaming || disabled) return
    onSubmit(value.trim())
  }, [value, isStreaming, disabled, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
      if (e.key === 'Escape') {
        onChange('')
      }
    },
    [handleSubmit, onChange]
  )

  const hasText = value.trim().length > 0
  const charCount = value.length
  const showCounter = charCount > 400
  const isOverLimit = charCount > 480

  return (
    <div className={`px-3 pb-3 pt-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {/* Stop streaming button */}
      {isStreaming && (
        <div className="flex justify-center mb-2 animate-in fade-in duration-200">
          <button
            onClick={onStopStreaming}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
              border border-border bg-background hover:bg-muted
              text-muted-foreground hover:text-foreground
              transition-colors duration-150 shadow-sm"
          >
            <Square className="w-3 h-3 fill-current" />
            Stop generating
          </button>
        </div>
      )}

      {/* Input container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Zara anything about your business..."
          readOnly={isStreaming}
          disabled={disabled}
          rows={1}
          className="w-full resize-none rounded-xl border border-border bg-muted/30
            py-2.5 pl-3.5 pr-11
            text-sm placeholder:text-muted-foreground/60
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
            disabled:cursor-not-allowed disabled:opacity-50
            transition-all duration-200"
          style={{ maxHeight: '120px' }}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!hasText || isStreaming || disabled}
          className={`absolute right-2 bottom-2 w-8 h-8 rounded-lg
            flex items-center justify-center
            transition-all duration-200
            ${
              hasText && !isStreaming
                ? 'bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:scale-105 active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
        >
          {isStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Character counter */}
      {showCounter && (
        <p
          className={`text-[11px] text-right mt-1 mr-1 transition-colors ${
            isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'
          }`}
        >
          {charCount}/500
        </p>
      )}
    </div>
  )
}
