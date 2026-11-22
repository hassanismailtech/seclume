# Playground deployment preparation

This is an unlaunched, synthetic-only profile. No host, domain, account, certificate, monitor or deployment is configured by adding these files. Release and web security gates in the [release checklist](release-checklist.md) remain open.

## Boundary and configuration

Use [deploy/compose.playground.yml](../deploy/compose.playground.yml) by itself, never merged with the development Compose file. It starts only Redis and the Proxy. Redis has no published port or persistent volume and uses memory-backed `/data`; snapshots and AOF are off. The Proxy publishes only `127.0.0.1:8000`, uses lite detection, and keeps its existing startup audit dependency in temporary `/tmp` storage. There is no mock or real Upstream service; the unused Upstream URL is loopback and no provider key is supplied.

The startup bypass is explicit because the Proxy binds inside its isolated container without tenant keys. Authentication is off in this profile. It is suitable only for a trusted host with the restrictive ingress below; do not publish the Proxy port or expose its operational/chat routes. This profile is not the configuration for private real-data use.

Native host Caddy uses [deploy/Caddyfile](../deploy/Caddyfile), with `PLAYGROUND_HOST` supplied through configuration. POST and OPTIONS on the exact playground path are proxied. GET `/healthz` is the only additional public path: it checks the application's `/readyz` and returns its status with an empty body. Other routes/methods return a not-found response. Default Caddy forwarding ignores caller-supplied forwarded IPs; Uvicorn rewriting is disabled and the playground trusts the isolated ingress. Do not add a CDN or another proxy without reviewing this boundary.

Caddy access logging is not enabled and its runtime output is discarded to avoid request URI/header exposure on errors. Uvicorn access logging is disabled for this profile. This trades request diagnostics for privacy; monitor availability without storing query strings, bodies or credentials. No playground Telemetry Events are added. `Retry-After` is exposed for browser rate-limit messages; the backend still checks CORS origins.

## Review commands, not a deployment instruction

Copy `deploy/.env.example` to an untracked `deploy/.env`. Select `SECLUME_IMAGE` from a reviewed local build or verified published digest, set the intended website origin in `CORS_ORIGINS`, and set the reviewed bare API hostname in `PLAYGROUND_HOST`. Do not use an HTTP scheme for a public launch; explicit loopback HTTP addresses are only for local tests. No particular domain is embedded. Native Caddy must receive these variables too; Compose's environment interpolation does not configure a host service. Its admin API and configuration autosave are disabled; manage the file through the reviewed host-service configuration.

```sh
docker compose --env-file deploy/.env -f deploy/compose.playground.yml config --quiet
caddy validate --envfile deploy/.env --config deploy/Caddyfile --adapter caddyfile
```

Select the lite image described below for this profile. Validation alone does not prove networking, health, DNS or TLS. Backend CI uses native Redis plus verified Caddy for tests, and the container jobs separately start the isolated Compose stack for a real synthetic scrub request. Unexecuted CI remains unverified.

## Lite image selection and checks

The standalone playground profile builds the Dockerfile's `lite` target. It defaults to `NER_ENABLED=false`: pattern rules and the Nigerian name gazetteer remain available, but GLiNER detection is unavailable. Setting NER back to true does not install a model or its dependencies. Use the existing `runtime` target for enabled NER; it remains the default Docker build target and retains its model warm-up and baked cache.

The independent lite builder exports the frozen lockfile without the GLiNER, Torch, Transformers, ONNX, ONNX Runtime and protobuf dependency branches. It installs the remaining pinned requirements with hash checking. Its temporary manifest generates matching `aegis` package metadata; the repository manifest and lockfile are unchanged. The lite image copies the name gazetteer rather than the whole data directory, so local ONNX exports and audit files are excluded. It retains the startup guard, non-root user, entrypoint and readiness healthcheck. This image choice adds no playground Telemetry Events or Upstream calls.

To review a local build with the configured origin already in the untracked environment file:

```sh
export SECLUME_IMAGE=aegis:playground-lite-local
docker compose --env-file deploy/.env -f deploy/compose.playground.yml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.playground.yml build aegis
docker image inspect --format '{{.Size}}' "$SECLUME_IMAGE"
```

For a reviewed published image, set `SECLUME_IMAGE` to its verified lite digest and use `up --no-build` in the separately authorized deployment. Do not rebuild over a published digest reference. The publish workflow prepares both image families under `ghcr.io/${github.repository}`: existing full-image tags remain, while lite tags receive `-lite` (for example `main-lite`, `latest-lite`, `v0.4.0-lite` and `sha-<commit>-lite`). These are tag conventions, not evidence that any particular version has been published. Both targets keep the existing amd64/arm64 platform selection and use separate build caches. Publication triggers remain separate from CI gates.

