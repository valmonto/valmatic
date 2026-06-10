CREATE TYPE "system_role" AS ENUM('USER', 'MODERATOR', 'ADMIN');--> statement-breakpoint
CREATE TYPE "organization_user_role" AS ENUM('OWNER', 'ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "notification_channel" AS ENUM('in_app', 'email', 'push');--> statement-breakpoint
CREATE TYPE "notification_type" AS ENUM('info', 'success', 'warning', 'error');--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"email" varchar(255) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"password_hash" varchar(255) NOT NULL,
	"phone" varchar(50),
	"system_role" "system_role" DEFAULT 'USER'::"system_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" varchar(255) NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_user" (
	"org_id" uuid,
	"user_id" uuid,
	"role" "organization_user_role" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_user_pkey" PRIMARY KEY("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"org_id" uuid,
	"type" "notification_type" DEFAULT 'info'::"notification_type" NOT NULL,
	"channel" "notification_channel" DEFAULT 'in_app'::"notification_channel" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" varchar(1000),
	"link" varchar(500),
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "organization_owner_id_idx" ON "organization" ("owner_id");--> statement-breakpoint
CREATE INDEX "organization_user_user_id_idx" ON "organization_user" ("user_id");--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "notification" ("user_id");--> statement-breakpoint
CREATE INDEX "notification_org_id_idx" ON "notification" ("org_id");--> statement-breakpoint
CREATE INDEX "notification_user_read_idx" ON "notification" ("user_id","read");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "notification" ("created_at");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization_user" ADD CONSTRAINT "organization_user_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_user" ADD CONSTRAINT "organization_user_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;