import { sql } from "drizzle-orm";
import { File } from "expo-file-system";

import type { LeafCueDbOrTx } from "@/lib/db";
import {
  appSettings,
  careLogs,
  careTaskTemplates,
  growthMeasurements,
  healthObservations,
  journalEntries,
  onboardingState,
  plantPhotos,
  plantPresets,
  plants,
  plantTaskSchedules,
  rooms,
  shelves,
} from "@/lib/db/schema";
import type { BackupPayload, BackupPhotoFile } from "@/lib/db/zod";
import { ensurePhotoDir, writePhotoBase64 } from "@/lib/photos";

/** Write bundled photo files from the payload back to the device directory. */
export function restorePhotoFiles(payload: BackupPayload): Map<string, string> {
  const restoredUris = new Map<string, string>();
  if (!payload.photoFiles) return restoredUris;
  ensurePhotoDir();
  for (const [uri, photoFile] of Object.entries(payload.photoFiles)) {
    const restoredUri = writePhotoFromBase64File(photoFile);
    if (restoredUri) {
      restoredUris.set(uri, restoredUri);
    }
  }
  return restoredUris;
}

function writePhotoFromBase64File(photoFile: BackupPhotoFile): string | null {
  try {
    const dir = ensurePhotoDir();
    const file = makeRestoredPhotoFile(dir, photoFile.filename);
    writePhotoBase64(file, photoFile.data);
    return file.uri;
  } catch {
    // Best-effort restore; the import can still work with missing photo files.
    return null;
  }
}

function makeRestoredPhotoFile(
  dir: ReturnType<typeof ensurePhotoDir>,
  filename: string,
): File {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const basename = filename
    .slice(0, -(extension.length + 1))
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  const safeBasename = basename.length > 0 ? basename : "photo";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const candidate = new File(
      dir,
      `${safeBasename}-${suffix}-${attempt}.${extension}`,
    );
    if (!candidate.exists) return candidate;
  }

  throw new Error("Could not create a unique restored photo filename.");
}

function resolveImportedPhotoUri(
  uri: string | null | undefined,
  restoredUris: Map<string, string>,
): string | null {
  if (!uri) return null;
  return restoredUris.get(uri) ?? uri;
}

export type InsertBackupTablesOptions = {
  remapIds: boolean;
  restoredPhotoUris: Map<string, string>;
};

