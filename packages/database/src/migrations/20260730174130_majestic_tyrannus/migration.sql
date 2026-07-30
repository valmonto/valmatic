CREATE TABLE "api_key" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" varchar(64) NOT NULL,
	"prefix" varchar(16) NOT NULL,
	"hashed_key" varchar(64) NOT NULL UNIQUE,
	"scopes" varchar(32)[] NOT NULL,
	"user_id" uuid NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;