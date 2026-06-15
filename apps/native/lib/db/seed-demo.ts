import { eq } from "drizzle-orm";

import type { LeafCueDatabase } from "@/lib/db";
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
} from "@/lib/db/schema";

const DEMO_MARKER = "demo-seed-v1";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export async function isDemoDataLoaded(db: LeafCueDatabase): Promise<boolean> {
  const row = db
    .select({ id: plants.id })
    .from(plants)
    .where(eq(plants.notes, DEMO_MARKER))
    .get();
  return row !== undefined;
}

export async function clearDemoData(db: LeafCueDatabase): Promise<void> {
  const demoPlants = db
    .select({ id: plants.id })
    .from(plants)
    .where(eq(plants.notes, DEMO_MARKER))
    .all();

  for (const p of demoPlants) {
    db.delete(plants).where(eq(plants.id, p.id)).run();
  }
}

export async function loadDemoData(db: LeafCueDatabase): Promise<void> {
  if (await isDemoDataLoaded(db)) return;

  const allRooms = db.select().from(rooms).all();
  const livingRoom = allRooms.find((r) => r.name === "Living Room");
  const bedroom = allRooms.find((r) => r.name === "Bedroom");
  const kitchen = allRooms.find((r) => r.name === "Kitchen");
  const office = allRooms.find((r) => r.name === "Office");

  const templates = db.select().from(careTaskTemplates).all();
  const waterTpl = templates.find((t) => t.key === "water");
  const fertilizeTpl = templates.find((t) => t.key === "fertilize");
  const mistTpl = templates.find((t) => t.key === "mist");
  const pruneTpl = templates.find((t) => t.key === "prune");
  const rotateTpl = templates.find((t) => t.key === "rotate");
  const repotTpl = templates.find((t) => t.key === "repot");

  const now = new Date();

  // ── Plants ──────────────────────────────────────────────────────────────
  // 1. Monty — Monstera Deliciosa
  const monty = db
    .insert(plants)
    .values({
      nickname: "Monty",
      commonName: "Monstera",
      scientificName: "Monstera deliciosa",
      photoUri:
        "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&q=80&fit=crop",
      roomId: livingRoom?.id ?? null,
      careDifficulty: "easy",
      toxicity: "toxic-pets",
      lightPreference: "bright-indirect",
      wateringPreference: "let-dry-between",
      soilType: "Aroid mix with perlite",
      potType: "Terracotta",
      potSize: "22 cm",
      hasDrainage: true,
      acquiredAt: daysAgo(420),
      isFavorite: true,
      notes: DEMO_MARKER,
      createdAt: daysAgo(420),
      updatedAt: now,
    })
    .returning()
    .get();

  // 2. Goldie — Golden Pothos
  const goldie = db
    .insert(plants)
    .values({
      nickname: "Goldie",
      commonName: "Pothos",
      scientificName: "Epipremnum aureum",
      photoUri:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Money_Plant_%28Epipremnum_aureum%29_4.jpg/500px-Money_Plant_%28Epipremnum_aureum%29_4.jpg",
      roomId: kitchen?.id ?? null,
      careDifficulty: "easy",
      toxicity: "toxic-pets",
      lightPreference: "medium",
      wateringPreference: "let-dry-between",
      soilType: "Standard potting mix",
      potType: "Plastic nursery",
      potSize: "14 cm",
      hasDrainage: true,
      acquiredAt: daysAgo(280),
      isFavorite: false,
      notes: DEMO_MARKER,
      createdAt: daysAgo(280),
      updatedAt: now,
    })
    .returning()
    .get();

  // 3. Sassy — Snake Plant
  const sassy = db
    .insert(plants)
    .values({
      nickname: "Sassy",
      commonName: "Snake Plant",
      scientificName: "Dracaena trifasciata",
      photoUri:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg/500px-Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg",
      roomId: bedroom?.id ?? null,
      careDifficulty: "easy",
      toxicity: "toxic-pets",
      lightPreference: "low",
      wateringPreference: "low",
      soilType: "Cactus & succulent mix",
      potType: "Ceramic",
      potSize: "16 cm",
      hasDrainage: true,
      acquiredAt: daysAgo(600),
      isFavorite: false,
      notes: DEMO_MARKER,
      createdAt: daysAgo(600),
      updatedAt: now,
    })
    .returning()
    .get();

  // 4. Stella — Peace Lily
  const stella = db
    .insert(plants)
    .values({
      nickname: "Stella",
      commonName: "Peace Lily",
      scientificName: "Spathiphyllum wallisii",
      photoUri:
        "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=600&q=80&fit=crop",
      roomId: office?.id ?? null,
      careDifficulty: "moderate",
      toxicity: "toxic-all",
      lightPreference: "low",
      wateringPreference: "keep-moist",
      soilType: "Rich, well-draining mix",
      potType: "Ceramic",
      potSize: "18 cm",
      hasDrainage: true,
      acquiredAt: daysAgo(180),
      isFavorite: true,
      notes: DEMO_MARKER,
      createdAt: daysAgo(180),
      updatedAt: now,
    })
    .returning()
    .get();

  // 5. Figaro — Fiddle Leaf Fig
  const figaro = db
    .insert(plants)
    .values({
      nickname: "Figaro",
      commonName: "Fiddle Leaf Fig",
      scientificName: "Ficus lyrata",
      photoUri:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Starr_031108-0130_Ficus_lyrata.jpg/500px-Starr_031108-0130_Ficus_lyrata.jpg",
      roomId: livingRoom?.id ?? null,
      careDifficulty: "hard",
      toxicity: "toxic-pets",
      lightPreference: "bright-indirect",
      wateringPreference: "let-dry-between",
      soilType: "Fast-draining potting mix",
      potType: "Terracotta",
      potSize: "26 cm",
      hasDrainage: true,
      acquiredAt: daysAgo(365),
      isFavorite: true,
      notes: DEMO_MARKER,
      createdAt: daysAgo(365),
      updatedAt: now,
    })
    .returning()
    .get();

  // 6. Ziggy — ZZ Plant
  const ziggy = db
    .insert(plants)
    .values({
      nickname: "Ziggy",
      commonName: "ZZ Plant",
      scientificName: "Zamioculcas zamiifolia",
      photoUri:
        "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=600&q=80&fit=crop",
      roomId: bedroom?.id ?? null,
      careDifficulty: "easy",
      toxicity: "toxic-all",
      lightPreference: "low",
      wateringPreference: "low",
      soilType: "Well-draining mix with sand",
      potType: "Ceramic",
      potSize: "20 cm",
      hasDrainage: true,
      acquiredAt: daysAgo(500),
      isFavorite: false,
      notes: DEMO_MARKER,
      createdAt: daysAgo(500),
      updatedAt: now,
    })
    .returning()
    .get();

  // 7. Ruby — Rubber Plant
  const ruby = db
    .insert(plants)
    .values({
      nickname: "Ruby",
      commonName: "Rubber Plant",
      scientificName: "Ficus elastica",
      photoUri:
        "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&q=80&fit=crop",
      roomId: kitchen?.id ?? null,
      careDifficulty: "easy",
      toxicity: "toxic-pets",
      lightPreference: "bright-indirect",
      wateringPreference: "let-dry-between",
      soilType: "Well-draining potting mix",
      potType: "Plastic with saucer",
      potSize: "18 cm",
      hasDrainage: true,
      acquiredAt: daysAgo(240),
      isFavorite: false,
      notes: DEMO_MARKER,
      createdAt: daysAgo(240),
      updatedAt: now,
    })
    .returning()
    .get();

  // 8. Blossom — Moth Orchid
  const blossom = db
    .insert(plants)
    .values({
      nickname: "Blossom",
      commonName: "Moth Orchid",
      scientificName: "Phalaenopsis amabilis",
      photoUri:
        "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=600&q=80&fit=crop",
      roomId: livingRoom?.id ?? null,
      careDifficulty: "moderate",
      toxicity: "non-toxic",
      lightPreference: "bright-indirect",
      wateringPreference: "let-dry-between",
      soilType: "Orchid bark mix",
      potType: "Clear plastic",
      potSize: "12 cm",
      hasDrainage: true,
      acquiredAt: daysAgo(120),
      isFavorite: true,
      notes: DEMO_MARKER,
      createdAt: daysAgo(120),
      updatedAt: now,
    })
    .returning()
    .get();

  // ── Extra gallery photos ─────────────────────────────────────────────────
  db.insert(plantPhotos)
    .values([
      {
        plantId: monty.id,
        uri: "https://images.unsplash.com/photo-1567748157439-651aca2ff064?w=600&q=80&fit=crop",
        caption: "New leaf unfurling — look at that fenestration!",
        type: "growth",
        takenAt: daysAgo(14),
        createdAt: daysAgo(14),
      },
      {
        plantId: monty.id,
        uri: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&q=80&fit=crop",
        caption: "After cleaning the leaves",
        type: "journal",
        takenAt: daysAgo(30),
        createdAt: daysAgo(30),
      },
      {
        plantId: figaro.id,
        uri: "https://images.unsplash.com/photo-1627417590248-b22aa0b37cfe?w=600&q=80&fit=crop",
        caption: "Finally putting out a new bud",
        type: "growth",
        takenAt: daysAgo(7),
        createdAt: daysAgo(7),
      },
      {
        plantId: blossom.id,
        uri: "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=600&q=80&fit=crop",
        caption: "In full bloom!",
        type: "journal",
        takenAt: daysAgo(10),
        createdAt: daysAgo(10),
      },
    ])
    .run();

  // ── Care task schedules ──────────────────────────────────────────────────
  if (waterTpl) {
    // Monty — watered 2 days ago, next due in 5 days
    db.insert(plantTaskSchedules)
      .values({
        plantId: monty.id,
        templateId: waterTpl.id,
        intervalDays: 7,
        nextDueAt: daysFromNow(5),
        lastCompletedAt: daysAgo(2),
        isEnabled: true,
        preferredHour: 9,
        preferredMinute: 0,
        createdAt: daysAgo(420),
        updatedAt: daysAgo(2),
      })
      .run();

    // Goldie — due today
    db.insert(plantTaskSchedules)
      .values({
        plantId: goldie.id,
        templateId: waterTpl.id,
        intervalDays: 7,
        nextDueAt: now,
        lastCompletedAt: daysAgo(7),
        isEnabled: true,
        preferredHour: 9,
        preferredMinute: 0,
        createdAt: daysAgo(280),
        updatedAt: daysAgo(7),
      })
      .run();

    // Sassy — due in 10 days (snake plants need less water)
    db.insert(plantTaskSchedules)
      .values({
        plantId: sassy.id,
        templateId: waterTpl.id,
        intervalDays: 14,
        nextDueAt: daysFromNow(10),
        lastCompletedAt: daysAgo(4),
        isEnabled: true,
        createdAt: daysAgo(600),
        updatedAt: daysAgo(4),
      })
      .run();

    // Stella — due today
    db.insert(plantTaskSchedules)
      .values({
        plantId: stella.id,
        templateId: waterTpl.id,
        intervalDays: 5,
        nextDueAt: now,
        lastCompletedAt: daysAgo(5),
        isEnabled: true,
        preferredHour: 8,
        preferredMinute: 30,
        createdAt: daysAgo(180),
        updatedAt: daysAgo(5),
      })
      .run();

    // Figaro — overdue by 3 days
    db.insert(plantTaskSchedules)
      .values({
        plantId: figaro.id,
        templateId: waterTpl.id,
        intervalDays: 7,
        nextDueAt: daysAgo(3),
        lastCompletedAt: daysAgo(10),
        isEnabled: true,
        preferredHour: 9,
        preferredMinute: 0,
        createdAt: daysAgo(365),
        updatedAt: daysAgo(10),
      })
      .run();

    // Ziggy — due in 8 days
    db.insert(plantTaskSchedules)
      .values({
        plantId: ziggy.id,
        templateId: waterTpl.id,
        intervalDays: 21,
        nextDueAt: daysFromNow(8),
        lastCompletedAt: daysAgo(13),
        isEnabled: true,
        createdAt: daysAgo(500),
        updatedAt: daysAgo(13),
      })
      .run();

    // Ruby — due tomorrow
    db.insert(plantTaskSchedules)
      .values({
        plantId: ruby.id,
        templateId: waterTpl.id,
        intervalDays: 7,
        nextDueAt: daysFromNow(1),
        lastCompletedAt: daysAgo(6),
        isEnabled: true,
        createdAt: daysAgo(240),
        updatedAt: daysAgo(6),
      })
      .run();

    // Blossom — due today
    db.insert(plantTaskSchedules)
      .values({
        plantId: blossom.id,
        templateId: waterTpl.id,
        intervalDays: 10,
        nextDueAt: now,
        lastCompletedAt: daysAgo(10),
        isEnabled: true,
        preferredHour: 10,
        preferredMinute: 0,
        createdAt: daysAgo(120),
        updatedAt: daysAgo(10),
      })
      .run();
  }

  if (fertilizeTpl) {
    // Monty — fertilized last month, due in 2 days
    db.insert(plantTaskSchedules)
      .values({
        plantId: monty.id,
        templateId: fertilizeTpl.id,
        intervalDays: 30,
        nextDueAt: daysFromNow(2),
        lastCompletedAt: daysAgo(28),
        isEnabled: true,
        createdAt: daysAgo(420),
        updatedAt: daysAgo(28),
      })
      .run();

    // Figaro — overdue fertilize
    db.insert(plantTaskSchedules)
      .values({
        plantId: figaro.id,
        templateId: fertilizeTpl.id,
        intervalDays: 30,
        nextDueAt: daysAgo(5),
        lastCompletedAt: daysAgo(35),
        isEnabled: true,
        createdAt: daysAgo(365),
        updatedAt: daysAgo(35),
      })
      .run();

    // Stella — due in 12 days
    db.insert(plantTaskSchedules)
      .values({
        plantId: stella.id,
        templateId: fertilizeTpl.id,
        intervalDays: 30,
        nextDueAt: daysFromNow(12),
        lastCompletedAt: daysAgo(18),
        isEnabled: true,
        createdAt: daysAgo(180),
        updatedAt: daysAgo(18),
      })
      .run();
  }

  if (mistTpl) {
    // Stella needs misting — due today
    db.insert(plantTaskSchedules)
      .values({
        plantId: stella.id,
        templateId: mistTpl.id,
        intervalDays: 3,
        nextDueAt: now,
        lastCompletedAt: daysAgo(3),
        isEnabled: true,
        createdAt: daysAgo(180),
        updatedAt: daysAgo(3),
      })
      .run();

    // Blossom needs misting — due in 2 days
    db.insert(plantTaskSchedules)
      .values({
        plantId: blossom.id,
        templateId: mistTpl.id,
        intervalDays: 3,
        nextDueAt: daysFromNow(2),
        lastCompletedAt: daysAgo(1),
        isEnabled: true,
        createdAt: daysAgo(120),
        updatedAt: daysAgo(1),
      })
      .run();

    // Monty — misting due today
    db.insert(plantTaskSchedules)
      .values({
        plantId: monty.id,
        templateId: mistTpl.id,
        intervalDays: 3,
        nextDueAt: now,
        lastCompletedAt: daysAgo(3),
        isEnabled: true,
        createdAt: daysAgo(420),
        updatedAt: daysAgo(3),
      })
      .run();
  }

  if (rotateTpl) {
    // Ruby — rotate due in 3 days
    db.insert(plantTaskSchedules)
      .values({
        plantId: ruby.id,
        templateId: rotateTpl.id,
        intervalDays: 14,
        nextDueAt: daysFromNow(3),
        lastCompletedAt: daysAgo(11),
        isEnabled: true,
        createdAt: daysAgo(240),
        updatedAt: daysAgo(11),
      })
      .run();

    // Figaro — rotate due today
    db.insert(plantTaskSchedules)
      .values({
        plantId: figaro.id,
        templateId: rotateTpl.id,
        intervalDays: 14,
        nextDueAt: now,
        lastCompletedAt: daysAgo(14),
        isEnabled: true,
        createdAt: daysAgo(365),
        updatedAt: daysAgo(14),
      })
      .run();
  }

  if (pruneTpl) {
    // Goldie — prune upcoming
    db.insert(plantTaskSchedules)
      .values({
        plantId: goldie.id,
        templateId: pruneTpl.id,
        intervalDays: 60,
        nextDueAt: daysFromNow(18),
        lastCompletedAt: daysAgo(42),
        isEnabled: true,
        createdAt: daysAgo(280),
        updatedAt: daysAgo(42),
      })
      .run();
  }

  if (repotTpl) {
    // Monty — repot due in 45 days
    db.insert(plantTaskSchedules)
      .values({
        plantId: monty.id,
        templateId: repotTpl.id,
        intervalDays: 365,
        nextDueAt: daysFromNow(45),
        lastCompletedAt: daysAgo(320),
        isEnabled: true,
        createdAt: daysAgo(420),
        updatedAt: daysAgo(320),
      })
      .run();
  }

  // ── Care logs (history) ──────────────────────────────────────────────────
  const careLogEntries = [
    // Monty water logs
    {
      plantId: monty.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(2),
    },
    {
      plantId: monty.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(9),
    },
    {
      plantId: monty.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(16),
    },
    {
      plantId: monty.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(23),
    },
    {
      plantId: monty.id,
      type: "fertilize",
      title: "Fertilized",
      templateId: fertilizeTpl?.id,
      completedAt: daysAgo(28),
    },
    {
      plantId: monty.id,
      type: "mist",
      title: "Misted",
      templateId: mistTpl?.id,
      completedAt: daysAgo(3),
      notes: "Leaves look so happy after misting",
    },
    // Goldie logs
    {
      plantId: goldie.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(7),
    },
    {
      plantId: goldie.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(14),
    },
    {
      plantId: goldie.id,
      type: "prune",
      title: "Pruned",
      templateId: pruneTpl?.id,
      completedAt: daysAgo(42),
      notes: "Trimmed 3 long vines and propagated in water",
    },
    // Sassy logs
    {
      plantId: sassy.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(4),
    },
    {
      plantId: sassy.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(18),
    },
    // Stella logs
    {
      plantId: stella.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(5),
      amount: 200,
      unit: "ml",
    },
    {
      plantId: stella.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(10),
      amount: 200,
      unit: "ml",
    },
    {
      plantId: stella.id,
      type: "mist",
      title: "Misted",
      templateId: mistTpl?.id,
      completedAt: daysAgo(3),
    },
    {
      plantId: stella.id,
      type: "fertilize",
      title: "Fertilized",
      templateId: fertilizeTpl?.id,
      completedAt: daysAgo(18),
    },
    // Figaro logs
    {
      plantId: figaro.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(10),
    },
    {
      plantId: figaro.id,
      type: "rotate",
      title: "Rotated",
      templateId: rotateTpl?.id,
      completedAt: daysAgo(14),
      notes: "Turned 90° clockwise toward the window",
    },
    // Ziggy logs
    {
      plantId: ziggy.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(13),
    },
    {
      plantId: ziggy.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(34),
    },
    // Ruby logs
    {
      plantId: ruby.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(6),
    },
    {
      plantId: ruby.id,
      type: "rotate",
      title: "Rotated",
      templateId: rotateTpl?.id,
      completedAt: daysAgo(11),
    },
    // Blossom logs
    {
      plantId: blossom.id,
      type: "water",
      title: "Watered",
      templateId: waterTpl?.id,
      completedAt: daysAgo(10),
      amount: 100,
      unit: "ml",
    },
    {
      plantId: blossom.id,
      type: "mist",
      title: "Misted",
      templateId: mistTpl?.id,
      completedAt: daysAgo(1),
    },
  ] as const;

  for (const entry of careLogEntries) {
    db.insert(careLogs)
      .values({
        plantId: entry.plantId,
        templateId: entry.templateId ?? null,
        type: entry.type,
        title: entry.title,
        notes: "notes" in entry ? (entry.notes as string) : null,
        amount: "amount" in entry ? (entry.amount as number) : null,
        unit: "unit" in entry ? (entry.unit as string) : null,
        completedAt: new Date(entry.completedAt),
        createdAt: new Date(entry.completedAt),
      })
      .run();
  }

  // ── Journal entries ──────────────────────────────────────────────────────
  db.insert(journalEntries)
    .values([
      {
        plantId: monty.id,
        title: "First new leaf of the season! 🌿",
        body: "Woke up to find a new fenestrated leaf unfurling. The split pattern is even more pronounced than the last one. Moved it slightly closer to the east window and I think it's paying off. Moss pole is also helping keep it upright as it gets heavier.",
        entryType: "milestone",
        mood: "excited",
        createdAt: daysAgo(14),
        updatedAt: daysAgo(14),
      },
      {
        plantId: monty.id,
        title: "Wiped the leaves",
        body: "Did a thorough leaf cleaning with a damp cloth and a tiny drop of neem oil. Leaves are gleaming now. Checked for any pest signs — all clear. Also added a little more perlite to the top soil to improve drainage.",
        entryType: "note",
        mood: "calm",
        createdAt: daysAgo(30),
        updatedAt: daysAgo(30),
      },
      {
        plantId: monty.id,
        title: "Added a moss pole",
        body: "Finally upgraded from the bamboo stick to a proper coconut coir moss pole. Tied three stems to it and the plant already looks so much more structural. I think this will really help the new aerial roots find purchase.",
        entryType: "milestone",
        mood: "proud",
        createdAt: daysAgo(60),
        updatedAt: daysAgo(60),
      },
      {
        plantId: goldie.id,
        title: "Slight yellowing on lower leaves",
        body: "Noticed two lower leaves going yellow. Probably from overwatering last month — I've been more careful lately. Trimmed them off cleanly. Will hold off watering another 2 days to let the soil dry out properly.",
        entryType: "issue",
        mood: "concerned",
        createdAt: daysAgo(20),
        updatedAt: daysAgo(20),
      },
      {
        plantId: goldie.id,
        title: "Propagation experiment",
        body: "Cut three long vines and popped them in water jars on the kitchen windowsill. Already seeing tiny root nubs after 10 days! Going to pot them up once the roots are 3–4 cm. Perfect gifts for friends.",
        entryType: "observation",
        mood: "excited",
        createdAt: daysAgo(42),
        updatedAt: daysAgo(42),
      },
      {
        plantId: ziggy.id,
        title: "Repotted — roots were completely pot-bound",
        body: "Finally bit the bullet and repotted Ziggy into a pot 2 sizes up. The roots were absolutely packed and had started circling the bottom. Refreshed with fresh cactus mix + extra perlite. Now in a 20cm ceramic pot. Recovery should be quick given how tough ZZ plants are.",
        entryType: "milestone",
        mood: "relieved",
        createdAt: daysAgo(90),
        updatedAt: daysAgo(90),
      },
      {
        plantId: figaro.id,
        title: "New bud spotted",
        body: "Finally! After a few months of dormancy (and a near-panic when three leaves dropped at once), Figaro is showing a new bud near the top. Keeping conditions stable — no moving, consistent watering, same light. Fingers crossed.",
        entryType: "milestone",
        mood: "hopeful",
        createdAt: daysAgo(7),
        updatedAt: daysAgo(7),
      },
      {
        plantId: stella.id,
        title: "First bloom!",
        body: "Stella put out her first white spathe today. Peace lilies are supposed to be easy to bloom but mine had been reluctant for months. Moving her to the office (lower light, more stable temp) seems to have done the trick. The white is stunning against the deep green leaves.",
        entryType: "milestone",
        mood: "thrilled",
        photoUri:
          "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=600&q=80&fit=crop",
        createdAt: daysAgo(45),
        updatedAt: daysAgo(45),
      },
      {
        plantId: blossom.id,
        title: "In full bloom — 9 open flowers!",
        body: "Counted 9 open blooms on the spike this morning. The flowers are lasting really well — already 3 weeks in. Keeping her out of direct sun and away from fruit has made a big difference this time around. Truly the queen of the living room right now.",
        entryType: "observation",
        mood: "delighted",
        createdAt: daysAgo(10),
        updatedAt: daysAgo(10),
      },
    ])
    .run();

  // ── Growth measurements ──────────────────────────────────────────────────
  db.insert(growthMeasurements)
    .values([
      {
        plantId: monty.id,
        measuredAt: daysAgo(120),
        heightCm: 45,
        leafCount: 6,
        notes: "Established after repotting",
        createdAt: daysAgo(120),
      },
      {
        plantId: monty.id,
        measuredAt: daysAgo(90),
        heightCm: 52,
        leafCount: 7,
        createdAt: daysAgo(90),
      },
      {
        plantId: monty.id,
        measuredAt: daysAgo(60),
        heightCm: 61,
        leafCount: 9,
        notes: "Added moss pole this month",
        createdAt: daysAgo(60),
      },
      {
        plantId: monty.id,
        measuredAt: daysAgo(30),
        heightCm: 68,
        leafCount: 10,
        createdAt: daysAgo(30),
      },
      {
        plantId: monty.id,
        measuredAt: daysAgo(14),
        heightCm: 74,
        leafCount: 11,
        notes: "New fenestrated leaf fully open",
        createdAt: daysAgo(14),
      },
      {
        plantId: figaro.id,
        measuredAt: daysAgo(180),
        heightCm: 72,
        leafCount: 8,
        createdAt: daysAgo(180),
      },
      {
        plantId: figaro.id,
        measuredAt: daysAgo(90),
        heightCm: 85,
        leafCount: 9,
        createdAt: daysAgo(90),
      },
      {
        plantId: figaro.id,
        measuredAt: daysAgo(30),
        heightCm: 91,
        leafCount: 8,
        notes: "Dropped one leaf after stress",
        createdAt: daysAgo(30),
      },
      {
        plantId: figaro.id,
        measuredAt: daysAgo(7),
        heightCm: 91,
        leafCount: 9,
        notes: "New bud spotted!",
        createdAt: daysAgo(7),
      },
      {
        plantId: goldie.id,
        measuredAt: daysAgo(90),
        heightCm: 38,
        leafCount: 22,
        createdAt: daysAgo(90),
      },
      {
        plantId: goldie.id,
        measuredAt: daysAgo(45),
        heightCm: 47,
        leafCount: 26,
        createdAt: daysAgo(45),
      },
      {
        plantId: stella.id,
        measuredAt: daysAgo(90),
        heightCm: 31,
        leafCount: 8,
        bloomCount: 0,
        createdAt: daysAgo(90),
      },
      {
        plantId: stella.id,
        measuredAt: daysAgo(45),
        heightCm: 34,
        leafCount: 9,
        bloomCount: 1,
        notes: "First spathe opening",
        createdAt: daysAgo(45),
      },
      {
        plantId: blossom.id,
        measuredAt: daysAgo(60),
        heightCm: 28,
        leafCount: 4,
        bloomCount: 0,
        createdAt: daysAgo(60),
      },
      {
        plantId: blossom.id,
        measuredAt: daysAgo(10),
        heightCm: 32,
        leafCount: 4,
        bloomCount: 9,
        notes: "Spike fully bloomed out",
        createdAt: daysAgo(10),
      },
    ])
    .run();

  // ── Health observations ──────────────────────────────────────────────────
  db.insert(healthObservations)
    .values([
      {
        plantId: goldie.id,
        issueType: "yellow_leaves",
        severity: "low",
        status: "improving",
        notes:
          "Two lower leaves yellowed, likely from overwatering. Trimmed and adjusting watering schedule.",
        observedAt: daysAgo(20),
        createdAt: daysAgo(20),
        updatedAt: daysAgo(5),
      },
      {
        plantId: ziggy.id,
        issueType: "root_rot",
        severity: "medium",
        status: "resolved",
        notes:
          "Found some mushy roots during repotting. Trimmed affected roots, dusted with cinnamon, and replanted in fresh well-draining mix. Fully recovered.",
        observedAt: daysAgo(95),
        createdAt: daysAgo(95),
        updatedAt: daysAgo(80),
      },
      {
        plantId: figaro.id,
        issueType: "leaf_drop",
        severity: "medium",
        status: "improving",
        notes:
          "Dropped 3 leaves after being moved. Keeping it in a stable spot now and new growth is showing.",
        observedAt: daysAgo(45),
        createdAt: daysAgo(45),
        updatedAt: daysAgo(7),
      },
    ])
    .run();

  // Mark onboarding as complete so the app doesn't show onboarding screens
  // when taking screenshots (only if not already set)
  try {
    const { onboardingState } = await import("@/lib/db/schema");
    db.insert(onboardingState)
      .values([
        {
          key: "onboarding.main",
          value: JSON.stringify({
            completed: true,
            completedAt: now.toISOString(),
          }),
          updatedAt: now,
        },
      ])
      .onConflictDoNothing()
      .run();
  } catch {
    // onboarding state is best-effort
  }
}
