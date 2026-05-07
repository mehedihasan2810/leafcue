import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import {
  Button,
  cn,
  Input,
  Label,
  PressableFeedback,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { KeyboardAwareScreen } from "@/components/keyboard-aware-screen";
import { useDatabase } from "@/lib/db";
import {
  createRoom,
  createShelf,
  deleteRoom,
  deleteShelf,
  getRooms,
  updateRoom,
} from "@/lib/db/repositories";
import {
  plants as plantsTable,
  rooms as roomsTable,
  shelves as shelvesTable,
} from "@/lib/db/schema";
import { seedDefaultRoomsIfEmpty } from "@/lib/db/seed";
import type { Room, Shelf } from "@/lib/db/types";
import { roomInsertSchema, shelfInsertSchema } from "@/lib/db/zod";

const ROOM_ICON_OPTIONS: ReadonlyArray<keyof typeof Ionicons.glyphMap> = [
  "tv-outline",
  "bed-outline",
  "restaurant-outline",
  "sunny-outline",
  "laptop-outline",
  "leaf-outline",
  "flower-outline",
  "home-outline",
  "water-outline",
  "moon-outline",
];

export function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const danger = useThemeColor("danger");
  const muted = useThemeColor("muted");
  const db = useDatabase();
  const [expandedRoomId, setExpandedRoomId] = useState<number | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

  const liveRooms = useLiveQuery(db.select().from(roomsTable));
  const liveShelves = useLiveQuery(db.select().from(shelvesTable));
  const livePlants = useLiveQuery(db.select().from(plantsTable));

  const rooms = useMemo(
    () => getRooms(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, liveRooms.data.length],
  );

  const plantCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const plant of livePlants.data) {
      if (plant.archivedAt) continue;
      if (plant.roomId === null) continue;
      map.set(plant.roomId, (map.get(plant.roomId) ?? 0) + 1);
    }
    return map;
  }, [livePlants.data]);

  const shelvesByRoom = useMemo(() => {
    const map = new Map<number, Shelf[]>();
    for (const shelf of liveShelves.data) {
      const list = map.get(shelf.roomId) ?? [];
      list.push(shelf);
      map.set(shelf.roomId, list);
    }
    for (const [roomId, list] of map.entries()) {
      list.sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      );
      map.set(roomId, list);
    }
    return map;
  }, [liveShelves.data]);

  const handleSeedDefaults = () => {
    try {
      seedDefaultRoomsIfEmpty(db);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create rooms";
      Alert.alert("Seed failed", message);
    }
  };

  const handleDeleteRoom = (room: Room) => {
    Alert.alert(
      `Delete ${room.name}?`,
      "Plants in this room will keep their data but lose their room assignment.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              deleteRoom(db, room.id);
              if (expandedRoomId === room.id) setExpandedRoomId(null);
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Could not delete room";
              Alert.alert("Delete failed", message);
            }
          },
        },
      ],
    );
  };

  const handleRenameRoom = (room: Room, name: string) => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    try {
      updateRoom(db, room.id, { name: trimmed });
      setEditingRoomId(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not rename room";
      Alert.alert("Rename failed", message);
    }
  };

  const handleDeleteShelf = (shelf: Shelf) => {
    Alert.alert(
      `Delete ${shelf.name}?`,
      "Plants on this shelf will keep their data but lose their shelf assignment.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              deleteShelf(db, shelf.id);
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Could not delete shelf";
              Alert.alert("Delete failed", message);
            }
          },
        },
      ],
    );
  };

  if (rooms.length === 0) {
    return (
      <KeyboardAwareScreen contentClassName="gap-4">
        <View className="gap-1" style={{ paddingTop: insets.top > 0 ? 0 : 4 }}>
          <Text className="font-bold text-2xl text-foreground">Rooms</Text>
          <Text className="text-muted text-sm">
            Group plants by room and shelf to keep care routines tidy.
          </Text>
        </View>
        <EmptyState
          icon="home-outline"
          title="No rooms yet"
          description="Create suggested starter rooms or add your own from the form below."
          ctaLabel="Create suggested rooms"
          onPressCta={handleSeedDefaults}
        />
        <AddRoomForm db={db} />
      </KeyboardAwareScreen>
    );
  }

  return (
    <KeyboardAwareScreen contentClassName="gap-4">
      <View className="gap-1" style={{ paddingTop: insets.top > 0 ? 0 : 4 }}>
        <Text className="font-bold text-2xl text-foreground">Rooms</Text>
        <Text className="text-muted text-sm">
          {rooms.length} room{rooms.length === 1 ? "" : "s"} ·{" "}
          {Array.from(plantCounts.values()).reduce((a, b) => a + b, 0)} plant
          {Array.from(plantCounts.values()).reduce((a, b) => a + b, 0) === 1
            ? ""
            : "s"}{" "}
          assigned
        </Text>
      </View>

      <View className="gap-3">
        {rooms.map((room) => {
          const isExpanded = expandedRoomId === room.id;
          const isEditing = editingRoomId === room.id;
          const shelves = shelvesByRoom.get(room.id) ?? [];
          const plantCount = plantCounts.get(room.id) ?? 0;

          return (
            <View
              key={`room-${room.id}`}
              className="overflow-hidden rounded-3xl border border-border/40 bg-surface"
            >
              <PressableFeedback
                onPress={() =>
                  setExpandedRoomId((current) =>
                    current === room.id ? null : room.id,
                  )
                }
                className="flex-row items-center gap-3 px-4 py-4"
              >
                <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
                  <Ionicons
                    name={
                      (room.icon as keyof typeof Ionicons.glyphMap) ??
                      "home-outline"
                    }
                    size={20}
                    color={accent}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="font-semibold text-base text-foreground">
                    {room.name}
                  </Text>
                  <Text className="text-muted text-xs">
                    {plantCount} plant{plantCount === 1 ? "" : "s"} ·{" "}
                    {shelves.length} shelf
                    {shelves.length === 1 ? "" : "ves"}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={muted}
                />
              </PressableFeedback>

              {isExpanded ? (
                <View className="gap-4 border-border/40 border-t px-4 pt-4 pb-5">
                  {isEditing ? (
                    <RenameRoomInline
                      room={room}
                      onCancel={() => setEditingRoomId(null)}
                      onSave={(name) => handleRenameRoom(room, name)}
                    />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => setEditingRoomId(room.id)}
                        className="flex-1"
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={14}
                          color={accent}
                        />
                        <Button.Label>Rename</Button.Label>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={() => handleDeleteRoom(room)}
                        className="flex-1"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color={danger}
                        />
                        <Button.Label style={{ color: danger }}>
                          Delete
                        </Button.Label>
                      </Button>
                    </View>
                  )}

                  <View className="gap-2">
                    <Text className="font-medium text-muted text-xs uppercase tracking-wide">
                      Shelves
                    </Text>
                    {shelves.length === 0 ? (
                      <Text className="text-muted text-sm">
                        No shelves yet — add one below to organize this room.
                      </Text>
                    ) : (
                      <View className="gap-2">
                        {shelves.map((shelf) => (
                          <View
                            key={`shelf-${shelf.id}`}
                            className="flex-row items-center gap-2 rounded-2xl bg-muted/15 px-3 py-2"
                          >
                            <Ionicons
                              name="layers-outline"
                              size={14}
                              color={muted}
                            />
                            <Text className="flex-1 text-foreground text-sm">
                              {shelf.name}
                            </Text>
                            <PressableFeedback
                              onPress={() => handleDeleteShelf(shelf)}
                            >
                              <Ionicons
                                name="close-circle-outline"
                                size={18}
                                color={danger}
                              />
                            </PressableFeedback>
                          </View>
                        ))}
                      </View>
                    )}

                    <AddShelfForm db={db} room={room} />
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <View className="gap-2">
        <Text className="font-semibold text-base text-foreground">
          Add a room
        </Text>
        <AddRoomForm db={db} />
      </View>

      <PressableFeedback
        onPress={handleSeedDefaults}
        className="flex-row items-center gap-2 self-start"
      >
        <Ionicons name="sparkles-outline" size={14} color={accent} />
        <Text className="font-medium text-accent text-xs">
          Add suggested starter rooms
        </Text>
      </PressableFeedback>
    </KeyboardAwareScreen>
  );
}

type AddRoomFormProps = {
  db: ReturnType<typeof useDatabase>;
};

function AddRoomForm({ db }: AddRoomFormProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      icon: "home-outline" as keyof typeof Ionicons.glyphMap,
    },
    onSubmit: ({ value, formApi }) => {
      const result = roomInsertSchema.safeParse({
        name: value.name,
        icon: value.icon,
      });
      if (!result.success) {
        Alert.alert(
          "Invalid room",
          result.error.issues[0]?.message ?? "Please review the form.",
        );
        return;
      }
      try {
        createRoom(db, result.data);
        formApi.reset();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not add room";
        Alert.alert("Add failed", message);
      }
    },
  });

  return (
    <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => {
            const result = roomInsertSchema.shape.name.safeParse(value);
            if (result.success) return undefined;
            return result.error.issues[0]?.message ?? "Required";
          },
        }}
      >
        {(field) => {
          const errorMessage =
            typeof field.state.meta.errors[0] === "string"
              ? (field.state.meta.errors[0] as string)
              : undefined;
          return (
            <TextField isInvalid={Boolean(errorMessage)} className="gap-1.5">
              <Label>
                <Label.Text>Name</Label.Text>
              </Label>
              <Input
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder="e.g. Sunny corner"
                autoCapitalize="words"
                maxLength={80}
              />
              {errorMessage ? (
                <Text className="text-danger text-xs">{errorMessage}</Text>
              ) : null}
            </TextField>
          );
        }}
      </form.Field>

      <form.Field name="icon">
        {(field) => (
          <View className="gap-2">
            <PressableFeedback
              onPress={() => setIconPickerOpen((current) => !current)}
              className="flex-row items-center gap-2 rounded-2xl border border-border/60 bg-surface px-3 py-2"
            >
              <View className="size-8 items-center justify-center rounded-xl bg-accent-soft">
                <Ionicons name={field.state.value} size={16} color={accent} />
              </View>
              <Text className="flex-1 font-medium text-foreground text-sm">
                Icon
              </Text>
              <Ionicons
                name={iconPickerOpen ? "chevron-up" : "chevron-down"}
                size={14}
                color={muted}
              />
            </PressableFeedback>
            {iconPickerOpen ? (
              <View className="flex-row flex-wrap gap-2 rounded-2xl border border-border/40 bg-muted/10 p-3">
                {ROOM_ICON_OPTIONS.map((icon) => {
                  const isSelected = field.state.value === icon;
                  return (
                    <PressableFeedback
                      key={icon}
                      onPress={() => {
                        field.handleChange(icon);
                        setIconPickerOpen(false);
                      }}
                      className={cn(
                        "size-12 items-center justify-center rounded-2xl border",
                        isSelected
                          ? "border-accent bg-accent-soft"
                          : "border-border/60 bg-surface",
                      )}
                    >
                      <Ionicons
                        name={icon}
                        size={20}
                        color={isSelected ? accent : muted}
                      />
                    </PressableFeedback>
                  );
                })}
              </View>
            ) : null}
          </View>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ canSubmit, isSubmitting }) => (
          <Button
            isDisabled={!canSubmit || isSubmitting}
            onPress={() => {
              void form.handleSubmit();
            }}
          >
            <Ionicons name="add" size={16} color={accent} />
            <Button.Label>Add room</Button.Label>
          </Button>
        )}
      </form.Subscribe>
    </View>
  );
}

