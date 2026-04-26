import { desc, eq } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { plantPhotos, plants } from "@/lib/db/schema";
import type { PlantPhoto } from "@/lib/db/types";
import {
  type PlantPhotoInsertInput,
  plantPhotoInsertSchema,
} from "@/lib/db/zod";

export function getPlantPhotos(
  db: LeafCueDbOrTx,
  plantId: number,
): PlantPhoto[] {
  return db
    .select()
    .from(plantPhotos)
    .where(eq(plantPhotos.plantId, plantId))
    .orderBy(desc(plantPhotos.takenAt))
    .all();
}

export function addPlantPhoto(
  db: LeafCueDatabase,
  input: PlantPhotoInsertInput,
): PlantPhoto {
  const parsed = plantPhotoInsertSchema.parse(input);
  const takenAt = parsed.takenAt ?? new Date();

  return db.transaction((tx) => {
    const inserted = tx
      .insert(plantPhotos)
      .values({
        plantId: parsed.plantId,
        uri: parsed.uri,
        caption: parsed.caption ?? null,
        takenAt,
        type: parsed.type ?? "journal",
      })
      .returning()
      .get();

    if (!inserted) {
      throw new Error("Failed to insert plant photo");
    }

    if (inserted.type === "cover") {
      tx.update(plants)
        .set({ photoUri: inserted.uri, updatedAt: new Date() })
        .where(eq(plants.id, inserted.plantId))
        .run();
    }

    return inserted;
  });
}

export function deletePlantPhoto(db: LeafCueDatabase, photoId: number): void {
  db.delete(plantPhotos).where(eq(plantPhotos.id, photoId)).run();
}
