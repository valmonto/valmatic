CREATE TABLE "user_identity" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"provider" varchar(16) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_identity_provider_check" CHECK (provider IN ('apple', 'google'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_identity_provider_subject_key" ON "user_identity" ("provider","subject");--> statement-breakpoint
CREATE INDEX "user_identity_user_id_idx" ON "user_identity" ("user_id");--> statement-breakpoint
ALTER TABLE "user_identity" ADD CONSTRAINT "user_identity_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;