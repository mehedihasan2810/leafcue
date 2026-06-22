import type { Ionicons } from "@expo/vector-icons";
import { startOfDay } from "date-fns";

export type PlantMood = "thriving" | "thirsty" | "needs_attention" | "new";

export type PlantMoodTone = "neutral" | "accent" | "success" | "warning";

export type PlantMoodInfo = {
  mood: PlantMood;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: PlantMoodTone;
};

/**
 * Derive a subtle, on-device "mood" for a plant from its care state. Editorial,
 * not a mascot — a single status chip. Health issues outrank thirst; an overdue
 * or due-today task reads as thirsty; a future task reads as thriving.
 */
export function getPlantMood(input: {
  nextDueAt?: Date | null;
  hasActiveIssues?: boolean;
  now?: Date;
}): PlantMoodInfo {
  const now = input.now ?? new Date();

  if (input.hasActiveIssues) {
    return {
      mood: "needs_attention",
      label: "Needs care",
      icon: "medkit-outline",
      tone: "warning",
    };
  }

  const due = input.nextDueAt ?? null;
  if (due && startOfDay(due).getTime() <= startOfDay(now).getTime()) {
    return {
      mood: "thirsty",
      label: "Thirsty",
      icon: "water-outline",
      tone: "accent",
    };
  }

  if (due) {
    return {
      mood: "thriving",
      label: "Thriving",
      icon: "leaf-outline",
      tone: "success",
    };
  }

  return {
    mood: "new",
    label: "New",
    icon: "sparkles-outline",
    tone: "neutral",
  };
}
