'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Copy, Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { RestockRecommendation } from '@/types'

interface RestockPanelProps {
  businessId: string
}

const URGENCY_CONFIG = {
  immediate: { label: 'Order Today', color: 'bg-red-500' },
  this_week: { label: 'Order This Week', color: 'bg-amber-500' },
  next_week: { label: 'Plan for Next Week', color: 'bg-blue-500' },
}

const ITEMS_PER_PAGE = 3

export function RestockPanel({ businessId }: RestockPanelProps) {
  const [recommendations, setRecommendations] = useState<RestockRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch('/api/ai/restock-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_id: businessId }),
        })
        const data = await res.json()
        if (res.ok && Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations)
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [businessId])

  const handleCopy = (rec: RestockRecommendation, index: number) => {
    const text = `Order ${rec.recommended_order_quantity} ${rec.current_unit} of ${rec.item_name}`
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Calculate pagination
  const totalPages = Math.ceil(recommendations.length / ITEMS_PER_PAGE)
  const startIndex = currentPage * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentRecommendations = recommendations.slice(startIndex, endIndex)

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
  }

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <div className="p-4 md:p-6 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">Restock Recommendations</h2>
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Based on current stock levels and recent sales velocity
          </p>
        </div>
        {recommendations.length > ITEMS_PER_PAGE && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, recommendations.length)} of {recommendations.length}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handlePrevious}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleNext}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Z.AI is analyzing your inventory...</span>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-emerald-700">All stock levels are healthy</p>
              <p className="text-sm text-muted-foreground mt-1">
                No immediate restocking required based on current data.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentRecommendations.map((rec, index) => {
              const urgency = URGENCY_CONFIG[rec.urgency] || URGENCY_CONFIG.this_week
              const actualIndex = startIndex + index
              
              return (
                <div key={actualIndex} className="border rounded-lg p-4 bg-background relative overflow-hidden group hover:border-primary/50 transition-colors">
                  {/* Left accent color strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${urgency.color}`} />
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${urgency.color}`} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {urgency.label}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base mb-1">{rec.item_name}</h3>
                  <div className="text-2xl font-bold text-primary mb-2">
                    Order {rec.recommended_order_quantity} {rec.current_unit}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 min-h-[40px]">
                    {rec.reason}
                  </p>
                  
                  <div className="flex items-end justify-between mt-auto pt-3 border-t">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                        Est. Cost
                      </p>
                      <p className="font-medium">
                        RM {rec.estimated_cost.toFixed(2)}
                      </p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-1.5"
                      onClick={() => handleCopy(rec, actualIndex)}
                    >
                      {copiedIndex === actualIndex ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className={copiedIndex === actualIndex ? 'text-emerald-500' : ''}>
                        {copiedIndex === actualIndex ? 'Copied' : 'Copy'}
                      </span>
                    </Button>
                  </div>

                  {rec.supplier_tip && (
                    <div className="mt-3 text-[11px] font-semibold text-muted-foreground bg-muted/50 p-2 rounded">
                      💡 {rec.supplier_tip}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
