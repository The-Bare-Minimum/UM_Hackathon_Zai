export type BusinessType = 
  'restaurant' | 'cafe' | 'hawker' | 'bakery' | 'other'

export interface Business {
  id: string
  user_id: string
  name: string
  type: BusinessType
  staff_count: number
  operating_hours: string | null
  currency: string
  menu_categories: string[]
  address: string | null
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  business_id: string
  name: string
  category: string
  quantity: number
  unit: string
  reorder_level: number
  cost_per_unit: number
  supplier: string | null
  expiry_date: string | null
  status: 'ok' | 'low' | 'critical' | 'expired'
  created_at: string
  updated_at: string
}

export interface SalesRecord {
  id: string
  business_id: string
  item_name: string
  category: string
  quantity_sold: number
  unit_price: number
  total_revenue: number
  sale_date: string
  created_at: string
}

export interface Expense {
  id: string
  business_id: string
  description: string
  category: string
  amount: number
  expense_date: string
  created_at: string
}

export interface StaffMember {
  id: string
  business_id: string
  name: string
  role: string
  salary: number
  hire_date: string
  created_at: string
}

export interface AiBriefing {
  id: string
  business_id: string
  content: string
  briefing_date: string
  created_at: string
}

export interface BriefingContent {
  greeting: string
  insights: string[]
  urgent: string | null
  closing: string | null
  raw: string
}

export interface DailyBriefing {
  id: string
  business_id: string
  content: BriefingContent
  briefing_date: string
  cached: boolean
  generated_at: string
}

export interface ChatMessage {
  id: string
  business_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatSession {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

export interface InventoryLog {
  id: string
  inventory_item_id: string
  business_id: string
  item_name: string
  change_type: 'add' | 'deduct' | 'adjust' | 'invoice'
  quantity_change: number
  notes: string | null
  created_at: string
}

export interface InventoryStats {
  totalItems: number
  totalValue: number
  criticalCount: number
  lowCount: number
  okCount: number
  expiringThisWeek: InventoryItem[]
}

export interface ExtractedInvoiceItem {
  name: string
  name_original: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  category: string
  matchedItemId: string | null
  matchedItemName: string | null
}

export interface ScanInvoiceResponse {
  items: ExtractedInvoiceItem[]
  totalItems: number
  totalValue: number
  storagePath: string
  invoiceDate: string
}

export interface RestockRecommendation {
  item_name: string
  current_quantity: number
  current_unit: string
  recommended_order_quantity: number
  reason: string
  estimated_cost: number
  urgency: 'immediate' | 'this_week' | 'next_week'
  supplier_tip?: string
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// Activity History Types
export interface ActivityFilters {
  changeType: 'all' | 'add' | 'deduct' | 'adjust' | 'invoice'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom'
  customStartDate?: string
  customEndDate?: string
  itemName: string
}

export type SortOption = 'newest' | 'oldest'

export interface PaginatedLogsResponse {
  logs: InventoryLog[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export interface LogsQueryParams {
  page: number
  limit: number
  changeType?: 'all' | 'add' | 'deduct' | 'adjust' | 'invoice'
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'custom'
  customStartDate?: string
  customEndDate?: string
  itemName?: string
  sortBy?: SortOption
}

