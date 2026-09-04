# Storage — object storage & attachments for valmatic apps

**Status: shipped** (extracted from specbook's production implementation,
2026-08-02). The module lives at `packages/server/src/modules/storage`
(StorageService + StorageDriver), `apps/api/src/attachments` (protocol,
repository, subject-resolver seam), `apps/worker/src/queues/attachments-sweep`
(GC), `apps/web/src/shared/attachments` (upload/gallery kit), with contracts
in `@pkg/contracts` and the table in `@pkg/database`. The template ships it
**unwired** — `AttachmentsModule.forRoot({ subjects: {} })` in app.module —
and a feature claims a subject type with the three-line resolver registration
shown below. See `apps/api/README.md` for the wiring recipe.

Originally the design for the template's storage stack, written against the
only production implementation in the family (servicebook's `storage` +
`remote-fs` modules, reviewed 2026-07-31). Servicebook proved the shape works;
this document keeps what earned its place, names what didn't, and specifies
the generic module valmatic ships so every app (specbook attachments,
servicebook media, future apps) gets the same hardened core.

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
  bucket        varchar(255) NOT NULL default app bucket  -- per-row blob home
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
});
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
  caches a _rejected_ promise — one storage blip at boot and every upload
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

## Backends, multi-tenancy and scale — decisions made 2026-07-31

**Backend is a deployment decision, never a code decision.** The
provider-blind client means each valmatic deployment points `STORAGE_*`
wherever it wants:

| Deployment shape               | Storage                       | Config                                        |
| ------------------------------ | ----------------------------- | --------------------------------------------- |
| default (small app, one VPS)   | local rustfs container        | `STORAGE_ENDPOINT=http://rustfs:9000`         |
| heavier app / rapid growth     | OVH Object Storage / R2 / S3  | managed endpoint + keys, nothing else changes |
| big-customer isolated instance | its own rustfs on its own box | endpoint = that box                           |

Keep the compose rustfs service easy to omit (profile or documented
delete-this-block) — a deployment on managed storage should not run a
vestigial local one. `forcePathStyle` stays auto-on for custom endpoints;
OVH/R2/MinIO/rustfs all accept it.

**Per-org custom buckets / BYO org storage: rejected for now.** Org isolation
lives at the API layer + key prefixes; BYO storage would force us to store
tenant S3 credentials (the no-secrets rule broken in the worst way, with no
GitHub-App-style one-platform-key trick available) and makes their outages
our pager. The valmatic answer to "we want our data separate" is an isolated
per-customer deployment — the template makes that nearly free. Revisit only
against a signed enterprise contract.

**The one hedge shipped now: every attachment row records where its blob
lives** (`bucket` column, defaulted to the app bucket). It costs one column
and buys every future move without backfills.

**Scaling playbook for one growing SaaS** — each stage is additive, none
requires reworking the previous:

1. Local rustfs (free, fine into hundreds of GB).
2. Grow the mounted volume (block storage stretches to TBs; zero app change).
3. Migrate to managed object storage: copy objects, flip env — zero code.
   This is the expected "rapid growth" move; managed S3-class storage is the
   cheapest bill in cloud computing and sharding self-hosted nodes to avoid
   it is ops burden with no upside.
   3b. Self-hosted at scale: rustfs/MinIO cluster below the S3 API — the storage
   layer's job, app still sees one endpoint.
4. Last resort, app-level multi-backend routing: a backend registry
   (id → endpoint/bucket/keys), `backend_id` stamped on new rows, uploads go
   to the active backend, reads follow the row. Old blobs never move, no
   rebalancing exists. Possible precisely because of the per-row location
   hedge — build it only after stage 3 has concretely failed.

## Provider swaps: the contract, the check, the playbook

Implemented with the specbook build (2026-08-01); ported into this template
with the 2026-08-02 extraction (`StorageDriver` in storage.types.ts,
`pnpm storage:conformance` in packages/server).

**The contract is named twice.** `StorageDriver` (packages/server storage
types) is the compile-time half — `StorageService implements StorageDriver`,
and any future non-S3 protocol implements the same interface behind a
provider option with consumers untouched. The behavioral half is
`pnpm storage:conformance` (packages/server): a standalone script that runs
the five moves the attachments protocol actually makes — ensure-bucket,
presigned PUT exactly as a browser does it, HEAD truthfulness (what confirm
relies on), presigned GET with content-disposition, delete-and-verify-gone —
against any `STORAGE_*` endpoint and prints PASS/FAIL per step. Run it
BEFORE adopting a provider; it turns "I think R2 works" into evidence.

