# Design Document: Recent Activity History Page

## Overview

The Recent Activity History page is a dedicated full-page view for displaying comprehensive inventory activity logs with advanced filtering, sorting, and pagination capabilities. This page extends the existing "Recent Activity" card functionality from the inventory page, providing users with access to all historical inventory changes rather than just the last 10 entries.

### Purpose

The page serves as a detailed audit trail for inventory changes, enabling users to:
- Track all inventory modifications over time
- Filter logs by change type, date range, and item name
- Sort logs by various criteria for analysis
- Navigate through large datasets efficiently with pagination
- Understand patterns in inventory management

### Key Design Decisions

1. **Server-Side Pagination**: Implement pagination at the database level to handle large datasets efficiently and reduce initial load time
2. **URL State Management**: Use URL search parameters to persist filter, sort, and pagination state for shareable links and browser back/forward navigation
3. **Responsive Layout Strategy**: Mobile-first card layout that transforms to a table layout on desktop viewports
4. **Component Reusability**: Extract shared logic and UI patterns into reusable components for maintainability
5. **Optimistic UI Updates**: Debounce search inputs and use loading states to provide responsive feedback without blocking the UI

## Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│  /inventory/activity-history (Server Component)         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  - Authentication & Authorization Check           │  │
│  │  - Initial Data Fetch (first page)                │  │
│  │  - Pass data to Client Component                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  ActivityHistoryClient (Client Component)               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  State Management:                                 │  │
│  │  - Filters (changeType, dateRange, itemName)      │  │
│  │  - Sort (field, direction)                        │  │
│  │  - Pagination (page, totalPages)                  │  │
│  │  - Loading states                                 │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Child Components:                                 │  │
│  │  - ActivityFilters                                │  │
│  │  - ActivitySortControl                            │  │
│  │  - ActivityLogList (Desktop Table / Mobile Cards) │  │
│  │  - PaginationControls                             │  │
│  │  - EmptyState / LoadingState / ErrorState         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Data Layer (lib/data/inventory.ts)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  getInventoryLogsPaginated()                       │  │
│  │  - Accepts: businessId, page, limit, filters, sort│  │
│  │  - Returns: { logs, totalCount, totalPages }      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase Database                                       │
│  - inventory_logs table                                  │
│  - Indexed queries with filtering and sorting           │
└─────────────────────────────────────────────────────────┘
```

### Route Structure

- **Path**: `/inventory/activity-history`
- **Location**: `src/app/(dashboard)/inventory/activity-history/page.tsx`
- **Layout**: Uses existing `(dashboard)` layout for consistent navigation and header

### Data Flow

1. **Initial Load**:
   - Server component authenticates user and fetches business ID
   - Fetches first page of logs with default filters/sort
   - Passes initial data to client component
   - Client component hydrates with server data

2. **Filter/Sort Changes**:
   - User interacts with filter or sort controls
   - Client component updates URL search parameters
   - Triggers data refetch with new parameters
   - Loading state displayed during fetch
   - Results update when data arrives

3. **Pagination**:
   - User clicks next/previous page
   - URL parameter updates (page number)
   - Scroll position resets to top
   - New page data fetched and displayed

4. **Search Input**:
   - User types in item name search
   - Input debounced (300ms)
   - After debounce, triggers filter update
   - Resets to page 1 when search changes

## Components and Interfaces

### 1. Page Component (Server)

**File**: `src/app/(dashboard)/inventory/activity-history/page.tsx`

**Responsibilities**:
- Authentication and authorization
- Parse URL search parameters for initial state
- Fetch initial page of activity logs
- Render ActivityHistoryClient with initial data

**Props**: None (uses Next.js searchParams)

**Key Logic**:
```typescript
// Parse search params
const page = Number(searchParams.page) || 1
const changeType = searchParams.changeType || 'all'
const dateRange = searchParams.dateRange || 'all'
const itemName = searchParams.itemName || ''
const sortBy = searchParams.sortBy || 'newest'

