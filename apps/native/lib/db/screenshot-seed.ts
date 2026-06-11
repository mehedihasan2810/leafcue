import { startOfDay } from "date-fns";
import { eq } from "drizzle-orm";
import { Directory, DownloadTask, File, Paths } from "expo-file-system";
import { z } from "zod";

import type { LeafCueDatabase } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/db/repositories/settings";
import {
  appSettings,
  careLogs,
  careTaskTemplates,
  growthMeasurements,
  healthObservations,
  journalEntries,
  plantPhotos,
  plantPresets,
  plants,
  plantTaskSchedules,
  rooms,
  shelves,
} from "@/lib/db/schema";
import { saveReminderSettings } from "@/lib/notifications/settings";

const SCREENSHOT_SEED_KEY = "screenshot_seed_v1";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const PHOTO_DIR_NAME = "plant-photos";

const PLANT_PHOTO_URLS: ReadonlyArray<{
  nickname: string;
  url: string;
  filename: string;
}> = [
  {
    nickname: "Milo",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Monstera_deliciosa_002.jpg/960px-Monstera_deliciosa_002.jpg",
    filename: "monstera.jpg",
  },
  {
    nickname: "Luna",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg/1280px-Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg",
    filename: "snake-plant.jpg",
  },
  {
    nickname: "Penny",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Peperomioides-07.JPG/960px-Peperomioides-07.JPG",
    filename: "pilea.jpg",
  },
  {
    nickname: "Ruby",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Ficus_elastica_%28Caucho%29_%2814273716222%29.jpg/1280px-Ficus_elastica_%28Caucho%29_%2814273716222%29.jpg",
    filename: "rubber-plant.jpg",
  },
  {
    nickname: "Nora",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Epipremnum_aureum_2.jpg/960px-Epipremnum_aureum_2.jpg",
    filename: "pothos.jpg",
  },
  {
    nickname: "Fernie",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Nephrolepis_exaltata_Suzi_Wong_2zz.jpg/960px-Nephrolepis_exaltata_Suzi_Wong_2zz.jpg",
    filename: "fern.jpg",
  },
  {
    nickname: "Sunny",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Aloe_vera_plant.JPG/1280px-Aloe_vera_plant.JPG",
    filename: "aloe.jpg",
  },
  {
    nickname: "Olive",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Peace_lily_--_Spathiphyllum.jpg/960px-Peace_lily_--_Spathiphyllum.jpg",
    filename: "peace-lily.jpg",
  },
];

const screenshotSeedMarkerSchema = z.object({
  plantIds: z.array(z.number().int().positive()),
  roomIds: z.array(z.number().int().positive()),
  shelfIds: z.array(z.number().int().positive()),
  photoUris: z.record(z.string(), z.string()).default({}),
});

type ScreenshotSeedMarker = z.infer<typeof screenshotSeedMarkerSchema>;

function seedDate(daysOffset: number, hour = 9, minute = 0): Date {
  const base = startOfDay(new Date());
  return new Date(
    base.getTime() +
      daysOffset * MS_PER_DAY +
      hour * 3_600_000 +
      minute * 60_000,
  );
}

function nowish(): Date {
  return new Date();
}

