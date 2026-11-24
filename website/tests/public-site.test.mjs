import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { BRAND_NAME, PRODUCT_NAME, PRODUCT_DESCRIPTION, GITHUB_URL, siteUrl } from "../lib/brand.mjs";
import { contacts } from "../lib/contacts.mjs";
import { spawnSync } from "node:child_process";
import { GET } from "../app/.well-known/security.txt/route.ts";
import { marketingPaths, sitePages } from "../lib/site-content.ts";
import { applyTheme, readTheme, themeBootstrap, THEME_KEY } from "../lib/theme.ts";
import { runInNewContext } from "node:vm";
import { proxy } from "../proxy.ts";
import { hasMojibake } from "./text-encoding.mjs";

test("encoding checks distinguish real Unicode from corrupted arrows, currency and replacement characters", () => {
  for (const value of ["\u20A650,000", "\u2192", "\u2502", "\u251C\u2500", "\u2014"]) assert.equal(hasMojibake(value), false);
  for (const value of ["\u00E2\u201A\u00A6", "\u00E2\u2020\u2019", "\u00E2\u201D\u201A", "\u00E2\u2013\u00BC", "\u00C3\u00A9", "\u00C2\u00A0", "\u00F0\u0178", "\u00EF\u00BB\u00BF", "\uFFFD"]) assert.equal(hasMojibake(value), true);
});

test("website and dashboard source text is valid UTF-8 without mojibake", async () => {
  const ignored = new Set(["node_modules", ".next", ".git", ".vercel", "dist", "out", "build", "coverage"]);
  const textFile = /\.(?:[cm]?jsx?|tsx?|css|mdx?|json|svg|html|txt)$/;
  async function inspect(directory, label) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
      const name = `${label}/${entry.name}`;
      if (entry.isDirectory() && !ignored.has(entry.name)) await inspect(path, name);
      else if (entry.isFile() && textFile.test(entry.name) && entry.name !== "package-lock.json") {
        let text;
        try { text = new TextDecoder("utf-8", { fatal: true }).decode(await readFile(path)); }
        catch { assert.fail(`Invalid UTF-8 in ${name}`); }
        assert.equal(hasMojibake(text), false, `Corrupted text in ${name}`);
      }
    }
  }
  await inspect(new URL("../", import.meta.url), "website");
  await inspect(new URL("../../frontend/", import.meta.url), "frontend");
});

function themeRoot() {
  let dark = false;
  return { classList: { toggle(name, enabled) { assert.equal(name, "dark"); dark = enabled; }, contains() { return dark; } } };
}

test("theme defaults to light and accepts only an explicit saved dark preference", () => {
  for (const value of [null, "", "light", "system", "unexpected"]) assert.equal(readTheme({ getItem: () => value }), "light");
  assert.equal(readTheme({ getItem: () => "dark" }), "dark");
  assert.equal(readTheme({ getItem() { throw Error("blocked"); } }), "light");
});

test("theme changes the page and persists a single preference without storing input", () => {
  const root = themeRoot();
  const stored = new Map();
  const storage = { setItem: (key, value) => stored.set(key, value) };
  applyTheme(root, storage, "dark");
  assert.equal(root.classList.contains("dark"), true);
  assert.deepEqual([...stored], [[THEME_KEY, "dark"]]);
  applyTheme(root, storage, "light");
  assert.equal(root.classList.contains("dark"), false);
  assert.deepEqual([...stored], [[THEME_KEY, "light"]]);
});

test("theme still changes when preference storage is blocked", () => {
  const root = themeRoot();
  applyTheme(root, { setItem() { throw Error("blocked"); } }, "dark");
  assert.equal(root.classList.contains("dark"), true);
});

