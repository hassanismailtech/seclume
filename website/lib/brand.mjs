export const BRAND_NAME = "Seclume";
export const PRODUCT_NAME = `${BRAND_NAME} Proxy`;
export const PRODUCT_DESCRIPTION = "An open-source Python PII-minimisation Proxy for AI agents handling Nigerian identifiers. OpenAI- and Anthropic-compatible; self-hosted.";
export const GITHUB_URL = "https://github.com/hassanismailtech/seclume";

export function siteUrl(value = process.env.NEXT_PUBLIC_SITE_URL) {
  let url;
  try {
    url = new URL(value || "https://seclume.tech");
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTPS origin or a loopback HTTP origin");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || !(url.protocol === "https:" || (url.protocol === "http:" && local))) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTPS origin or a loopback HTTP origin");
  }
  return url.origin;
}
