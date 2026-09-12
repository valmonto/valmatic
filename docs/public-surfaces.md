# Public surfaces

Where a descendant's public entry points live: the marketing site, the docs,
the app, the status page, and their staging counterparts. Decided 2026-09-12.

This is the platform layer — every descendant inherits the shape, and each one
supplies its own copy, tokens and domain. Nothing here is product-specific.

Related: [operations.md](operations.md) for the app tier,
[edge-protection.md](edge-protection.md) for what sits in front of it.

---

## The shape

```
                    PRODUCTION                        STAGING

marketing   domain.xyz                        staging.domain.xyz
            landing · /pricing · /blog        deploy --branch=staging
            /docs · /changelog · legal        behind Cloudflare Access
            └─ Cloudflare Pages, static       └─ same Astro build

app         app.domain.xyz                    app-staging.domain.xyz
            Docker stack, Caddy vhost         specbook environment
            └─ VPS, specbook-managed          └─ own database + cache

status      status.domain.xyz                 —
            Uptime Kuma, one instance,        nothing to stage
            one status page per product
            └─ NOT the provider the apps run on

ephemeral   <branch>.<project>.pages.dev      stable alias per branch,
                                              updates on every push
```

### Blog and docs are paths, not subdomains

`domain.xyz/blog` and `domain.xyz/docs`, never `blog.domain.xyz`. A subdomain
is treated as substantially its own site for ranking, so every link a docs page
earns would build authority for the docs rather than for the pages that sell.
On the apex it accrues to `/pricing` too, and the whole marketing surface stays
one project, one deploy, one header.

`app.` IS a subdomain, deliberately: different security posture, different
cookie scope, different CSP, different deploy target. Session cookies scope to
`app.domain.xyz` and never reach the marketing origin.

### Keep the environment at one subdomain level

`app-staging.domain.xyz`, not `staging.app.domain.xyz`. A `*.domain.xyz`
wildcard certificate does not cover a name three levels deep; that needs a
second wildcard or per-host certificates. On a host where certificate handling
is already awkward — see the upstream-terminator arrangement in
[operations.md](operations.md) — the extra level is a real cost for a symmetry
nobody reads.

---

## The marketing app

One Astro project per descendant, at `apps/landing`. `apps/*` is already a
workspace glob, so `pnpm verify` and the affected-verify graph pick it up with
no scripting — a landing-only change resolves to just that workspace.

| Surface                 | Built with                | Why                                                                                       |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| Landing, pricing, legal | Astro pages               | Zero JS by default; a content page that must rank cannot afford a framework runtime       |
| Docs                    | Starlight                 | Astro's own docs theme — sidebar, search, i18n INSIDE the same project                    |
| Code blocks             | Expressive Code           | Ships with Starlight: frames, filenames, line highlighting, diffs                         |
| Docs search             | Pagefind                  | Static index searched in the browser; no service, no API key                              |
| Blog, changelog         | content collections + MDX | Typed frontmatter — a post missing `description` fails the build                          |
| Interactive bits        | React islands             | Reuses the app's shadcn primitives, so marketing does not become a second design language |
| Sitemap, RSS            | `@astrojs/sitemap`, `rss` | Official integrations                                                                     |

Starlight is what settles the framework question. Without it the choice would be
Astro for marketing plus a second tool for docs; with it, marketing, blog and
docs are one build — which is the whole argument for the apex layout above.

### Zero JS is the default, not a limit

Islands hydrate per component (`client:load`, `client:visible`, `client:idle`),
and any of React, Svelte or a plain `<script>` works. The difference from a
React meta-framework is posture: nothing ships unless a component asks for it.

---

## Hosting

**Cloudflare Pages, free tier.** Static bandwidth and static requests are
unlimited and unmetered; the metered thing is Functions, and a static build
invokes none.

| Limit          | Free plan                                  |
| -------------- | ------------------------------------------ |
| Static traffic | unlimited                                  |
| Builds         | 500/month — governs _git-triggered_ builds |
| Files per site | 20,000                                     |
| Functions      | 100k/day — a static site uses zero         |

