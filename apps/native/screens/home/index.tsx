import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Card, Chip, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { useDatabase } from "@/lib/db";
import {
  careTaskTemplates,
  plantPresets,
  plants,
} from "@/lib/db/schema";
import { getDueTasks, getPlants } from "@/lib/db/repositories";

const numberFormatter = new Intl.NumberFormat();

export function HomeScreen() {
  const db = useDatabase();
  const successColor = useThemeColor("success");
  const mutedColor = useThemeColor("muted");

  const livePlants = useLiveQuery(db.select().from(plants));
  const liveTemplates = useLiveQuery(db.select().from(careTaskTemplates));
  const livePresets = useLiveQuery(db.select().from(plantPresets));

  const activePlants = getPlants(db);
  const dueTasks = getDueTasks(db, new Date());

  const plantCount = livePlants.data.filter(
    (plant) => plant.archivedAt === null,
  ).length;
  const totalPlants = livePlants.data.length;
  const presetCount = livePresets.data.length;
  const templateCount = liveTemplates.data.length;

  return (
    <Container className="p-6">
      <View className="gap-6">
        <View className="gap-3 py-4">
          <Chip variant="secondary" color="success" size="sm">
            <Ionicons
              name="cloud-offline-outline"
              size={14}
              color={successColor}
            />
            <Chip.Label>Offline first</Chip.Label>
          </Chip>
          <Text className="font-bold text-4xl text-foreground">LeafCue</Text>
          <Text className="max-w-sm text-base text-muted leading-6">
            Your private plant care companion. Everything lives in this device's
            local database.
          </Text>
        </View>

        <Card variant="secondary">
          <Card.Header className="flex-row items-center justify-between">
            <View>
              <Card.Title>Today's care</Card.Title>
              <Card.Description>
                {dueTasks.length > 0
                  ? `${numberFormatter.format(dueTasks.length)} cue${
                      dueTasks.length === 1 ? "" : "s"
                    } ready`
                  : "Nothing due right now"}
              </Card.Description>
            </View>
            <Ionicons name="leaf-outline" size={24} color={successColor} />
          </Card.Header>
          <Card.Body className="gap-3">
            {dueTasks.length === 0 ? (
              <Card variant="tertiary">
                <Card.Body className="gap-1">
                  <Text className="font-medium text-foreground">
                    All caught up
                  </Text>
                  <Text className="text-muted text-sm">
                    Add your first plant to start tracking water, fertilizer,
                    and light cues.
                  </Text>
                </Card.Body>
              </Card>
            ) : (
              dueTasks.slice(0, 5).map(({ schedule, plant, template }) => (
                <Card key={schedule.id} variant="tertiary">
                  <Card.Body className="flex-row items-center gap-3">
                    <View className="size-10 items-center justify-center rounded-lg bg-success-soft">
                      <Ionicons
                        name="sparkles-outline"
                        size={18}
                        color={successColor}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">
                        {plant.nickname}
                      </Text>
                      <Text className="text-muted text-sm">
                        {schedule.customName ?? template?.name ?? "Care cue"}
                      </Text>
                    </View>
                    <Text className="text-muted text-xs">
                      {schedule.nextDueAt
                        ? schedule.nextDueAt.toLocaleDateString()
                        : "Due"}
                    </Text>
                  </Card.Body>
                </Card>
              ))
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="gap-3">
            <View className="flex-row items-center gap-3">
              <Ionicons name="albums-outline" size={20} color={mutedColor} />
              <Card.Title>Local library</Card.Title>
            </View>
            <Card.Description>
              {numberFormatter.format(plantCount)} active /
              {" "}
              {numberFormatter.format(totalPlants)} total plants
              {" \u00B7 "}
              {numberFormatter.format(activePlants.length)} via repository
              {" \u00B7 "}
              {numberFormatter.format(presetCount)} guide presets
              {" \u00B7 "}
              {numberFormatter.format(templateCount)} care templates
            </Card.Description>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="gap-3">
            <View className="flex-row items-center gap-3">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={mutedColor}
              />
              <Card.Title>No account required</Card.Title>
            </View>
            <Card.Description>
              LeafCue starts with no auth flow, no cookies, and no backend
              dependency. Sync can be added later if you want it.
            </Card.Description>
          </Card.Body>
        </Card>
      </View>
    </Container>
  );
}
