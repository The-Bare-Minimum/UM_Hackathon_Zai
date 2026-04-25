# Implementation Plan: Recent Activity History Page

## Overview

This implementation plan creates a dedicated full-page view for displaying comprehensive inventory activity logs with filtering, sorting, and pagination capabilities. The page extends the existing "Recent Activity" functionality from the inventory page, providing users with access to all historical inventory changes.

**Technical Approach:**
- Server-side pagination for efficient data handling
- URL state management for shareable links and browser navigation
- Responsive design: mobile-first card layout transforming to desktop table
- TypeScript with Next.js App Router (Server + Client Components)
- Supabase for data fetching with optimized queries
- fast-check for property-based testing
- React Testing Library for unit tests

## Tasks

### 1. Set up data layer with paginated query function

- [x] 1.1 Create `getInventoryLogsPaginated` function in `src/lib/data/inventory.ts`
  - Accept parameters: businessId, page, limit, filters (changeType, dateRange, customStartDate, customEndDate, itemName), sortBy
  - Build Supabase query with business_id filter
  - Implement change_type filter (skip if 'all')
  - Implement date range filters (today, week, month, custom)
  - Implement item_name ILIKE search (case-insensitive)
  - Implement sorting (newest, oldest, name-asc, name-desc)
  - Apply pagination with `.range()` using calculated offset
  - Return `{ logs, totalCount, totalPages, currentPage }`
  - _Requirements: 10.1, 10.2, 3.1, 4.5, 4.6, 4.7, 5.2, 5.3, 5.4, 5.5_

- [ ]* 1.2 Write property test for filtering logic
  - **Property 8: Comprehensive Filtering Logic**
  - **Validates: Requirements 4.5, 4.6, 4.7, 4.8**
  - Generate random logs and filter combinations
  - Verify all returned logs match ALL active filters (AND logic)
  - Test change_type, date_range, and item_name filters individually and combined

- [ ]* 1.3 Write property test for sorting logic
  - **Property 9: Comprehensive Sorting Logic**
  - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.7**
  - Generate random logs and test all sort options
  - Verify correct ordering for newest, oldest, name-asc, name-desc
  - Verify sorting is applied after filtering

- [ ]* 1.4 Write property test for business data isolation
  - **Property 11: Business Data Isolation**
  - **Validates: Requirements 10.2**
  - Generate logs for multiple businesses
  - Verify only logs matching the specified business_id are returned

### 2. Create type definitions for activity history

- [x] 2.1 Add new types to `src/types/index.ts`
  - Create `ActivityFilters` interface (changeType, dateRange, customStartDate, customEndDate, itemName)
  - Create `SortOption` type ('newest' | 'oldest' | 'name-asc' | 'name-desc')
  - Create `PaginatedLogsResponse` interface (logs, totalCount, totalPages, currentPage)
  - Create `LogsQueryParams` interface for data fetching parameters
  - _Requirements: 4.1, 4.2, 4.3, 5.1_

### 3. Create server component page route

- [x] 3.1 Create `src/app/(dashboard)/inventory/activity-history/page.tsx`
  - Implement authentication check (redirect to /login if not authenticated)
  - Fetch user's business_id (redirect to /onboarding if no business)
  - Parse URL searchParams for page, filters, and sort options
  - Set defaults: page=1, changeType='all', dateRange='all', sortBy='newest', limit=50
  - Call `getInventoryLogsPaginated` with parsed parameters
  - Pass initial data to ActivityHistoryClient component
  - Add page metadata (title: "Activity History | FnB.ai")
  - _Requirements: 1.3, 1.4, 10.3, 10.4, 10.5, 3.1_

### 4. Create main client component with state management

- [x] 4.1 Create `src/components/activity-history/activity-history-client.tsx`
  - Accept props: initialLogs, initialTotalPages, initialPage, initialFilters, initialSort, businessId
  - Set up state: logs, totalPages, currentPage, filters, sort, isLoading, error
  - Implement URL synchronization: update searchParams when state changes
  - Implement data fetching function that calls API with current filters/sort/page
  - Handle loading, error, and empty states
  - Render child components: ActivityFilters, ActivitySortControl, ActivityLogList, PaginationControls
  - Add page header with title "Activity History" and back button
  - _Requirements: 1.5, 2.1, 6.1, 6.2, 6.3, 6.5_

- [ ]* 4.2 Write unit tests for ActivityHistoryClient
  - Test initial render with provided data
  - Test loading state display
  - Test error state display with retry button
  - Test empty state when no logs exist
  - Test state updates when filters change
  - Test state updates when sort changes
  - Test state updates when page changes
  - Test URL synchronization

### 5. Checkpoint - Verify basic page structure

