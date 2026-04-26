import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";

import { SectionHeader } from "@/components/section-header";
import { getHealthIssueLabel } from "@/lib/care/health-hints";
import type { HealthObservation } from "@/lib/db/types";

type HealthBannerProps = {
  observations: ReadonlyArray<HealthObservation>;
  onPress: () => void;
};

export function HealthBanner({ observations, onPress }: HealthBannerProps) {
  const danger = useThemeColor("danger");
  const muted = useThemeColor("muted");
  const success = useThemeColor("success");
  const accent = useThemeColor("accent");

  const active = observations.filter((obs) => obs.status === "active");
  const improving = observations.filter((obs) => obs.status === "improving");

  const hasActive = active.length > 0;
  const hasImproving = improving.length > 0;

  return (
    <View className="gap-3">
      <SectionHeader
        title="Health"
        count={observations.length}
        actionLabel={observations.length > 0 ? "Open" : "Log"}
        onPressAction={onPress}
      />
      {hasActive ? (
        <Pressable
          onPress={onPress}
          className="gap-2 rounded-2xl border border-danger/40 bg-danger-soft/40 p-4"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle-outline" size={16} color={danger} />
            <Text
              className="flex-1 font-semibold text-foreground"
              numberOfLines={1}
            >
              {active.length} active issue{active.length === 1 ? "" : "s"}
            </Text>
          </View>
          {active.slice(0, 2).map((obs) => (
            <Text
              key={`active-${obs.id}`}
              className="text-foreground text-xs"
              numberOfLines={2}
            >
              {getHealthIssueLabel(obs.issueType)} ·{" "}
              {format(obs.observedAt, "MMM d")}
              {obs.notes ? ` · ${obs.notes}` : ""}
            </Text>
          ))}
        </Pressable>
      ) : hasImproving ? (
        <Pressable
          onPress={onPress}
          className="flex-row items-center gap-3 rounded-2xl border border-warning/40 bg-warning-soft/40 p-4"
        >
          <Ionicons name="medkit-outline" size={16} color={accent} />
          <Text className="flex-1 text-foreground text-sm">
            {improving.length} issue{improving.length === 1 ? "" : "s"}{" "}
            improving
          </Text>
          <Ionicons name="chevron-forward" size={16} color={muted} />
        </Pressable>
      ) : (
        <Pressable
          onPress={onPress}
          className="flex-row items-center gap-3 rounded-2xl border border-border/40 bg-surface p-4"
        >
          <Ionicons name="leaf-outline" size={16} color={success} />
          <Text className="flex-1 text-foreground text-sm">
            No active health concerns. Log an observation if anything looks off.
          </Text>
          <Ionicons name="chevron-forward" size={16} color={muted} />
        </Pressable>
      )}
    </View>
  );
}
