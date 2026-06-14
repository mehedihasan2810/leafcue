import type {
  Hemisphere,
  LightPreference,
  WateringPreference,
} from "@/lib/db/schema";
import type { Plant } from "@/lib/db/types";
import {
  applyCareStyleInterval,
  type CareStyle,
} from "@/screens/plants/edit/care-style";

/**
 * LeafCue care engine — a deterministic, fully on-device model that turns a
 * plant's environment (light, sun, pot, drainage, watering preference, season)
 * into a personalized care interval. No network, no AI service: just heuristics
 * that competitors hide behind a server. Every adjustment is explained back to
 * the user in plain language via `rationale`, so the schedule never feels like
 * a black box.
 *
 * The model is multiplicative around a base interval:
 *   interval = clamp(round(base × ∏ factors)) → then care-style preference.
 */

// Months are 0-indexed (January = 0). These windows are intentionally broad and
// shared with the advisory hints layer so the two never drift.
export const SUMMER_MONTHS: ReadonlyArray<number> = [5, 6, 7];
export const WINTER_MONTHS: ReadonlyArray<number> = [10, 11, 0, 1];

/** A completion cadence drifting this far from the schedule is "significant". */
export const SIGNIFICANT_DEVIATION = 0.25;

const MIN_INTERVAL_DAYS = 1;
const MAX_INTERVAL_DAYS = 365;

const POT_SIZE_NUMERIC = /(\d+(?:\.\d+)?)/;