test("pre-paint theme bootstrap restores dark and tolerates inaccessible storage", () => {
  const document = { documentElement: themeRoot() };
  runInNewContext(themeBootstrap, { document, localStorage: { getItem: () => "dark" } });
  assert.equal(document.documentElement.classList.contains("dark"), true);
  runInNewContext(themeBootstrap, { document, localStorage: { getItem: () => "invalid" } });
  assert.equal(document.documentElement.classList.contains("dark"), false);
  const blocked = { document };
  Object.defineProperty(blocked, "localStorage", { get() { throw Error("blocked"); } });
  assert.doesNotThrow(() => runInNewContext(themeBootstrap, blocked));
});

const removedPaths = [
  "product/compare", "product/cloud", "product/cloud/managed-nodes", "product/cloud/audit-exports",
  "product/cloud/multi-region-failover", "product/cloud/tenant-controls", "product/cloud/jurisdiction-packs",
  "product/cloud/support", "trust/status", "trust/dpia-pack", "company/careers", "press",
];
const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the product has a descriptive identity while brand, source and compatibility history remain distinct", async () => {
  assert.equal(BRAND_NAME, "Seclume");
  assert.equal(PRODUCT_NAME, "Seclume Proxy");
  for (const detail of ["Python", "PII-minimisation", "AI agents", "Nigerian identifiers", "OpenAI- and Anthropic-compatible", "self-hosted"]) assert.ok(PRODUCT_DESCRIPTION.includes(detail), detail);
  const readme = await readFile(new URL("../../README.md", import.meta.url), "utf8");
  const introduction = readme.split("## Visit the public website")[0];
  assert.ok(introduction.startsWith(`# ${PRODUCT_NAME} — PII boundary for AI agents\n`));
  assert.ok(introduction.includes(PRODUCT_DESCRIPTION));
  assert.ok(introduction.includes(GITHUB_URL));
  assert.ok(introduction.includes("Hassan Ismail (hassanismailtech)"));
  assert.ok(introduction.includes("not affiliated with the Java"));
  assert.equal(introduction.includes("Aegis"), false);
  assert.match(readme, /## Compatibility and project history[\s\S]*originally named Aegis/);
  for (const file of ["components/HomePage.tsx", "components/SiteFooter.tsx", "app/layout.tsx", "app/(marketing)/page.tsx"]) {
    const source = await read(file);
    assert.ok(source.includes("PRODUCT_NAME"), file);
    assert.ok(source.includes("PRODUCT_DESCRIPTION"), file);
  }
});

test("unshipped roadmap routes are absent from the page registry and sitemap paths", () => {
  for (const path of removedPaths) {
    assert.equal(sitePages[path], undefined, path);
    assert.equal(marketingPaths.includes(path), false, path);
  }
  assert.equal(Object.values(sitePages).some(page => page.status === "Roadmap"), false);
});

test("retired-page response is an empty HTTP 404", async () => {
  const response = proxy();
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "");
});

test("navigation, footer, landing, and related links resolve to retained pages or redirects", async () => {
  const config = await read("next.config.ts");
  const redirects = [...config.matchAll(/source: "([^"]+)", destination: "([^"]+)"/g)];
  const routes = new Set(["/", ...marketingPaths.map(path => `/${path}`)]);
  const valid = new Set([...routes, ...redirects.map(match => match[1])]);
  for (const match of redirects) assert.ok(routes.has(match[2]), `redirect ${match[1]}`);
  const links = Object.values(sitePages).flatMap(page => page.related?.map(link => link.href) ?? []);
  for (const file of ["components/GlobalNav.tsx", "components/SiteFooter.tsx", "app/(marketing)/page.tsx", "components/HomePage.tsx"]) {
    const source = await read(file);
    links.push(...[...source.matchAll(/["'](\/[^"'\s]*)["']/g)].map(match => match[1]));
    assert.equal(source.includes("mailto:?"), false, file);
  }
  for (const href of links.filter(href => href.startsWith("/"))) {
    assert.ok(valid.has(new URL(href, "https://example.test").pathname), `unresolved link ${href}`);
  }
});

