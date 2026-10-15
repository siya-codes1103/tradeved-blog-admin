import type { Heading } from "@/lib/blog/markdown";

export default function Toc({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;
  return (
    <nav aria-label="In this article" className="rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-4">
      <p className="mb-2 font-heading text-[14px] font-bold text-[var(--tv-ink)]">In this article</p>
      <ol className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="block border-l-2 border-[var(--tv-line)] py-1 pl-3 font-body text-[13px] leading-[18px] text-[var(--tv-mut)] transition hover:border-[var(--tv-lime)] hover:text-[var(--tv-accent)]">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
