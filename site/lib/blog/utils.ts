import { BLOG_BASE, SITE_URL } from "./config";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Words in the readable text of a post body (data-block markers and markdown symbols excluded). */
export function wordCount(body: string): number {
  const text = body
    .replace(/^:::.*$/gm, " ")
    .replace(/^\s*[-+>]\s+/gm, " ")
    .replace(/[#*[\]()|]/g, " ");
  return (text.match(/\S+/g) ?? []).length;
}

export function readMinutes(body: string): number {
  return Math.max(1, Math.round(wordCount(body) / 200));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));
}

export function postPath(p: { category_slug: string; slug: string }): string {
  return `${BLOG_BASE}/${p.category_slug}/${p.slug}`;
}
export function postUrl(p: { category_slug: string; slug: string }): string {
  return `${SITE_URL}${postPath(p)}`;
}
export function categoryPath(slug: string, page = 1): string {
  return page > 1 ? `${BLOG_BASE}/${slug}/page/${page}` : `${BLOG_BASE}/${slug}`;
}
export function authorPath(slug: string): string {
  return `${BLOG_BASE}/author/${slug}`;
}
export function absolute(path: string): string {
  return `${SITE_URL}${path}`;
}

/** Deterministic number from a string, used to draw the same fallback cover for the same post. */
export function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Text colour that stays readable on a given hex background. */
export function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#0F1209";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.55 ? "#0F1209" : "#FFFFFF";
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}
