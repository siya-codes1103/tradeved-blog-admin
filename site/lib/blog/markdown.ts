/**
 * Article body format
 * -------------------
 * The body is plain text written in the admin. It is parsed into typed blocks and rendered by
 * React components (no raw HTML is ever injected), so a typo or pasted markup cannot break the page.
 *
 *   ## Heading                       -> H2 (also builds the table of contents)
 *   ### Sub-heading                  -> H3 (inside a section, not in the table of contents)
 *   1. item                          -> numbered list
 *   Plain line                       -> paragraph
 *   - item                           -> bullet list
 *   > text                           -> "Example" box
 *   ![alt text](/path-or-https-url "optional caption")   -> image on its own line
 *   **bold**   [[Term]]   [[Text|slug]]   [label](/path or https://...)
 *
 *   :::table / :::compare            -> first line is the header, cells separated by |
 *   :::facts                         -> one "Label: Value" per line
 *   :::chart bar | Title | unit      -> "Label: number" per line (+ optional "source: ...")
 *   :::chart line | Title | unit
 *   :::proscons                      -> "+ pro" and "- con" lines
 *   :::steps                         -> one step per line
 *   :::links                         -> "Read also" list, one "Title | /blog/category/slug" per line
 *   :::note                          -> callout
 *   :::                              -> closes any block
 */
import { slugify } from "./utils";

export type Inline =
  | { t: "text"; v: string }
  | { t: "bold"; v: string }
  | { t: "gloss"; v: string; slug: string }
  | { t: "link"; v: string; href: string };

export type Block =
  | { t: "h2"; id: string; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; inl: Inline[] }
  | { t: "ol"; items: Inline[][] }
  | { t: "ul"; items: Inline[][] }
  | { t: "example"; inl: Inline[] }
  | { t: "img"; src: string; alt: string; caption: string; width: number | null; height: number | null }
  | { t: "table"; variant: "table" | "compare"; head: Inline[][]; rows: Inline[][][] }
  | { t: "facts"; items: { label: Inline[]; value: Inline[] }[] }
  | { t: "proscons"; pros: Inline[][]; cons: Inline[][] }
  | { t: "steps"; items: Inline[][] }
  | { t: "note"; lines: Inline[][] }
  | { t: "links"; items: { title: string; href: string; external: boolean }[] }
  | { t: "chart"; kind: "bar" | "line"; title: string; unit: string; points: { label: string; value: number }[]; source: string };

export interface Heading {
  id: string;
  text: string;
}

export interface ParsedBody {
  blocks: Block[];
  headings: Heading[];
}

