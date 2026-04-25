'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BusinessRulesFormData } from '@/types'

interface Props {
  formData: BusinessRulesFormData
  updateField: <K extends keyof BusinessRulesFormData>(key: K, value: BusinessRulesFormData[K]) => void
  currency: string
}

function getCostIndicator(value: number, type: 'food' | 'labor') {
  if (type === 'food') {
    if (value < 28) return { label: 'Excellent', color: 'text-emerald-600 bg-emerald-50' }
    if (value <= 35) return { label: 'Good', color: 'text-teal-600 bg-teal-50' }
    if (value <= 40) return { label: 'Watch this', color: 'text-amber-600 bg-amber-50' }
    return { label: 'Too high', color: 'text-red-600 bg-red-50' }
  }
  // labor
  if (value < 25) return { label: 'Excellent', color: 'text-emerald-600 bg-emerald-50' }
  if (value <= 35) return { label: 'Good', color: 'text-teal-600 bg-teal-50' }
  if (value <= 40) return { label: 'Watch this', color: 'text-amber-600 bg-amber-50' }
  return { label: 'Too high', color: 'text-red-600 bg-red-50' }
}

export function FinancialTargetsSection({ formData, updateField, currency }: Props) {
  const foodIndicator = getCostIndicator(parseFloat(formData.target_food_cost_pct) || 0, 'food')
  const laborIndicator = getCostIndicator(parseFloat(formData.target_labor_cost_pct) || 0, 'labor')

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <div>
          <h3 className="text-lg font-semibold">Financial Targets</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set revenue goals and cost limits. Zara will alert you when these thresholds are at risk.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly ingredient budget */}
          <div className="space-y-2">
            <Label htmlFor="weekly_ingredient_budget">Weekly ingredient budget (RM)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                id="weekly_ingredient_budget"
                type="number"
                className="pl-10"
                placeholder="e.g. 800"
                value={formData.weekly_ingredient_budget}
                onChange={(e) => updateField('weekly_ingredient_budget', e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Zara won&apos;t recommend restocking that exceeds this per week</p>
          </div>

          {/* Monthly revenue target */}
          <div className="space-y-2">
            <Label htmlFor="monthly_revenue_target">Monthly revenue target (RM)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                id="monthly_revenue_target"
                type="number"
                className="pl-10"
                placeholder="e.g. 15000"
                value={formData.monthly_revenue_target}
                onChange={(e) => updateField('monthly_revenue_target', e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Track progress toward this goal</p>
          </div>

          {/* Target food cost % */}
          <div className="space-y-2">
            <Label htmlFor="target_food_cost_pct">Target food cost (%)</Label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  id="target_food_cost_pct"
                  type="number"
                  min={1}
                  max={80}
                  value={formData.target_food_cost_pct}
                  onChange={(e) => updateField('target_food_cost_pct', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${foodIndicator.color}`}>
                {foodIndicator.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Industry standard: 28-35%</p>
          </div>

          {/* Target labor cost % */}
          <div className="space-y-2">
            <Label htmlFor="target_labor_cost_pct">Target labor cost (%)</Label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  id="target_labor_cost_pct"
                  type="number"
                  min={1}
                  max={80}
                  value={formData.target_labor_cost_pct}
                  onChange={(e) => updateField('target_labor_cost_pct', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${laborIndicator.color}`}>
                {laborIndicator.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Industry standard: 25-35%</p>
          </div>

          {/* Target profit margin % */}
          <div className="space-y-2">
            <Label htmlFor="target_profit_margin_pct">Target profit margin (%)</Label>
            <div className="relative">
              <Input
                id="target_profit_margin_pct"
                type="number"
                min={0}
                max={90}
                value={formData.target_profit_margin_pct}
                onChange={(e) => updateField('target_profit_margin_pct', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Net profit after all expenses</p>
          </div>

          {/* Waste tolerance */}
          <div className="space-y-2">
            <Label htmlFor="waste_tolerance_rm">Waste tolerance (RM/week)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                id="waste_tolerance_rm"
                type="number"
                className="pl-10"
                value={formData.waste_tolerance_rm}
                onChange={(e) => updateField('waste_tolerance_rm', e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Alert me when waste exceeds this amount</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
