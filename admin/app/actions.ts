"use server";

import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { API_MODE } from "@/lib/api/config";
import { api, ApiError } from "@/lib/api/client";
import { getAuthors, getCategories, getPostBySlug } from "@/lib/data";
import { STARTER_CATEGORIES } from "@/lib/blog/starter-categories";
import { LEVELS } from "@/lib/blog/config";
import { readAllPosts, readAuthors, readCategories } from "@/lib/blog/store";
import { assertDev, postExists, removePost, saveCoverFile, writeAuthors, writePost } from "@/lib/blog/writer";
import type { Author, Post } from "@/lib/blog/types";
import { categorySchema, authorSchema, importRowSchema, postInputSchema, zodMessages, type PostFormPayload } from "@/lib/blog/validation";
import { normalizeBody } from "@/lib/blog/normalize";
import { readMinutes, slugify } from "@/lib/blog/utils";

type Fail = { ok: false; error: string; fieldErrors?: Record<string, string> };
type Ok<T = object> = { ok: true } & T;

/** Turns any error into the { ok: false } answer the forms understand. Sign-in redirects must pass through untouched. */
const failFrom = (e: unknown, fallback: string): Fail => {
  unstable_rethrow(e);
  if (e instanceof ApiError) return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
  return { ok: false, error: e instanceof Error ? e.message : fallback };
};

const refresh = () => {
  revalidatePath("/blog", "layout");
  revalidatePath("/", "layout");
};

export async function savePost(payload: PostFormPayload): Promise<Ok<{ slug: string }> | Fail> {
  try {
    if (!API_MODE) assertDev();
    const parsed = postInputSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, ...zodMessages(parsed.error) };
    const v = parsed.data;
    const previous = v.previous_slug || undefined;
    if (API_MODE) {
      // The backend keeps the old address as a 301 redirect when the slug changes, and checks everything again.
      const { previous_slug: _p, level: _l, id: _i, ...body } = v;
      const existing = previous ? await getPostBySlug(previous) : null;
      if (previous && !existing) return { ok: false, error: "This article no longer exists. Reload the page." };
      const saved = existing
        ? await api<{ slug: string }>(`/blog/admin/posts/${existing.id}`, { method: "PUT", json: body })
        : await api<{ slug: string }>("/blog/admin/posts", { method: "POST", json: body });
      refresh();
      return { ok: true, slug: saved.slug };
    }
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
    return failFrom(e, "Could not save");
  }
}

export async function deletePost(slug: string): Promise<Ok | Fail> {
  try {
    if (API_MODE) {
      const post = await getPostBySlug(slug);
      if (post) await api(`/blog/admin/posts/${post.id}`, { method: "DELETE" });
    } else {
      removePost(slug);
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return failFrom(e, "Could not delete");
  }
}

export async function deletePostAction(slug: string) {
  await deletePost(slug);
}

export async function uploadCover(form: FormData): Promise<Ok<{ url: string }> | Fail> {
  try {
    if (!API_MODE) assertDev();
    const file = form.get("file");
    const base = slugify(String(form.get("name") ?? "cover")) || "cover";
    if (!(file instanceof Blob) || file.size === 0) return { ok: false, error: "No image received" };
    if (file.size > 4 * 1024 * 1024) return { ok: false, error: "Image is larger than 4 MB" };
    if (API_MODE) {
      const fd = new FormData();
      fd.append("file", file, `${base}.webp`);
      const r = await api<{ url: string }>("/blog/admin/upload", { method: "POST", body: fd });
      return { ok: true, url: r.url };
    }
    const url = saveCoverFile(`${base}-${Date.now()}.webp`, Buffer.from(await file.arrayBuffer()));
    return { ok: true, url };
  } catch (e) {
    return failFrom(e, "Upload failed");
  }
}

export async function saveAuthor(input: unknown): Promise<Ok | Fail> {
  try {
    if (!API_MODE) assertDev();
    const parsed = authorSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessages(parsed.error).error };
    const { id, ...a } = parsed.data;
    if (API_MODE) {
      if (id) await api(`/blog/admin/authors/${id}`, { method: "PUT", json: a });
      else await api("/blog/admin/authors", { method: "POST", json: a });
      refresh();
      return { ok: true };
    }
    const list = readAuthors().map(({ id: _id, ...rest }) => rest);
    const prev = id || undefined;
    if (list.some((x) => x.slug === a.slug && x.slug !== prev)) return { ok: false, error: "This slug is already used" };
    const next = prev ? list.map((x) => (x.slug === prev ? a : x)) : [...list, a];
    writeAuthors(next);
    refresh();
    return { ok: true };
  } catch (e) {
    return failFrom(e, "Could not save");
  }
}

