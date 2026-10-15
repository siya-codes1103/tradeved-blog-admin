import Link from "next/link";
import type { Category } from "@/lib/blog/types";
import { categoryPath } from "@/lib/blog/utils";

export default function CategoryChips({ categories, active }: { categories: Category[]; active?: string }) {
  const base = "block whitespace-nowrap rounded-full border px-4 py-2 font-heading text-[13px] font-bold leading-none transition";
  const on = "border-[var(--tv-lime)] bg-[var(--tv-lime)] text-[#0F1209]";
  const off = "border-[var(--tv-line)] bg-[var(--tv-card)] text-[var(--tv-body)] hover:border-[var(--tv-lime)] hover:text-[var(--tv-accent)]";
  return (
    <nav aria-label="Blog categories" className="-mx-6 overflow-x-auto px-6">
      <ul className="flex gap-2 pb-1">
        <li className="shrink-0">
          <Link href="/blog" className={`${base} ${!active ? on : off}`} aria-current={!active ? "page" : undefined}>
            All
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link href={categoryPath(c.slug)} className={`${base} ${active === c.slug ? on : off}`} aria-current={active === c.slug ? "page" : undefined}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
