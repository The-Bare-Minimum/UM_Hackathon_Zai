'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { REORDER_DAYS } from '@/lib/constants'
import type { BusinessRulesFormData, ReorderDay } from '@/types'

interface Props {
  formData: BusinessRulesFormData
  updateField: <K extends keyof BusinessRulesFormData>(key: K, value: BusinessRulesFormData[K]) => void
}

export function InventoryRulesSection({ formData, updateField }: Props) {
  const leadDays = parseInt(formData.reorder_lead_days) || 2
  const exampleRunOut = 5
  const alertDay = Math.max(exampleRunOut - leadDays, 0)

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <div>
          <h3 className="text-lg font-semibold">Inventory Rules</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Control how Zara manages your stock recommendations.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reorder lead time */}
          <div className="space-y-2">
            <Label htmlFor="reorder_lead_days">Reorder lead time (days)</Label>
            <Input
              id="reorder_lead_days"
              type="number"
              min={1}
              max={14}
              value={formData.reorder_lead_days}
              onChange={(e) => updateField('reorder_lead_days', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              How many days before running out should Zara recommend reordering?
            </p>
            {/* Visual example */}
            <div className="bg-muted/50 rounded-lg p-3 mt-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Example:</span> If stock runs out in {exampleRunOut} days and lead time is {leadDays} days → Zara alerts you in {alertDay} day{alertDay !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Min stock buffer */}
          <div className="space-y-2">
            <Label htmlFor="min_stock_buffer_days">Minimum stock buffer (days)</Label>
            <Input
              id="min_stock_buffer_days"
              type="number"
              min={1}
              max={30}
              value={formData.min_stock_buffer_days}
              onChange={(e) => updateField('min_stock_buffer_days', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Always keep this many days of stock as safety buffer
            </p>
          </div>

          {/* Preferred restock day */}
          <div className="space-y-2">
            <Label htmlFor="preferred_restock_day">Preferred restock day</Label>
            <Select
              value={formData.preferred_restock_day}
              onValueChange={(v) => updateField('preferred_restock_day', v as ReorderDay)}
            >
              <SelectTrigger id="preferred_restock_day">
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {REORDER_DAYS.map((day) => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Zara will time restock recommendations around this day
            </p>
          </div>

          {/* Auto reorder toggle */}
          <div className="space-y-2">
            <Label>Auto reorder suggestions</Label>
            <button
              type="button"
              onClick={() => updateField('auto_reorder_enabled', !formData.auto_reorder_enabled)}
              className={`relative w-full flex items-center gap-3 rounded-lg border p-4 transition-all duration-200 text-left ${
                formData.auto_reorder_enabled
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div
                className={`w-10 h-6 rounded-full relative transition-colors duration-200 shrink-0 ${
                  formData.auto_reorder_enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    formData.auto_reorder_enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {formData.auto_reorder_enabled ? 'Enabled' : 'Disabled'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formData.auto_reorder_enabled
                    ? 'Zara will proactively suggest orders before you ask'
                    : 'Zara will only recommend when you ask or when stock is critical'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