type AddShelfFormProps = {
  db: ReturnType<typeof useDatabase>;
  room: Room;
};

function AddShelfForm({ db, room }: AddShelfFormProps) {
  const accent = useThemeColor("accent");
  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: ({ value, formApi }) => {
      const result = shelfInsertSchema.safeParse({
        roomId: room.id,
        name: value.name,
      });
      if (!result.success) {
        Alert.alert(
          "Invalid shelf",
          result.error.issues[0]?.message ?? "Please review the form.",
        );
        return;
      }
      try {
        createShelf(db, result.data);
        formApi.reset();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not add shelf";
        Alert.alert("Add failed", message);
      }
    },
  });

  return (
    <View className="flex-row items-end gap-2">
      <View className="flex-1">
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              if (value.trim().length === 0) return "Add a name";
              if (value.length > 80) return "Too long";
              return undefined;
            },
          }}
        >
          {(field) => (
            <TextField className="gap-1.5">
              <Input
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder="Add a shelf (e.g. Top shelf)"
                autoCapitalize="words"
                maxLength={80}
              />
            </TextField>
          )}
        </form.Field>
      </View>
      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Button
            size="sm"
            isDisabled={!canSubmit}
            onPress={() => {
              void form.handleSubmit();
            }}
          >
            <Ionicons name="add" size={14} color={accent} />
            <Button.Label>Add</Button.Label>
          </Button>
        )}
      </form.Subscribe>
    </View>
  );
}

type RenameRoomInlineProps = {
  room: Room;
  onSave: (name: string) => void;
  onCancel: () => void;
};

function RenameRoomInline({ room, onSave, onCancel }: RenameRoomInlineProps) {
  const [name, setName] = useState(room.name);
  return (
    <View className="gap-2">
      <TextField className="gap-1.5">
        <Label>
          <Label.Text>Rename room</Label.Text>
        </Label>
        <Input
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={80}
          autoCapitalize="words"
        />
      </TextField>
      <View className="flex-row items-center gap-2">
        <Button size="sm" variant="ghost" onPress={onCancel} className="flex-1">
          <Button.Label>Cancel</Button.Label>
        </Button>
        <Button
          size="sm"
          isDisabled={name.trim().length === 0}
          onPress={() => onSave(name)}
          className="flex-1"
        >
          <Button.Label>Save</Button.Label>
        </Button>
      </View>
    </View>
  );
}
