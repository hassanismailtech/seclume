// Build each tested app first; environment values must match its build.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { setTimeout } from "node:timers/promises";
import { BRAND_NAME, PRODUCT_NAME, PRODUCT_DESCRIPTION, GITHUB_URL, siteUrl } from "../lib/brand.mjs";
import { contacts } from "../lib/contacts.mjs";
import { siteUrl as dashboardSiteUrl } from "../../frontend/lib/brand.mjs";
import { hasMojibake } from "./text-encoding.mjs";

async function serve(t, directory, port) {
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: new URL(directory, import.meta.url), stdio: "ignore", windowsHide: true,
  });
  const exited = once(child, "exit");
  t.after(async () => { child.kill(); await exited; });
  const base = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) assert.fail("Built app exited before readiness");
    try { if ((await fetch(base, { signal: AbortSignal.timeout(2000) })).ok) return base; } catch { /* Wait for local startup. */ }
    await setTimeout(250);
  }
  assert.fail("Built app did not become ready");
}

test("built website uses configured origins and contacts across public routes", async t => {
  const base = await serve(t, "../", 3311);
  for (const path of ["/", "/product/proxy", "/playground", "/company/about", "/company/contact", "/trust/security", "/legal/privacy"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1];
    assert.ok(footer?.replace(/<[^>]*>/g, "").includes("Independently maintained."), `maintenance footer ${path}`);
    assert.equal(/seclume\.space|github\.com\/seclume\/seclume|not affiliated/i.test(footer), false, path);
    if (path === "/company/about") {
      const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
      const visible = main?.replace(/<[^>]*>/g, "");
      assert.ok(visible?.includes("Independently maintained."));
      assert.ok(visible.includes("Maintained by Hassan Ismail (hassanismailtech)."));
      assert.equal(/seclume\.space|github\.com\/seclume\/seclume|not affiliated/i.test(main), false);
    }
    assert.ok(html.includes(BRAND_NAME), path);
    assert.ok(html.includes('<title>') && html.match(/<title>([^<]+)<\/title>/)[1].includes(PRODUCT_NAME), `product title ${path}`);
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/);
    assert.ok(ogTitle && ogTitle[1].includes(PRODUCT_NAME), `product Open Graph title ${path}`);
    assert.ok(html.includes(`<meta property="og:site_name" content="${PRODUCT_NAME}"`), path);
    if (path === "/") {
      const flow = html.match(/<figure\b[^>]*aria-label="Request and response flow"[\s\S]*?<\/figure>/)?.[0];
      assert.ok(flow?.includes("<ol"), "ordered request/response flow");
      for (const label of ["Agent", BRAND_NAME, "Scrubber", "Session Map", "Wire Tap", "Upstream", "Reinjector", "Request with identifiers", "Reply with Placeholders"]) assert.ok(flow.includes(label), label);
      assert.ok(html.includes("\u20A650,000"), "correct naira symbol");
      assert.ok(html.includes(`<meta name="description" content="${PRODUCT_DESCRIPTION}"`));
      assert.ok(html.includes(`<meta property="og:description" content="${PRODUCT_DESCRIPTION}"`));
      const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<[^>]*>/g, "");
      assert.ok(visible.includes(PRODUCT_NAME));
      assert.ok(visible.includes(PRODUCT_DESCRIPTION));
    }
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    const og = html.match(/<meta property="og:url" content="([^"]+)"/);
    assert.ok(canonical, `canonical ${path}`);
    assert.ok(og, `Open Graph ${path}`);
    assert.equal(new URL(canonical[1]).href, new URL(path, siteUrl()).href);
    assert.equal(new URL(og[1]).href, new URL(path, siteUrl()).href);
    assert.equal(html.includes("aegisproxy.dev"), false);
    assert.equal(html.replace(/X-Aegis-[\w-]+/gi, "").includes("Aegis"), false, path);
    if (path === "/company/contact") {
      for (const email of [contacts().general, contacts().privacy]) assert.ok(html.includes(`mailto:${email}`), email);
    }
    if (path === "/trust/security") assert.ok(html.includes(`mailto:${contacts().security}`));
    if (path === "/legal/privacy") assert.ok(html.includes(`mailto:${contacts().privacy}`));
  }
  const robots = await (await fetch(base + "/robots.txt")).text();
  assert.ok(robots.includes(`Sitemap: ${siteUrl()}/sitemap.xml`));
  const sitemap = await (await fetch(base + "/sitemap.xml")).text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.ok(locations.length > 1);
  for (const location of locations) assert.equal(new URL(location).origin, siteUrl());
  const paths = [...new Set(locations.map(location => new URL(location).pathname))];
  for (let offset = 0; offset < paths.length; offset += 4) {
    await Promise.all(paths.slice(offset, offset + 4).map(async path => {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      assert.match(response.headers.get("content-type"), /charset=utf-8/i, path);
      assert.equal(hasMojibake(await response.text()), false, `Rendered encoding ${path}`);
    }));
  }
  t.diagnostic(`Checked UTF-8 rendering on all ${paths.length} sitemap pages`);
  const security = await (await fetch(base + "/.well-known/security.txt")).text();
  assert.ok(security.includes(`Contact: mailto:${contacts().security}\n`));
  assert.ok(security.includes(`Contact: ${GITHUB_URL}/security/advisories/new\n`));
  assert.ok(security.includes(`Canonical: ${siteUrl()}/.well-known/security.txt\n`));
});

test("built dashboard displays the current brand and configured return link", async t => {
  const base = await serve(t, "../../frontend/", 3312);
  const html = await (await fetch(base)).text();
  assert.ok(html.includes(`<title>${PRODUCT_NAME} | Data boundary control plane</title>`));
  assert.ok(html.includes(`href="${dashboardSiteUrl()}"`));
  assert.ok(html.replace(/<[^>]*>/g, "").includes(`${BRAND_NAME} site`));
  assert.equal(html.includes("Aegis site"), false);
});