// Fetch data
const result = await getInventoryLogsPaginated(businessId, {
  page,
  limit: 50,
  changeType,
  dateRange,
  itemName,
  sortBy
})
```

### 2. ActivityHistoryClient Component

**File**: `src/components/activity-history/activity-history-client.tsx`

**Props**:
```typescript
interface ActivityHistoryClientProps {
  initialLogs: InventoryLog[]
  initialTotalPages: number
  initialPage: number
  initialFilters: ActivityFilters
  initialSort: SortOption
  businessId: string
}
```

**State**:
```typescript
const [logs, setLogs] = useState<InventoryLog[]>(initialLogs)
const [totalPages, setTotalPages] = useState(initialTotalPages)
const [currentPage, setCurrentPage] = useState(initialPage)
const [filters, setFilters] = useState<ActivityFilters>(initialFilters)
const [sort, setSort] = useState<SortOption>(initialSort)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

**Responsibilities**:
- Manage all client-side state
- Sync state with URL search parameters
- Fetch data when filters/sort/page changes
- Render child components
- Handle loading, error, and empty states

### 3. ActivityFilters Component

**File**: `src/components/activity-history/activity-filters.tsx`

**Props**:
```typescript
interface ActivityFiltersProps {
  filters: ActivityFilters
  onFiltersChange: (filters: ActivityFilters) => void
  onClearFilters: () => void
}

interface ActivityFilters {
  changeType: 'all' | 'add' | 'deduct' | 'adjust' | 'invoice'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom'
  customStartDate?: string
  customEndDate?: string
  itemName: string
}
```

**Responsibilities**:
- Render filter controls (select dropdowns, date pickers, search input)
- Handle filter changes and notify parent
- Show "Clear All Filters" button when filters are active
- Responsive layout (stacked on mobile, horizontal on desktop)

**UI Elements**:
- Change Type Select (All, Add, Deduct, Adjust, Invoice)
- Date Range Select (All Time, Today, Last 7 Days, Last 30 Days, Custom Range)
- Custom Date Range Pickers (shown when Custom Range selected)
- Item Name Search Input (debounced)
- Clear All Filters Button

### 4. ActivitySortControl Component

**File**: `src/components/activity-history/activity-sort-control.tsx`

**Props**:
```typescript
interface ActivitySortControlProps {
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc'
```

**Responsibilities**:
- Render sort dropdown or button group
- Handle sort selection changes
- Display current sort state

**UI Elements**:
- Sort Select/Dropdown with options:
  - Newest First (created_at DESC)
  - Oldest First (created_at ASC)
  - Item Name (A-Z)
  - Item Name (Z-A)

### 5. ActivityLogList Component

**File**: `src/components/activity-history/activity-log-list.tsx`

**Props**:
```typescript
interface ActivityLogListProps {
  logs: InventoryLog[]
  isLoading: boolean
}
```

**Responsibilities**:
- Render logs in appropriate layout based on viewport
- Desktop: Table layout with columns
- Mobile: Card layout with stacked information
- Apply color coding and icons for change types
- Format timestamps and quantity changes

**Desktop Table Columns**:
- Item Name
- Change Type (with icon and color)
- Quantity Change (with +/- prefix and color)
- Notes
- Timestamp

**Mobile Card Layout**:
- Item name (bold)
- Change type badge + quantity change
- Timestamp
- Notes (if present)

**Change Type Styling**:
```typescript
const changeTypeConfig = {
  add: { icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  deduct: { icon: MinusCircle, color: 'text-red-600', bg: 'bg-red-50' },
  adjust: { icon: Edit, color: 'text-blue-600', bg: 'bg-blue-50' },
  invoice: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' }
}
```

### 6. PaginationControls Component

**File**: `src/components/activity-history/pagination-controls.tsx`

**Props**:
```typescript
interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading: boolean
}
```

