import assert from "node:assert/strict";
import test from "node:test";
import { BRAND_NAME, PRODUCT_NAME, GITHUB_URL, siteUrl } from "../lib/brand.mjs";
import * as website from "../../website/lib/brand.mjs";

test("independently built apps agree on public identity and origin validation", () => {
  assert.equal(BRAND_NAME, website.BRAND_NAME);
  assert.equal(PRODUCT_NAME, "Seclume Proxy");
  assert.equal(PRODUCT_NAME, website.PRODUCT_NAME);
  assert.equal(GITHUB_URL, website.GITHUB_URL);
  for (const value of ["", "https://alternate.example.test/path?query=ignored#fragment", "http://localhost:3000", "http://127.0.0.1:3001", "http://[::1]:3002"]) {
    assert.equal(siteUrl(value), website.siteUrl(value));
  }
  for (const value of ["invalid", "http://example.test", "https://user:private-marker@example.test", "javascript:private-marker"]) {
    assert.throws(() => siteUrl(value), error => error.message === "NEXT_PUBLIC_SITE_URL must be an HTTPS origin or a loopback HTTP origin");
  }
});

test("dashboard prefers the new site setting and retains the legacy fallback", t => {
  const previous = { site: process.env.NEXT_PUBLIC_SITE_URL, marketing: process.env.NEXT_PUBLIC_MARKETING_URL };
  t.after(() => {
    for (const [key, value] of [["NEXT_PUBLIC_SITE_URL", previous.site], ["NEXT_PUBLIC_MARKETING_URL", previous.marketing]]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_MARKETING_URL;
  assert.equal(siteUrl(), "https://seclume.tech");
  process.env.NEXT_PUBLIC_MARKETING_URL = "https://legacy.example.test";
  assert.equal(siteUrl(), "https://legacy.example.test");
  process.env.NEXT_PUBLIC_SITE_URL = "https://new.example.test/path";
  assert.equal(siteUrl(), "https://new.example.test");
  process.env.NEXT_PUBLIC_SITE_URL = "";
  assert.equal(siteUrl(), "https://legacy.example.test");
});
