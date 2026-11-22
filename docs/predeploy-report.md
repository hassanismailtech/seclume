# Predeploy gate report: target v0.4.0

Date: 2026-11-22 UTC. Product: Seclume Proxy.

**Decision: hold deployment and release authorization.** This report records verification evidence and remaining gaps. A passing development/CI check does not establish public availability or authorize a merge, release tag, registry publication or deployment. The [release checklist](release-checklist.md) remains the authorization checklist; [deployment instructions](deployment.md) describe the prepared playground configuration.

## Candidate and evidence scope

- Candidate source: merged Q8 on `main`, commit `86c86b11e00cfcaefd3fcf0b02d97c1f68322a4d`.
- Q9 branch: `codex/q9-predeploy-report`. Only this report and [NOTES.md](../NOTES.md) change. Runtime, tests, dependencies, workflow definitions, Compose/Caddy configuration, PRD, LICENSE and compatibility identifiers are unchanged.
- Local commands below were run during Q9, rather than copied from Q8. Integration evidence is from [Q9 PR #73](https://github.com/hassanismailtech/seclume/pull/73), head `9ee6b1663866f7251dc2eb8a08f8c55cabf49d68`, checked out by Actions through merge ref `ea1a728c88e9a2f1cdbefcf2c6ab142a1ce20f8e`. No manual workflow dispatch is used.
- That tested head differs from the candidate only in the two report/notes files. The later evidence update also changes only those files. The job outputs below belong to the named tested head, not to a future self-referencing documentation commit. Recheck the PR's final-head checks before any later approval.
- Initial PR #73 was merged before its pending evidence sections were finalized. This documentation follow-up supplies the completed results. Merged main `b0b680c` still has the candidate's runtime/tests/dependencies/workflows/deployment source; only report/notes differ.
- Output blocks are command-output excerpts, retaining failures and warnings relevant to the gate. They omit progress noise and contain no request/response bodies, planted originals, Session Map contents or credentials. Counts/timings describe these checks, not production performance or independent detection quality.

## Gate matrix

| Gate | Local result | Q9 PR CI result |
|---|---|---|
| Complete backend pytest, including real Redis | Not run locally: Redis unavailable; established CI-only strategy retained | 293 passed, 3 warnings; no skips/deselection |
| Focused startup lifespan checks | 23 passed, 1 real-Redis case deselected | Included in complete passing suite |
| Claims lint and uv lock consistency | Passed | Claims and frozen backend installation passed |
| Website tests | Original Windows checkout: 43 passed, 1 failed; temporary LF checkout: 44 passed | Passed |
| Frontend identity tests | 2 passed | Not separately configured in frontend CI |
| Website/frontend lint and production builds | Both passed | Both passed |
| Website/frontend dependency audits | Both full audits: zero vulnerabilities | Both production audits passed |
| Production HTTP identity checks | 2 passed | Not configured in CI |
| Both Compose configurations | Passed without starting containers | Both passed |
| Image build, wildcard refusal and Compose health | Blocked locally: Docker daemon unavailable | Passed |
| Lite image contents, host playground POST and private Redis | Blocked locally: Docker daemon unavailable | Passed |
| Evaluation and backend dependency audit | Assigned to CI | Passed |
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

```text
npm --prefix frontend run lint
exit 0
npm --prefix frontend run build
Compiled successfully in 7.4s
Finished TypeScript in 29.5s
Generating static pages using 3 workers (3/3) in 2.6s
exit 0
npm --prefix frontend audit --audit-level=moderate
found 0 vulnerabilities
exit 0

npm --prefix website run lint
exit 0
npm --prefix website run build
Compiled successfully in 32.6s
Finished TypeScript in 84s
Generating static pages using 3 workers (72/72) in 23.2s
exit 0
npm --prefix website audit --audit-level=moderate
found 0 vulnerabilities
exit 0
```

Production HTTP tests ran after both builds, using temporary loopback-only Next servers which the test cleanup stopped:

```text
node --experimental-strip-types --test website/tests/brand-build.test.mjs
built website uses configured origins and contacts across public routes (18024.3793ms)
built dashboard displays the current brand and configured return link (20230.4326ms)
tests 2
pass 2
fail 0
skipped 0
duration_ms 40852.7329
exit 0
```

These checks cover rendered product titles/Open Graph names, canonical origins, configured contacts and the dashboard return link. They are local HTTP checks, not production deployment, API availability, Lighthouse or physical-phone checks.

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

Observed [CI run 45077187733](https://github.com/hassanismailtech/seclume/actions/runs/45077187733) and [evaluation run 45077187736](https://github.com/hassanismailtech/seclume/actions/runs/45077187736) both completed with conclusion `success`. These are Q9 runs for head `9ee6b1663866f7251dc2eb8a08f8c55cabf49d68` and merge ref `ea1a728c88e9a2f1cdbefcf2c6ab142a1ce20f8e`, not reused Q8 results.

| Job | Actual conclusion | Evidence |
|---|---|---|
| backend | success | [Job 137376926748](https://github.com/hassanismailtech/seclume/actions/runs/45077187733/job/137376926748): native Redis, verified Caddy, complete suite and dependency audit |
| containers | success | [Job 137376926729](https://github.com/hassanismailtech/seclume/actions/runs/45077187733/job/137376926729): runtime/mock builds, wildcard refusal, Compose health, isolated playground and cleanup |
| playground-networking | success | [Job 137376926681](https://github.com/hassanismailtech/seclume/actions/runs/45077187733/job/137376926681): lite image inspection, host POST, bindings/private Redis and cleanup |
| website | success | [Job 137376926768](https://github.com/hassanismailtech/seclume/actions/runs/45077187733/job/137376926768): clean install, 44 tests, lint/build and production audit |
| frontend | success | [Job 137376926533](https://github.com/hassanismailtech/seclume/actions/runs/45077187733/job/137376926533): clean install, lint/build and production audit |
| claims | success | [Job 137376926746](https://github.com/hassanismailtech/seclume/actions/runs/45077187733/job/137376926746) |
| secrets | success | [Job 137376926786](https://github.com/hassanismailtech/seclume/actions/runs/45077187733/job/137376926786) |
| heldout-recall | success | [Job 137376926363](https://github.com/hassanismailtech/seclume/actions/runs/45077187736/job/137376926363): held-out PERSON and planted BVN/NIN floors |

### Complete backend suite with real Redis

The job started native Redis on Ubuntu with `--bind 127.0.0.1 --port 6379 --save "" --appendonly no`, then ran the full suite with `REDIS_URL=redis://localhost:6379/0`, `NER_TIMEOUT_MS=10000` and the verified `CADDY_BIN`. Redis shutdown ran afterward. Actual output excerpts:

```text
caddy.tar.gz: OK
uv run pytest -q
293 passed, 3 warnings in 32.30s
leaks: 0 / 35 planted entities
uvx pip-audit
No known vulnerabilities found
```

The pytest command had no `-k` exclusion, and its summary contained no skipped/deselected cases. It includes the mandatory real-Redis lifespan/readiness test and [playground real-Redis tests](../backend/tests/test_playground.py), including concurrency, rate-window rollover, daily-salt rollover, cleanup and absence of Telemetry Events. The three warnings remain: deprecated Torch JIT scripting, deprecated Hugging Face resume-download option, and the existing SentencePiece conversion/byte-fallback warning. No dependency or model change was made to suppress them.

The leak count is limited to the project's planted synthetic fixtures. Evaluation floors also passed on project-authored synthetic sets; the [recorded quality evidence](metrics.txt), including PERSON over-redaction, remains qualified rather than an independent quality assessment.

### Container refusal, health and isolation

The container job used `SECLUME_IMAGE=aegis:ci-ea1a728c88e9a2f1cdbefcf2c6ab142a1ce20f8e` for the runtime and a separate `-lite` image for the isolated profile. These are local CI image names, not registry publication evidence. Actual job-step conclusions from GitHub:

```text
Validate Compose and build images: success
Refuse unauthenticated wildcard binding: success
Check Compose health: success
Check isolated playground deployment: success
Remove test containers: success
```

The refusal step starts the runtime with `BIND_HOST=0.0.0.0`, authentication unset and `AEGIS_INSECURE_DEV=false`. It requires `timeout 30s docker wait` to finish, a nonzero container exit and the expected `Refusing to start: BIND_HOST is not loopback` message. A timeout or infrastructure failure cannot satisfy that step. The health step waits for healthy services and asserts readiness/Redis status. Log excerpts:

```text
Container aegis-redis-1 Healthy
Container aegis-mock-upstream-1 Healthy
Container aegis-aegis-1 Healthy
Container aegis-playground-ci-redis-1 Healthy
Container aegis-playground-ci-aegis-1 Healthy
```

The separate networking job reported:

```text
Lite image size: 176412521 bytes
Lite app imports offline; NER defaults off; no ML packages, metadata requirements or model weights
Host playground POST returned 200 with scrubbed-only JSON
Proxy publishes only 127.0.0.1:8000; Redis has no published port and host port 6379 refuses connections
Playground emitted no Telemetry Events
```

The private-Redis assertion applies to the standalone playground profile. The development Compose configuration deliberately publishes Redis on host loopback; the two configurations must not be conflated. Neither container job validates a public host, DNS/TLS, an external network or both publishing architectures.

### CI web output excerpts

```text
website: tests 44; pass 44; fail 0
website: Compiled successfully in 4.6s
website: Generating static pages using 3 workers (72/72) in 1570ms
website production audit: found 0 vulnerabilities
frontend: Compiled successfully in 5.0s
frontend: Generating static pages using 3 workers (3/3) in 264ms
frontend production audit: found 0 vulnerabilities
```

CI runs the existing lint commands as part of each successful web build step. The local CRLF failure is not erased by the passing Ubuntu run.

## Failures, limitations and unverified items

1. **Windows website test portability:** the original checkout fails one LF-sensitive assertion. The controlled LF rerun does not fix a fresh Windows checkout. Node module-type warnings remain.
2. **Local integration prerequisites:** Docker daemon and loopback Redis are unavailable. Compose parsing passed; local image builds, live Compose health and the complete local backend suite were not run. CI evidence must be assessed independently.
3. **Public playground:** no reviewed external API base URL was supplied for Q9. The external [smoke script](../scripts/smoke_playground.sh) was not run against a deployed service. CI/harness checks do not establish public `/healthz`, CORS, rate limits, blocked paths, DNS, TLS, firewalling or notification delivery on a real host.
4. **Release artifacts/platforms:** this task created no v0.4.0 tag/release, dispatched no publishing workflow and changed no package visibility. Maintainer main merges can trigger the existing automatic publishing workflow; no resulting registry artifact or digest was verified here. Single-runner container checks do not validate both publication platforms, anonymous pulls or deployed image identity.
5. **Operator/client walkthrough:** no fresh-checkout, human-operated quickstart or third-party chat-client/provider walkthrough was performed. CI uses a clean checkout with caches; local web builds use existing installations. Automated SDK tests are separate evidence.
6. **Separate unfinished reviews:** scheduled Dependabot operation, repository/account protections, legal review of the Privacy draft, deferred T4 audit hardening, D3/D4/D5 design gates, Lighthouse targets and physical-phone inspection are not verified by this report. Existing [security-model](security-model.md) and [limitations](limitations.md) qualifications still apply.
7. **Publication trigger:** the existing publish workflow can run on a main merge independently of CI/evaluation. A draft Q9 PR does not authorize that merge, a tag, publication, workflow dispatch, hosting or account changes.

No detection-quality or production-latency claim is added. Existing numbers in [metrics.txt](metrics.txt) retain their synthetic-data qualifications. Public availability and release authorization remain separate from completing this queue item.