export async function deleteAuthor(slug: string): Promise<Ok | Fail> {
  try {
    if (API_MODE) {
      await api(`/blog/admin/authors/${slug}`, { method: "DELETE" }); // in API mode this value is the author id
    } else {
      assertDev();
      writeAuthors(readAuthors().filter((a) => a.slug !== slug).map(({ id: _id, ...rest }) => rest));
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return failFrom(e, "Could not delete");
  }
}

/** Categories are managed here only in API mode. In file mode they are the file site/content/categories.json. */
export async function saveCategory(input: unknown): Promise<Ok | Fail> {
  try {
    if (!API_MODE) return { ok: false, error: "Categories are edited in site/content/categories.json in local file mode." };
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessages(parsed.error).error };
    const { editing, ...c } = parsed.data;
    if (editing) await api(`/blog/admin/categories/${encodeURIComponent(c.slug)}`, { method: "PUT", json: c });
    else await api("/blog/admin/categories", { method: "POST", json: c });
    refresh();
    return { ok: true };
  } catch (e) {
    return failFrom(e, "Could not save");
  }
}

export async function deleteCategory(slug: string): Promise<Ok | Fail> {
  try {
    if (!API_MODE) return { ok: false, error: "Not available in local file mode." };
    await api(`/blog/admin/categories/${encodeURIComponent(slug)}`, { method: "DELETE" });
    refresh();
    return { ok: true };
  } catch (e) {
    return failFrom(e, "Could not delete");
  }
}

