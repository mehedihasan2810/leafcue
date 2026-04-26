import type { CareTaskTemplateInsertInput } from "@/lib/db/zod";

export const builtInCareTaskTemplates: ReadonlyArray<CareTaskTemplateInsertInput> =
  [
    {
      key: "water",
      name: "Water",
      icon: "water-outline",
      defaultIntervalDays: 7,
      defaultInstructions:
        "Water until you see drainage. Let the top inch of soil dry between sessions for most houseplants.",
      colorKey: "blue",
      isBuiltIn: true,
    },
    {
      key: "fertilize",
      name: "Fertilize",
      icon: "flask-outline",
      defaultIntervalDays: 30,
      defaultInstructions:
        "Use a balanced houseplant fertilizer at half strength during the growing season.",
      colorKey: "green",
      isBuiltIn: true,
    },
    {
      key: "mist",
      name: "Mist",
      icon: "cloud-outline",
      defaultIntervalDays: 3,
      defaultInstructions:
        "Spray a fine mist around tropical plants to keep humidity comfortable.",
      colorKey: "cyan",
      isBuiltIn: true,
    },
    {
      key: "prune",
      name: "Prune",
      icon: "cut-outline",
      defaultIntervalDays: 60,
      defaultInstructions:
        "Trim dead, yellow, or leggy growth. Use clean shears to encourage healthy shape.",
      colorKey: "amber",
      isBuiltIn: true,
    },
    {
      key: "repot",
      name: "Repot",
      icon: "refresh-outline",
      defaultIntervalDays: 365,
      defaultInstructions:
        "Move up one pot size, refresh soil, and inspect roots for compaction.",
      colorKey: "brown",
      isBuiltIn: true,
    },
    {
      key: "rotate",
      name: "Rotate",
      icon: "sync-outline",
      defaultIntervalDays: 14,
      defaultInstructions:
        "Turn the plant a quarter so all sides get balanced light.",
      colorKey: "violet",
      isBuiltIn: true,
    },
    {
      key: "clean_leaves",
      name: "Clean Leaves",
      icon: "sparkles-outline",
      defaultIntervalDays: 30,
      defaultInstructions:
        "Wipe leaves with a damp microfiber cloth so dust doesn't block light.",
      colorKey: "teal",
      isBuiltIn: true,
    },
    {
      key: "inspect_pests",
      name: "Inspect for Pests",
      icon: "search-outline",
      defaultIntervalDays: 14,
      defaultInstructions:
        "Look under leaves and along stems for spider mites, mealybugs, fungus gnats, or scale.",
      colorKey: "yellow",
      isBuiltIn: true,
    },
    {
      key: "treat_pests",
      name: "Treat Pests",
      icon: "bug-outline",
      defaultIntervalDays: 7,
      defaultInstructions:
        "Apply your chosen treatment (neem, insecticidal soap, etc.) and isolate if needed.",
      colorKey: "red",
      isBuiltIn: true,
    },
    {
      key: "quarantine",
      name: "Quarantine",
      icon: "shield-half-outline",
      defaultIntervalDays: 14,
      defaultInstructions:
        "Keep this plant separated from the rest until it is healthy.",
      colorKey: "rose",
      isBuiltIn: true,
    },
    {
      key: "measure_growth",
      name: "Measure Growth",
      icon: "resize-outline",
      defaultIntervalDays: 30,
      defaultInstructions:
        "Record height, leaf count, or new growth so you can see progress.",
      colorKey: "emerald",
      isBuiltIn: true,
    },
    {
      key: "photo_update",
      name: "Photo Update",
      icon: "camera-outline",
      defaultIntervalDays: 14,
      defaultInstructions:
        "Snap a fresh cover photo to track how your plant changes over time.",
      colorKey: "indigo",
      isBuiltIn: true,
    },
    {
      key: "custom_note",
      name: "Custom Note",
      icon: "pencil-outline",
      defaultIntervalDays: null,
      defaultInstructions:
        "A free-form reminder for anything that doesn't fit the other care types.",
      colorKey: "slate",
      isBuiltIn: true,
    },
  ];