export function insertBackupTables(
  db: LeafCueDbOrTx,
  payload: BackupPayload,
  options: InsertBackupTablesOptions,
): void {
  const remap = makeEmptyRemap();
  const t = payload.tables;

  for (const row of t.plantPresets) {
    const oldId = row.id ?? null;
    const insertValues = {
      commonName: row.commonName,
      scientificName: row.scientificName ?? null,
      careDifficulty: row.careDifficulty ?? null,
      light: row.light ?? null,
      water: row.water ?? null,
      humidity: row.humidity ?? null,
      temperature: row.temperature ?? null,
      soil: row.soil ?? null,
      fertilizer: row.fertilizer ?? null,
      petToxicity: row.petToxicity ?? null,
      careSummary: row.careSummary ?? null,
    };
    const inserted = db
      .insert(plantPresets)
      .values(insertValues)
      .onConflictDoNothing()
      .returning({ id: plantPresets.id })
      .get();
    if (oldId !== null && inserted) {
      remap.presets.set(oldId, inserted.id);
    }
  }

  for (const row of t.rooms) {
    const oldId = row.id ?? null;
    const inserted = db
      .insert(rooms)
      .values({
        name: row.name,
        icon: row.icon ?? null,
        sortOrder: row.sortOrder ?? 0,
      })
      .returning({ id: rooms.id })
      .get();
    if (oldId !== null && inserted) {
      remap.rooms.set(oldId, inserted.id);
    }
  }

  for (const row of t.shelves) {
    const oldId = row.id ?? null;
    const oldRoomId = row.roomId;
    const newRoomId = options.remapIds
      ? (remap.rooms.get(oldRoomId) ?? null)
      : oldRoomId;
    if (newRoomId === null) continue;
    const inserted = db
      .insert(shelves)
      .values({
        name: row.name,
        roomId: newRoomId,
        icon: row.icon ?? null,
        sortOrder: row.sortOrder ?? 0,
      })
      .returning({ id: shelves.id })
      .get();
    if (oldId !== null && inserted) {
      remap.shelves.set(oldId, inserted.id);
    }
  }

  for (const row of t.plants) {
    const oldId = row.id ?? null;
    const oldRoomId = row.roomId ?? null;
    const oldShelfId = row.shelfId ?? null;
    const oldPresetId = row.speciesPresetId ?? null;
    const newRoomId =
      oldRoomId === null
        ? null
        : options.remapIds
          ? (remap.rooms.get(oldRoomId) ?? null)
          : oldRoomId;
    const newShelfId =
      oldShelfId === null
        ? null
        : options.remapIds
          ? (remap.shelves.get(oldShelfId) ?? null)
          : oldShelfId;
    const newPresetId =
      oldPresetId === null
        ? null
        : options.remapIds
          ? (remap.presets.get(oldPresetId) ?? null)
          : oldPresetId;
    const inserted = db
      .insert(plants)
      .values({
        nickname: row.nickname,
        commonName: row.commonName ?? null,
        scientificName: row.scientificName ?? null,
        speciesPresetId: newPresetId,
        photoUri: resolveImportedPhotoUri(
          row.photoUri,
          options.restoredPhotoUris,
        ),
        roomId: newRoomId,
        shelfId: newShelfId,
        notes: row.notes ?? null,
        acquiredAt: getDate(row, "acquiredAt"),
        archivedAt: getDate(row, "archivedAt"),
        careDifficulty: row.careDifficulty ?? null,
        toxicity: row.toxicity ?? null,
        lightPreference: row.lightPreference ?? null,
        wateringPreference: row.wateringPreference ?? null,
        soilType: row.soilType ?? null,
        potType: row.potType ?? null,
        potSize: row.potSize ?? null,
        hasDrainage: row.hasDrainage ?? null,
        directSunHours: row.directSunHours ?? null,
        windowDistanceCm: row.windowDistanceCm ?? null,
        windowOrientation: row.windowOrientation ?? null,
        isFavorite: row.isFavorite ?? false,
      })
      .returning({ id: plants.id })
      .get();
    if (oldId !== null && inserted) {
      remap.plants.set(oldId, inserted.id);
    }
  }

  for (const row of t.plantPhotos) {
    const oldPlantId = row.plantId;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    db.insert(plantPhotos)
      .values({
        plantId: newPlantId,
        uri:
          resolveImportedPhotoUri(row.uri, options.restoredPhotoUris) ??
          row.uri,
        caption: row.caption ?? null,
        takenAt: getDate(row, "takenAt") ?? new Date(),
        type: row.type ?? "journal",
      })
      .run();
  }

  for (const row of t.careTaskTemplates) {
    const oldId = row.id ?? null;
    db.insert(careTaskTemplates)
      .values({
        key: row.key,
        name: row.name,
        icon: row.icon ?? null,
        defaultIntervalDays: row.defaultIntervalDays ?? null,
        defaultInstructions: row.defaultInstructions ?? null,
        colorKey: row.colorKey ?? null,
        isBuiltIn: row.isBuiltIn ?? false,
      })
      .onConflictDoNothing()
      .run();
    const found = db
      .select({ id: careTaskTemplates.id })
      .from(careTaskTemplates)
      .where(sql`${careTaskTemplates.key} = ${row.key}`)
      .get();
    if (oldId !== null && found) {
      remap.templates.set(oldId, found.id);
    }
  }

  for (const row of t.plantTaskSchedules) {
    const oldId = row.id ?? null;
    const oldPlantId = row.plantId;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    const oldTemplateId = row.templateId ?? null;
    const newTemplateId =
      oldTemplateId === null
        ? null
        : options.remapIds
          ? (remap.templates.get(oldTemplateId) ?? null)
          : oldTemplateId;
    const inserted = db
      .insert(plantTaskSchedules)
      .values({
        plantId: newPlantId,
        templateId: newTemplateId,
        customName: row.customName ?? null,
        intervalDays: row.intervalDays ?? null,
        nextDueAt: getDate(row, "nextDueAt"),
        lastCompletedAt: getDate(row, "lastCompletedAt"),
        snoozedUntil: getDate(row, "snoozedUntil"),
        isEnabled: row.isEnabled ?? true,
        instructions: row.instructions ?? null,
        notificationId: null,
        preferredHour: row.preferredHour ?? null,
        preferredMinute: row.preferredMinute ?? null,
      })
      .returning({ id: plantTaskSchedules.id })
      .get();
    if (oldId !== null && inserted) {
      remap.schedules.set(oldId, inserted.id);
    }
  }

  for (const row of t.careLogs) {
    const oldPlantId = row.plantId;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    const oldScheduleId = row.scheduleId ?? null;
    const oldTemplateId = row.templateId ?? null;
    db.insert(careLogs)
      .values({
        plantId: newPlantId,
        scheduleId:
          oldScheduleId === null
            ? null
            : options.remapIds
              ? (remap.schedules.get(oldScheduleId) ?? null)
              : oldScheduleId,
        templateId:
          oldTemplateId === null
            ? null
            : options.remapIds
              ? (remap.templates.get(oldTemplateId) ?? null)
              : oldTemplateId,
        type: row.type,
        title: row.title ?? null,
        notes: row.notes ?? null,
        completedAt: getDate(row, "completedAt") ?? new Date(),
        amount: row.amount ?? null,
        unit: row.unit ?? null,
      })
      .run();
  }

  for (const row of t.journalEntries) {
    const oldPlantId = row.plantId ?? null;
    const newPlantId =
      oldPlantId === null
        ? null
        : options.remapIds
          ? (remap.plants.get(oldPlantId) ?? null)
          : oldPlantId;
    db.insert(journalEntries)
      .values({
        plantId: newPlantId,
        title: row.title ?? null,
        body: row.body,
        mood: row.mood ?? null,
        entryType: row.entryType ?? "note",
        photoUri: resolveImportedPhotoUri(
          row.photoUri,
          options.restoredPhotoUris,
        ),
      })
      .run();
  }

  for (const row of t.growthMeasurements) {
    const oldPlantId = row.plantId;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    db.insert(growthMeasurements)
      .values({
        plantId: newPlantId,
        measuredAt: getDate(row, "measuredAt") ?? new Date(),
        heightCm: row.heightCm ?? null,
        leafCount: row.leafCount ?? null,
        bloomCount: row.bloomCount ?? null,
        notes: row.notes ?? null,
      })
      .run();
  }

  for (const row of t.healthObservations) {
    const oldPlantId = row.plantId;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    db.insert(healthObservations)
      .values({
        plantId: newPlantId,
        observedAt: getDate(row, "observedAt") ?? new Date(),
        issueType: row.issueType,
        severity: row.severity,
        notes: row.notes ?? null,
        status: row.status ?? "active",
      })
      .run();
  }

  if (!options.remapIds) {
    for (const row of payload.settings) {
      db.insert(appSettings)
        .values({
          key: row.key,
          value: row.value,
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: { value: row.value, updatedAt: new Date() },
        })
        .run();
    }
    for (const row of payload.onboardingState) {
      db.insert(onboardingState)
        .values({
          key: row.key,
          value: row.value,
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: onboardingState.key,
          set: { value: row.value, updatedAt: new Date() },
        })
        .run();
    }
  }
}

function getRowValue(row: object, key: string): unknown {
  return Object.hasOwn(row, key)
    ? (row as Record<string, unknown>)[key]
    : undefined;
}

function getDate(row: object, key: string): Date | null {
  const v = getRowValue(row, key);
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Date(v);
  }
  if (v instanceof Date) return v;
  return null;
}

type RemapResult = {
  rooms: Map<number, number>;
  shelves: Map<number, number>;
  plants: Map<number, number>;
  presets: Map<number, number>;
  templates: Map<number, number>;
  schedules: Map<number, number>;
};

function makeEmptyRemap(): RemapResult {
  return {
    rooms: new Map(),
    shelves: new Map(),
    plants: new Map(),
    presets: new Map(),
    templates: new Map(),
    schedules: new Map(),
  };
}
