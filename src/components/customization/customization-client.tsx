'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { RotateCcw, Loader2, Check, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { RulesImpactPreview } from '@/components/customization/rules-impact-preview'
import { FinancialTargetsSection } from '@/components/customization/financial-targets-section'
import { InventoryRulesSection } from '@/components/customization/inventory-rules-section'
import { StaffRulesSection } from '@/components/customization/staff-rules-section'
import { OperationsSection } from '@/components/customization/operations-section'
import { AiBehaviourSection } from '@/components/customization/ai-behaviour-section'
import { CustomRulesSection } from '@/components/customization/custom-rules-section'
import { DEFAULT_RULES } from '@/lib/constants'
import type { BusinessRules, BusinessRulesFormData, AiTone, AlertSensitivity, ReorderDay } from '@/types'

interface CustomizationClientProps {
  businessId: string
  initialRules: BusinessRules | null
  currency: string
}

const SECTIONS = [
  { id: 'financial', label: 'Financial Targets' },
  { id: 'inventory', label: 'Inventory Rules' },
  { id: 'staff', label: 'Staff Rules' },
  { id: 'operations', label: 'Operations' },
  { id: 'ai-behaviour', label: 'AI Behaviour' },
  { id: 'custom-rules', label: 'Custom Rules' },
]

function rulesToFormData(rules: BusinessRules | null): BusinessRulesFormData {
  const r = rules || DEFAULT_RULES
  return {
    weekly_ingredient_budget: r.weekly_ingredient_budget?.toString() || '',
    monthly_revenue_target: r.monthly_revenue_target?.toString() || '',
    target_food_cost_pct: (r.target_food_cost_pct ?? 30).toString(),
    target_labor_cost_pct: (r.target_labor_cost_pct ?? 28).toString(),
    target_profit_margin_pct: (r.target_profit_margin_pct ?? 20).toString(),
    waste_tolerance_rm: (r.waste_tolerance_rm ?? 50).toString(),
    reorder_lead_days: (r.reorder_lead_days ?? 2).toString(),
    min_stock_buffer_days: (r.min_stock_buffer_days ?? 3).toString(),
    preferred_restock_day: (r.preferred_restock_day as ReorderDay) ?? 'Monday',
    auto_reorder_enabled: r.auto_reorder_enabled ?? false,
    max_weekly_staff_hours: (r.max_weekly_staff_hours ?? 48).toString(),
    max_overtime_hours: (r.max_overtime_hours ?? 8).toString(),
    min_staff_per_shift: (r.min_staff_per_shift ?? 2).toString(),
    peak_days: r.peak_days ?? ['Saturday', 'Sunday'],
    slow_days: r.slow_days ?? ['Tuesday', 'Wednesday'],
    opening_buffer_mins: (r.opening_buffer_mins ?? 30).toString(),
    closing_buffer_mins: (r.closing_buffer_mins ?? 30).toString(),
    ai_tone: (r.ai_tone as AiTone) ?? 'balanced',
    alert_sensitivity: (r.alert_sensitivity as AlertSensitivity) ?? 'medium',
    custom_rules: r.custom_rules ?? '',
  }
}

export function CustomizationClient({ businessId, initialRules, currency }: CustomizationClientProps) {
  const [formData, setFormData] = useState<BusinessRulesFormData>(() =>
    rulesToFormData(initialRules)
  )
  const [savedFormData, setSavedFormData] = useState<BusinessRulesFormData>(() =>
    rulesToFormData(initialRules)
  )
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hasChanges, setHasChanges] = useState(false)
  const [activeSection, setActiveSection] = useState('financial')
  const [showResetDialog, setShowResetDialog] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null)

  const isConfigured = initialRules?.is_configured ?? false

  // Track unsaved changes
  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(savedFormData)
    setHasChanges(changed)
  }, [formData, savedFormData])

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasChanges])

  // Scroll spy for active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Auto-save with debounce
  const triggerAutoSave = useCallback(
    (data: BusinessRulesFormData) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(data)
      }, 1500)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const updateField = useCallback(
    <K extends keyof BusinessRulesFormData>(
      key: K,
      value: BusinessRulesFormData[K]
    ) => {
      setFormData((prev) => {
        const next = { ...prev, [key]: value }
        triggerAutoSave(next)
        return next
      })
    },
    [triggerAutoSave]
  )

  const handleSave = async (data?: BusinessRulesFormData) => {
    const dataToSave = data || formData
    setSaveStatus('saving')
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)

    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save')
      }

      setSavedFormData(dataToSave)
      setSaveStatus('saved')
      toast.success('Business rules saved. Zara will now follow your updated constraints.')
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      toast.error(err instanceof Error ? err.message : 'Failed to save rules')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleReset = async () => {
    setShowResetDialog(false)
    setSaveStatus('saving')

    try {
      const res = await fetch('/api/rules/reset', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to reset')

      const data = await res.json()
      const newFormData = rulesToFormData(data.rules)
      setFormData(newFormData)
      setSavedFormData(newFormData)
      setSaveStatus('saved')
      toast.success('Rules reset to defaults')
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      toast.error('Failed to reset rules')
    }
  }

  const handleDiscard = () => {
    setFormData(savedFormData)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    toast.info('Changes discarded')
  }

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Rules & Customization</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Define constraints that guide all AI recommendations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Save status indicator */}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-2 text-sm text-emerald-600">
              <Check className="w-4 h-4" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-2 text-sm text-destructive">
              <X className="w-4 h-4" />
              Failed to save
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResetDialog(true)}
            className="text-muted-foreground text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset to defaults
          </Button>
        </div>
      </div>

      {/* Info banner for unconfigured rules */}
      {!isConfigured && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 text-sm">Configure your business rules</h3>
            <p className="text-blue-700 text-sm mt-0.5">
              You haven&apos;t configured your business rules yet. Set your targets and constraints so Zara can give you advice tailored to your business.
            </p>
          </div>
        </div>
      )}

      {/* Rules Impact Preview */}
      <RulesImpactPreview formData={formData} isConfigured={isConfigured} />

      {/* Main content with sidebar navigation */}
      <div className="flex gap-8 mt-8">
        {/* Sidebar navigation - desktop only */}
        <nav className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Sections
            </p>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Form sections */}
        <div className="flex-1 space-y-10 min-w-0">
          <div id="financial">
            <FinancialTargetsSection formData={formData} updateField={updateField} currency={currency} />
          </div>
          <div id="inventory">
            <InventoryRulesSection formData={formData} updateField={updateField} />
          </div>
          <div id="staff">
            <StaffRulesSection formData={formData} updateField={updateField} />
          </div>
          <div id="operations">
            <OperationsSection formData={formData} updateField={updateField} />
          </div>
          <div id="ai-behaviour">
            <AiBehaviourSection formData={formData} updateField={updateField} />
          </div>
          <div id="custom-rules">
            <CustomRulesSection formData={formData} updateField={updateField} />
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 md:left-60 z-40 bg-background border-t shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">You have unsaved changes</p>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleDiscard}>
                Discard
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave()}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to defaults?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will reset all rules to recommended defaults. Your custom rules will be cleared.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
