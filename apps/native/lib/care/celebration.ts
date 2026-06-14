import type { CareTaskTemplateKey } from "@/lib/db/schema";

/**
 * Warm, editorial completion microcopy. Deterministic by seed (no randomness)
 * so the same completion always reads the same, with a streak nudge appended
 * once the user is on a roll.
 */
const WATER_MESSAGES = [
  "Thanks for the water — {name} looks happier already.",
  "{name} is hydrated and happy.",
  "Nice pour. {name} thanks you.",
];

const FERTILIZE_MESSAGES = [
  "{name} is well-fed and growing.",
  "Fed and flourishing — lovely work.",
];

const GENERIC_MESSAGES = [
  "Done — {name} is all set.",
  "{name} is feeling cared for.",
  "All caught up with {name}.",
];

function pool(templateKey: CareTaskTemplateKey | null): ReadonlyArray<string> {
  if (templateKey === "water") return WATER_MESSAGES;
  if (templateKey === "fertilize") return FERTILIZE_MESSAGES;
  return GENERIC_MESSAGES;
}

export function pickCompletionMessage(
  templateKey: CareTaskTemplateKey | null,
  nickname: string,
  streakDays: number,
): string {
  const messages = pool(templateKey);
  const seed = nickname.length + Math.max(0, streakDays);
  const base = (
    messages[seed % messages.length] ??
    messages[0] ??
    "Done."
  ).replace("{name}", nickname || "your plant");

  if (streakDays >= 2) {
    return `${base} · ${streakDays}-day care streak`;
  }
  return base;
}
