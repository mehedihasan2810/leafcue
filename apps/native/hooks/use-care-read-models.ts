import { endOfMonth, format, isAfter, isSameDay, startOfMonth } from "date-fns";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";
import {
  getPlantSetupProgress,
  type PlantSetupProgress,
} from "@/lib/care/setup-progress";
import { isOverdue } from "@/lib/dates";
import type { LeafCueDatabase } from "@/lib/db";
import {
  type ActiveHealthObservationRow,
  type CompletedLogRow,
  type DueTaskRow,
  getActiveHealthObservationsAcrossPlants,
  getAllActiveScheduleRows,
  getCareLogsForPlant,
  getCareTaskTemplates,
  getCompletedTaskLogs,
  getDueTasks,
  getGrowthMeasurements,
  getHealthObservations,
  getOverdueTasks,
  getPlantById,
  getPlantPhotos,
  getPlantTimeline,
  getPresetById,
  getRoomById,
  getRooms,
  getSchedulesForPlant,
  getShelves,
  getTasksByFilter,
  getUpcomingTasks,
  type PlantTimelineItem,
  type PlantTimelineKind,
} from "@/lib/db/repositories";
import {
  careLogs,
  careTaskTemplates,
  growthMeasurements,
  healthObservations,
  journalEntries,
  plantPhotos,
  plants,
  plantTaskSchedules,
  rooms,
  shelves,
} from "@/lib/db/schema";
import type {
  CareLog,
  CareTaskTemplate,
  GrowthMeasurement,
  HealthObservation,
  Plant,
  PlantPhoto,
  PlantPreset,
  PlantTaskSchedule,
  Room,
  Shelf,
} from "@/lib/db/types";
import type { TaskFilter } from "@/lib/db/zod";

type IdMap<T extends { id: number }> = Map<number, T>;

function mapById<T extends { id: number }>(rows: ReadonlyArray<T>): IdMap<T> {
  const map = new Map<number, T>();
  for (const row of rows) map.set(row.id, row);
  return map;
}

export function useTaskQueueReadModel(
  db: LeafCueDatabase,
  filter: TaskFilter,
): {
  data: { schedules: DueTaskRow[]; completed: CompletedLogRow[] };
  counts: Partial<Record<TaskFilter, number>>;
  roomById: IdMap<Room>;
  shelfById: IdMap<Shelf>;
} {
  const livePlants = useLiveQuery(db.select().from(plants));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveLogs = useLiveQuery(db.select().from(careLogs));
  const liveRooms = useLiveQuery(db.select().from(rooms));
  const liveShelves = useLiveQuery(db.select().from(shelves));

  const data = useMemo<{
    schedules: DueTaskRow[];
    completed: CompletedLogRow[];
  }>(() => {
    void liveSchedules.data;
    void livePlants.data;
    void liveLogs.data;
    return getTasksByFilter(db, filter);
  }, [db, filter, liveSchedules.data, livePlants.data, liveLogs.data]);

  const counts = useMemo(() => {
    void liveSchedules.data;
    void livePlants.data;
    const today = getTasksByFilter(db, "today");
    const overdue = getTasksByFilter(db, "overdue");
    const upcoming = getTasksByFilter(db, "upcoming");
    return {
      today: today.schedules.length,
      overdue: overdue.schedules.length,
      upcoming: upcoming.schedules.length,
    } satisfies Partial<Record<TaskFilter, number>>;
  }, [db, liveSchedules.data, livePlants.data]);

  const roomList = useMemo<Room[]>(() => {
    void liveRooms.data;
    return getRooms(db);
  }, [db, liveRooms.data]);

  const shelfList = useMemo<Shelf[]>(() => {
    void liveShelves.data;
    return getShelves(db);
  }, [db, liveShelves.data]);

  const roomById = useMemo(() => mapById(roomList), [roomList]);
  const shelfById = useMemo(() => mapById(shelfList), [shelfList]);

  return {
    data,
    counts,
    roomById,
    shelfById,
  };
}

