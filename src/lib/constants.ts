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
