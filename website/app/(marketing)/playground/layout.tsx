import type { Metadata } from "next";
import { PRODUCT_NAME } from "@/lib/brand.mjs";

export const metadata: Metadata = {
  title: "Playground",
  alternates: { canonical: "/playground" },
  openGraph: { type: "website", siteName: PRODUCT_NAME, title: `Playground | ${PRODUCT_NAME}`, description: "Try synthetic text with the Scrubber.", url: "/playground" },
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