test("design-partner interest opens the confirmed mailbox with a subject", () => {
  const links = sitePages["company/design-partners"].related;
  assert.equal(links.length, 1);
  const target = new URL(links[0].href);
  assert.equal(target.protocol, "mailto:");
  assert.equal(target.pathname, "hello@seclume.tech");
  assert.equal(target.searchParams.get("subject"), "Design partner");
});

test("contact and disclosure pages expose the confirmed channels", () => {
  const contacts = sitePages["company/contact"].related.map(link => link.href);
  assert.ok(contacts.includes("mailto:hello@seclume.tech"));
  assert.ok(contacts.includes("mailto:privacy@seclume.tech"));
  const security = sitePages["trust/security"].related.map(link => link.href);
  assert.ok(security.includes("mailto:security@seclume.tech"));
  assert.ok(security.includes("https://github.com/hassanismailtech/seclume/security/advisories/new"));
});

test("privacy explains actual storage boundaries and keeps its draft marker in the repository", async () => {
  const privacy = sitePages["legal/privacy"];
  assert.equal(privacy.status, undefined);
  assert.ok(privacy.related.some(link => link.href === "mailto:privacy@seclume.tech"));
  const copy = JSON.stringify(privacy);
  for (const detail of ["page memory", "local storage", "Redis Session Map", "Cleanup", "short expiry", "HMAC", "daily salt", "expiring request counters", "no Telemetry Events", "access logs", "SQLite", "temporary storage"]) {
    assert.ok(copy.includes(detail), detail);
  }
  assert.doesNotMatch(copy, /Draft pending legal review|Publication review|nothing (?:is )?stored/i);
  assert.match(await read("README.md"), /Draft pending legal review/);
});

