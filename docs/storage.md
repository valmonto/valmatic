# Storage — object storage & attachments for valmatic apps

Design for the template's storage stack, written against the only production
implementation in the family (servicebook's `storage` + `remote-fs` modules,
reviewed 2026-07-31). Servicebook proved the shape works; this document keeps
what earned its place, names what didn't, and specifies the generic module
valmatic ships so every app (specbook attachments, servicebook media, future
apps) gets the same hardened core.

## The architecture that stays

Servicebook's split is right and we keep it:

1. **`StorageService`** (packages/server) — a thin, provider-blind S3 client:
   presigned PUT/GET URLs, ensure-bucket + CORS on first use, object/prefix
   deletes. Works against rustfs today (S3-compatible, runs on the VPS beside
   the app), and against real S3/R2 tomorrow by changing env vars only. The
   API never proxies file bytes — clients upload and download **directly
   against presigned URLs**, so app CPU/memory stay out of the data path.
   This is the scalability decision, and it's already correct.
2. **A metadata table + domain service** on top — files are rows first;
   the object store holds only opaque `blobId` blobs. All authorization,
   listing and lifecycle run through Postgres; the store is never listed to
   answer a user query.
3. **rustfs in compose** with `STORAGE_*` env (endpoint, region, keys, bucket,
   force-path-style, CORS origins) — carried over as-is.

Good details worth preserving verbatim: fail-fast S3 client timeouts
(`maxAttempts: 2`, connection/request timeouts — a dead endpoint must not
hang the request pipeline), thumbnail-blob support uploaded by the client
(server never does image processing), the voice-waveform jsonb trick, and
paged `deleteDirectory` for prefix cleanup.

## What was weak — and what replaces it

### 1. Orphaned uploads: rows exist before bytes do (worst gap)

Servicebook creates the media row at **sign time**. If the client never PUTs
(closed tab, lost connection), the row is indistinguishable from a real file
— readers 404 at the storage layer, and nothing ever cleans up. There is no
status column, no confirmation step, and no sweeper.

**Replacement — the three-step upload protocol:**

```
POST /attachments/uploads      → row status='pending', presigned PUT returned
client PUTs bytes              → direct to storage, API not involved
POST /attachments/:id/confirm  → server HEADs the object, verifies size/mime
                                 against what was declared, flips to 'uploaded'
```

Reads and lists serve `uploaded` only. `pending` is an implementation detail
invisible to every consumer.

### 2. Nothing enforces size or type

`sizeBytes`/`mimeType` are client-declared and never checked — a presigned
PUT cannot cap Content-Length. The confirm step fixes this cheaply: HEAD the
object, compare `ContentLength`/`ContentType` against the declaration and the
per-kind limits, delete the object and reject the confirm on mismatch. Limits
live in `@pkg/contracts` constants (e.g. image 10 MB, video 200 MB, file
25 MB) so web and mobile validate before uploading.

### 3. No cleanup of any kind

`expiresAt` has a column and an index — and no job. Soft-deleted rows keep
their objects forever. Entity cascades delete rows but strand objects.

**Replacement — one repeatable BullMQ sweep** (the template's worker already
runs BullMQ) with three predicates:

- `pending` older than 24 h → delete row + best-effort object delete
- `expiresAt < now()` → delete object, soft-delete row
- `deletedAt` older than 7 d → delete object, hard-delete row

Plus: the key layout below makes subject deletion a single prefix delete, so
domain code can call `deleteDirectory` when it removes a subject.

### 4. Domain coupling — the module can't be reused

Servicebook's `media` table hardwires `repairId NOT NULL` + work-record +
comment FKs. Fine for one app, useless as a template. The generic table:

```
attachment
  id            pk uuidv7
  org_id        uuid NOT NULL → organization (cascade)   -- tenancy wall
  subject_type  varchar(32)  NOT NULL                     -- 'task', 'repair', …
  subject_id    uuid         NOT NULL                     -- polymorphic, no FK
  kind          varchar(16)  NOT NULL                     -- image|video|audio|file
  status        varchar(16)  NOT NULL default 'pending'   -- pending|uploaded
  blob_id       uuid NOT NULL
  thumbnail_blob_id uuid
  waveform      jsonb
  mime_type     varchar(255) NOT NULL
  size_bytes    bigint NOT NULL                           -- verified at confirm
  uploaded_by   uuid NOT NULL → user (restrict)
  expires_at    timestamptz
  created_at / deleted_at
  index (org_id), index (subject_type, subject_id), index (status, created_at),
  index (expires_at)
```

