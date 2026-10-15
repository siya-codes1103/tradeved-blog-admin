import "server-only";
import { readAllPosts, readAuthors, readCategories } from "./store";
import type { Author, Category, Post, PostWithRefs } from "./types";

/**
 * Where the public blog gets its content.
 *   BLOG_API_URL empty  -> the files in content/ (local development, the starter setup)
 *   BLOG_API_URL set    -> the TradeVed backend (public read-only endpoints, no login needed)
 * Responses are kept in Next's data cache for an hour and are refreshed immediately by /api/revalidate
 * whenever the admin saves something.
 */
export const API_URL = (process.env.BLOG_API_URL ?? "").replace(/\/$/, "");
export const API_MODE = API_URL !== "";

export const DATA_TAG = "blog";
const REVALIDATE_SECONDS = 3600;
const PAGE = 500;

async function get<T>(path: string, allow404 = false): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: REVALIDATE_SECONDS, tags: [DATA_TAG] } });
  if (allow404 && res.status === 404) return null;
  // Failing loudly is deliberate: a broken backend must never publish an empty blog. The last good pages keep being served.
  if (!res.ok) throw new Error(`Blog API ${path} answered ${res.status}`);
  return ((await res.json()) as { data: T }).data;
}

interface ApiCard {
  id: string;
  slug: string;
  category_slug: string;
  title: string;
  description: string;
  cover_url: string | null;
  cover_alt: string | null;
  read_minutes: number;
  published_at: string | null;
  updated_at: string;
  noindex: boolean;
  primary_keyword: string | null;
  secondary_keywords: string[];
  author: { slug: string } | null;
  reviewer: { slug: string } | null;
}

const fromCard = (c: ApiCard): Post => ({
  id: c.id,
  slug: c.slug,
  category_slug: c.category_slug,
  title: c.title,
  seo_title: null,
  description: c.description,
  body: "",
  level: "Beginner",
  // The rest of the site identifies an author by slug.
  author_id: c.author?.slug ?? null,
  reviewer_id: c.reviewer?.slug ?? null,
  cover_url: c.cover_url,
  cover_alt: c.cover_alt,
  primary_keyword: c.primary_keyword,
  secondary_keywords: c.secondary_keywords ?? [],
  faqs: [],
  sources: null,
  status: "published",
  noindex: c.noindex,
  redirect_from: [],
  read_minutes: c.read_minutes,
  published_at: c.published_at,
  created_at: c.updated_at,
  updated_at: c.updated_at,
});

export interface Snapshot {
  posts: Post[];
  authors: Author[];
  categories: Category[];
}

/** All live articles (without bodies), authors and categories. */
export async function loadSnapshot(): Promise<Snapshot> {
  if (!API_MODE) return { posts: readAllPosts(), authors: readAuthors(), categories: readCategories() };
  const [categories, authors] = await Promise.all([get<Category[]>("/blog/categories"), get<Author[]>("/blog/authors")]);
  const posts: Post[] = [];
  for (let page = 1; page < 1000; page++) {
    const r = await get<{ items: ApiCard[]; pages: number }>(`/blog/snapshot?page=${page}&limit=${PAGE}`);
    posts.push(...(r?.items ?? []).map(fromCard));
    if (!r || page >= r.pages) break;
  }
  return { posts, authors: authors ?? [], categories: (categories ?? []).sort((a, b) => a.sort - b.sort) };
}

interface ApiFull extends Omit<Post, "level" | "author_id" | "reviewer_id"> {
  author_id: string | null;
  reviewer_id: string | null;
  author: Author | null;
  reviewer: Author | null;
}

/** One article with its body, or the place it moved to. Both questions use the same request, so it is fetched once. */
export async function fetchArticle(slug: string): Promise<{ post: PostWithRefs | null; redirect: { category_slug: string; slug: string } | null }> {
  const r = await get<{ post: ApiFull | null; redirect: { category_slug: string; slug: string } | null }>(`/blog/posts/${encodeURIComponent(slug)}`, true);
  if (!r) return { post: null, redirect: null };
  if (!r.post) return { post: null, redirect: r.redirect };
  const { author, reviewer, ...rest } = r.post;
  return {
    post: {
      ...rest,
      level: "Beginner",
      faqs: Array.isArray(rest.faqs) ? rest.faqs : [],
      secondary_keywords: rest.secondary_keywords ?? [],
      redirect_from: rest.redirect_from ?? [],
      author_id: author?.slug ?? null,
      reviewer_id: reviewer?.slug ?? null,
      author,
      reviewer,
    },
    redirect: null,
  };
}