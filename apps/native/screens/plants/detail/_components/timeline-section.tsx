import { useMemo } from "react";
import { Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";
import { formatDayHeader } from "@/lib/dates";
import type { PlantTimelineItem } from "@/lib/db/repositories";
import {
  type TimelineFilter,
  TimelineFilterRow,
} from "@/screens/plants/detail/_components/timeline-filter";
import { TimelineItemView } from "@/screens/plants/detail/_components/timeline-item";

type TimelineSectionProps = {
  items: ReadonlyArray<PlantTimelineItem>;
  filter: TimelineFilter;
  onFilterChange: (filter: TimelineFilter) => void;
};

export function TimelineSection({
  items,
  filter,
  onFilterChange,
}: TimelineSectionProps) {
  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.kind === filter);
  }, [items, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, PlantTimelineItem[]>();
    const now = new Date();
    for (const item of filtered) {
      const key = formatDayHeader(item.at, now);
      const list = map.get(key);
      if (list) {
        list.push(item);
      } else {
        map.set(key, [item]);
      }
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <View className="gap-3">
      <SectionHeader
        title="Timeline"
        caption="Care, photos, notes, growth, health"
      />
      <TimelineFilterRow value={filter} onChange={onFilterChange} />
      {filtered.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Nothing here yet"
          description={
            filter === "all"
              ? "Log care, snap a photo, or jot a note to start your plant's story."
              : "No matching events for this filter yet."
          }
        />
      ) : (
        <View className="gap-4">
          {grouped.map(([day, dayItems]) => (
            <View key={`day-${day}`} className="gap-2">
              <Text className="font-medium text-muted text-xs uppercase tracking-wide">
                {day}
              </Text>
              <View className="gap-2">
                {dayItems.map((item) => (
                  <TimelineItemView
                    key={`${item.kind}-${item.data.id}`}
                    item={item}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
