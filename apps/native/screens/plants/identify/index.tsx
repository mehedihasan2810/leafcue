import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Button,
  PressableFeedback,
  Spinner,
  useThemeColor,
} from "heroui-native";
import { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { useDatabase } from "@/lib/db";
import { getIdentifier, type IdentifySuggestion } from "@/lib/identify";
import { pickPlantPhoto } from "@/lib/photos";
import { useIdentifyStore } from "@/stores/use-identify-store";

type Status = "idle" | "working" | "done" | "error";

export function IdentifyPlantScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const accentForeground = useThemeColor("accent-foreground");
  const muted = useThemeColor("muted");
  const db = useDatabase();
  const identifier = useMemo(() => getIdentifier(db), [db]);
  const setPick = useIdentifyStore((state) => state.setPick);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [suggestions, setSuggestions] = useState<IdentifySuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runIdentify = async (uri: string) => {
    setStatus("working");
    setError(null);
    try {
      const results = await identifier.identify(uri);
      setSuggestions(results);
      setStatus("done");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Identification failed.",
      );
      setStatus("error");
    }
  };

  const handlePick = async (source: "library" | "camera") => {
    if (status === "working") return;
    try {
      const result = await pickPlantPhoto(source);
      if (result.canceled) return;
      setPhotoUri(result.uri);
      await runIdentify(result.uri);
    } catch (caught) {
      Alert.alert(
        "Photo error",
        caught instanceof Error ? caught.message : "Could not pick a photo.",
      );
    }
  };

  const handleUse = (suggestion: IdentifySuggestion) => {
    setPick({
      presetId: suggestion.presetId,
      commonName: suggestion.commonName,
      scientificName: suggestion.scientificName,
      photoUri,
    });
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center gap-3 px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
      >
        <PressableFeedback
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full bg-surface"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={20} color={accent} />
        </PressableFeedback>
        <Text className="font-display text-2xl text-foreground">
          Identify a plant
        </Text>
      </View>

      <Container className="px-6" isScrollable>
        <View className="gap-5" style={{ paddingBottom: insets.bottom + 32 }}>
          {identifier.kind === "stub" ? (
            <View className="flex-row items-start gap-2 rounded-2xl border border-warning/40 bg-warning-soft/40 p-3">
              <Ionicons name="flask-outline" size={14} color={accent} />
              <Text className="flex-1 text-foreground text-xs leading-4">
                Demo mode — showing sample matches. Connect an identification
                provider for live results.
              </Text>
            </View>
          ) : null}

          <View className="flex-row items-start gap-2 rounded-2xl bg-accent-soft/40 p-3">
            <Ionicons name="lock-closed-outline" size={14} color={accent} />
            <Text className="flex-1 text-foreground text-xs leading-4">
              This sends one photo to identify your plant. Everything else stays
              on this device.
            </Text>
          </View>

          {photoUri ? (
            <View className="items-center">
              <Image
                source={{ uri: photoUri }}
                style={{ width: 200, height: 200, borderRadius: 24 }}
                contentFit="cover"
                transition={150}
              />
            </View>
          ) : (
            <View className="items-center gap-2 rounded-3xl border border-border/40 border-dashed bg-surface p-8">
              <Ionicons name="camera-outline" size={36} color={muted} />
              <Text className="text-center text-muted text-sm leading-5">
                Take or choose a clear photo of the whole plant for the best
                match.
              </Text>
            </View>
          )}

          <View className="gap-2">
            <Button
              onPress={() => handlePick("camera")}
              isDisabled={status === "working"}
            >
              <Ionicons
                name="camera-outline"
                size={16}
                color={accentForeground}
              />
              <Button.Label>Take a photo</Button.Label>
            </Button>
            <Button
              variant="secondary"
              onPress={() => handlePick("library")}
              isDisabled={status === "working"}
            >
              <Ionicons name="images-outline" size={16} color={accent} />
              <Button.Label>Choose from library</Button.Label>
            </Button>
          </View>

          {status === "working" ? (
            <View className="items-center gap-2 py-4">
              <Spinner />
              <Text className="text-muted text-sm">Identifying…</Text>
            </View>
          ) : null}

          {status === "error" ? (
            <View className="gap-1 rounded-2xl border border-danger/40 bg-danger-soft/30 p-4">
              <Text className="font-medium text-foreground">
                Couldn't identify
              </Text>
              <Text className="text-muted text-sm leading-5">{error}</Text>
            </View>
          ) : null}

          {status === "done" && suggestions.length > 0 ? (
            <View className="gap-3">
              <Text className="font-semibold text-base text-foreground">
                Best matches
              </Text>
              {suggestions.map((suggestion) => (
                <PressableFeedback
                  key={`${suggestion.commonName}-${suggestion.presetId ?? "x"}`}
                  onPress={() => handleUse(suggestion)}
                  accessibilityRole="button"
                  className="flex-row items-center gap-3 rounded-2xl border border-border/40 bg-surface p-3"
                >
                  <View className="size-10 items-center justify-center rounded-xl bg-accent-soft">
                    <Ionicons name="leaf-outline" size={18} color={accent} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="font-medium text-foreground text-sm">
                      {suggestion.commonName}
                    </Text>
                    {suggestion.scientificName ? (
                      <Text className="text-muted text-xs" numberOfLines={1}>
                        {suggestion.scientificName}
                      </Text>
                    ) : null}
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Text className="font-semibold text-accent text-xs">
                      {Math.round(suggestion.confidence * 100)}%
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={muted} />
                  </View>
                </PressableFeedback>
              ))}
            </View>
          ) : null}

          {status === "done" && suggestions.length === 0 ? (
            <View className="gap-1 rounded-2xl border border-border/40 bg-surface p-4">
              <Text className="font-medium text-foreground">
                No confident match
              </Text>
              <Text className="text-muted text-sm leading-5">
                Try another photo, or search for the species manually.
              </Text>
            </View>
          ) : null}

          <PressableFeedback
            onPress={() => router.back()}
            className="items-center py-2"
            accessibilityRole="button"
          >
            <Text className="font-medium text-accent text-sm">
              Search manually instead
            </Text>
          </PressableFeedback>
        </View>
      </Container>
    </View>
  );
}
