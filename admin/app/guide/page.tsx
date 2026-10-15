import { BLOCK_TEMPLATES } from "@/lib/blog/block-templates";
import { card } from "@/components/ui";

const steps: [string, string][] = [
  ["Write", "Open New post. Fill the title, category, level, quick answer, body, FAQs and keywords. The SEO panel on the right shows what is still missing."],
  ["Save", "Save creates a file in your project: content/blog/your-slug.md. Cover images go to public/blog-covers/."],
  ["Review", "Open the blog in this same dev server (View blog) to check the article exactly as visitors will see it."],
  ["Publish", "Commit the new files with git and push. Your host (for example Vercel) rebuilds the site. Category pages, related articles, sitemap and RSS update on their own."],
];

export default function Guide() {
  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-heading text-[22px] font-extrabold text-[var(--tv-ink)]">How it works</h2>
      <p className="font-body text-[15px] leading-[24px] text-[var(--tv-body)]">
        You enter each article once. Everything else is automatic. This admin only runs on your own computer (<code>npm run dev</code>) and is hidden on the live website.
      </p>
      <ol className="space-y-3">
        {steps.map(([t, d], i) => (
          <li key={t} className={`${card} flex gap-4`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tv-lime)] font-heading text-[14px] font-extrabold text-[#0F1209]">{i + 1}</span>
            <div>
              <p className="font-heading text-[16px] font-extrabold text-[var(--tv-ink)]">{t}</p>
              <p className="mt-1 font-body text-[14px] leading-[22px] text-[var(--tv-body)]">{d}</p>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="pt-4 font-heading text-[18px] font-extrabold text-[var(--tv-ink)]">Writing the body</h3>
      <div className={`${card} font-body text-[14px] leading-[24px] text-[var(--tv-body)]`}>
        <p><code>## Heading</code> makes a section and the table of contents.</p>
        <p><code>### Sub-heading</code> makes a smaller heading. <code>1. item</code> makes a numbered list. Or just use the toolbar buttons.</p>
        <p><code>![alt text](/image-url "caption")</code> shows an image. Use the Image button, which uploads and writes this for you.</p>
        <p><code>- item</code> makes a bullet list. <code>&gt; text</code> makes an example box.</p>
        <p><code>**bold**</code>, <code>[[Term]]</code> links to your glossary, <code>[label](/path)</code> makes a link.</p>
        <p>Data blocks start with <code>:::name</code> and end with <code>:::</code>. Use the &quot;Insert data&quot; buttons in the editor to add them.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["table", "facts", "bar", "proscons"] as const).map((k) => (
          <pre key={k} className="overflow-x-auto rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-4 font-mono text-[12px] leading-[19px] text-[var(--tv-body)]">{BLOCK_TEMPLATES[k]}</pre>
        ))}
      </div>

      <h3 className="pt-4 font-heading text-[18px] font-extrabold text-[var(--tv-ink)]">Good to know</h3>
      <ul className="list-disc space-y-1.5 pl-5 font-body text-[14px] leading-[22px] text-[var(--tv-body)]">
        <li>Draft articles stay hidden. Scheduled articles appear once their date has passed.</li>
        <li>If you change the slug of a live article, the old link redirects to the new one automatically.</li>
        <li>Give every article its own primary keyword. The editor warns you when two articles share one.</li>
      </ul>
    </div>
  );
}