**Responsibilities**:
- Render previous/next buttons
- Display current page and total pages
- Disable buttons appropriately (first/last page)
- Meet touch target size requirements on mobile

**UI Elements**:
- Previous Button (disabled on page 1)
- Page Indicator (e.g., "Page 2 of 15")
- Next Button (disabled on last page)
- Optional: Jump to page input for large datasets

### 7. EmptyState Component

**File**: Reuse `src/components/shared/empty-state.tsx`

**Usage**:
- No logs exist: "No activity logs yet"
- No results after filtering: "No logs match your filters" with clear filters button

### 8. LoadingState Component

**File**: `src/components/activity-history/loading-state.tsx`

**Responsibilities**:
- Initial page load: Full skeleton screen
- Pagination loading: Overlay spinner or skeleton rows
- Preserve existing content during pagination loads

### 9. ErrorState Component

**File**: `src/components/activity-history/error-state.tsx`

**Props**:
```typescript
interface ErrorStateProps {
  error: string
  onRetry: () => void
}
```

**Responsibilities**:
- Display error message
- Provide retry button
- Maintain accessible error announcement

## Data Models

### Extended InventoryLog Type

The existing `InventoryLog` type from `src/types/index.ts` is sufficient:

```typescript
interface InventoryLog {
  id: string
  inventory_item_id: string
  business_id: string
  item_name: string
  change_type: 'add' | 'deduct' | 'adjust' | 'invoice'
  quantity_change: number
  notes: string | null
  created_at: string
}
```

### New Types for Activity History

```typescript
// Filter state
interface ActivityFilters {
  changeType: 'all' | 'add' | 'deduct' | 'adjust' | 'invoice'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom'
  customStartDate?: string
  customEndDate?: string
  itemName: string
}

// Sort options
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc'

// Paginated response
interface PaginatedLogsResponse {
  logs: InventoryLog[]
  totalCount: number
  totalPages: number
  currentPage: number
}

// Query parameters for data fetching
interface LogsQueryParams {
  page: number
  limit: number
  changeType?: string
  dateRange?: string
  customStartDate?: string
  customEndDate?: string
  itemName?: string
  sortBy?: string
}
```

### Database Query Structure

The `getInventoryLogsPaginated` function will build a Supabase query with:

1. **Base Query**: Select from `inventory_logs` with join to `inventory_items` for item name
2. **Filters**:
   - `business_id` equality (always applied)
   - `change_type` equality (if not 'all')
   - `created_at` range (based on dateRange selection)
   - `item_name` ILIKE search (case-insensitive partial match)
3. **Sorting**: Order by `created_at` or `item_name` with direction
4. **Pagination**: Use `.range()` with calculated offset and limit
5. **Count**: Separate query to get total count for pagination

