import Link from "next/link";

function windowed(page: number, total: number): (number | "…")[] {
  const set = new Set([1, total, page, page - 1, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export default function Pagination({ page, totalPages, href }: { page: number; totalPages: number; href: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const item = "flex h-10 min-w-10 items-center justify-center rounded-full border px-3 font-heading text-[13px] font-bold transition";
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={`${item} border-[var(--tv-line)] bg-[var(--tv-card)] text-[var(--tv-body)] hover:border-[var(--tv-lime)] hover:text-[var(--tv-accent)]`}>
          ← Previous
        </Link>
      )}
      {windowed(page, totalPages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-[var(--tv-faint)]" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${item} ${n === page ? "border-[var(--tv-lime)] bg-[var(--tv-lime)] text-[#0F1209]" : "border-[var(--tv-line)] bg-[var(--tv-card)] text-[var(--tv-body)] hover:border-[var(--tv-lime)] hover:text-[var(--tv-accent)]"}`}
          >
            {n}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} rel="next" className={`${item} border-[var(--tv-line)] bg-[var(--tv-card)] text-[var(--tv-body)] hover:border-[var(--tv-lime)] hover:text-[var(--tv-accent)]`}>
          Next →
        </Link>
      )}
    </nav>
  );
}
