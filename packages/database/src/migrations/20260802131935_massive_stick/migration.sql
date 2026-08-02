CREATE TABLE "attachment" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"org_id" uuid NOT NULL,
	"subject_type" varchar(32) NOT NULL,
	"subject_id" uuid NOT NULL,
	"kind" varchar(16) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"bucket" varchar(255) NOT NULL,
	"blob_id" uuid NOT NULL,
	"thumbnail_blob_id" uuid,
	"file_name" varchar(255),
	"mime_type" varchar(255) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"waveform" jsonb,
	"uploaded_by" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "attachment_kind_check" CHECK (kind IN ('image', 'video', 'audio', 'file')),
	CONSTRAINT "attachment_status_check" CHECK (status IN ('pending', 'uploaded'))
);
--> statement-breakpoint
CREATE INDEX "attachment_org_id_idx" ON "attachment" ("org_id");--> statement-breakpoint
CREATE INDEX "attachment_subject_idx" ON "attachment" ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "attachment_status_created_idx" ON "attachment" ("status","created_at");--> statement-breakpoint
CREATE INDEX "attachment_expires_at_idx" ON "attachment" ("expires_at");--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE RESTRICT;