import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Author, Category, Faq, Level, Post, Status } from "./types";
import { readMinutes } from "./utils";

/**
 * File-based content store.
 *   content/categories.json   categories
 *   content/authors.json      authors and reviewers
 *   content/blog/<slug>.md    one file per article (front matter + body)
 *   public/blog-covers/...    cover images
 * This file only reads. Writing is done by the separate admin app (../admin).
 */
/** BLOG_SITE_DIR lets the separate admin app point at the site folder. The site itself uses its own folder. */
const ROOT = process.env.BLOG_SITE_DIR ? path.resolve(process.cwd(), process.env.BLOG_SITE_DIR) : process.cwd();
export const CONTENT_DIR = path.join(ROOT, "content");
export const POSTS_DIR = path.join(CONTENT_DIR, "blog");
export const COVERS_DIR = path.join(ROOT, "public", "blog-covers");

export const isDev = process.env.NODE_ENV !== "production";


function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

const iso = (v: unknown): string | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

function toPost(slug: string, data: Record<string, unknown>, body: string): Post {
  const published = iso(data.published_at);
  const status = (["draft", "scheduled", "published"].includes(String(data.status)) ? data.status : "draft") as Status;
  const faqs = Array.isArray(data.faqs) ? (data.faqs as Faq[]).filter((f) => f && f.q && f.a) : [];
  const level = (["Beginner", "Intermediate", "Advanced"].includes(String(data.level)) ? data.level : "Beginner") as Level;
  return {
    id: slug,
    slug,
    category_slug: String(data.category ?? ""),
    title: String(data.title ?? slug),
    seo_title: str(data.seo_title),
    description: String(data.description ?? ""),
    body,
    level,
    author_id: str(data.author),
    reviewer_id: str(data.reviewer),
    cover_url: str(data.cover),
    cover_alt: str(data.cover_alt),
    primary_keyword: str(data.primary_keyword),
    secondary_keywords: Array.isArray(data.secondary_keywords) ? (data.secondary_keywords as unknown[]).map(String).filter(Boolean) : [],
    faqs,
    sources: str(data.sources),
    status,
    noindex: data.noindex === true,
    redirect_from: Array.isArray(data.redirect_from) ? (data.redirect_from as unknown[]).map(String).filter(Boolean) : [],
    read_minutes: typeof data.read_minutes === "number" && data.read_minutes > 0 ? data.read_minutes : readMinutes(body),
    published_at: published,
    created_at: iso(data.created_at) ?? published ?? new Date(0).toISOString(),
    updated_at: iso(data.updated_at) ?? published ?? new Date(0).toISOString(),
  };
}

let cache: { sig: string; posts: Post[] } | null = null;

function signature(files: string[]): string {
  if (!isDev) return "prod";
  return files.map((f) => `${f}:${fs.statSync(path.join(POSTS_DIR, f)).mtimeMs}`).join("|");
}

/** Every article, including drafts and scheduled ones. Cached; in dev it refreshes when a file changes. */
export function readAllPosts(): Post[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const sig = signature(files);
  if (cache && cache.sig === sig) return cache.posts;
  const posts: Post[] = [];
  for (const f of files) {
    try {
      const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, f), "utf8"));
      posts.push(toPost(f.replace(/\.md$/, ""), data, content.trim()));
    } catch (e) {
      console.error(`[blog] could not read ${f}:`, e);
    }
  }
  cache = { sig, posts };
  return posts;
}

export const readCategories = (): Category[] => readJson<Category[]>("categories.json", []).sort((a, b) => a.sort - b.sort);
export const readAuthors = (): Author[] => readJson<Omit<Author, "id">[]>("authors.json", []).map((a) => ({ ...a, id: a.slug }));

export function clearPostCache() {
  cache = null;
}