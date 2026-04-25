'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        We hit an unexpected error. Please refresh the page.
      </p>
      <Button onClick={() => reset()}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-red-100 dark:bg-red-900/30 rounded text-left max-w-2xl overflow-auto text-xs text-red-800 dark:text-red-200">
          <p className="font-mono">{error.message}</p>
        </div>
      )}
    </div>
  )
}
