# apps/worker — agent notes

Read `./README.md` before changing this workspace.

- Job payloads arrive with `userId` and `orgId` attributed from the enqueuing
  session — trust them, never accept identity from job `data`.
- `/health` must reflect the worker's actual inputs (Redis); a worker that
  cannot reach its queue is not healthy.
