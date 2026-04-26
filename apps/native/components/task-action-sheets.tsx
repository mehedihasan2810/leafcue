import { addDays } from "date-fns";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UndoToast } from "@/components/undo-toast";
import type { useTaskHandlers } from "@/hooks/use-task-handlers";
import { DatePromptSheet } from "@/screens/tasks/_components/date-prompt-sheet";
import { QuickCompleteSheet } from "@/screens/tasks/_components/quick-complete-sheet";
import { TaskActionSheet } from "@/screens/tasks/_components/task-action-sheet";

type TaskHandlers = ReturnType<typeof useTaskHandlers>;

type TaskActionSheetsProps = {
  handlers: TaskHandlers;
};

export function TaskActionSheets({ handlers }: TaskActionSheetsProps) {
  const insets = useSafeAreaInsets();
  const { state } = handlers;

  return (
    <>
      <TaskActionSheet
        isOpen={state.actionSheetOpen}
        onOpenChange={(open) => {
          if (!open) handlers.closeActionSheet();
        }}
        row={state.actionRow}
        onAction={handlers.handleAction}
      />

      <QuickCompleteSheet
        isOpen={state.detailsSheetOpen}
        onOpenChange={(open) => {
          if (!open) handlers.closeDetailsSheet();
        }}
        row={state.detailsRow}
        onSubmit={handlers.handleSubmitDetails}
      />

      <DatePromptSheet
        isOpen={state.dateSheetMode !== null}
        onOpenChange={(open) => {
          if (!open) handlers.closeDateSheet();
        }}
        title={
          state.dateSheetMode === "snooze" ? "Snooze until" : "Reschedule for"
        }
        description={
          state.dateSheetMode === "snooze"
            ? "Pause reminders until this date."
            : "Pick a new due date for this task."
        }
        initialDate={
          state.dateSheetRow?.schedule.nextDueAt ?? addDays(new Date(), 1)
        }
        minDate={addDays(new Date(), 1)}
        submitLabel={state.dateSheetMode === "snooze" ? "Snooze" : "Reschedule"}
        onSubmit={handlers.handleDateSheetSubmit}
      />

      {state.undo ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            bottom: insets.bottom + 80,
            left: 16,
            right: 16,
          }}
        >
          <UndoToast
            isVisible
            message={state.undo.message}
            onUndo={handlers.handleUndo}
            onDismiss={handlers.handleDismissUndo}
          />
        </View>
      ) : null}
    </>
  );
}
