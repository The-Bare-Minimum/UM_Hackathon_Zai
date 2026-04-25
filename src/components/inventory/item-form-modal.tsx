'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { InventoryItem } from '@/types'

interface ItemFormModalProps {
  mode: 'add' | 'edit'
  item?: InventoryItem | null
  businessId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (item: InventoryItem) => void
  onDelete?: (id: string) => void
}

const CATEGORIES = [
  'Meat',
  'Seafood',
  'Vegetables',
  'Dairy',
  'Dry Goods',
  'Beverages',
  'Condiments',
  'Cooking',
  'Other',
]

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'box', 'bag', 'bottle', 'Other']

export function ItemFormModal({
  mode,
  item,
  businessId,
  isOpen,
  onClose,
  onSuccess,
  onDelete,
}: ItemFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('')
  const [customUnit, setCustomUnit] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [reorderLevel, setReorderLevel] = useState('0')
  const [costPerUnit, setCostPerUnit] = useState('0')
  const [supplier, setSupplier] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  useEffect(() => {
    if (isOpen && mode === 'edit' && item) {
      setShowDeleteConfirm(false)
      setName(item.name)
      setCategory(item.category)
      
      if (UNITS.includes(item.unit)) {
        setUnit(item.unit)
        setCustomUnit('')
      } else {
        setUnit('Other')
        setCustomUnit(item.unit)
      }

      setQuantity(item.quantity.toString())
      setReorderLevel(item.reorder_level.toString())
      setCostPerUnit(item.cost_per_unit.toString())
      setSupplier(item.supplier || '')
      setExpiryDate(item.expiry_date ? item.expiry_date.split('T')[0] : '')
      
    } else if (isOpen && mode === 'add') {
      // Reset form for 'add'
      setShowDeleteConfirm(false)
      setName('')
      setCategory('')
      setUnit('')
      setCustomUnit('')
      setQuantity('0')
      setReorderLevel('0')
      setCostPerUnit('0')
      setSupplier('')
      setExpiryDate('')
    }
  }, [isOpen, mode, item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalUnit = unit === 'Other' ? customUnit : unit
    if (!name || !category || !finalUnit) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        business_id: businessId,
        name,
        category,
        quantity: parseFloat(quantity) || 0,
        unit: finalUnit,
        reorder_level: parseFloat(reorderLevel) || 0,
        cost_per_unit: parseFloat(costPerUnit) || 0,
        supplier,
        expiry_date: expiryDate || null,
      }

      const url = mode === 'add' 
        ? '/api/inventory' 
        : `/api/inventory/${item?.id}`
        
      const method = mode === 'add' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Failed to save item')

      toast.success(mode === 'add' ? 'Item added successfully' : 'Item updated successfully')
      onSuccess(result.data)
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!item || !onDelete) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'DELETE',
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to delete item')

      toast.success('Item deleted successfully')
      onDelete(item.id)
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Live preview calculations
  const currentQuantity = parseFloat(quantity) || 0
  const currentCost = parseFloat(costPerUnit) || 0
  const stockValue = currentQuantity * currentCost
  const reorder = parseFloat(reorderLevel) || 0
  
  let statusBadge = { label: 'In Stock', className: 'bg-emerald-100 text-emerald-800' }
  if (currentQuantity <= 0) statusBadge = { label: 'Critical', className: 'bg-red-100 text-red-800' }
  else if (currentQuantity <= reorder) statusBadge = { label: 'Low Stock', className: 'bg-amber-100 text-amber-800' }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Item' : 'Edit Item'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Enter the details of the new inventory item.' : 'Update the inventory item details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Chicken Breast"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select 
                key={`category-${item?.id || 'new'}-${category}`}
                value={category} 
                onValueChange={(val) => {
                  setCategory(val)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {category && <p className="text-xs text-muted-foreground">Current: {category}</p>}
            </div>

            <div className="space-y-2">
              <Label>Unit <span className="text-red-500">*</span></Label>
              <Select 
                key={`unit-${item?.id || 'new'}-${unit}`}
                value={unit} 
                onValueChange={(val) => {
                  setUnit(val)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit..." />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unit && <p className="text-xs text-muted-foreground">Current: {unit}</p>}
            </div>
            
            {unit === 'Other' && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customUnit">Custom Unit <span className="text-red-500">*</span></Label>
                <Input
                  id="customUnit"
                  placeholder="e.g. packet"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  required={unit === 'Other'}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Current Quantity <span className="text-red-500">*</span></Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level <span className="text-red-500">*</span></Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                step="0.01"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost per Unit (RM)</Label>
              <Input
                id="costPerUnit"
                type="number"
                min="0"
                step="0.01"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier (Optional)</Label>
              <Input
                id="supplier"
                placeholder="e.g. Fresh Foods LLC"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between border">
            <div>
              <p className="text-sm font-medium">Current stock value:</p>
              <p className="text-xl font-bold text-primary">RM {stockValue.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium mb-1">Status:</p>
              <Badge variant="outline" className={statusBadge.className}>
                {statusBadge.label}
              </Badge>
            </div>
          </div>

          {mode === 'edit' && !showDeleteConfirm && (
            <div className="pt-2 flex justify-end">
              <button 
                type="button" 
                className="text-sm text-destructive hover:underline"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Item
              </button>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="p-4 mt-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3">
              <p className="text-sm font-medium text-destructive">Are you sure? This cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'add' ? 'Add Item' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