export function useCalendarReadModel(
  db: LeafCueDatabase,
  args: {
    monthAnchor: Date;
    selectedDate: Date;
    now: Date;
  },
): {
  allSchedules: DueTaskRow[];
  overdueRows: DueTaskRow[];
  completedRows: CompletedLogRow[];
  roomById: IdMap<Room>;
  shelfById: IdMap<Shelf>;
  metaByKey: Map<
    string,
    { isOverdue?: boolean; taskCount?: number; completedCount?: number }
  >;
  tasksForSelectedDay: DueTaskRow[];
  completedForSelectedDay: CompletedLogRow[];
} {
  const livePlants = useLiveQuery(db.select().from(plants));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveLogs = useLiveQuery(db.select().from(careLogs));
  const liveRooms = useLiveQuery(db.select().from(rooms));
  const liveShelves = useLiveQuery(db.select().from(shelves));

  const allSchedules = useMemo<DueTaskRow[]>(() => {
    void liveSchedules.data;
    void livePlants.data;
    return getAllActiveScheduleRows(db);
  }, [db, liveSchedules.data, livePlants.data]);

  const overdueRows = useMemo<DueTaskRow[]>(() => {
    void liveSchedules.data;
    void livePlants.data;
    return getOverdueTasks(db, args.now);
  }, [db, liveSchedules.data, livePlants.data, args.now]);

  const completedRows = useMemo<CompletedLogRow[]>(() => {
    void liveLogs.data;
    void livePlants.data;
    return getCompletedTaskLogs(db, {
      from: startOfMonth(args.monthAnchor),
      to: endOfMonth(args.monthAnchor),
      limit: 200,
    });
  }, [db, args.monthAnchor, liveLogs.data, livePlants.data]);

  const roomList = useMemo<Room[]>(() => {
    void liveRooms.data;
    return getRooms(db);
  }, [db, liveRooms.data]);

  const shelfList = useMemo<Shelf[]>(() => {
    void liveShelves.data;
    return getShelves(db);
  }, [db, liveShelves.data]);

  const metaByKey = useMemo(() => {
    const map = new Map<
      string,
      { isOverdue?: boolean; taskCount?: number; completedCount?: number }
    >();
    for (const row of allSchedules) {
      const due = row.schedule.nextDueAt;
      if (!due) continue;
      const key = format(due, "yyyy-MM-dd");
      const existing = map.get(key) ?? {};
      map.set(key, {
        ...existing,
        taskCount: (existing.taskCount ?? 0) + 1,
        isOverdue: existing.isOverdue || isOverdue(due, args.now),
      });
    }
    for (const row of completedRows) {
      const key = format(row.log.completedAt, "yyyy-MM-dd");
      const existing = map.get(key) ?? {};
      map.set(key, {
        ...existing,
        completedCount: (existing.completedCount ?? 0) + 1,
      });
    }
    return map;
  }, [allSchedules, completedRows, args.now]);

  const tasksForSelectedDay = useMemo<DueTaskRow[]>(() => {
    return allSchedules.filter((row) => {
      const due = row.schedule.nextDueAt;
      if (!due) return false;
      return isSameDay(due, args.selectedDate);
    });
  }, [allSchedules, args.selectedDate]);

  const completedForSelectedDay = useMemo<CompletedLogRow[]>(() => {
    return completedRows.filter((row) =>
      isSameDay(row.log.completedAt, args.selectedDate),
    );
  }, [completedRows, args.selectedDate]);

  const roomById = useMemo(() => mapById(roomList), [roomList]);
  const shelfById = useMemo(() => mapById(shelfList), [shelfList]);

  return {
    allSchedules,
    overdueRows,
    completedRows,
    roomById,
    shelfById,
    metaByKey,
    tasksForSelectedDay,
    completedForSelectedDay,
  };
}

