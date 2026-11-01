ALTER TABLE "profile" ADD COLUMN "theme" jsonb;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "published" jsonb;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "onboarded_at" timestamp with time zone;