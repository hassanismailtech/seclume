import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/brand.mjs";

export default function robots(): MetadataRoute.Robots {
  const origin = siteUrl();
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${origin}/sitemap.xml` };
}
