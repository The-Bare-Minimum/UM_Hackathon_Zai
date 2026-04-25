'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/constants'
import type { Expense } from '@/types'

interface Props {
  businessId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (expense: Expense) => void
  editExpense?: Expense
}

export function AddExpenseModal({ businessId, open, onOpenChange, onSuccess, editExpense }: Props) {
  const isEdit = !!editExpense
  const today = new Date().toISOString().split('T')[0]

  const [description, setDescription] = useState(editExpense?.description || '')
  const [category, setCategory] = useState(editExpense?.category || '')
  const [amount, setAmount] = useState(editExpense?.amount?.toString() || '')
  const [expenseDate, setExpenseDate] = useState(editExpense?.expense_date || today)
  const [paymentMethod, setPaymentMethod] = useState(editExpense?.payment_method || '')
  const [vendor, setVendor] = useState(editExpense?.vendor || '')
  const [notes, setNotes] = useState(editExpense?.notes || '')
  const [isRecurring, setIsRecurring] = useState(editExpense?.is_recurring || false)
  const [recurrencePeriod, setRecurrencePeriod] = useState(editExpense?.recurrence_period || '')
  const [subscriptionName, setSubscriptionName] = useState(editExpense?.subscription_name || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description || !category || !amount || Number(amount) <= 0) {
      toast.error('Please fill in all required fields')
      return
    }
    if (isRecurring && !recurrencePeriod) {
      toast.error('Recurring expenses need a period')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        business_id: businessId,
        description,
        category,
        amount: Number(amount),
        expense_date: expenseDate,
        is_recurring: isRecurring,
        recurrence_period: isRecurring ? recurrencePeriod : null,
        subscription_name: isRecurring ? subscriptionName || null : null,
        vendor: vendor || null,
        notes: notes || null,
        payment_method: paymentMethod || null,
      }

      const url = isEdit ? `/api/expenses/${editExpense!.id}` : '/api/expenses'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }

      const data = await res.json()
      toast.success(isEdit ? 'Expense updated' : 'Expense recorded')
      onSuccess(data.expense)
      onOpenChange(false)

      // Reset form
      if (!isEdit) {
        setDescription('')
        setCategory('')
        setAmount('')
        setExpenseDate(today)
        setPaymentMethod('')
        setVendor('')
        setNotes('')
        setIsRecurring(false)
        setRecurrencePeriod('')
        setSubscriptionName('')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g. Wet market purchase"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Category + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount (RM) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Date + Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendor + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                placeholder="e.g. Pasar Borong KL"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Optional notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Recurring Toggle */}
          <div className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="recurring" className="cursor-pointer">This is a recurring expense</Label>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <Label>Period *</Label>
                  <Select value={recurrencePeriod} onValueChange={setRecurrencePeriod}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subName">Subscription Name</Label>
                  <Input
                    id="subName"
                    placeholder="e.g. POS Software"
                    value={subscriptionName}
                    onChange={e => setSubscriptionName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
