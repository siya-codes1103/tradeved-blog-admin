import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/blog/config";
import { getAuthorSlugs, getCategories, getSitemapRows } from "@/lib/blog/repository";

export const revalidate = 3600;

// Served at /blog/sitemap.xml. Add it to robots.txt (Sitemap: https://www.tradeved.com/blog/sitemap.xml).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rows, categories, authors] = await Promise.all([getSitemapRows(), getCategories(), getAuthorSlugs()]);
  const latestByCat = new Map<string, string>();
  for (const r of rows) if (!latestByCat.has(r.category_slug) || r.updated_at > latestByCat.get(r.category_slug)!) latestByCat.set(r.category_slug, r.updated_at);

  return [
    { url: `${SITE_URL}/blog`, lastModified: rows[0]?.updated_at, changeFrequency: "daily", priority: 0.9 },
    ...categories.filter((c) => latestByCat.has(c.slug)).map((c) => ({ url: `${SITE_URL}/blog/${c.slug}`, lastModified: latestByCat.get(c.slug), changeFrequency: "daily" as const, priority: 0.7 })),
    ...rows.filter((r) => !r.noindex).map((r) => ({ url: `${SITE_URL}/blog/${r.category_slug}/${r.slug}`, lastModified: r.updated_at, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...authors.map((s) => ({ url: `${SITE_URL}/blog/author/${s}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
