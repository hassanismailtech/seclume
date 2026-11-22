# Q1 public identity verification

Date: 2026-11-22. Branch: `codex/q1-brand-config`. Scope: configurable public identity; Seclume remains the public name. No live deployment, account change, main-branch merge, tag or registry publication is included.

## Commands and actual output

The public configuration tests run with the current defaults and with alternate test-domain/contact values. The post-build test starts each built app on loopback, checks the emitted HTML and public endpoints, then stops the server. It sends no playground input and calls no Upstream.

```text
npm.cmd --prefix website test
ℹ tests 39
ℹ pass 39
ℹ fail 0
ℹ skipped 0

node --test frontend/tests/brand.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ skipped 0

npm.cmd --prefix website run lint
> website@0.1.0 lint
> eslint
[exit 0]

npm.cmd --prefix frontend run lint
> frontend@0.1.0 lint
> eslint
[exit 0]

npm.cmd --prefix website run build
✓ Compiled successfully in 25.3s
✓ Generating static pages using 3 workers (74/74) in 7.4s
[exit 0]

npm.cmd --prefix frontend run build
✓ Compiled successfully in 28.3s
✓ Generating static pages using 3 workers (3/3) in 1201ms
[exit 0]

node --test website/tests/brand-build.test.mjs
✔ built website uses configured origins and contacts across public routes (12387.8265ms)
✔ built dashboard displays the current brand and configured return link (2549.5094ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ skipped 0

uv run --directory backend python scripts/claims_lint.py
Claims lint passed.
```

Node emitted the existing MODULE_TYPELESS_PACKAGE_JSON warning while importing TypeScript tests; the tests passed. No package-type or dependency change is included. Initial new-test failures came from an overbroad link scan and test environment restoration, then from assuming all contacts appeared on the same page and ignoring React's text-separator comments. Those test-harness assumptions were corrected before the passing runs above.

## Alternate-configuration build check

Both apps were also rebuilt with `NEXT_PUBLIC_SITE_URL=https://identity.example.test/path?ignored=yes#fragment`. The website used `SECURITY_CONTACT_EMAIL=security@example.test`, `CONTACT_EMAIL=hello@example.test`, and `PRIVACY_CONTACT_EMAIL=privacy@example.test`. PowerShell process-local environment assignments were used; no `.env` file was changed. Commands:

```powershell
$env:NEXT_PUBLIC_SITE_URL='https://identity.example.test/path?ignored=yes#fragment'
$env:SECURITY_CONTACT_EMAIL='security@example.test'
$env:CONTACT_EMAIL='hello@example.test'
$env:PRIVACY_CONTACT_EMAIL='privacy@example.test'
npm.cmd --prefix website run build
npm.cmd --prefix frontend run build
node --test website/tests/brand-build.test.mjs
```

Actual alternate-build/test output:

```text
[website build exit 0]
✓ Generating static pages using 3 workers (74/74) in 27.1s
[frontend build exit 0]
✓ Generating static pages using 3 workers (3/3) in 4.4s
✔ built website uses configured origins and contacts across public routes (9824.9513ms)
✔ built dashboard displays the current brand and configured return link (5770.5835ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ skipped 0
```

This verifies emitted metadata/canonical/OG URLs, every sitemap URL's origin, robots, security.txt and mailbox overrides, as well as the dashboard return link. It does not verify DNS, hosting or email delivery. Default builds were restored after the alternate-configuration check, both exiting 0. Actual final output:

```text
[website default rebuild]
✓ Generating static pages using 3 workers (74/74) in 16.4s
[frontend default rebuild]
✓ Generating static pages using 3 workers (3/3) in 2.7s
node --test website/tests/brand-build.test.mjs
✔ built website uses configured origins and contacts across public routes (3318.6644ms)
✔ built dashboard displays the current brand and configured return link (2214.5664ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ skipped 0
```

## Integration limits

The full backend suite was run without excluding or skipping the mandatory real-Redis lifespan test. It **failed locally**:

```text
uv run --directory backend pytest -q --tb=short
47 failed, 240 passed, 3 warnings, 6 errors in 556.43s (0:09:16)
```

Observed diagnostics include Redis connection refusal at `localhost:6379`, `KeyError: 'CADDY_BIN'`, API 503 assertions and a ticket-stream `httpx.RemoteProtocolError`. The mandatory `test_loopback_startup_with_real_redis` failed; the six playground setup errors include real-Redis concurrency and rollover coverage. These checks were not silently skipped, weakened or replaced. Full integration verification remains blocked locally; not every failure is independently attributed in the absence of the required services. No backend code or tests were changed to mask the failures.

```text
docker info --format '{{.ServerVersion}}'
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
CADDY_BIN is not set.
```

Ubuntu WSL has no `redis-server` on PATH. No Redis, Caddy or Docker service was installed or started for Q1. The existing backend CI job provides native Redis with persistence disabled and verified Caddy, and executes the complete backend suite. Its result must be checked on the PR; configured CI is not evidence of a passing run. Container and live-hosting checks remain outside Q1 verification.

## Source boundaries

The reference audit lists remaining names/defaults/repository links with reasons. LICENSE, archived docs/PRD.md, backend code, dependency manifests/locks and workflows remain unchanged. Q2-Q9 remain queued.

## Files changed

- `CHANGELOG.md`
- `NOTES.md`
- `README.md`
- `SECURITY.md`
- `docs/CLAIMS.md`
- `docs/DESIGN.md`
- `docs/SITE_ARCHITECTURE.md`
- `docs/WEBSITE_APP_INTEGRATION.md`
- `docs/brand-reference-audit.md`
- `docs/configuration.md`
- `docs/nav.json`
- `docs/q1-verification.md`
- `docs/release-checklist.md`
- `frontend/.env.example`
- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`
- `frontend/components/TopBar.tsx`
- `frontend/lib/api.ts`
- `frontend/lib/brand.mjs`
- `frontend/tests/brand.test.mjs`
- `website/.env.example`
- `website/app/(marketing)/[...slug]/page.tsx`
- `website/app/(marketing)/page.tsx`
- `website/app/(marketing)/playground/layout.tsx`
- `website/app/.well-known/security.txt/route.ts`
- `website/app/layout.tsx`
- `website/app/robots.ts`
- `website/app/sitemap.ts`
- `website/components/GlobalNav.tsx`
- `website/components/HomePage.tsx`
- `website/components/SiteFooter.tsx`
- `website/lib/brand.mjs`
- `website/lib/contacts.mjs`
- `website/lib/site-content.ts`
- `website/tests/brand-build.test.mjs`
- `website/tests/public-site.test.mjs`
