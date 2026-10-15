import Link from "next/link";
import ConfirmButton from "@/components/ConfirmButton";
import { btn, btnGhost, field } from "@/components/ui";
import { getCategories, listAdminPosts, scoreTone } from "@/lib/data";
import { formatDate, postPath } from "@/lib/blog/utils";
import { SITE_ORIGIN } from "@/lib/site-origin";
import { deletePostAction } from "./actions";

type SP = { q?: string; status?: string; category?: string; page?: string };
const tone = { good: "bg-[var(--tv-lime)] text-[#0F1209]", mid: "bg-[#FDE900] text-[#0F1209]", low: "bg-[#CC0066] text-white" } as const;

export default async function AdminPosts({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const categories = await getCategories();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const { rows: shown, pages: totalPages, tiles } = await listAdminPosts({ q: sp.q, status: sp.status, category: sp.category, page });
  const now = Date.now();
  const isLive = (p: { status: string; published_at: string | null }) => p.status !== "draft" && !!p.published_at && new Date(p.published_at).getTime() <= now;
  const link = (n: number) => `/?${new URLSearchParams({ ...(sp.q && { q: sp.q }), ...(sp.status && { status: sp.status }), ...(sp.category && { category: sp.category }), page: String(n) })}`;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(({ label, value: n }) => (
          <div key={label} className="rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] px-5 py-4">
            <p className="font-heading text-[30px] font-extrabold leading-none text-[var(--tv-ink)]">{n}</p>
            <p className="mt-2 font-body text-[12px] font-semibold text-[var(--tv-mut)]">{label}</p>
          </div>
        ))}
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-center gap-3">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search posts…" className={`${field} !mt-0 max-w-xs flex-1`} />
        <select name="status" defaultValue={sp.status ?? ""} className={`${field} !mt-0 !w-auto`} aria-label="Status">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Draft</option>
        </select>
        <select name="category" defaultValue={sp.category ?? ""} className={`${field} !mt-0 !w-auto`} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <button className={btnGhost}>Filter</button>
        <Link href="/new" className={`${btn} ml-auto`}>+ New post</Link>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)]">
        <table className="w-full min-w-[760px] text-left font-body text-[13px]">
          <thead>
            <tr className="border-b border-[var(--tv-line)] text-[11px] uppercase tracking-wider text-[var(--tv-mut)]">
              <th className="px-4 py-3 font-heading font-bold">Title</th>
              <th className="px-4 py-3 font-heading font-bold">Category</th>
              <th className="px-4 py-3 font-heading font-bold">Status</th>
              <th className="px-4 py-3 font-heading font-bold">SEO</th>
              <th className="px-4 py-3 font-heading font-bold">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tv-line)]">
            {shown.map(({ p, score }) => (
              <tr key={p.slug} className="hover:bg-[var(--tv-soft)]">
                <td className="max-w-md px-4 py-3">
                  <Link href={`/${p.slug}`} className="font-heading text-[14px] font-bold text-[var(--tv-ink)] hover:text-[var(--tv-accent)]">{p.title}</Link>
                  <p className="mt-0.5 text-[11px] text-[var(--tv-mut)]">/{p.category_slug}/{p.slug}</p>
                </td>
                <td className="px-4 py-3 text-[var(--tv-body)]">{categories.find((c) => c.slug === p.category_slug)?.name ?? p.category_slug}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 font-heading text-[11px] font-bold ${isLive(p) ? "bg-[var(--tv-soft)] text-[var(--tv-accent)]" : "bg-[var(--tv-line)] text-[var(--tv-body)]"}`}>
                    {isLive(p) ? "Live" : p.status === "scheduled" ? "Scheduled" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 font-heading text-[11px] font-extrabold ${tone[scoreTone(score)]}`}>{score}</span></td>
                <td className="px-4 py-3 text-[var(--tv-mut)]">{formatDate(p.published_at ?? p.updated_at)}</td>
                <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right">
                  {isLive(p) && <a href={`${SITE_ORIGIN}${postPath(p)}`} target="_blank" rel="noreferrer" className="font-heading text-[12px] font-bold text-[var(--tv-body)] hover:text-[var(--tv-accent)]">View ↗</a>}
                  <ConfirmButton action={deletePostAction.bind(null, p.slug)} message={`Delete "${p.title}"? This cannot be undone.`}>Delete</ConfirmButton>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-14 text-center text-[var(--tv-mut)]">No posts found. Click <strong className="text-[var(--tv-ink)]">New post</strong> or use <strong className="text-[var(--tv-ink)]">Bulk import</strong>.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 font-body text-[13px] text-[var(--tv-body)]">
          {page > 1 && <Link href={link(page - 1)} className={btnGhost}>← Previous</Link>}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={link(page + 1)} className={btnGhost}>Next →</Link>}
        </div>
      )}

      <p className="mt-6 rounded-r-xl border-l-4 border-[var(--tv-lime)] bg-[var(--tv-soft)] px-5 py-3.5 font-body text-[14px] text-[var(--tv-ink)]">
        <strong>Published</strong> posts appear on the blog once their date has come. <strong>Draft</strong> stays hidden. <strong>Scheduled</strong> goes live on its date, after your next deploy or within an hour on the live site.
      </p>
    </div>
  );
}