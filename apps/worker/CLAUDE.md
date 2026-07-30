Read ./README.md before changing this workspace.

- Job payloads arrive with userId and orgId attributed from the enqueuing
  session. Trust those; never accept identity from job `data`.
- BullMQ retries mean any processor can run twice for the same job — write
  handlers idempotent or guard with the job id.
- /health must reflect the worker's actual inputs (Redis). A worker that
  cannot reach its queue is not healthy.
