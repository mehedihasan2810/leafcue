import { formatIsoDate, parseIsoDate } from "@/lib/dates";
import type {
  CareDifficulty,
  LightPreference,
  Toxicity,
  WateringPreference,
} from "@/lib/db/schema";
import type { Plant, PlantPreset } from "@/lib/db/types";
import { type PlantInsertInput, plantInsertSchema } from "@/lib/db/zod";

export type PlantIntakeFormValues = {
  nickname: string;
  commonName: string;
  scientificName: string;
  speciesPresetId: number | null;
  photoUri: string | null;
  roomId: number | null;
  shelfId: number | null;
  acquiredAtIso: string;
  careDifficulty: CareDifficulty | null;
  toxicity: Toxicity | null;
  lightPreference: LightPreference | null;
  wateringPreference: WateringPreference | null;
  potType: string;
  potSize: string;
  hasDrainage: boolean;
  soilType: string;
  isFavorite: boolean;
  notes: string;
};

const careDifficultyKeywords: ReadonlyArray<{
  pattern: RegExp;
  value: CareDifficulty;
}> = [
  { pattern: /\b(easy|beginner|low\s*maintenance)\b/i, value: "easy" },
  { pattern: /\b(moderate|medium|intermediate)\b/i, value: "moderate" },
  { pattern: /\b(hard|advanced|fussy|tricky)\b/i, value: "hard" },
];

function inferDifficulty(value: string | null): CareDifficulty | null {
  if (!value) return null;
  for (const entry of careDifficultyKeywords) {
    if (entry.pattern.test(value)) return entry.value;
  }
  return null;
}

const lightKeywords: ReadonlyArray<{
  pattern: RegExp;
  value: LightPreference;
}> = [
  { pattern: /\bdirect\s*sun\b/i, value: "direct-sun" },
  { pattern: /\bbright\s*indirect\b/i, value: "bright-indirect" },
  { pattern: /\b(medium|moderate)\s*light\b/i, value: "medium" },
  { pattern: /\blow\s*light\b/i, value: "low" },
];

function inferLight(value: string | null): LightPreference | null {
  if (!value) return null;
  for (const entry of lightKeywords) {
    if (entry.pattern.test(value)) return entry.value;
  }
  return null;
}

const wateringKeywords: ReadonlyArray<{
  pattern: RegExp;
  value: WateringPreference;
}> = [
  {
    pattern: /\b(let\s*dry|allow\s*to\s*dry|dry\s*out\s*between)\b/i,
    value: "let-dry-between",
  },
  { pattern: /\b(keep\s*moist|consistently\s*moist)\b/i, value: "keep-moist" },
  { pattern: /\b(heavy|frequent|high\s*water)\b/i, value: "high" },
  { pattern: /\b(low\s*water|drought|infrequent)\b/i, value: "low" },
  { pattern: /\b(moderate|regular)\b/i, value: "moderate" },
];

function inferWatering(value: string | null): WateringPreference | null {
  if (!value) return null;
  for (const entry of wateringKeywords) {
    if (entry.pattern.test(value)) return entry.value;
  }
  return null;
}

export function applyPlantPresetHints(
  current: PlantIntakeFormValues,
  preset: PlantPreset,
): PlantIntakeFormValues {
  const next: PlantIntakeFormValues = { ...current };
  if (!next.commonName.trim()) next.commonName = preset.commonName;
  if (!next.scientificName.trim() && preset.scientificName) {
    next.scientificName = preset.scientificName;
  }
  if (!next.careDifficulty && preset.careDifficulty) {
    next.careDifficulty = preset.careDifficulty;
  } else if (!next.careDifficulty) {
    const inferred = inferDifficulty(preset.careSummary ?? null);
    if (inferred) next.careDifficulty = inferred;
  }
  if (!next.toxicity && preset.petToxicity) {
    next.toxicity = preset.petToxicity;
  }
  if (!next.lightPreference) {
    const inferred = inferLight(preset.light ?? null);
    if (inferred) next.lightPreference = inferred;
  }
  if (!next.wateringPreference) {
    const inferred = inferWatering(preset.water ?? null);
    if (inferred) next.wateringPreference = inferred;
  }
  if (!next.soilType.trim() && preset.soil) {
    next.soilType = preset.soil;
  }
  return next;
}

export function buildPlantIntakeValues(plant?: Plant): PlantIntakeFormValues {
  if (plant) {
    return {
      nickname: plant.nickname,
      commonName: plant.commonName ?? "",
      scientificName: plant.scientificName ?? "",
      speciesPresetId: plant.speciesPresetId ?? null,
      photoUri: plant.photoUri ?? null,
      roomId: plant.roomId ?? null,
      shelfId: plant.shelfId ?? null,
      acquiredAtIso: formatIsoDate(plant.acquiredAt ?? null),
      careDifficulty: plant.careDifficulty ?? null,
      toxicity: plant.toxicity ?? null,
      lightPreference: plant.lightPreference ?? null,
      wateringPreference: plant.wateringPreference ?? null,
      potType: plant.potType ?? "",
      potSize: plant.potSize ?? "",
      hasDrainage: plant.hasDrainage ?? true,
      soilType: plant.soilType ?? "",
      isFavorite: plant.isFavorite,
      notes: plant.notes ?? "",
    };
  }

  return {
    nickname: "",
    commonName: "",
    scientificName: "",
    speciesPresetId: null,
    photoUri: null,
    roomId: null,
    shelfId: null,
    acquiredAtIso: "",
    careDifficulty: null,
    toxicity: null,
    lightPreference: null,
    wateringPreference: null,
    potType: "",
    potSize: "",
    hasDrainage: true,
    soilType: "",
    isFavorite: false,
    notes: "",
  };
}

function nullableTrim(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildPlantIntakeInput(
  values: PlantIntakeFormValues,
): PlantInsertInput {
  const acquiredAt =
    values.acquiredAtIso.trim().length > 0
      ? parseIsoDate(values.acquiredAtIso)
      : null;

  return plantInsertSchema.parse({
    nickname: values.nickname.trim(),
    commonName: nullableTrim(values.commonName),
    scientificName: nullableTrim(values.scientificName),
    speciesPresetId: values.speciesPresetId,
    photoUri: values.photoUri,
    roomId: values.roomId,
    shelfId: values.shelfId,
    notes: nullableTrim(values.notes),
    acquiredAt,
    careDifficulty: values.careDifficulty,
    toxicity: values.toxicity,
    lightPreference: values.lightPreference,
    wateringPreference: values.wateringPreference,
    soilType: nullableTrim(values.soilType),
    potType: nullableTrim(values.potType),
    potSize: nullableTrim(values.potSize),
    hasDrainage: values.hasDrainage,
    isFavorite: values.isFavorite,
  });
}
