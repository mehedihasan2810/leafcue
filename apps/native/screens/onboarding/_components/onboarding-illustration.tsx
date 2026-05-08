import { Image } from "expo-image";
import { View } from "react-native";

export type OnboardingIllustrationVariant =
  | "welcome"
  | "privacy"
  | "track"
  | "room"
  | "finish";

const ILLUSTRATION_SOURCE: Record<OnboardingIllustrationVariant, number> = {
  welcome: require("@/assets/images/onboarding/welcome.png"),
  privacy: require("@/assets/images/onboarding/privacy.png"),
  track: require("@/assets/images/onboarding/track.png"),
  room: require("@/assets/images/onboarding/room.png"),
  finish: require("@/assets/images/onboarding/finish.png"),
};

const ILLUSTRATION_STYLE = { width: 280, height: 260 };

type OnboardingIllustrationProps = {
  variant: OnboardingIllustrationVariant;
};

export function OnboardingIllustration({
  variant,
}: OnboardingIllustrationProps) {
  return (
    <View className="items-center justify-center py-1">
      <Image
        source={ILLUSTRATION_SOURCE[variant]}
        style={ILLUSTRATION_STYLE}
        contentFit="contain"
      />
    </View>
  );
}
