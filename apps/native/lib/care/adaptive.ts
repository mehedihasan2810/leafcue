import { SIGNIFICANT_DEVIATION } from "@/lib/care/engine";
import { medianGapDays, resolveIntervalDays } from "@/lib/care/scheduling";
import type {
  CareLog,
  CareTaskTemplate,
  PlantTaskSchedule,
} from "@/lib/db/types";

/**
 * The minimum number of completions before we trust the user's own cadence
 * enough to suggest matching it. Below this we stay quiet.
 */
const MIN_SAMPLES = 3;

export type IntervalSuggestion = {
  currentInterval: number;
  suggestedInterval: number;
  /** Positive = stretch the interval, negative = tighten it. */
  deltaDays: number;
  sampleSize: number;
};

/**
 * Learn from how the user *actually* cares for a plant. When the median gap
 * between recent completions drifts far enough from the scheduled interval,
 * propose matching their real cadence. Pure and on-device — it never mutates
 * anything; the user opts in to apply it.
 */
export function suggestIntervalAdjustment(args: {
  schedule: PlantTaskSchedule;
  template: CareTaskTemplate | null;
  recentLogs: ReadonlyArray<CareLog>;
}): IntervalSuggestion | null {
  const { schedule, template, recentLogs } = args;

  const currentInterval = resolveIntervalDays(
    schedule.intervalDays,
    template?.defaultIntervalDays ?? null,
  );
  if (currentInterval === null) return null;
  if (recentLogs.length < MIN_SAMPLES) return null;

  const gapMedian = medianGapDays(recentLogs.map((log) => log.completedAt));
  if (gapMedian === null) return null;

  const suggestedInterval = Math.max(1, Math.min(365, Math.round(gapMedian)));
  if (suggestedInterval === currentInterval) return null;

  const deviation = Math.abs(gapMedian - currentInterval) / currentInterval;
  if (deviation < SIGNIFICANT_DEVIATION) return null;

  return {
    currentInterval,
    suggestedInterval,
    deltaDays: suggestedInterval - currentInterval,
    sampleSize: recentLogs.length,
  };
}
