'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, Scale, TrendingUp, Bell, BellOff, BellRing } from 'lucide-react'
import { AI_TONE_OPTIONS, ALERT_SENSITIVITY_OPTIONS } from '@/lib/constants'
import type { BusinessRulesFormData, AiTone, AlertSensitivity } from '@/types'

interface Props {
  formData: BusinessRulesFormData
  updateField: <K extends keyof BusinessRulesFormData>(key: K, value: BusinessRulesFormData[K]) => void
}

const toneIcons = { conservative: Shield, balanced: Scale, aggressive: TrendingUp }
const alertIcons = { low: BellOff, medium: Bell, high: BellRing }

export function AiBehaviourSection({ formData, updateField }: Props) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold">AI Behaviour</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customise how Zara communicates and what she prioritises.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Advice style */}
        <div className="space-y-3">
          <Label>Advice style</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {AI_TONE_OPTIONS.map((opt) => {
              const Icon = toneIcons[opt.value]
              const selected = formData.ai_tone === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('ai_tone', opt.value as AiTone)}
                  className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    selected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-muted-foreground/30 bg-background'
                  }`}
                >
                  {opt.value === 'balanced' && (
                    <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0">
                      Recommended
                    </Badge>
                  )}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                    selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Alert sensitivity */}
        <div className="space-y-3">
          <Label>Alert sensitivity</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ALERT_SENSITIVITY_OPTIONS.map((opt) => {
              const Icon = alertIcons[opt.value]
              const selected = formData.alert_sensitivity === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('alert_sensitivity', opt.value as AlertSensitivity)}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    selected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-muted-foreground/30 bg-background'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                    selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
