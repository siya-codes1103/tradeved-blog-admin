import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/blog/AuthorBox";
import Breadcrumbs from "@/components/blog/Breadcrumbs";
import JsonLd from "@/components/blog/JsonLd";
import PostCard from "@/components/blog/PostCard";
import { SITE_NAME } from "@/lib/blog/config";
import { getAuthor, getAuthorPosts, getAuthorSlugs, getCategories } from "@/lib/blog/repository";
import { breadcrumbSchema, profileSchema } from "@/lib/blog/schema";
import { absolute, authorPath } from "@/lib/blog/utils";

export const revalidate = 3600; // must be a literal number
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getAuthorSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAuthor(slug);
  if (!a) return { title: { absolute: `Author not found | ${SITE_NAME}` }, robots: { index: false } };
  const title = `${a.name}${a.role ? `, ${a.role}` : ""} | ${SITE_NAME}`;
  return {
    title: { absolute: title },
    description: a.bio ?? `Articles by ${a.name} on ${SITE_NAME}.`,
    alternates: { canonical: absolute(authorPath(slug)) },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) notFound();
  const [posts, categories] = await Promise.all([getAuthorPosts(author.id), getCategories()]);
  const catMap = new Map(categories.map((c) => [c.slug, c]));
  return (
    <>
      <JsonLd data={[profileSchema(author), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: author.name, path: authorPath(slug) }])]} />
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }, { name: author.name }]} />
        <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar author={author} size={88} />
          <div>
            <h1 className="font-heading text-[34px] font-bold text-[var(--tv-ink)] md:text-[44px]">{author.name}</h1>
            {author.role && <p className="font-body text-[15px] text-[var(--tv-body)]">{author.role}</p>}
            {author.bio && <p className="mt-3 max-w-2xl font-body text-[15px] leading-[24px] text-[var(--tv-body)]">{author.bio}</p>}
            {author.linkedin_url && (
              <a href={author.linkedin_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-body text-[14px] font-semibold text-[var(--tv-accent)] hover:underline">
                LinkedIn →
              </a>
            )}
          </div>
        </header>
        <h2 className="mt-12 font-heading text-[22px] font-bold text-[var(--tv-ink)]">Articles ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="py-16 text-center font-body text-[var(--tv-mut)]">No published articles yet.</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} category={catMap.get(p.category_slug)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
