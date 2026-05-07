import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { Dimensions, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PlantPhoto } from "@/lib/db/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type PhotoViewerDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  photo: PlantPhoto | null;
  onDelete?: () => void;
  onSetCover?: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 6;

export function PhotoViewerDialog({
  isOpen,
  onOpenChange,
  photo,
  onDelete,
  onSetCover,
}: PhotoViewerDialogProps) {
  const insets = useSafeAreaInsets();
  const danger = useThemeColor("danger");

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const resetValues = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    focalX.value = 0;
    focalY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onBegin((e) => {
      savedScale.value = scale.value;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const newScale = Math.min(
        Math.max(savedScale.value * e.scale, MIN_SCALE),
        MAX_SCALE,
      );
      scale.value = newScale;
      const pinchRatio = newScale / savedScale.value;
      translateX.value =
        savedTranslateX.value +
        (1 - pinchRatio) * (focalX.value - SCREEN_WIDTH / 2);
      translateY.value =
        savedTranslateY.value +
        (1 - pinchRatio) * (focalY.value - SCREEN_HEIGHT / 2);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1.5) {
        scale.value = withTiming(1, { duration: 250 });
        translateX.value = withTiming(0, { duration: 250 });
        translateY.value = withTiming(0, { duration: 250 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        const targetScale = 2.5;
        scale.value = withTiming(targetScale, { duration: 250 });
        const offsetX =
          ((SCREEN_WIDTH / 2 - e.absoluteX) * (targetScale - 1)) / targetScale;
        const offsetY =
          ((SCREEN_HEIGHT / 2 - e.absoluteY) * (targetScale - 1)) / targetScale;
        translateX.value = withTiming(offsetX, { duration: 250 });
        translateY.value = withTiming(offsetY, { duration: 250 });
        savedScale.value = targetScale;
        savedTranslateX.value = offsetX;
        savedTranslateY.value = offsetY;
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  const allGestures = Gesture.Exclusive(doubleTapGesture, composedGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const resetZoom = () => {
    scale.value = withTiming(1, { duration: 250 });
    translateX.value = withTiming(0, { duration: 250 });
    translateY.value = withTiming(0, { duration: 250 });
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  if (!isOpen || !photo) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      className="absolute inset-0 z-50"
      pointerEvents="auto"
    >
      {/* Backdrop */}
      <PressableFeedback
        className="absolute inset-0 bg-black"
        onPress={() => {
          resetValues();
          onOpenChange(false);
        }}
      />

      {/* Image */}
      <GestureDetector gesture={allGestures}>
        <Animated.View
          className="flex-1 items-center justify-center"
          style={animatedStyle}
        >
          <Image
            source={{ uri: photo.uri }}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_WIDTH,
            }}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>
      </GestureDetector>

      {/* Top toolbar */}
      <View
        className="absolute right-0 left-0 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 8 }}
      >
        <PressableFeedback
          onPress={() => {
            resetValues();
            onOpenChange(false);
          }}
          className="size-10 items-center justify-center rounded-full bg-white/20"
        >
          <Ionicons name="close" size={22} color="white" />
        </PressableFeedback>

        <View className="flex-row gap-3">
          {onSetCover ? (
            <PressableFeedback
              onPress={() => {
                resetValues();
                onSetCover();
              }}
              className="size-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="image-outline" size={20} color="white" />
            </PressableFeedback>
          ) : null}
          {onDelete ? (
            <PressableFeedback
              onPress={() => {
                resetValues();
                onDelete();
              }}
              className="size-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="trash-outline" size={20} color={danger} />
            </PressableFeedback>
          ) : null}
          <PressableFeedback
            onPress={resetZoom}
            className="size-10 items-center justify-center rounded-full bg-white/20"
          >
            <Ionicons name="scan-outline" size={20} color="white" />
          </PressableFeedback>
        </View>
      </View>

      {/* Bottom hint */}
      <View
        className="absolute right-0 bottom-8 left-0 items-center"
        pointerEvents="none"
      >
        <Text className="text-white/50 text-xs">
          Pinch to zoom · Double tap to toggle
        </Text>
      </View>
    </Animated.View>
  );
}
