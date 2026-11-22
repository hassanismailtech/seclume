import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand.mjs";

export const metadata: Metadata = {
  title: "Playground",
  alternates: { canonical: "/playground" },
  openGraph: { type: "website", siteName: BRAND_NAME, title: `Playground | ${BRAND_NAME}`, description: "Try synthetic text with the Scrubber.", url: "/playground" },
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