The `playground-networking` CI job builds the actual lite target, prints its Docker image size in bytes, and fails if Torch or the other omitted ML distributions/modules remain, if package metadata still requires them, or if Hugging Face caches/ONNX exports/model weights are present. It imports the application offline and checks the image's NER default, then starts the real Redis-backed lifespan through Compose health waiting and sends a host-port scrub request. The `containers` job also builds and exercises lite for its isolated playground check while retaining the full-runtime startup refusal and development-stack health checks. No registry login or publication is added to either CI job. Size and runtime results must be recorded from an executed job; there is no claimed size or build-time improvement before measurement, and CI does not exercise the arm64 publication build.

## Host-port networking verification

The `playground-networking` CI job checks the standalone profile from the Ubuntu runner host. Unlike the existing in-container request, it sends a bounded curl POST through `http://127.0.0.1:8000/v1/playground/scrub`, using the existing synthetic `p01` fixture. It requires HTTP 200, lite-mode JSON with Placeholders, no planted originals anywhere in the response, and no playground Telemetry Events. Request text and response bodies are not printed in the job output.

The job builds the lite target under `SECLUME_IMAGE`, records Docker/Compose versions, validates the profile, waits for container health and always removes its test stack. It checks both configured and effective Proxy port bindings, verifies Redis has no published bindings and joins only the private network, and requires the host's `127.0.0.1:6379` to refuse connections. Test ports must be free before startup so an unrelated service cannot satisfy a probe. This checks host loopback publishing, not isolation from a host administrator accessing container addresses directly.

The Proxy joins both `private` and `default`; Redis joins only `private`, which has `internal: true`. Only `127.0.0.1:8000:8000` is published. The default network enables host-port publishing for the Proxy and permits its normal outbound networking; this profile does not promise Proxy egress isolation. Redis has no published port, persistence or volume.

