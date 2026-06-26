import { Image } from "expo-image";
import { View } from "react-native";

const WELCOME_ILLUSTRATION = require("@/assets/images/onboarding/welcome.png");
const ILLUSTRATION_STYLE = { width: 280, height: 260 };

export function OnboardingIllustration() {
  return (
    <View className="items-center justify-center py-1">
      <Image
        source={WELCOME_ILLUSTRATION}
        style={ILLUSTRATION_STYLE}
        contentFit="contain"
      />
    </View>
  );
}
