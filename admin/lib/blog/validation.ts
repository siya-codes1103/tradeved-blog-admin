import { z } from "zod";
import { LEVELS, REQUIRE_REVIEWER_TO_PUBLISH, STATUSES } from "@/lib/blog/config";
import { wordCount } from "@/lib/blog/utils";

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["page", "search", "author", "feed-xml", "sitemap-xml"]);

const faq = z.object({
  q: z.string().trim().min(1, "Question is empty").max(300),
  a: z.string().trim().min(1, "Answer is empty").max(2000),
});

const postShape = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(5, "Title is too short").max(160, "Title is too long"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug is too short")
    .max(120)
    .regex(SLUG_RE, "Use lowercase letters, numbers and single hyphens only")
    .refine((s) => !RESERVED_SLUGS.has(s), "This slug is reserved"),
  category_slug: z.string().trim().min(1, "Choose a category"),
  level: z.enum(LEVELS),
  description: z.string().trim().max(320, "Description is too long").default(""),
  seo_title: z.string().trim().max(120).nullable().default(null),
  body: z.string().max(200_000, "Body is too long").default(""),
  author_id: z.string().max(80).nullable().default(null),
  reviewer_id: z.string().max(80).nullable().default(null),
  cover_url: z.string().max(1000).refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Use an uploaded image or a full https link").nullable().default(null),
  cover_alt: z.string().trim().max(200).nullable().default(null),
  primary_keyword: z.string().trim().max(120).nullable().default(null),
  secondary_keywords: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  faqs: z.array(faq).max(20).default([]),
  sources: z.string().trim().max(3000).nullable().default(null),
  status: z.enum(STATUSES),
  published_at: z.string().datetime({ offset: true }).nullable().default(null),
  previous_slug: z.string().optional(),
  noindex: z.boolean().default(false),
});

/** A post may be saved as a draft with almost anything. Going live needs the basics for trust and SEO. */
export const postInputSchema = postShape.superRefine((v, ctx) => {
  if (v.status === "draft") return;
  const need = (ok: boolean, path: string, message: string) => ok || ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
  need(v.description.length >= 50, "description", "Add a quick answer / description (at least 50 characters) before publishing");
  need(wordCount(v.body) >= 100, "body", "Body needs at least 100 words before publishing");
  need(!!v.author_id, "author_id", "Choose an author before publishing");
  if (REQUIRE_REVIEWER_TO_PUBLISH) need(!!v.reviewer_id, "reviewer_id", "Choose a reviewer before publishing (finance content)");
  need(!!v.published_at, "published_at", "Set a publish date");
});

export type PostInput = z.output<typeof postInputSchema>;
export type PostFormPayload = z.input<typeof postInputSchema>;

export const authorSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).regex(SLUG_RE),
  role: z.string().trim().max(120).nullable().default(null),
  bio: z.string().trim().max(600).nullable().default(null),
  avatar_url: z.string().url().max(1000).nullable().default(null),
  linkedin_url: z.string().url().max(500).nullable().default(null),
});
export type AuthorInput = z.output<typeof authorSchema>;

/** Row shape accepted by bulk import. Everything except title and category is optional. */
export const importRowSchema = z.object({
  title: z.string().trim().min(5),
  slug: z.string().trim().optional(),
  category: z.string().trim().optional(),
  level: z.string().trim().optional(),
  author: z.string().trim().optional(),
  reviewer: z.string().trim().optional(),
  description: z.string().trim().optional(),
  body: z.string().optional(),
  primary_keyword: z.string().trim().optional(),
  secondary_keywords: z.union([z.string(), z.array(z.string())]).optional(),
  sources: z.string().optional(),
  cover_url: z.string().trim().optional(),
  cover_alt: z.string().trim().optional(),
  cover: z.string().trim().optional(),
  status: z.string().trim().optional(),
  published_at: z.union([z.string(), z.date()]).optional().nullable(),
  noindex: z.union([z.boolean(), z.string()]).optional(),
  seo_title: z.string().trim().optional(),
  redirect_from: z.union([z.string(), z.array(z.string())]).optional(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
});
export type ImportRow = z.infer<typeof importRowSchema>;

export function zodMessages(error: z.ZodError): { error: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  const first = error.issues[0];
  return { error: first ? first.message : "Invalid data", fieldErrors };
}

export const categorySchema = z.object({
  editing: z.boolean().default(false),
  name: z.string().trim().min(2, "Name is too short").max(80),
  slug: z.string().trim().min(2, "Slug is too short").max(80).regex(SLUG_RE, "Use lowercase letters, numbers and single hyphens only"),
  description: z.string().trim().max(400).nullable().default(null),
  sort: z.number().int().min(0).max(10_000).default(0),
  accent: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #9BEC00").default("#9BEC00"),
});