varchar + CHECK from contracts constants — **not pgEnum** (servicebook used
`pgEnum`, violating the template's own convention; don't copy that).

The polymorphic subject has no FK, so the generic module can't verify a
subject exists or belongs to the org. That's the app's knowledge, injected:

```ts
// App registers one resolver per subject type it supports.
AttachmentsModule.forRoot({
  subjects: {
    task: (subjectId, orgId) => taskRepository.existsInOrg(subjectId, orgId),
  },
})
```

Unknown `subject_type` → 400. Resolver false → 404. The module stays
domain-blind; each app's registration is 3 lines.

### 5. Flat key namespace

`media/{blobId}` says nothing. New layout:

```
org/{orgId}/{subjectType}/{subjectId}/{blobId}
```

Tenant wipe = one prefix delete. Subject cleanup = one prefix delete.
Per-tenant storage accounting later = list by prefix. Costs nothing today.

### 6. Small but real bugs/gaps in the current code

- **Memoized bucket-init caches failure**: `bucketReady ??= ensureBucket…()`
  caches a *rejected* promise — one storage blip at boot and every upload
  fails until restart. Reset the memo on rejection.
- Signed reads don't set `ResponseContentDisposition`/`ResponseContentType` —
  downloads arrive with blob names. Accept an optional `filename` on the
  read-URL call.
- `region`/`forcePathStyle` handling is fine; keep `forcePathStyle` defaulting
  to true whenever a custom endpoint is set (rustfs needs it).

## Deliberate non-goals (write them down so nobody "fixes" them)

- **No multipart upload** until an app actually ships >200 MB files.
- **No image processing server-side** — thumbnails are the client's job
  (servicebook's pattern, keep it).
- **No public-bucket mode for now** — everything presigned, 15 min expiry;
  avatars can revisit this with a long-lived public prefix if URL churn ever
  hurts. `publicBaseUrl` stays in options as the seam.
- **No GitHub-hosted attachments** (evaluated for specbook, rejected): issue
  attachments have no official upload API, repo commits bloat clones forever,
  and quasi-public user-content URLs leak private-org screenshots. rustfs
  inside the tenancy walls is the answer; GitHub gets links, never bytes.

## Module layout (implementation plan)

```
packages/server/src/modules/storage/       — port from servicebook + fixes §6
packages/server/src/modules/attachments/   — generic: service, repository seam,
                                             subject-resolver registry, tokens
packages/contracts: attachment.schema.ts + constants (kinds, limits, statuses)
packages/database:  schema/attachment.ts (+ migration)
apps/api/src/attachments/                  — controller (declare/confirm/list/
                                             read-url/delete), app's subject map
apps/worker:                               — attachments-sweep repeatable job
compose*.yml:                              — rustfs service + STORAGE_* env
                                             (copy servicebook's block; new env
                                             schema entries with dev defaults)
```

REST surface (org-scoped, permission-gated like every module):

```
POST   /attachments/uploads        declare → pending row + presigned PUT(s)
POST   /attachments/:id/confirm    HEAD-verify → uploaded
GET    /attachments?subjectType=&subjectId=   list (uploaded only) + read URLs
GET    /attachments/:id/read-url   presigned GET (optional filename)
DELETE /attachments/:id            delete object, soft-delete row
```

Rollout order tomorrow: (1) port `StorageService` with §6 fixes + unit tests;
(2) contracts + schema + migration; (3) attachments module with the pending →
confirm protocol + subject-resolver seam + service tests (orphan, size
mismatch, unknown subject, org isolation); (4) worker sweep; (5) compose/env;
(6) first consumer: specbook task attachments (`subject_type='task'`,
screenshots on review summaries — MCP tool `attach_file` can follow).
Servicebook migrates to the generic module opportunistically, not tomorrow.
