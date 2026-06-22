import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import {
  Button,
  cn,
  PressableFeedback,
  SearchField,
  useThemeColor,
} from "heroui-native";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { PlantCard } from "@/components/plant-card";
import { SettingsButton } from "@/components/settings-button";
import { usePlantLimitGate } from "@/hooks/use-plant-limit-gate";
import { isOverdue } from "@/lib/dates";
import { useDatabase } from "@/lib/db";
import {
  getDueTasks,
  getPlants,
  getRooms,
  getUpcomingTasks,
} from "@/lib/db/repositories";
import {
  plants as plantsTable,
  plantTaskSchedules,
  rooms as roomsTable,
} from "@/lib/db/schema";
import type { Plant, Room } from "@/lib/db/types";

type FilterId = "all" | "favorites" | "today" | "overdue" | "due-soon" | "room";

type ViewMode = "grid" | "list";
type SortId = "next-due" | "name" | "recent" | "room";

export function PlantLibraryScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const accentForeground = useThemeColor("accent-foreground");
  const muted = useThemeColor("muted");
  const db = useDatabase();
  const { requestActivePlantSlot } = usePlantLimitGate();
  const handleAddPlant = () => {
    void requestActivePlantSlot({
      onAllow: () => router.push("/plants/new"),
    });
  };
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [roomFilter, setRoomFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<SortId>("next-due");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showArchived, setShowArchived] = useState(false);

  const deferredSearch = useDeferredValue(search);

  const livePlants = useLiveQuery(db.select().from(plantsTable));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveRooms = useLiveQuery(db.select().from(roomsTable));

  const filteredPlants = useMemo(() => {
    void livePlants.data;
    return getPlants(db, {
      includeArchived: showArchived,
      search: deferredSearch,
      favoritesOnly: filter === "favorites" ? true : undefined,
      roomId: filter === "room" && roomFilter !== null ? roomFilter : undefined,
    });
  }, [db, deferredSearch, filter, roomFilter, showArchived, livePlants.data]);

  const dueRows = useMemo(() => {
    void liveSchedules.data;
    return getDueTasks(db);
  }, [db, liveSchedules.data]);

  const dueSoonRows = useMemo(() => {
    void liveSchedules.data;
    return getUpcomingTasks(db, 7);
  }, [db, liveSchedules.data]);

  const overdueIds = useMemo(() => {
    const ids = new Set<number>();
    const now = new Date();
    for (const row of dueRows) {
      if (isOverdue(row.schedule.nextDueAt, now)) {
        ids.add(row.plant.id);
      }
    }
    return ids;
  }, [dueRows]);

  const todayDueIds = useMemo(() => {
    const ids = new Set<number>();
    const now = new Date();
    for (const row of dueRows) {
      if (!isOverdue(row.schedule.nextDueAt, now)) {
        ids.add(row.plant.id);
      }
    }
    return ids;
  }, [dueRows]);

  const dueSoonIds = useMemo(() => {
    const ids = new Set<number>();
    for (const row of dueSoonRows) ids.add(row.plant.id);
    return ids;
  }, [dueSoonRows]);

  const visiblePlants = useMemo(() => {
    if (filter === "today") {
      return filteredPlants.filter((plant) => todayDueIds.has(plant.id));
    }
    if (filter === "overdue") {
      return filteredPlants.filter((plant) => overdueIds.has(plant.id));
    }
    if (filter === "due-soon") {
      return filteredPlants.filter((plant) => dueSoonIds.has(plant.id));
    }
    return filteredPlants;
  }, [filteredPlants, filter, todayDueIds, overdueIds, dueSoonIds]);

  const rooms = useMemo(() => {
    void liveRooms.data;
    return getRooms(db);
  }, [db, liveRooms.data]);

  const roomById = useMemo(() => {
    const map = new Map<number, Room>();
    for (const room of rooms) map.set(room.id, room);
    return map;
  }, [rooms]);

  const nextDueByPlant = useMemo(() => {
    void liveSchedules.data;
    const map = new Map<number, Date | null>();
    for (const schedule of liveSchedules.data) {
      if (!schedule.isEnabled || !schedule.nextDueAt) continue;
      const current = map.get(schedule.plantId) ?? null;
      if (!current || schedule.nextDueAt < current) {
        map.set(schedule.plantId, schedule.nextDueAt);
      }
    }
    for (const plant of visiblePlants) {
      if (!map.has(plant.id)) map.set(plant.id, null);
    }
    return map;
  }, [visiblePlants, liveSchedules.data]);

  const sortedPlants = useMemo(() => {
    return [...visiblePlants].sort((left, right) => {
      if (sort === "name") {
        return left.nickname.localeCompare(right.nickname);
      }
      if (sort === "recent") {
        return right.createdAt.getTime() - left.createdAt.getTime();
      }
      if (sort === "room") {
        const leftRoom = left.roomId ? roomById.get(left.roomId)?.name : "";
        const rightRoom = right.roomId ? roomById.get(right.roomId)?.name : "";
        const roomCompare = (leftRoom ?? "").localeCompare(rightRoom ?? "");
        return roomCompare !== 0
          ? roomCompare
          : left.nickname.localeCompare(right.nickname);
      }
      const leftDue =
        nextDueByPlant.get(left.id)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightDue =
        nextDueByPlant.get(right.id)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (leftDue !== rightDue) return leftDue - rightDue;
      return left.nickname.localeCompare(right.nickname);
    });
  }, [visiblePlants, sort, roomById, nextDueByPlant]);

  const totalActive = livePlants.data.filter(
    (plant) => !plant.archivedAt,
  ).length;

  const handleFilterPress = (id: FilterId) => {
    if (id === "room") {
      setFilter("room");
      if (rooms.length > 0 && roomFilter === null) {
        setRoomFilter(rooms[0]?.id ?? null);
      }
    } else {
      setFilter(id);
      setRoomFilter(null);
    }
  };

  const handleOpenPlant = (plant: Plant) => {
    router.push({
      pathname: "/plants/[plantId]",
      params: { plantId: String(plant.id) },
    });
  };

  if (totalActive === 0 && !showArchived) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top + 4, paddingHorizontal: 16 }}
      >
        <EmptyState
          icon="leaf-outline"
          title="Your library is empty"
          description="Add your first plant — every entry stays on this device."
          ctaLabel="Add a plant"
          onPressCta={handleAddPlant}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        key={viewMode}
        data={sortedPlants}
        keyExtractor={(plant) => `plant-${plant.id}`}
        numColumns={viewMode === "grid" ? 2 : 1}
        columnWrapperStyle={
          viewMode === "grid" ? { gap: 12, paddingHorizontal: 24 } : undefined
        }
        contentContainerStyle={{
          paddingTop: insets.top + 4,
          paddingBottom: insets.bottom + 96,
          gap: 12,
        }}
        renderItem={({ item }) =>
          viewMode === "grid" ? (
            <View className="flex-1">
              <PlantCard
                plant={item}
                roomName={
                  item.roomId ? roomById.get(item.roomId)?.name : undefined
                }
                nextDueAt={nextDueByPlant.get(item.id) ?? null}
                isOverdue={overdueIds.has(item.id)}
                onPress={handleOpenPlant}
              />
            </View>
          ) : (
            <View className="px-4">
              <PlantCard
                plant={item}
                variant="list"
                roomName={
                  item.roomId ? roomById.get(item.roomId)?.name : undefined
                }
                nextDueAt={nextDueByPlant.get(item.id) ?? null}
                isOverdue={overdueIds.has(item.id)}
                onPress={handleOpenPlant}
              />
            </View>
          )
        }
        ListHeaderComponent={
          <View className="gap-3 px-4">
            <View className="flex-row items-start justify-between">
              <View className="gap-1">
                <Text className="font-display text-2xl text-foreground">
                  Your plants
                </Text>
                <Text className="text-muted text-sm">
                  {sortedPlants.length} of {totalActive} showing
                </Text>
              </View>
              <SettingsButton />
            </View>

            <SearchField value={search} onChange={setSearch}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by name…" />
                {search ? <SearchField.ClearButton /> : null}
              </SearchField.Group>
            </SearchField>

            <FilterChipRow filter={filter} onPress={handleFilterPress} />

            <SortChipRow sort={sort} onPress={setSort} />

            {filter === "room" ? (
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-muted text-xs uppercase tracking-wide">
                    Filter by room
                  </Text>
                  <PressableFeedback
                    onPress={() => router.push("/rooms")}
                    accessibilityRole="button"
                  >
                    <Text className="font-medium text-accent text-xs">
                      Manage rooms
                    </Text>
                  </PressableFeedback>
                </View>
                {rooms.length === 0 ? (
                  <PressableFeedback onPress={() => router.push("/rooms")}>
                    <Text className="text-accent text-sm">
                      No rooms yet — tap to set up rooms.
                    </Text>
                  </PressableFeedback>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {rooms.map((room) => {
                      const isActive = roomFilter === room.id;
                      return (
                        <PressableFeedback
                          key={`room-filter-${room.id}`}
                          onPress={() => setRoomFilter(room.id)}
                          className={cn(
                            "flex-row items-center gap-1.5 rounded-full border px-3 py-2",
                            isActive
                              ? "border-accent bg-accent-soft"
                              : "border-border/60 bg-surface",
                          )}
                        >
                          <Ionicons
                            name={
                              (room.icon as keyof typeof Ionicons.glyphMap) ??
                              "home-outline"
                            }
                            size={14}
                            color={isActive ? accent : muted}
                          />
                          <Text
                            className={cn(
                              "font-medium text-sm",
                              isActive
                                ? "text-accent-soft-foreground"
                                : "text-foreground",
                            )}
                          >
                            {room.name}
                          </Text>
                        </PressableFeedback>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            <View className="flex-row items-center justify-between">
              <PressableFeedback
                onPress={() => setShowArchived((current) => !current)}
              >
                <Text className="font-medium text-accent text-xs">
                  {showArchived ? "Hide archived" : "Show archived"}
                </Text>
              </PressableFeedback>
              <View className="flex-row items-center gap-2">
                <ViewModePill
                  icon="grid-outline"
                  isActive={viewMode === "grid"}
                  onPress={() => setViewMode("grid")}
                />
                <ViewModePill
                  icon="list-outline"
                  isActive={viewMode === "list"}
                  onPress={() => setViewMode("list")}
                />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="px-4">
            <EmptyState
              icon="search-outline"
              title="No plants match"
              description={
                deferredSearch
                  ? `No plants match "${deferredSearch}". Try a different search or filter.`
                  : "Try a different filter to see more plants."
              }
              ctaLabel="Add a plant"
              onPressCta={handleAddPlant}
            />
          </View>
        }
      />

      <View
        className="absolute right-4"
        style={{ bottom: insets.bottom + 12 }}
        pointerEvents="box-none"
      >
        <Button onPress={handleAddPlant}>
          <Ionicons name="add" size={18} color={accentForeground} />
          <Button.Label>Add plant</Button.Label>
        </Button>
      </View>
    </View>
  );
}

function FilterChipRow({
  filter,
  onPress,
}: {
  filter: FilterId;
  onPress: (id: FilterId) => void;
}) {
  const items: ReadonlyArray<{
    id: FilterId;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { id: "all", label: "All", icon: "leaf-outline" },
    { id: "favorites", label: "Favorites", icon: "star-outline" },
    { id: "today", label: "Due today", icon: "sunny-outline" },
    { id: "overdue", label: "Overdue", icon: "alert-circle-outline" },
    { id: "due-soon", label: "Due soon", icon: "time-outline" },
    { id: "room", label: "By room", icon: "home-outline" },
  ];

  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => `filter-${item.id}`}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      renderItem={({ item }) => {
        const isActive = filter === item.id;
        return (
          <PressableFeedback
            onPress={() => onPress(item.id)}
            className={cn(
              "flex-row items-center gap-1.5 rounded-full border px-3 py-2",
              isActive
                ? "border-accent bg-accent-soft"
                : "border-border/60 bg-surface",
            )}
          >
            <Ionicons
              name={item.icon}
              size={14}
              color={isActive ? accent : muted}
            />
            <Text
              className={cn(
                "font-medium text-sm",
                isActive ? "text-accent-soft-foreground" : "text-foreground",
              )}
            >
              {item.label}
            </Text>
          </PressableFeedback>
        );
      }}
    />
  );
}

function SortChipRow({
  sort,
  onPress,
}: {
  sort: SortId;
  onPress: (id: SortId) => void;
}) {
  const items: ReadonlyArray<{
    id: SortId;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { id: "next-due", label: "Next due", icon: "time-outline" },
    { id: "name", label: "Name", icon: "text-outline" },
    { id: "recent", label: "Newest", icon: "sparkles-outline" },
    { id: "room", label: "Room", icon: "home-outline" },
  ];

  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <View className="gap-2">
      <Text className="font-medium text-muted text-xs uppercase tracking-wide">
        Sort
      </Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => `sort-${item.id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => {
          const isActive = sort === item.id;
          return (
            <PressableFeedback
              onPress={() => onPress(item.id)}
              className={cn(
                "flex-row items-center gap-1.5 rounded-full border px-3 py-2",
                isActive
                  ? "border-accent bg-accent-soft"
                  : "border-border/60 bg-surface",
              )}
            >
              <Ionicons
                name={item.icon}
                size={14}
                color={isActive ? accent : muted}
              />
              <Text
                className={cn(
                  "font-medium text-sm",
                  isActive ? "text-accent-soft-foreground" : "text-foreground",
                )}
              >
                {item.label}
              </Text>
            </PressableFeedback>
          );
        }}
      />
    </View>
  );
}

function ViewModePill({
  icon,
  isActive,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
}) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  return (
    <PressableFeedback
      onPress={onPress}
      className={cn(
        "size-9 items-center justify-center rounded-full border",
        isActive
          ? "border-accent bg-accent-soft"
          : "border-border/60 bg-surface",
      )}
    >
      <Ionicons name={icon} size={16} color={isActive ? accent : muted} />
    </PressableFeedback>
  );
}
