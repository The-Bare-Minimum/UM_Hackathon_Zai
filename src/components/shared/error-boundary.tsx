'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // We keep console.error here because it's a boundary catcher and useful in production logs
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center border rounded-lg bg-red-50/50 dark:bg-red-950/20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            We hit an unexpected error. Please refresh the page.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-8 p-4 bg-red-100 dark:bg-red-900/30 rounded text-left max-w-2xl overflow-auto text-xs text-red-800 dark:text-red-200">
              <p className="font-mono">{this.state.error.message}</p>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