- [x] 5. Checkpoint: Ensure basic page loads with authentication and displays initial data
  - Verify page accessible at `/inventory/activity-history`
  - Verify authentication redirects work correctly
  - Verify initial logs display
  - Ensure all tests pass, ask the user if questions arise

### 6. Create filter controls component

- [x] 6.1 Create `src/components/activity-history/activity-filters.tsx`
  - Accept props: filters, onFiltersChange, onClearFilters
  - Render Change Type select with options: All, Add, Deduct, Adjust, Invoice
  - Render Date Range select with options: All Time, Today, Last 7 Days, Last 30 Days, Custom Range
  - Conditionally render custom date pickers when Custom Range selected
  - Render Item Name search input with debounce (300ms)
  - Render "Clear All Filters" button (shown when any filter is active)
  - Implement responsive layout: stacked on mobile, horizontal on desktop
  - Add aria-labels to all filter controls
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.10, 7.4, 8.1_

- [ ]* 6.2 Write property test for search debounce behavior
  - **Property 10: Search Input Debounce Behavior**
  - **Validates: Requirements 9.3**
  - Simulate rapid keystroke sequences
  - Verify search only triggers after 300ms pause
  - Verify only final search term triggers fetch

- [ ]* 6.3 Write unit tests for ActivityFilters
  - Test all filter controls render correctly
  - Test change type selection updates state
  - Test date range selection updates state
  - Test custom date pickers appear when Custom Range selected
  - Test search input debounce behavior
  - Test "Clear All Filters" button resets all filters
  - Test aria-labels are present

### 7. Create sort control component

- [x] 7.1 Create `src/components/activity-history/activity-sort-control.tsx`
  - Accept props: sortBy, onSortChange
  - Render sort select/dropdown with options: Newest First, Oldest First, Item Name (A-Z), Item Name (Z-A)
  - Map UI labels to SortOption values
  - Add aria-label for accessibility
  - _Requirements: 5.1, 5.6, 8.1_

- [ ]* 7.2 Write unit tests for ActivitySortControl
  - Test sort control renders with current selection
  - Test sort selection triggers onSortChange callback
  - Test all sort options are available
  - Test aria-label is present

### 8. Create activity log list component with responsive layouts

- [x] 8.1 Create `src/components/activity-history/activity-log-list.tsx`
  - Accept props: logs, isLoading
  - Implement desktop table layout with columns: Item Name, Change Type, Quantity Change, Notes, Timestamp
  - Implement mobile card layout with stacked information
  - Use responsive breakpoint (768px) to switch between layouts
  - Apply change type color coding and icons: add (green/PlusCircle), deduct (red/MinusCircle), adjust (blue/Edit), invoice (purple/FileText)
  - Format quantity changes with +/- prefix and color (positive: green, negative: red)
  - Format timestamps using human-readable format (relative or absolute)
  - Conditionally display notes only when present
  - Use semantic HTML (table, tbody, tr, td for desktop)
  - Add aria-labels for icons
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 7.2, 7.3, 8.4, 8.6_

- [ ]* 8.2 Write property test for default display and sort order
  - **Property 1: Default Display and Sort Order**
  - **Validates: Requirements 2.1, 2.2**
  - Generate random logs
  - Verify logs are sorted by created_at descending by default
  - Verify all required fields are displayed

- [ ]* 8.3 Write property test for timestamp formatting
  - **Property 2: Timestamp Human-Readable Formatting**
  - **Validates: Requirements 2.3**
  - Generate logs with various timestamps
  - Verify timestamps are formatted in human-readable format
  - Test both relative (recent) and absolute (older) formats

- [ ]* 8.4 Write property test for change type visual distinction
  - **Property 3: Change Type Visual Distinction**
  - **Validates: Requirements 2.4**
  - Generate logs with all change types
  - Verify each change type has distinct color and icon
  - Verify consistency across all instances

- [ ]* 8.5 Write property test for quantity change formatting
  - **Property 4: Quantity Change Sign Formatting**
  - **Validates: Requirements 2.5, 2.6**
  - Generate logs with positive, negative, and zero quantity changes
  - Verify positive numbers have "+" prefix
  - Verify negative numbers have "-" prefix
  - Verify color coding (positive: green, negative: red)

- [ ]* 8.6 Write property test for conditional notes display
  - **Property 5: Conditional Notes Display**
  - **Validates: Requirements 2.7**
  - Generate logs with and without notes
  - Verify notes are displayed when present
  - Verify notes are omitted when null or empty

- [ ]* 8.7 Write unit tests for ActivityLogList
  - Test desktop table layout renders correctly
  - Test mobile card layout renders correctly
  - Test responsive breakpoint switches layouts
  - Test change type icons and colors
  - Test quantity change formatting
  - Test timestamp formatting
  - Test notes conditional rendering
  - Test empty list handling

