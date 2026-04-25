'use client'

import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Package, Activity } from 'lucide-react'
import type { BusinessRulesFormData } from '@/types'

interface Props {
  formData: BusinessRulesFormData
  isConfigured: boolean
}

export function RulesImpactPreview({ formData, isConfigured }: Props) {
  if (!isConfigured && !formData.target_food_cost_pct) {
    return (
      <Card className="shadow-sm bg-muted/30 border-dashed">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Configure your rules below to see a personalised summary here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-primary/20 bg-primary/[0.02]">
      <CardContent className="py-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold">Your Rules at a Glance</h3>
          <span className="text-xs text-muted-foreground">— This is how Zara currently understands your business</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Financial */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Zara will alert if:</p>
            <ul className="text-xs text-foreground space-y-1">
              <li>• Food cost exceeds <span className="font-semibold">{formData.target_food_cost_pct}%</span></li>
              <li>• Labor cost exceeds <span className="font-semibold">{formData.target_labor_cost_pct}%</span></li>
              <li>• Weekly waste exceeds <span className="font-semibold">RM{formData.waste_tolerance_rm}</span></li>
            </ul>
          </div>

          {/* Inventory */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inventory</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Zara will recommend restocking:</p>
            <ul className="text-xs text-foreground space-y-1">
              <li>• <span className="font-semibold">{formData.reorder_lead_days}</span> days before running out</li>
              <li>• Every <span className="font-semibold">{formData.preferred_restock_day}</span></li>
              <li>• With <span className="font-semibold">{formData.min_stock_buffer_days}</span> days safety buffer</li>
            </ul>
          </div>

          {/* Operations */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operations</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Zara knows:</p>
            <ul className="text-xs text-foreground space-y-1">
              <li>• Peak: <span className="font-semibold">{(formData.peak_days || []).join(', ') || 'Not set'}</span></li>
              <li>• Slow: <span className="font-semibold">{(formData.slow_days || []).join(', ') || 'Not set'}</span></li>
              <li>• Style: <span className="font-semibold capitalize">{formData.ai_tone}</span></li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
