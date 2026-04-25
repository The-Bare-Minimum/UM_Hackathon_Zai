'use client'

import { useState } from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InventoryItem } from '@/types'

interface InventoryTableProps {
  items: InventoryItem[]
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  sortField: keyof InventoryItem
  sortDirection: 'asc' | 'desc'
  onSort: (field: keyof InventoryItem) => void
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
  },
  low: {
    label: 'Low Stock',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
  },
  ok: {
    label: 'In Stock',
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
  },
  expired: {
    label: 'Expired',
    className:
      'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-800',
  },
}

function formatCurrency(value: number): string {
  return `RM ${value.toFixed(2)}`
}

function getExpiryInfo(expiryDate: string | null): { text: string; className: string } | null {
  if (!expiryDate) return null
  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const formatted = expiry.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (daysUntil < 0) {
    return { text: `Expired ${formatted}`, className: 'text-red-600 dark:text-red-400' }
  }
  if (daysUntil <= 7) {
    return { text: `${formatted} (${daysUntil}d)`, className: 'text-amber-600 dark:text-amber-400' }
  }
  return { text: formatted, className: 'text-muted-foreground' }
}

export function InventoryTable({
  items,
  onEdit,
  onDelete,
  sortField,
  sortDirection,
  onSort,
}: InventoryTableProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const SortIcon = ({ field }: { field: keyof InventoryItem }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-foreground" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-foreground" />
    )
  }

  // Calculate pagination
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = currentPage * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

  // Reset to first page when items per page changes
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(0)
  }

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
  }

  const columns: { field: keyof InventoryItem; label: string; className?: string }[] = [
    { field: 'name', label: 'Item' },
    { field: 'quantity', label: 'Stock Level' },
    { field: 'reorder_level', label: 'Reorder At' },
    { field: 'cost_per_unit', label: 'Unit Cost' },
    { field: 'status', label: 'Status' },
  ]

  return (
    <div className="space-y-4">
      <div className="border rounded-xl bg-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                {columns.map((col) => (
                  <th key={col.field} className="text-left px-4 py-3">
                    <button
                      onClick={() => onSort(col.field)}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {col.label}
                      <SortIcon field={col.field} />
                    </button>
                  </th>
                ))}
                <th className="text-left px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Expiry
                  </span>
                </th>
                <th className="text-right px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => {
              const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.ok
              const stockPercent = Math.min(
                (item.quantity / Math.max(item.reorder_level * 3, 1)) * 100,
                100
              )
              const stockValue = item.quantity * item.cost_per_unit
              const expiryInfo = getExpiryInfo(item.expiry_date)

              return (
                <tr
                  key={item.id}
                  className={`border-b last:border-b-0 hover:bg-muted/30 transition-colors ${
                    item.status === 'critical'
                      ? 'bg-red-50/30 dark:bg-red-950/10'
                      : ''
                  }`}
                >
                  {/* Item Name + Category */}
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <Badge
                        variant="secondary"
                        className="mt-1 text-[10px] px-1.5 py-0 font-normal"
                      >
                        {item.category}
                      </Badge>
                    </div>
                  </td>

                  {/* Stock Level */}
                  <td className="px-4 py-3.5">
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold tabular-nums">
                        {item.quantity} {item.unit}
                      </p>
                      <div className="w-24">
                        <Progress
                          value={stockPercent}
                          className={`h-1.5 ${
                            item.status === 'critical'
                              ? '[&>div]:bg-red-500'
                              : item.status === 'low'
                              ? '[&>div]:bg-amber-500'
                              : '[&>div]:bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Reorder Level */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {item.reorder_level} {item.unit}
                    </p>
                  </td>

                  {/* Unit Cost + Stock Value */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(item.cost_per_unit)}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      Value: {formatCurrency(stockValue)}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </Badge>
                  </td>

                  {/* Expiry */}
                  <td className="px-4 py-3.5">
                    {expiryInfo ? (
                      <span className={`text-xs ${expiryInfo.className}`}>
                        {expiryInfo.text}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y">
        {currentItems.map((item) => {
          const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.ok
          const stockPercent = Math.min(
            (item.quantity / Math.max(item.reorder_level * 3, 1)) * 100,
            100
          )
          const expiryInfo = getExpiryInfo(item.expiry_date)

          return (
            <div key={item.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 font-normal"
                    >
                      {item.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Stock</p>
                  <p className="font-semibold tabular-nums">
                    {item.quantity} {item.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reorder</p>
                  <p className="tabular-nums">
                    {item.reorder_level} {item.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cost</p>
                  <p className="tabular-nums">{formatCurrency(item.cost_per_unit)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Progress
                  value={stockPercent}
                  className={`h-1.5 flex-1 ${
                    item.status === 'critical'
                      ? '[&>div]:bg-red-500'
                      : item.status === 'low'
                      ? '[&>div]:bg-amber-500'
                      : '[&>div]:bg-emerald-500'
                  }`}
                />
                {expiryInfo && (
                  <span className={`text-[10px] whitespace-nowrap ${expiryInfo.className}`}>
                    {expiryInfo.text}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>

    {/* Pagination Controls */}
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
          <SelectTrigger className="w-[70px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {startIndex + 1}-{Math.min(endIndex, items.length)} of {items.length}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={handlePrevious}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
  )
}
