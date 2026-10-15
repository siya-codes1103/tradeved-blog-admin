import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CandleArt from "@/components/blog/CandleArt";
import CategoryChips from "@/components/blog/CategoryChips";
import CategoryTag from "@/components/blog/CategoryTag";
import JsonLd from "@/components/blog/JsonLd";
import PostCard from "@/components/blog/PostCard";
import SearchForm from "@/components/blog/SearchForm";
import { SITE_NAME, SITE_URL } from "@/lib/blog/config";
import { getCategories, getCategoryCounts, getLatest } from "@/lib/blog/repository";
import { blogSchema, breadcrumbSchema } from "@/lib/blog/schema";
import { categoryPath, formatDate, postPath } from "@/lib/blog/utils";

export const revalidate = 3600; // must be a literal number

const TITLE = "TradeVed Blog: Trading and Investing Guides for India";
const DESCRIPTION = "Learn stocks, IPOs, mutual funds, options and technical analysis in plain language, with Indian market examples, data and clear sources.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: { type: "website", url: `${SITE_URL}/blog`, title: TITLE, description: DESCRIPTION, siteName: SITE_NAME, locale: "en_IN" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function BlogHome() {
  const [categories, counts, latest] = await Promise.all([getCategories(), getCategoryCounts(), getLatest({ limit: 10 })]);
  const featured = latest[0];
  const rest = latest.slice(1);
  const catMap = new Map(categories.map((c) => [c.slug, c]));
  const featuredCat = featured ? catMap.get(featured.category_slug) : undefined;

  return (
    <>
      <JsonLd data={[blogSchema(), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])]} />

      <section className="tv-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-25" aria-hidden="true">
          <CandleArt seed="tradeved-blog-hero" candles={46} />
        </div>
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-14 pt-8 text-center md:pb-20 md:pt-12">
          <h1 className="text-balance font-heading text-[40px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#F7FAF5] md:text-[60px] md:leading-[64px]">
            Learn first.
            <br className="sm:hidden" /> <span className="text-[#9BEC00]">Then trade.</span>
          </h1>
          <p className="mt-5 max-w-xl text-balance font-body text-[16px] leading-[26px] text-[#B4BDAC] md:text-[18px] md:leading-[28px]">
            Guides on stocks, IPOs, mutual funds and charts, explained in plain language with Indian market examples.
          </p>
          <div className="mt-8 flex w-full justify-center">
            <SearchForm placeholder="Search guides, terms and topics…" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mt-6">
          <CategoryChips categories={categories} />
        </div>

        {!featured ? (
          <p className="py-24 text-center font-body text-[15px] text-[var(--tv-mut)]">No articles have been published yet.</p>
        ) : (
          <>
            <section aria-label="Featured article" className="mt-8">
              <Link href={postPath(featured)} className="group grid overflow-hidden rounded-3xl border border-[var(--tv-line)] bg-[var(--tv-card)] transition hover:border-[var(--tv-lime)] md:grid-cols-2">
                <div className="tv-dark relative aspect-[16/9] md:aspect-auto md:min-h-[320px]">
                  {featured.cover_url ? (
                    <Image src={featured.cover_url} alt={featured.cover_alt || featured.title} fill priority sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
                  ) : (
                    <CandleArt seed={featured.slug} candles={34} />
                  )}
                </div>
                <div className="flex flex-col justify-center gap-3 p-6 md:p-10">
                  {featuredCat && <CategoryTag name={featuredCat.name} accent={featuredCat.accent} className="self-start" />}
                  <h2 className="font-heading text-[26px] font-extrabold leading-[32px] text-[var(--tv-ink)] group-hover:text-[var(--tv-accent)] md:text-[32px] md:leading-[40px]">{featured.title}</h2>
                  {featured.description && <p className="line-clamp-3 font-body text-[15px] leading-[24px] text-[var(--tv-body)]">{featured.description}</p>}
                  <p className="font-body text-[13px] text-[var(--tv-mut)]">
                    {featured.read_minutes} min read · {formatDate(featured.published_at)}
                  </p>
                </div>
              </Link>
            </section>

            {rest.length > 0 && (
              <section aria-labelledby="latest" className="mt-12">
                <h2 id="latest" className="font-heading text-[24px] font-bold text-[var(--tv-ink)]">
                  Latest articles
                </h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p) => (
                    <PostCard key={p.id} post={p} category={catMap.get(p.category_slug)} />
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="topics" className="mt-14">
              <h2 id="topics" className="font-heading text-[24px] font-bold text-[var(--tv-ink)]">
                Browse by topic
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories
                  .filter((c) => (counts[c.slug] ?? 0) > 0)
                  .map((c) => (
                    <li key={c.slug}>
                      <Link href={categoryPath(c.slug)} className="group flex h-full flex-col rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-5 transition hover:border-[var(--tv-lime)]">
                        <span className="block h-1 w-9 rounded-full" style={{ backgroundColor: c.accent }} aria-hidden="true" />
                        <span className="mt-3 font-heading text-[18px] font-bold text-[var(--tv-ink)] group-hover:text-[var(--tv-accent)]">{c.name}</span>
                        {c.description && <span className="mt-1.5 line-clamp-2 font-body text-[14px] leading-[21px] text-[var(--tv-mut)]">{c.description}</span>}
                        <span className="mt-3 font-body text-[13px] font-semibold text-[var(--tv-body)]">{counts[c.slug]} {counts[c.slug] === 1 ? "article" : "articles"} →</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </>
  );
}