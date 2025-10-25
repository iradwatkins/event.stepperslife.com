import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";

/**
 * Format event date/time in the EVENT's timezone (not viewer's timezone)
 *
 * This ensures that an event in Chicago always shows "7:00 PM CT"
 * regardless of whether the viewer is in New York, California, etc.
 */

export function formatEventDate(timestamp: number, timezone: string): string {
  return formatInTimeZone(timestamp, timezone, "MMM d, yyyy");
}

export function formatEventDateTime(timestamp: number, timezone: string): string {
  return formatInTimeZone(timestamp, timezone, "MMM d, yyyy • h:mm a zzz");
}

export function formatEventTime(timestamp: number, timezone: string): string {
  return formatInTimeZone(timestamp, timezone, "h:mm a zzz");
}

export function formatEventDateTimeShort(timestamp: number, timezone: string): string {
  return formatInTimeZone(timestamp, timezone, "MMM d • h:mm a");
}

/**
 * Get short timezone abbreviation (ET, CT, PT, etc.)
 */
export function getTimezoneAbbr(timezone: string, timestamp: number): string {
  try {
    return formatInTimeZone(timestamp, timezone, "zzz");
  } catch {
    return timezone.split("/")[1] || timezone;
  }
}

/**
 * Check if event is happening today
 */
export function isToday(timestamp: number, timezone: string): boolean {
  const eventDate = formatInTimeZone(timestamp, timezone, "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  return eventDate === today;
}

/**
 * Get relative time string (e.g., "In 3 days", "Tomorrow", "Today")
 */
export function getRelativeEventTime(timestamp: number, timezone: string): string {
  const now = Date.now();
  const diff = timestamp - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
  return formatInTimeZone(timestamp, timezone, "MMM d");
}
