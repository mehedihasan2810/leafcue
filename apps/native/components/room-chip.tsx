import { Ionicons } from "@expo/vector-icons";
import { Chip, type ChipProps, useThemeColor } from "heroui-native";

type RoomChipProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: ChipProps["variant"];
  size?: ChipProps["size"];
  color?: ChipProps["color"];
  onPress?: () => void;
};

export function RoomChip({
  label,
  icon = "home-outline",
  variant = "secondary",
  size = "sm",
  color = "default",
  onPress,
}: RoomChipProps) {
  const iconColor = useThemeColor("muted");

  return (
    <Chip variant={variant} size={size} color={color} onPress={onPress}>
      <Ionicons name={icon} size={12} color={iconColor} />
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}
