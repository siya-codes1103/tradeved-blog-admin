import "server-only";
import { API_MODE } from "@/lib/api/config";
import { api, ApiError } from "@/lib/api/client";
import { readAllPosts, readAuthors, readCategories } from "@/lib/blog/store";
import { scoreTone, seoScore } from "@/lib/blog/seo-score";
import type { Author, Category, Post } from "@/lib/blog/types";
import type { IndexEntry } from "@/lib/blog/content-checks";

/**
 * One place that answers "give me the posts / categories / authors".
 * File mode reads ../site/content. API mode asks the backend. Pages never need to know which.
 */

// ---------------- API shapes ----------------

interface ApiPost extends Omit<Post, "level"> {
  author?: { slug: string } | null;
}
export const fromApi = (a: ApiPost): Post => {
  const { author: _author, ...rest } = a as ApiPost & { reviewer?: unknown };
  delete (rest as { reviewer?: unknown }).reviewer;
  return { ...rest, level: "Beginner", faqs: Array.isArray(a.faqs) ? a.faqs : [], secondary_keywords: a.secondary_keywords ?? [], redirect_from: a.redirect_from ?? [] };
};

interface Paged<T> {
  items: T[];
  total: number;
  pages: number;
}

// ---------------- simple reads ----------------

export async function getCategories(): Promise<Category[]> {
  return API_MODE ? api<Category[]>("/blog/categories") : readCategories();
}

export async function getAuthors(): Promise<Author[]> {
  return API_MODE ? api<Author[]>("/blog/authors") : readAuthors();
}

/** Every article's slug and title: used to check internal links and spot duplicate keywords while writing. */
export async function getIndex(): Promise<IndexEntry[]> {
  if (!API_MODE) return readAllPosts().map((p) => ({ slug: p.slug, title: p.title, category_slug: p.category_slug, primary_keyword: p.primary_keyword }));
  return api<IndexEntry[]>("/blog/admin/index");
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!API_MODE) return readAllPosts().find((p) => p.slug === slug) ?? null;
  try {
    return fromApi(await api<ApiPost>(`/blog/admin/posts/slug/${encodeURIComponent(slug)}`));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// ---------------- list page ----------------

export interface ListQuery {
  q?: string;
  status?: string;
  category?: string;
  page?: number;
}

export type ListRow = { p: Pick<Post, "slug" | "title" | "category_slug" | "status" | "published_at" | "updated_at">; score: number };

export interface ListResult {
  rows: ListRow[];
  total: number;
  pages: number;
  tiles: { label: string; value: number }[];
  /** Posts shown per page; also the number of rows in `rows`. */
  perPage: number;
}

export const PER_PAGE = 30;

export async function listAdminPosts(f: ListQuery): Promise<ListResult> {
  const page = Math.max(1, f.page ?? 1);
  if (API_MODE) {
    const qs = new URLSearchParams({ page: String(page), limit: String(PER_PAGE), full: "1" });
    if (f.q) qs.set("q", f.q);
    if (f.status) qs.set("status", f.status);
    if (f.category) qs.set("category", f.category);
    const [list, stats] = await Promise.all([api<Paged<ApiPost>>(`/blog/admin/posts?${qs}`), api<{ total: number; live: number; drafts: number; scheduled: number }>("/blog/admin/stats")]);
    const rows = list.items.map((a) => {
      const p = fromApi(a);
      return { p, score: seoScore({ ...p, author_id: p.author_id, reviewer_id: p.reviewer_id }) };
    });
    const avg = rows.length ? Math.round(rows.reduce((n, r) => n + r.score, 0) / rows.length) : 0;
    return {
      rows,
      total: list.total,
      pages: Math.max(1, list.pages),
      perPage: PER_PAGE,
      tiles: [
        { label: "Total posts", value: stats.total },
        { label: "Live on blog", value: stats.live },
        { label: "Drafts", value: stats.drafts },
        { label: "Avg SEO (this page)", value: avg },
      ],
    };
  }

  const all = readAllPosts();
  const q = (f.q ?? "").trim().toLowerCase();
  const now = Date.now();
  const isLive = (p: Post) => p.status !== "draft" && !!p.published_at && new Date(p.published_at).getTime() <= now;
  const scored = all.map((p) => ({ p, score: seoScore({ ...p, author_id: p.author_id, reviewer_id: p.reviewer_id }) }));
  const avg = scored.length ? Math.round(scored.reduce((n, x) => n + x.score, 0) / scored.length) : 0;
  const rows = scored
    .filter(({ p }) => (!f.status || p.status === f.status) && (!f.category || p.category_slug === f.category) && (!q || `${p.title} ${p.primary_keyword ?? ""} ${p.slug}`.toLowerCase().includes(q)))
    .sort((a, b) => b.p.updated_at.localeCompare(a.p.updated_at));
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    total: rows.length,
    pages: Math.max(1, Math.ceil(rows.length / PER_PAGE)),
    perPage: PER_PAGE,
    tiles: [
      { label: "Total posts", value: all.length },
      { label: "Live on blog", value: all.filter(isLive).length },
      { label: "Drafts", value: all.filter((p) => p.status === "draft").length },
      { label: "Avg SEO score", value: avg },
    ],
  };
}

/** Every post, for the CSV export. In API mode this pages through the list 100 at a time. */
export async function getAllPostsForExport(): Promise<Post[]> {
  if (!API_MODE) return readAllPosts();
  const out: Post[] = [];
  for (let page = 1; page < 1000; page++) {
    const r = await api<Paged<ApiPost>>(`/blog/admin/posts?page=${page}&limit=100`);
    out.push(...r.items.map(fromApi));
    if (page >= r.pages) break;
  }
  return out;
}

export { scoreTone };