ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "theme" jsonb;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "revision" integer DEFAULT 0 NOT NULL;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "published" jsonb;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "onboarded_at" timestamp with time zone;