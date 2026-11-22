import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/brand.mjs";

import { marketingPaths } from "@/lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  return ["", ...marketingPaths].map((path) => ({
    url: new URL(path ? `/${path}` : "/", origin).toString(),
    lastModified: new Date(),
  }));
}
