# Review Seclume in ten minutes

Use this as a review agenda after installing the dependencies in the [README](../README.md#getting-started). Setup, image/model downloads and a complete integration run are outside this timebox. Use only the existing synthetic examples; never submit real personal data, credentials or customer transcripts.

## First: inspect the playground

Open the [website playground](https://seclume.tech/playground). If it is paused, use the [source](../website/app/(marketing)/playground/page.tsx) and [local playground instructions](../README.md#local-playground). A working website does not establish a working public API. The separate [deployment guide](deployment.md) describes the prepared public profile and checks required before launch.

When the API is available, load an existing example, submit it and inspect:

- Scrubbed output uses Placeholders for detected values; the reply is simulated, with no Upstream reply-generation call or restored values.
- Full/lite mode reports actual NER availability. A successful scrub does not prove that every identifier was detected.
- Input rejection, rate-limit guidance and the paused message are understandable, with no server exception details shown.

The page keeps input/results in memory while open. The API temporarily uses a Redis Session Map, requests cleanup after each call and has an expiry fallback. Playground requests emit no Telemetry Events. This is distinct from normal Proxy telemetry, existing SQLite audit metadata and optional in-process NER span caches.

## Next: read the boundary and limits

Read the attacker/failure table in the [security model](security-model.md), then [limitations](limitations.md) and the [claims register](CLAIMS.md). The [synthetic quality results](metrics.txt) are project-authored evidence, not an independent audit. Wire Tap records post-scrub requests and can still contain detector misses.

Authentication is off unless `AEGIS_KEYS_FILE` is configured. The startup development bypass and loopback publishing are not a public authentication boundary. Keep Redis and operational routes private. See [configuration](configuration.md) for defaults and [SECURITY.md](../SECURITY.md) for private reporting.

## Run these three test commands

Run from the repository root, with Python 3.12/uv and the website's Node.js 22/npm dependencies installed.

**1. Quick startup check, without Redis or Docker:**

```sh
uv run --directory backend pytest -q tests/test_startup_guard.py -k "not real_redis"
```

This enters the real application lifespan with isolated dependencies for the startup cases. It excludes only the explicitly named real-Redis test in that file and is not complete backend verification.

**2. Website client and public-content tests:**

```sh
npm --prefix website test
```

These cover the playground contract, safe failure messages, public links/content and identity settings. They do not replace a production build or a browser check. The dashboard has lint/build commands, not an `npm test` script.

**3. Complete backend suite, once integration prerequisites are available:**

```sh
uv run --directory backend pytest -q
```

This requires reachable real Redis with snapshots and AOF disabled, a checksum-verified Caddy executable configured through `CADDY_BIN`, and the model prerequisites used by NER tests. Read the [quickstart prerequisites](quickstart.md#optional-checks-and-cleanup) and [CI setup](../.github/workflows/ci.yml). CI uses native Redis on Ubuntu and sets `NER_TIMEOUT_MS=10000` for its test run. Missing Redis/Caddy prerequisites are failures, not skips. If they are unavailable locally, report this command as unverified locally and inspect the complete backend job for the exact PR commit; do not substitute the quick command above for it.

## Spend the remaining time trying one boundary

Use your own isolated local stack or the existing tests. Avoid load or bypass probes against the public website/API.

| Try to break | Expected boundary and where to inspect |
|---|---|
| Start with a wildcard bind and no tenant keys | Startup refuses unless the explicit development override is enabled. Inspect [startup tests](../backend/tests/test_startup_guard.py). |
| Send supported tool arguments/results containing an existing synthetic fixture | Scrub before Upstream; inspect [round-trip tests](../backend/tests/test_roundtrip.py) and [no-leak tests](../backend/tests/test_no_leak.py). Unknown fields are not a blanket scrubbed surface. |
| Split a Placeholder across stream chunks or lose Session Map state | Inspect [streaming tests](../backend/tests/test_streaming.py). Unknown values stay unresolved; a late stream failure cannot replace an already-sent HTTP status. |
| Exhaust the playground allowance concurrently, cross a time window or forge forwarded headers | Inspect [playground tests](../backend/tests/test_playground.py) and the [ingress smoke checks](deployment.md#external-playground-smoke-script). Trusted ingress configuration matters. |
| Make Redis unavailable or make the website API call fail | Inspect the same playground tests and [website tests](../website/tests/playground.test.mjs): generic failures, scrubbed-only response contract and no playground Telemetry Events. |

Record the commit, fixture ID, test/route, expected versus actual behavior, HTTP status, mode and relevant counts. Do not paste request/response bodies, Session Map contents or Authorization headers into logs or reports. Send security findings privately using [SECURITY.md](../SECURITY.md); report ordinary detection gaps with synthetic reproductions through the existing contribution process.

For a small follow-up, use the [three contribution drafts](good-first-issues.md). They are proposals, not implemented features or published GitHub issues.
