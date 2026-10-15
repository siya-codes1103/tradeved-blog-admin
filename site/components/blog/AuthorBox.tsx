import Image from "next/image";
import Link from "next/link";
import type { Author } from "@/lib/blog/types";
import { authorPath, initials } from "@/lib/blog/utils";

export function Avatar({ author, size = 40, tone = "dark" }: { author: Author; size?: number; tone?: "dark" | "lime" }) {
  return author.avatar_url ? (
    <Image src={author.avatar_url} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full border border-[#9BEC00]/30 font-heading font-extrabold"
      style={{ width: size, height: size, fontSize: size * 0.36, background: tone === "lime" ? "#9BEC00" : "#0F1209", color: tone === "lime" ? "#0F1209" : "#9BEC00" }}
    >
      {initials(author.name)}
    </span>
  );
}

function Person({ label, a, tone, check }: { label: string; a: Author; tone: "dark" | "lime"; check?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar author={a} size={34} tone={tone} />
      <div className="leading-tight">
        <p className="font-heading text-[10px] font-bold uppercase tracking-wider text-[var(--tv-mut)]">{label}</p>
        <Link href={authorPath(a.slug)} className="font-heading text-[13px] font-extrabold text-[var(--tv-ink)] hover:text-[var(--tv-accent)]">
          {a.name}
          {check && (
            <span title="Reviewed" className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#0F1209] align-[-2px] text-[10px] text-[#9BEC00]">
              ✓
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

export function Byline({ author, reviewer }: { author: Author | null; reviewer: Author | null }) {
  if (!author && !reviewer) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {author && <Person label="Written by" a={author} tone="dark" />}
      {reviewer && <Person label="Reviewed by" a={reviewer} tone="lime" check />}
    </div>
  );
}

export default function AuthorBox({ author }: { author: Author }) {
  return (
    <section aria-label="About the author" className="my-8 flex gap-4 rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-5">
      <Avatar author={author} size={56} />
      <div>
        <p className="font-heading text-[16px] font-extrabold text-[var(--tv-ink)]">
          <Link href={authorPath(author.slug)} className="hover:text-[var(--tv-accent)]">
            {author.name}
          </Link>
          {author.role && <span className="font-body text-[13px] font-normal text-[var(--tv-mut)]"> · {author.role}</span>}
        </p>
        {author.bio && <p className="mt-1 font-body text-[14px] leading-[21px] text-[var(--tv-body)]">{author.bio}</p>}
      </div>
    </section>
  );
}
