import { notFound } from "next/navigation";
import CategoryChips from "./CategoryChips";
import JsonLd from "./JsonLd";
import Breadcrumbs from "./Breadcrumbs";
import Pagination from "./Pagination";
import PostCard from "./PostCard";
import { getCategories, getCategory, getCategoryPage } from "@/lib/blog/repository";
import { breadcrumbSchema, collectionSchema } from "@/lib/blog/schema";
import { categoryPath } from "@/lib/blog/utils";

/** Shared by /blog/[category] (page 1) and /blog/[category]/page/[n]. */
export default async function CategoryView({ slug, page }: { slug: string; page: number }) {
  const category = await getCategory(slug);
  if (!category) notFound();
  const [categories, result] = await Promise.all([getCategories(), getCategoryPage(slug, page)]);
  if (page > 1 && result.posts.length === 0) notFound();
  const path = categoryPath(slug, page);

  return (
    <>
      <JsonLd
        data={[
          collectionSchema(category.name, path, category.description ?? category.name),
          breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: category.name, path }]),
        ]}
      />
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }, { name: category.name }]} />
        <header className="mt-6">
          <h1 className="font-heading text-[34px] font-bold leading-[1.15] text-[var(--tv-ink)] md:text-[44px] md:leading-[52px]">{category.name}</h1>
          <span className="mt-3 block h-1 w-12 rounded-full" style={{ backgroundColor: category.accent }} />
          {category.description && <p className="mt-4 max-w-2xl font-body text-[16px] leading-[24px] text-[var(--tv-body)]">{category.description}</p>}
        </header>
        <div className="mt-8">
          <CategoryChips categories={categories} active={slug} />
        </div>

        {result.posts.length === 0 ? (
          <p className="py-24 text-center font-body text-[15px] text-[var(--tv-mut)]">No articles in this category yet.</p>
        ) : (
          <>
            <p className="mt-8 font-body text-[13px] text-[var(--tv-mut)]">
              {result.total.toLocaleString("en-IN")} article{result.total === 1 ? "" : "s"}
              {result.totalPages > 1 && ` · Page ${result.page} of ${result.totalPages}`}
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {result.posts.map((p, i) => (
                <PostCard key={p.id} post={p} category={category} priority={i < 4} />
              ))}
            </div>
            <Pagination page={result.page} totalPages={result.totalPages} href={(n) => categoryPath(slug, n)} />
          </>
        )}
      </div>
    </>
  );
}
