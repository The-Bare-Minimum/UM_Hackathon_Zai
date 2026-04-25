# Requirements Document

## Introduction

The Recent Activity History page is a dedicated view for displaying comprehensive inventory activity logs in an inventory management system. Currently, the inventory page shows only the last 10 activity logs in a "Recent Activity" card. This new page will provide users with access to all historical activity logs with enhanced filtering, sorting, and pagination capabilities. Users will access this page via a "View All" link from the Recent Activity card on the main inventory page.

## Glossary

- **Activity_History_Page**: The dedicated page component that displays comprehensive inventory activity logs
- **Activity_Log**: A record of an inventory change event containing item name, change type, quantity change, notes, and timestamp
- **Inventory_Page**: The main inventory management page that displays inventory items, statistics, and a Recent Activity card
- **Recent_Activity_Card**: A UI component on the Inventory Page showing the last 10 activity logs
- **View_All_Link**: A clickable link in the Recent Activity Card that navigates to the Activity History Page
- **Filter_Control**: UI component allowing users to filter logs by change type, date range, or item name
- **Sort_Control**: UI component allowing users to sort logs by date, item name, or change type
- **Pagination_Control**: UI component allowing users to navigate through pages of activity logs
- **Change_Type**: The type of inventory change (add, deduct, adjust, invoice)
- **Dashboard_Layout**: The consistent layout structure used across all dashboard pages including navigation and header
- **Mobile_Viewport**: Screen width less than 768 pixels
- **Desktop_Viewport**: Screen width 768 pixels or greater
- **Loading_State**: Visual feedback indicating data is being fetched from the server
- **Empty_State**: Visual feedback when no activity logs match the current filters or no logs exist
- **Touch_Target**: Interactive UI element with minimum 44×44 pixel tap area for mobile accessibility

## Requirements

### Requirement 1: Page Navigation and Access

**User Story:** As a user, I want to access the Activity History Page from the Recent Activity card, so that I can view all historical inventory activity logs.

#### Acceptance Criteria

1. THE View_All_Link SHALL be displayed at the bottom of the Recent_Activity_Card on the Inventory_Page
2. WHEN a user clicks the View_All_Link, THE System SHALL navigate to the Activity_History_Page
3. THE Activity_History_Page SHALL be accessible via the route `/inventory/activity-history`
4. THE Activity_History_Page SHALL use the Dashboard_Layout consistent with other dashboard pages
5. THE Activity_History_Page SHALL display a page title "Activity History" in the header
6. THE Activity_History_Page SHALL include a back navigation control that returns to the Inventory_Page

### Requirement 2: Activity Log Display

**User Story:** As a user, I want to see all inventory activity logs with clear information, so that I can track inventory changes over time.

#### Acceptance Criteria

1. THE Activity_History_Page SHALL display all Activity_Logs for the current business ordered by created_at timestamp descending by default
2. FOR EACH Activity_Log, THE Activity_History_Page SHALL display the item name, change type, quantity change, notes (if present), and timestamp
3. THE Activity_History_Page SHALL format timestamps in a human-readable format (e.g., "2 hours ago", "Jan 15, 2024 at 3:45 PM")
4. THE Activity_History_Page SHALL visually distinguish different Change_Types using color coding or icons (add: green/plus, deduct: red/minus, adjust: blue/edit, invoice: purple/document)
5. WHEN quantity_change is positive, THE Activity_History_Page SHALL display it with a plus sign prefix (e.g., "+50")
6. WHEN quantity_change is negative, THE Activity_History_Page SHALL display it with a minus sign prefix (e.g., "-25")
7. WHEN an Activity_Log has no notes, THE Activity_History_Page SHALL omit the notes field from the display

### Requirement 3: Pagination

**User Story:** As a user, I want to navigate through activity logs in manageable pages, so that the page loads quickly and I can find specific logs efficiently.

#### Acceptance Criteria

