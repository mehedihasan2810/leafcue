import { asc, eq } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import {
  type CareTaskTemplateKey,
  careTaskTemplates,
} from "@/lib/db/schema";
import type { CareTaskTemplate } from "@/lib/db/types";
import {
  careTaskTemplateInsertSchema,
  type CareTaskTemplateInsertInput,
} from "@/lib/db/zod";

export function getCareTaskTemplates(
  db: LeafCueDbOrTx,
): CareTaskTemplate[] {
  return db
    .select()
    .from(careTaskTemplates)
    .orderBy(asc(careTaskTemplates.name))
    .all();
}

export function getCareTaskTemplateByKey(
  db: LeafCueDbOrTx,
  key: CareTaskTemplateKey,
): CareTaskTemplate | undefined {
  return db
    .select()
    .from(careTaskTemplates)
    .where(eq(careTaskTemplates.key, key))
    .get();
}

export function createCareTaskTemplate(
  db: LeafCueDatabase,
  input: CareTaskTemplateInsertInput,
): CareTaskTemplate {
  const parsed = careTaskTemplateInsertSchema.parse(input);

  const inserted = db
    .insert(careTaskTemplates)
    .values({
      key: parsed.key,
      name: parsed.name,
      icon: parsed.icon ?? null,
      defaultIntervalDays: parsed.defaultIntervalDays ?? null,
      defaultInstructions: parsed.defaultInstructions ?? null,
      colorKey: parsed.colorKey ?? null,
      isBuiltIn: parsed.isBuiltIn ?? false,
    })
    .returning()
    .get();

  if (!inserted) {
    throw new Error("Failed to create care task template");
  }

  return inserted;
}
