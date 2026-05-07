import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { Button, cn, SearchField, useThemeColor } from "heroui-native";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { PlantCard } from "@/components/plant-card";
import { isOverdue } from "@/lib/dates";
import { useDatabase } from "@/lib/db";
import {
  getDueTasks,
  getPlants,
  getRooms,
  getSchedulesForPlant,
} from "@/lib/db/repositories";
import {
  plants as plantsTable,
  plantTaskSchedules,
  rooms as roomsTable,
} from "@/lib/db/schema";
import type { Plant, Room } from "@/lib/db/types";

type FilterId = "all" | "favorites" | "today" | "overdue" | "room";

type ViewMode = "grid" | "list";

export function PlantLibraryScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const accentForeground = useThemeColor("accent-foreground");
  const muted = useThemeColor("muted");
  const db = useDatabase();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [roomFilter, setRoomFilter] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showArchived, setShowArchived] = useState(false);

  const deferredSearch = useDeferredValue(search);

  const livePlants = useLiveQuery(db.select().from(plantsTable));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveRooms = useLiveQuery(db.select().from(roomsTable));

  const filteredPlants = useMemo(
    () =>
      getPlants(db, {
        includeArchived: showArchived,
        search: deferredSearch,
        favoritesOnly: filter === "favorites" ? true : undefined,
        roomId:
          filter === "room" && roomFilter !== null ? roomFilter : undefined,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      db,
      deferredSearch,
      filter,
      roomFilter,
      showArchived,
      livePlants.data.length,
    ],
  );

  const dueRows = useMemo(
    () => getDueTasks(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, liveSchedules.data.length],
  );

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

  const visiblePlants = useMemo(() => {
    if (filter === "today") {
      return filteredPlants.filter((plant) => todayDueIds.has(plant.id));
    }
    if (filter === "overdue") {
      return filteredPlants.filter((plant) => overdueIds.has(plant.id));
    }
    return filteredPlants;
  }, [filteredPlants, filter, todayDueIds, overdueIds]);

  const rooms = useMemo(
    () => getRooms(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, liveRooms.data.length],
  );

  const roomById = useMemo(() => {
    const map = new Map<number, Room>();
    for (const room of rooms) map.set(room.id, room);
    return map;
  }, [rooms]);

  const nextDueByPlant = useMemo(() => {
    const map = new Map<number, Date | null>();
    for (const plant of visiblePlants) {
      const schedules = getSchedulesForPlant(db, plant.id);
      let nextDue: Date | null = null;
      for (const schedule of schedules) {
        if (!schedule.isEnabled || !schedule.nextDueAt) continue;
        if (!nextDue || schedule.nextDueAt < nextDue) {
          nextDue = schedule.nextDueAt;
        }
      }
      map.set(plant.id, nextDue);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePlants, liveSchedules.data.length, db]);

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
          onPressCta={() => router.push("/plants/new")}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        key={viewMode}
        data={visiblePlants}
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
            <View className="px-6">
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
            <View className="gap-1">
              <Text className="font-bold text-2xl text-foreground">
                Your plants
              </Text>
              <Text className="text-muted text-sm">
                {visiblePlants.length} of {totalActive} showing
              </Text>
            </View>

            <SearchField value={search} onChange={setSearch}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by name…" />
                {search ? <SearchField.ClearButton /> : null}
              </SearchField.Group>
            </SearchField>

            <FilterChipRow filter={filter} onPress={handleFilterPress} />

            {filter === "room" ? (
              <View className="gap-2">
                <Text className="font-medium text-muted text-xs uppercase tracking-wide">
                  Filter by room
                </Text>
                {rooms.length === 0 ? (
                  <Text className="text-muted text-sm">
                    No rooms yet — add one in the Rooms tab.
                  </Text>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {rooms.map((room) => {
                      const isActive = roomFilter === room.id;
                      return (
                        <Pressable
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
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            <View className="flex-row items-center justify-between">
              <Pressable
                hitSlop={8}
                onPress={() => setShowArchived((current) => !current)}
              >
                <Text className="font-medium text-accent text-xs">
                  {showArchived ? "Hide archived" : "Show archived"}
                </Text>
              </Pressable>
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
              onPressCta={() => router.push("/plants/new")}
            />
          </View>
        }
      />

      <View
        className="absolute right-4"
        style={{ bottom: insets.bottom + 12 }}
        pointerEvents="box-none"
      >
        <Button onPress={() => router.push("/plants/new")}>
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
          <Pressable
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
          </Pressable>
        );
      }}
    />
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
    <Pressable
      onPress={onPress}
      className={cn(
        "size-9 items-center justify-center rounded-full border",
        isActive
          ? "border-accent bg-accent-soft"
          : "border-border/60 bg-surface",
      )}
    >
      <Ionicons name={icon} size={16} color={isActive ? accent : muted} />
    </Pressable>
  );
}