**Compat settings already absorbed at the seam** (StorageService, invisible
to consumers): `requestChecksumCalculation`/`responseChecksumValidation:
WHEN_REQUIRED` (the aws-sdk default CRC32 checksums break several
S3-compatibles; no-op on AWS), and `manageBucket`/`manageCors` capability
flags (default true) for providers whose tokens cannot CreateBucket or
PutBucketCors — R2 buckets are dashboard-owned; the flags turn init into a
clean no-op instead of a boot crash.

**When a check fails — severity and remedy per step:**

| Failing check       | Breaks                        | Play                                                                                                                                                                                                        |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ensure bucket       | boot init                     | Permissions model, not a bug: pre-create in the provider dashboard, set the manage flags false. Config, minutes.                                                                                            |
| presigned PUT       | every upload                  | Checksums (defused), path-style toggle, region/signature, clock skew. Config in nearly all cases.                                                                                                           |
| HEAD truthfulness   | the confirm step              | Serious: shim inside StorageService keyed by a provider option (e.g. ranged-GET parsing Content-Range). This is where a second driver implementation is BORN — from a real divergence, never speculatively. |
| content-disposition | download filenames            | Cosmetic: accept, or proxy only the download path for that provider. Non-blocking.                                                                                                                          |
| delete              | sweep, user deletion, privacy | Disqualifying. A store where delete does not delete cannot hold user files. Reject the provider.                                                                                                            |

Escalation ladder: **config knob → shim in the one seam file → reject the
provider.** Adapter classes stay deferred until rung two is reached for a
real provider — the interface shape gets extracted from a second
implementation, not guessed ahead of it.

**Sweep chunking** (documented here because it was asked): each of the three
GC predicates is bounded (batch 100 per 15-minute tick), and processed rows
leave their predicate — so the next tick's identical query naturally returns
the next chunk. No offset pagination, no memory pressure; a 10k backlog
drains itself. If mass-expiry ever gets real, the upgrade is batched
DeleteObjects (1000 keys/call) under a per-tick time budget.

## Module layout (as shipped)

```
packages/server/src/modules/storage/       — StorageService (+ §6 fixes),
                                             StorageDriver, StorageModule
packages/server/scripts/                   — storage-conformance.mjs
packages/server/…/queues/attachments-sweep — queue name + cadence constants
packages/contracts: attachment.schema.ts + constants (kinds, limits, statuses)
packages/database:  schema/attachment.ts (+ migration)
apps/api/src/attachments/                  — controller, service, repository,
                                             subject-resolver registry, tokens;
                                             app registers its subject map in
                                             app.module.ts
apps/worker/src/queues/attachments-sweep/  — the repeatable GC processor
compose.dev.yml:                           — rustfs service; STORAGE_* env in
                                             both env schemas with dev defaults
```

One delta from the original plan: the generic service/repository landed in
`apps/api/src/attachments` (following specbook's proven build) rather than a
`packages/server/attachments` module — the repository needs `@pkg/database`,
which `@pkg/server` deliberately does not depend on. The module is still
domain-blind; only its address differs. Subject types are likewise not
enumerated in contracts constants: the resolver map registered at the
composition root is the single source of truth (an unregistered type → 400),
so the table carries CHECKs for `kind`/`status` but not `subject_type`.

REST surface (org-scoped, permission-gated like every module):

```
POST   /attachments/uploads        declare → pending row + presigned PUT(s)
POST   /attachments/:id/confirm    HEAD-verify → uploaded
GET    /attachments?subjectType=&subjectId=   list (uploaded only) + read URLs
GET    /attachments/:id/read-url   presigned GET (optional filename)
DELETE /attachments/:id            delete object, soft-delete row
```

Rollout order (as executed in specbook, 2026-08-01; the template port
followed the same sequence): (1) port `StorageService` with §6 fixes + unit tests;
(2) contracts + schema + migration; (3) attachments module with the pending →
confirm protocol + subject-resolver seam + service tests (orphan, size
mismatch, unknown subject, org isolation); (4) worker sweep; (5) compose/env;
(6) first consumer: specbook task attachments (`subject_type='task'`,
screenshots on review summaries — MCP tool `attach_file` can follow).
Servicebook migrates to the generic module opportunistically, not tomorrow.
