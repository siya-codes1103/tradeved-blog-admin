"use server";

import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { LEVELS } from "@/lib/blog/config";
import { API_MODE } from "@/lib/api/config";
import { api } from "@/lib/api/client";
import { readAllPosts, readAuthors, readCategories } from "@/lib/blog/store";
import { assertDev, postExists, removePost, saveCoverFile, writeAuthors, writePost } from "@/lib/blog/writer";
import type { Author, Post } from "@/lib/blog/types";
import { authorSchema, categorySchema, importRowSchema, postInputSchema, zodMessages, type PostFormPayload } from "@/lib/blog/validation";
import { readMinutes, slugify } from "@/lib/blog/utils";
import { STARTER_CATEGORIES } from "@/lib/blog/starter-categories";

type Fail = { ok: false; error: string; fieldErrors?: Record<string, string> };
type Ok<T = object> = { ok: true } & T;

const refresh = () => {
  revalidatePath("/blog", "layout");
  revalidatePath("/", "layout");
};

export async function savePost(payload: PostFormPayload): Promise<Ok<{ slug: string }> | Fail> {
  try {
    assertDev();
    const parsed = postInputSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, ...zodMessages(parsed.error) };
    const v = parsed.data;
    const previous = v.previous_slug || undefined;
    if (postExists(v.slug) && v.slug !== previous) return { ok: false, error: "This slug is already used by another article", fieldErrors: { slug: "Slug already used" } };
    if (!readCategories().some((c) => c.slug === v.category_slug)) return { ok: false, error: "Unknown category", fieldErrors: { category_slug: "Unknown category" } };

    const old = previous ? readAllPosts().find((p) => p.slug === previous) : undefined;
    const now = new Date().toISOString();
    const post: Post = {
      id: v.slug,
      slug: v.slug,
      category_slug: v.category_slug,
      title: v.title,
      seo_title: v.seo_title,
      description: v.description,
      body: v.body,
      level: v.level,
      author_id: v.author_id,
      reviewer_id: v.reviewer_id,
      cover_url: v.cover_url,
      cover_alt: v.cover_alt,
      primary_keyword: v.primary_keyword,
      secondary_keywords: v.secondary_keywords,
      faqs: v.faqs,
      sources: v.sources,
      status: v.status,
      noindex: v.noindex,
      // Keep every old address alive: a renamed slug redirects (301) to the new one.
      redirect_from: Array.from(new Set([...(old?.redirect_from ?? []), ...(previous && previous !== v.slug ? [previous] : [])])).filter((s) => s !== v.slug),
      read_minutes: readMinutes(v.body),
      published_at: v.published_at,
      created_at: old?.created_at ?? now,
      updated_at: now,
    };
    writePost(post, previous);
    refresh();
    return { ok: true, slug: post.slug };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save" };
  }
}

export async function deletePost(slug: string): Promise<Ok | Fail> {
  try {
    removePost(slug);
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete" };
  }
}

export async function deletePostAction(slug: string) {
  await deletePost(slug);
}

