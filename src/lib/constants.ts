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
