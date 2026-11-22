import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PRODUCT_NAME } from "@/lib/brand.mjs";

import { MarketingPage } from "@/components/MarketingPage";
import { marketingPaths, sitePages } from "@/lib/site-content";

export function generateStaticParams() {
  return marketingPaths
    .filter((path) => !["pricing", "playground"].includes(path))
    .map((path) => ({ slug: path.split("/") }));
}

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.join("/");
  const page = sitePages[path];
  if (!page) notFound();
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${path}` },
    openGraph: { type: "website", siteName: PRODUCT_NAME, title: `${page.title} | ${PRODUCT_NAME}`, description: page.description, url: `/${path}` },
  };
}

export default async function SitePage({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const page = sitePages[slug.join("/")];

  if (!page) notFound();

  return <MarketingPage page={page} />;
}
