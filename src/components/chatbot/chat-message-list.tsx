'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ChatMessage } from '@/types'

interface ChatMessageListProps {
  messages: ChatMessage[]
  streamingContent: string
  isStreaming: boolean
  businessName: string
  error: string | null
  onRetry: () => void
}

// ─── Typing Indicator ────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-2">
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px] shrink-0">
        Z
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Date Separator ──────────────────────────────────────
function DateSeparator({ date }: { date: string }) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const today = now.toDateString()
    const yesterday = new Date(now.getTime() - 86400000).toDateString()

    if (d.toDateString() === today) return 'Today'
    if (d.toDateString() === yesterday) return 'Yesterday'
    return d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-muted-foreground font-medium">{formatDate(date)}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// ─── Time Formatter ──────────────────────────────────────
function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}

// ─── Message Bubble ──────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-[75%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-[11px] text-muted-foreground text-right mt-1 mr-1">
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 px-4 py-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px] shrink-0 mb-5">
        Z
      </div>
      <div className="max-w-[80%]">
        <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5">
          <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:font-semibold prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-2 prose-headings:mb-1">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 ml-1">
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}

// ─── Streaming Message ───────────────────────────────────
function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex items-end gap-2 px-4 py-1 animate-in fade-in duration-200">
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px] shrink-0 mb-5">
        Z
      </div>
      <div className="max-w-[80%]">
        <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5">
          <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:font-semibold">
            <ReactMarkdown>{content}</ReactMarkdown>
            <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────
function EmptyState({ businessName }: { businessName: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg mb-4">
        Z
      </div>
      <h3 className="text-lg font-semibold mb-1">Hi, I&apos;m Zara!</h3>
      <p className="text-sm text-muted-foreground mb-1">
        Your AI business advisor for <strong>{businessName}</strong>
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Ask me anything about your sales, inventory, finances, or operations.
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export function ChatMessageList({
  messages,
  streamingContent,
  isStreaming,
  businessName,
  error,
  onRetry,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [userScrolledUp, setUserScrolledUp] = useState(false)

  // Auto-scroll logic
  const scrollToBottom = useCallback(() => {
    if (!userScrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [userScrolledUp])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, streamingContent, scrollToBottom])

  // Detect if user scrolled up
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setUserScrolledUp(!isNearBottom)
  }, [])

  // Group messages by date
  const groupedMessages: Array<{ date: string; msgs: ChatMessage[] }> = []
  for (const msg of messages) {
    const date = new Date(msg.created_at).toDateString()
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === date) {
      last.msgs.push(msg)
    } else {
      groupedMessages.push({ date, msgs: [msg] })
    }
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 overflow-y-auto">
        <EmptyState businessName={businessName} />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scroll-smooth"
      onScroll={handleScroll}
    >
      <div className="py-2">
        {groupedMessages.map((group) => (
          <div key={group.date}>
            <DateSeparator date={group.msgs[0].created_at} />
            {group.msgs.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        ))}

        {/* Streaming content */}
        {isStreaming && streamingContent && (
          <StreamingBubble content={streamingContent} />
        )}

        {/* Typing indicator (before content starts streaming) */}
        {isStreaming && !streamingContent && <TypingIndicator />}

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 animate-in fade-in duration-300">
            <div className="mx-auto max-w-md bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={onRetry}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  )
}