/** Extract the leading numeric value from a free-form pot size like "4 in". */
export function parsePotSizeNumeric(
  potSize: string | null | undefined,
): number | null {
  if (!potSize) return null;
  const match = potSize.match(POT_SIZE_NUMERIC);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

/**
 * Parse an explicit day cadence out of preset care text. Built-in presets use
 * descriptive guidance ("water when the top 2-3cm is dry"), so this usually
 * returns null and the engine falls back to the template default — but it lets
 * future presets carry an exact range like "every 7-10 days".
 */
export function parsePresetIntervalRange(
  text: string | null | undefined,
): { lower: number; upper: number } | null {
  if (!text) return null;
  const range = text.match(/(\d+)\s*(?:-|to|–)\s*(\d+)\s*day/i);
  if (range) {
    const lower = Number(range[1]);
    const upper = Number(range[2]);
    if (Number.isFinite(lower) && Number.isFinite(upper) && lower <= upper) {
      return { lower, upper };
    }
  }
  const single = text.match(/every\s+(\d+)\s*day/i);
  if (single) {
    const value = Number(single[1]);
    if (Number.isFinite(value)) {
      return { lower: value, upper: value };
    }
  }
  const weekly = text.match(/every\s+(\d+)\s*week/i);
  if (weekly) {
    const weeks = Number(weekly[1]);
    if (Number.isFinite(weeks)) {
      return { lower: weeks * 7, upper: weeks * 7 };
    }
  }
  return null;
}

/**
 * Resolve the base interval the engine starts from: a parseable preset cadence
 * if available, otherwise the care-task template default.
 */
export function resolveBaseInterval(
  templateDefaultDays: number | null | undefined,
  presetText: string | null | undefined,
): number | null {
  const range = parsePresetIntervalRange(presetText);
  if (range) return Math.round((range.lower + range.upper) / 2);
  if (templateDefaultDays != null && templateDefaultDays > 0) {
    return templateDefaultDays;
  }
  return null;
}

export type Season = "spring" | "summer" | "autumn" | "winter";

const SOUTHERN_FLIP: Record<Season, Season> = {
  winter: "summer",
  spring: "autumn",
  summer: "winter",
  autumn: "spring",
};

/** Map a date + hemisphere to a meteorological season. */
export function getSeason(now: Date, hemisphere: Hemisphere = "north"): Season {
  const month = now.getMonth();
  const northern: Season =
    month === 11 || month <= 1
      ? "winter"
      : month <= 4
        ? "spring"
        : month <= 7
          ? "summer"
          : "autumn";
  return hemisphere === "north" ? northern : SOUTHERN_FLIP[northern];
}

export const seasonLabels: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

// --- Factor tables -------------------------------------------------------

const LIGHT_WATER_MULTIPLIER: Record<LightPreference, number> = {
  low: 1.3,
  medium: 1.15,
  "bright-indirect": 1.0,
  "direct-sun": 0.85,
};

const WATERING_PREF_MULTIPLIER: Record<WateringPreference, number> = {
  low: 1.3,
  moderate: 1.0,
  high: 0.8,
  "let-dry-between": 1.2,
  "keep-moist": 0.75,
};

const SEASON_WATER_MULTIPLIER: Record<Season, number> = {
  spring: 1.0,
  summer: 0.85,
  autumn: 1.05,
  winter: 1.3,
};

const SEASON_FERTILIZE_MULTIPLIER: Record<Season, number> = {
  spring: 0.85,
  summer: 0.95,
  autumn: 1.25,
  winter: 2.5,
};

const LIGHT_FERTILIZE_MULTIPLIER: Record<LightPreference, number> = {
  low: 1.2,
  medium: 1.05,
  "bright-indirect": 1.0,
  "direct-sun": 0.95,
};

// --- Public types --------------------------------------------------------

export type CareEnvironment = {
  lightPreference: LightPreference | null;
  wateringPreference: WateringPreference | null;
  potSize: string | null;
  hasDrainage: boolean | null;
  directSunHours: number | null;
  careStyle: CareStyle;
  now: Date;
  hemisphere: Hemisphere;
};

export type IntervalFactor = {
  id: string;
  /** Short chip label, e.g. "Low light". */
  label: string;
  multiplier: number;
};

export type ComputedInterval = {
  /** Final interval after environment factors and care-style preference. */
  intervalDays: number;
  /** Interval the engine started from (preset or template default). */
  baseIntervalDays: number;
  /** Interval after environment factors, before care-style preference. */
  preStyleIntervalDays: number;
  /** Factors that actually moved the number (multiplier ≠ 1). */
  factors: IntervalFactor[];
  /** Plain-language sentences for the "Why this schedule?" affordance. */
  rationale: string[];
  season: Season;
};

function clampInterval(value: number): number {
  return Math.max(MIN_INTERVAL_DAYS, Math.min(MAX_INTERVAL_DAYS, value));
}

type FactorDraft = {
  id: string;
  label: string;
  multiplier: number;
  reason?: string;
};

function compose(
  base: number,
  drafts: ReadonlyArray<FactorDraft>,
  env: CareEnvironment,
  season: Season,
): ComputedInterval {
  const factors: IntervalFactor[] = [];
  const rationale: string[] = [];

  for (const draft of drafts) {
    if (draft.multiplier === 1) continue;
    factors.push({
      id: draft.id,
      label: draft.label,
      multiplier: draft.multiplier,
    });
    if (draft.reason) rationale.push(draft.reason);
  }

  const product = factors.reduce((acc, factor) => acc * factor.multiplier, 1);
  const preStyleIntervalDays = clampInterval(Math.round(base * product));
  const intervalDays = clampInterval(
    applyCareStyleInterval(preStyleIntervalDays, env.careStyle) ??
      preStyleIntervalDays,
  );

  // If the environment moved the interval but no factor carried a specific
  // explanation, still mark it tailored with a generic note so the UI badge
  // reliably reflects that the schedule was personalized.
  if (factors.length > 0 && rationale.length === 0) {
    rationale.push("Tailored to this plant's spot and the current season.");
  }

  if (env.careStyle === "ease") {
    rationale.push("Ease mode spaces reminders out a little.");
  } else if (env.careStyle === "growth") {
    rationale.push("Growth mode keeps you a touch more attentive.");
  }

  return {
    intervalDays,
    baseIntervalDays: base,
    preStyleIntervalDays,
    factors,
    rationale,
    season,
  };
}

/**
 * Personalize a watering interval from the plant's environment.
 * `base` is the resolved starting interval (see {@link resolveBaseInterval}).
 */
export function computeWateringInterval(
  base: number,
  env: CareEnvironment,
): ComputedInterval {
  const season = getSeason(env.now, env.hemisphere);
  const potNumeric = parsePotSizeNumeric(env.potSize);
  const drafts: FactorDraft[] = [];

  if (env.lightPreference) {
    const multiplier = LIGHT_WATER_MULTIPLIER[env.lightPreference];
    drafts.push({
      id: "light",
      label: lightLabel(env.lightPreference),
      multiplier,
      reason:
        multiplier > 1
          ? "Lower light means the soil dries slowly, so waterings are spaced out."
          : multiplier < 1
            ? "Bright, direct light dries the soil faster, so waterings are closer together."
            : undefined,
    });
  }

  if (env.wateringPreference) {
    const multiplier = WATERING_PREF_MULTIPLIER[env.wateringPreference];
    drafts.push({
      id: "watering-pref",
      label: wateringLabel(env.wateringPreference),
      multiplier,
      reason:
        env.wateringPreference === "keep-moist"
          ? "This species likes staying evenly moist, so a shorter gap."
          : env.wateringPreference === "let-dry-between"
            ? "This species prefers drying out between waterings."
            : multiplier < 1
              ? "This species is a thirsty one — a shorter gap."
              : multiplier > 1
                ? "This species is drought-tolerant — a longer gap."
                : undefined,
    });
  }

  if (potNumeric !== null) {
    const multiplier = potNumeric <= 4 ? 0.85 : potNumeric >= 10 ? 1.2 : 1;
    drafts.push({
      id: "pot-size",
      label: potNumeric <= 4 ? "Small pot" : "Large pot",
      multiplier,
      reason:
        multiplier < 1
          ? "Small pots dry quickly, so the interval is a bit tighter."
          : multiplier > 1
            ? "Large pots hold moisture longer, so the interval is looser."
            : undefined,
    });
  }

  if (env.hasDrainage === false) {
    drafts.push({
      id: "no-drainage",
      label: "No drainage",
      multiplier: 1.2,
      reason:
        "No drainage hole — watering a little less often to avoid root rot.",
    });
  }

  if (env.directSunHours !== null && env.directSunHours >= 3) {
    const multiplier = env.directSunHours >= 6 ? 0.85 : 0.92;
    drafts.push({
      id: "direct-sun",
      label: `${env.directSunHours}h direct sun`,
      multiplier,
      reason: "Hours of direct sun dry the soil faster.",
    });
  }

  const seasonMultiplier = SEASON_WATER_MULTIPLIER[season];
  drafts.push({
    id: "season",
    label: seasonLabels[season],
    multiplier: seasonMultiplier,
    reason:
      season === "summer"
        ? "Summer heat and growth speed up drying."
        : season === "winter"
          ? "Most houseplants slow down in winter, so waterings are less frequent."
          : undefined,
  });

  return compose(base, drafts, env, season);
}

/** Personalize a fertilizing interval from light and season. */
export function computeFertilizeInterval(
  base: number,
  env: CareEnvironment,
): ComputedInterval {
  const season = getSeason(env.now, env.hemisphere);
  const drafts: FactorDraft[] = [];

  if (env.lightPreference) {
    const multiplier = LIGHT_FERTILIZE_MULTIPLIER[env.lightPreference];
    drafts.push({
      id: "light",
      label: lightLabel(env.lightPreference),
      multiplier,
      reason:
        multiplier > 1
          ? "Lower light slows growth, so feeding is less frequent."
          : multiplier < 1
            ? "Bright light supports active growth, so feeding a little more often."
            : undefined,
    });
  }

  const seasonMultiplier = SEASON_FERTILIZE_MULTIPLIER[season];
  drafts.push({
    id: "season",
    label: seasonLabels[season],
    multiplier: seasonMultiplier,
    reason:
      season === "winter"
        ? "Feeding is paused back for winter dormancy."
        : season === "spring"
          ? "Spring is peak growing season, so feeding a bit more often."
          : season === "autumn"
            ? "Growth tapers in autumn, so feeding eases off."
            : "Steady summer growth keeps feeding fairly regular.",
  });

  return compose(base, drafts, env, season);
}

function lightLabel(light: LightPreference): string {
  switch (light) {
    case "low":
      return "Low light";
    case "medium":
      return "Medium light";
    case "bright-indirect":
      return "Bright indirect";
    case "direct-sun":
      return "Direct sun";
  }
}

function wateringLabel(watering: WateringPreference): string {
  switch (watering) {
    case "low":
      return "Low water";
    case "moderate":
      return "Moderate water";
    case "high":
      return "High water";
    case "let-dry-between":
      return "Let dry between";
    case "keep-moist":
      return "Keep moist";
  }
}

/** Build the engine's environment input from a stored plant. */
export function careEnvironmentFromPlant(
  plant: Plant,
  options: { careStyle?: CareStyle; now?: Date; hemisphere?: Hemisphere } = {},
): CareEnvironment {
  return {
    lightPreference: plant.lightPreference ?? null,
    wateringPreference: plant.wateringPreference ?? null,
    potSize: plant.potSize ?? null,
    hasDrainage: plant.hasDrainage ?? null,
    directSunHours: plant.directSunHours ?? null,
    careStyle: options.careStyle ?? "balanced",
    now: options.now ?? new Date(),
    hemisphere: options.hemisphere ?? "north",
  };
}
