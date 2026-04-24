import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Malaysia Timezone Utilities (UTC+8, no DST) ────────

export function getMalaysiaTime(): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 8 * 3600000)
}

export function getMalaysiaDateString(): string {
  return getMalaysiaTime().toISOString().split('T')[0]
  // Returns: "2026-04-24"
}

export function getTimeGreeting(): string {
  const hour = getMalaysiaTime().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function formatBriefingDate(): string {
  return getMalaysiaTime().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  // Returns: "Thursday, 24 Apr 2026"
}

export function getMalaysiaDayName(): string {
  return getMalaysiaTime().toLocaleDateString('en-MY', {
    weekday: 'long',
  })
}