1. THE Activity_History_Page SHALL display 50 Activity_Logs per page by default
2. THE Pagination_Control SHALL display the current page number and total number of pages
3. THE Pagination_Control SHALL include Previous and Next buttons for navigation
4. WHEN the user is on the first page, THE Pagination_Control SHALL disable the Previous button
5. WHEN the user is on the last page, THE Pagination_Control SHALL disable the Next button
6. WHEN a user clicks Next, THE Activity_History_Page SHALL load and display the next page of Activity_Logs
7. WHEN a user clicks Previous, THE Activity_History_Page SHALL load and display the previous page of Activity_Logs
8. THE Activity_History_Page SHALL preserve scroll position at the top when navigating between pages
9. THE Pagination_Control SHALL meet minimum Touch_Target size requirements on Mobile_Viewport

### Requirement 4: Filtering Capabilities

**User Story:** As a user, I want to filter activity logs by change type, date range, and item name, so that I can find specific inventory changes quickly.

#### Acceptance Criteria

1. THE Activity_History_Page SHALL provide a Filter_Control for Change_Type with options: All, Add, Deduct, Adjust, Invoice
2. THE Activity_History_Page SHALL provide a Filter_Control for date range with options: All Time, Today, Last 7 Days, Last 30 Days, Custom Range
3. WHEN Custom Range is selected, THE Activity_History_Page SHALL display date picker inputs for start date and end date
4. THE Activity_History_Page SHALL provide a search input Filter_Control for filtering by item name
5. WHEN a user applies a Change_Type filter, THE Activity_History_Page SHALL display only Activity_Logs matching the selected Change_Type
6. WHEN a user applies a date range filter, THE Activity_History_Page SHALL display only Activity_Logs within the selected date range
7. WHEN a user enters text in the item name search, THE Activity_History_Page SHALL display only Activity_Logs where the item_name contains the search text (case-insensitive)
8. THE Activity_History_Page SHALL apply all active filters simultaneously using AND logic
9. WHEN filters result in zero Activity_Logs, THE Activity_History_Page SHALL display an Empty_State with a clear message and option to clear filters
10. THE Activity_History_Page SHALL include a "Clear All Filters" button that resets all Filter_Controls to default values

### Requirement 5: Sorting Capabilities

**User Story:** As a user, I want to sort activity logs by different criteria, so that I can organize the information in the most useful way for my current task.

#### Acceptance Criteria

1. THE Activity_History_Page SHALL provide a Sort_Control with options: Newest First, Oldest First, Item Name (A-Z), Item Name (Z-A)
2. WHEN a user selects "Newest First", THE Activity_History_Page SHALL sort Activity_Logs by created_at timestamp descending
3. WHEN a user selects "Oldest First", THE Activity_History_Page SHALL sort Activity_Logs by created_at timestamp ascending
4. WHEN a user selects "Item Name (A-Z)", THE Activity_History_Page SHALL sort Activity_Logs by item_name alphabetically ascending
5. WHEN a user selects "Item Name (Z-A)", THE Activity_History_Page SHALL sort Activity_Logs by item_name alphabetically descending
6. THE Activity_History_Page SHALL persist the selected sort order when navigating between pages
7. THE Activity_History_Page SHALL apply sorting after filtering

### Requirement 6: Loading and Error States

**User Story:** As a user, I want clear feedback when data is loading or when errors occur, so that I understand the system status and can take appropriate action.

#### Acceptance Criteria

1. WHEN the Activity_History_Page is initially loading data, THE Activity_History_Page SHALL display a Loading_State with a skeleton screen or spinner
2. WHEN pagination is loading new data, THE Activity_History_Page SHALL display a Loading_State indicator without removing existing content
3. IF data fetching fails, THEN THE Activity_History_Page SHALL display an error message with a retry button
4. WHEN a user clicks the retry button, THE Activity_History_Page SHALL attempt to fetch the data again
5. WHEN no Activity_Logs exist for the business, THE Activity_History_Page SHALL display an Empty_State with a message "No activity logs yet" and guidance text

