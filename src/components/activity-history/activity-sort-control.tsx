'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SortOption } from '@/types'

interface ActivitySortControlProps {
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

// Map user-friendly labels to SortOption values
const sortOptions = [
  { value: 'newest' as const, label: 'Newest First' },
  { value: 'oldest' as const, label: 'Oldest First' },
]

export function ActivitySortControl({
  sortBy,
  onSortChange,
}: ActivitySortControlProps) {
  const handleSortChange = (value: string) => {
    onSortChange(value as SortOption)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="sort-control" className="text-xs">
        Sort By
      </Label>
      <Select value={sortBy} onValueChange={handleSortChange}>
        <SelectTrigger
          id="sort-control"
          aria-label="Sort activity logs"
          className="w-full"
        >
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