/** Adds the 8 TradeVed categories to an empty database. Skips any that already exist. */
export async function addStarterCategories(): Promise<Ok | Fail> {
  try {
    if (!API_MODE) return { ok: false, error: "Not available in local file mode." };
    const have = new Set((await getCategories()).map((c) => c.slug));
    for (const c of STARTER_CATEGORIES) if (!have.has(c.slug)) await api("/blog/admin/categories", { method: "POST", json: c });
    refresh();
    return { ok: true };
  } catch (e) {
    return failFrom(e, "Could not add categories");
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
  /** Used for any article that has no category of its own. */
  defaultCategory?: string;
}

const truthy = (v: unknown) => v === true || /^(1|true|yes)$/i.test(String(v ?? ""));

function toIso(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Fields the backend needs for one article (it checks them again and decides create / update / skip). */
type ApiPostBody = Record<string, unknown>;

/**
 * Shared import core for CSV, JSON and Markdown.
 * File mode writes one .md file per article into the site. API mode sends the finished articles to the backend.
 * Unknown author/reviewer names are created automatically so imports never lose attribution.
 */
export async function importPosts(rows: unknown[], offset = 0, opts: ImportOptions = { status: "draft", overwrite: false }): Promise<ImportResult[]> {
  const out: ImportResult[] = [];
  try {
    if (!API_MODE) assertDev();
  } catch (e) {
    return [{ index: offset, title: "", ok: false, error: e instanceof Error ? e.message : "Not allowed" }];
  }
  try {
    return await runImport(rows, offset, opts, out);
  } catch (e) {
    unstable_rethrow(e);
    return [...out, { index: offset, title: "", ok: false, error: e instanceof Error ? e.message : "Import failed" }];
  }
}

async function runImport(rows: unknown[], offset: number, opts: ImportOptions, out: ImportResult[]): Promise<ImportResult[]> {
  const cats = new Map<string, string>();
  for (const c of await getCategories()) {
    cats.set(c.slug.toLowerCase(), c.slug);
    cats.set(c.name.toLowerCase(), c.slug);
  }
  // File mode: an author is identified by its slug. API mode: by the id the backend gave it.
  const fileAuthors = API_MODE ? [] : readAuthors().map(({ id: _id, ...rest }) => rest);
  const people = new Map<string, string>();
  for (const a of await getAuthors()) {
    const key = API_MODE ? a.id : a.slug;
    people.set(a.slug.toLowerCase(), key);
    people.set(a.name.toLowerCase(), key);
  }
  let createdAuthors = false;
  const person = async (name?: string): Promise<string | null> => {
    const n = (name ?? "").trim();
    if (!n) return null;
    const hit = people.get(n.toLowerCase());
    if (hit) return hit;
    const slug = slugify(n);
    if (!slug) return null;
    const display = /^[a-z0-9]+(-[a-z0-9]+)+$/.test(n) ? n.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") : n;
    let key = slug;
    if (API_MODE) {
      const made = await api<{ id: string }>("/blog/admin/authors", { method: "POST", json: { slug, name: display, role: "Contributor", bio: "", avatar_url: null, linkedin_url: null } });
      key = made.id;
    } else {
      fileAuthors.push({ slug, name: display, role: "Contributor", bio: "", avatar_url: null, linkedin_url: null });
      createdAuthors = true;
    }
    people.set(n.toLowerCase(), key);
    people.set(slug, key);
    return key;
  };

  const batch: { rowIndex: number; title: string; body: ApiPostBody }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const index = offset + i;
    const parsed = importRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const field = String(first?.path[0] ?? "row");
      out.push({ index, title: String((rows[i] as { title?: string })?.title ?? ""), ok: false, error: field === "title" ? `Title is missing or too short (${first?.message})` : `${field}: ${first?.message ?? "invalid"}` });
      continue;
    }
    const r = parsed.data;
    const wanted = (r.category || opts.defaultCategory || "").trim();
    if (!wanted) {
      out.push({ index, title: r.title, ok: false, error: 'No category. Add "category: <slug>" to the file (or a category column), or pick a default category before importing.' });
      continue;
    }
    const category = cats.get(wanted.toLowerCase());
    if (!category) {
      out.push({ index, title: r.title, ok: false, error: `Unknown category "${wanted}". Use one of: ${Array.from(new Set(cats.values())).join(", ")}` });
      continue;
    }
    const slug = slugify(r.slug || r.title);
    if (!slug) {
      out.push({ index, title: r.title, ok: false, error: "Could not make a slug" });
      continue;
    }
    const exists = API_MODE ? false : postExists(slug);
    if (exists && !opts.overwrite) {
      out.push({ index, title: r.title, ok: false, error: "Slug already exists (skipped)" });
      continue;
    }
    const secondary = Array.isArray(r.secondary_keywords) ? r.secondary_keywords : (r.secondary_keywords ?? "").split(/[;,]/);
    const now = new Date().toISOString();
    const body = normalizeBody(r.body ?? "");
    const rowStatus = (["draft", "published", "scheduled"] as const).find((s) => s === (r.status ?? "").toLowerCase()) ?? "draft";
    const status = opts.status === "file" ? rowStatus : opts.status;
    const publishedAt = status === "draft" ? null : toIso(r.published_at) ?? now;
    try {
      const authorKey = await person(r.author);
      const reviewerKey = await person(r.reviewer);
      const redirectFrom = (Array.isArray(r.redirect_from) ? r.redirect_from : (r.redirect_from ?? "").split(/[;,]/)).map((s) => s.trim()).filter(Boolean);
      const keywords = secondary.map((s) => s.trim()).filter(Boolean).slice(0, 20);
      if (API_MODE) {
        batch.push({
          rowIndex: index,
          title: r.title,
          body: {
            slug,
            category_slug: category,
            title: r.title,
            seo_title: r.seo_title || null,
            description: r.description ?? "",
            body,
            author_id: authorKey,
            reviewer_id: reviewerKey,
            cover_url: r.cover_url || r.cover || null,
            cover_alt: r.cover_alt || null,
            primary_keyword: r.primary_keyword || null,
            secondary_keywords: keywords,
            faqs: r.faqs ?? [],
            sources: r.sources || null,
            status,
            noindex: truthy(r.noindex),
            redirect_from: redirectFrom,
            published_at: publishedAt,
          },
        });
        continue;
      }
      writePost({
        id: slug,
        slug,
        category_slug: category,
        title: r.title,
        seo_title: r.seo_title || null,
        description: r.description ?? "",
        body,
        level: ((LEVELS as readonly string[]).find((l) => l.toLowerCase() === (r.level ?? "").toLowerCase()) as Post["level"]) ?? "Beginner",
        author_id: authorKey,
        reviewer_id: reviewerKey,
        cover_url: r.cover_url || r.cover || null,
        cover_alt: r.cover_alt || null,
        primary_keyword: r.primary_keyword || null,
        secondary_keywords: keywords,
        faqs: r.faqs ?? [],
        sources: r.sources || null,
        status,
        noindex: truthy(r.noindex),
        redirect_from: redirectFrom,
        read_minutes: readMinutes(body),
        published_at: publishedAt,
        created_at: now,
        updated_at: now,
      });
      out.push({ index, title: r.title, ok: true, note: exists ? "replaced" : undefined });
    } catch (e) {
      unstable_rethrow(e);
      out.push({ index, title: r.title, ok: false, error: e instanceof Error ? e.message : "Could not write file" });
    }
  }

  if (API_MODE && batch.length) {
    const res = await api<{ index: number; ok: boolean; action?: string; error?: string }[]>("/blog/admin/posts/import", {
      method: "POST",
      json: { posts: batch.map((b) => b.body), overwrite: opts.overwrite },
    });
    res.forEach((r, k) => {
      const b = batch[k];
      if (r.ok && r.action === "skipped") out.push({ index: b.rowIndex, title: b.title, ok: false, error: "Slug already exists (skipped)" });
      else if (r.ok) out.push({ index: b.rowIndex, title: b.title, ok: true, note: r.action === "updated" ? "replaced" : undefined });
      else out.push({ index: b.rowIndex, title: b.title, ok: false, error: r.error || "Could not save" });
    });
    out.sort((x, y) => x.index - y.index);
  }
  if (createdAuthors) writeAuthors(fileAuthors);
  refresh();
  return out;
}

