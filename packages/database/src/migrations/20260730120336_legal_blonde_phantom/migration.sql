ALTER TABLE "user" ALTER COLUMN "system_role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "system_role" SET DATA TYPE varchar(32) USING "system_role"::varchar(32);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "system_role" SET DEFAULT 'USER';--> statement-breakpoint
ALTER TABLE "organization_user" ALTER COLUMN "role" SET DATA TYPE varchar(32) USING "role"::varchar(32);--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "type" SET DATA TYPE varchar(32) USING "type"::varchar(32);--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "type" SET DEFAULT 'info';--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "channel" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "channel" SET DATA TYPE varchar(32) USING "channel"::varchar(32);--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "channel" SET DEFAULT 'in_app';--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_system_role_check" CHECK (system_role IN ('USER', 'MODERATOR', 'ADMIN'));--> statement-breakpoint
ALTER TABLE "organization_user" ADD CONSTRAINT "organization_user_role_check" CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER'));--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_type_check" CHECK (type IN ('info', 'success', 'warning', 'error'));--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_channel_check" CHECK (channel IN ('in_app', 'email', 'push'));--> statement-breakpoint
DROP TYPE "system_role";--> statement-breakpoint
DROP TYPE "organization_user_role";--> statement-breakpoint
DROP TYPE "notification_channel";--> statement-breakpoint
DROP TYPE "notification_type";