# Operations playbook

What today's architecture already handles, what breaks first, and what to do
when it does. Each section is a decision made in advance: **WHEN this trigger
fires → DO this → it COSTS that.** Nothing here is work to do now — except
backups, which are a live gap (see `GAPS.md`).

Written 2026-07-30 against the architecture as of that date. Prices are
Hetzner-class and approximate.

---

## The shape today

One VPS per deployment: Postgres, Redis, api, worker and the static web build
in one compose file, Caddy in front, Cloudflare proxying the domain
(anycast entry, edge TLS, cached assets — see
[edge-protection.md](./edge-protection.md)).

What is already scale-ready, by design:

- **api is stateless** — JWTs verify locally; sessions, rate limits and queues
  live in Redis. N replicas need no sticky sessions and no code changes.
- **Workers scale by running more of them** — BullMQ consumers compete for
  jobs; no coordinator needed.
- **The SPA is static files** — behind Cloudflare it costs nothing at any
  scale.
- **Multi-tenancy is org-scoped rows in one Postgres** — the model that
  carries SaaS products to millions in ARR before sharding is a word.

---

## Durability

**The gap:** Postgres lives in a Docker volume on one machine. Until backups
exist, one disk failure is total, unrecoverable loss of every customer's data.
This is the only genuinely urgent item in this document.

| Tier | What                                                                                                                                                                               | Trigger                                   | Cost         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------ |
| 1    | Nightly `pg_dump` → object storage (Hetzner Storage Box / Cloudflare R2 / Backblaze B2), 30-day retention, **and a tested restore** — an unrestored backup is a hope, not a backup | **before any paying customer** (~2h)      | ~€1–5/mo     |
| 2    | WAL archiving (pgBackRest) → point-in-time recovery: "restore to 14:32, right before the bad migration"                                                                            | first serious customers                   | same storage |
| 3    | Managed Postgres (Neon, Supabase, DO) — PITR, failover, someone else's pager. Neon is a drop-in `DATABASE_URL` change                                                              | when €25–50/mo is trivial against revenue | €25–50/mo    |

Backups live in a **different location** than the primary (e.g. primary
Falkenstein, backups Helsinki). Same provider is fine; same building is not.

**Redis needs less:** losing it logs everyone out and re-runs idempotent jobs
(worker rules already require idempotency). AOF persistence on, done.

**Future file uploads:** S3-compatible object storage from day one (R2 has no
egress fees). Never the VPS disk — non-negotiable whenever the feature lands.

---

## Capacity and cost

| Stage                              | Paying orgs | Total users | Concurrent | Infra                                                                                  | ~€/mo   |
| ---------------------------------- | ----------- | ----------- | ---------- | -------------------------------------------------------------------------------------- | ------- |
| MVPs (several products on one box) | 0–10        | <100        | <20        | one shared 4 GB VPS                                                                    | 5–8     |
| Early traction                     | 10–100      | 100–1k      | 20–100     | one 8 GB VPS                                                                           | 15      |
| Real business                      | 100–1k      | 1k–10k      | 100–1k     | 16 GB dedicated-vCPU, or app box + DB box                                              | 30–60   |
| Serious                            | 1k–10k      | 10k–100k    | 1k–10k     | 2–3 api replicas + LB, managed Postgres, dedicated limiter Redis (the env seam exists) | 150–500 |
| Beyond                             | >10k        | >100k       | >10k       | read replicas, partitioning — a re-architecture conversation                           | 1k+     |

Context for the numbers: a Fastify+Postgres app does hundreds of req/s per
instance on modest hardware, and a B2B user generates a fraction of a req/s.
At $20/user/mo, the entire $20–50k/yr goal fits in the €15 tier; infra stays
under ~1% of revenue at every stage.

---

## What breaks first, in order

1. **The deploy model, not the runtime.** `git pull && compose up --build` on
   the production box: images built on the serving machine, no rollback.
   **Fix:** build images in CI, push to a registry, pull on the box. ~½ day.
   **Trigger:** real customers who notice deploys, or the first bad deploy.
2. **Single-box contention.** Postgres, Redis, api and worker sharing cores.
   **Fix:** €30 of vertical growth, or move Postgres to its own box on the
   private network. No code changes. **Trigger:** sustained CPU/IO pressure.
3. **Unbounded `notification` growth.** The one table with no retention.
   **Fix:** a scheduled cleanup job. **Trigger:** the table is top-3 by size.
4. **Postgres write ceiling.** The genuine limit, far past every other row of
   the capacity table. By then this document has been rewritten anyway.
5. **bcrypt on login spikes.** CPU-bound; only visible during marketing-driven
   signup bursts. **Fix:** api replicas, which already work.