/** Markdown import: each file is one article (front matter + body). The file name is the slug unless `slug:` is set. */
export async function importMarkdown(files: { name: string; text: string }[], offset = 0, opts: ImportOptions = { status: "draft", overwrite: false }): Promise<ImportResult[]> {
  const asText = (v: unknown) => (typeof v === "string" ? v : undefined);
  const list = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split(/[;,]/) : undefined);
  const rows: Record<string, unknown>[] = files.map((f) => {
    const m = matter(f.text);
    const d = m.data as Record<string, unknown>;
    const seo = (d.seo && typeof d.seo === "object" ? d.seo : {}) as Record<string, unknown>;
    return {
      ...d,
      title: d.title ?? f.name.replace(/\.md$/i, "").replace(/[-_]+/g, " "),
      slug: d.slug ?? f.name.replace(/\.md$/i, ""),
      category: asText(d.category) ?? asText(d.category_slug),
      // Other tools nest these under "seo" or call the keywords something else.
      description: asText(d.description) ?? asText(seo.description),
      seo_title: asText(d.seo_title) ?? asText(seo.title),
      secondary_keywords: list(d.secondary_keywords) ?? list(d.also_known_as) ?? list(d.keywords),
      body: m.content,
      sources: typeof d.sources === "string" ? d.sources : Array.isArray(d.sources) ? d.sources.join("\n") : undefined,
      published_at: d.published_at instanceof Date ? d.published_at.toISOString() : d.published_at,
    };
  });
  const res = await importPosts(rows, offset, opts);
  return res.map((r, i) => ({ ...r, title: r.title || files[i]?.name || "" }));
}

export type { Author };