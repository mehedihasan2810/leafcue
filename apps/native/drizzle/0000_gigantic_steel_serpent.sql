CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `care_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`schedule_id` integer,
	`template_id` integer,
	`type` text NOT NULL,
	`title` text,
	`notes` text,
	`completed_at` integer NOT NULL,
	`amount` real,
	`unit` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_id`) REFERENCES `plant_task_schedules`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`template_id`) REFERENCES `care_task_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `care_logs_plant_completed_idx` ON `care_logs` (`plant_id`,`completed_at`);--> statement-breakpoint
CREATE INDEX `care_logs_schedule_idx` ON `care_logs` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `care_logs_template_idx` ON `care_logs` (`template_id`);--> statement-breakpoint
CREATE TABLE `care_task_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`default_interval_days` integer,
	`default_instructions` text,
	`color_key` text,
	`is_built_in` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `care_task_templates_key_unique` ON `care_task_templates` (`key`);--> statement-breakpoint
CREATE TABLE `growth_measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`measured_at` integer NOT NULL,
	`height_cm` real,
	`leaf_count` integer,
	`bloom_count` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `growth_measurements_plant_measured_idx` ON `growth_measurements` (`plant_id`,`measured_at`);--> statement-breakpoint
CREATE TABLE `health_observations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`observed_at` integer NOT NULL,
	`issue_type` text NOT NULL,
	`severity` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `health_observations_plant_status_idx` ON `health_observations` (`plant_id`,`status`);--> statement-breakpoint
CREATE INDEX `health_observations_observed_idx` ON `health_observations` (`observed_at`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer,
	`title` text,
	`body` text NOT NULL,
	`mood` text,
	`entry_type` text DEFAULT 'note' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `journal_entries_plant_created_idx` ON `journal_entries` (`plant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `journal_entries_type_idx` ON `journal_entries` (`entry_type`);--> statement-breakpoint
CREATE TABLE `onboarding_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plant_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`uri` text NOT NULL,
	`caption` text,
	`taken_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`type` text DEFAULT 'journal' NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `plant_photos_plant_taken_idx` ON `plant_photos` (`plant_id`,`taken_at`);--> statement-breakpoint
CREATE INDEX `plant_photos_type_idx` ON `plant_photos` (`type`);--> statement-breakpoint
CREATE TABLE `plant_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`common_name` text NOT NULL,
	`scientific_name` text,
	`care_difficulty` text,
	`light` text,
	`water` text,
	`humidity` text,
	`temperature` text,
	`soil` text,
	`fertilizer` text,
	`pet_toxicity` text,
	`care_summary` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plant_presets_common_scientific_idx` ON `plant_presets` (`common_name`,`scientific_name`);--> statement-breakpoint
CREATE TABLE `plant_task_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`template_id` integer,
	`custom_name` text,
	`interval_days` integer,
	`next_due_at` integer,
	`last_completed_at` integer,
	`snoozed_until` integer,
	`is_enabled` integer DEFAULT true NOT NULL,
	`instructions` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `care_task_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `plant_task_schedules_plant_due_idx` ON `plant_task_schedules` (`plant_id`,`next_due_at`);--> statement-breakpoint
CREATE INDEX `plant_task_schedules_enabled_due_idx` ON `plant_task_schedules` (`is_enabled`,`next_due_at`);--> statement-breakpoint
CREATE INDEX `plant_task_schedules_template_idx` ON `plant_task_schedules` (`template_id`);--> statement-breakpoint
CREATE TABLE `plants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nickname` text NOT NULL,
	`common_name` text,
	`scientific_name` text,
	`species_preset_id` integer,
	`photo_uri` text,
	`room_id` integer,
	`shelf_id` integer,
	`notes` text,
	`acquired_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`archived_at` integer,
	`care_difficulty` text,
	`toxicity` text,
	`light_preference` text,
	`watering_preference` text,
	`soil_type` text,
	`pot_type` text,
	`pot_size` text,
	`has_drainage` integer,
	`is_favorite` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`species_preset_id`) REFERENCES `plant_presets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`shelf_id`) REFERENCES `shelves`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `plants_archived_at_idx` ON `plants` (`archived_at`);--> statement-breakpoint
CREATE INDEX `plants_room_shelf_idx` ON `plants` (`room_id`,`shelf_id`);--> statement-breakpoint
CREATE INDEX `plants_species_preset_idx` ON `plants` (`species_preset_id`);--> statement-breakpoint
CREATE INDEX `plants_is_favorite_idx` ON `plants` (`is_favorite`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rooms_sort_order_idx` ON `rooms` (`sort_order`);--> statement-breakpoint
CREATE TABLE `shelves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` integer NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `shelves_room_id_idx` ON `shelves` (`room_id`);--> statement-breakpoint
CREATE INDEX `shelves_room_sort_idx` ON `shelves` (`room_id`,`sort_order`);