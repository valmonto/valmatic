# Edge protection

Rate limiting inside the app (`@nestjs/throttler`) is POLICY: per-user
fairness, login-spray limits, per-route budgets. It cannot absorb a flood —
by the time a request reaches Node, the server has already paid for it.
Volumetric protection belongs upstream, where it is nearly free.

## The stack

```
Cloudflare (free)      floods absorbed off-premises, bot filtering, edge TLS
      ↓
Caddy on the VPS       reverse proxy, real-IP restoration, optional backstop
      ↓
@nestjs/throttler      identity-aware policy (this repo)
```

## Caddy behind Cloudflare — the part everyone gets wrong

With Cloudflare proxying, the VPS sees Cloudflare's IPs. The real client IP
arrives in `CF-Connecting-IP`, and the app's `TRUST_PROXY` only helps if the
proxy in front of it forwards the truth. In the Caddyfile:

```caddyfile
{
  servers {
    trusted_proxies static <cloudflare-ip-ranges>
    client_ip_headers CF-Connecting-IP X-Forwarded-For
  }
}
```

(Cloudflare publishes its ranges at cloudflare.com/ips; several Caddy plugins
keep them updated automatically.)

Then set `TRUST_PROXY=true` on the api. Skip any link in this chain and rate
limiting sees all traffic as a handful of proxy IPs — every user shares one
bucket, and real users get 429s the moment traffic grows.

## Optional Caddy backstop

Caddy has no built-in request rate limiting; the `caddy-ratelimit` plugin adds
it if you want a local layer between Cloudflare and Node. With Cloudflare in
front it is usually unnecessary — add it when a product actually needs it
rather than by default.

## Per product

Putting a deployment behind Cloudflare is a DNS change (proxied record), not a
code change. The free tier covers DDoS absorption, TLS and caching for the
SPA's static assets, plus one rate-limiting rule if you want a coarse edge
limit on `/api/auth/*`.
