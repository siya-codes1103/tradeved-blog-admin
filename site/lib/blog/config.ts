export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tradeved.com").replace(/\/$/, "");
export const SITE_NAME = "TradeVed";
export const BLOG_BASE = "/blog";

export const POSTS_PER_PAGE = 12;
// Pages are rebuilt in the background at most once an hour (export const revalidate = 3600 in each page),
// and immediately after any admin save. Next.js needs that value written literally in every page file.

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const STATUSES = ["draft", "scheduled", "published"] as const;

/** Set to true to require a named reviewer before a post can be published (recommended for finance content). */
export const REQUIRE_REVIEWER_TO_PUBLISH = false;

export const COVER_MAX_WIDTH = 1400;

export const DEFAULT_DISCLAIMER =
  "Educational content only. It does not constitute investment advice, a recommendation, or a promise of returns.";
