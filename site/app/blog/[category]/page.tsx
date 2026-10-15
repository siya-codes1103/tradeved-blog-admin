import type { Metadata } from "next";
import CategoryView from "@/components/blog/CategoryView";
import { SITE_NAME, SITE_URL } from "@/lib/blog/config";
import { getCategories, getCategory, getCategoryPage } from "@/lib/blog/repository";

export const revalidate = 3600; // must be a literal number
export const dynamicParams = true;

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: { absolute: `Category not found | ${SITE_NAME}` }, robots: { index: false } };
  const { total } = await getCategoryPage(slug, 1);
  const title = `${category.name}: Guides and Articles | ${SITE_NAME}`;
  const description = category.description ?? `${category.name} articles from ${SITE_NAME}.`;
  const url = `${SITE_URL}/blog/${slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: total === 0 ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", url, title, description, siteName: SITE_NAME, locale: "en_IN" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  return <CategoryView slug={category} page={1} />;
}
