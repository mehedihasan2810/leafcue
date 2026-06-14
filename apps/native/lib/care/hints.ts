import {
  parsePotSizeNumeric,
  parsePresetIntervalRange,
  SIGNIFICANT_DEVIATION,
  SUMMER_MONTHS,
  WINTER_MONTHS,
} from "@/lib/care/engine";
import { medianGapDays, resolveIntervalDays } from "@/lib/care/scheduling";
import type {
  CareLog,
  CareTaskTemplate,
  Plant,
  PlantPreset,
  PlantTaskSchedule,
} from "@/lib/db/types";

export const careHintSeverityValues = ["info", "caution", "warning"] as const;
export type CareHintSeverity = (typeof careHintSeverityValues)[number];

export type CareHint = {
  id: string;
  severity: CareHintSeverity;
  message: string;
};

export type BuildSmartHintsInput = {
  plant: Plant;
  preset: PlantPreset | null;
  template: CareTaskTemplate | null;
  schedule: PlantTaskSchedule;
  recentLogs: ReadonlyArray<CareLog>;
  now?: Date;
};

function isWateringTask(template: CareTaskTemplate | null): boolean {
  return template?.key === "water";
}

function isFertilizerTask(template: CareTaskTemplate | null): boolean {
  return template?.key === "fertilize";
}

function isMonth(date: Date, months: ReadonlyArray<number>): boolean {
  return months.includes(date.getMonth());
}

/**
 * Build deterministic on-device care hints for a single schedule. These are
 * advisory cues, never diagnoses, and run entirely against local state.
 *
 * Heuristics covered:
 *  - Suggest preset interval range when the user's interval differs.
 *  - Warn when the pot has no drainage and the task is watering.
 *  - Note that low-light plants typically dry slower.
 *  - Recommend a tighter interval for very small pots, looser for very large.
 *  - Flag when the user's median completion gap drifts >=25% from the schedule.
 *  - Note seasonal effects (summer / winter) on watering.
 *  - Reduce fertilizer cadence in winter.
 */
export function buildSmartHints(input: BuildSmartHintsInput): CareHint[] {
  const { plant, preset, template, schedule, recentLogs } = input;
  const now = input.now ?? new Date();
  const hints: CareHint[] = [];

  const interval = resolveIntervalDays(
    schedule.intervalDays,
    template?.defaultIntervalDays ?? null,
  );

  if (preset && interval !== null) {
    const presetSource = isWateringTask(template) ? preset.water : null;
    const range = parsePresetIntervalRange(presetSource);
    if (range && (interval < range.lower || interval > range.upper)) {
      hints.push({
        id: "preset-interval",
        severity: "info",
        message: `${plant.nickname} usually likes water every ${range.lower}–${range.upper} days. Keep current ${interval}-day schedule?`,
      });
    }
  }

  if (isWateringTask(template) && plant.hasDrainage === false) {
    hints.push({
      id: "no-drainage",
      severity: "caution",
      message:
        "This pot has no drainage hole — water sparingly to avoid root rot.",
    });
  }

  if (
    isWateringTask(template) &&
    plant.lightPreference === "low" &&
    interval !== null &&
    interval < 7
  ) {
    hints.push({
      id: "low-light-slow-dry",
      severity: "info",
      message:
        "Low-light plants usually dry slower. Consider stretching the interval a couple of days.",
    });
  }

  const potSize = parsePotSizeNumeric(plant.potSize);
  if (isWateringTask(template) && potSize !== null) {
    if (potSize <= 4 && interval !== null && interval > 5) {
      hints.push({
        id: "small-pot-frequent",
        severity: "info",
        message:
          "Small pots dry quickly — a tighter watering interval may help.",
      });
    } else if (potSize >= 10 && interval !== null && interval < 10) {
      hints.push({
        id: "large-pot-loose",
        severity: "info",
        message:
          "Large pots hold moisture longer — you can probably stretch this interval.",
      });
    }
  }

  if (interval !== null && recentLogs.length >= 3) {
    const gapMedian = medianGapDays(recentLogs.map((log) => log.completedAt));
    if (gapMedian !== null) {
      const deviation = Math.abs(gapMedian - interval) / interval;
      if (deviation >= SIGNIFICANT_DEVIATION) {
        const rounded = Math.round(gapMedian);
        hints.push({
          id: "history-median",
          severity: "info",
          message: `Your last completions average about every ${rounded} days. Want to match that?`,
        });
      }
    }
  }

  if (
    isWateringTask(template) &&
    plant.lightPreference === "direct-sun" &&
    isMonth(now, SUMMER_MONTHS)
  ) {
    hints.push({
      id: "summer-direct-sun",
      severity: "info",
      message:
        "Hot months + direct sun usually mean faster drying. Check the soil more often.",
    });
  }

  if (
    isWateringTask(template) &&
    isMonth(now, WINTER_MONTHS) &&
    interval !== null &&
    interval < 10
  ) {
    hints.push({
      id: "winter-water-down",
      severity: "info",
      message: "Most houseplants slow down in winter — water less frequently.",
    });
  }

  if (isFertilizerTask(template) && isMonth(now, WINTER_MONTHS)) {
    hints.push({
      id: "winter-fertilize-down",
      severity: "caution",
      message:
        "Skip or halve fertilizer during winter dormancy for most houseplants.",
    });
  }

  return hints;
}
