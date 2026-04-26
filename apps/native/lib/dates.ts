import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isSameDay,
  isToday,
  isYesterday,
  startOfDay,
} from "date-fns";

export function startOfToday(): Date {
  return startOfDay(new Date());
}

export function endOfToday(): Date {
  const start = startOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function isOverdue(date: Date | null, now: Date = new Date()): boolean {
  if (!date) return false;
  return date.getTime() < startOfDay(now).getTime();
}

export function isDueToday(date: Date | null, now: Date = new Date()): boolean {
  if (!date) return false;
  return isSameDay(date, now);
}

export function relativeDueLabel(
  date: Date | null,
  now: Date = new Date(),
): string {
  if (!date) return "No schedule";
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  const diffDays = differenceInCalendarDays(date, now);
  if (diffDays > 0 && diffDays <= 6) {
    return `In ${diffDays} day${diffDays === 1 ? "" : "s"}`;
  }
  if (diffDays < 0 && diffDays >= -6) {
    const days = Math.abs(diffDays);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  return format(date, "MMM d");
}

export function relativeFromNow(date: Date | null): string {
  if (!date) return "—";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function timeOfDayGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function formatLongDate(date: Date = new Date()): string {
  return format(date, "EEEE, MMMM d");
}

export function formatIsoDate(date: Date | null | undefined): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

export function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parts = trimmed.split("-");
  const yearPart = parts[0];
  const monthPart = parts[1];
  const dayPart = parts[2];
  if (!yearPart || !monthPart || !dayPart) return null;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}
