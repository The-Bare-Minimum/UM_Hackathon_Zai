'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading: boolean
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: PaginationControlsProps) {
  const handlePrevious = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1)
    }
  }

  // Don't render pagination if there are no pages
  if (totalPages === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="default"
        onClick={handlePrevious}
        disabled={currentPage === 1 || isLoading}
        aria-label="Go to previous page"
        className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
      >
        <ChevronLeft />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {/* Page Indicator */}
      <div
        className="text-sm font-medium text-foreground"
        aria-live="polite"
        aria-atomic="true"
      >
        Page {currentPage} of {totalPages}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="default"
        onClick={handleNext}
        disabled={currentPage === totalPages || isLoading}
        aria-label="Go to next page"
        className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight />
      </Button>
    </div>
  )
}
