# caddy/ — the app's front door

One Caddy in front of the app. It does two jobs, and nothing else sits between
the visitor's proxy and the api:

```
          ┌──────────────────── caddy :3000 ────────────────────┐
request → │ /api*, /health*  → every api copy (load-balanced)   │ → api, api, …
          │ everything else  → the built web app, from /srv     │
          └─────────────────────────────────────────────────────┘
```

The web app is static files; it has no container of its own. `Dockerfile`
builds `apps/web` and copies `dist/` into the Caddy image, so one image is the
whole front of a release.

| File            | What                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------- |
| `app.caddy`     | The rules, as a snippet: security headers, `/api` load balancing, caching, `index.html`.     |
| `Caddyfile`     | Deployed: plain http on `:3000`, imports the snippet.                                        |
| `e2e.Caddyfile` | `compose.e2e.yml` only: the same snippet over HTTPS with Caddy's internal CA.                |
| `Dockerfile`    | Builds the web app, then `caddy:<exact version>` with the files and the three configs above. |

## The rules

- **`/api`, `/health`** go to every address Docker's DNS has for `api`,
  refreshed every 5 s, so `--scale api=N` and a redeploy need no reload.
  Round robin, active health checks on `/health`. When a copy goes away
  mid-deploy, a request tries the others and waits up to 10 s for a healthy
  one instead of answering 502. Measured: 400 of 400 requests succeeded while
  each of two copies was stopped and started in turn, and with both down a
  waiting request was answered 0.3 s after one came back.
- **Body limit** on `/api`: 64 MB (each route keeps its own, smaller one).
- **The visitor's address**: `X-Forwarded-For` is replaced with `{client_ip}`,
  which the api reads with `TRUST_PROXY=true`. That is the peer's address, or
  the `X-Client-IP` a trusted proxy sent. Trusted proxies come from
  `GATEWAY_TRUSTED_PROXIES` (default `127.0.0.1/32`: nobody), so a visitor who
  connects directly cannot claim to be someone else.
- **The web app**: files under `/assets/` (named by content) are cached for a
  year; everything else is `no-cache`, so a deploy shows at once. A path with
  an extension gets the file or a real 404; any other path is a screen of the
  app and gets `index.html`.
- **Headers**: CSP (no `eval`, scripts only from this origin), HSTS,
  `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; no
  `Server`.

## Settings (environment)

| Variable                  | Default        | When to set it                                               |
| ------------------------- | -------------- | ------------------------------------------------------------ |
| `GATEWAY_TRUSTED_PROXIES` | `127.0.0.1/32` | Behind a proxy that sets `X-Client-IP`: its addresses/CIDRs. |
| `API_HOST`                | `api`          | The api's service name, if it is not `api`.                  |
| `API_PORT`                | `3000`         | The api's port (e2e uses 3001).                              |

`VITE_*` values are build-time (`--build-arg`), because Vite inlines them.

## Running it

- **Your own server** (`compose.staging.yml`): caddy is the only service with
  a port (`GATEWAY_HOST_PORT`, default 3010 on 127.0.0.1); the api runs
  `API_REPLICAS` copies (default 2) with no host ports. Put TLS in front: a
  Caddy on the host, or Cloudflare. To serve the internet directly from this
  port, set `GATEWAY_BIND=0.0.0.0`.
- **Specbook**: Specbook's server Caddy holds the certificates and sends each
  domain to the app's caddy.
- **Locally**: `pnpm dev` uses Vite's dev server, not this.

## Changing it

Validate before pushing:

```bash
docker build -f caddy/Dockerfile -t gw .
docker run --rm gw caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker run --rm gw caddy validate --config /etc/caddy/e2e.Caddyfile --adapter caddyfile
```

`pnpm e2e:docker` runs the suite through this image. The Caddy version is
exact; the weekly dependency task bumps it.