### 9. Create pagination controls component

- [x] 9.1 Create `src/components/activity-history/pagination-controls.tsx`
  - Accept props: currentPage, totalPages, onPageChange, isLoading
  - Render Previous button (disabled when currentPage === 1)
  - Render page indicator showing "Page X of Y"
  - Render Next button (disabled when currentPage === totalPages)
  - Ensure touch target size ≥44px on mobile viewports
  - Add aria-labels for accessibility
  - Disable buttons during loading
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.9, 8.1, 8.2_

- [ ]* 9.2 Write property test for pagination state correctness
  - **Property 6: Pagination State Correctness**
  - **Validates: Requirements 3.2, 3.4, 3.5**
  - Generate various pagination states (different page numbers and total pages)
  - Verify Previous button disabled on page 1
  - Verify Next button disabled on last page
  - Verify page indicator displays correct values

- [ ]* 9.3 Write unit tests for PaginationControls
  - Test Previous button disabled on first page
  - Test Next button disabled on last page
  - Test page indicator displays correctly
  - Test onPageChange callback triggered correctly
  - Test buttons disabled during loading
  - Test touch target size on mobile
  - Test aria-labels present

### 10. Implement page change behavior with scroll reset

- [x] 10.1 Add scroll-to-top functionality in ActivityHistoryClient
  - When page changes, scroll to top of page
  - Use `window.scrollTo(0, 0)` or `scrollIntoView` on page container
  - _Requirements: 3.8_

### 11. Create loading state component

- [ ] 11.1 Create `src/components/activity-history/loading-state.tsx`
  - Implement skeleton screen for initial page load
  - Show skeleton rows matching the log list layout (table or cards)
  - Implement loading overlay/spinner for pagination loading
  - Add aria-live region for screen reader announcements
  - _Requirements: 6.1, 6.2, 8.7_

- [ ]* 11.2 Write unit tests for LoadingState
  - Test skeleton screen renders correctly
  - Test loading overlay renders correctly
  - Test aria-live region present

### 12. Create error state component

- [ ] 12.1 Create `src/components/activity-history/error-state.tsx`
  - Accept props: error (message), onRetry (callback)
  - Display user-friendly error message
  - Render "Retry" button that calls onRetry
  - Use semantic HTML and accessible markup
  - _Requirements: 6.3, 6.4_

- [ ]* 12.2 Write unit tests for ErrorState
  - Test error message displays correctly
  - Test retry button triggers onRetry callback
  - Test accessible markup

### 13. Create empty state component

- [ ] 13.1 Create or reuse empty state component
  - Display "No activity logs yet" when business has no logs
  - Display "No logs match your filters" when filters return empty results
  - Include "Clear Filters" button for filtered empty state
  - Provide guidance text for initial empty state
  - _Requirements: 4.9, 6.5_

- [ ]* 13.2 Write unit tests for EmptyState
  - Test initial empty state message
  - Test filtered empty state message
  - Test "Clear Filters" button appears for filtered state
  - Test guidance text displays

### 14. Checkpoint - Verify all components render correctly

- [ ] 14. Checkpoint: Test all components and interactions
  - Verify filters work correctly (change type, date range, search)
  - Verify sorting works correctly (all options)
  - Verify pagination works correctly (next, previous, disabled states)
  - Verify loading states display appropriately
  - Verify error states display with retry
  - Verify empty states display correctly
  - Ensure all tests pass, ask the user if questions arise

### 15. Add "View All" link to Recent Activity card on inventory page

- [x] 15.1 Update Recent Activity card component
  - Locate the Recent Activity card in `src/components/inventory/inventory-client.tsx` or related component
  - Add "View All" link at the bottom of the card
  - Link to `/inventory/activity-history`
  - Style link appropriately (e.g., "View All →" with arrow icon)
  - _Requirements: 1.1, 1.2_

- [ ]* 15.2 Write unit test for View All link
  - Test link renders in Recent Activity card
  - Test link navigates to correct route
  - Test link styling and accessibility

### 16. Implement accessibility features

- [ ] 16.1 Add comprehensive aria-labels and accessibility attributes
  - Add aria-labels to all filter controls (change type, date range, search)
  - Add aria-labels to sort control
  - Add aria-labels to pagination buttons
  - Add aria-labels or alt text to all icons (change type icons)
  - Ensure semantic HTML throughout (table, button, select, input)
  - Add aria-live regions for loading and result announcements
  - _Requirements: 8.1, 8.4, 8.6, 8.7, 8.8_