---

## Scaling out (load balancing)

**Phase 1 — replicas on one box (€0).** Prerequisite: **Caddy moves into the
compose file** and becomes the only service publishing ports; api replicas
carry `expose` only (no host ports — replicas cannot share one). Then:

```yaml
services:
  api:
    deploy: { replicas: 3 }
    expose: ['3000'] # internal network only
```

```caddyfile
app.example.com {
  reverse_proxy {
    dynamic a api 3000        # re-resolves Docker DNS → all replicas
    lb_policy round_robin
    health_uri /health
    health_interval 5s
  }
}
```

Worth doing for **zero-downtime rolling deploys** even before load demands it.

**Phase 2 — multiple boxes (~€6/mo).** api containers on 2–3 VPSes joined by
a Hetzner private network; a Hetzner Cloud Load Balancer in front (managed
health checks beat being your own LB's admin). Postgres and Redis stay on
their own box. Workers need no LB at all.

**Two rules the moment replicas exist:**

- **Migrations run once, not per replica** — a one-shot job before rolling,
  never in each container's startup.
- **Nothing in-process.** Any future cache or counter kept in memory silently
  breaks at `replicas: 2`. Redis or nowhere — the codebase already follows
  this; protect it.

---

## Geography

Layered, and the first two layers are already shipped:

| Layer                                          | Status                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Static assets + TLS at the user's nearest edge | done — Cloudflare anycast                                                                    |
| API from one EU origin                         | ~100ms extra from the US, ~150–250ms from Asia — acceptable for a dashboard with SWR caching |
| Regional presence                              | **cells**, when a region pays for it                                                         |

**The cell model:** a region = a full independent stack (own Postgres, Redis,
api, worker — the same compose file on a box in that region). Organizations
are _homed_ to one cell; there is no cross-region data sync, which is exactly
why it stays simple — and "EU data never leaves the EU" becomes a compliance
feature that enterprise buyers pay for.

**Routing between cells is DNS-level, not a load balancer.** A load balancer
can only balance traffic that already reached it; a Caddy in Germany cannot
"balance" a Sydney user to Australia without routing them through Germany
first. Caddy balances _within_ a cell; _which_ cell is decided upstream:

- simplest: per-region subdomains (`eu.app.com`, `us.app.com`) — login
  redirects to the org's home. €0.
- single domain (`app.com` everywhere): a Cloudflare Worker (~50 lines) reads
  a region claim set at login and proxies to the right origin. ~€5/mo. This
  is real shard routing — the same pattern global SaaS uses, minus the
  private fiber.

**What never to build at this scale:** multi-master Postgres,
Cockroach/Spanner-class systems, edge databases, or geo-replicas over a
single EU-primary (multi-region complexity, single-region write latency).
The cell model exists to refuse that entire problem.

---

## Region picks

The rule everywhere: deploy at the region's interconnection hub.

| Region         | City                           | Why                                                                                                                             | Providers             |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| EU             | **Falkenstein/Nuremberg (DE)** | Frankfurt interconnect = best average EU latency; Hetzner pricing; "hosted in Germany" sells to DACH, the biggest EU B2B market | Hetzner               |
| US (first box) | **Ashburn, VA**                | densest interconnection in America; ~90ms to EU; gateway to LatAm                                                               | Hetzner US, Vultr, DO |
| US west        | Hillsboro / San Jose           | only when West-Coast latency complaints are real                                                                                | Hetzner, Vultr        |
| Canada         | Toronto (or Montreal)          | ~70% of population within 20ms; "data stays in Canada" sells to public sector                                                   | OVH, Vultr, DO        |
| Mexico         | serve from Dallas, TX          | ~30–40ms is fine; in-country (Querétaro) only on regulatory demand                                                              | —                     |
| South America  | Miami first, then São Paulo    | Miami covers north LatAm; São Paulo when Brazil pays (infra there costs 2–3×; LGPD ≈ GDPR, in-country sells)                    | Vultr, DO             |
| SE Asia        | Singapore                      | the region's Frankfurt                                                                                                          | Hetzner SG, Vultr, DO |
| Australia/NZ   | Sydney                         | covers AU+NZ; does NOT cover Asia (90ms+ to SG)                                                                                 | Vultr, DO, AWS        |
| Japan          | Tokyo                          | when Japan is a real market — latency-picky, pays well                                                                          | Vultr, Linode         |

US state choice is purely network physics — no US state requires in-state
data; CCPA follows the user, not the server.

**Realistic sequence: Falkenstein → Ashburn → Singapore or Sydney → on
demand.** Each is the same compose file, a cell, and a route. The trigger for
every row is paying customers in that region complaining or their regulators
requiring it — never the map itself.
