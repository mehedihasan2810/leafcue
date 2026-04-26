PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_health_observations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`observed_at` integer NOT NULL,
	`issue_type` text NOT NULL,
	`severity` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_health_observations`("id", "plant_id", "observed_at", "issue_type", "severity", "notes", "status", "created_at", "updated_at") SELECT "id", "plant_id", "observed_at", "issue_type", "severity", "notes", "status", "created_at", "updated_at" FROM `health_observations`;--> statement-breakpoint
DROP TABLE `health_observations`;--> statement-breakpoint
ALTER TABLE `__new_health_observations` RENAME TO `health_observations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `health_observations_plant_status_idx` ON `health_observations` (`plant_id`,`status`);--> statement-breakpoint
CREATE INDEX `health_observations_observed_idx` ON `health_observations` (`observed_at`);--> statement-breakpoint
UPDATE `health_observations` SET `status` = 'active' WHERE `status` = 'open';--> statement-breakpoint
UPDATE `health_observations` SET `status` = 'improving' WHERE `status` = 'monitoring';--> statement-breakpoint
ALTER TABLE `journal_entries` ADD `photo_uri` text;--> statement-breakpoint
UPDATE `journal_entries` SET `entry_type` = 'milestone' WHERE `entry_type` = 'celebration';