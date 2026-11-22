# Good first issue drafts

These are three proposed contributions, ready to copy into an issue title/body after maintainer review. No GitHub issues are created by this file, and none of the proposed changes is implemented here. Read [CONTRIBUTING.md](../CONTRIBUTING.md), the [claims register](CLAIMS.md) and [SECURITY.md](../SECURITY.md). Use synthetic data only, retain compatibility identifiers and avoid new dependencies. Sign commits with the DCO as described in the contribution guide.

## Draft 1: identifier pack

**Title:** Add an opt-in Ghana PHONE pack for contiguous international-format numbers

**Problem:** The configured default is the Nigerian `ng` pack. A small optional pack can exercise the existing extension contract without changing that default or adding an entity type.

**Requested change:** Add a `gh` pack that returns `PHONE` spans for the explicitly documented contiguous `+233` form only. Use the existing [Detector/Span contract](../backend/app/detectors/base.py) and [pack loader](../backend/app/detectors/__init__.py). Follow the package shape of the [Nigerian pack](../backend/packs/ng/__init__.py).

**Format references:** Start with the [NCA numbering overview](https://nca.org.gh/numbering/) and [ITU Operational Bulletin 1261, Ghana](https://www.ituob.org/issues/1261-en/). The bulletin records a nine-digit national significant number excluding the country code. Recheck current official references when implementing and cite the reviewed revision. This draft requests format matching, not proof that a number is assigned or belongs to a person; do not copy real subscriber numbers or directory examples into fixtures.

**Scope:** New `backend/packs/gh/` implementation and focused tests, plus the minimal documentation/claim updates warranted by the verified behavior. Reuse `PHONE`; no NER, gazetteer, domestic formats, separator variants, other identifiers, provider calls, runtime default changes or dependencies.

**Acceptance criteria:**

- The default `ng` behavior remains unchanged; `gh` works only when explicitly selected through `DETECTOR_PACKS`.
- The declared form has bounded digit matching and correct half-open span offsets/text. Tests reject too-short/too-long forms and matches embedded in larger digit strings or unrelated identifiers.
- Synthetic tests cover the declared format, negative cases, pack composition and existing overlap behavior. New fixtures need maintainer approval under the repository's fixture rules.
- No input/body/value logging, persistence or network lookup is added. No published quality figure or broadened support claim is made without matching evidence.

**Verification:** Run the existing detector tests with `uv run --directory backend pytest -q tests/test_detectors.py`, add/run the new focused pack tests, run claims lint and the complete backend CI suite. List the new test path and exact output in the PR. Proposed new paths are not present in this documentation-only change.

## Draft 2: documentation fix

**Title:** Make the landing page's OpenAI SDK example self-contained

**Problem:** The [landing SDK example](../website/components/HomePage.tsx) reads `os.environ` but does not show `import os`. Copying it into a fresh Python file leaves an undefined name.

**Requested change:** Add the missing import and explain the environment prerequisite beside the example. Keep `http://127.0.0.1:8000/v1` and the `# was https://api.openai.com/v1` comment. Link to the existing [local quickstart](quickstart.md) for the mock stack rather than inventing a hosted API or putting a provider credential in the example.

**Scope:** The example in `website/components/HomePage.tsx` and focused website documentation/tests. Do not change the Proxy, SDK configuration contract, dependencies, routes, identity settings or account configuration.

**Acceptance criteria:**

- Every name used by the displayed snippet is imported or explicitly supplied by its instructions.
- The example retains the loopback base URL and existing environment-variable name, with no literal secret and no original-value/request-body printing.
- Validate the example with a fake SDK client and a synthetic environment value, without contacting a provider. This is a copy/paste check, not a claim of a real provider request.

**Verification:** Run `npm --prefix website test`, `npm --prefix website run lint`, `npm --prefix website run build` and claims lint. Inspect the displayed code in the built page, including narrow-screen scrolling. Include the commands and output in the PR.

## Draft 3: regression test

**Title:** Add cold-start production HTTP tests for retired website routes

**Problem:** The [retired-route response](../website/proxy.ts) has a direct test, and the page registry is checked, but the production HTTP harness used during Q6 is not part of the committed website tests. A catch-all can render a not-found page after streaming HTTP 200, which source assertions alone do not catch.

**Requested change:** Add a built-site test using the existing Node test runner and fetch API. Build the website, start its production server on an isolated loopback port, and check the first requests to `/press` and `/company/careers` before warming those paths.

**Scope:** Website test files and only the command wiring needed to run them after a production build. Do not alter routing behavior, introduce test libraries or require a live API, external network, real identifiers or frontend/dashboard build.

**Acceptance criteria:**

- Both retired routes return HTTP 404 with an empty body on their first GET and HEAD requests. Retained home, playground and privacy routes return HTTP 200.
- The generated sitemap excludes both retired paths and retains the intended public pages.
- Missing build output, a server crash, an occupied port, startup timeout or failed request fails the check; none is silently skipped.
- The test always stops its child server on success or failure, emits no bodies/credentials and uses bounded startup/request timeouts.
- The test runs against the production build, not the development server. Configuration-dependent playground availability is not assumed.

**Verification:** Run the newly documented production-test command after `npm --prefix website run build`, then run the existing website tests/lint and claims lint. Include output showing the actual HTTP statuses. Do not treat these local HTTP checks as evidence of live DNS, TLS or public hosting.
