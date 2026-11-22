import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { PRODUCT_NAME, PRODUCT_DESCRIPTION } from "@/lib/brand.mjs";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: PRODUCT_NAME, title: `${PRODUCT_NAME} — PII boundary for AI agents`, description: PRODUCT_DESCRIPTION, url: "/" },
};

export default HomePage;
