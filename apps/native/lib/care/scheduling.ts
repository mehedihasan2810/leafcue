import { addDays, isBefore, startOfDay } from "date-fns";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type QuietHours = {
  enabled: boolean;
  startHour: number;
  endHour: number;
};

/**
 * Compute the next due date by adding `intervalDays` days to `base`.
 * Returns `null` for one-off schedules (interval is null or non-positive).
 *
 * @example
 * computeNextDueAt(new Date("2026-04-01"), 7)
 *   // => 2026-04-08T00:00:00.000Z
 * computeNextDueAt(new Date("2026-04-01"), null)
 *   // => null
 */
export function computeNextDueAt(
  base: Date,
  intervalDays: number | null,
): Date | null {
  if (intervalDays === null || intervalDays <= 0) return null;
  return new Date(base.getTime() + intervalDays * MS_PER_DAY);
}

/**
 * Compute the next due date for a "skip once" action: advance the schedule by
 * one interval without recording a completion. Falls back to `now` when the
 * schedule has never been due, and clamps the result to at least tomorrow so
 * the same task does not stay in Today's list after a skip.
 *
 * @example
 * computeSkipOnceNextDueAt(new Date("2026-04-01"), 7, new Date("2026-04-02"))
 *   // => 2026-04-08
 */
export function computeSkipOnceNextDueAt(
  current: Date | null,
  intervalDays: number | null,
  now: Date,
): Date | null {
  if (intervalDays === null || intervalDays <= 0) return null;
  const anchor = current ?? now;
  const candidate = new Date(anchor.getTime() + intervalDays * MS_PER_DAY);
  const minimum = addDays(startOfDay(now), 1);
  if (isBefore(candidate, minimum)) return minimum;
  return candidate;
}

/**
 * Set the local hour/minute on `date` while keeping the calendar day. Useful
 * for aligning notifications with the user's preferred reminder time.
 *
 * @example
 * clampToReminderTime(new Date("2026-04-01T03:30:00"), 9, 0)
 *   // => 2026-04-01T09:00:00 (local)
 */
export function clampToReminderTime(
  date: Date,
  hour: number,
  minute: number,
): Date {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

/**
 * Check whether `date` falls inside the configured quiet hours window. The
 * window can wrap midnight (e.g. start=22, end=7).
 */
export function isInQuietHours(date: Date, quiet: QuietHours): boolean {
  if (!quiet.enabled) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  const start = quiet.startHour * 60;
  const end = quiet.endHour * 60;
  if (start === end) return false;
  if (start < end) {
    return minutes >= start && minutes < end;
  }
  return minutes >= start || minutes < end;
}

/**
 * Move a date out of the quiet hours window by snapping it forward to the
 * configured end-of-quiet hour (next day if the end has already passed today).
 */
export function shiftOutOfQuietHours(date: Date, quiet: QuietHours): Date {
  if (!quiet.enabled) return date;
  if (!isInQuietHours(date, quiet)) return date;
  const shifted = new Date(date);
  shifted.setHours(quiet.endHour, 0, 0, 0);
  if (quiet.startHour > quiet.endHour && date.getHours() >= quiet.startHour) {
    shifted.setDate(shifted.getDate() + 1);
  }
  if (shifted.getTime() <= date.getTime()) {
    shifted.setDate(shifted.getDate() + 1);
  }
  return shifted;
}

export type ResolvedReminderTime = {
  scheduledAt: Date;
  shifted: boolean;
};

/**
 * Combine a base due date with the user's reminder hour/minute and quiet hours
 * to produce the actual moment we want the OS to fire the local notification.
 */
export function resolveReminderTime(
  dueAt: Date,
  reminderHour: number,
  reminderMinute: number,
  quiet: QuietHours,
  now: Date = new Date(),
): ResolvedReminderTime {
  const aligned = clampToReminderTime(dueAt, reminderHour, reminderMinute);
  const fired = aligned.getTime() <= now.getTime() ? new Date(now) : aligned;
  const shifted = shiftOutOfQuietHours(fired, quiet);
  return {
    scheduledAt: shifted,
    shifted: shifted.getTime() !== fired.getTime(),
  };
}

/**
 * Resolve the effective interval for a schedule, preferring an explicit
 * override on the schedule, then the template's default, otherwise null.
 */
export function resolveIntervalDays(
  scheduleIntervalDays: number | null,
  templateDefaultIntervalDays: number | null | undefined,
): number | null {
  if (scheduleIntervalDays !== null && scheduleIntervalDays > 0) {
    return scheduleIntervalDays;
  }
  if (
    templateDefaultIntervalDays !== null &&
    templateDefaultIntervalDays !== undefined &&
    templateDefaultIntervalDays > 0
  ) {
    return templateDefaultIntervalDays;
  }
  return null;
}

/**
 * Compute the median of a sorted-or-unsorted numeric list. Returns null on
 * empty input.
 */
export function median(values: ReadonlyArray<number>): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const left = sorted[mid - 1] ?? 0;
    const right = sorted[mid] ?? 0;
    return (left + right) / 2;
  }
  return sorted[mid] ?? null;
}

/**
 * Convert an array of completion timestamps into the median gap (in days)
 * between consecutive completions. Returns null if fewer than 2 completions.
 */
export function medianGapDays(
  completedAtList: ReadonlyArray<Date>,
): number | null {
  if (completedAtList.length < 2) return null;
  const sorted = [...completedAtList].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (!previous || !current) continue;
    gaps.push((current.getTime() - previous.getTime()) / MS_PER_DAY);
  }
  return median(gaps);
}