export function useTodayReadModel(
  db: LeafCueDatabase,
  args: { now: Date; recentSince: Date },
): {
  activeHealthIssues: ActiveHealthObservationRow[];
  allDueTasks: DueTaskRow[];
  upcomingTasks: DueTaskRow[];
  overdueTasks: DueTaskRow[];
  todayTasks: DueTaskRow[];
  activePlants: Plant[];
  favoritePlants: Plant[];
  plantsWithoutSchedules: Plant[];
  recentCareLogs: CompletedLogRow[];
  recentActivityCount: number;
  setupProgressItems: Array<{
    plant: Plant;
    progress: PlantSetupProgress;
  }>;
  roomById: IdMap<Room>;
} {
  const livePlants = useLiveQuery(db.select().from(plants));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveLogs = useLiveQuery(db.select().from(careLogs));
  const liveJournal = useLiveQuery(db.select().from(journalEntries));
  const livePhotos = useLiveQuery(db.select().from(plantPhotos));
  const liveHealth = useLiveQuery(db.select().from(healthObservations));
  const liveRooms = useLiveQuery(db.select().from(rooms));

  const activeHealthIssues = useMemo(() => {
    void liveHealth.data;
    void livePlants.data;
    return getActiveHealthObservationsAcrossPlants(db);
  }, [db, liveHealth.data, livePlants.data]);

  const allDueTasks = useMemo(() => {
    void liveSchedules.data;
    void livePlants.data;
    return getDueTasks(db);
  }, [db, liveSchedules.data, livePlants.data]);

  const upcomingTasks = useMemo(() => {
    void liveSchedules.data;
    void livePlants.data;
    return getUpcomingTasks(db, 7);
  }, [db, liveSchedules.data, livePlants.data]);

  const overdueTasks = useMemo(
    () =>
      allDueTasks.filter((row) => isOverdue(row.schedule.nextDueAt, args.now)),
    [allDueTasks, args.now],
  );

  const todayTasks = useMemo(
    () =>
      allDueTasks.filter((row) => !isOverdue(row.schedule.nextDueAt, args.now)),
    [allDueTasks, args.now],
  );

  const activePlants = useMemo(
    () => livePlants.data.filter((plant) => !plant.archivedAt),
    [livePlants.data],
  );

  const plantsWithoutSchedules = useMemo(
    () =>
      activePlants.filter(
        (plant) =>
          !liveSchedules.data.some(
            (schedule) => schedule.plantId === plant.id && schedule.isEnabled,
          ),
      ),
    [activePlants, liveSchedules.data],
  );

  const favoritePlants = useMemo(
    () => activePlants.filter((plant) => plant.isFavorite),
    [activePlants],
  );

  const recentCareLogs = useMemo(() => {
    void liveLogs.data;
    void livePlants.data;
    return getCompletedTaskLogs(db, {
      from: args.recentSince,
      limit: 5,
    });
  }, [db, args.recentSince, liveLogs.data, livePlants.data]);

  const recentActivityCount = useMemo(
    () =>
      liveLogs.data.filter((log) => isAfter(log.completedAt, args.recentSince))
        .length +
      liveJournal.data.filter((entry) =>
        isAfter(entry.createdAt, args.recentSince),
      ).length +
      livePhotos.data.filter((photo) =>
        isAfter(photo.takenAt, args.recentSince),
      ).length,
    [liveLogs.data, liveJournal.data, livePhotos.data, args.recentSince],
  );

  const setupProgressItems = useMemo(() => {
    const schedulesByPlant = new Map<number, PlantTaskSchedule[]>();
    const photosByPlant = new Map<number, PlantPhoto[]>();
    const logsByPlant = new Map<number, CareLog[]>();

    for (const schedule of liveSchedules.data) {
      const list = schedulesByPlant.get(schedule.plantId) ?? [];
      list.push(schedule);
      schedulesByPlant.set(schedule.plantId, list);
    }

    for (const photo of livePhotos.data) {
      const list = photosByPlant.get(photo.plantId) ?? [];
      list.push(photo);
      photosByPlant.set(photo.plantId, list);
    }

    for (const log of liveLogs.data) {
      const list = logsByPlant.get(log.plantId) ?? [];
      list.push(log);
      logsByPlant.set(log.plantId, list);
    }

    return activePlants
      .map((plant) => ({
        plant,
        progress: getPlantSetupProgress({
          plant,
          schedules: schedulesByPlant.get(plant.id) ?? [],
          photos: photosByPlant.get(plant.id) ?? [],
          logs: logsByPlant.get(plant.id) ?? [],
        }),
      }))
      .filter((item) => !item.progress.isComplete)
      .sort((a, b) => a.progress.completed - b.progress.completed)
      .slice(0, 3);
  }, [activePlants, liveSchedules.data, livePhotos.data, liveLogs.data]);

  const roomList = useMemo<Room[]>(() => {
    void liveRooms.data;
    return getRooms(db);
  }, [db, liveRooms.data]);

  const roomById = useMemo(() => mapById(roomList), [roomList]);

  return {
    activeHealthIssues,
    allDueTasks,
    upcomingTasks,
    overdueTasks,
    todayTasks,
    activePlants,
    favoritePlants,
    plantsWithoutSchedules,
    recentCareLogs,
    recentActivityCount,
    setupProgressItems,
    roomById,
  };
}

