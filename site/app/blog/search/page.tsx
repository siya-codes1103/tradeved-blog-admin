import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/blog/Breadcrumbs";
import CategoryChips from "@/components/blog/CategoryChips";
import PostCard from "@/components/blog/PostCard";
import SearchForm from "@/components/blog/SearchForm";
import { SITE_NAME } from "@/lib/blog/config";
import { getCategories, getLatest, getPostsPage } from "@/lib/blog/repository";

// Dynamic on purpose (depends on the query). Never indexed: avoids thin/duplicate search pages.
export const metadata: Metadata = {
  title: { absolute: `Search articles | ${SITE_NAME}` },
  robots: { index: false, follow: true },
};

type SP = { q?: string; category?: string; page?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === sp.category)?.slug;
  const result = await getPostsPage({ q, category, page });
  const suggestions = result.posts.length === 0 ? await getLatest({ limit: 4 }) : [];
  const catMap = new Map(categories.map((c) => [c.slug, c]));

  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (category) u.set("category", category);
    if (p > 1) u.set("page", String(p));
    return `/blog/search?${u.toString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }, { name: "Search" }]} />
      <h1 className="mt-6 font-heading text-[34px] font-bold text-[var(--tv-ink)] md:text-[44px]">{q ? `Results for “${q}”` : "Browse articles"}</h1>

      <form action="/blog/search" method="get" className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <SearchForm defaultValue={q} />
        </div>
        <select name="category" defaultValue={category ?? ""} aria-label="Category" className="rounded-full border border-[var(--tv-line)] bg-[var(--tv-card)] px-4 py-2.5 font-body text-[14px] text-[var(--tv-ink)]">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-[var(--tv-lime)] px-5 py-2.5 font-heading text-[14px] font-bold text-[#0F1209]">Apply</button>
      </form>

      <div className="mt-6"><CategoryChips categories={categories} /></div>

      <p className="mt-8 font-body text-[13px] text-[var(--tv-mut)]">{result.total.toLocaleString("en-IN")} article{result.total === 1 ? "" : "s"} found</p>
      {result.posts.length === 0 ? (
        <div className="mt-4">
          <p className="rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] px-5 py-6 font-body text-[15px] leading-[24px] text-[var(--tv-body)]">
            Nothing matched{q ? <> “{q}”</> : null}. Try a shorter word, check the spelling, or search by a topic or an author&apos;s name.
          </p>
          {suggestions.length > 0 && (
            <>
              <h2 className="mt-10 font-heading text-[22px] font-bold text-[var(--tv-ink)]">Latest articles</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {suggestions.map((p) => (
                  <PostCard key={p.id} post={p} category={catMap.get(p.category_slug)} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {result.posts.map((p) => (
            <PostCard key={p.id} post={p} category={catMap.get(p.category_slug)} />
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4 font-body text-[14px]">
          {page > 1 && <Link href={href(page - 1)} className="rounded-full border border-[var(--tv-line)] px-4 py-2 text-[var(--tv-body)] hover:border-[var(--tv-lime)]">← Previous</Link>}
          <span className="text-[var(--tv-mut)]">Page {page} of {result.totalPages}</span>
          {page < result.totalPages && <Link href={href(page + 1)} className="rounded-full border border-[var(--tv-line)] px-4 py-2 text-[var(--tv-body)] hover:border-[var(--tv-lime)]">Next →</Link>}
        </nav>
      )}
    </div>
  );
}