**Example Query**:
```typescript
const offset = (page - 1) * limit

let query = supabase
  .from('inventory_logs')
  .select(`
    id,
    inventory_item_id,
    business_id,
    change_type,
    quantity_change,
    notes,
    created_at,
    inventory_items!inner(name)
  `, { count: 'exact' })
  .eq('business_id', businessId)

// Apply filters
if (changeType !== 'all') {
  query = query.eq('change_type', changeType)
}

if (dateRange === 'today') {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  query = query.gte('created_at', today.toISOString())
}

if (itemName) {
  query = query.ilike('inventory_items.name', `%${itemName}%`)
}

// Apply sorting
if (sortBy === 'newest') {
  query = query.order('created_at', { ascending: false })
} else if (sortBy === 'oldest') {
  query = query.order('created_at', { ascending: true })
} else if (sortBy === 'name-asc') {
  query = query.order('inventory_items.name', { ascending: true })
} else if (sortBy === 'name-desc') {
  query = query.order('inventory_items.name', { ascending: false })
}

// Apply pagination
query = query.range(offset, offset + limit - 1)

const { data, error, count } = await query
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing correctness properties, I need to analyze the acceptance criteria to determine which are testable as properties. Let me use the prework tool:


### Property Reflection

After analyzing all acceptance criteria, I identified the following properties that are testable via property-based testing. Now I'll review them for redundancy:

**Identified Properties:**
1. Default sort order (2.1) - Logs sorted by created_at descending
2. Display all required fields (2.2) - Each log shows all required data
3. Timestamp formatting (2.3) - Timestamps formatted human-readable
4. Change type visual distinction (2.4) - Each change type has distinct styling
5. Positive quantity prefix (2.5) - Positive numbers have "+" prefix
6. Negative quantity prefix (2.6) - Negative numbers have "-" prefix
7. Notes conditional display (2.7) - Notes only shown when present
8. Pagination display (3.2) - Current page and total pages shown correctly
9. First page Previous disabled (3.4) - Previous button disabled on page 1
10. Last page Next disabled (3.5) - Next button disabled on last page
11. Touch target size (3.9, 7.5) - Interactive elements ≥44px on mobile
12. Change type filter (4.5) - Only matching change types displayed
13. Date range filter (4.6) - Only logs within date range displayed
14. Item name search (4.7) - Only matching item names displayed (case-insensitive)
15. Combined filters (4.8) - All filters applied with AND logic
16. Newest First sort (5.2) - Sorted by timestamp descending
17. Oldest First sort (5.3) - Sorted by timestamp ascending
18. Name A-Z sort (5.4) - Sorted alphabetically ascending
19. Name Z-A sort (5.5) - Sorted alphabetically descending
20. Sort after filter (5.7) - Filtering then sorting applied correctly
21. Search debounce (9.3) - Search triggered only after 300ms pause
22. Business isolation (10.2) - Only current business's logs displayed
23. Aria-labels present (8.1) - All controls have descriptive aria-labels
24. Keyboard navigation (8.2) - All interactive elements keyboard navigable
25. Text contrast (8.5) - All text meets 4.5:1 contrast ratio
26. Icon accessibility (8.6) - All icons have accessible labels
27. No horizontal scroll (7.6) - No horizontal overflow at any viewport

**Redundancy Analysis:**

- Properties 5 & 6 (positive/negative prefix) can be combined into a single property about quantity change formatting
- Properties 1 & 16 are the same (default sort is Newest First, which is timestamp descending) - keep as one property
- Property 11 appears twice (3.9 and 7.5) - consolidate into one property
- Properties 12, 13, 14, 15 can be consolidated into a comprehensive filtering property that tests individual filters and combinations
- Properties 16, 17, 18, 19 can be consolidated into a comprehensive sorting property that tests all sort options
- Property 20 (sort after filter) is already covered by testing filters and sorts separately, then together

**Final Property Set After Reflection:**
1. Default sort and display (combines 1, 2)
2. Timestamp formatting (3)
3. Change type visual distinction (4)
4. Quantity change formatting (combines 5, 6)
5. Conditional notes display (7)
6. Pagination state display (8, 9, 10)
7. Touch target accessibility (11)
8. Filtering logic (combines 12, 13, 14, 15, 20)
9. Sorting logic (combines 16, 17, 18, 19)
10. Search debounce behavior (21)
11. Business data isolation (22)
12. Accessibility attributes (combines 23, 24, 25, 26)
13. Responsive layout constraints (27)

### Property 1: Default Display and Sort Order

*For any* set of activity logs belonging to a business, when displayed without explicit sort selection, the logs SHALL be ordered by created_at timestamp in descending order (newest first) and each log SHALL display item_name, change_type, quantity_change, notes (if present), and created_at.

**Validates: Requirements 2.1, 2.2**

### Property 2: Timestamp Human-Readable Formatting

*For any* activity log with a created_at timestamp, the displayed timestamp SHALL be formatted in a human-readable format (relative time like "2 hours ago" for recent entries, or absolute format like "Jan 15, 2024 at 3:45 PM" for older entries).

**Validates: Requirements 2.3**

### Property 3: Change Type Visual Distinction

*For any* activity log, the change_type SHALL be visually distinguished using consistent color coding and iconography: add (green/plus icon), deduct (red/minus icon), adjust (blue/edit icon), invoice (purple/document icon), and each change type SHALL have a distinct visual appearance.

**Validates: Requirements 2.4**

### Property 4: Quantity Change Sign Formatting

*For any* activity log, when quantity_change is positive, it SHALL be displayed with a "+" prefix (e.g., "+50"), and when quantity_change is negative, it SHALL be displayed with a "-" prefix (e.g., "-25"), and the sign SHALL be visually distinguished by color (positive: green, negative: red).

**Validates: Requirements 2.5, 2.6**

### Property 5: Conditional Notes Display

*For any* activity log, when the notes field is null or empty, the notes field SHALL be omitted from the display, and when notes are present, they SHALL be displayed in the log entry.

**Validates: Requirements 2.7**

### Property 6: Pagination State Correctness

*For any* pagination state with current page number and total pages, the pagination control SHALL display the correct current page and total pages, the Previous button SHALL be disabled when current page is 1, and the Next button SHALL be disabled when current page equals total pages.

**Validates: Requirements 3.2, 3.4, 3.5**

### Property 7: Touch Target Accessibility

*For any* interactive element (buttons, links, inputs, selects) rendered on a mobile viewport (width < 768px), the element SHALL have a minimum touch target size of 44×44 pixels to meet accessibility standards.

**Validates: Requirements 3.9, 7.5**

### Property 8: Comprehensive Filtering Logic

*For any* set of activity logs and any combination of filters (change_type, date_range, item_name search), the displayed logs SHALL include only those logs that match ALL active filters using AND logic: logs matching the selected change_type (if not 'all'), logs with created_at within the selected date range (if not 'all'), and logs with item_name containing the search text (case-insensitive, if search text is provided).

**Validates: Requirements 4.5, 4.6, 4.7, 4.8, 5.7**

### Property 9: Comprehensive Sorting Logic

*For any* set of activity logs and any selected sort option, the logs SHALL be sorted correctly: "newest" sorts by created_at descending, "oldest" sorts by created_at ascending, "name-asc" sorts by item_name alphabetically ascending, and "name-desc" sorts by item_name alphabetically descending, and sorting SHALL be applied after filtering.

**Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.7**

### Property 10: Search Input Debounce Behavior

*For any* sequence of rapid keystrokes in the item name search input, the search filter SHALL only be triggered after a 300ms pause in typing, preventing excessive API calls and ensuring only the final search term triggers a data fetch.

**Validates: Requirements 9.3**

### Property 11: Business Data Isolation

*For any* authenticated user with an associated business, the activity history page SHALL display only activity logs where business_id matches the user's business, and SHALL NOT display logs from other businesses.

**Validates: Requirements 10.2**

### Property 12: Accessibility Attributes Completeness

*For any* interactive control (filter selects, sort select, search input, pagination buttons), the element SHALL have a descriptive aria-label or accessible label, SHALL be keyboard navigable with visible focus indicators, and any icons used SHALL have alternative text or aria-labels for screen reader support.

**Validates: Requirements 8.1, 8.2, 8.6**

### Property 13: Text Contrast Accessibility

*For any* text element displayed on the page (headings, body text, labels, table cells), the text color and background color combination SHALL meet WCAG 2.1 AA standards with a minimum contrast ratio of 4.5:1 for normal text.

**Validates: Requirements 8.5**

### Property 14: Responsive Layout Constraints

*For any* viewport width, the page layout SHALL prevent horizontal scrolling by ensuring all content fits within the viewport width, using responsive design techniques such as flexible layouts, appropriate breakpoints, and content wrapping.

**Validates: Requirements 7.6**

## Error Handling

### Client-Side Error Scenarios

1. **Data Fetch Failure**
   - **Scenario**: API request to fetch activity logs fails (network error, server error, timeout)
   - **Handling**: 
     - Display error state component with user-friendly message
     - Provide "Retry" button to attempt fetch again
     - Log error details to console for debugging
     - Preserve current filter/sort/page state for retry

2. **Invalid Filter Parameters**
   - **Scenario**: User provides invalid date range (start date after end date)
   - **Handling**:
     - Show inline validation error near date inputs
     - Disable apply/search until valid dates provided
     - Provide helpful error message (e.g., "Start date must be before end date")

3. **Empty Results**
   - **Scenario**: Filters result in zero matching logs
   - **Handling**:
     - Display empty state with message "No logs match your filters"
     - Provide "Clear Filters" button to reset
     - Show current active filters for context

4. **No Data Exists**
   - **Scenario**: Business has no activity logs at all
   - **Handling**:
     - Display empty state with message "No activity logs yet"
     - Provide guidance text explaining logs will appear after inventory changes
     - Optionally link back to inventory page

5. **Authentication Errors**
   - **Scenario**: User session expires while on page
   - **Handling**:
     - Detect 401 Unauthorized response
     - Redirect to login page with return URL
     - Show toast message "Session expired, please log in again"

### Server-Side Error Scenarios

1. **Database Query Errors**
   - **Scenario**: Supabase query fails due to database issues
   - **Handling**:
     - Log error with full context (query, parameters, error message)
     - Return error response with appropriate HTTP status code
     - Client displays error state with retry option

2. **Invalid Pagination Parameters**
   - **Scenario**: Page number exceeds total pages or is negative
   - **Handling**:
     - Clamp page number to valid range (1 to totalPages)
     - Return valid page of data
     - Update URL to reflect corrected page number

3. **Missing Business ID**
   - **Scenario**: User has no associated business
   - **Handling**:
     - Redirect to onboarding page
     - Prevent data fetch attempt

4. **Authorization Failure**
   - **Scenario**: User attempts to access logs for different business
   - **Handling**:
     - Server validates business_id matches authenticated user
     - Return 403 Forbidden if mismatch
     - Client redirects to dashboard or shows error

### Error Recovery Strategies

1. **Automatic Retry with Exponential Backoff**
   - For transient network errors, implement automatic retry with increasing delays
   - Maximum 3 retry attempts before showing error state

2. **Graceful Degradation**
   - If advanced filters fail, fall back to basic display (all logs, default sort)
   - Inform user of degraded functionality

3. **State Preservation**
   - Preserve user's filter/sort selections even after errors
   - Allow user to retry with same parameters

4. **User Feedback**
   - Always provide clear, actionable error messages
   - Avoid technical jargon in user-facing messages
   - Include retry or alternative action options

## Testing Strategy

### Dual Testing Approach

This feature will use a comprehensive testing strategy combining unit tests for specific scenarios and property-based tests for universal behaviors.

#### Unit Tests

Unit tests will focus on:

1. **Component Rendering**
   - Verify each component renders without errors
   - Check that required UI elements are present
   - Test conditional rendering (empty states, loading states, error states)

2. **User Interactions**
   - Filter selection triggers correct state updates
   - Sort selection changes display order
   - Pagination buttons navigate correctly
   - Clear filters button resets all filters

3. **Edge Cases**
   - First page: Previous button disabled
   - Last page: Next button disabled
   - Empty results: Empty state displayed
   - No data: Initial empty state displayed

4. **Integration Points**
   - Navigation from Recent Activity card to Activity History page
   - Back button returns to inventory page
   - URL parameters sync with component state

5. **Accessibility**
   - Tab order follows visual layout
   - Screen reader announcements for loading and results
   - Semantic HTML structure

**Example Unit Tests**:
```typescript
describe('ActivityHistoryClient', () => {
  it('renders loading state initially', () => {
    // Test loading skeleton appears
  })

  it('displays logs after data loads', () => {
    // Test logs are rendered in list/table
  })

  it('disables Previous button on first page', () => {
    // Test button disabled state
  })

  it('filters logs by change type', () => {
    // Test filter application
  })

  it('shows empty state when no results', () => {
    // Test empty state message
  })
})
```

#### Property-Based Tests

Property-based tests will verify universal behaviors across many generated inputs. Each property test will:
- Run minimum 100 iterations with randomized inputs
- Reference the design document property it validates
- Use appropriate generators for test data

**Test Configuration**:
- Library: `fast-check` (JavaScript property-based testing library)
- Iterations: 100 minimum per property
- Tag format: `Feature: recent-activity-history-page, Property {number}: {property_text}`

**Property Test Examples**:

```typescript
import fc from 'fast-check'

