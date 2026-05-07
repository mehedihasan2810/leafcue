import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Button, Chip, PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { getHealthHints, getHealthIssueLabel } from "@/lib/care/health-hints";
import type { HealthObservation } from "@/lib/db/types";

type ObservationCardProps = {
  observation: HealthObservation;
  onPressEdit: () => void;
  onPressMarkImproving?: () => void;
  onPressMarkResolved?: () => void;
};

const STATUS_TONE: Record<
  HealthObservation["status"],
  "danger" | "warning" | "success"
> = {
  active: "danger",
  improving: "warning",
  resolved: "success",
};

const SEVERITY_LABEL: Record<HealthObservation["severity"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function ObservationCard({
  observation,
  onPressEdit,
  onPressMarkImproving,
  onPressMarkResolved,
}: ObservationCardProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  const hints = getHealthHints(observation.issueType, observation.severity);
  const issueLabel = getHealthIssueLabel(observation.issueType);

  return (
    <View className="gap-3 rounded-2xl border border-border/30 bg-surface p-4">
      <PressableFeedback onPress={onPressEdit} className="gap-2">
        <View className="flex-row items-center gap-2">
          <View className="size-9 items-center justify-center rounded-xl bg-accent-soft">
            <Ionicons name="medkit-outline" size={16} color={accent} />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-foreground" numberOfLines={1}>
              {issueLabel}
            </Text>
            <Text className="text-muted text-xs">
              {format(observation.observedAt, "PPP")}
            </Text>
          </View>
          <Chip
            variant="soft"
            size="sm"
            color={STATUS_TONE[observation.status]}
          >
            <Chip.Label>{observation.status}</Chip.Label>
          </Chip>
        </View>
        <View className="flex-row items-center gap-2">
          <Chip variant="secondary" size="sm" color="default">
            <Chip.Label>
              {SEVERITY_LABEL[observation.severity]} severity
            </Chip.Label>
          </Chip>
        </View>
        {observation.notes ? (
          <Text className="text-foreground text-sm leading-5">
            {observation.notes}
          </Text>
        ) : null}
      </PressableFeedback>

      {hints.length > 0 ? (
        <View className="gap-1.5 rounded-xl bg-accent-soft/40 p-3">
          {hints.slice(0, 3).map((hint) => (
            <View key={`hint-${hint}`} className="flex-row items-start gap-2">
              <Ionicons name="bulb-outline" size={12} color={muted} />
              <Text className="flex-1 text-foreground text-xs leading-4">
                {hint}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {observation.status !== "resolved" ? (
        <View className="flex-row gap-2">
          {observation.status === "active" && onPressMarkImproving ? (
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onPress={onPressMarkImproving}
            >
              <Button.Label>Mark improving</Button.Label>
            </Button>
          ) : null}
          {onPressMarkResolved ? (
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onPress={onPressMarkResolved}
            >
              <Button.Label>Mark resolved</Button.Label>
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
