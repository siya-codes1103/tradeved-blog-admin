import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { clearPostCache, CONTENT_DIR, COVERS_DIR, isDev, POSTS_DIR } from "@/lib/blog/store";
import type { Author, Post } from "@/lib/blog/types";

/** Writes article files into the site project (../site). Used only by the admin app. */
export function assertDev() {
  if (!isDev) throw new Error("The blog admin only works locally (npm run dev).");
}

// ---------------- writing (local admin only) ----------------

function toFile(p: Post): string {
  const data: Record<string, unknown> = {
    title: p.title,
    category: p.category_slug,
    level: p.level,
    description: p.description,
    seo_title: p.seo_title || undefined,
    author: p.author_id || undefined,
    reviewer: p.reviewer_id || undefined,
    cover: p.cover_url || undefined,
    cover_alt: p.cover_alt || undefined,
    primary_keyword: p.primary_keyword || undefined,
    secondary_keywords: p.secondary_keywords,
    faqs: p.faqs,
    sources: p.sources || undefined,
    status: p.status,
    noindex: p.noindex || undefined,
    redirect_from: p.redirect_from.length ? p.redirect_from : undefined,
    published_at: p.published_at || undefined,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return matter.stringify(`\n${p.body.trim()}\n`, data);
}

export function writePost(post: Post, previousSlug?: string) {
  assertDev();
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(POSTS_DIR, `${post.slug}.md`), toFile(post), "utf8");
  if (previousSlug && previousSlug !== post.slug) fs.rmSync(path.join(POSTS_DIR, `${previousSlug}.md`), { force: true });
  clearPostCache();
}

export function removePost(slug: string) {
  assertDev();
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Bad slug");
  fs.rmSync(path.join(POSTS_DIR, `${slug}.md`), { force: true });
  clearPostCache();
}

export function postExists(slug: string): boolean {
  return fs.existsSync(path.join(POSTS_DIR, `${slug}.md`));
}

export function writeAuthors(authors: Omit<Author, "id">[]) {
  assertDev();
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONTENT_DIR, "authors.json"), JSON.stringify(authors, null, 2) + "\n", "utf8");
}

export function saveCoverFile(name: string, data: Buffer): string {
  assertDev();
  const dir = path.join(COVERS_DIR, String(new Date().getFullYear()));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), data);
  return `/blog-covers/${new Date().getFullYear()}/${name}`;
}