export async function uploadCover(form: FormData): Promise<Ok<{ url: string }> | Fail> {
  try {
    assertDev();
    const file = form.get("file");
    const base = slugify(String(form.get("name") ?? "cover")) || "cover";
    if (!(file instanceof Blob) || file.size === 0) return { ok: false, error: "No image received" };
    if (file.size > 4 * 1024 * 1024) return { ok: false, error: "Image is larger than 4 MB" };
    const url = saveCoverFile(`${base}-${Date.now()}.webp`, Buffer.from(await file.arrayBuffer()));
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function saveAuthor(input: unknown): Promise<Ok | Fail> {
  try {
    assertDev();
    const parsed = authorSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessages(parsed.error).error };
    const { id, ...a } = parsed.data;
    const list = readAuthors().map(({ id: _id, ...rest }) => rest);
    const prev = id || undefined;
    if (list.some((x) => x.slug === a.slug && x.slug !== prev)) return { ok: false, error: "This slug is already used" };
    const next = prev ? list.map((x) => (x.slug === prev ? a : x)) : [...list, a];
    writeAuthors(next);
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save" };
  }
}

export async function deleteAuthor(slug: string): Promise<Ok | Fail> {
  try {
    assertDev();
    writeAuthors(readAuthors().filter((a) => a.slug !== slug).map(({ id: _id, ...rest }) => rest));
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete" };
  }
}

export async function saveCategory(input: unknown): Promise<Ok | Fail> {
  try {
    if (!API_MODE) throw new Error("Category management is only available in API mode.");
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { ok: false, ...zodMessages(parsed.error) };
    const { editing, ...category } = parsed.data;
    await api(`/blog/admin/categories${editing ? `/${encodeURIComponent(category.slug)}` : ""}`, {
      method: editing ? "PUT" : "POST",
      json: category,
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save category" };
  }
}

export async function deleteCategory(slug: string): Promise<Ok | Fail> {
  try {
    if (!API_MODE) throw new Error("Category management is only available in API mode.");
    await api(`/blog/admin/categories/${encodeURIComponent(slug)}`, { method: "DELETE" });
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete category" };
  }
}

export async function addStarterCategories(): Promise<Ok | Fail> {
  try {
    if (!API_MODE) throw new Error("Category management is only available in API mode.");
    for (const category of STARTER_CATEGORIES) {
      await api("/blog/admin/categories", { method: "POST", json: category });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add starter categories" };
  }
}

export interface ImportResult {
  index: number;
  title: string;
  ok: boolean;
  error?: string;
  note?: string;
}

export interface ImportOptions {
  /** "file" = use each row's own status (default draft); "draft"/"published" = force for all rows. */
  status: "file" | "draft" | "published";
  /** Replace an article when the slug already exists (otherwise it is skipped). */
  overwrite: boolean;
  /** Category to use when an imported row does not specify one. */
  defaultCategory?: string;
}

const truthy = (v: unknown) => v === true || /^(1|true|yes)$/i.test(String(v ?? ""));

function toIso(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Shared import core for CSV, JSON and Markdown. Writes one .md file per article into the site.
 * Unknown author/reviewer names are created automatically so imports never lose attribution.
 */
export async function importPosts(rows: unknown[], offset = 0, opts: ImportOptions = { status: "draft", overwrite: false }): Promise<ImportResult[]> {
  const out: ImportResult[] = [];
  try {
    assertDev();
  } catch (e) {
    return [{ index: offset, title: "", ok: false, error: e instanceof Error ? e.message : "Not allowed" }];
  }
  const cats = new Map<string, string>();
  for (const c of readCategories()) {
    cats.set(c.slug.toLowerCase(), c.slug);
    cats.set(c.name.toLowerCase(), c.slug);
  }
  const authors = readAuthors().map(({ id: _id, ...rest }) => rest);
  const people = new Map<string, string>();
  for (const a of authors) {
    people.set(a.slug.toLowerCase(), a.slug);
    people.set(a.name.toLowerCase(), a.slug);
  }
  let createdAuthors = false;
  const person = (name?: string): string | null => {
    const n = (name ?? "").trim();
    if (!n) return null;
    const hit = people.get(n.toLowerCase());
    if (hit) return hit;
    const slug = slugify(n);
    if (!slug) return null;
    const display = /^[a-z0-9]+(-[a-z0-9]+)+$/.test(n) ? n.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") : n;
    authors.push({ slug, name: display, role: "Contributor", bio: "", avatar_url: null, linkedin_url: null });
    people.set(n.toLowerCase(), slug);
    people.set(slug, slug);
    createdAuthors = true;
    return slug;
  };

  for (let i = 0; i < rows.length; i++) {
    const index = offset + i;
    const parsed = importRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      out.push({ index, title: String((rows[i] as { title?: string })?.title ?? ""), ok: false, error: zodMessages(parsed.error).error });
      continue;
    }
    const r = parsed.data;
    const categoryName = r.category?.trim() || opts.defaultCategory?.trim();
    if (!categoryName) {
      out.push({ index, title: r.title, ok: false, error: "Category is required (select a default category or provide one for each row)." });
      continue;
    }
    const category = cats.get(categoryName.toLowerCase());
    if (!category) {
      out.push({ index, title: r.title, ok: false, error: `Unknown category "${categoryName}" (add it in content/categories.json)` });
      continue;
    }
    const slug = slugify(r.slug || r.title);
    if (!slug) {
      out.push({ index, title: r.title, ok: false, error: "Could not make a slug" });
      continue;
    }
    const exists = postExists(slug);
    if (exists && !opts.overwrite) {
      out.push({ index, title: r.title, ok: false, error: "Slug already exists (skipped)" });
      continue;
    }
    const secondary = Array.isArray(r.secondary_keywords) ? r.secondary_keywords : (r.secondary_keywords ?? "").split(/[;,]/);
    const now = new Date().toISOString();
    const body = (r.body ?? "").trim();
    const rowStatus = (["draft", "published", "scheduled"] as const).find((s) => s === (r.status ?? "").toLowerCase()) ?? "draft";
    const status = opts.status === "file" ? rowStatus : opts.status;
    const publishedAt = status === "draft" ? null : toIso(r.published_at) ?? now;
    try {
      writePost({
        id: slug,
        slug,
        category_slug: category,
        title: r.title,
        seo_title: r.seo_title || null,
        description: r.description ?? "",
        body,
        level: ((LEVELS as readonly string[]).find((l) => l.toLowerCase() === (r.level ?? "").toLowerCase()) as Post["level"]) ?? "Beginner",
        author_id: person(r.author),
        reviewer_id: person(r.reviewer),
        cover_url: r.cover_url || r.cover || null,
        cover_alt: r.cover_alt || null,
        primary_keyword: r.primary_keyword || null,
        secondary_keywords: secondary.map((s) => s.trim()).filter(Boolean).slice(0, 20),
        faqs: r.faqs ?? [],
        sources: r.sources || null,
        status,
        noindex: truthy(r.noindex),
        redirect_from: (Array.isArray(r.redirect_from) ? r.redirect_from : (r.redirect_from ?? "").split(/[;,]/)).map((s) => s.trim()).filter(Boolean),
        read_minutes: readMinutes(body),
        published_at: publishedAt,
        created_at: now,
        updated_at: now,
      });
      out.push({ index, title: r.title, ok: true, note: exists ? "replaced" : undefined });
    } catch (e) {
      out.push({ index, title: r.title, ok: false, error: e instanceof Error ? e.message : "Could not write file" });
    }
  }
  if (createdAuthors) writeAuthors(authors);
  refresh();
  return out;
}

/** Markdown import: each file is one article (front matter + body). The file name is the slug unless `slug:` is set. */
export async function importMarkdown(files: { name: string; text: string }[], offset = 0, opts: ImportOptions = { status: "draft", overwrite: false }): Promise<ImportResult[]> {
  const rows: Record<string, unknown>[] = files.map((f) => {
    const m = matter(f.text);
    const d = m.data as Record<string, unknown>;
    return {
      ...d,
      title: d.title ?? f.name.replace(/\.md$/i, "").replace(/[-_]+/g, " "),
      slug: d.slug ?? f.name.replace(/\.md$/i, ""),
      category: d.category ?? d.category_slug,
      body: m.content,
      sources: typeof d.sources === "string" ? d.sources : Array.isArray(d.sources) ? d.sources.join("\n") : undefined,
      published_at: d.published_at instanceof Date ? d.published_at.toISOString() : d.published_at,
    };
  });
  const res = await importPosts(rows, offset, opts);
  return res.map((r, i) => ({ ...r, title: r.title || files[i]?.name || "" }));
}

export type { Author };