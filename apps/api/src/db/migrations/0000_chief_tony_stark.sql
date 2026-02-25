CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `my_albums` (
	`id` text PRIMARY KEY NOT NULL,
	`ean` text,
	`name` text NOT NULL,
	`release_date` text,
	`rating` real DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`spotify_id` text,
	`apple_music_id` text,
	`youtube_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `my_albums_ean_unique` ON `my_albums` (`ean`);--> statement-breakpoint
CREATE TABLE `my_artists` (
	`id` text PRIMARY KEY NOT NULL,
	`isni` text,
	`name` text NOT NULL,
	`image_path` text,
	`rating` real DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`spotify_id` text,
	`youtube_username` text,
	`tiktok_username` text,
	`instagram_username` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `my_artists_isni_unique` ON `my_artists` (`isni`);--> statement-breakpoint
CREATE TABLE `my_song_albums` (
	`id` text PRIMARY KEY NOT NULL,
	`song_id` text NOT NULL,
	`album_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`song_id`) REFERENCES `my_songs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`album_id`) REFERENCES `my_albums`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `my_song_albums_unique` ON `my_song_albums` (`song_id`,`album_id`);--> statement-breakpoint
CREATE TABLE `my_song_artists` (
	`id` text PRIMARY KEY NOT NULL,
	`song_id` text NOT NULL,
	`artist_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`song_id`) REFERENCES `my_songs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_id`) REFERENCES `my_artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `my_song_artists_unique` ON `my_song_artists` (`song_id`,`artist_id`);--> statement-breakpoint
CREATE TABLE `my_songs` (
	`id` text PRIMARY KEY NOT NULL,
	`isrc` text,
	`name` text NOT NULL,
	`image_path` text,
	`release_date` text,
	`rating` real DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`spotify_id` text,
	`apple_music_id` text,
	`youtube_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `my_songs_isrc_unique` ON `my_songs` (`isrc`);--> statement-breakpoint
CREATE TABLE `anatomy_artists` (
	`id` text PRIMARY KEY NOT NULL,
	`isni` text NOT NULL,
	`name` text NOT NULL,
	`image_path` text,
	`rating` real DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `anatomy_artists_isni_unique` ON `anatomy_artists` (`isni`);--> statement-breakpoint
CREATE TABLE `anatomy_attributes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`instruction` text,
	`examples` text,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `anatomy_attributes_name_unique` ON `anatomy_attributes` (`name`);--> statement-breakpoint
CREATE TABLE `anatomy_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`song_id` text NOT NULL,
	`value` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`song_id`) REFERENCES `anatomy_songs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `anatomy_profiles_song_idx` ON `anatomy_profiles` (`song_id`);--> statement-breakpoint
CREATE TABLE `anatomy_song_artists` (
	`id` text PRIMARY KEY NOT NULL,
	`song_id` text NOT NULL,
	`artist_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`song_id`) REFERENCES `anatomy_songs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_id`) REFERENCES `anatomy_artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `anatomy_song_artists_unique` ON `anatomy_song_artists` (`song_id`,`artist_id`);--> statement-breakpoint
CREATE TABLE `anatomy_songs` (
	`id` text PRIMARY KEY NOT NULL,
	`isrc` text NOT NULL,
	`name` text NOT NULL,
	`image_path` text,
	`release_date` text NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`spotify_id` text,
	`apple_music_id` text,
	`youtube_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `anatomy_songs_isrc_unique` ON `anatomy_songs` (`isrc`);--> statement-breakpoint
CREATE TABLE `bin_songs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source_id` text,
	`asset_path` text,
	`source_url` text,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `bin_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bin_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `suno_collection_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `suno_collections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prompt_id`) REFERENCES `suno_prompts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suno_collection_prompts_unique` ON `suno_collection_prompts` (`collection_id`,`prompt_id`);--> statement-breakpoint
CREATE TABLE `suno_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `suno_generation_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`generation_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`generation_id`) REFERENCES `suno_generations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prompt_id`) REFERENCES `suno_prompts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suno_generation_prompts_unique` ON `suno_generation_prompts` (`generation_id`,`prompt_id`);--> statement-breakpoint
CREATE TABLE `suno_generations` (
	`id` text PRIMARY KEY NOT NULL,
	`suno_id` text,
	`bin_song_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bin_song_id`) REFERENCES `bin_songs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suno_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`lyrics` text,
	`style` text,
	`voice_gender` text,
	`notes` text,
	`profile_id` text,
	`rating` real DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `anatomy_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
