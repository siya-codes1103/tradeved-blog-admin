import { SITE_NAME, SITE_URL } from "./config";
import type { Author, Category, Faq, PostWithRefs } from "./types";
import { absolute, authorPath, postUrl } from "./utils";

type Json = Record<string, unknown>;

const publisher: Json = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: `${SITE_URL}/logo1.png` },
};

const person = (a: Author): Json => ({
  "@type": "Person",
  name: a.name,
  url: absolute(authorPath(a.slug)),
  ...(a.role ? { jobTitle: a.role } : {}),
  ...(a.linkedin_url ? { sameAs: [a.linkedin_url] } : {}),
});

export function breadcrumbSchema(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absolute(it.path) })),
  };
}

export function articleSchema(post: PostWithRefs, category: Category | null, wordCountValue: number): Json {
  const url = postUrl(post);
  const image = post.cover_url ?? `${url}/opengraph-image`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.seo_title || post.title,
    description: post.description,
    image: [image],
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    wordCount: wordCountValue,
    articleSection: category?.name,
    keywords: [post.primary_keyword, ...post.secondary_keywords].filter(Boolean).join(", ") || undefined,
    author: post.author ? person(post.author) : { "@type": "Organization", name: SITE_NAME },
    ...(post.reviewer ? { reviewedBy: person(post.reviewer) } : {}),
    publisher,
    inLanguage: "en-IN",
  };
}

export function faqSchema(faqs: Faq[]): Json | null {
  const valid = faqs.filter((f) => f.q && f.a);
  if (!valid.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: valid.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function blogSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} Blog`,
    url: `${SITE_URL}/blog`,
    description: "Trading and investing guides for Indian markets, explained simply.",
    publisher,
    inLanguage: "en-IN",
  };
}

export function collectionSchema(name: string, path: string, description: string): Json {
  return { "@context": "https://schema.org", "@type": "CollectionPage", name, url: absolute(path), description, isPartOf: { "@type": "Blog", url: `${SITE_URL}/blog` } };
}

export function profileSchema(a: Author): Json {
  return { "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { ...person(a), ...(a.bio ? { description: a.bio } : {}), ...(a.avatar_url ? { image: a.avatar_url } : {}) } };
}