test("navigation offers design partners without pricing or removed company links", async () => {
  const nav = await read("components/GlobalNav.tsx");
  assert.ok(nav.includes('/company/design-partners'));
  assert.doesNotMatch(nav, /Pricing|["']\/pricing["']/);
  for (const file of ["components/GlobalNav.tsx", "components/SiteFooter.tsx"]) {
    assert.doesNotMatch(await read(file), /["']\/(?:press|company\/careers)["']/);
  }
});

test("landing latency values match the recorded benchmark and retain its qualifications", async () => {
  const home = await read("components/HomePage.tsx");
  const notes = await readFile(new URL("../../NOTES.md", import.meta.url), "utf8");
  const samples = [...home.matchAll(/p50 ([\d.]+) ms \/ p95 ([\d.]+) ms/g)];
  assert.equal(samples.length, 4);
  for (const [, p50, p95] of samples) assert.ok(notes.includes(`${p50} / ${p95} ms`));
  for (const detail of ["2026-10-28", "Windows", "14.9 GB RAM", "CPU model not recorded", "100 runs", "model cache bypassed", "layer timings", "HTTP 503"]) assert.ok(home.includes(detail), detail);
  assert.ok(home.includes('/blob/faabe2e/NOTES.md#phase-2-task-4-onnx-skip-and-cache'));
  assert.ok(home.includes('http://127.0.0.1:8000/v1'));
  assert.ok(home.includes('# was https://api.openai.com/v1'));
});

function siteOrigin(t, value) {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = value;
  t.after(() => {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  });
}

test("security contact has a single expiry, private report link, and HTTPS canonical from configuration", async t => {
  siteOrigin(t, "https://example.test/some-path?ignored=true");
  const response = GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  const body = await response.text();
  assert.match(body, /^Contact: mailto:security@seclume\.tech$/m);
  assert.match(body, /^Contact: https:\/\/github.com\/hassanismailtech\/seclume\/security\/advisories\/new$/m);
  assert.equal(body.match(/^Contact: /gm).length, 2);
  assert.match(body, /^Policy: https:\/\/github.com\/hassanismailtech\/seclume\/security\/policy$/m);
  assert.equal(body.match(/^Expires: /gm).length, 1);
  assert.match(body, /^Expires: 2027-11-18T00:00:00.000Z$/m);
  assert.match(body, /^Canonical: https:\/\/example.test\/\.well-known\/security.txt$/m);
  assert.ok(body.endsWith("\n"));
});

for (const origin of [undefined, ""]) {
  test("security contact uses the default canonical when unset or empty", async t => {
    siteOrigin(t, origin);
    assert.match(await GET().text(), /^Canonical: https:\/\/seclume\.tech\/\.well-known\/security.txt$/m);
  });
}

for (const origin of ["invalid", "http://example.test", "https://user:secret@example.test", "javascript:private-marker"]) {
  test("invalid site configuration fails without disclosing its value", t => {
    siteOrigin(t, origin);
    assert.throws(GET, error => error.message === "NEXT_PUBLIC_SITE_URL must be an HTTPS origin or a loopback HTTP origin");
  });
}

test("loopback HTTP is usable locally but has no HTTPS canonical", async t => {
  siteOrigin(t, "http://127.0.0.1:3001/path");
  assert.equal(siteUrl(), "http://127.0.0.1:3001");
  assert.equal((await GET().text()).includes("Canonical:"), false);
});

function contactEnv(t, name, value) {
  const previous = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  t.after(() => {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  });
}

test("brand and contact defaults remain independent of an alternate site origin", t => {
  siteOrigin(t, "https://alternate.example.test/path?query=ignored#fragment");
  for (const key of ["SECURITY_CONTACT_EMAIL", "CONTACT_EMAIL", "PRIVACY_CONTACT_EMAIL"]) contactEnv(t, key, undefined);
  assert.equal(BRAND_NAME, "Seclume");
  assert.equal(GITHUB_URL, "https://github.com/hassanismailtech/seclume");
  assert.equal(siteUrl(), "https://alternate.example.test");
  assert.deepEqual(contacts(), { security: "security@seclume.tech", general: "hello@seclume.tech", privacy: "privacy@seclume.tech" });
});

test("contact overrides reach security.txt and generated marketing page content", async t => {
  siteOrigin(t, "https://alternate.example.test");
  contactEnv(t, "SECURITY_CONTACT_EMAIL", "security@example.test");
  contactEnv(t, "CONTACT_EMAIL", "hello@example.test");
  contactEnv(t, "PRIVACY_CONTACT_EMAIL", "privacy@example.test");
  const body = await GET().text();
  assert.match(body, /^Contact: mailto:security@example.test$/m);
  assert.match(body, /^Canonical: https:\/\/alternate.example.test\/\.well-known\/security.txt$/m);
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", 'const {sitePages} = await import("./lib/site-content.ts"); console.log(JSON.stringify(sitePages));'], { cwd: new URL("../", import.meta.url), encoding: "utf8", env: process.env });
  assert.equal(result.status, 0, result.stderr);
  const pages = JSON.parse(result.stdout);
  const rendered = JSON.stringify(pages);
  for (const value of ["security@example.test", "hello@example.test", "privacy@example.test"]) assert.ok(rendered.includes(value));
  assert.equal(rendered.includes("@seclume.tech"), false);
  assert.equal(new URL(pages["company/design-partners"].related[0].href).searchParams.get("subject"), "Design partner");
});

for (const setting of ["SECURITY_CONTACT_EMAIL", "CONTACT_EMAIL", "PRIVACY_CONTACT_EMAIL"]) {
  test(`${setting} rejects injection without echoing the supplied address`, t => {
    contactEnv(t, setting, undefined);
    for (const value of ["private-marker@example.test\nCanonical: bad", "private-marker@example.test?subject=bad", "private-marker%0A@example.test", "Display <private-marker@example.test>"]) {
      process.env[setting] = value;
      assert.throws(contacts, error => error.message === `${setting} must be a plain email address`);
    }
  });
}
