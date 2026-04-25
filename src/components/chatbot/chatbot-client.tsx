'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { ChatMessage } from '@/types'
import { ChatHeader } from './chat-header'
import { ChatMessageList } from './chat-message-list'
import { ChatInput } from './chat-input'
import { SuggestionChips } from './suggestion-chips'

interface ChatbotClientProps {
  businessId: string
  businessName: string
  initialMessages: ChatMessage[]
  initialSuggestions: string[]
}

export function ChatbotClient({
  businessId,
  businessName,
  initialMessages,
  initialSuggestions,
}: ChatbotClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [suggestions] = useState<string[]>(initialSuggestions)
  const [showSuggestions, setShowSuggestions] = useState(initialMessages.length === 0)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isStreaming) return

      const trimmed = messageText.trim()
      setError(null)
      setShowSuggestions(false)
      setInputValue('')

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        business_id: businessId,
        role: 'user',
        content: trimmed,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Start streaming state
      setIsStreaming(true)
      setStreamingContent('')

      // Build conversation history from recent messages
      const conversationHistory = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_id: businessId,
            message: trimmed,
            conversation_history: conversationHistory,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Request failed (${response.status})`)
        }

        const data = await response.json()
        const aiContent = data.message || 'I apologize, but I could not generate a response.'

        // Simulate streaming effect for a polished UX
        await simulateStreaming(aiContent)

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: `temp-assistant-${Date.now()}`,
          business_id: businessId,
          role: 'assistant',
          content: aiContent,
          created_at: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setStreamingContent('')
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User cancelled — add partial response if any
          const partial = streamingContent
          if (partial) {
            const partialMessage: ChatMessage = {
              id: `temp-assistant-${Date.now()}`,
              business_id: businessId,
              role: 'assistant',
              content: partial + '\n\n*(Response stopped)*',
              created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, partialMessage])
          }
          setStreamingContent('')
        } else {
          setError(err.message || 'Something went wrong. Please try again.')
        }
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    [businessId, isStreaming, messages, streamingContent]
  )

  const simulateStreaming = useCallback(
    (fullText: string) => {
      return new Promise<void>((resolve) => {
        const words = fullText.split(/(\s+)/)
        let current = ''
        let i = 0

        const interval = setInterval(() => {
          if (i >= words.length) {
            clearInterval(interval)
            resolve()
            return
          }

          // Add 3-5 words at a time for natural pacing
          const chunk = words.slice(i, i + 3).join('')
          current += chunk
          i += 3

          setStreamingContent(current)
        }, 40) // ~40ms per chunk for smooth streaming feel
      })
    },
    []
  )

  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const handleClearChat = useCallback(async () => {
    try {
      await fetch(`/api/ai/chat/clear?business_id=${businessId}`, {
        method: 'DELETE',
      })
      setMessages([])
      setShowSuggestions(true)
      setError(null)
      setStreamingContent('')
    } catch {
      setError('Failed to clear conversation.')
    }
  }, [businessId])

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      sendMessage(suggestion)
    },
    [sendMessage]
  )

  const handleSubmit = useCallback(
    (message: string) => {
      sendMessage(message)
    },
    [sendMessage]
  )

  const handleRetry = useCallback(() => {
    setError(null)
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      // Remove the last user message and retry
      setMessages((prev) => prev.slice(0, -1))
      sendMessage(lastUserMsg.content)
    }
  }, [messages, sendMessage])

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-1.5rem)] bg-background rounded-xl border overflow-hidden">
      <ChatHeader
        businessName={businessName}
        onClearChat={handleClearChat}
      />

      <div className="flex-1 flex flex-col min-h-0 relative">
        <ChatMessageList
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          businessName={businessName}
          error={error}
          onRetry={handleRetry}
        />

        {/* Suggestion chips + Input area */}
        <div className="shrink-0 border-t bg-background">
          <SuggestionChips
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
            visible={showSuggestions}
          />
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isStreaming={isStreaming}
            disabled={false}
            onStopStreaming={handleStopStreaming}
          />
        </div>
      </div>
    </div>
  )
}
