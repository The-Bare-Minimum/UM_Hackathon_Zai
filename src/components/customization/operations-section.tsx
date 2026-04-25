'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DAYS_OF_WEEK } from '@/lib/constants'
import type { BusinessRulesFormData } from '@/types'

interface Props {
  formData: BusinessRulesFormData
  updateField: <K extends keyof BusinessRulesFormData>(key: K, value: BusinessRulesFormData[K]) => void
}

export function OperationsSection({ formData, updateField }: Props) {
  const toggleDay = (type: 'peak_days' | 'slow_days', day: string) => {
    const current = formData[type] || []
    if (current.includes(day)) {
      updateField(type, current.filter((d) => d !== day))
    } else {
      updateField(type, [...current, day])
    }
  }

  const overlapDays = (formData.peak_days || []).filter((d) => (formData.slow_days || []).includes(d))

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold">Operations</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tell Zara when your business is busiest so recommendations are timed right.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Peak days */}
        <div className="space-y-3">
          <Label>Peak days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={`peak-${day}`}
                type="button"
                onClick={() => toggleDay('peak_days', day)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  (formData.peak_days || []).includes(day)
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Zara ensures full stock and staffing on these days</p>
        </div>

        {/* Slow days */}
        <div className="space-y-3">
          <Label>Slow days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={`slow-${day}`}
                type="button"
                onClick={() => toggleDay('slow_days', day)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  (formData.slow_days || []).includes(day)
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-background text-muted-foreground border-border hover:border-amber-400/50'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          {overlapDays.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              ⚠️ {overlapDays.join(', ')} {overlapDays.length === 1 ? 'is' : 'are'} already marked as peak
            </div>
          )}
          <p className="text-xs text-muted-foreground">Zara may suggest promotions or reduced prep on these days</p>
        </div>

        {/* Buffer times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="opening_buffer_mins">Pre-opening buffer (minutes)</Label>
            <div className="relative">
              <Input
                id="opening_buffer_mins"
                type="number"
                min={0}
                max={120}
                value={formData.opening_buffer_mins}
                onChange={(e) => updateField('opening_buffer_mins', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">min</span>
            </div>
            <p className="text-xs text-muted-foreground">Preparation time before opening</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="closing_buffer_mins">Post-closing buffer (minutes)</Label>
            <div className="relative">
              <Input
                id="closing_buffer_mins"
                type="number"
                min={0}
                max={120}
                value={formData.closing_buffer_mins}
                onChange={(e) => updateField('closing_buffer_mins', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">min</span>
            </div>
            <p className="text-xs text-muted-foreground">Cleanup time after closing</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
