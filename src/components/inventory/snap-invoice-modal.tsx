'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, FileText, CheckCircle2, AlertCircle, X, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { InventoryItem, ExtractedInvoiceItem } from '@/types'

interface SnapInvoiceModalProps {
  businessId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedItems: InventoryItem[]) => void
}

const CATEGORIES = [
  'Meat',
  'Seafood',
  'Vegetables',
  'Dairy',
  'Dry Goods',
  'Beverages',
  'Condiments',
  'Other',
]

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'box', 'bag', 'bottle']

export function SnapInvoiceModal({
  businessId,
  isOpen,
  onClose,
  onSuccess,
}: SnapInvoiceModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingMsg, setLoadingMsg] = useState('Reading item names...')
  
  const [extractedItems, setExtractedItems] = useState<ExtractedInvoiceItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [invoiceTotal, setInvoiceTotal] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updateStats, setUpdateStats] = useState({ updated: 0, created: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setFile(null)
      setPreviewUrl(null)
      setExtractedItems([])
      setSelectedItems(new Set())
      setIsSubmitting(false)
    }
  }, [isOpen])

  // Cycle loading messages in Step 2
  useEffect(() => {
    if (step === 2) {
      const messages = [
        'Reading item names...',
        'Extracting quantities...',
        'Identifying prices...',
        'Matching to your inventory...'
      ]
      let i = 0
      const interval = setInterval(() => {
        i = (i + 1) % messages.length
        setLoadingMsg(messages[i])
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [step])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 10MB.')
        return
      }
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const handleSampleInvoice = async () => {
    try {
      // In a real scenario, this would fetch a sample image from the public folder
      // For demo, we just simulate the API response immediately
      setStep(2)
      
      setTimeout(() => {
        const mockItems: ExtractedInvoiceItem[] = [
          {
            name: "Chicken Breast",
            name_original: "Dada Ayam 1KG",
            quantity: 5,
            unit: "kg",
            unit_price: 15.50,
            total_price: 77.50,
            category: "Meat",
            matchedItemId: "mock-1",
            matchedItemName: "Chicken Breast"
          },
          {
            name: "Cooking Oil",
            name_original: "Minyak Masak 5L",
            quantity: 2,
            unit: "bottle",
            unit_price: 28.00,
            total_price: 56.00,
            category: "Dry Goods",
            matchedItemId: "mock-2",
            matchedItemName: "Cooking Oil 5L"
          },
          {
            name: "Tomato Sauce",
            name_original: "Sos Tomato A1",
            quantity: 12,
            unit: "bottle",
            unit_price: 4.50,
            total_price: 54.00,
            category: "Condiments",
            matchedItemId: null,
            matchedItemName: null
          }
        ]
        
        setExtractedItems(mockItems)
        setSelectedItems(new Set([0, 1, 2]))
        setInvoiceTotal(187.50)
        setStep(3)
      }, 3000)
    } catch (err) {
      toast.error('Failed to load sample invoice')
      setStep(1)
    }
  }

  const processInvoice = async () => {
    if (!file) return

    setStep(2)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('business_id', businessId)

      const res = await fetch('/api/ai/scan-invoice', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process invoice')
      }

      if (data.items.length === 0) {
        throw new Error('No items found in the invoice')
      }

      setExtractedItems(data.items)
      // Select all by default
      setSelectedItems(new Set(data.items.map((_: any, i: number) => i)))
      setInvoiceTotal(data.totalValue)
      setStep(3)
    } catch (error: any) {
      toast.error(error.message)
      setStep(1)
    }
  }

  const toggleItemSelection = (index: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedItems(newSelected)
  }

  const updateItemField = (index: number, field: keyof ExtractedInvoiceItem, value: any) => {
    const newItems = [...extractedItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setExtractedItems(newItems)
  }

  const handleConfirm = async () => {
    const itemsToUpdate = extractedItems
      .filter((_, i) => selectedItems.has(i))
      .map(item => ({
        id: item.matchedItemId,
        name: item.name,
        quantity_change: item.quantity,
        unit: item.unit,
        cost_per_unit: item.unit_price,
        category: item.category,
        notes: `Extracted from invoice`,
      }))

    if (itemsToUpdate.length === 0) {
      toast.error('Please select at least one item to update')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/inventory/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          items: itemsToUpdate,
          source: 'invoice',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update inventory')

      setUpdateStats({ updated: data.updated, created: data.created })
      onSuccess(data.items)
      setStep(4)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center">
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
              step === i
                ? 'bg-primary text-primary-foreground'
                : step > i
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {step > i ? <Check className="w-3.5 h-3.5" /> : i}
          </div>
          {i < 4 && (
            <div
              className={`w-12 h-[2px] mx-2 ${
                step > i ? 'bg-primary/20' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={step === 2 || isSubmitting ? undefined : onClose}>
      <DialogContent className="max-w-3xl p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <StepIndicator />

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Snap Invoice</h2>
              <p className="text-muted-foreground mt-2">
                Take a photo or upload an image of your supplier invoice or delivery receipt
              </p>
            </div>

            {!previewUrl ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-12 h-12 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-1">Take Photo / Upload</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    JPG, PNG, WebP up to 10MB
                  </p>
                  <Input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                <div 
                  className="border border-border bg-card rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleSampleInvoice}
                >
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-1">Use Sample</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Try it out with a demo invoice
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border bg-black/5 flex items-center justify-center h-[300px]">
                  <img 
                    src={previewUrl} 
                    alt="Invoice Preview" 
                    className="max-h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {file?.name} ({(file!.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreviewUrl(null); }}>
                    Change Image
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button disabled={!file} onClick={processInvoice}>
                Analyse Invoice &rarr;
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative w-32 h-32">
              <FileText className="w-full h-full text-muted stroke-1" />
              <div className="absolute inset-0 overflow-hidden rounded-sm">
                <div className="w-full h-1 bg-primary blur-[2px] animate-scan" style={{
                  animation: 'scan 2s linear infinite',
                  boxShadow: '0 0 8px var(--theme-primary)'
                }} />
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes scan {
                  0% { transform: translateY(-10px); }
                  100% { transform: translateY(130px); }
                }
              `}} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Analysing your invoice...</h2>
              <p className="text-primary font-medium animate-pulse">{loadingMsg}</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Review Extracted Items</h2>
              <p className="text-muted-foreground">
                Z.AI found {extractedItems.length} items &middot; Total: RM {invoiceTotal.toFixed(2)}
              </p>
            </div>

            <div className="border rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-3 text-left w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.size === extractedItems.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(new Set(extractedItems.map((_, i) => i)))
                          } else {
                            setSelectedItems(new Set())
                          }
                        }}
                        className="rounded border-muted-foreground"
                      />
                    </th>
                    <th className="p-3 text-left font-semibold">Item Name</th>
                    <th className="p-3 text-left font-semibold">Qty</th>
                    <th className="p-3 text-left font-semibold">Unit Price</th>
                    <th className="p-3 text-left font-semibold">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {extractedItems.map((item, index) => {
                    const isSelected = selectedItems.has(index)
                    return (
                      <tr key={index} className={isSelected ? 'bg-background' : 'bg-muted/20 opacity-50'}>
                        <td className="p-3">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleItemSelection(index)}
                            className="rounded border-muted-foreground"
                          />
                        </td>
                        <td className="p-3 space-y-1">
                          <Input 
                            value={item.name} 
                            onChange={(e) => updateItemField(index, 'name', e.target.value)}
                            disabled={!isSelected}
                            className="h-8"
                          />
                          {item.matchedItemName ? (
                            <p className="text-[10px] text-emerald-600 font-medium">
                              &rarr; Will update: {item.matchedItemName}
                            </p>
                          ) : (
                            <p className="text-[10px] text-blue-600 font-medium">
                              &rarr; Will create new item
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number"
                              value={item.quantity} 
                              onChange={(e) => updateItemField(index, 'quantity', parseFloat(e.target.value) || 0)}
                              disabled={!isSelected}
                              className="h-8 w-20"
                            />
                            <Select 
                              value={item.unit} 
                              onValueChange={(v) => updateItemField(index, 'unit', v)}
                              disabled={!isSelected}
                            >
                              <SelectTrigger className="h-8 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">RM</span>
                            <Input 
                              type="number"
                              value={item.unit_price} 
                              onChange={(e) => updateItemField(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              disabled={!isSelected}
                              className="h-8 w-24"
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <Select 
                            value={item.category} 
                            onValueChange={(v) => updateItemField(index, 'category', v)}
                            disabled={!isSelected}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                &larr; Back
              </Button>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedItems.size} items selected
                </span>
                <Button 
                  onClick={handleConfirm} 
                  disabled={selectedItems.size === 0 || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm & Update Inventory &rarr;
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-10 space-y-6">
            <div className="w-20 h-20 text-emerald-500 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Inventory Updated!</h2>
              <p className="text-muted-foreground">
                {updateStats.updated} items updated &middot; {updateStats.created} new items added
              </p>
            </div>

            <div className="flex items-center gap-4 pt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Scan Another Invoice
              </Button>
              <Button onClick={onClose}>
                View Inventory
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
