import type { BusinessRules } from '@/types'

export const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Café' },
  { value: 'hawker', label: 'Hawker Stall' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'other', label: 'Other' },
] as const

export const CURRENCIES = [
  { value: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'USD', label: 'USD — US Dollar' },
] as const

export const MENU_CATEGORY_SUGGESTIONS = [
  'Main Course',
  'Drinks',
  'Desserts', 
  'Snacks',
  'Breakfast',
  'Lunch Set',
  'Dinner Set',
  'Side Dishes',
  'Specials',
] as const

export const EXPENSE_CATEGORIES = [
  'Ingredients',
  'Staff Salary',
  'Rent',
  'Utilities',
  'Equipment',
  'Marketing',
  'Maintenance',
  'Other',
] as const

export const LOW_STOCK_THRESHOLD_DAYS = 3
export const MAX_CHAT_HISTORY = 20
export const BRIEFING_CACHE_HOURS = 24

export const ZARA_EXAMPLE_QA = [
  {
    q: 'How did my business perform this week?',
    expected_elements: [
      'specific revenue figure',
      'comparison to last week',
      'top item mention',
      'one recommendation',
    ],
  },
  {
    q: 'Should I remove any items from my menu?',
    expected_elements: [
      'names specific low-performing items',
      'revenue/margin data for those items',
      'concrete recommendation with reasoning',
    ],
  },
  {
    q: 'What should I restock urgently?',
    expected_elements: [
      'lists critical items specifically',
      'current quantities mentioned',
      'estimated cost to restock',
    ],
  },
  {
    q: 'Am I making a profit?',
    expected_elements: [
      'revenue figure',
      'total expense figure',
      'calculated margin or profit',
      'comparison or benchmark',
    ],
  },
] as const

// ─── Business Rules Constants ────────────────────────────

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday'
] as const

export const REORDER_DAYS = [
  'Any', ...DAYS_OF_WEEK
] as const

export const AI_TONE_OPTIONS = [
  {
    value: 'conservative' as const,
    label: 'Conservative',
    description: 'Cautious advice. Only flag serious issues. Minimal suggestions.'
  },
  {
    value: 'balanced' as const,
    label: 'Balanced',
    description: 'Default. Practical advice with clear priorities.'
  },
  {
    value: 'aggressive' as const,
    label: 'Growth-focused',
    description: 'Proactive advice. Pushes for optimization and revenue growth.'
  },
] as const

export const ALERT_SENSITIVITY_OPTIONS = [
  {
    value: 'low' as const,
    label: 'Low',
    description: 'Only alert on critical issues'
  },
  {
    value: 'medium' as const,
    label: 'Medium',
    description: 'Alert on important issues (recommended)'
  },
  {
    value: 'high' as const,
    label: 'High',
    description: 'Alert on all potential issues'
  },
] as const

export const DEFAULT_RULES: Partial<BusinessRules> = {
  target_food_cost_pct: 30,
  target_labor_cost_pct: 28,
  target_profit_margin_pct: 20,
  waste_tolerance_rm: 50,
  reorder_lead_days: 2,
  min_stock_buffer_days: 3,
  preferred_restock_day: 'Monday',
  auto_reorder_enabled: false,
  max_weekly_staff_hours: 48,
  max_overtime_hours: 8,
  min_staff_per_shift: 2,
  peak_days: ['Saturday', 'Sunday'],
  slow_days: ['Tuesday', 'Wednesday'],
  opening_buffer_mins: 30,
  closing_buffer_mins: 30,
  ai_tone: 'balanced',
  alert_sensitivity: 'medium',
}