const INLINE_RE = /\*\*(.+?)\*\*|\[\[(.+?)\]\]|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = new RegExp(INLINE_RE.source, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: "text", v: text.slice(last, m.index) });
    if (m[1] !== undefined) {
      out.push({ t: "bold", v: m[1] });
    } else if (m[2] !== undefined) {
      const [label, alias] = m[2].split("|").map((s) => s.trim());
      out.push({ t: "gloss", v: label, slug: slugify(alias || label.replace(/\(.*?\)/g, "")) });
    } else {
      out.push({ t: "link", v: m[3], href: m[4] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

const IMG_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;

/** Image address must be a site path or https URL. "#1200x630" at the end carries the size (added by the admin uploader). */
function safeImageSrc(raw: string): { src: string; width: number | null; height: number | null } | null {
  const [url, frag = ""] = raw.split("#");
  if (!/^\/(?!\/)/.test(url) && !/^https:\/\//i.test(url)) return null;
  const m = /^(\d{2,5})x(\d{2,5})$/.exec(frag);
  return { src: url, width: m ? Number(m[1]) : null, height: m ? Number(m[2]) : null };
}

const cells = (line: string) => line.split("|").map((c) => c.trim());

function parseChart(args: string, lines: string[]): Block | null {
  const [kindRaw, title = "", unit = ""] = args.split("|").map((s) => s.trim());
  const kind = kindRaw?.toLowerCase() === "line" ? "line" : "bar";
  let source = "";
  const points: { label: string; value: number }[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^source\s*:/i.test(line)) {
      source = line.slice(line.indexOf(":") + 1).trim();
      continue;
    }
    const i = line.lastIndexOf(":");
    if (i < 0) continue;
    const value = parseFloat(line.slice(i + 1).trim().replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;
    points.push({ label: line.slice(0, i).trim(), value });
  }
  if (points.length < 2) return null;
  return { t: "chart", kind, title, unit, points: points.slice(0, 24), source };
}

function parseDataBlock(type: string, args: string, rawLines: string[]): Block | null {
  const lines = rawLines.map((l) => l.trim()).filter(Boolean);
  switch (type) {
    case "table":
    case "compare": {
      if (lines.length < 2) return null;
      const width = cells(lines[0]).length;
      const pad = (row: string[]) => Array.from({ length: width }, (_, i) => row[i] ?? "");
      return {
        t: "table",
        variant: type,
        head: cells(lines[0]).map(parseInline),
        rows: lines.slice(1).map((l) => pad(cells(l)).map(parseInline)),
      };
    }
    case "facts": {
      const items = lines
        .filter((l) => l.includes(":"))
        .map((l) => {
          const i = l.indexOf(":");
          return { label: parseInline(l.slice(0, i).trim()), value: parseInline(l.slice(i + 1).trim()) };
        });
      return items.length ? { t: "facts", items } : null;
    }
    case "proscons": {
      const pros = lines.filter((l) => l.startsWith("+")).map((l) => parseInline(l.slice(1).trim()));
      const cons = lines.filter((l) => l.startsWith("-")).map((l) => parseInline(l.slice(1).trim()));
      return pros.length || cons.length ? { t: "proscons", pros, cons } : null;
    }
    case "steps":
      return lines.length ? { t: "steps", items: lines.map((l) => parseInline(l.replace(/^\d+[.)]\s*/, ""))) } : null;
    case "note":
      return lines.length ? { t: "note", lines: lines.map(parseInline) } : null;
    case "links": {
      const items = lines
        .map((l) => {
          const i = l.lastIndexOf("|");
          if (i < 0) return null;
          const target = safeHref(l.slice(i + 1).trim());
          return target ? { title: l.slice(0, i).trim(), href: target.href, external: target.external } : null;
        })
        .filter((x): x is { title: string; href: string; external: boolean } => !!x && !!x.title);
      return items.length ? { t: "links", items } : null;
    }
    case "chart":
      return parseChart(args, lines);
    default:
      return null;
  }
}

export function parseBody(source: string): ParsedBody {
  const blocks: Block[] = [];
  const headings: Heading[] = [];
  const used = new Map<string, number>();
  const lines = source.replace(/\r/g, "").split("\n");
  let list: Inline[][] | null = null;
  let ordered: Inline[][] | null = null;

  const flushList = () => {
    if (list) {
      blocks.push({ t: "ul", items: list });
      list = null;
    }
    if (ordered) {
      blocks.push({ t: "ol", items: ordered });
      ordered = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith(":::") && line.length > 3) {
      flushList();
      const head = line.slice(3).trim();
      const sp = head.search(/\s/);
      const type = (sp < 0 ? head : head.slice(0, sp)).toLowerCase();
      const args = sp < 0 ? "" : head.slice(sp + 1);
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        body.push(lines[i]);
        i++;
      }
      const block = parseDataBlock(type, args, body);
      if (block) blocks.push(block);
      continue;
    }

    const img = IMG_RE.exec(line);
    if (img) {
      flushList();
      const src = safeImageSrc(img[2]);
      if (src) blocks.push({ t: "img", alt: img[1].trim(), caption: (img[3] ?? "").trim(), ...src });
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      blocks.push({ t: "h3", text: line.slice(4).trim() });
      continue;
    }

    const num = /^\d+[.)]\s+(.*)$/.exec(line);
    if (num) {
      if (list) flushList();
      ordered = ordered ?? [];
      ordered.push(parseInline(num[1]));
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      const text = line.slice(3).trim();
      const base = slugify(text) || "section";
      const n = used.get(base) ?? 0;
      used.set(base, n + 1);
      const id = n ? `${base}-${n + 1}` : base;
      blocks.push({ t: "h2", id, text });
      headings.push({ id, text });
    } else if (line.startsWith("- ")) {
      if (ordered) flushList();
      list = list ?? [];
      list.push(parseInline(line.slice(2)));
    } else if (line.startsWith("> ")) {
      flushList();
      blocks.push({ t: "example", inl: parseInline(line.slice(2)) });
    } else {
      flushList();
      blocks.push({ t: "p", inl: parseInline(line) });
    }
  }
  flushList();
  return { blocks, headings };
}

/** Only these link targets are rendered as links. Anything else (javascript:, data:, ...) becomes plain text. */
export function safeHref(href: string): { href: string; external: boolean } | null {
  if (/^\/(?!\/)/.test(href)) return { href, external: false };
  if (/^https?:\/\//i.test(href)) return { href, external: true };
  if (/^mailto:/i.test(href)) return { href, external: true };
  return null;
}