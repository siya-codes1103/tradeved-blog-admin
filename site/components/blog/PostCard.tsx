import Image from "next/image";
import Link from "next/link";
import type { Category, PostCardData } from "@/lib/blog/types";
import { formatDate, postPath } from "@/lib/blog/utils";
import CandleArt from "./CandleArt";
import CategoryTag from "./CategoryTag";

export default function PostCard({ post, category, priority = false }: { post: PostCardData; category?: Category; priority?: boolean }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] shadow-[0_1px_0_rgba(15,18,9,.04)] transition hover:-translate-y-0.5 hover:border-[var(--tv-lime)]">
      <Link href={postPath(post)} className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-[var(--tv-accent)]">
        <div className="tv-dark relative aspect-[2/1]">
          {post.cover_url ? (
            <Image
              src={post.cover_url}
              alt={post.cover_alt || post.title}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <CandleArt seed={post.slug} />
          )}
          {category && <CategoryTag name={category.name} accent={category.accent} className="absolute left-3 top-3" />}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="flex-1 font-heading text-[16px] font-extrabold leading-[21px] text-[var(--tv-ink)] group-hover:text-[var(--tv-accent)]">{post.title}</h3>
          <p className="flex flex-wrap items-center gap-x-2 font-body text-[12px] text-[var(--tv-mut)]">
            <span>{post.read_minutes} min read</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
          </p>
        </div>
      </Link>
    </article>
  );
}