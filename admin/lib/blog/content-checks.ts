import { parseBody } from "@/lib/blog/markdown";

export interface Issue {
  level: "error" | "warn";
  text: string;
}

export interface IndexEntry {
  slug: string;
  title: string;
  category_slug: string;
  primary_keyword: string | null;
}

const BLOCK_OPEN = /^:::\s*([a-z]+)/i;

/**
 * Problems an author can fix in the editor before saving. None of these block a draft.
 * They catch what would silently break a live page: unclosed blocks, empty charts, dead internal links.
 */
export function contentIssues(x: {
  body: string;
  status: string;
  publishedAt: string | null;
  selfSlug: string;
  index: IndexEntry[];
}): Issue[] {
  const out: Issue[] = [];
  const lines = x.body.replace(/\r/g, "").split("\n");

  // 1. Data blocks: every ":::type" must be closed with ":::", and must produce something.
  let open: { type: string; line: number; start: number } | null = null;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!open) {
      const m = BLOCK_OPEN.exec(t);
      if (m && t.length > 3) open = { type: m[1].toLowerCase(), line: i + 1, start: i };
    } else if (t === ":::") {
      const chunk = lines.slice(open.start, i + 1).join("\n");
      if (parseBody(chunk).blocks.length === 0) {
        out.push({ level: "warn", text: `The "${open.type}" block near line ${open.line} is empty or incomplete, so it will not show (charts need 2+ numbers, tables 2+ rows).` });
      }
      open = null;
    }
  }
  if (open) out.push({ level: "error", text: `The "${open.type}" block near line ${open.line} is not closed. Add a line with only ::: after it, otherwise the rest of the article disappears.` });

  // 2. Images: valid address and alt text.
  for (const l of lines) {
    const t = l.trim();
    if (!t.startsWith("![")) continue;
    const m = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/.exec(t);
    if (!m) out.push({ level: "warn", text: `This image line is not written correctly and will not show: ${t.slice(0, 60)}` });
    else if (!/^\/(?!\/)|^https:\/\//i.test(m[2])) out.push({ level: "warn", text: `Image address must start with / or https:// (${m[2].slice(0, 50)})` });
    else if (!m[1].trim()) out.push({ level: "warn", text: "An image has no alt text. Describe it for readers and Google." });
  }

  // 3. Internal links to articles that do not exist.
  const known = new Set(x.index.map((p) => p.slug));
  const seen = new Set<string>();
  for (const m of x.body.matchAll(/(?:\]\(|\|\s*)\/blog\/([a-z0-9-]+)\/([a-z0-9-]+)(?=[#?)\s]|$)/gm)) {
    const slug = m[2];
    if (seen.has(slug)) continue;
    seen.add(slug);
    if (slug === x.selfSlug) out.push({ level: "warn", text: "This article links to itself." });
    else if (slug !== "page" && !known.has(slug)) out.push({ level: "error", text: `Broken link: no article has the slug "${slug}" (/blog/${m[1]}/${slug}).` });
  }

  // 4. Headings.
  const h2 = lines.filter((l) => l.startsWith("## ")).map((l) => l.slice(3).trim().toLowerCase());
  const dup = h2.filter((h, i) => h2.indexOf(h) !== i);
  if (dup.length) out.push({ level: "warn", text: `Two sections have the same heading: "${dup[0]}".` });
  if (lines.some((l) => /^#\s/.test(l))) out.push({ level: "warn", text: 'A line starts with a single "#". The page title is already the main heading, use "## " for sections.' });
  if (lines.some((l) => /^#{4,}\s/.test(l))) out.push({ level: "warn", text: 'Headings deeper than "###" are not supported and will show as plain text.' });

  // 5. Pasted HTML shows as text.
  if (/<\/?(div|span|p|br|img|script|iframe|table|a|h[1-6])[\s>\/]/i.test(x.body)) out.push({ level: "warn", text: "HTML tags are not supported and will show as plain text. Use the toolbar buttons instead." });

  // 6. Dates.
  if (x.publishedAt) {
    const when = new Date(x.publishedAt).getTime();
    if (x.status === "published" && when > Date.now() + 60_000) out.push({ level: "warn", text: "Status is Published but the date is in the future. The article stays hidden until that date." });
    if (x.status === "scheduled" && when <= Date.now()) out.push({ level: "warn", text: "Status is Scheduled but the date has passed. The article goes live immediately." });
  }
  return out;
}