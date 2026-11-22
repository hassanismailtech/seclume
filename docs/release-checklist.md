# Release preparation: target v0.4.0

**Unreleased.** Package metadata identifies the planned version; it is not evidence of a GitHub release or available versioned container image. No release date, tag, registry publication, package-visibility change or repository rename is performed by Q8. Seclume is the umbrella brand and Seclume Proxy is the public product name; code identifiers remain unchanged.

The existing [publish workflow](../.github/workflows/publish.yml) publishes on pushes to `main`, version tags and manual dispatch. It does not wait for the separate CI/evaluation workflows. **Merging to `main` can therefore publish an image.** Do not merge, tag or dispatch as part of preparation; the publishing behavior and gates need explicit review before those actions.

## Prepared release-note copy

Use the [Unreleased changelog](../CHANGELOG.md#unreleased) as the draft source. It covers startup binding, the opt-in scrub-only playground, configurable identity and contacts, website fixes, deployment preparation, the lite image target, operating/reviewer guides and verification jobs through Q7 plus the identity clarification. The playground has no restored reply or Telemetry Events. Authentication is off unless `AEGIS_KEYS_FILE` is configured; the default Compose stack remains unauthenticated local development with host-loopback publishing.

The changelog records the Aegis-to-Seclume history and Seclume Proxy product identity. The repository URL, `seclume.tech` domain and confirmed contacts remain unchanged by Q8. Retain the existing configuration/header/CLI/Redis identifiers. Audit hardening (T4) remains deferred; see the [security model](security-model.md) and [limitations](limitations.md).

## Preparation status

| Item | Status / evidence |
|---|---|
| Version metadata | Backend `pyproject.toml` and `uv.lock` already identify 0.4.0. Q8 aligns both private npm packages and their lockfile root versions to 0.4.0, without changing dependency requirements or locked third-party packages. |
| Draft notes and review entry | Unreleased changelog updated through Q7 and identity clarification; [reviewer on-ramp](review-in-10-minutes.md) available. No release date or tag is assigned. |
| Earlier web security failure | Remediation and successful Next.js 16.4.6 builds/audits are recorded under Web dependency security verification in [NOTES.md](../NOTES.md). The obsolete build blocker is not treated as a current failure; candidate builds and audits must still pass. |
| Earlier CI evidence | [CI](https://github.com/hassanismailtech/seclume/actions/runs/45048727439) and [evaluation](https://github.com/hassanismailtech/seclume/actions/runs/45048727422) passed for identity head `74a9262` using merge ref `978e57f`. Those results predate Q8 and do not clear a release candidate. |
| Dependency maintenance | Q8 configures weekly uv/npm/Actions groups. Both web apps share the npm entry; only major TypeScript, ESLint and `@types/node` updates are ignored. See [GitHub's options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference). Scheduled bot execution is not verified by editing YAML. |
| Current release gate report | Q9 is pending. No final candidate, fresh-checkout walkthrough, external smoke result, multi-platform publication validation or release authorization is established here. |

## Required gates before a release can be authorized

- [ ] Identify the exact reviewed release-candidate commit containing all intended task branches. Confirm its package version and lockfile agree, with no accidental dependency changes, and record the evidence in Q9's predeploy report.
- [ ] Obtain passing CI and evaluation results for that commit, including the complete backend suite with mandatory real-Redis cases. Earlier successful backend/container jobs do not establish that the current release candidate passed.
- [ ] Obtain passing image build, unauthenticated wildcard-refusal and Compose-health checks. Existing container CI covers its runner architecture; the publishing workflow requests both `linux/amd64` and `linux/arm64`, so validate the intended publication platforms separately.
- [ ] Obtain passing website/frontend lint, production builds and dependency audits for the candidate. Recheck backend dependency audit and claims lint. Earlier web remediation is historical evidence, not a waiver of these checks.
- [ ] Complete a fresh-checkout local quickstart and a synthetic chat-client/SDK walkthrough. Check normal Proxy behavior and scrub-only playground behavior separately.
- [ ] Review public claims, configuration examples and the actual image identity. Use `SECLUME_IMAGE` in deployment instructions; do not invent a registry namespace after a future rebrand.
- [ ] Obtain explicit authorization for the publishing trigger, release tag, release creation and any package visibility/access change. The current standing push authorization covers task branches, not publication.

These boxes are intentionally unchecked. See [NOTES.md](../NOTES.md) for actual command results and limitations; a pushed branch is not a passing release gate.

## Assets and later publication checks

When release creation is authorized, prepare attachments from the exact approved commit: [docker-compose.yml](../docker-compose.yml) and [.env.example](../.env.example). The example contains empty credential values; do not attach a local `.env`, key file, audit database, model cache or request transcript. Include the existing [licence](../LICENSE) and [configuration guide](configuration.md) in the release references.

Only after the gates and authorization are satisfied should the changelog move to a dated release section and its comparison links be updated. Confirm the version tag points to the reviewed commit, record the published image digest, and test anonymous access from an isolated client configuration without logging out or changing the user's existing registry account. A local wheel build does not prove container/platform compatibility or anonymous image availability.

The separate [deployment preparation](deployment.md) covers the isolated synthetic playground profile. No host, DNS, TLS certificate, Caddy hostname or live service is configured here.
