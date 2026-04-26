# Step 3 — Care workflow implementation notes

This step turns LeafCue from a plant library into a daily care workflow. It
adds a dedicated Care Tasks queue, a calendar/agenda view, a per-plant
schedule editor, smart on-device hints, and offline local notifications via
`expo-notifications`. Everything stays local-first; no auth, tRPC, network,
or cloud sync was introduced.

## Feature summary

- **Care Tasks tab** (`screens/tasks/`) with a segmented filter
  (`Today | Overdue | Upcoming | Completed | All`), grouped section list,
  rich task cards, and an action bottom sheet.
- **Quick-complete flow**: single tap on a task's "Done" button immediately
  logs the task and shows a 4-second undo toast. Long-press (or "Add
  details" from the menu) opens a TanStack Form bottom sheet for notes,
  amount + unit, mood chips, and a photo.
- **Snooze, reschedule, skip-once, edit, disable** wired through a shared
  `useTaskHandlers` hook so Today, Tasks, and Calendar all behave the same.
  Skip-once advances `nextDueAt` only (no log) per user direction.
- **Smart hints** computed locally with deterministic heuristics. They
  surface on the schedule editor as advisory chips, never diagnoses.
- **Calendar tab** (`screens/calendar/`) with a custom month grid that
  paints accent dots for due tasks and success dots for completions, plus
  an agenda for the selected day, an Overdue segment, and a Completed
  history segment.
- **Per-plant schedule editor** (`screens/plants/schedules/`) reachable
  from the existing edit modal: list of schedules with toggle and edit,
  add/edit sheet (template chips, interval, next due, preferred reminder
  time, instructions, delete), recent completions, and inline smart hints.
- **Reminder settings** (`screens/settings/reminders/`) reached from the
  Today and Tasks headers. Toggling "Enable reminders" is the only point
  where the OS permission prompt fires, in line with the requirement to
  ask opportunistically.
- **Local notifications** scheduled via `expo-notifications`. Each
  schedule's notification id is persisted on `plantTaskSchedules` so we
  can cancel/replace it on completion, snooze, reschedule, disable, or
  delete. Reminders are clamped to the user's reminder time and shifted
  out of quiet hours.

## Schema delta

Migrated in `apps/native/drizzle/0001_small_makkari.sql` and bundled by
`apps/native/drizzle/migrations.js`. Three nullable columns added to
`plant_task_schedules`:

- `notification_id text` — OS notification identifier, so reschedules can
  cancel the correct pending notification.
- `preferred_hour integer` — 0–23, optional override for the per-schedule
  reminder hour.
- `preferred_minute integer` — 0–59, optional override for the
  per-schedule reminder minute.

`apps/native/lib/db/zod.ts` extends `plantTaskScheduleInsertSchema` to
match. New schemas:

- `taskFilterSchema`, `tasksRouteParamsSchema` for `?filter=…` route
  params on the Tasks tab.
- `reminderSettingsSchema` (and `reminderSettingsKey = "reminders.main"`)
  for the persisted user preferences.
- `notificationPreviewStyleSchema`.

## Repository surface

`apps/native/lib/db/repositories/tasks.ts` is the single source of truth
for task lifecycle and uses Drizzle transactions for every multi-step
write:

- `createSchedule`, `updateSchedule`, `deleteSchedule`,
  `enableSchedule`, `disableSchedule`.
- `getScheduleById`, `getSchedulesForPlant`, `getAllActiveScheduleRows`,
  `getDueTasks`, `getTodayDueTasks`, `getOverdueTasks`,
  `getUpcomingTasks`, `getTasksByFilter`, `getCompletedTaskLogs`,
  `getSchedulesNeedingReminders`.
- `completeTask` — transactional log insert (with optional mood-mapped
  journal entry and optional photo) and schedule update via
  `computeNextDueAt`.
- `undoCompletion` — paired transactional revert that deletes the log
  and restores the previous schedule snapshot.
- `snoozeTask`, `snoozeTaskByDays`, `rescheduleTask`, `skipTaskOnce`
  (all transactional where multi-step), `setScheduleNotificationId`.

`care-logs.ts` adds `getCareLogsForSchedule` for the schedule editor's
"recent completions" panel.

## Scheduling math (pure)

`apps/native/lib/care/scheduling.ts` exposes pure helpers used by the
repository, the notifications layer, and the UI:

- `computeNextDueAt(base, intervalDays)`
- `computeSkipOnceNextDueAt(current, intervalDays, now)` — clamped to at
  least `now + 1 day`.
- `clampToReminderTime(date, hour, minute)`
- `isInQuietHours(date, settings)` — handles wrap-around windows.
- `shiftOutOfQuietHours(date, settings)` — pushes to the configured
  end hour.
- `resolveReminderTime(due, settings, schedule)` — chooses the
  per-schedule preferred time when set, otherwise the global reminder
  time, then quiet-hours shift.
- `resolveIntervalDays(scheduleInterval, templateDefault)`.
- `medianGapDays(timestamps)` for hint heuristics.

These functions are deterministic with explicit `Date` inputs so they are
trivial to unit-test once a runner is added (none today; no `.test.ts`
files were created per the plan).

## Hint heuristics

`apps/native/lib/care/hints.ts#buildSmartHints` takes the plant, preset,
template, schedule, and last logs and emits short advisory hints:

- Suggest the preset interval range when the user's interval falls
  outside it.
- Warn when watering a pot without drainage.
- Note that low-light plants typically dry slower and may want a longer
  interval.
- Recommend tighter intervals for very small pots and looser ones for
  very large pots, where the pot size string starts with a number.
- Flag when the user's median completion gap drifts ≥ 25% from the
  schedule.
- Add a summer "direct sun" reminder, a winter "water less" hint, and a
  winter "skip fertilizer" caution.

Severity is `info | caution | warning`; the schedule editor renders these
as inline chips with matching iconography. Copy is intentionally
advisory ("care hints", not diagnoses) per user direction.

## Notification flow

`apps/native/lib/notifications/`:

- `handler.ts` calls `Notifications.setNotificationHandler` once at boot
  with banner + list, no sound, no badge.
- `permissions.ts` exposes `getPermissionStatus`,
  `requestPermissionIfNeeded`, and `ensureAndroidChannel`. Permission is
  only requested when the user toggles "Enable reminders" on the
  Reminders settings screen.
- `settings.ts` reads/writes `reminderSettingsSchema` to `app_settings`
  via the existing settings repo.
- `schedule.ts` schedules per-schedule reminders using
  `Notifications.SchedulableTriggerInputTypes.DATE` with the resolved
  reminder time, persists the returned id on the schedule, and exposes
  `scheduleScheduleReminder`, `cancelScheduleReminder`,
  `cancelAllReminders`, `syncAllReminders`, and `resyncScheduleById`.

`stores/use-reminder-store.ts` is the single Zustand entrypoint for the
UI:

- `hydrate(db)` loads settings + permission status.
- `setEnabled(db, true)` runs the OS prompt only if needed and triggers
  a full `syncAllReminders`.
- `setReminderTime`, `setQuietHours`, `setPreviewStyle` all resync when
  reminders are enabled.

`lib/db/provider.tsx` calls `configureNotificationHandler()` and
`syncAllReminders(db)` after migrations and seeds succeed (best-effort,
gated on the saved enabled flag and granted permission). It never asks
for permission on launch.

`lib/care/task-actions.ts` wraps every state-changing operation
(`performComplete`, `performUndo`, `performSnoozeDays`,
`performSnoozeUntil`, `performReschedule`, `performSkipOnce`,
`performToggleEnabled`) and follows each with `resyncScheduleById` so
notifications stay in sync.

## Screens map

```
app/(tabs)/index.tsx                → screens/today (header gear → /settings/reminders)
app/(tabs)/tasks.tsx                → screens/tasks
app/(tabs)/calendar.tsx             → screens/calendar
app/(tabs)/plants.tsx               → unchanged (library)
app/(tabs)/rooms.tsx                → unchanged

app/plants/[plantId]/edit.tsx       → screens/plants/edit
                                       (now exposes "Manage schedules")
app/plants/[plantId]/schedules.tsx  → screens/plants/schedules
app/settings/reminders.tsx          → screens/settings/reminders
```

Shared building blocks live alongside the feature folders:

- `components/grouped-task-card.tsx`, `components/care-task-icons.ts`,
  `components/task-action-sheets.tsx`, `components/undo-toast.tsx`.
- `screens/tasks/_components/{task-filter-tabs,task-section-list,task-action-sheet,quick-complete-sheet,date-prompt-sheet}.tsx`.
- `screens/calendar/_components/month-grid.tsx`.
- `screens/plants/schedules/_components/schedule-form-sheet.tsx`.
- `hooks/use-task-handlers.ts` is the single composable used by Today,
  Tasks, and Calendar to drive all actions and sheets.

## App config

- Added `expo-notifications` to `apps/native/package.json` and registered
  the plugin in `apps/native/app.json`. A development/EAS build rebuild
  is required to pick up the plugin (the app already has other native
  plugins so this matches the existing flow).

## Known limitations

- No test runner is configured in this repo, so the pure care/hint
  modules are not exercised by automated tests yet. They are designed to
  drop into vitest/jest with no mocks.
- Background fetch beyond the OS notification scheduler is not
  implemented; reminders rely entirely on `expo-notifications`. Devices
  that aggressively kill background processes may delay scheduled
  notifications.
- Notification preview style is persisted but only the "detailed" copy
  is currently emitted; toggling to "discreet" will start hiding the
  plant nickname once we surface it in `schedule.ts` content.
- The schedule editor uses a plain ISO date textfield (`YYYY-MM-DD`) for
  next-due input to keep zero new dependencies; swapping in a native
  date picker is straightforward later.
