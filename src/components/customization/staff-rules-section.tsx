'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BusinessRulesFormData } from '@/types'

interface Props {
  formData: BusinessRulesFormData
  updateField: <K extends keyof BusinessRulesFormData>(key: K, value: BusinessRulesFormData[K]) => void
}

export function StaffRulesSection({ formData, updateField }: Props) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <div>
          <h3 className="text-lg font-semibold">Staff Rules</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set boundaries for staffing recommendations.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Max weekly hours */}
          <div className="space-y-2">
            <Label htmlFor="max_weekly_staff_hours">Max weekly hours per staff</Label>
            <div className="relative">
              <Input
                id="max_weekly_staff_hours"
                type="number"
                min={20}
                max={84}
                value={formData.max_weekly_staff_hours}
                onChange={(e) => updateField('max_weekly_staff_hours', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">hrs</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Zara won&apos;t suggest schedules exceeding this limit per person
            </p>
          </div>

          {/* Max overtime */}
          <div className="space-y-2">
            <Label htmlFor="max_overtime_hours">Max overtime per week</Label>
            <div className="relative">
              <Input
                id="max_overtime_hours"
                type="number"
                min={0}
                max={20}
                value={formData.max_overtime_hours}
                onChange={(e) => updateField('max_overtime_hours', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">hrs</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Included in max weekly hours above
            </p>
          </div>

          {/* Min staff per shift */}
          <div className="space-y-2">
            <Label htmlFor="min_staff_per_shift">Minimum staff per shift</Label>
            <Input
              id="min_staff_per_shift"
              type="number"
              min={1}
              max={10}
              value={formData.min_staff_per_shift}
              onChange={(e) => updateField('min_staff_per_shift', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Minimum coverage for any shift
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
