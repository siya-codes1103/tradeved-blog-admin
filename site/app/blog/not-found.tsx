import type { Metadata } from "next";
import Link from "next/link";
import CategoryChips from "@/components/blog/CategoryChips";
import PostCard from "@/components/blog/PostCard";
import SearchForm from "@/components/blog/SearchForm";
import { SITE_NAME } from "@/lib/blog/config";
import { getCategories, getLatest } from "@/lib/blog/repository";

export const metadata: Metadata = {
  title: { absolute: `Page not found | ${SITE_NAME} Blog` },
  robots: { index: false, follow: true },
};

/** Shown for any missing blog address: a wrong link, a deleted article, or a draft that is not live yet. */
export default async function BlogNotFound() {
  const [categories, latest] = await Promise.all([getCategories(), getLatest({ limit: 4 })]);
  const catMap = new Map(categories.map((c) => [c.slug, c]));

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-12">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-heading text-[13px] font-extrabold uppercase tracking-widest text-[var(--tv-accent)]">Error 404</p>
        <h1 className="mt-3 font-heading text-[34px] font-extrabold leading-[1.1] text-[var(--tv-ink)] md:text-[44px]">This article is not here</h1>
        <p className="mt-4 font-body text-[16px] leading-[26px] text-[var(--tv-body)]">
          The link may be old or mistyped, or the article may have moved. Search for it, or pick a topic below.
        </p>
        <div className="mt-7 flex justify-center">
          <SearchForm />
        </div>
        <Link href="/blog" className="mt-5 inline-block border-b-2 border-[var(--tv-lime)] font-heading text-[14px] font-bold text-[var(--tv-ink)] hover:text-[var(--tv-accent)]">
          Go to the blog home →
        </Link>
      </div>

      <div className="mt-12">
        <CategoryChips categories={categories} />
      </div>

      {latest.length > 0 && (
        <section aria-labelledby="nf-latest" className="mt-10">
          <h2 id="nf-latest" className="font-heading text-[22px] font-bold text-[var(--tv-ink)]">
            Latest articles
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((p) => (
              <PostCard key={p.id} post={p} category={catMap.get(p.category_slug)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}