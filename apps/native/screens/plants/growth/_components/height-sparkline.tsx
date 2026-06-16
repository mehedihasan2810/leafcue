import { useThemeColor } from "heroui-native";
import { useMemo } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";

import type { GrowthMeasurement } from "@/lib/db/types";

type HeightSparklineProps = {
  measurements: ReadonlyArray<GrowthMeasurement>;
  width?: number;
  height?: number;
};

export function HeightSparkline({
  measurements,
  width = 280,
  height = 80,
}: HeightSparklineProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  const points = useMemo(() => {
    const filtered = [...measurements]
      .filter(
        (m): m is GrowthMeasurement & { heightCm: number } =>
          m.heightCm !== null,
      )
      .sort((a, b) => {
        const timeDiff = a.measuredAt.getTime() - b.measuredAt.getTime();
        return timeDiff !== 0 ? timeDiff : a.id - b.id;
      })
      .slice(-8);
    return filtered;
  }, [measurements]);

  if (points.length < 2) {
    return (
      <View
        className="items-center justify-center rounded-2xl border border-border/30 bg-surface p-4"
        style={{ height }}
      >
        <Text className="text-muted text-xs">
          Log at least two heights to see a trend line.
        </Text>
      </View>
    );
  }

  const heights = points.map((p) => p.heightCm);
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const span = maxH - minH || 1;
  const padX = 12;
  const padY = 8;
  const usableWidth = width - padX * 2;
  const usableHeight = height - padY * 2;

  const xy = points.map((p, idx) => {
    const x = padX + (idx / (points.length - 1)) * usableWidth;
    const y = padY + (1 - (p.heightCm - minH) / span) * usableHeight;
    return { x, y, id: p.id };
  });

  const polyline = xy.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View className="gap-2 rounded-2xl border border-border/30 bg-surface p-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-medium text-foreground text-sm">
          Height trend
        </Text>
        <Text className="text-muted text-xs">
          {minH.toFixed(1)} → {maxH.toFixed(1)} cm
        </Text>
      </View>
      <Svg width={width} height={height}>
        <Polyline
          points={polyline}
          fill="none"
          stroke={accent}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {xy.map((p, idx) => (
          <Circle
            key={`pt-${p.id}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={idx === xy.length - 1 ? accent : muted}
          />
        ))}
      </Svg>
    </View>
  );
}
