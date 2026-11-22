# Predeploy gate report: target v0.4.0

Date: 2026-11-22 UTC. Product: Seclume Proxy.

**Decision: hold deployment and release authorization.** This report records verification evidence and remaining gaps. A passing development/CI check does not establish public availability or authorize a merge, release tag, registry publication or deployment. The [release checklist](release-checklist.md) remains the authorization checklist; [deployment instructions](deployment.md) describe the prepared playground configuration.

## Candidate and evidence scope

- Candidate source: merged Q8 on `main`, commit `86c86b11e00cfcaefd3fcf0b02d97c1f68322a4d`.
- Q9 branch: `codex/q9-predeploy-report`. Only this report and [NOTES.md](../NOTES.md) change. Runtime, tests, dependencies, workflow definitions, Compose/Caddy configuration, PRD, LICENSE and compatibility identifiers are unchanged.
- Local commands below were run during Q9, rather than copied from Q8. Integration results must come from this branch's actual PR CI; they remain pending until recorded below. No manual workflow dispatch is used.
- Output blocks are command-output excerpts, retaining failures and warnings relevant to the gate. They omit progress noise and contain no request/response bodies, planted originals, Session Map contents or credentials. Counts/timings describe these checks, not production performance or independent detection quality.

## Gate matrix

| Gate | Local result | Q9 PR CI result |
|---|---|---|
| Complete backend pytest, including real Redis | Not run locally: Redis unavailable; established CI-only strategy retained | Pending |
| Focused startup lifespan checks | 23 passed, 1 real-Redis case deselected | Complete suite pending |
| Claims lint and uv lock consistency | Passed | Pending |
| Website tests | Original Windows checkout: 43 passed, 1 failed; temporary LF checkout: 44 passed | Pending |
| Frontend identity tests | 2 passed | Not separately configured in frontend CI |
| Website/frontend lint and production builds | Running | Pending |
| Website/frontend dependency audits | Running | Pending |
| Production HTTP identity checks | Awaiting completed local builds | Not configured in CI |
| Both Compose configurations | Passed without starting containers | Pending |
| Image build, wildcard refusal and Compose health | Blocked locally: Docker daemon unavailable | Pending |
| Lite image contents, host playground POST and private Redis | Blocked locally: Docker daemon unavailable | Pending |
| Evaluation and backend dependency audit | Assigned to CI | Pending |
| External deployment smoke / DNS / TLS / monitoring | Not run | Not covered by these CI jobs |

## Local environment and prerequisites

PowerShell on Windows; existing dependency installations and caches were used. These local runs are not a fresh-install walkthrough. CI uses Ubuntu and Node 22 for web jobs, rather than the local Node version below.

```text
node --version
v24.22.1
npm --version
11.19.1
uv --version
uv 0.13.5 (46776a95d 2026-10-21 x86_64-pc-windows-msvc)
uv run --directory backend python --version
Python 3.12.15
docker compose version
Docker Compose version v5.7.0
```

The local Docker daemon probe failed:

```text
docker info --format '{{.ServerVersion}}'
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
Local Docker daemon probe exit: 1
```

The loopback TCP probe did not reach Redis:

```powershell
uv run --directory backend python -c "import socket; s=socket.socket(); s.settimeout(2); result=s.connect_ex(('127.0.0.1',6379)); s.close(); print('Local Redis loopback reachable:', result == 0)"
```

```text
Local Redis loopback reachable: False
```

No Redis/Docker service was installed or started to work around these prerequisites. Full backend integration belongs to CI with native Redis, snapshots and AOF disabled, and a verified Caddy binary. Local unavailability is not counted as a passing integration test.

## Local command evidence

### Lock, claims and focused startup checks

```text
uv lock --project backend --check --offline
Resolved 68 packages in 5ms
exit 0

uv run --directory backend python scripts/claims_lint.py
Claims lint passed.
exit 0

uv run --directory backend pytest -q tests/test_startup_guard.py -k "not real_redis"
23 passed, 1 deselected in 8.24s
exit 0
```

The deselected case is exactly `test_loopback_startup_with_real_redis`. Its [implementation](../backend/tests/test_startup_guard.py) enters the actual application lifespan, disables NER through settings, keeps the real Redis client and requires `/readyz` to report Redis ready. It is mandatory in the complete CI suite and must not skip when Redis is absent.

### Website: original failure and controlled rerun

Original Windows checkout:

