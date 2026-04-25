'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivityFilters } from '@/components/activity-history/activity-filters'
import { ActivityLogList } from '@/components/activity-history/activity-log-list'
import { PaginationControls } from '@/components/activity-history/pagination-controls'
import type { InventoryLog, ActivityFilters as ActivityFiltersType, SortOption } from '@/types'

interface ActivityHistoryClientProps {
  initialLogs: InventoryLog[]
  initialTotalPages: number
  initialTotalCount: number
  initialPage: number
  initialFilters: ActivityFiltersType
  initialSort: SortOption
  businessId: string
}

export function ActivityHistoryClient({
  initialLogs,
  initialTotalPages,
  initialTotalCount,
  initialPage,
  initialFilters,
  initialSort,
  businessId,
}: ActivityHistoryClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State management
  const [logs, setLogs] = useState<InventoryLog[]>(initialLogs)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [filters, setFilters] = useState<ActivityFiltersType>(initialFilters)
  const [sort, setSort] = useState<SortOption>(initialSort)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update URL search parameters when state changes
  const updateURL = useCallback((
    newPage: number,
    newFilters: ActivityFiltersType,
    newSort: SortOption
  ) => {
    const params = new URLSearchParams()
    
    params.set('page', newPage.toString())
    
    if (newFilters.changeType !== 'all') {
      params.set('changeType', newFilters.changeType)
    }
    
    if (newFilters.dateRange !== 'all') {
      params.set('dateRange', newFilters.dateRange)
    }
    
    if (newFilters.customStartDate) {
      params.set('customStartDate', newFilters.customStartDate)
    }
    
    if (newFilters.customEndDate) {
      params.set('customEndDate', newFilters.customEndDate)
    }
    
    if (newFilters.itemName) {
      params.set('itemName', newFilters.itemName)
    }
    
    if (newSort !== 'newest') {
      params.set('sortBy', newSort)
    }

    router.push(`/inventory/activity-history?${params.toString()}`)
  }, [router])

  // Fetch data from API
  const fetchData = useCallback(async (
    page: number,
    filterParams: ActivityFiltersType,
    sortParam: SortOption
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        changeType: filterParams.changeType,
        dateRange: filterParams.dateRange,
        sortBy: sortParam,
      })

      if (filterParams.customStartDate) {
        params.set('customStartDate', filterParams.customStartDate)
      }

      if (filterParams.customEndDate) {
        params.set('customEndDate', filterParams.customEndDate)
      }

      if (filterParams.itemName) {
        params.set('itemName', filterParams.itemName)
      }

      const response = await fetch(`/api/inventory/activity-logs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs')
      }

      const data = await response.json()
      
      setLogs(data.logs)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
      setCurrentPage(data.currentPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: ActivityFiltersType) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to page 1 when filters change
    updateURL(1, newFilters, sort)
    fetchData(1, newFilters, sort)
  }, [sort, updateURL, fetchData])

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    const clearedFilters: ActivityFiltersType = {
      changeType: 'all',
      dateRange: 'all',
      itemName: '',
    }
    handleFiltersChange(clearedFilters)
  }, [handleFiltersChange])

  // Handle sort changes
  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort)
    updateURL(currentPage, filters, newSort)
    fetchData(currentPage, filters, newSort)
  }, [currentPage, filters, updateURL, fetchData])

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    
    setCurrentPage(newPage)
    updateURL(newPage, filters, sort)
    fetchData(newPage, filters, sort)
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [totalPages, filters, sort, updateURL, fetchData])

  // Handle back navigation
  const handleBack = () => {
    router.push('/inventory')
  }

  // Handle retry on error
  const handleRetry = () => {
    fetchData(currentPage, filters, sort)
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back to inventory"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Activity History</h1>
          </div>
        </div>

        {/* Error State */}
        <div className="border rounded-lg p-12 bg-card text-center">
          <p className="text-lg font-semibold text-destructive mb-2">Error Loading Activity Logs</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRetry}>Retry</Button>
        </div>
      </div>
    )
  }

  // Empty state (no logs exist at all)
  if (!isLoading && logs.length === 0 && filters.changeType === 'all' && !filters.itemName) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back to inventory"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Activity History</h1>
          </div>
        </div>

        {/* Empty State */}
        <div className="border rounded-lg p-12 bg-card text-center">
          <p className="text-lg font-semibold mb-2">No activity logs yet</p>
          <p className="text-sm text-muted-foreground">
            Activity logs will appear here after you make inventory changes
          </p>
        </div>
      </div>
    )
  }

  // Main content
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label="Back to inventory"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} total {totalCount === 1 ? 'log' : 'logs'}
          </p>
        </div>
      </div>

      {/* Filters and Sort Controls */}
      <ActivityFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        sortBy={sort}
        onSortChange={handleSortChange}
      />

      {/* Activity Log List */}
      <ActivityLogList
        logs={logs}
        isLoading={isLoading}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}

      {/* Empty results after filtering */}
      {!isLoading && logs.length === 0 && (filters.changeType !== 'all' || filters.itemName) && (
        <div className="border rounded-lg p-8 bg-card text-center">
          <p className="text-lg font-semibold mb-2">No logs match your filters</p>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your filters to see more results
          </p>
          <Button
            variant="outline"
            onClick={() => handleFiltersChange({
              changeType: 'all',
              dateRange: 'all',
              itemName: '',
            })}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}