export function usePlantDetailReadModel(
  db: LeafCueDatabase,
  args: {
    plantId: number;
    timelineKinds?: PlantTimelineKind[];
  },
): {
  plant: Plant | undefined;
  room: Room | null;
  shelf: Shelf | null;
  schedules: PlantTaskSchedule[];
  dueRows: DueTaskRow[];
  careLogs: CareLog[];
  photos: PlantPhoto[];
  measurements: GrowthMeasurement[];
  observations: HealthObservation[];
  templates: CareTaskTemplate[];
  preset: PlantPreset | null;
  timeline: PlantTimelineItem[];
  nextDueAt: Date | null;
} {
  const livePlants = useLiveQuery(db.select().from(plants));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveLogs = useLiveQuery(db.select().from(careLogs));
  const liveJournal = useLiveQuery(db.select().from(journalEntries));
  const livePhotos = useLiveQuery(db.select().from(plantPhotos));
  const liveGrowth = useLiveQuery(db.select().from(growthMeasurements));
  const liveHealth = useLiveQuery(db.select().from(healthObservations));
  const liveRooms = useLiveQuery(db.select().from(rooms));
  const liveShelves = useLiveQuery(db.select().from(shelves));
  const liveTemplates = useLiveQuery(db.select().from(careTaskTemplates));

  const plant = useMemo(() => {
    void livePlants.data;
    return getPlantById(db, args.plantId);
  }, [db, args.plantId, livePlants.data]);

  const room = useMemo<Room | null>(() => {
    void liveRooms.data;
    if (!plant?.roomId) return null;
    return getRoomById(db, plant.roomId) ?? null;
  }, [db, plant?.roomId, liveRooms.data]);

  const shelf = useMemo<Shelf | null>(() => {
    if (!plant?.shelfId) return null;
    return liveShelves.data.find((row) => row.id === plant.shelfId) ?? null;
  }, [plant?.shelfId, liveShelves.data]);

  const schedules = useMemo(() => {
    void liveSchedules.data;
    return getSchedulesForPlant(db, args.plantId);
  }, [db, args.plantId, liveSchedules.data]);

  const dueRows = useMemo(() => {
    void liveSchedules.data;
    void livePlants.data;
    return getDueTasks(db).filter((row) => row.plant.id === args.plantId);
  }, [db, args.plantId, liveSchedules.data, livePlants.data]);

  const plantCareLogs = useMemo(() => {
    void liveLogs.data;
    return getCareLogsForPlant(db, args.plantId);
  }, [db, args.plantId, liveLogs.data]);

  const photos = useMemo(() => {
    void livePhotos.data;
    return getPlantPhotos(db, args.plantId);
  }, [db, args.plantId, livePhotos.data]);

  const measurements = useMemo(() => {
    void liveGrowth.data;
    return getGrowthMeasurements(db, args.plantId);
  }, [db, args.plantId, liveGrowth.data]);

  const observations = useMemo(() => {
    void liveHealth.data;
    return getHealthObservations(db, args.plantId);
  }, [db, args.plantId, liveHealth.data]);

  const templates = useMemo<CareTaskTemplate[]>(() => {
    void liveTemplates.data;
    return getCareTaskTemplates(db);
  }, [db, liveTemplates.data]);

  const preset = useMemo(() => {
    if (!plant?.speciesPresetId) return null;
    return getPresetById(db, plant.speciesPresetId) ?? null;
  }, [db, plant?.speciesPresetId]);

  const timeline = useMemo(() => {
    void liveLogs.data;
    void liveJournal.data;
    void livePhotos.data;
    void liveGrowth.data;
    void liveHealth.data;
    return getPlantTimeline(db, args.plantId, {
      kinds: args.timelineKinds,
      limit: 200,
    });
  }, [
    db,
    args.plantId,
    args.timelineKinds,
    liveLogs.data,
    liveJournal.data,
    livePhotos.data,
    liveGrowth.data,
    liveHealth.data,
  ]);

  const nextDueAt = useMemo<Date | null>(() => {
    let next: Date | null = null;
    for (const schedule of schedules) {
      if (!schedule.isEnabled || !schedule.nextDueAt) continue;
      if (!next || schedule.nextDueAt < next) next = schedule.nextDueAt;
    }
    return next;
  }, [schedules]);

  return {
    plant,
    room,
    shelf,
    schedules,
    dueRows,
    careLogs: plantCareLogs,
    photos,
    measurements,
    observations,
    templates,
    preset,
    timeline,
    nextDueAt,
  };
}