```text
npm --prefix website test
tests 44
pass 43
fail 1
skipped 0
duration_ms 3265.6245
AssertionError [ERR_ASSERTION]:
assert.ok(introduction.startsWith(`# ${PRODUCT_NAME} — PII boundary for AI agents\n`))
exit 1
```

The existing assertion at [public-site.test.mjs](../website/tests/public-site.test.mjs) expects a literal LF after the README title. The checkout contained 310 CRLF line endings. This is a reproducible Windows test-portability failure, not a changed product title. Q9 does not fix that test.

The temporary preparation and rerun used:

```powershell
uv run --directory backend python -c "from pathlib import Path; p=Path.cwd().parent/'README.md'; b=p.read_bytes(); print('README CRLF line endings:', b.count(bytes([13,10]))); p.write_bytes(b.replace(bytes([13,10]), bytes([10]))); print('Temporarily normalized README checkout to LF')"
npm --prefix website test
git restore -- README.md
```

```text
README CRLF line endings: 310
Temporarily normalized README checkout to LF
tests 44
pass 44
fail 0
skipped 0
duration_ms 27348.162
exit 0
```

README was restored afterward and is outside the Q9 diff. The initial failure remains relevant for an unmodified Windows checkout. Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings also remain; no package-module setting or dependency change was introduced.

### Frontend identity tests

```text
node --test frontend/tests/brand.test.mjs
tests 2
pass 2
fail 0
skipped 0
duration_ms 1799.565
exit 0
```

### Web lint, builds and audits

Both app sequences are running; final command results will be recorded before this report is finalized. No success is inferred from an earlier phase's build.

### Compose configuration validation

The development profile was validated against the committed environment example. The standalone profile was checked separately with temporary `SECLUME_IMAGE=aegis:predeploy-86c86b1` and `CORS_ORIGINS=http://localhost:3000`; prior shell values were restored afterward. This image name is a validation input, not evidence of a built or published image. No resolved environment or credential values were printed.

```text
docker compose --env-file .env.example -f docker-compose.yml config --quiet
Development Compose validation exit: 0

docker compose --env-file .env.example -f deploy/compose.playground.yml config --quiet
Playground Compose validation exit: 0
```

Quiet configuration validation starts no containers and proves neither networking nor health.

## Q9 PR CI: integration evidence

Pending this report branch's first PR run. Do not substitute Q8's green checks for current-branch evidence. Required jobs are backend, containers, playground-networking, website, frontend, claims and secrets, plus the separate evaluation workflow. The full backend command must be `uv run pytest -q` without a real-Redis exclusion.

The [workflow](../.github/workflows/ci.yml) supplies native Redis without snapshots/AOF and checksum-verified Caddy. Its image job must build runtime/mock images, require bounded nonzero termination with the expected refusal message for an unauthenticated wildcard bind, check Compose health and isolated playground behavior, and clean up. The separate networking job must check lite image contents, host-loopback scrubbing, private Redis and the absence of playground Telemetry Events. Workflow definitions are requirements, not execution results.

## Failures, limitations and unverified items

1. **Windows website test portability:** the original checkout fails one LF-sensitive assertion. The controlled LF rerun does not fix a fresh Windows checkout. Node module-type warnings remain.
2. **Local integration prerequisites:** Docker daemon and loopback Redis are unavailable. Compose parsing passed; local image builds, live Compose health and the complete local backend suite were not run. CI evidence must be assessed independently.
3. **Public playground:** no reviewed external API base URL was supplied for Q9. The external [smoke script](../scripts/smoke_playground.sh) was not run against a deployed service. CI/harness checks do not establish public `/healthz`, CORS, rate limits, blocked paths, DNS, TLS, firewalling or notification delivery on a real host.
4. **Release artifacts/platforms:** no v0.4.0 tag/release was created, image published or package visibility changed by Q9. Single-runner container checks do not validate both publication platforms, an exact registry digest, anonymous pulls or deployed image identity.
5. **Operator/client walkthrough:** no fresh-checkout, human-operated quickstart or third-party chat-client/provider walkthrough was performed. CI uses a clean checkout with caches; local web builds use existing installations. Automated SDK tests are separate evidence.
6. **Separate unfinished reviews:** scheduled Dependabot operation, repository/account protections, legal review of the Privacy draft, deferred T4 audit hardening, D3/D4/D5 design gates, Lighthouse targets and physical-phone inspection are not verified by this report. Existing [security-model](security-model.md) and [limitations](limitations.md) qualifications still apply.
7. **Publication trigger:** the existing publish workflow can run on a main merge independently of CI/evaluation. A draft Q9 PR does not authorize that merge, a tag, publication, workflow dispatch, hosting or account changes.

No detection-quality or production-latency claim is added. Existing numbers in [metrics.txt](metrics.txt) retain their synthetic-data qualifications. Public availability and release authorization remain separate from completing this queue item.
