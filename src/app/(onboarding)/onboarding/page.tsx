'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/app-store'
import {
  BUSINESS_TYPES,
  CURRENCIES,
  MENU_CATEGORY_SUGGESTIONS,
} from '@/lib/constants'
import type { Business } from '@/types'

const STEPS = [
  { number: 1, title: 'Business' },
  { number: 2, title: 'Operations' },
  { number: 3, title: 'Menu' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { setBusiness, setIsOnboarded } = useAppStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1 fields
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [address, setAddress] = useState('')

  // Step 2 fields
  const [staffCount, setStaffCount] = useState<number>(1)
  const [operatingHours, setOperatingHours] = useState('')
  const [currency, setCurrency] = useState('MYR')

  // Step 3 fields
  const [menuCategories, setMenuCategories] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!businessName.trim()) newErrors.businessName = 'Business name is required'
      if (!businessType) newErrors.businessType = 'Business type is required'
    }

    if (step === 2) {
      if (!staffCount || staffCount < 1) newErrors.staffCount = 'At least 1 staff member is required'
      if (staffCount > 999) newErrors.staffCount = 'Maximum 999 staff members'
      if (!currency) newErrors.currency = 'Currency is required'
    }

    if (step === 3) {
      if (menuCategories.length < 1) newErrors.menuCategories = 'Add at least 1 menu category'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setErrors({})
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const addCategory = (category: string) => {
    const trimmed = category.trim()
    if (!trimmed) return
    if (menuCategories.includes(trimmed)) return
    setMenuCategories((prev) => [...prev, trimmed])
    setCategoryInput('')
    // Clear the menu categories error if present
    if (errors.menuCategories) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.menuCategories
        return next
      })
    }
  }

  const removeCategory = (category: string) => {
    setMenuCategories((prev) => prev.filter((c) => c !== category))
  }

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCategory(categoryInput)
    }
  }

  const handleFinish = async () => {
    if (!validateStep(3)) return

    setSubmitting(true)

    try {
      const res = await fetch('/api/business/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName.trim(),
          type: businessType,
          staff_count: staffCount,
          operating_hours: operatingHours.trim() || null,
          currency,
          menu_categories: menuCategories,
          address: address.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create business')
      }

      const business: Business = await res.json()
      setBusiness(business)
      setIsOnboarded(true)
      toast.success('Welcome! Your business profile is set up.')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-center">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                  currentStep > step.number
                    ? 'bg-primary border-primary text-primary-foreground'
                    : currentStep === step.number
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  currentStep >= step.number
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 mb-6 transition-colors duration-200 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground/20'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {/* Step 1: Business basics */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Business Basics</h2>
                <p className="text-sm text-muted-foreground">
                  Tell us about your business
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="e.g. Kedai Makan Ali"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
                {errors.businessName && (
                  <p className="text-sm text-destructive">{errors.businessName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger id="businessType">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessType && (
                  <p className="text-sm text-destructive">{errors.businessType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <textarea
                  id="address"
                  className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="e.g. No. 12, Jalan Bukit Bintang, KL"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Operations */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Operations</h2>
                <p className="text-sm text-muted-foreground">
                  Set up your operational details
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffCount">Number of Staff *</Label>
                <Input
                  id="staffCount"
                  type="number"
                  min={1}
                  max={999}
                  value={staffCount}
                  onChange={(e) => setStaffCount(parseInt(e.target.value) || 0)}
                />
                {errors.staffCount && (
                  <p className="text-sm text-destructive">{errors.staffCount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="operatingHours">Operating Hours</Label>
                <Input
                  id="operatingHours"
                  placeholder="e.g. Mon-Fri 8am-10pm, Sat-Sun 9am-11pm"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-destructive">{errors.currency}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Menu categories */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Menu Categories</h2>
                <p className="text-sm text-muted-foreground">
                  Add the main categories on your menu. This helps our AI give
                  you better insights.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryInput">Add Category *</Label>
                <div className="flex gap-2">
                  <Input
                    id="categoryInput"
                    placeholder="Type a category and press Enter"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyDown={handleCategoryKeyDown}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addCategory(categoryInput)}
                    disabled={!categoryInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {errors.menuCategories && (
                  <p className="text-sm text-destructive">{errors.menuCategories}</p>
                )}
              </div>

              {/* Added categories */}
              {menuCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {menuCategories.map((cat) => (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="gap-1 px-3 py-1.5 text-sm"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="ml-1 hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Suggestion chips */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {MENU_CATEGORY_SUGGESTIONS.map((suggestion) => {
                    const isAdded = menuCategories.includes(suggestion)
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={isAdded}
                        onClick={() => addCategory(suggestion)}
                        className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                          isAdded
                            ? 'bg-muted text-muted-foreground/50 border-transparent cursor-not-allowed'
                            : 'bg-background hover:bg-muted border-border cursor-pointer'
                        }`}
                      >
                        {suggestion}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                Complete Setup
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
