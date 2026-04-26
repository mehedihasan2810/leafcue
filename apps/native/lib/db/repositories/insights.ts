import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { and, asc, desc, eq, gte, isNotNull, isNull, lte } from "drizzle-orm";

import { MS_PER_DAY } from "@/lib/care/scheduling";
import type { LeafCueDbOrTx } from "@/lib/db";
import {
  careLogs,
  growthMeasurements,
  healthObservations,
  plants,
  plantTaskSchedules,
} from "@/lib/db/schema";
import type {
  GrowthMeasurement,
  HealthObservation,
  Plant,
} from "@/lib/db/types";

export type CountedPlant = {
  plant: Plant;
  count: number;
};

export type GrowthMilestone = {
  plant: Plant;
  measurement: GrowthMeasurement;
};

export type ActiveIssueRow = {
  plant: Plant;
  observation: HealthObservation;
};

export type WateringConsistency = "steady" | "mostly_steady" | "catching_up";

export type InsightsSummary = {
  totalPlants: number;
  mostCaredForPlants: CountedPlant[];
  mostOverdueRightNow: CountedPlant[];
  recentGrowthMilestones: GrowthMilestone[];
  plantsWithActiveIssues: ActiveIssueRow[];
  careStreakDays: number;
  wateringConsistency: WateringConsistency | null;
  recentlyNeglectedPlants: Plant[];
};

const MOST_CARED_LOOKBACK_DAYS = 90;
const RECENT_GROWTH_LOOKBACK_DAYS = 30;
const NEGLECT_THRESHOLD_DAYS = 14;
const TOP_LIMIT = 5;

function startOfDayMs(date: Date): number {
  return startOfDay(date).getTime();
}

function computeMostCaredFor(db: LeafCueDbOrTx, now: Date): CountedPlant[] {
  const since = addDays(now, -MOST_CARED_LOOKBACK_DAYS);
  const rows = db
    .select({
      plant: plants,
      log: careLogs,
    })
    .from(careLogs)
    .innerJoin(plants, eq(plants.id, careLogs.plantId))
    .where(
      and(
        isNull(plants.archivedAt),
        gte(careLogs.completedAt, since),
        lte(careLogs.completedAt, now),
      ),
    )
    .all();

  const byPlant = new Map<number, { plant: Plant; count: number }>();
  for (const row of rows) {
    const entry = byPlant.get(row.plant.id);
    if (entry) {
      entry.count += 1;
    } else {
      byPlant.set(row.plant.id, { plant: row.plant, count: 1 });
    }
  }

  return [...byPlant.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_LIMIT);
}

function computeMostOverdue(db: LeafCueDbOrTx, now: Date): CountedPlant[] {
  const startToday = startOfDay(now);
  const rows = db
    .select({
      plant: plants,
      schedule: plantTaskSchedules,
    })
    .from(plantTaskSchedules)
    .innerJoin(plants, eq(plants.id, plantTaskSchedules.plantId))
    .where(
      and(
        isNull(plants.archivedAt),
        eq(plantTaskSchedules.isEnabled, true),
        lte(plantTaskSchedules.nextDueAt, startToday),
      ),
    )
    .all();

  const byPlant = new Map<number, { plant: Plant; count: number }>();
  for (const row of rows) {
    if (!row.schedule.nextDueAt) continue;
    if (
      row.schedule.snoozedUntil &&
      row.schedule.snoozedUntil.getTime() > now.getTime()
    ) {
      continue;
    }
    const entry = byPlant.get(row.plant.id);
    if (entry) {
      entry.count += 1;
    } else {
      byPlant.set(row.plant.id, { plant: row.plant, count: 1 });
    }
  }

  return [...byPlant.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_LIMIT);
}

function computeRecentGrowthMilestones(
  db: LeafCueDbOrTx,
  now: Date,
): GrowthMilestone[] {
  const since = addDays(now, -RECENT_GROWTH_LOOKBACK_DAYS);
  const rows = db
    .select({
      plant: plants,
      measurement: growthMeasurements,
    })
    .from(growthMeasurements)
    .innerJoin(plants, eq(plants.id, growthMeasurements.plantId))
    .where(
      and(
        isNull(plants.archivedAt),
        gte(growthMeasurements.measuredAt, since),
        lte(growthMeasurements.measuredAt, now),
      ),
    )
    .orderBy(desc(growthMeasurements.measuredAt))
    .all();

  return rows
    .filter((row) => {
      const m = row.measurement;
      return (
        Boolean(m.notes) ||
        m.heightCm !== null ||
        m.leafCount !== null ||
        m.bloomCount !== null
      );
    })
    .slice(0, TOP_LIMIT);
}

function computeActiveIssues(db: LeafCueDbOrTx): ActiveIssueRow[] {
  return db
    .select({
      plant: plants,
      observation: healthObservations,
    })
    .from(healthObservations)
    .innerJoin(plants, eq(plants.id, healthObservations.plantId))
    .where(
      and(eq(healthObservations.status, "active"), isNull(plants.archivedAt)),
    )
    .orderBy(desc(healthObservations.observedAt))
    .all();
}

