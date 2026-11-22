import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { BRAND_NAME } from "@/lib/brand.mjs";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: BRAND_NAME, title: `${BRAND_NAME} — a data boundary for AI agents`, description: "A data boundary for AI systems.", url: "/" },
};

export default HomePage;
