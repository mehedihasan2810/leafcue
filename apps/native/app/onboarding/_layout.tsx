import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="room" />
      <Stack.Screen name="add-first-plant" />
      <Stack.Screen name="plan-reveal" />
      <Stack.Screen name="notify" />
      <Stack.Screen name="plus" />
      <Stack.Screen name="finish" />
    </Stack>
  );
}
