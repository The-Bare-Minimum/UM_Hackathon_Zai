'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { BusinessRulesFormData } from '@/types'

interface Props {
  formData: BusinessRulesFormData
  updateField: <K extends keyof BusinessRulesFormData>(key: K, value: BusinessRulesFormData[K]) => void
}

const MAX_CHARS = 500

export function CustomRulesSection({ formData, updateField }: Props) {
  const charCount = (formData.custom_rules || '').length

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold">Custom Rules</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Write any additional rules in plain English. Zara will follow them exactly.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="custom_rules">Your custom rules</Label>
          <textarea
            id="custom_rules"
            className="flex w-full rounded-lg border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[160px]"
            placeholder={`Examples:\n- Never recommend ordering from Supplier X\n- Always prioritise reducing waste over increasing stock\n- Flag me if any item costs more than RM15/kg\n- On Sundays, suggest family meal promotions`}
            maxLength={MAX_CHARS}
            value={formData.custom_rules}
            onChange={(e) => updateField('custom_rules', e.target.value)}
          />
          <div className="flex justify-end">
            <span className={`text-xs ${charCount > MAX_CHARS * 0.9 ? 'text-amber-600' : 'text-muted-foreground'}`}>
              {charCount}/{MAX_CHARS} characters
            </span>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            How Zara will read this
          </p>
          {formData.custom_rules ? (
            <div className="bg-background rounded-md p-3 border text-sm text-foreground">
              <span className="text-xs font-medium text-primary">Custom rules active: </span>
              <span className="text-xs text-muted-foreground">
                {formData.custom_rules.length > 120
                  ? formData.custom_rules.substring(0, 120) + '...'
                  : formData.custom_rules}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Your custom rules will be included in every AI prompt exactly as written above.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
