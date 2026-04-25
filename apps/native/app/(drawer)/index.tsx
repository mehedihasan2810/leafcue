import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

const careQueue = [
  { plant: "Monstera Deliciosa", cue: "Check soil moisture", when: "Today" },
  { plant: "Calathea Orbifolia", cue: "Mist leaves", when: "Tomorrow" },
  { plant: "Snake Plant", cue: "Skip watering", when: "In 5 days" },
] as const;

export default function Home() {
  const mutedColor = useThemeColor("muted");
  const successColor = useThemeColor("success");

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
            Private plant care cues stored locally on this device.
          </Text>
        </View>

        <Card variant="secondary">
          <Card.Header className="flex-row items-center justify-between">
            <View>
              <Card.Title>Today&apos;s care</Card.Title>
              <Card.Description>SQLite-backed local queue</Card.Description>
            </View>
            <Ionicons name="leaf-outline" size={24} color={successColor} />
          </Card.Header>
          <Card.Body className="gap-3">
            {careQueue.map((item) => (
              <Card key={item.plant} variant="tertiary">
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
                      {item.plant}
                    </Text>
                    <Text className="text-muted text-sm">{item.cue}</Text>
                  </View>
                  <Text className="text-muted text-xs">{item.when}</Text>
                </Card.Body>
              </Card>
            ))}
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
              dependency. Future sync can be added intentionally when needed.
            </Card.Description>
          </Card.Body>
        </Card>
      </View>
    </Container>
  );
}
