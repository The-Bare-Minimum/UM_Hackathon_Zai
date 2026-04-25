'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActivityFilters, SortOption } from '@/types'

interface ActivityFiltersProps {
  filters: ActivityFilters
  onFiltersChange: (filters: ActivityFilters) => void
  onClearFilters: () => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

export function ActivityFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  sortBy,
  onSortChange,
}: ActivityFiltersProps) {
  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(filters.itemName)

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.itemName) {
        onFiltersChange({ ...filters, itemName: searchInput })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput]) // Only depend on searchInput to avoid infinite loops

  // Sync local search state when filters change externally (e.g., clear filters)
  useEffect(() => {
    if (filters.itemName !== searchInput) {
      setSearchInput(filters.itemName)
    }
  }, [filters.itemName])

  // Handle change type filter change
  const handleChangeTypeChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        changeType: value as ActivityFilters['changeType'],
      })
    },
    [filters, onFiltersChange]
  )

  // Handle date range filter change
  const handleDateRangeChange = useCallback(
    (value: string) => {
      const newFilters = {
        ...filters,
        dateRange: value as ActivityFilters['dateRange'],
      }
      
      // Clear custom dates if not custom range
      if (value !== 'custom') {
        newFilters.customStartDate = undefined
        newFilters.customEndDate = undefined
      }
      
      onFiltersChange(newFilters)
    },
    [filters, onFiltersChange]
  )

  // Handle custom start date change
  const handleCustomStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({
        ...filters,
        customStartDate: e.target.value,
      })
    },
    [filters, onFiltersChange]
  )

  // Handle custom end date change
  const handleCustomEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({
        ...filters,
        customEndDate: e.target.value,
      })
    },
    [filters, onFiltersChange]
  )

  // Check if any filters are active
  const hasActiveFilters =
    filters.changeType !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.itemName.length > 0

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters & Sort</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onClearFilters}
            aria-label="Clear all filters"
          >
            <X className="mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Responsive grid layout: stacked on mobile, horizontal on desktop */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Change Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="change-type-filter" className="text-xs">
            Change Type
          </Label>
          <Select
            value={filters.changeType}
            onValueChange={handleChangeTypeChange}
          >
            <SelectTrigger
              id="change-type-filter"
              aria-label="Filter by change type"
              className="w-full"
            >
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="add">Add</SelectItem>
              <SelectItem value="deduct">Deduct</SelectItem>
              <SelectItem value="adjust">Adjust</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label htmlFor="date-range-filter" className="text-xs">
            Date Range
          </Label>
          <Select
            value={filters.dateRange}
            onValueChange={handleDateRangeChange}
          >
            <SelectTrigger
              id="date-range-filter"
              aria-label="Filter by date range"
              className="w-full"
            >
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Item Name Search */}
        <div className="space-y-2">
          <Label htmlFor="item-name-search" className="text-xs">
            Item Name
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="item-name-search"
              type="text"
              placeholder="Search items..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              aria-label="Search by item name"
            />
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sort-control" className="text-xs">
            Sort By
          </Label>
          <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger
              id="sort-control"
              aria-label="Sort activity logs"
              className="w-full"
            >
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Date Range Pickers - shown when Custom Range is selected */}
      {filters.dateRange === 'custom' && (
        <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="custom-start-date" className="text-xs">
              Start Date
            </Label>
            <Input
              id="custom-start-date"
              type="date"
              value={filters.customStartDate || ''}
              onChange={handleCustomStartDateChange}
              aria-label="Custom start date"
              max={filters.customEndDate || undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-end-date" className="text-xs">
              End Date
            </Label>
            <Input
              id="custom-end-date"
              type="date"
              value={filters.customEndDate || ''}
              onChange={handleCustomEndDateChange}
              aria-label="Custom end date"
              min={filters.customStartDate || undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}
