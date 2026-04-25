# Daily Briefing Auto-Popup Implementation

## Overview
The AI daily briefing now automatically pops up when users log in to the dashboard, with time-based greetings that change throughout the day.

## Changes Made

### 1. Enhanced Time-Based Greetings (`src/lib/utils.ts`)
Updated the `getTimeGreeting()` function to include four time periods:
- **Morning**: 12:00 AM - 11:59 AM → "Good morning"
- **Afternoon**: 12:00 PM - 4:59 PM → "Good afternoon"  
- **Evening**: 5:00 PM - 8:59 PM → "Good evening"
- **Night**: 9:00 PM - 11:59 PM → "Good night"

### 2. Moved Briefing Modal to Layout (`src/components/layout/dashboard-layout.tsx`)
- Added `DailyBriefingModal` import
- Placed the modal at the dashboard layout level (instead of just the dashboard page)
- This ensures the briefing appears on **all dashboard pages** after login, not just the main dashboard

### 3. Removed Duplicate Modal (`src/components/dashboard/dashboard-client.tsx`)
- Removed the `DailyBriefingModal` from the dashboard client component
- Removed the import statement
- This prevents duplicate modals from appearing

## How It Works

### Auto-Show Logic
The briefing modal automatically shows when:
1. User logs in and navigates to any dashboard page
2. User hasn't seen today's briefing yet (tracked via localStorage)
3. The briefing has finished loading (either from cache or freshly generated)

### Once-Per-Day Display
- Uses localStorage with a Malaysia timezone-aware key: `briefing_seen_{businessId}_{date}`
- When user dismisses the modal, it marks the briefing as "seen" for that day
- Won't show again until the next day (Malaysia time, UTC+8)

### Time-Based Greeting Examples
- **6:00 AM**: "Good morning, [Business Name]!"
- **2:00 PM**: "Good afternoon, [Business Name]!"
- **7:00 PM**: "Good evening, [Business Name]!"
- **10:00 PM**: "Good night, [Business Name]!"

## User Experience

1. **Login**: User logs in to the application
2. **Auto-Popup**: Briefing modal appears automatically with appropriate greeting
3. **Content**: Shows insights, urgent alerts, and closing message
4. **Dismiss**: User clicks "Start your day" or close button
5. **Persistence**: Modal won't show again until tomorrow

## Technical Details

### Components Involved
- `DailyBriefingModal` - The modal component
- `useDailyBriefing` - Hook that manages briefing state and localStorage
- `DashboardProvider` - Context that tracks modal open/close state
- `getTimeGreeting()` - Utility function for time-based greetings

### API Integration
- Briefing API: `/api/ai/briefing` (POST)
- Uses Gemini AI to generate personalized briefings
- Caches briefings per day to avoid regeneration
- Includes business data, revenue, inventory alerts, and expenses

## Testing Checklist

- [ ] Login at different times of day to verify greeting changes
- [ ] Verify modal appears automatically on first login
- [ ] Dismiss modal and verify it doesn't show again today
- [ ] Clear localStorage and verify modal reappears
- [ ] Navigate to different dashboard pages (inventory, chatbot, etc.) after login
- [ ] Check that modal only appears once per session per day
