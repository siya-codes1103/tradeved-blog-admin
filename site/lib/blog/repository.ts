import "server-only";
import { POSTS_PER_PAGE } from "./config";
import { API_MODE, fetchArticle, loadSnapshot } from "./source";
import type { Author, Category, Level, Post, PostCardData, PostWithRefs } from "./types";

/**
 * Public read layer. Only live articles are visible: status published or scheduled, with a publish
 * date that has already passed. Drafts and future-dated articles never reach a public page.
 */
const isLive = (p: Post) => (p.status === "published" || p.status === "scheduled") && !!p.published_at && new Date(p.published_at) <= new Date();
const byNewest = (a: Post, b: Post) => (b.published_at ?? "").localeCompare(a.published_at ?? "");
const live = async () => (await loadSnapshot()).posts.filter(isLive).sort(byNewest);
const authorsList = async () => (await loadSnapshot()).authors;
const categoriesList = async () => (await loadSnapshot()).categories;

const card = (p: Post): PostCardData => ({
  id: p.id,
  slug: p.slug,
  category_slug: p.category_slug,
  title: p.title,
  description: p.description,
  level: p.level,
  cover_url: p.cover_url,
  cover_alt: p.cover_alt,
  read_minutes: p.read_minutes,
  published_at: p.published_at,
  updated_at: p.updated_at,
});

export async function getCategories(): Promise<Category[]> {
  return categoriesList();
}

/** Number of live articles per category slug. */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const p of await live()) out[p.category_slug] = (out[p.category_slug] ?? 0) + 1;
  return out;
}

export async function getCategory(slug: string): Promise<Category | null> {
  return (await categoriesList()).find((c) => c.slug === slug) ?? null;
}

export async function getLatest(opts: { limit?: number; category?: string } = {}): Promise<PostCardData[]> {
  return (await live())
    .filter((p) => !opts.category || p.category_slug === opts.category)
    .slice(0, opts.limit ?? 12)
    .map(card);
}

export interface PostsPage {
  posts: PostCardData[];
  total: number;
  page: number;
  totalPages: number;
}

/** Lower-cased search text per article, built once per article object (the store cache replaces it when a file changes). */
interface Haystack {
  title: string;
  titleCompact: string;
  keywords: string;
  description: string;
  author: string;
  body: string;
}
const haystacks = new WeakMap<Post, Haystack>();

function haystack(p: Post, authors: Author[]): Haystack {
  let h = haystacks.get(p);
  if (!h) {
    const names = [p.author_id, p.reviewer_id].map((id) => authors.find((a) => a.slug === id)?.name ?? "").join(" ");
    const keywords = `${p.primary_keyword ?? ""} ${p.secondary_keywords.join(" ")}`.toLowerCase();
    h = {
      title: p.title.toLowerCase(),
      titleCompact: `${p.title} ${keywords}`.toLowerCase().replace(/[^a-z0-9]+/g, ""),
      keywords,
      description: p.description.toLowerCase(),
      author: names.toLowerCase(),
      // Body without data-block markers and markdown symbols, so "::: chart" or "##" never match.
      body: p.body.replace(/^:::.*$/gm, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[\[|\]\]|[#*>|]|\]\([^)]*\)/g, " ").toLowerCase(),
    };
    haystacks.set(p, h);
  }
  return h;
}

/** Every search word must appear somewhere; higher score when it appears in the title, keywords, author, then description, then body. */
function score(h: Haystack, terms: string[]): number {
  let total = 0;
  for (const t of terms) {
    let s = 0;
    if (h.title.includes(t)) s += 10;
    else if (h.titleCompact.includes(t)) s += 6; // "stoploss" finds "Stop Loss"
    if (h.keywords.includes(t)) s += 6;
    if (h.author.includes(t)) s += 5;
    if (h.description.includes(t)) s += 3;
    if (h.body.includes(t)) s += 1;
    if (!s) return 0;
    total += s;
  }
  return total;
}

export async function getPostsPage(opts: { category?: string; level?: Level; q?: string; page?: number; perPage?: number }): Promise<PostsPage> {
  const perPage = opts.perPage ?? POSTS_PER_PAGE;
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const terms = (opts.q ?? "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
  const authors = await authorsList();
  const pool = (await live()).filter((p) => (!opts.category || p.category_slug === opts.category) && (!opts.level || p.level === opts.level));
  // No search words: newest first. With words: best match first, newest first among equals.
  const rows = terms.length
    ? pool
        .map((p) => ({ p, s: score(haystack(p, authors), terms) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s || byNewest(a.p, b.p))
        .map((x) => x.p)
    : pool;
  const from = (page - 1) * perPage;
  return { posts: rows.slice(from, from + perPage).map(card), total: rows.length, page, totalPages: Math.ceil(rows.length / perPage) };
}

export async function getPostBySlug(slug: string): Promise<PostWithRefs | null> {
  if (API_MODE) return (await fetchArticle(slug)).post;
  const p = (await live()).find((x) => x.slug === slug);
  if (!p) return null;
  const authors = await authorsList();
  return {
    ...p,
    author: authors.find((a) => a.slug === p.author_id) ?? null,
    reviewer: authors.find((a) => a.slug === p.reviewer_id) ?? null,
  };
}

/** If `slug` is an old address of a live article, returns where it lives now (for a 301 redirect). */
export async function getRedirectTarget(slug: string): Promise<{ category_slug: string; slug: string } | null> {
  if (API_MODE) return (await fetchArticle(slug)).redirect;
  const p = (await live()).find((x) => x.redirect_from.includes(slug));
  return p ? { category_slug: p.category_slug, slug: p.slug } : null;
}

export async function getCategoryPage(slug: string, page: number): Promise<PostsPage> {
  return getPostsPage({ category: slug, page });
}

export async function getAdjacent(post: { category_slug: string; published_at: string | null }) {
  const list = (await live()).filter((p) => p.category_slug === post.category_slug);
  const i = list.findIndex((p) => p.published_at === post.published_at);
  return { older: i >= 0 && list[i + 1] ? card(list[i + 1]) : null, newer: i > 0 ? card(list[i - 1]) : null };
}

/** Same-category articles first, topped up with the newest from anywhere. */
export async function getRelated(post: { id: string; category_slug: string }, limit = 4): Promise<PostCardData[]> {
  const all = (await live()).filter((p) => p.id !== post.id);
  const same = all.filter((p) => p.category_slug === post.category_slug).slice(0, limit);
  const extra = all.filter((p) => !same.includes(p)).slice(0, limit - same.length);
  return [...same, ...extra].map(card);
}

export async function getAuthor(slug: string): Promise<Author | null> {
  return (await authorsList()).find((a) => a.slug === slug) ?? null;
}

export async function getAuthorPosts(authorId: string, limit = 48): Promise<PostCardData[]> {
  return (await live())
    .filter((p) => p.author_id === authorId || p.reviewer_id === authorId)
    .slice(0, limit)
    .map(card);
}

export interface SitemapRow {
  slug: string;
  category_slug: string;
  updated_at: string;
  noindex: boolean;
}

export async function getSitemapRows(): Promise<SitemapRow[]> {
  return (await live()).map((p) => ({ slug: p.slug, category_slug: p.category_slug, updated_at: p.updated_at, noindex: p.noindex }));
}

export async function getAuthorSlugs(): Promise<string[]> {
  return (await authorsList()).map((a) => a.slug);
}

export async function getFeedPosts(limit = 50) {
  return (await live()).slice(0, limit).map(card);
}