describe('Property 1: Default Display and Sort Order', () => {
  it('Feature: recent-activity-history-page, Property 1: For any set of activity logs, they are sorted by created_at descending by default', () => {
    fc.assert(
      fc.property(
        fc.array(activityLogGenerator(), { minLength: 2, maxLength: 100 }),
        (logs) => {
          const sorted = sortLogsByDefault(logs)
          // Verify descending order
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(new Date(sorted[i].created_at).getTime())
              .toBeGreaterThanOrEqual(new Date(sorted[i + 1].created_at).getTime())
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 4: Quantity Change Sign Formatting', () => {
  it('Feature: recent-activity-history-page, Property 4: For any quantity change, positive values have + prefix and negative values have - prefix', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        (quantityChange) => {
          const formatted = formatQuantityChange(quantityChange)
          if (quantityChange > 0) {
            expect(formatted).toMatch(/^\+/)
          } else if (quantityChange < 0) {
            expect(formatted).toMatch(/^-/)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 8: Comprehensive Filtering Logic', () => {
  it('Feature: recent-activity-history-page, Property 8: For any logs and filters, only matching logs are displayed', () => {
    fc.assert(
      fc.property(
        fc.array(activityLogGenerator(), { minLength: 10, maxLength: 100 }),
        fc.constantFrom('all', 'add', 'deduct', 'adjust', 'invoice'),
        fc.string({ minLength: 0, maxLength: 20 }),
        (logs, changeTypeFilter, searchText) => {
          const filtered = applyFilters(logs, {
            changeType: changeTypeFilter,
            itemName: searchText
          })
          
          // Verify all results match filters
          filtered.forEach(log => {
            if (changeTypeFilter !== 'all') {
              expect(log.change_type).toBe(changeTypeFilter)
            }
            if (searchText) {
              expect(log.item_name.toLowerCase())
                .toContain(searchText.toLowerCase())
            }
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 10: Search Input Debounce Behavior', () => {
  it('Feature: recent-activity-history-page, Property 10: For any rapid keystroke sequence, search triggers only after 300ms pause', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 3, maxLength: 10 }),
        async (keystrokes) => {
          const searchCalls: string[] = []
          const debouncedSearch = debounce((term: string) => {
            searchCalls.push(term)
          }, 300)

          // Simulate rapid typing
          for (const key of keystrokes) {
            debouncedSearch(key)
            await sleep(50) // Type every 50ms
          }

          // Wait for debounce
          await sleep(350)

          // Only final keystroke should trigger search
          expect(searchCalls.length).toBe(1)
          expect(searchCalls[0]).toBe(keystrokes[keystrokes.length - 1])
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

**Test Data Generators**:

```typescript
// Generator for activity logs
const activityLogGenerator = () => fc.record({
  id: fc.uuid(),
  inventory_item_id: fc.uuid(),
  business_id: fc.uuid(),
  item_name: fc.string({ minLength: 3, maxLength: 50 }),
  change_type: fc.constantFrom('add', 'deduct', 'adjust', 'invoice'),
  quantity_change: fc.integer({ min: -500, max: 500 }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() })
    .map(d => d.toISOString())
})

// Generator for pagination state
const paginationStateGenerator = () => fc.record({
  currentPage: fc.integer({ min: 1, max: 100 }),
  totalPages: fc.integer({ min: 1, max: 100 })
}).filter(({ currentPage, totalPages }) => currentPage <= totalPages)

// Generator for filter state
const filterStateGenerator = () => fc.record({
  changeType: fc.constantFrom('all', 'add', 'deduct', 'adjust', 'invoice'),
  dateRange: fc.constantFrom('all', 'today', 'week', 'month', 'custom'),
  itemName: fc.string({ maxLength: 50 })
})
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage for components and utilities
- **Property Test Coverage**: All 14 correctness properties implemented as property-based tests
- **Integration Test Coverage**: Key user flows (navigation, filtering, pagination)
- **Accessibility Test Coverage**: Automated accessibility checks with jest-axe or similar

### Testing Tools

- **Unit Testing**: Jest + React Testing Library
- **Property-Based Testing**: fast-check
- **Accessibility Testing**: jest-axe, manual testing with screen readers
- **Visual Regression**: Chromatic or Percy (optional)
- **E2E Testing**: Playwright (for critical user flows)

---

## Implementation Notes

### Phase 1: Core Structure (Priority: High)
1. Create page route and server component
2. Implement ActivityHistoryClient with basic state management
3. Create data layer function `getInventoryLogsPaginated`
4. Implement basic log display (desktop table, mobile cards)

### Phase 2: Filtering and Sorting (Priority: High)
1. Implement ActivityFilters component
2. Implement ActivitySortControl component
3. Add URL state synchronization
4. Implement debounced search

### Phase 3: Pagination (Priority: High)
1. Implement PaginationControls component
2. Add pagination logic to data fetching
3. Implement scroll-to-top on page change

### Phase 4: States and Polish (Priority: Medium)
1. Implement loading states (skeleton, spinner)
2. Implement error states with retry
3. Implement empty states
4. Add responsive layout refinements

### Phase 5: Accessibility (Priority: High)
1. Add aria-labels to all controls
2. Implement keyboard navigation
3. Add screen reader announcements
4. Verify color contrast
5. Test with screen readers

### Phase 6: Testing (Priority: High)
1. Write unit tests for all components
2. Implement property-based tests for all 14 properties
3. Add integration tests for key flows
4. Run accessibility audits

### Performance Considerations

1. **Server-Side Rendering**: Initial page load uses SSR for fast First Contentful Paint
2. **Pagination**: Fetch only 50 logs per page to minimize data transfer
3. **Debouncing**: 300ms debounce on search input to reduce API calls
4. **Memoization**: Use React.memo for expensive components (log list items)
5. **Virtual Scrolling**: Consider implementing if page size increases beyond 50
6. **Image Optimization**: Use Next.js Image component for any images/icons
7. **Code Splitting**: Lazy load date picker component (only shown for custom range)

### Security Considerations

1. **Authentication**: Server component verifies user authentication before data fetch
2. **Authorization**: All queries filtered by business_id to prevent cross-business data access
3. **Input Sanitization**: Sanitize search input to prevent SQL injection (Supabase handles this)
4. **Rate Limiting**: Consider implementing rate limiting on search endpoint
5. **CSRF Protection**: Next.js provides CSRF protection for API routes

### Future Enhancements

1. **Export Functionality**: Allow users to export filtered logs as CSV
2. **Advanced Date Filters**: Add preset ranges like "Last Quarter", "Last Year"
3. **Bulk Actions**: Select multiple logs for batch operations
4. **Log Details Modal**: Click log to see full details in modal
5. **Real-time Updates**: Use Supabase real-time subscriptions for live log updates
6. **Saved Filters**: Allow users to save frequently used filter combinations
7. **Analytics**: Track which filters are most commonly used
8. **Print View**: Optimized print stylesheet for log reports
