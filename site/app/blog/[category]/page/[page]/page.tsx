import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CategoryView from "@/components/blog/CategoryView";
import { SITE_NAME, SITE_URL } from "@/lib/blog/config";
import { getCategory } from "@/lib/blog/repository";
import { categoryPath } from "@/lib/blog/utils";

export const revalidate = 3600; // must be a literal number
export const dynamicParams = true;

type Props = { params: Promise<{ category: string; page: string }> };

export async function generateStaticParams() {
  return []; // built on first visit, then cached
}

const parsePage = (raw: string) => (/^\d{1,5}$/.test(raw) ? parseInt(raw, 10) : NaN);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug, page: raw } = await params;
  const page = parsePage(raw);
  const category = await getCategory(slug);
  if (!category || !(page >= 2)) return { robots: { index: false } };
  const title = `${category.name}: Guides and Articles, Page ${page} | ${SITE_NAME}`;
  return {
    title: { absolute: title },
    description: category.description ?? `${category.name} articles from ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}${categoryPath(slug, page)}` },
  };
}

export default async function CategoryPagedPage({ params }: Props) {
  const { category, page: raw } = await params;
  const page = parsePage(raw);
  if (!(page >= 1)) notFound();
  if (page === 1) permanentRedirect(categoryPath(category));
  return <CategoryView slug={category} page={page} />;
}