function ensurePhotoDir(): Directory {
  const dir = new Directory(Paths.document, PHOTO_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export async function downloadScreenshotPlantPhotos(): Promise<
  Record<string, string>
> {
  const dir = ensurePhotoDir();
  const results: Record<string, string> = {};

  for (const item of PLANT_PHOTO_URLS) {
    const destination = new File(dir, item.filename);
    try {
      const task = new DownloadTask(item.url, destination);
      const file = await task.downloadAsync();
      if (file) {
        results[item.nickname] = file.uri;
      }
    } catch {
      // best-effort: skip photos that fail to download
    }
  }

  return results;
}

export function hasScreenshotData(db: LeafCueDatabase): boolean {
  const marker = getSetting(
    db,
    SCREENSHOT_SEED_KEY,
    screenshotSeedMarkerSchema,
  );
  return marker !== null;
}

export function resetScreenshotData(db: LeafCueDatabase): void {
  const marker = getSetting(
    db,
    SCREENSHOT_SEED_KEY,
    screenshotSeedMarkerSchema,
  );
  if (!marker) return;

  // Delete persisted photo files first
  for (const uri of Object.values(marker.photoUris)) {
    try {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
    } catch {
      // best-effort cleanup
    }
  }

  db.transaction((tx) => {
    for (const plantId of marker.plantIds) {
      tx.delete(plants).where(eq(plants.id, plantId)).run();
    }
    for (const shelfId of marker.shelfIds) {
      tx.delete(shelves).where(eq(shelves.id, shelfId)).run();
    }
    for (const roomId of marker.roomIds) {
      tx.delete(rooms).where(eq(rooms.id, roomId)).run();
    }
    tx.delete(appSettings)
      .where(eq(appSettings.key, SCREENSHOT_SEED_KEY))
      .run();
  });
}

export function seedScreenshotData(
  db: LeafCueDatabase,
  photoUris: Record<string, string> = {},
): void {
  if (hasScreenshotData(db)) {
    resetScreenshotData(db);
  }

  const today = seedDate(0);
  const yesterday = seedDate(-1);
  const now = nowish();

  db.transaction((tx) => {
    const insertedRoomIds: number[] = [];
    const insertedShelfIds: number[] = [];
    const insertedPlantIds: number[] = [];

    const roomRows = [
      { name: "Living Room", icon: "tv-outline" as const, sortOrder: 0 },
      { name: "Bedroom", icon: "bed-outline" as const, sortOrder: 1 },
      { name: "Kitchen", icon: "restaurant-outline" as const, sortOrder: 2 },
      { name: "Balcony", icon: "sunny-outline" as const, sortOrder: 3 },
      { name: "Office", icon: "laptop-outline" as const, sortOrder: 4 },
    ];

    const roomMap = new Map<string, number>();
    for (const room of roomRows) {
      const inserted = tx
        .insert(rooms)
        .values({ ...room, createdAt: now, updatedAt: now })
        .returning()
        .get();
      if (!inserted) throw new Error(`Failed to seed room: ${room.name}`);
      roomMap.set(room.name, inserted.id);
      insertedRoomIds.push(inserted.id);
    }

    const shelfRows = [
      { name: "Window shelf", roomName: "Living Room", sortOrder: 0 },
      { name: "TV corner", roomName: "Living Room", sortOrder: 1 },
      { name: "Nightstand", roomName: "Bedroom", sortOrder: 0 },
      { name: "Dresser", roomName: "Bedroom", sortOrder: 1 },
      { name: "Herb shelf", roomName: "Kitchen", sortOrder: 0 },
      { name: "Morning sun", roomName: "Balcony", sortOrder: 0 },
      { name: "Desk plants", roomName: "Office", sortOrder: 0 },
    ];

    const shelfMap = new Map<string, number>();
    for (const shelf of shelfRows) {
      const roomId = roomMap.get(shelf.roomName);
      if (!roomId) throw new Error(`Missing room for shelf: ${shelf.name}`);
      const inserted = tx
        .insert(shelves)
        .values({
          roomId,
          name: shelf.name,
          sortOrder: shelf.sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
      if (!inserted) throw new Error(`Failed to seed shelf: ${shelf.name}`);
      shelfMap.set(shelf.name, inserted.id);
      insertedShelfIds.push(inserted.id);
    }

    const presetMap = new Map<string, number>();
    const presetNames = [
      "Monstera",
      "Snake Plant",
      "Chinese Money Plant",
      "Rubber Plant",
      "Pothos",
      "Boston Fern",
      "Aloe Vera",
      "Peace Lily",
    ];
    for (const name of presetNames) {
      const preset = tx
        .select()
        .from(plantPresets)
        .where(eq(plantPresets.commonName, name))
        .get();
      if (preset) {
        presetMap.set(name, preset.id);
      }
    }

    const templateMap = new Map<string, number>();
    const templateKeys: Array<import("@/lib/db/schema").CareTaskTemplateKey> = [
      "water",
      "fertilize",
      "mist",
      "rotate",
      "clean_leaves",
      "inspect_pests",
      "measure_growth",
      "photo_update",
    ];
    for (const key of templateKeys) {
      const template = tx
        .select()
        .from(careTaskTemplates)
        .where(eq(careTaskTemplates.key, key))
        .get();
      if (template) {
        templateMap.set(key, template.id);
      }
    }

    type PlantSeed = {
      nickname: string;
      commonName: string;
      scientificName: string;
      presetName: string;
      roomName: string;
      shelfName: string;
      isFavorite: boolean;
      notes: string;
      acquiredAt: Date;
    };

    const plantSeeds: PlantSeed[] = [
      {
        nickname: "Milo",
        commonName: "Monstera",
        scientificName: "Monstera deliciosa",
        presetName: "Monstera",
        roomName: "Living Room",
        shelfName: "Window shelf",
        isFavorite: true,
        notes: "Bright indirect light. Rotate weekly to keep growth even.",
        acquiredAt: seedDate(-60),
      },
      {
        nickname: "Luna",
        commonName: "Snake Plant",
        scientificName: "Dracaena trifasciata",
        presetName: "Snake Plant",
        roomName: "Bedroom",
        shelfName: "Nightstand",
        isFavorite: true,
        notes: "Low-maintenance and happiest when the soil dries fully.",
        acquiredAt: seedDate(-55),
      },
      {
        nickname: "Penny",
        commonName: "Chinese Money Plant",
        scientificName: "Pilea peperomioides",
        presetName: "Chinese Money Plant",
        roomName: "Office",
        shelfName: "Desk plants",
        isFavorite: true,
        notes: "Turns toward the window, so rotate after watering.",
        acquiredAt: seedDate(-45),
      },
      {
        nickname: "Ruby",
        commonName: "Rubber Plant",
        scientificName: "Ficus elastica",
        presetName: "Rubber Plant",
        roomName: "Living Room",
        shelfName: "TV corner",
        isFavorite: false,
        notes: "Wipe leaves monthly to keep them glossy.",
        acquiredAt: seedDate(-50),
      },
      {
        nickname: "Nora",
        commonName: "Pothos",
        scientificName: "Epipremnum aureum",
        presetName: "Pothos",
        roomName: "Kitchen",
        shelfName: "Herb shelf",
        isFavorite: false,
        notes: "Trailing nicely. Trim long vines when needed.",
        acquiredAt: seedDate(-40),
      },
      {
        nickname: "Fernie",
        commonName: "Boston Fern",
        scientificName: "Nephrolepis exaltata",
        presetName: "Boston Fern",
        roomName: "Bedroom",
        shelfName: "Dresser",
        isFavorite: false,
        notes: "Prefers steady moisture and humidity.",
        acquiredAt: seedDate(-35),
      },
      {
        nickname: "Sunny",
        commonName: "Aloe Vera",
        scientificName: "Aloe barbadensis miller",
        presetName: "Aloe Vera",
        roomName: "Balcony",
        shelfName: "Morning sun",
        isFavorite: false,
        notes: "Likes bright light and dry soil between watering.",
        acquiredAt: seedDate(-30),
      },
      {
        nickname: "Olive",
        commonName: "Peace Lily",
        scientificName: "Spathiphyllum wallisii",
        presetName: "Peace Lily",
        roomName: "Bedroom",
        shelfName: "Dresser",
        isFavorite: false,
        notes: "Droops slightly when thirsty; check soil first.",
        acquiredAt: seedDate(-25),
      },
    ];

    const plantMap = new Map<string, number>();
    for (const seed of plantSeeds) {
      const roomId = roomMap.get(seed.roomName);
      const shelfId = shelfMap.get(seed.shelfName);
      if (!roomId) throw new Error(`Missing room for plant: ${seed.nickname}`);
      if (!shelfId)
        throw new Error(`Missing shelf for plant: ${seed.nickname}`);
      const presetId = presetMap.get(seed.presetName) ?? null;
      const photoUri = photoUris[seed.nickname] ?? null;

      const inserted = tx
        .insert(plants)
        .values({
          nickname: seed.nickname,
          commonName: seed.commonName,
          scientificName: seed.scientificName,
          speciesPresetId: presetId,
          photoUri,
          roomId,
          shelfId,
          notes: seed.notes,
          acquiredAt: seed.acquiredAt,
          isFavorite: seed.isFavorite,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();

      if (!inserted) throw new Error(`Failed to seed plant: ${seed.nickname}`);
      plantMap.set(seed.nickname, inserted.id);
      insertedPlantIds.push(inserted.id);

      // Insert cover photo record when a photo was downloaded
      if (photoUri) {
        tx.insert(plantPhotos)
          .values({
            plantId: inserted.id,
            uri: photoUri,
            caption: `${seed.nickname} — ${seed.commonName}`,
            takenAt: seed.acquiredAt,
            type: "cover",
            createdAt: now,
          })
          .run();
      }
    }

    type ScheduleSeed = {
      plantNickname: string;
      templateKey: string;
      intervalDays: number;
      nextDueAt: Date;
      lastCompletedAt: Date | null;
      preferredHour?: number;
      preferredMinute?: number;
    };

    const scheduleSeeds: ScheduleSeed[] = [
      // Milo
      {
        plantNickname: "Milo",
        templateKey: "water",
        intervalDays: 7,
        nextDueAt: today,
        lastCompletedAt: seedDate(-7, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Milo",
        templateKey: "fertilize",
        intervalDays: 30,
        nextDueAt: seedDate(3),
        lastCompletedAt: seedDate(-27, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Milo",
        templateKey: "rotate",
        intervalDays: 7,
        nextDueAt: seedDate(2),
        lastCompletedAt: seedDate(-5, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Milo",
        templateKey: "clean_leaves",
        intervalDays: 21,
        nextDueAt: seedDate(10),
        lastCompletedAt: seedDate(-11, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Milo",
        templateKey: "photo_update",
        intervalDays: 14,
        nextDueAt: seedDate(5),
        lastCompletedAt: seedDate(-9, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },

      // Luna
      {
        plantNickname: "Luna",
        templateKey: "water",
        intervalDays: 14,
        nextDueAt: seedDate(2),
        lastCompletedAt: seedDate(-12, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Luna",
        templateKey: "fertilize",
        intervalDays: 30,
        nextDueAt: seedDate(8),
        lastCompletedAt: seedDate(-22, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Luna",
        templateKey: "inspect_pests",
        intervalDays: 14,
        nextDueAt: seedDate(6),
        lastCompletedAt: seedDate(-8, 10),
        preferredHour: 18,
        preferredMinute: 30,
      },

      // Penny
      {
        plantNickname: "Penny",
        templateKey: "water",
        intervalDays: 5,
        nextDueAt: today,
        lastCompletedAt: seedDate(-5, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Penny",
        templateKey: "rotate",
        intervalDays: 7,
        nextDueAt: today,
        lastCompletedAt: seedDate(-7, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Penny",
        templateKey: "fertilize",
        intervalDays: 30,
        nextDueAt: seedDate(12),
        lastCompletedAt: seedDate(-18, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },

      // Ruby
      {
        plantNickname: "Ruby",
        templateKey: "water",
        intervalDays: 10,
        nextDueAt: seedDate(3),
        lastCompletedAt: seedDate(-7, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Ruby",
        templateKey: "clean_leaves",
        intervalDays: 30,
        nextDueAt: seedDate(2),
        lastCompletedAt: seedDate(-28, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Ruby",
        templateKey: "fertilize",
        intervalDays: 30,
        nextDueAt: seedDate(15),
        lastCompletedAt: seedDate(-15, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },

      // Nora
      {
        plantNickname: "Nora",
        templateKey: "water",
        intervalDays: 7,
        nextDueAt: seedDate(2),
        lastCompletedAt: seedDate(-5, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Nora",
        templateKey: "fertilize",
        intervalDays: 30,
        nextDueAt: seedDate(5),
        lastCompletedAt: seedDate(-25, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Nora",
        templateKey: "mist",
        intervalDays: 3,
        nextDueAt: seedDate(1),
        lastCompletedAt: seedDate(-2, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },

      // Fernie
      {
        plantNickname: "Fernie",
        templateKey: "water",
        intervalDays: 5,
        nextDueAt: seedDate(1),
        lastCompletedAt: seedDate(-4, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Fernie",
        templateKey: "mist",
        intervalDays: 2,
        nextDueAt: yesterday,
        lastCompletedAt: seedDate(-3, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Fernie",
        templateKey: "fertilize",
        intervalDays: 30,
        nextDueAt: seedDate(10),
        lastCompletedAt: seedDate(-20, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },

      // Sunny
      {
        plantNickname: "Sunny",
        templateKey: "water",
        intervalDays: 14,
        nextDueAt: seedDate(4),
        lastCompletedAt: seedDate(-10, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Sunny",
        templateKey: "inspect_pests",
        intervalDays: 14,
        nextDueAt: seedDate(9),
        lastCompletedAt: seedDate(-5, 10),
        preferredHour: 18,
        preferredMinute: 30,
      },

      // Olive
      {
        plantNickname: "Olive",
        templateKey: "water",
        intervalDays: 7,
        nextDueAt: today,
        lastCompletedAt: seedDate(-7, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Olive",
        templateKey: "fertilize",
        intervalDays: 30,
        nextDueAt: seedDate(11),
        lastCompletedAt: seedDate(-19, 10),
        preferredHour: 9,
        preferredMinute: 0,
      },
      {
        plantNickname: "Olive",
        templateKey: "mist",
        intervalDays: 3,
        nextDueAt: seedDate(2),
        lastCompletedAt: yesterday,
        preferredHour: 9,
        preferredMinute: 0,
      },
    ];

    for (const schedule of scheduleSeeds) {
      const plantId = plantMap.get(schedule.plantNickname);
      const templateId = templateMap.get(schedule.templateKey) ?? null;
      if (!plantId)
        throw new Error(
          `Missing plant for schedule: ${schedule.plantNickname}`,
        );

      tx.insert(plantTaskSchedules)
        .values({
          plantId,
          templateId,
          intervalDays: schedule.intervalDays,
          nextDueAt: schedule.nextDueAt,
          lastCompletedAt: schedule.lastCompletedAt,
          isEnabled: true,
          preferredHour: schedule.preferredHour ?? 9,
          preferredMinute: schedule.preferredMinute ?? 0,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    type LogSeed = {
      plantNickname: string;
      templateKey: string;
      completedAt: Date;
      notes: string | null;
      amount: number | null;
      unit: string | null;
    };

    const logSeeds: LogSeed[] = [
      {
        plantNickname: "Milo",
        templateKey: "water",
        completedAt: seedDate(-7, 10),
        notes: "Soil was dry about 2 cm down.",
        amount: 250,
        unit: "ml",
      },
      {
        plantNickname: "Milo",
        templateKey: "water",
        completedAt: seedDate(-14, 10),
        notes: "Leaves looked firm after watering.",
        amount: 1,
        unit: "cup",
      },
      {
        plantNickname: "Milo",
        templateKey: "rotate",
        completedAt: seedDate(-5, 10),
        notes: "Rotated toward the window.",
        amount: null,
        unit: null,
      },
      {
        plantNickname: "Milo",
        templateKey: "fertilize",
        completedAt: seedDate(-27, 10),
        notes: "Added liquid fertilizer.",
        amount: null,
        unit: null,
      },
      {
        plantNickname: "Luna",
        templateKey: "water",
        completedAt: seedDate(-12, 10),
        notes: "Light misting only.",
        amount: 0.5,
        unit: "cup",
      },
      {
        plantNickname: "Penny",
        templateKey: "water",
        completedAt: seedDate(-5, 10),
        notes: "Soil was dry about 2 cm down.",
        amount: 200,
        unit: "ml",
      },
      {
        plantNickname: "Penny",
        templateKey: "rotate",
        completedAt: seedDate(-7, 10),
        notes: "Rotated toward the window.",
        amount: null,
        unit: null,
      },
      {
        plantNickname: "Ruby",
        templateKey: "water",
        completedAt: seedDate(-7, 10),
        notes: "Wiped dust from larger leaves.",
        amount: 300,
        unit: "ml",
      },
      {
        plantNickname: "Ruby",
        templateKey: "clean_leaves",
        completedAt: seedDate(-28, 10),
        notes: "Wiped dust from larger leaves.",
        amount: null,
        unit: null,
      },
      {
        plantNickname: "Nora",
        templateKey: "water",
        completedAt: yesterday,
        notes: "Trimmed long vines when needed.",
        amount: 200,
        unit: "ml",
      },
      {
        plantNickname: "Nora",
        templateKey: "water",
        completedAt: seedDate(-5, 10),
        notes: "Soil was dry about 2 cm down.",
        amount: 200,
        unit: "ml",
      },
      {
        plantNickname: "Nora",
        templateKey: "fertilize",
        completedAt: seedDate(-25, 10),
        notes: "Added liquid fertilizer.",
        amount: null,
        unit: null,
      },
      {
        plantNickname: "Fernie",
        templateKey: "water",
        completedAt: seedDate(-4, 10),
        notes: "Kept soil evenly moist.",
        amount: 200,
        unit: "ml",
      },
      {
        plantNickname: "Fernie",
        templateKey: "mist",
        completedAt: seedDate(-3, 10),
        notes: "Light misting only.",
        amount: null,
        unit: null,
      },
      {
        plantNickname: "Fernie",
        templateKey: "mist",
        completedAt: seedDate(-5, 10),
        notes: "Light misting only.",
        amount: null,
        unit: null,
      },
      {
        plantNickname: "Sunny",
        templateKey: "water",
        completedAt: seedDate(-10, 10),
        notes: "Let soil dry fully.",
        amount: 150,
        unit: "ml",
      },
      {
        plantNickname: "Olive",
        templateKey: "water",
        completedAt: today,
        notes: "Checked soil before watering.",
        amount: 200,
        unit: "ml",
      },
      {
        plantNickname: "Olive",
        templateKey: "water",
        completedAt: seedDate(-7, 10),
        notes: "Checked soil before watering.",
        amount: 200,
        unit: "ml",
      },
    ];

    for (const log of logSeeds) {
      const plantId = plantMap.get(log.plantNickname);
      const templateId = templateMap.get(log.templateKey) ?? null;
      if (!plantId)
        throw new Error(`Missing plant for log: ${log.plantNickname}`);

      tx.insert(careLogs)
        .values({
          plantId,
          scheduleId: null,
          templateId,
          type: log.templateKey,
          title: null,
          notes: log.notes,
          completedAt: log.completedAt,
          amount: log.amount,
          unit: log.unit,
          createdAt: now,
        })
        .run();
    }

    type JournalSeed = {
      plantNickname: string;
      title: string;
      body: string;
      entryType: "note" | "milestone" | "issue" | "treatment" | "observation";
      createdAt: Date;
    };

    const journalSeeds: JournalSeed[] = [
      {
        plantNickname: "Milo",
        title: "New leaf unfurled",
        body: "A beautiful new leaf opened overnight. The fenestrations are getting larger.",
        entryType: "milestone",
        createdAt: seedDate(-8, 14),
      },
      {
        plantNickname: "Penny",
        title: "Rotated after watering",
        body: "Penny was leaning toward the window again. A quick quarter turn should even things out.",
        entryType: "note",
        createdAt: seedDate(-5, 14),
      },
      {
        plantNickname: "Ruby",
        title: "Wiped leaves",
        body: "Dust had collected on the top leaves. They look much glossier now.",
        entryType: "observation",
        createdAt: seedDate(-3, 14),
      },
      {
        plantNickname: "Olive",
        title: "Checked soil before watering",
        body: "Soil was still moist an inch down, so I held off. Better to wait than overwater.",
        entryType: "note",
        createdAt: today,
      },
      {
        plantNickname: "Fernie",
        title: "Watching humidity",
        body: "Fronds look a little crisp. Moved closer to the humidifier for now.",
        entryType: "observation",
        createdAt: yesterday,
      },
    ];

    for (const entry of journalSeeds) {
      const plantId = plantMap.get(entry.plantNickname);
      if (!plantId)
        throw new Error(`Missing plant for journal: ${entry.plantNickname}`);

      tx.insert(journalEntries)
        .values({
          plantId,
          title: entry.title,
          body: entry.body,
          entryType: entry.entryType,
          createdAt: entry.createdAt,
          updatedAt: entry.createdAt,
        })
        .run();
    }

    type GrowthSeed = {
      plantNickname: string;
      heightCm: number;
      leafCount: number;
      measuredAt: Date;
    };

    const growthSeeds: GrowthSeed[] = [
      {
        plantNickname: "Milo",
        heightCm: 34,
        leafCount: 7,
        measuredAt: seedDate(-45, 10),
      },
      {
        plantNickname: "Milo",
        heightCm: 38,
        leafCount: 8,
        measuredAt: seedDate(-25, 10),
      },
      {
        plantNickname: "Milo",
        heightCm: 42,
        leafCount: 9,
        measuredAt: seedDate(-5, 10),
      },
      {
        plantNickname: "Penny",
        heightCm: 18,
        leafCount: 12,
        measuredAt: seedDate(-40, 10),
      },
      {
        plantNickname: "Penny",
        heightCm: 20,
        leafCount: 14,
        measuredAt: seedDate(-14, 10),
      },
      {
        plantNickname: "Sunny",
        heightCm: 16,
        leafCount: 7,
        measuredAt: seedDate(-35, 10),
      },
      {
        plantNickname: "Sunny",
        heightCm: 18,
        leafCount: 8,
        measuredAt: seedDate(-3, 10),
      },
    ];

    for (const growth of growthSeeds) {
      const plantId = plantMap.get(growth.plantNickname);
      if (!plantId)
        throw new Error(`Missing plant for growth: ${growth.plantNickname}`);

      tx.insert(growthMeasurements)
        .values({
          plantId,
          heightCm: growth.heightCm,
          leafCount: growth.leafCount,
          measuredAt: growth.measuredAt,
          createdAt: now,
        })
        .run();
    }

    type HealthSeed = {
      plantNickname: string;
      issueType: string;
      severity: "low" | "medium" | "high";
      status: "active" | "improving" | "resolved";
      notes: string;
      observedAt: Date;
    };

    const healthSeeds: HealthSeed[] = [
      {
        plantNickname: "Fernie",
        issueType: "brown_tips",
        severity: "low",
        status: "active",
        notes:
          "A few dry tips. Keeping humidity steady and avoiding direct sun.",
        observedAt: seedDate(-2, 10),
      },
      {
        plantNickname: "Ruby",
        issueType: "yellow_leaves",
        severity: "low",
        status: "resolved",
        notes: "Older leaf removed. New growth looks healthy.",
        observedAt: seedDate(-10, 10),
      },
    ];

    for (const health of healthSeeds) {
      const plantId = plantMap.get(health.plantNickname);
      if (!plantId)
        throw new Error(`Missing plant for health: ${health.plantNickname}`);

      tx.insert(healthObservations)
        .values({
          plantId,
          issueType: health.issueType,
          severity: health.severity,
          status: health.status,
          notes: health.notes,
          observedAt: health.observedAt,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    const marker: ScreenshotSeedMarker = {
      plantIds: insertedPlantIds,
      roomIds: insertedRoomIds,
      shelfIds: insertedShelfIds,
      photoUris,
    };

    setSetting(tx, SCREENSHOT_SEED_KEY, marker, screenshotSeedMarkerSchema);

    saveReminderSettings(tx, {
      enabled: true,
      hour: 9,
      minute: 0,
      quietHoursEnabled: true,
      quietStartHour: 22,
      quietEndHour: 7,
      previewStyle: "detailed",
      permissionAsked: true,
    });
  });
}
