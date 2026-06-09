import { format } from "date-fns";
import { resolveIntervalDays } from "@/lib/care/scheduling";
import { relativeDueLabel } from "@/lib/dates";
import type { DueTaskRow } from "@/lib/db/repositories";

export type CareCueExplanation = {
  title: string;
  reason: string;
  details: string[];
};

function formatReminderTime(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return format(date, "p");
}

export function buildCareCueExplanation(row: DueTaskRow): CareCueExplanation {
  const taskName = row.schedule.customName ?? row.template?.name ?? "Care cue";
  const interval = resolveIntervalDays(
    row.schedule.intervalDays,
    row.template?.defaultIntervalDays ?? null,
  );
  const details: string[] = [];

  if (row.schedule.lastCompletedAt) {
    details.push(`Last done ${format(row.schedule.lastCompletedAt, "MMM d")}.`);
  } else {
    details.push("No completion has been logged yet.");
  }

  if (interval !== null) {
    details.push(`Repeats every ${interval} day${interval === 1 ? "" : "s"}.`);
  } else {
    details.push("This is a one-off schedule.");
  }

  if (row.schedule.nextDueAt) {
    details.push(`Next due ${relativeDueLabel(row.schedule.nextDueAt)}.`);
  }

  if (row.schedule.snoozedUntil) {
    details.push(
      `Snoozed until ${format(row.schedule.snoozedUntil, "MMM d")}.`,
    );
  }

  if (
    row.schedule.preferredHour !== null &&
    row.schedule.preferredMinute !== null
  ) {
    details.push(
      `Uses ${formatReminderTime(
        row.schedule.preferredHour,
        row.schedule.preferredMinute,
      )} for reminders when reminders are enabled.`,
    );
  } else {
    details.push("Uses your app reminder time when reminders are enabled.");
  }

  const reason =
    row.schedule.lastCompletedAt && interval !== null
      ? `Based on the last ${taskName.toLowerCase()} log and your ${interval}-day interval.`
      : "Based on the due date saved in this local schedule.";

  return {
    title: taskName,
    reason,
    details,
  };
}
