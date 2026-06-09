import type {
  CareLog,
  Plant,
  PlantPhoto,
  PlantTaskSchedule,
} from "@/lib/db/types";

export type PlantSetupAction =
  | "edit"
  | "photo"
  | "location"
  | "care-profile"
  | "pot"
  | "schedules"
  | "journal";

export type PlantSetupMissingItem = {
  key: PlantSetupAction;
  label: string;
};

export type PlantSetupProgress = {
  completed: number;
  total: number;
  percent: number;
  missingItems: PlantSetupMissingItem[];
  isComplete: boolean;
};

type SetupProgressInput = {
  plant: Plant;
  schedules: ReadonlyArray<PlantTaskSchedule>;
  photos: ReadonlyArray<PlantPhoto>;
  logs: ReadonlyArray<CareLog>;
};

function hasText(value: string | null): boolean {
  return value !== null && value.trim().length > 0;
}

export function getPlantSetupProgress({
  plant,
  schedules,
  photos,
  logs,
}: SetupProgressInput): PlantSetupProgress {
  const checks: ReadonlyArray<{
    complete: boolean;
    missing: PlantSetupMissingItem;
  }> = [
    {
      complete:
        hasText(plant.commonName) ||
        hasText(plant.scientificName) ||
        plant.speciesPresetId !== null,
      missing: { key: "edit", label: "Add species or preset" },
    },
    {
      complete: hasText(plant.photoUri) || photos.length > 0,
      missing: { key: "photo", label: "Add a photo" },
    },
    {
      complete: plant.roomId !== null || plant.shelfId !== null,
      missing: { key: "location", label: "Choose a room or shelf" },
    },
    {
      complete:
        plant.lightPreference !== null && plant.wateringPreference !== null,
      missing: {
        key: "care-profile",
        label: "Add light and water preferences",
      },
    },
    {
      complete:
        hasText(plant.potType) ||
        hasText(plant.potSize) ||
        plant.hasDrainage !== null,
      missing: { key: "pot", label: "Confirm pot and drainage" },
    },
    {
      complete: schedules.some((schedule) => schedule.isEnabled),
      missing: { key: "schedules", label: "Enable a care schedule" },
    },
    {
      complete:
        logs.length > 0 || photos.some((photo) => photo.type !== "cover"),
      missing: { key: "journal", label: "Log first care or note" },
    },
  ];

  const completed = checks.filter((check) => check.complete).length;
  const total = checks.length;
  const missingItems = checks
    .filter((check) => !check.complete)
    .map((check) => check.missing);

  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    missingItems,
    isComplete: completed === total,
  };
}
