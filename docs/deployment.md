# Playground deployment preparation

This is an unlaunched, synthetic-only profile. No host, domain, account, certificate, monitor or deployment is configured by adding these files. Release and web security gates in the [release checklist](release-checklist.md) remain open.

## Boundary and configuration

Use [deploy/compose.playground.yml](../deploy/compose.playground.yml) by itself, never merged with the development Compose file. It starts only Redis and the Proxy. Redis has no published port or persistent volume and uses memory-backed `/data`; snapshots and AOF are off. The Proxy publishes only `127.0.0.1:8000`, uses lite detection, and keeps its existing startup audit dependency in temporary `/tmp` storage. There is no mock or real Upstream service; the unused Upstream URL is loopback and no provider key is supplied.

The startup bypass is explicit because the Proxy binds inside its isolated container without tenant keys. Authentication is off in this profile. It is suitable only for a trusted host with the restrictive ingress below; do not publish the Proxy port or expose its operational/chat routes. This profile is not the configuration for private real-data use.

Native host Caddy uses [deploy/Caddyfile](../deploy/Caddyfile), with `PLAYGROUND_HOST` supplied through configuration. Only POST and OPTIONS on the exact playground path are proxied. Other routes/methods return a not-found response. Default Caddy forwarding ignores caller-supplied forwarded IPs; Uvicorn rewriting is disabled and the playground trusts the isolated ingress. Do not add a CDN or another proxy without reviewing this boundary.

Caddy access logging is not enabled and its runtime output is discarded to avoid request URI/header exposure on errors. Uvicorn access logging is disabled for this profile. This trades request diagnostics for privacy; monitor availability without storing query strings, bodies or credentials. No playground Telemetry Events are added. `Retry-After` is exposed for browser rate-limit messages; the backend still checks CORS origins.

## Review commands, not a deployment instruction

Copy `deploy/.env.example` to an untracked `deploy/.env`. Select `SECLUME_IMAGE` from a reviewed local build or verified published digest, set the intended website origin in `CORS_ORIGINS`, and set the reviewed bare API hostname in `PLAYGROUND_HOST`. Do not use an HTTP scheme for a public launch; explicit loopback HTTP addresses are only for local tests. No particular domain is embedded. Native Caddy must receive these variables too; Compose's environment interpolation does not configure a host service. Its admin API and configuration autosave are disabled; manage the file through the reviewed host-service configuration.

```sh
docker compose --env-file deploy/.env -f deploy/compose.playground.yml config --quiet
caddy validate --envfile deploy/.env --config deploy/Caddyfile --adapter caddyfile
```

The container image must already exist or be built using the README's `SECLUME_IMAGE` instructions. Validation alone does not prove networking, health, DNS or TLS. The CI profile uses native Redis plus verified Caddy for tests, and separately starts the isolated Compose stack for a real synthetic scrub request. Unexecuted CI remains unverified.

## Host-port networking verification

The `playground-networking` CI job checks the standalone profile from the Ubuntu runner host. Unlike the existing in-container request, it sends a bounded curl POST through `http://127.0.0.1:8000/v1/playground/scrub`, using the existing synthetic `p01` fixture. It requires HTTP 200, lite-mode JSON with Placeholders, no planted originals anywhere in the response, and no playground Telemetry Events. Request text and response bodies are not printed in the job output.

The job builds the existing runtime target under `SECLUME_IMAGE`, records Docker/Compose versions, validates the profile, waits for container health and always removes its test stack. It checks both configured and effective Proxy port bindings, verifies Redis has no published bindings and joins only the private network, and requires the host's `127.0.0.1:6379` to refuse connections. Test ports must be free before startup so an unrelated service cannot satisfy a probe. This checks host loopback publishing, not isolation from a host administrator accessing container addresses directly.

Q2 first tests the current topology: both services use only the `private` network with `internal: true`. The current container health/in-container checks do not establish host-port reachability. Keep this topology if the host check passes; add a default network to the Proxy only if runtime evidence shows the internal-only topology prevents access. Redis remains exclusively on the private network with no published port, persistence or volume.

Local Compose configuration and static configuration tests can run without a Docker daemon; the host-port request and effective binding checks require a running engine. Local Docker is unavailable for this task, so runtime evidence must come from the PR's CI job before networking verification can be claimed. This test does not verify public ingress, DNS, TLS, hosting or deployment.

## Before any later launch

- Obtain authorization and an exact commit/image that passes the release gates. Use a host whose location and access controls have been reviewed; never place a real provider key on the public demo host.
- Install/operate Caddy as a host service using its official documentation. Configure the environment, public firewall and DNS only in the separately authorized launch. Caddy's certificate/account storage is operator-managed TLS material; no Redis or request-state volume is added here. No certificate issuance has been tested in this task.
- Verify Redis cannot be reached externally, the Proxy port is loopback-only, public operational/chat routes are blocked, forged forwarded headers do not change rate identity, and CORS accepts only the intended website. Synthetic load, concurrency and rollover tests still apply.
- Set the website's public `NEXT_PUBLIC_PLAYGROUND_API` only after the API boundary works. Confirm scrubbed-only responses, lite mode, retry messages and error paths from a different network; use no real personal data.
- Add an authorized availability monitor and review its own data handling. Retain no request transcripts. Recheck service health and certificate renewal throughout evaluation.

See [security model](security-model.md), [configuration](configuration.md) and [limitations](limitations.md). The base development Compose stack remains unchanged.
