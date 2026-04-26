import { Text, View } from "react-native";

import { SectionHeader } from "@/components/section-header";

type NotesSectionProps = {
  notes: string | null;
};

export function NotesSection({ notes }: NotesSectionProps) {
  if (!notes) return null;

  return (
    <View className="gap-3">
      <SectionHeader title="Notes" caption="Personal reminders" />
      <View className="rounded-2xl border border-border/30 bg-surface p-4">
        <Text className="text-foreground text-sm leading-5">{notes}</Text>
      </View>
    </View>
  );
}