The [Q2 baseline job](https://github.com/hassanismailtech/seclume/actions/runs/44993515789/job/137119529686) tested the original internal-only topology on Ubuntu 24.04, Docker 28.0.4 and Compose 2.38.2. Redis and the Proxy became healthy, but the runner-host curl failed with exit 7 (connection refused). This is why the default network was added to the Proxy; the previous in-container request did not cover that failure.

Local Compose configuration and static configuration tests can run without a Docker daemon; the host-port request and effective binding checks require a running engine. Local Docker is unavailable for this task, so runtime evidence must come from the PR's CI job before networking verification can be claimed. This test does not verify public ingress, DNS, TLS, hosting or deployment.

## External playground smoke script

After an ingress has been deployed and its hostname reviewed, run this from a different network. Replace both example origins with the actual API and website origins:

```sh
sh scripts/smoke_playground.sh "https://api.example.test" "https://website.example.test"
```

The script needs POSIX `sh` and curl 8.4 or later, with no jq, Python or other runtime utility. The curl version requirement makes the response-size cap apply even when the server does not advertise a size. See [curl's size-limit documentation](https://curl.se/docs/manpage.html#--max-filesize). HTTPS origins are required except for loopback HTTP tests; credentials, paths, queries and fragments are rejected. A single trailing slash is accepted. The script ignores curl configuration/proxy settings, verifies TLS normally and does not follow redirects. It writes no response files and prints no request/response bodies or supplied argument values.

It prints one PASS/FAIL line for each of seven checks: scrubbed JSON and no-store/allowed-origin headers; blocked root/chat routes; disallowed-origin CORS; the twenty-first request's 429/Retry-After; three forged forwarded-IP values still receiving 429; empty, uncached HTTP 200 health; and blocked readiness/metrics/docs/operational paths and unsupported health methods. Any failed check exits 1; invalid arguments or missing/unsupported curl exit 2 before requests. Every HTTP transfer has a five-second connection timeout, ten-second total timeout and 32 KiB body limit; oversized headers/responses are also rejected. Duplicate Content-Type, Date or Retry-After headers and quoted Cache-Control extensions fail validation. Network, TLS and redirect failures do not count as passes.

The only submitted text is the existing synthetic `p01` fixture from `demo/prompts.json`. A bounded shell JSON reader checks its current six-field response contract, requires the PERSON/PHONE/BVN Placeholders, and scans the raw response and decoded string fields for the planted originals, including escaped ASCII and the phone's compact form. It rejects malformed, duplicate-root-field, excessively nested and non-ASCII responses rather than claiming to be a general-purpose JSON utility. Both full and lite mode values are accepted. Successful responses in the rate-limit burst are checked too.

Use a quiet client address with no prior requests in the server's current rate window. The ingress must expose the configured twenty-request fixed-minute limit and coherent HTTP Date headers. Other visitors sharing the same public address can make the quota test fail early. The script counts requests by the server's reported minute, includes the initial successful POST, and restarts the count on a minute change. A rollover during the forged-header check re-establishes the limit before testing all three forged values again. Retries are bounded: at most 64 follow-up requests per burst, two forged-check restarts and 128 scrub POSTs overall. Missing/inconsistent timing or exhausted retry budgets fail the check; they are not interpreted as protection. Rate tests temporarily consume that client address's allowance.

This script targets the restrictive ingress, not the raw Proxy port. Adding it does not deploy a service or establish live DNS/TLS/availability. Its implementation can be tested against a controlled local HTTP harness; a successful real external run must be recorded separately. It does not inspect internal telemetry or storage, and it adds no telemetry behavior. Health/private-path checks do not submit playground text or consume its POST allowance.

## Status-only health and uptime monitoring

Public GET `/healthz` checks readiness, not the application's separate liveness `/healthz`. Caddy makes a fixed GET to `/readyz`, drops the incoming query/body and credential headers, and discards the upstream response body and headers. It returns the upstream HTTP status with an empty body and `Cache-Control: no-store`: normally 200 when Redis and the configured NER mode are ready, or 503 when they are not. Unreachable or timed-out readiness returns an empty gateway error, not a healthy response. This health proxy has a two-second dial timeout and five-second response-header timeout. Playground proxy behavior is unchanged.

Direct `/readyz`, `/metrics`, `/docs`, `/openapi.json` and `/v1/aegis/*` remain blocked. Only GET is allowed on `/healthz`; HEAD, POST, OPTIONS, PUT, PATCH and DELETE return 404. Readiness checks do not call an Upstream model or run a scrub request, and the public endpoint does not expose Redis/NER detail JSON.

After an authorized deployment, an operator can configure a free HTTP status monitor. [Better Stack's uptime page](https://betterstack.com/uptime) lists a free option (reviewed 2026-11-22); its [HTTP status monitor](https://betterstack.com/docs/uptime/uptime-monitor/) checks success codes and its [request settings](https://betterstack.com/docs/uptime/request-parameters-headers-and-http-authentication/) use GET by default. Current plan terms and intervals should be checked when configuring it.

1. In Monitors, create an HTTP status monitor for `https://<reviewed-api-host>/healthz`.
2. Keep the method GET and TLS verification enabled. Leave authentication, request headers and request body empty. Use the free plan's available checking interval.
3. Use status checking, with 200 as the healthy application response. A keyword check is unsuitable because the body is intentionally empty; not-ready and gateway error statuses should alert.
4. Configure the operator's notification destination and verify a ready-to-unready transition and recovery after deployment. Keep checks on `/healthz` so monitoring does not spend the playground allowance or submit synthetic text.

These are configuration instructions, not evidence of an active monitor, public DNS/TLS, hosted availability or notification delivery. The smoke script verifies the health response and private-path boundary separately from monitor setup.

## Before any later launch

- Obtain authorization and an exact commit/image that passes the release gates. Use a host whose location and access controls have been reviewed; never place a real provider key on the public demo host.
- Install/operate Caddy as a host service using its official documentation. Configure the environment, public firewall and DNS only in the separately authorized launch. Caddy's certificate/account storage is operator-managed TLS material; no Redis or request-state volume is added here. No certificate issuance has been tested in this task.
- Verify Redis cannot be reached externally, the Proxy port is loopback-only, public operational/chat routes are blocked, forged forwarded headers do not change rate identity, and CORS accepts only the intended website. Synthetic load, concurrency and rollover tests still apply.
- Set the website's public `NEXT_PUBLIC_PLAYGROUND_API` only after the API boundary works. Confirm scrubbed-only responses, lite mode, retry messages and error paths from a different network; use no real personal data.
- Add an authorized availability monitor and review its own data handling. Retain no request transcripts. Recheck service health and certificate renewal throughout evaluation.

See [security model](security-model.md), [configuration](configuration.md) and [limitations](limitations.md). The base development Compose stack remains unchanged.
