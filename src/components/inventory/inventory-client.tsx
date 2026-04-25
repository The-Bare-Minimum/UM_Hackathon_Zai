'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PlusCircle, Camera, Search, LayoutDashboard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { InventoryTable } from './inventory-table'
import { ItemFormModal } from './item-form-modal'
import { SnapInvoiceModal } from './snap-invoice-modal'
import { RestockPanel } from './restock-panel'
import type { InventoryItem, InventoryStats, InventoryLog } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface InventoryClientProps {
  initialItems: InventoryItem[]
  initialStats: InventoryStats
  initialLogs: InventoryLog[]
  businessId: string
}

type FilterStatus = 'all' | 'critical' | 'low' | 'ok' | 'expiring'
type SortField = keyof InventoryItem
type SortDirection = 'asc' | 'desc'

function formatCurrency(value: number): string {
  return `RM ${value.toFixed(2)}`
}

export function InventoryClient({
  initialItems,
  initialStats,
  initialLogs,
  businessId,
}: InventoryClientProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [logs, setLogs] = useState<InventoryLog[]>(initialLogs)
  const [stats, setStats] = useState<InventoryStats>(initialStats)
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSnapOpen, setIsSnapOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Derived state
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'expiring') {
        const now = new Date()
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        result = result.filter(i => {
          if (!i.expiry_date) return false
          const exp = new Date(i.expiry_date)
          return exp >= now && exp <= weekFromNow
        })
      } else {
        result = result.filter(i => i.status === activeFilter)
      }
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortField]
      let valB: any = b[sortField]
      
      // Handle nulls
      if (valA === null) valA = ''
      if (valB === null) valB = ''

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA)
      }

      return sortDirection === 'asc' 
        ? (valA > valB ? 1 : -1) 
        : (valA < valB ? 1 : -1)
    })

    return result
  }, [items, searchQuery, activeFilter, sortField, sortDirection])

  // Recalculate stats when items change locally
  const updateLocalStats = (newItems: InventoryItem[]) => {
    const totalItems = newItems.length
    const totalValue = newItems.reduce((sum, i) => sum + (i.quantity * i.cost_per_unit), 0)
    const criticalCount = newItems.filter(i => i.status === 'critical').length
    const lowCount = newItems.filter(i => i.status === 'low').length
    const okCount = newItems.filter(i => i.status === 'ok' || i.status === 'expired').length // grouping ok/expired for simple count
    
    setStats(prev => ({
      ...prev,
      totalItems,
      totalValue,
      criticalCount,
      lowCount,
      okCount
    }))
  }

  // Calculate item status based on quantity and expiry
  const calculateItemStatus = (item: InventoryItem): InventoryItem => {
    const now = new Date()
    let status: InventoryItem['status'] = 'ok'

    // Check expiry first
    if (item.expiry_date && new Date(item.expiry_date) < now) {
      status = 'expired'
    } else if (item.quantity <= 0) {
      status = 'critical'
    } else if (item.quantity <= item.reorder_level) {
      status = 'low'
    }

    return { ...item, status }
  }

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleItemAdded = (item: InventoryItem) => {
    const itemWithStatus = calculateItemStatus(item)
    const newItems = [...items, itemWithStatus]
    setItems(newItems)
    updateLocalStats(newItems)
    
    // Add local log for optimistic UI
    const newLog: InventoryLog = {
      id: Date.now().toString(),
      inventory_item_id: item.id,
      business_id: businessId,
      item_name: item.name,
      change_type: 'add',
      quantity_change: item.quantity,
      notes: 'Initial stock entry',
      created_at: new Date().toISOString()
    }
    setLogs([newLog, ...logs].slice(0, 20))
  }

  const handleItemUpdated = (updatedItem: InventoryItem) => {
    const oldItem = items.find(i => i.id === updatedItem.id)
    const itemWithStatus = calculateItemStatus(updatedItem)
    const newItems = items.map(i => i.id === updatedItem.id ? itemWithStatus : i)
    setItems(newItems)
    updateLocalStats(newItems)

    if (oldItem && oldItem.quantity !== updatedItem.quantity) {
      const newLog: InventoryLog = {
        id: Date.now().toString(),
        inventory_item_id: updatedItem.id,
        business_id: businessId,
        item_name: updatedItem.name,
        change_type: 'adjust',
        quantity_change: updatedItem.quantity - oldItem.quantity,
        notes: 'Manual adjustment',
        created_at: new Date().toISOString()
      }
      setLogs([newLog, ...logs].slice(0, 20))
    }
  }

  const handleItemDeleted = (id: string) => {
    const newItems = items.filter(i => i.id !== id)
    setItems(newItems)
    updateLocalStats(newItems)
    setLogs(logs.filter(l => l.inventory_item_id !== id))
  }

  const handleInvoiceSuccess = (updatedBatch: InventoryItem[]) => {
    let newItems = [...items]
    const newLogs: InventoryLog[] = []
    
    updatedBatch.forEach(updated => {
      const itemWithStatus = calculateItemStatus(updated)
      const idx = newItems.findIndex(i => i.id === updated.id)
      const isNew = idx === -1
      
      if (isNew) {
        newItems.push(itemWithStatus)
      } else {
        const oldItem = newItems[idx]
        newItems[idx] = itemWithStatus
        
        newLogs.push({
          id: Math.random().toString(),
          inventory_item_id: updated.id,
          business_id: businessId,
          item_name: updated.name,
          change_type: 'invoice',
          quantity_change: updated.quantity - oldItem.quantity,
          notes: 'Extracted from invoice',
          created_at: new Date().toISOString()
        })
      }
    })
    
    setItems(newItems)
    updateLocalStats(newItems)
    setLogs([...newLogs, ...logs].slice(0, 20))
  }

  const openEdit = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsEditOpen(true)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.totalItems} items &middot; {formatCurrency(stats.totalValue)} total stock value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Item
          </Button>
          <Button onClick={() => setIsSnapOpen(true)}>
            <Camera className="w-4 h-4 mr-2" />
            Snap Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Items</p>
          <p className="text-2xl font-bold">{stats.totalItems}</p>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Value</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className={`border rounded-xl p-4 bg-card ${stats.lowCount > 0 ? 'border-amber-200 bg-amber-50/30 dark:bg-amber-950/20' : ''}`}>
          <p className="text-sm font-medium text-muted-foreground mb-1">Low Stock</p>
          <p className={`text-2xl font-bold ${stats.lowCount > 0 ? 'text-amber-600 dark:text-amber-500' : ''}`}>
            {stats.lowCount}
          </p>
        </div>
        <div className={`border rounded-xl p-4 bg-card ${stats.criticalCount > 0 ? 'border-red-200 bg-red-50/30 dark:bg-red-950/20' : ''}`}>
          <p className="text-sm font-medium text-muted-foreground mb-1">Critical Stock</p>
          <p className={`text-2xl font-bold ${stats.criticalCount > 0 ? 'text-red-600 dark:text-red-500' : ''}`}>
            {stats.criticalCount}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <div className="xl:col-span-3 space-y-6">
          {/* Restock Recommendations (AI) */}
          <RestockPanel businessId={businessId} />

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={activeFilter} onValueChange={(v: string) => setActiveFilter(v as FilterStatus)} className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <TabsList className="w-max md:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="critical">Critical</TabsTrigger>
                <TabsTrigger value="low">Low Stock</TabsTrigger>
                <TabsTrigger value="ok">In Stock</TabsTrigger>
                <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Table Area */}
          {items.length === 0 ? (
            <EmptyState
              icon={<LayoutDashboard className="w-12 h-12" />}
              title="No inventory items yet"
              description="Add your first item manually or scan a supplier invoice to automatically import items."
              action={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAddOpen(true)}>Add Item</Button>
                  <Button onClick={() => setIsSnapOpen(true)}>Snap Invoice</Button>
                </div>
              }
              className="border rounded-xl bg-card py-20"
            />
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="border rounded-xl bg-card p-12 text-center text-muted-foreground">
              No items match your search or filter.
            </div>
          ) : (
            <InventoryTable
              items={filteredAndSortedItems}
              onEdit={openEdit}
              onDelete={(item) => {
                setSelectedItem(item)
                setIsEditOpen(true) // The delete confirm is inside the edit modal
              }}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </div>

        {/* Sidebar: Activity Log */}
        <div className="xl:col-span-1 border rounded-xl bg-card p-4 h-fit sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Activity</h3>
            {logs.length > 0 && (
              <Link 
                href="/inventory/activity-history"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent stock changes.</p>
          ) : (
            <div className="space-y-4">
              {logs.map(log => {
                const isAdd = log.quantity_change > 0
                return (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="mt-0.5">
                      {log.change_type === 'invoice' ? '🧾' : 
                       log.change_type === 'adjust' ? '✏️' : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {log.item_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`font-semibold ${isAdd ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isAdd ? '+' : ''}{log.quantity_change}
                        </span>
                        <span className="text-muted-foreground capitalize text-xs bg-muted px-1.5 py-0.5 rounded">
                          {log.change_type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ItemFormModal
        mode="add"
        businessId={businessId}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleItemAdded}
      />

      <ItemFormModal
        mode="edit"
        item={selectedItem}
        businessId={businessId}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setTimeout(() => setSelectedItem(null), 200)
        }}
        onSuccess={handleItemUpdated}
        onDelete={handleItemDeleted}
      />

      <SnapInvoiceModal
        businessId={businessId}
        isOpen={isSnapOpen}
        onClose={() => setIsSnapOpen(false)}
        onSuccess={handleInvoiceSuccess}
      />
    </div>
  )
}
