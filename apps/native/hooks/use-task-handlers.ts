import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { pickCompletionMessage } from "@/lib/care/celebration";
import {
  type CompleteTaskSnapshot,
  performComplete,
  performReschedule,
  performSkipOnce,
  performSnoozeDays,
  performSnoozeUntil,
  performToggleEnabled,
  performUndo,
} from "@/lib/care/task-actions";
import { useDatabase } from "@/lib/db";
import type { CompleteTaskInput, DueTaskRow } from "@/lib/db/repositories";
import { getInsightsSummary } from "@/lib/db/repositories";
import type { TaskActionType } from "@/screens/tasks/_components/task-action-sheet";
import { useCelebrationStore } from "@/stores/use-celebration-store";

type DateSheetMode = "snooze" | "reschedule";

type UndoState = {
  snapshot: CompleteTaskSnapshot;
  message: string;
};

export function useTaskHandlers() {
  const db = useDatabase();
  const celebrate = useCelebrationStore((state) => state.celebrate);
  const [actionRow, setActionRow] = useState<DueTaskRow | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [detailsRow, setDetailsRow] = useState<DueTaskRow | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [dateSheetMode, setDateSheetMode] = useState<DateSheetMode | null>(
    null,
  );
  const [dateSheetRow, setDateSheetRow] = useState<DueTaskRow | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);

  const closeActionSheet = useCallback(() => {
    setActionSheetOpen(false);
  }, []);

  const closeDetailsSheet = useCallback(() => {
    setDetailsSheetOpen(false);
  }, []);

  const closeDateSheet = useCallback(() => {
    setDateSheetMode(null);
    setDateSheetRow(null);
  }, []);

  const openMenu = useCallback((row: DueTaskRow) => {
    setActionRow(row);
    setActionSheetOpen(true);
  }, []);

  const completeNow = useCallback(
    async (row: DueTaskRow, input?: Partial<CompleteTaskInput>) => {
      const snapshot = await performComplete(
        db,
        { scheduleId: row.schedule.id, ...input },
        row.schedule,
      );
      if (snapshot) {
        const streakDays = getInsightsSummary(db).careStreakDays;
        const message = pickCompletionMessage(
          row.template?.key ?? null,
          row.plant.nickname,
          streakDays,
        );
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        celebrate();
        setUndo({ snapshot, message });
      }
    },
    [db, celebrate],
  );

  const handleQuickComplete = useCallback(
    (row: DueTaskRow) => {
      void completeNow(row);
    },
    [completeNow],
  );

  const handleAddDetails = useCallback((row: DueTaskRow) => {
    setDetailsRow(row);
    setDetailsSheetOpen(true);
  }, []);

  const handleSubmitDetails = useCallback(
    async (input: CompleteTaskInput) => {
      const row = detailsRow;
      if (!row) return;
      await completeNow(row, input);
    },
    [detailsRow, completeNow],
  );

  const handleUndo = useCallback(async () => {
    if (!undo) return;
    await performUndo(db, undo.snapshot);
    setUndo(null);
  }, [db, undo]);

  const handleDismissUndo = useCallback(() => {
    setUndo(null);
  }, []);

  const handleAction = useCallback(
    (row: DueTaskRow, action: TaskActionType) => {
      setActionSheetOpen(false);
      switch (action) {
        case "details":
          setTimeout(() => handleAddDetails(row), 200);
          return;
        case "snooze-1":
          void performSnoozeDays(db, row.schedule.id, 1);
          return;
        case "snooze-3":
          void performSnoozeDays(db, row.schedule.id, 3);
          return;
        case "snooze-custom":
          setDateSheetMode("snooze");
          setDateSheetRow(row);
          return;
        case "reschedule":
          setDateSheetMode("reschedule");
          setDateSheetRow(row);
          return;
        case "skip":
          void performSkipOnce(db, row.schedule.id);
          return;
        case "edit":
          router.push({
            pathname: "/plants/[plantId]/schedules",
            params: { plantId: String(row.plant.id) },
          });
          return;
        case "disable":
          void performToggleEnabled(db, row.schedule.id, false);
          return;
      }
    },
    [db, handleAddDetails],
  );

  const handleDateSheetSubmit = useCallback(
    (date: Date) => {
      const row = dateSheetRow;
      const mode = dateSheetMode;
      if (!row || !mode) return;
      if (mode === "snooze") {
        void performSnoozeUntil(db, row.schedule.id, date);
      } else if (mode === "reschedule") {
        void performReschedule(db, row.schedule.id, date);
      }
    },
    [db, dateSheetRow, dateSheetMode],
  );

  return {
    state: {
      actionRow,
      actionSheetOpen,
      detailsRow,
      detailsSheetOpen,
      dateSheetMode,
      dateSheetRow,
      undo,
    },
    openMenu,
    handleQuickComplete,
    handleAddDetails,
    handleSubmitDetails,
    handleAction,
    handleDateSheetSubmit,
    handleUndo,
    handleDismissUndo,
    closeActionSheet,
    closeDetailsSheet,
    closeDateSheet,
  };
}