The failure mode is a hard stop, not an invoice.

### The one way this starts costing money

Astro defaults to `output: 'static'`. Adding the Cloudflare adapter with
`output: 'server'` turns **every page view into a Function invocation**.

Guard it rather than trusting convention: assert the built output contains no
`_worker.js`. Same shape as the test that pins "no remote op installs
packages" — cheap, and it makes the boundary something a person has to argue
with rather than drift past.

Forms POST to `apps/api`. Nothing dynamic belongs on the edge; the API already
exists and its cost does not change because a contact form posts to it.

### Build and deploy

Build in CI, ship with Direct Upload:

```bash
wrangler pages deploy dist --project-name=<product> --branch=main      # production
wrangler pages deploy dist --project-name=<product> --branch=staging   # preview
```

Direct Upload bypasses Cloudflare's own build system, so the 500-build cap
never applies. `--branch` on a direct upload targets a preview deployment;
every branch also gets a stable alias that follows its latest commit, which is
what makes a review-and-restyle loop workable — the URL does not move while
someone iterates.

**Build in CI, not on an app server.** A marketing build competing with the
app, the worker and any agent on the same box is self-inflicted; CI runners are
isolated and already where `verify` runs.

**The deploy workflow must no-op cleanly when the Cloudflare secrets are
absent.** Most descendants will not have a Cloudflare account. Red CI in every
one of them is worse than no landing page.

### Staging must not be indexable

Two layers: Cloudflare Access in front of the preview, and `noindex` emitted
whenever the build is not the production branch. Otherwise staging competes
with production for the same queries and unreleased pricing turns up in search
results.

Per-branch previews may make a long-lived `staging` branch unnecessary. A
persistent `staging.domain.xyz` is worth it only when you want one address to
send people to.

---

## Status

One Uptime Kuma instance monitors every product and publishes a **separate
status page per product**, each on its own domain — it is not one instance per
site. Monitors group by product; a group becomes a page.

**It must not run on the provider the apps run on.** A monitor sharing a
failure domain with what it monitors reports nothing at the moment it matters.
A small VPS at a third provider is the cleanest host; any box at a different
provider from the apps is defensible.

Whatever hosts it, add **one external free check pointed at Uptime Kuma
itself** — without it, the monitoring cannot report its own death.

| Resource | Need                             |
| -------- | -------------------------------- |
| CPU      | 1 vCPU                           |
| RAM      | 512 MB minimum, 1 GB comfortable |
| Disk     | 5 GB                             |
| Database | SQLite, bundled                  |

Set heartbeat retention at install. Twenty monitors at 60-second intervals is
roughly 29 million rows a year on the default; 30–90 days is the sane window.

Behind a Caddy that already owns `:80/:443` for something else, list the status
hostnames **explicitly** rather than reusing on-demand TLS — an `ask` endpoint
scoped to another domain will refuse them, and the certificate failure looks
like the app being broken. `header_up Host {http.request.host}` is required:
Uptime Kuma picks which status page to serve from that header.

---

## What a descendant supplies

The template ships the machinery; the product ships the meaning.

| Template                                           | Product                           |
| -------------------------------------------------- | --------------------------------- |
| Routes and page shells                             | the copy                          |
| Blog, docs and changelog engines                   | the posts, pages, entries         |
| SEO plumbing, analytics, consent module            | tokens and content                |
| Deploy workflow                                    | the domain and Cloudflare project |
| Comparison / use-case / integration page templates | which ones exist                  |

---

## Deliberately rejected

**Prerendering marketing routes out of `apps/web`.** The only serious way to
avoid a second toolchain, and the reason it loses: you would rebuild Astro's
content pipeline — markdown, collections, prerendering, sitemap, RSS — worse,
and own all of it. Recorded here so it does not come back as a fresh idea.

**A hosted docs tool.** Mintlify and friends look good immediately, and every
site built on them looks like every other one. Docs that share the product's
tokens read as part of the product; docs on someone else's domain read as
adjacent to it.

**Subdomains for blog and docs.** See above — it splits the authority the
selling pages need.
