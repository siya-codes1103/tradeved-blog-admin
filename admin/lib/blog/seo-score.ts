import type { Faq } from "@/lib/blog/types";
import { slugify, wordCount } from "@/lib/blog/utils";

export interface SeoInput {
  title: string;
  slug: string;
  description: string;
  body: string;
  primary_keyword: string | null;
  secondary_keywords: string[];
  cover_url: string | null;
  cover_alt: string | null;
  faqs: Faq[];
  author_id: string | null;
  reviewer_id: string | null;
}

export interface SeoCheck {
  ok: boolean;
  label: string;
}

const has = (text: string, kw: string) => !!kw && text.toLowerCase().includes(kw.toLowerCase());

export function seoChecks(x: SeoInput): SeoCheck[] {
  const kw = (x.primary_keyword ?? "").trim();
  const words = wordCount(x.body);
  const first100 = x.body.split(/\s+/).slice(0, 100).join(" ");
  const h2 = (x.body.match(/^## /gm) ?? []).length;
  const links = (x.body.match(/\[\[|\]\(\//g) ?? []).length;
  const occurrences = kw ? x.body.toLowerCase().split(kw.toLowerCase()).length - 1 : 0;
  const density = words && kw ? ((occurrences * kw.split(/\s+/).length) / words) * 100 : 0;

  return [
    { ok: !!kw, label: "Primary keyword is set" },
    { ok: has(x.title, kw), label: "Keyword in title" },
    { ok: x.title.length >= 30 && x.title.length <= 65, label: `Title is 30–65 characters (now ${x.title.length})` },
    { ok: x.description.length >= 120 && x.description.length <= 160, label: `Description is 120–160 characters (now ${x.description.length})` },
    { ok: has(x.description, kw), label: "Keyword in description" },
    { ok: !!kw && x.slug.includes(slugify(kw)), label: "Keyword in URL" },
    { ok: has(first100, kw), label: "Keyword in the first 100 words" },
    { ok: density >= 0.5 && density <= 2.5, label: `Keyword density 0.5–2.5% (now ${density.toFixed(1)}%)` },
    { ok: words >= 800, label: `800+ words (now ${words})` },
    { ok: h2 >= 3, label: `3+ section headings (now ${h2})` },
    { ok: links >= 2, label: `2+ glossary or internal links (now ${links})` },
    { ok: !!x.cover_url && !!x.cover_alt, label: "Cover image with alt text" },
    { ok: x.faqs.filter((f) => f.q && f.a).length >= 2, label: "2+ FAQs" },
    { ok: !!x.author_id && !!x.reviewer_id, label: "Author and reviewer named" },
    { ok: x.secondary_keywords.length >= 2, label: "2+ secondary keywords" },
  ];
}

export function seoScore(x: SeoInput): number {
  const c = seoChecks(x);
  return Math.round((c.filter((k) => k.ok).length / c.length) * 100);
}

export function scoreTone(n: number): "good" | "mid" | "low" {
  return n >= 80 ? "good" : n >= 50 ? "mid" : "low";
}
