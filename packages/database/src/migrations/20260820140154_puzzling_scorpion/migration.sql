CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"org_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(32) NOT NULL,
	"token_hash" varchar(64) NOT NULL UNIQUE,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_role_check" CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
	CONSTRAINT "invitation_status_check" CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))
);
--> statement-breakpoint
CREATE INDEX "invitation_org_status_idx" ON "invitation" ("org_id","status");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_invited_by_user_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE SET NULL;