### Requirement 7: Responsive Design

**User Story:** As a user, I want the Activity History Page to work well on both mobile and desktop devices, so that I can access inventory history from any device.

#### Acceptance Criteria

1. THE Activity_History_Page SHALL adapt its layout for Mobile_Viewport and Desktop_Viewport
2. ON Mobile_Viewport, THE Activity_History_Page SHALL display Activity_Logs in a stacked card layout with full-width cards
3. ON Desktop_Viewport, THE Activity_History_Page SHALL display Activity_Logs in a table layout with columns for item name, change type, quantity, notes, and timestamp
4. THE Filter_Control and Sort_Control SHALL stack vertically on Mobile_Viewport and display horizontally on Desktop_Viewport
5. THE Activity_History_Page SHALL ensure all interactive elements meet minimum Touch_Target size on Mobile_Viewport
6. THE Activity_History_Page SHALL prevent horizontal scrolling on all viewport sizes
7. THE Activity_History_Page SHALL use responsive typography that scales appropriately for different viewport sizes

### Requirement 8: Accessibility

**User Story:** As a user with accessibility needs, I want the Activity History Page to be fully accessible, so that I can use it with assistive technologies.

#### Acceptance Criteria

1. THE Activity_History_Page SHALL provide descriptive aria-labels for all Filter_Controls and Sort_Controls
2. THE Activity_History_Page SHALL ensure all interactive elements are keyboard navigable with visible focus indicators
3. THE Activity_History_Page SHALL maintain a logical tab order through all interactive elements
4. THE Activity_History_Page SHALL use semantic HTML elements (table, button, select, input) for proper screen reader support
5. THE Activity_History_Page SHALL ensure text contrast ratios meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text)
6. THE Activity_History_Page SHALL provide alternative text or aria-labels for all icons used in Change_Type indicators
7. WHEN Loading_State is active, THE Activity_History_Page SHALL announce loading status to screen readers using aria-live regions
8. WHEN filters are applied, THE Activity_History_Page SHALL announce the number of results to screen readers

### Requirement 9: Performance

**User Story:** As a user, I want the Activity History Page to load quickly and respond smoothly, so that I can work efficiently without delays.

#### Acceptance Criteria

1. THE Activity_History_Page SHALL fetch only the current page of Activity_Logs from the server (not all logs)
2. THE Activity_History_Page SHALL implement server-side pagination to limit data transfer
3. THE Activity_History_Page SHALL debounce the item name search input with a 300ms delay to reduce unnecessary API calls
4. THE Activity_History_Page SHALL cache the current page of Activity_Logs to avoid refetching when returning from other pages
5. THE Activity_History_Page SHALL use optimistic UI updates for filter and sort changes when possible
6. THE Activity_History_Page SHALL lazy load images or icons if used in the Activity_Log display
7. THE Activity_History_Page SHALL achieve a First Contentful Paint (FCP) of less than 1.5 seconds on a standard 4G connection

### Requirement 10: Data Consistency

**User Story:** As a user, I want the activity logs to reflect the current state of the database, so that I can trust the information I see.

#### Acceptance Criteria

1. THE Activity_History_Page SHALL fetch Activity_Logs using the existing getInventoryLogs function with pagination parameters
2. THE Activity_History_Page SHALL display Activity_Logs only for the current authenticated user's business
3. WHEN a user navigates to the Activity_History_Page, THE System SHALL verify the user is authenticated
4. IF the user is not authenticated, THEN THE System SHALL redirect to the login page
5. IF the user has no associated business, THEN THE System SHALL redirect to the onboarding page
6. THE Activity_History_Page SHALL display the same Activity_Log data structure as the Recent_Activity_Card (item_name, change_type, quantity_change, notes, created_at)
