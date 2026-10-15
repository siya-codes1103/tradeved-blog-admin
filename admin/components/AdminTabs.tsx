"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ALL = [
  { href: "/", label: "All posts" },
  { href: "/new", label: "New post" },
  { href: "/bulk", label: "Bulk import & export" },
  { href: "/authors", label: "Authors" },
  { href: "/guide", label: "How it works" },
];

export default function AdminTabs({ showCategories = false }: { showCategories?: boolean }) {
  const path = usePathname();
  const TABS = showCategories ? [...ALL.slice(0, 3), { href: "/categories", label: "Categories" }, ...ALL.slice(3)] : ALL;
  const active = (href: string) => (href === "/" ? path === "/" || !TABS.slice(1).some((t) => path.startsWith(t.href)) : path.startsWith(href));
  return (
    <nav aria-label="Admin sections" className="-mx-5 overflow-x-auto border-b border-[var(--tv-line)] px-5 md:mx-0 md:px-0">
      <ul className="flex gap-1">
        {TABS.map((t) => (
          <li key={t.href} className="shrink-0">
            <Link
              href={t.href}
              aria-current={active(t.href) ? "page" : undefined}
              className={`-mb-px block whitespace-nowrap border-b-[3px] px-4 py-3 font-heading text-[14px] font-bold transition ${
                active(t.href) ? "border-[var(--tv-lime)] text-[var(--tv-ink)]" : "border-transparent text-[var(--tv-mut)] hover:text-[var(--tv-ink)]"
              }`}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}