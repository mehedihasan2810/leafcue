import { eq, sql } from "drizzle-orm";
import type { z } from "zod";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { appSettings, onboardingState } from "@/lib/db/schema";
import { settingsKeySchema } from "@/lib/db/zod";

function readJson<TSchema extends z.ZodTypeAny>(
  raw: string | undefined,
  schema: TSchema,
): z.infer<TSchema> | null {
  if (raw === undefined) return null;
  try {
    return schema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function getSetting<TSchema extends z.ZodTypeAny>(
  db: LeafCueDbOrTx,
  key: string,
  schema: TSchema,
): z.infer<TSchema> | null {
  const parsedKey = settingsKeySchema.parse(key);
  const row = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, parsedKey))
    .get();
  return readJson(row?.value, schema);
}

export function setSetting<TSchema extends z.ZodTypeAny>(
  db: LeafCueDatabase,
  key: string,
  value: z.infer<TSchema>,
  schema: TSchema,
): void {
  const parsedKey = settingsKeySchema.parse(key);
  const parsedValue = schema.parse(value);
  const serialized = JSON.stringify(parsedValue);
  const now = new Date();

  db.insert(appSettings)
    .values({ key: parsedKey, value: serialized, updatedAt: now })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: serialized, updatedAt: now },
    })
    .run();
}

export function deleteSetting(db: LeafCueDatabase, key: string): void {
  const parsedKey = settingsKeySchema.parse(key);
  db.delete(appSettings).where(eq(appSettings.key, parsedKey)).run();
}

export function getOnboardingState<TSchema extends z.ZodTypeAny>(
  db: LeafCueDbOrTx,
  key: string,
  schema: TSchema,
): z.infer<TSchema> | null {
  const parsedKey = settingsKeySchema.parse(key);
  const row = db
    .select()
    .from(onboardingState)
    .where(eq(onboardingState.key, parsedKey))
    .get();
  return readJson(row?.value, schema);
}

export function setOnboardingState<TSchema extends z.ZodTypeAny>(
  db: LeafCueDatabase,
  key: string,
  value: z.infer<TSchema>,
  schema: TSchema,
): void {
  const parsedKey = settingsKeySchema.parse(key);
  const parsedValue = schema.parse(value);
  const serialized = JSON.stringify(parsedValue);
  const now = new Date();

  db.insert(onboardingState)
    .values({ key: parsedKey, value: serialized, updatedAt: now })
    .onConflictDoUpdate({
      target: onboardingState.key,
      set: { value: serialized, updatedAt: now },
    })
    .run();
}

export function clearOnboardingState(db: LeafCueDatabase): void {
  db.delete(onboardingState).where(sql`1 = 1`).run();
}
