import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import AuthorBox, { Byline } from "@/components/blog/AuthorBox";
import Breadcrumbs from "@/components/blog/Breadcrumbs";
import CandleArt from "@/components/blog/CandleArt";
import CategoryTag from "@/components/blog/CategoryTag";
import JsonLd from "@/components/blog/JsonLd";
import PostBody from "@/components/blog/PostBody";
import PostCard from "@/components/blog/PostCard";
import Toc from "@/components/blog/Toc";
import { DEFAULT_DISCLAIMER, SITE_NAME } from "@/lib/blog/config";
import { parseBody, type Block, type Inline } from "@/lib/blog/markdown";
import { GLOSSARY_ROUTE } from "@/lib/site-links";
import ShareBar from "@/components/blog/ShareBar";
import { getAdjacent, getCategory, getLatest, getPostBySlug, getRedirectTarget, getRelated } from "@/lib/blog/repository";
import { articleSchema, breadcrumbSchema, faqSchema } from "@/lib/blog/schema";
import { categoryPath, formatDate, postPath, postUrl, wordCount } from "@/lib/blog/utils";

export const revalidate = 3600; // must be a literal number
export const dynamicParams = true;

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateStaticParams() {
  // Pre-build only the newest posts; every other post is built on first visit and then cached.
  const latest = await getLatest({ limit: 100 });
  return latest.map((p) => ({ category: p.category_slug, slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: { absolute: `Article not found | ${SITE_NAME}` }, robots: { index: false } };
  const url = postUrl(post);
  const title = `${post.seo_title || post.title} | ${SITE_NAME}`;
  // Uploaded cover if there is one, otherwise the branded card from opengraph-image.tsx.
  const image = post.cover_url
    ? { url: post.cover_url, alt: post.cover_alt || post.title }
    : { url: `${url}/opengraph-image`, width: 1200, height: 630, alt: post.title };
  return {
    title: { absolute: title },
    description: post.description,
    keywords: [post.primary_keyword, ...post.secondary_keywords].filter((k): k is string => !!k),
    alternates: { canonical: url },
    robots: post.noindex ? { index: false, follow: true } : undefined,
    authors: post.author ? [{ name: post.author.name }] : undefined,
    openGraph: {
      type: "article",
      url,
      title,
      description: post.description,
      siteName: SITE_NAME,
      locale: "en_IN",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      section: post.category_slug,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description: post.description, images: [image.url] },
  };
}

export default async function PostPage({ params }: Props) {
  const { category: categorySlug, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    const moved = await getRedirectTarget(slug);
    if (moved) permanentRedirect(postPath(moved));
    notFound();
  }
  if (post.category_slug !== categorySlug) permanentRedirect(postPath(post));

  const url = postUrl(post);
  const [category, adjacent, related] = await Promise.all([getCategory(post.category_slug), getAdjacent(post), getRelated(post, 3)]);
  const { blocks, headings } = parseBody(post.body);
  const faqs = post.faqs.filter((f) => f.q && f.a);
  const sources = (post.sources ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const catName = category?.name ?? "Category";
  const readNext = adjacent.older ?? adjacent.newer ?? related[0] ?? null;
  const glossary = glossaryTerms(blocks);
  const accent = category?.accent ?? "#9BEC00";
  const edited = post.updated_at.slice(0, 10) !== (post.published_at ?? "").slice(0, 10);

  return (
    <>
      <JsonLd
        data={[
          articleSchema(post, category, wordCount(post.body)),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: catName, path: categoryPath(post.category_slug) },
            { name: post.title, path: postPath(post) },
          ]),
          faqSchema(faqs),
        ].filter((x) => x !== null)}
      />
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-8 md:px-6">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }, { name: catName, href: categoryPath(post.category_slug) }, { name: post.title }]} />

        <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,1fr)_290px]">
          <article className="min-w-0 max-w-3xl">
            <header>
              <div className="flex flex-wrap items-center gap-3">
                {category && <CategoryTag name={category.name} accent={category.accent} />}
              </div>
              <h1 className="mt-4 font-heading text-[32px] font-extrabold leading-[1.15] text-[var(--tv-ink)] md:text-[44px] md:leading-[52px]">{post.title}</h1>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--tv-line)] py-4">
                <Byline author={post.author} reviewer={post.reviewer} />
                <p className="font-body text-[13px] text-[var(--tv-mut)]">
                  {edited ? "Updated " : "Published "}
                  <time dateTime={edited ? post.updated_at : (post.published_at ?? undefined)}>{formatDate(edited ? post.updated_at : post.published_at)}</time> · {post.read_minutes} min read
                </p>
              </div>
            </header>

            <div className="tv-dark relative mt-6 aspect-[2/1] overflow-hidden rounded-2xl">
              {post.cover_url ? (
                <Image src={post.cover_url} alt={post.cover_alt || post.title} fill priority sizes="(min-width: 1024px) 768px, 100vw" className="object-cover" />
              ) : (
                <CandleArt seed={post.slug} candles={30} />
              )}
            </div>

            {headings.length >= 3 && (
              <details className="mt-6 rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-4 lg:hidden">
                <summary className="cursor-pointer font-heading text-[14px] font-extrabold text-[var(--tv-ink)]">In this article</summary>
                <ol className="mt-2 space-y-1">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className="block py-1 font-body text-[13px] text-[var(--tv-body)] hover:text-[var(--tv-accent)]">
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {post.description && (
              <aside className="mt-8 rounded-r-xl border-l-4 border-[var(--tv-lime)] bg-[var(--tv-soft)] px-5 py-4">
                <p className="font-heading text-[11px] font-extrabold uppercase tracking-widest text-[var(--tv-accent)]">Quick answer</p>
                <p className="mt-1.5 font-body text-[17px] font-semibold leading-[26px] text-[var(--tv-ink)]">{post.description}</p>
              </aside>
            )}

            <div className="mt-8">
              <PostBody blocks={blocks} />
            </div>

            {faqs.length > 0 && (
              <section aria-labelledby="faq" className="mt-12">
                <h2 id="faq" className="font-heading text-[26px] font-extrabold leading-[32px] text-[var(--tv-ink)]">
                  Frequently asked questions
                </h2>
                <div className="mt-4 divide-y divide-[var(--tv-line)] rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)]">
                  {faqs.map((f, i) => (
                    <details key={i} className="group p-4">
                      <summary className="cursor-pointer list-none font-heading text-[16px] font-extrabold text-[var(--tv-ink)] marker:hidden group-open:text-[var(--tv-accent)]">{f.q}</summary>
                      <p className="mt-2 font-body text-[15px] leading-[24px] text-[var(--tv-body)]">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {glossary.length > 0 && (
              <p className="mt-8 flex flex-wrap items-center gap-2 font-body text-[13px] text-[var(--tv-mut)]">
                <span className="font-heading font-extrabold text-[var(--tv-ink)]">Glossary:</span>
                {glossary.map((g) => (
                  <Link key={g.slug} href={`${GLOSSARY_ROUTE}/${g.slug}`} prefetch={false} className="rounded-full bg-[var(--tv-soft)] px-3 py-1 font-heading text-[12px] font-bold text-[var(--tv-ink)] hover:bg-[var(--tv-lime)] hover:text-[#0F1209]">
                    {g.label}
                  </Link>
                ))}
              </p>
            )}

            {readNext && (
              <Link href={postPath(readNext)} className="group mt-8 flex items-center justify-between gap-4 rounded-2xl bg-[var(--tv-lime)] px-6 py-5 text-[#0F1209] transition hover:brightness-95">
                <span>
                  <span className="block font-heading text-[11px] font-extrabold uppercase tracking-widest">Read next</span>
                  <span className="mt-0.5 block font-heading text-[18px] font-extrabold leading-[24px]">{readNext.title}</span>
                </span>
                <span aria-hidden="true" className="text-[22px] transition group-hover:translate-x-1">→</span>
              </Link>
            )}

            <div className="mt-6 rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-5 font-body text-[13px] leading-[20px] text-[var(--tv-mut)]">
              {sources.length > 0 && (
                <div className="mb-3">
                  <strong className="font-heading text-[var(--tv-ink)]">Sources.</strong>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {sources.map((s, i) => (
                      <li key={i} className="break-words">
                        {/^https?:\/\//i.test(s) ? (
                          <a href={s} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-[var(--tv-accent)]">
                            {s}
                          </a>
                        ) : (
                          s
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p>
                <strong className="font-heading text-[var(--tv-ink)]">Disclaimer.</strong> {DEFAULT_DISCLAIMER}
              </p>
            </div>

            <ShareBar url={url} title={post.title} />

            {post.author && <AuthorBox author={post.author} />}
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <Toc headings={headings} />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related" className="mt-14">
            <h2 id="related" className="font-heading text-[26px] font-extrabold text-[var(--tv-ink)]">
              More in {catName}
            </h2>
            <span className="mt-2 block h-1 w-10 rounded-full" style={{ backgroundColor: accent }} />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} category={category ?? undefined} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function glossaryTerms(blocks: Block[]): { label: string; slug: string }[] {
  const seen = new Map<string, string>();
  const walk = (inl: Inline[]) => inl.forEach((i) => i.t === "gloss" && !seen.has(i.slug) && seen.set(i.slug, i.v));
  for (const b of blocks) {
    if (b.t === "p" || b.t === "example") walk(b.inl);
    else if (b.t === "ul" || b.t === "steps") b.items.forEach(walk);
    else if (b.t === "note") b.lines.forEach(walk);
  }
  return [...seen].slice(0, 8).map(([slug, label]) => ({ slug, label }));
}