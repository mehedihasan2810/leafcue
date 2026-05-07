import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Image } from "expo-image";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { getCareTaskIcon } from "@/components/care-task-icons";
import { getHealthIssueLabel } from "@/lib/care/health-hints";
import type { PlantTimelineItem } from "@/lib/db/repositories";

type TimelineItemViewProps = {
  item: PlantTimelineItem;
};

export function TimelineItemView({ item }: TimelineItemViewProps) {
  const accent = useThemeColor("accent");
  const success = useThemeColor("success");
  const danger = useThemeColor("danger");
  const warning = useThemeColor("warning");
  const muted = useThemeColor("muted");

  const time = format(item.at, "p");

  switch (item.kind) {
    case "care_log": {
      const log = item.data;
      const iconName = getCareTaskIcon(log.type);
      return (
        <Row
          icon={
            <View className="size-9 items-center justify-center rounded-xl bg-success-soft">
              <Ionicons name={iconName} size={16} color={success} />
            </View>
          }
          title={log.title ?? log.type}
          subtitle={
            log.notes ??
            (log.amount && log.unit ? `${log.amount} ${log.unit}` : null)
          }
          time={time}
        />
      );
    }
    case "journal_entry": {
      const entry = item.data;
      return (
        <Row
          icon={
            <View className="size-9 items-center justify-center rounded-xl bg-accent-soft">
              <Ionicons name="create-outline" size={16} color={accent} />
            </View>
          }
          title={entry.title ?? "Journal entry"}
          subtitle={entry.body}
          photoUri={entry.photoUri}
          time={time}
        />
      );
    }
    case "photo": {
      const photo = item.data;
      return (
        <Row
          icon={
            <View className="size-9 items-center justify-center rounded-xl bg-accent-soft">
              <Ionicons name="camera-outline" size={16} color={accent} />
            </View>
          }
          title={photo.caption ?? "Photo"}
          subtitle={photo.type}
          photoUri={photo.uri}
          time={time}
        />
      );
    }
    case "growth_measurement": {
      const m = item.data;
      const parts: string[] = [];
      if (m.heightCm !== null) parts.push(`${m.heightCm} cm tall`);
      if (m.leafCount !== null) parts.push(`${m.leafCount} leaves`);
      if (m.bloomCount !== null) parts.push(`${m.bloomCount} blooms`);
      return (
        <Row
          icon={
            <View className="size-9 items-center justify-center rounded-xl bg-accent-soft">
              <Ionicons name="resize-outline" size={16} color={accent} />
            </View>
          }
          title="Measured growth"
          subtitle={parts.join(" · ") || m.notes || "Logged"}
          time={time}
        />
      );
    }
    case "health_observation": {
      const obs = item.data;
      const tone =
        obs.status === "active"
          ? danger
          : obs.status === "improving"
            ? warning
            : success;
      return (
        <Row
          icon={
            <View
              className="size-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${tone}22` }}
            >
              <Ionicons name="medkit-outline" size={16} color={tone} />
            </View>
          }
          title={getHealthIssueLabel(obs.issueType)}
          subtitle={`${obs.severity} · ${obs.status}${obs.notes ? ` · ${obs.notes}` : ""}`}
          time={time}
          accentColor={muted}
        />
      );
    }
  }
}

function Row({
  icon,
  title,
  subtitle,
  time,
  photoUri,
  accentColor,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string | null;
  time: string;
  photoUri?: string | null;
  accentColor?: string;
}) {
  void accentColor;
  return (
    <View className="flex-row gap-3 rounded-2xl border border-border/30 bg-surface p-3">
      {icon}
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className="flex-1 font-medium text-foreground text-sm"
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text className="text-muted text-xs">{time}</Text>
        </View>
        {subtitle ? (
          <Text className="text-muted text-xs" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {photoUri ? (
          <View className="mt-1 h-40 w-full overflow-hidden rounded-xl bg-muted/15">
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={150}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
