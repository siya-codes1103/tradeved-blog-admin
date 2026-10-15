import type { LEVELS, STATUSES } from "./config";

export type Level = (typeof LEVELS)[number];
export type Status = (typeof STATUSES)[number];

export interface Category {
  slug: string;
  name: string;
  description: string | null;
  sort: number;
  accent: string;
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Post {
  id: string;
  slug: string;
  category_slug: string;
  title: string;
  seo_title: string | null;
  description: string;
  body: string;
  level: Level;
  author_id: string | null;
  reviewer_id: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[];
  faqs: Faq[];
  sources: string | null;
  status: Status;
  noindex: boolean;
  /** Old slugs of this article. Visiting one of them redirects (301) to the current URL. */
  redirect_from: string[];
  read_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithRefs extends Post {
  author: Author | null;
  reviewer: Author | null;
}

export type PostCardData = Pick<
  Post,
  "id" | "slug" | "category_slug" | "title" | "description" | "level" | "cover_url" | "cover_alt" | "read_minutes" | "published_at" | "updated_at"
>;