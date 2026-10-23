ALTER TABLE "user" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "disabled_by" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "disabled_reason" varchar(500);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_disabled_by_user_id_fkey" FOREIGN KEY ("disabled_by") REFERENCES "user"("id") ON DELETE SET NULL;