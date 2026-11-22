// Keep the display name aligned with website/lib/brand.mjs. Protocol identifiers stay unchanged.
export const BRAND_NAME = "Seclume";
export const PRODUCT_NAME = `${BRAND_NAME} Proxy`;
export const GITHUB_URL = "https://github.com/hassanismailtech/seclume";

export function siteUrl(value = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_MARKETING_URL) {
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
