'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Search, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import type { Expense } from '@/types'

interface Props {
  businessId: string
  currency: string
  onAddExpense: () => void
}

export function ExpenseTable({ businessId, currency, onAddExpense }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('month')
  const [recurringOnly, setRecurringOnly] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 15

  const fetchExpenses = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/expenses?business_id=${businessId}&period=${periodFilter}${categoryFilter !== 'all' ? `&category=${categoryFilter}` : ''}`
      )
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.expenses || [])
      }
    } catch {}
    setIsLoading(false)
  }

  useEffect(() => {
    fetchExpenses()
  }, [businessId, periodFilter, categoryFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setExpenses(prev => prev.filter(e => e.id !== id))
        toast.success('Expense deleted')
      }
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  // Filter
  let filtered = expenses
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(e =>
      e.description.toLowerCase().includes(q) ||
      (e.vendor && e.vendor.toLowerCase().includes(q))
    )
  }
  if (recurringOnly) {
    filtered = filtered.filter(e => e.is_recurring)
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const paymentLabel = (m: string | null) => {
    const labels: Record<string, string> = {
      cash: 'Cash', bank_transfer: 'Bank', card: 'Card', ewallet: 'E-Wallet', other: 'Other'
    }
    return m ? labels[m] || m : ''
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-lg">All Expenses</h3>
          <Button size="sm" onClick={onAddExpense} className="gap-1.5">
            <PlusCircle className="w-4 h-4" />
            Add Expense
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 h-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={v => { setPeriodFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={recurringOnly ? 'default' : 'outline'}
            size="sm"
            className="h-9 gap-1"
            onClick={() => { setRecurringOnly(!recurringOnly); setPage(1) }}
          >
            <RefreshCw className="w-3 h-3" />
            Recurring
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">No expenses recorded yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onAddExpense}>
              Add your first expense
            </Button>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-left py-2 font-medium">Description</th>
                    <th className="text-left py-2 font-medium">Category</th>
                    <th className="text-right py-2 font-medium">Amount</th>
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-right py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(expense => (
                    <tr key={expense.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 text-muted-foreground text-xs">
                        {new Date(expense.expense_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2.5">
                        <p className="font-medium truncate max-w-[200px]">{expense.description}</p>
                        {expense.vendor && (
                          <p className="text-[11px] text-muted-foreground">{expense.vendor}</p>
                        )}
                      </td>
                      <td className="py-2.5">
                        <Badge variant="secondary" className="text-[10px]">{expense.category}</Badge>
                      </td>
                      <td className="py-2.5 text-right font-bold">
                        RM{Number(expense.amount).toFixed(2)}
                      </td>
                      <td className="py-2.5">
                        {expense.is_recurring ? (
                          <div>
                            <Badge variant="outline" className="text-[9px] gap-0.5">
                              <RefreshCw className="w-2.5 h-2.5" />
                              {expense.recurrence_period}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{paymentLabel(expense.payment_method)}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
