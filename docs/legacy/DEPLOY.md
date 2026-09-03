# Deployment

Every push to `main` auto-deploys to the VM (e.g. a Hetzner server). GitHub Actions SSHes in,
pulls the code, and rebuilds the Docker stack.

- Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
- Stack: [`compose.staging.yml`](compose.staging.yml) — Postgres, Redis, a one-shot `migrate`
  runner, `api` (scalable), `web`, `worker`.

```
git push main → Actions → ssh → cd /opt/vboilerplate && git pull && docker compose -f compose.staging.yml up -d --build
```

Ports bind to **`127.0.0.1` only** — put a reverse proxy in front:
web `3010`, api `3011`–`3015` (one per replica).

## One-time server setup

```bash
# 1. Provision an Ubuntu VM, create a deploy user
adduser deploy && usermod -aG sudo deploy

# 2. Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy   # log out/in after

# 3. Clone to /opt/vboilerplate (path is hardcoded in deploy.yml)
sudo mkdir -p /opt/vboilerplate && sudo chown deploy:deploy /opt/vboilerplate
git clone git@github.com:<org>/<repo>.git /opt/vboilerplate
```

Add a **deploy key** (`ssh-keygen -t ed25519`) to GitHub → Settings → Deploy keys so `git pull`
works non-interactively.

**4. Create `.env`** in the repo root (git-ignored, server-only). Required keys:

```dotenv
DB_USER=vboilerplate
DB_NAME=vboilerplate
DB_PASSWORD=<openssl rand -hex 32>
REDIS_PASSWORD=<secret>
REDIS_HOST=redis
REDIS_PORT=6379
IAM_REDIS_HOST=redis
IAM_REDIS_PORT=6379
IAM_REDIS_PASSWORD=<same as REDIS_PASSWORD>
IAM_JWT_SECRET=<secret>
IAM_COOKIE_SECRET=<secret>
SEED_INITIAL_EMAIL=admin@example.com
SEED_INITIAL_PASSWORD=<secret>
SEED_INITIAL_NAME=Admin
SEED_INITIAL_ORG_NAME=Acme
```

**5. Reverse proxy + TLS** (Caddy → auto Let's Encrypt). Point DNS at the server first.

```caddyfile
yourdomain.com {
    handle_path /api/* { reverse_proxy 127.0.0.1:3011 127.0.0.1:3012 }
    handle { reverse_proxy 127.0.0.1:3010 }
}
```

**6. First boot:** `docker compose -f compose.staging.yml up -d --build`

## GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions:

| Secret            | Value                                                              |
| ----------------- | ------------------------------------------------------------------ |
| `SSH_HOST`        | server IP/hostname                                                 |
| `SSH_USER`        | `deploy`                                                           |
| `SSH_PRIVATE_KEY` | private key whose public half is in `~deploy/.ssh/authorized_keys` |

```bash
ssh-keygen -t ed25519 -f gh_deploy_key -N ""
ssh-copy-id -i gh_deploy_key.pub deploy@<server-ip>
cat gh_deploy_key   # paste into SSH_PRIVATE_KEY
```

Done — pushes to `main` now deploy. Watch the **Actions** tab — but a green run only
proves the workflow finished, not which code is live. For that, ask the app:

## Which code is running?

Every image is built with `GIT_SHA=$(git rev-parse HEAD)` and `BUILT_AT` (deploy.yml passes
them as compose build args; the Dockerfiles bake them into env), and `/health` serves them
beside `status` and `uptime`:

```bash
curl -s https://yourdomain.com/api/health
# {"status":"ok","timestamp":"…","uptime":37,"sha":"1b029f6c…","shortSha":"1b029f6","builtAt":"2026-09-03T18:50:40.000Z"}
```

`sha: null` means the image was built without the arg (a local `docker compose up`, or a
workflow that dropped it) — it is never a placeholder that could pass for a real commit.

To compare against `main` from any checkout, credential-free:

```bash
pnpm deploy:status https://yourdomain.com/api --fetch
# LIVE      1b029f6 is origin/main (uptime 37s, built 2026-09-03T18:50:40.000Z)
# BEHIND    1b029f6 is 2 commit(s) behind origin/main (9c4e2a1); uptime 18.9h
# UNKNOWN   unreachable: ECONNREFUSED
```

Exit code 0 = live, 1 = behind/diverged, 2 = unknown. **Unknown is not behind**: it means
the probe failed (app down, no sha, sha not in your checkout), and the fix is to the probe,
not the deploy. Read `uptime` with the verdict — a "successful" deploy followed by an uptime
of hours means the container was never replaced, which is exactly what a swallowed
`git pull` failure looks like. The deploy workflow now runs this comparison itself after
`--wait` and fails the run when the served sha is not the one it just built.

## Operations

Run from `/opt/vboilerplate`:

```bash
docker compose -f compose.staging.yml ps                       # status
docker compose -f compose.staging.yml logs -f api worker       # logs
docker compose -f compose.staging.yml up -d --build            # manual redeploy
docker compose -f compose.staging.yml up -d --scale api=3      # scale (max 5; update proxy)
docker compose -f compose.staging.yml run --rm migrate         # run migrations manually
docker compose -f compose.staging.yml down                     # stop (add -v to wipe volumes)

# DB backup (volume: vboilerplatedb_data)
docker compose -f compose.staging.yml exec -T postgres \
  pg_dump -U vboilerplate vboilerplate | gzip > backup-$(date +%F).sql.gz
```

## Troubleshooting

- **Deploy green but the change is not live** — `pnpm deploy:status <url>`. `BEHIND` with a
  long uptime: the pull on the VPS did not move (check `git -C /opt/vboilerplate log -1` and
  the remote's credentials). `UNKNOWN no_sha`: the image was built without `GIT_SHA`.
- **SSH step fails** — check `SSH_*` secrets; test `ssh deploy@<host>`.
- **`migrate` exits non-zero** — api/worker won't start (they depend on it). Check its logs.
- **502 from proxy** — container down or wrong loopback port (`docker compose ps`).
- **Disk full** — `docker image prune -af && docker builder prune`.