- [ ] 16.2 Implement keyboard navigation
  - Ensure all interactive elements are keyboard accessible
  - Add visible focus indicators to all interactive elements
  - Verify logical tab order through filters, sort, logs, pagination
  - Test keyboard navigation with Tab, Shift+Tab, Enter, Space
  - _Requirements: 8.2, 8.3_

- [ ]* 16.3 Write property test for accessibility attributes
  - **Property 12: Accessibility Attributes Completeness**
  - **Validates: Requirements 8.1, 8.2, 8.6**
  - Generate various component states
  - Verify all interactive controls have aria-labels or accessible labels
  - Verify all icons have alternative text
  - Verify keyboard navigability

- [ ]* 16.4 Write unit tests for keyboard navigation
  - Test tab order follows visual layout
  - Test focus indicators are visible
  - Test Enter/Space activate buttons
  - Test keyboard navigation through all interactive elements

### 17. Verify and implement color contrast requirements

- [ ] 17.1 Audit and fix color contrast ratios
  - Check all text colors against backgrounds using contrast checker
  - Ensure minimum 4.5:1 contrast ratio for normal text (WCAG 2.1 AA)
  - Fix any failing contrast ratios
  - Document color choices in component styles
  - _Requirements: 8.5_

- [ ]* 17.2 Write property test for text contrast
  - **Property 13: Text Contrast Accessibility**
  - **Validates: Requirements 8.5**
  - Test all text/background color combinations
  - Verify contrast ratios meet 4.5:1 minimum
  - Use automated contrast checking library

### 18. Implement responsive design constraints

- [ ] 18.1 Ensure no horizontal scrolling at any viewport size
  - Test page at various viewport widths (320px, 375px, 768px, 1024px, 1440px)
  - Fix any horizontal overflow issues
  - Use responsive units (%, rem, vw) instead of fixed widths where appropriate
  - Test filter controls stack correctly on mobile
  - Test table transforms to cards on mobile
  - _Requirements: 7.6, 7.7_

- [ ]* 18.2 Write property test for responsive layout constraints
  - **Property 14: Responsive Layout Constraints**
  - **Validates: Requirements 7.6**
  - Test various viewport widths
  - Verify no horizontal overflow at any width
  - Verify content fits within viewport

- [ ]* 18.3 Write property test for touch target accessibility
  - **Property 7: Touch Target Accessibility**
  - **Validates: Requirements 3.9, 7.5**
  - Test all interactive elements on mobile viewport (<768px)
  - Verify minimum touch target size of 44×44 pixels
  - Test buttons, links, inputs, selects

- [ ]* 18.4 Write unit tests for responsive behavior
  - Test mobile card layout renders at small viewports
  - Test desktop table layout renders at large viewports
  - Test filter controls stack on mobile
  - Test filter controls horizontal on desktop
  - Test responsive typography

### 19. Implement performance optimizations

- [ ] 19.1 Add performance optimizations
  - Memoize ActivityLogList component with React.memo
  - Memoize expensive calculations (filtering, sorting) with useMemo
  - Implement debounce for search input (300ms) using custom hook or library
  - Add loading states that don't block UI
  - Verify server-side pagination limits data transfer to 50 logs per page
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ]* 19.2 Write unit tests for performance features
  - Test search debounce delays API calls
  - Test memoization prevents unnecessary re-renders
  - Test pagination limits data fetching

### 20. Final integration and end-to-end testing

- [ ] 20.1 Test complete user flows
  - Test navigation from inventory page to activity history page
  - Test back button returns to inventory page
  - Test applying multiple filters simultaneously
  - Test changing sort while filters are active
  - Test pagination with filters and sort applied
  - Test clearing filters resets to default state
  - Test URL sharing (copy URL with filters, open in new tab)
  - Test browser back/forward navigation preserves state
  - _Requirements: 1.2, 1.6, 4.8, 5.6, 5.7_

- [ ]* 20.2 Run all property-based tests
  - Execute all 14 property tests with 100+ iterations each
  - Verify all properties pass consistently
  - Document any edge cases discovered
  - Fix any failures and re-run tests

- [ ]* 20.3 Run all unit tests
  - Execute complete unit test suite
  - Verify minimum 80% code coverage
  - Fix any failing tests
  - Review coverage report for gaps

### 21. Final checkpoint - Complete feature verification

- [ ] 21. Final Checkpoint: Comprehensive feature verification
  - Verify all 10 requirements are met
  - Verify all 14 correctness properties pass
  - Verify accessibility with screen reader testing (manual)
  - Verify responsive design on multiple devices
  - Verify performance (page load time, interaction responsiveness)
  - Test with real data (large datasets, edge cases)
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and user interactions
- TypeScript is used throughout for type safety
- The implementation follows Next.js App Router patterns with Server and Client Components
- Supabase is used for all data fetching with optimized queries
- The design prioritizes accessibility, performance, and responsive design
