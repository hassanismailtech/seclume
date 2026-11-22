import { GITHUB_URL, siteUrl } from "../../../lib/brand.mjs";
import { contacts } from "../../../lib/contacts.mjs";

export function GET() {
  const origin = siteUrl();
  const canonical = origin.startsWith("https:") ? `Canonical: ${origin}/.well-known/security.txt\n` : "";
  return new Response(
    `Contact: mailto:${contacts().security}\nContact: ${GITHUB_URL}/security/advisories/new\nExpires: 2027-11-18T00:00:00.000Z\nPolicy: ${GITHUB_URL}/security/policy\nPreferred-Languages: en\n${canonical}`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
