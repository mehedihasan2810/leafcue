import type { HealthIssueType, HealthSeverity } from "@/lib/db/schema";

const ISSUE_HINTS: Record<HealthIssueType, string[]> = {
  yellow_leaves: [
    "Yellowing can come from overwatering, low light, or natural leaf turnover.",
    "Check the soil — let it dry between watering if it stays wet for days.",
    "Move the plant somewhere brighter if it's been in deep shade lately.",
  ],
  brown_tips: [
    "Brown tips often signal dry air, fluoride in tap water, or under-watering.",
    "Try filtered or rainwater, and group plants together to raise humidity.",
    "Trim crisp tips with clean shears so they don't keep spreading visually.",
  ],
  pests: [
    "Consider isolating this plant if pests are suspected.",
    "Wipe leaves with a soft, damp cloth and inspect the undersides closely.",
    "A gentle insecticidal soap or neem oil rinse helps for soft-bodied pests.",
  ],
  root_rot: [
    "Check drainage and pause watering until topsoil dries.",
    "If roots smell sour or look mushy, repot into fresh, airy mix.",
    "Trim away black or slimy roots with clean shears before repotting.",
  ],
  wilting: [
    "Wilting can be from too little water, too much water, or sudden cold.",
    "Lift the pot — if it feels light, water deeply and let it drain.",
    "If soil is soaked, hold off and let it dry before the next drink.",
  ],
  leaf_drop: [
    "Sudden leaf drop often follows changes in light, temperature, or watering.",
    "Keep care steady for a couple of weeks before changing more variables.",
    "Check for cold drafts, heater vents, or recent moves between rooms.",
  ],
  mold: [
    "White fuzz on soil is usually harmless surface mold; let the top dry out.",
    "Improve airflow and avoid splashing water on leaves when watering.",
    "If mold returns, top-dress with fresh soil or repot into a drier mix.",
  ],
  other: [
    "Take a clear photo and note what's changed recently — light, water, or location.",
    "Watch for new patterns over a few days before adjusting care.",
  ],
};

const SEVERITY_PREFIX: Record<HealthSeverity, string | null> = {
  low: null,
  medium: "Worth keeping an eye on this for a few days.",
  high: "This looks serious — consider quarantining and acting quickly.",
};

function isKnownIssueType(value: string): value is HealthIssueType {
  return value in ISSUE_HINTS;
}

export function getHealthHints(
  issueType: string,
  severity: HealthSeverity,
): string[] {
  const key: HealthIssueType = isKnownIssueType(issueType)
    ? issueType
    : "other";
  const hints = [...ISSUE_HINTS[key]];
  const prefix = SEVERITY_PREFIX[severity];
  return prefix ? [prefix, ...hints] : hints;
}

export const HEALTH_ISSUE_LABELS: Record<HealthIssueType, string> = {
  yellow_leaves: "Yellow leaves",
  brown_tips: "Brown tips",
  pests: "Pests",
  root_rot: "Root rot",
  wilting: "Wilting",
  leaf_drop: "Leaf drop",
  mold: "Mold",
  other: "Other",
};

export function getHealthIssueLabel(issueType: string): string {
  if (isKnownIssueType(issueType)) {
    return HEALTH_ISSUE_LABELS[issueType];
  }
  return issueType;
}
