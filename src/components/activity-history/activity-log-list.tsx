'use client'

import { PlusCircle, MinusCircle, Edit, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { InventoryLog } from '@/types'

interface ActivityLogListProps {
  logs: InventoryLog[]
  isLoading: boolean
}

// Change type configuration with icons and colors
const changeTypeConfig = {
  add: {
    icon: PlusCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    label: 'Add',
  },
  deduct: {
    icon: MinusCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    label: 'Deduct',
  },
  adjust: {
    icon: Edit,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    label: 'Adjust',
  },
  invoice: {
    icon: FileText,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    label: 'Invoice',
  },
} as const

// Format quantity change with +/- prefix and color
function formatQuantityChange(quantity: number): {
  text: string
  color: string
} {
  const isPositive = quantity > 0
  return {
    text: isPositive ? `+${quantity}` : `${quantity}`,
    color: isPositive ? 'text-emerald-600' : 'text-red-600',
  }
}

// Format timestamp to human-readable format
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    // Use relative time for recent entries (within 7 days)
    if (diffInHours < 168) {
      return formatDistanceToNow(date, { addSuffix: true })
    }

    // Use absolute format for older entries
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (error) {
    return timestamp
  }
}

export function ActivityLogList({ logs, isLoading }: ActivityLogListProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg p-8 bg-card text-center">
        <p className="text-muted-foreground">Loading activity logs...</p>
      </div>
    )
  }

  if (logs.length === 0) {
    return null // Empty state is handled by parent component
  }

  return (
    <>
      {/* Desktop Table Layout (hidden on mobile) */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                Item Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                Change Type
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                Quantity Change
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                Notes
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const config = changeTypeConfig[log.change_type]
              const Icon = config.icon
              const quantity = formatQuantityChange(log.quantity_change)

              return (
                <tr key={log.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm font-medium text-foreground">
                    {log.item_name}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${config.bg}`}>
                        <Icon
                          className={`w-4 h-4 ${config.color}`}
                          aria-label={`${config.label} icon`}
                        />
                      </div>
                      <span className="text-sm text-foreground capitalize">
                        {config.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-semibold ${quantity.color}`}>
                      {quantity.text}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {log.notes || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatTimestamp(log.created_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout (hidden on desktop) */}
      <div className="md:hidden space-y-3">
        {logs.map((log) => {
          const config = changeTypeConfig[log.change_type]
          const Icon = config.icon
          const quantity = formatQuantityChange(log.quantity_change)

          return (
            <div
              key={log.id}
              className="border rounded-lg p-4 bg-card space-y-3"
            >
              {/* Item Name */}
              <div>
                <p className="font-semibold text-foreground text-base">
                  {log.item_name}
                </p>
              </div>

              {/* Change Type Badge + Quantity Change */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${config.bg}`}>
                    <Icon
                      className={`w-4 h-4 ${config.color}`}
                      aria-label={`${config.label} icon`}
                    />
                  </div>
                  <span className="text-sm text-foreground capitalize">
                    {config.label}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${quantity.color}`}>
                  {quantity.text}
                </span>
              </div>

              {/* Timestamp */}
              <div>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(log.created_at)}
                </p>
              </div>

              {/* Notes (only if present) */}
              {log.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    {log.notes}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
