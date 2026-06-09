import { z } from "zod";

export const careStyleValues = ["ease", "balanced", "growth"] as const;
export type CareStyle = (typeof careStyleValues)[number];
export const careStyleSchema = z.enum(careStyleValues);

export const careStyleOptions: ReadonlyArray<{
  value: CareStyle;
  label: string;
  description: string;
}> = [
  {
    value: "ease",
    label: "Ease",
    description: "Fewer reminders.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Recommended default.",
  },
  {
    value: "growth",
    label: "Growth",
    description: "More attentive care.",
  },
];

export function applyCareStyleInterval(
  intervalDays: number | null | undefined,
  style: CareStyle,
): number | null {
  if (
    intervalDays === null ||
    intervalDays === undefined ||
    intervalDays <= 0
  ) {
    return null;
  }

  const adjusted =
    style === "ease"
      ? Math.ceil(intervalDays * 1.25)
      : style === "growth"
        ? Math.floor(intervalDays * 0.85)
        : intervalDays;

  return Math.max(1, Math.min(365, adjusted));
}

export function careStyleSummary(style: CareStyle): string {
  const option = careStyleOptions.find((entry) => entry.value === style);
  return option?.description ?? "Recommended default.";
}