function computeCareStreak(db: LeafCueDbOrTx, now: Date): number {
  const lookbackStart = addDays(startOfDay(now), -120);
  const rows = db
    .select({ completedAt: careLogs.completedAt })
    .from(careLogs)
    .innerJoin(plants, eq(plants.id, careLogs.plantId))
    .where(
      and(
        isNull(plants.archivedAt),
        gte(careLogs.completedAt, lookbackStart),
        lte(careLogs.completedAt, now),
      ),
    )
    .orderBy(desc(careLogs.completedAt))
    .all();

  if (rows.length === 0) return 0;

  const dayKeys = new Set<number>();
  for (const row of rows) {
    dayKeys.add(startOfDayMs(row.completedAt));
  }

  let streak = 0;
  let cursor = startOfDay(now).getTime();
  while (dayKeys.has(cursor)) {
    streak += 1;
    cursor -= MS_PER_DAY;
  }
  return streak;
}

function computeWateringConsistency(
  db: LeafCueDbOrTx,
  now: Date,
): WateringConsistency | null {
  const lookbackStart = addDays(now, -120);
  const rows = db
    .select({
      plantId: careLogs.plantId,
      completedAt: careLogs.completedAt,
    })
    .from(careLogs)
    .innerJoin(plants, eq(plants.id, careLogs.plantId))
    .where(
      and(
        isNull(plants.archivedAt),
        eq(careLogs.type, "water"),
        gte(careLogs.completedAt, lookbackStart),
        lte(careLogs.completedAt, now),
      ),
    )
    .orderBy(asc(careLogs.completedAt))
    .all();

  if (rows.length < 4) return null;

  const byPlant = new Map<number, Date[]>();
  for (const row of rows) {
    const list = byPlant.get(row.plantId);
    if (list) {
      list.push(row.completedAt);
    } else {
      byPlant.set(row.plantId, [row.completedAt]);
    }
  }

  const stddevs: number[] = [];
  for (const list of byPlant.values()) {
    if (list.length < 3) continue;
    const gaps: number[] = [];
    for (let i = 1; i < list.length; i += 1) {
      const previous = list[i - 1];
      const current = list[i];
      if (!previous || !current) continue;
      gaps.push((current.getTime() - previous.getTime()) / MS_PER_DAY);
    }
    if (gaps.length === 0) continue;
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance =
      gaps.reduce((acc, gap) => acc + (gap - mean) ** 2, 0) / gaps.length;
    stddevs.push(Math.sqrt(variance));
  }

  if (stddevs.length === 0) return null;

  const avgStddev = stddevs.reduce((a, b) => a + b, 0) / stddevs.length;
  if (avgStddev <= 1.5) return "steady";
  if (avgStddev <= 3.5) return "mostly_steady";
  return "catching_up";
}

function computeRecentlyNeglected(db: LeafCueDbOrTx, now: Date): Plant[] {
  const allPlants = db
    .select()
    .from(plants)
    .where(isNull(plants.archivedAt))
    .all();

  if (allPlants.length === 0) return [];

  const cutoff = addDays(now, -NEGLECT_THRESHOLD_DAYS);
  const recentLogs = db
    .select({ plantId: careLogs.plantId, completedAt: careLogs.completedAt })
    .from(careLogs)
    .where(
      and(gte(careLogs.completedAt, cutoff), lte(careLogs.completedAt, now)),
    )
    .all();

  const recentlyCared = new Set<number>();
  for (const row of recentLogs) {
    recentlyCared.add(row.plantId);
  }

  const enabledSchedules = db
    .select({
      plantId: plantTaskSchedules.plantId,
      isEnabled: plantTaskSchedules.isEnabled,
    })
    .from(plantTaskSchedules)
    .where(
      and(
        eq(plantTaskSchedules.isEnabled, true),
        isNotNull(plantTaskSchedules.nextDueAt),
      ),
    )
    .all();

  const plantsWithActiveSchedule = new Set<number>();
  for (const row of enabledSchedules) {
    plantsWithActiveSchedule.add(row.plantId);
  }

  return allPlants
    .filter((plant) => {
      if (recentlyCared.has(plant.id)) return false;
      const hasActive = plantsWithActiveSchedule.has(plant.id);
      const hasNoSchedule = !hasActive;
      return hasActive || hasNoSchedule;
    })
    .slice(0, TOP_LIMIT);
}

export function getInsightsSummary(
  db: LeafCueDbOrTx,
  now: Date = new Date(),
): InsightsSummary {
  const totalPlants = db
    .select()
    .from(plants)
    .where(isNull(plants.archivedAt))
    .all().length;

  return {
    totalPlants,
    mostCaredForPlants: computeMostCaredFor(db, now),
    mostOverdueRightNow: computeMostOverdue(db, now),
    recentGrowthMilestones: computeRecentGrowthMilestones(db, now),
    plantsWithActiveIssues: computeActiveIssues(db),
    careStreakDays: computeCareStreak(db, now),
    wateringConsistency: computeWateringConsistency(db, now),
    recentlyNeglectedPlants: computeRecentlyNeglected(db, now),
  };
}

export function daysSince(
  date: Date | null,
  now: Date = new Date(),
): number | null {
  if (!date) return null;
  return differenceInCalendarDays(startOfDay(now), startOfDay(date));
}
