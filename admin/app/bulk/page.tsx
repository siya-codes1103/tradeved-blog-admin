import BulkImport from "@/components/BulkImport";
import { getCategories } from "@/lib/data";
import { btnGhost, card } from "@/components/ui";

export default async function BulkPage() {
  return (
    <div className="space-y-8">
      <BulkImport categories={await getCategories()} />
      <section className={`${card} max-w-3xl`}>
        <h2 className="font-heading text-[22px] font-extrabold text-[var(--tv-ink)]">Export</h2>
        <p className="mb-4 mt-1 font-body text-[14px] leading-[22px] text-[var(--tv-body)]">Download a list of every article (title, category, status, keywords, dates) as a CSV file for a spreadsheet.</p>
        <a href="/export" className={btnGhost}>Download CSV</a>
      </section>
    </div>
  );
}