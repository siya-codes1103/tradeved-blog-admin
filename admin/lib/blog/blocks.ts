/**
 * Block model for the visual editor.
 *
 * An article is edited as a list of blocks (text, heading, table, image, ...). The blocks are saved in the SAME
 * plain-text body format the site already reads (see site/lib/blog/markdown.ts), so existing articles, imports
 * and the public pages do not change. parseBlocks() reads that text back into blocks, and anything it does not
 * understand is kept as a "raw" block, so nothing is ever lost when an author opens an old article.
 */

export type BlockType =
  | "paragraph"
  | "heading"
  | "list"
  | "example"
  | "note"
  | "image"
  | "table"
  | "facts"
  | "chart"
  | "proscons"
  | "steps"
  | "links"
  | "raw";

export type Block =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "list"; ordered: boolean; items: string[] }
  | { id: string; type: "example"; text: string }
  | { id: string; type: "note"; text: string }
  | { id: string; type: "image"; src: string; width: number | null; height: number | null; alt: string; caption: string }
  | { id: string; type: "table"; variant: "table" | "compare"; rows: string[][] }
  | { id: string; type: "facts"; items: { label: string; value: string }[] }
  | { id: string; type: "chart"; kind: "bar" | "line"; title: string; unit: string; source: string; points: { label: string; value: string }[] }
  | { id: string; type: "proscons"; pros: string[]; cons: string[] }
  | { id: string; type: "steps"; items: string[] }
  | { id: string; type: "links"; items: { title: string; href: string }[] }
  | { id: string; type: "raw"; text: string };

let counter = 0;
export const uid = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

export const BLOCK_MENU: { type: Exclude<BlockType, "raw">; label: string; hint: string }[] = [
  { type: "paragraph", label: "Text", hint: "A paragraph" },
  { type: "heading", label: "Heading", hint: "Section or sub-section title" },
  { type: "list", label: "List", hint: "Bullets or numbers" },
  { type: "table", label: "Table", hint: "Rows and columns" },
  { type: "image", label: "Image", hint: "Upload with caption" },
  { type: "links", label: "Related articles", hint: "Links to other articles" },
  { type: "chart", label: "Chart", hint: "Bar or line chart" },
  { type: "facts", label: "Key facts", hint: "Label and value cards" },
  { type: "proscons", label: "Pros & cons", hint: "Two lists" },
  { type: "steps", label: "Steps", hint: "Numbered how-to" },
  { type: "example", label: "Example", hint: "Highlighted example" },
  { type: "note", label: "Callout", hint: "Important note" },
];

export function newBlock(type: Exclude<BlockType, "raw">): Block {
  const id = uid();
  switch (type) {
    case "paragraph": return { id, type, text: "" };
    case "heading": return { id, type, level: 2, text: "" };
    case "list": return { id, type, ordered: false, items: ["", ""] };
    case "example": return { id, type, text: "" };
    case "note": return { id, type, text: "" };
    case "image": return { id, type, src: "", width: null, height: null, alt: "", caption: "" };
    case "table": return { id, type, variant: "table", rows: [["", "", ""], ["", "", ""], ["", "", ""]] };
    case "facts": return { id, type, items: [{ label: "", value: "" }, { label: "", value: "" }] };
    case "chart": return { id, type, kind: "bar", title: "", unit: "", source: "", points: [{ label: "", value: "" }, { label: "", value: "" }, { label: "", value: "" }] };
    case "proscons": return { id, type, pros: ["", ""], cons: ["", ""] };
    case "steps": return { id, type, items: ["", "", ""] };
    case "links": return { id, type, items: [] };
  }
}

// ---------------------------------------------------------------- text -> blocks

const IMG_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;
const cells = (line: string) => line.split("|").map((c) => c.trim());

function parseImage(line: string): Block | null {
  const m = IMG_RE.exec(line);
  if (!m) return null;
  const [url, frag = ""] = m[2].split("#");
  if (!/^\/(?!\/)/.test(url) && !/^https:\/\//i.test(url)) return null;
  const size = /^(\d{2,5})x(\d{2,5})$/.exec(frag);
  return { id: uid(), type: "image", src: url, width: size ? Number(size[1]) : null, height: size ? Number(size[2]) : null, alt: m[1].trim(), caption: (m[3] ?? "").trim() };
}

function parseData(type: string, args: string, raw: string[], original: string): Block {
  const id = uid();
  const lines = raw.map((l) => l.trim()).filter(Boolean);
  switch (type) {
    case "table":
    case "compare": {
      const width = Math.max(1, ...lines.map((l) => cells(l).length));
      const rows = lines.map((l) => Array.from({ length: width }, (_, i) => cells(l)[i] ?? ""));
      return { id, type: "table", variant: type, rows: rows.length ? rows : newTableRows() };
    }
    case "facts":
      return {
        id,
        type: "facts",
        items: lines.filter((l) => l.includes(":")).map((l) => {
          const i = l.indexOf(":");
          return { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() };
        }),
      };
    case "chart": {
      const [kindRaw, title = "", unit = ""] = args.split("|").map((s) => s.trim());
      let source = "";
      const points: { label: string; value: string }[] = [];
      for (const l of lines) {
        if (/^source\s*:/i.test(l)) {
          source = l.slice(l.indexOf(":") + 1).trim();
          continue;
        }
        const i = l.lastIndexOf(":");
        if (i < 0) continue;
        points.push({ label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() });
      }
      return { id, type: "chart", kind: kindRaw?.toLowerCase() === "line" ? "line" : "bar", title, unit, source, points };
    }
    case "proscons":
      return {
        id,
        type: "proscons",
        pros: lines.filter((l) => l.startsWith("+")).map((l) => l.slice(1).trim()),
        cons: lines.filter((l) => l.startsWith("-")).map((l) => l.slice(1).trim()),
      };
    case "steps":
      return { id, type: "steps", items: lines.map((l) => l.replace(/^\d+[.)]\s*/, "")) };
    case "note":
      return { id, type: "note", text: lines.join("\n") };
    case "links":
      return {
        id,
        type: "links",
        items: lines.map((l) => {
          const i = l.lastIndexOf("|");
          return i < 0 ? { title: l, href: "" } : { title: l.slice(0, i).trim(), href: l.slice(i + 1).trim() };
        }),
      };
    default:
      return { id, type: "raw", text: original };
  }
}

const newTableRows = () => [["", "", ""], ["", "", ""], ["", "", ""]];

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r/g, "").split("\n");
  let bullets: string[] | null = null;
  let numbers: string[] | null = null;

  const flush = () => {
    if (bullets) blocks.push({ id: uid(), type: "list", ordered: false, items: bullets });
    if (numbers) blocks.push({ id: uid(), type: "list", ordered: true, items: numbers });
    bullets = numbers = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith(":::") && line.length > 3) {
      flush();
      const head = line.slice(3).trim();
      const sp = head.search(/\s/);
      const type = (sp < 0 ? head : head.slice(0, sp)).toLowerCase();
      const args = sp < 0 ? "" : head.slice(sp + 1);
      const body: string[] = [];
      const start = i;
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        body.push(lines[i]);
        i++;
      }
      const original = lines.slice(start, Math.min(i + 1, lines.length)).join("\n");
      blocks.push(parseData(type, args, body, original));
      continue;
    }
    const img = parseImage(line);
    if (img) {
      flush();
      blocks.push(img);
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      blocks.push({ id: uid(), type: "heading", level: 3, text: line.slice(4).trim() });
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ id: uid(), type: "heading", level: 2, text: line.slice(3).trim() });
      continue;
    }
    const num = /^\d+[.)]\s+(.*)$/.exec(line);
    if (num) {
      if (bullets) flush();
      (numbers ??= []).push(num[1]);
      continue;
    }
    if (line.startsWith("- ")) {
      if (numbers) flush();
      (bullets ??= []).push(line.slice(2));
      continue;
    }
    flush();
    if (line.startsWith("> ")) blocks.push({ id: uid(), type: "example", text: line.slice(2) });
    else blocks.push({ id: uid(), type: "paragraph", text: line });
  }
  flush();
  return blocks;
}

// ---------------------------------------------------------------- blocks -> text

const oneLine = (s: string) => s.replace(/\s*\n+\s*/g, " ").trim();
const cell = (s: string) => oneLine(s).replace(/\|/g, "/");

function ser(b: Block): string {
  switch (b.type) {
    case "paragraph":
      return b.text.split("\n").map((l) => l.trim()).filter(Boolean).join("\n\n");
    case "heading": {
      const t = oneLine(b.text);
      return t ? `${b.level === 3 ? "###" : "##"} ${t}` : "";
    }
    case "list": {
      const items = b.items.map(oneLine).filter(Boolean);
      return items.map((t, i) => (b.ordered ? `${i + 1}. ${t}` : `- ${t}`)).join("\n");
    }
    case "example": {
      const t = oneLine(b.text);
      return t ? `> ${t}` : "";
    }
    case "note": {
      const lines = b.text.split("\n").map((l) => l.trim()).filter(Boolean);
      return lines.length ? `:::note\n${lines.join("\n")}\n:::` : "";
    }
    case "image": {
      if (!b.src) return "";
      const alt = oneLine(b.alt).replace(/[\[\]]/g, "");
      const cap = oneLine(b.caption).replace(/"/g, "'");
      const size = b.width && b.height ? `#${b.width}x${b.height}` : "";
      return `![${alt}](${b.src}${size}${cap ? ` "${cap}"` : ""})`;
    }
    case "table": {
      const rows = b.rows.map((r) => r.map(cell)).filter((r) => r.some(Boolean));
      if (rows.length < 2) return "";
      return `:::${b.variant}\n${rows.map((r) => (r.join(" | ").trim() || "|")).join("\n")}\n:::`;
    }
    case "facts": {
      const items = b.items.filter((f) => oneLine(f.label) && oneLine(f.value));
      return items.length ? `:::facts\n${items.map((f) => `${oneLine(f.label).replace(/:/g, " -")}: ${oneLine(f.value)}`).join("\n")}\n:::` : "";
    }
    case "chart": {
      const pts = b.points.filter((p) => oneLine(p.label) && Number.isFinite(parseFloat(p.value.replace(/,/g, ""))));
      if (pts.length < 2) return "";
      const head = `:::chart ${b.kind} | ${oneLine(b.title).replace(/\|/g, "/")} | ${oneLine(b.unit).replace(/\|/g, "/")}`.replace(/[ |]+$/, "");
      const src = oneLine(b.source) ? `\nsource: ${oneLine(b.source)}` : "";
      return `${head}\n${pts.map((p) => `${oneLine(p.label)}: ${p.value.replace(/,/g, "").trim()}`).join("\n")}${src}\n:::`;
    }
    case "proscons": {
      const pros = b.pros.map(oneLine).filter(Boolean).map((t) => `+ ${t}`);
      const cons = b.cons.map(oneLine).filter(Boolean).map((t) => `- ${t}`);
      return pros.length || cons.length ? `:::proscons\n${[...pros, ...cons].join("\n")}\n:::` : "";
    }
    case "steps": {
      const items = b.items.map(oneLine).filter(Boolean);
      return items.length ? `:::steps\n${items.join("\n")}\n:::` : "";
    }
    case "links": {
      const items = b.items.filter((l) => oneLine(l.title) && l.href.trim());
      return items.length ? `:::links\n${items.map((l) => `${oneLine(l.title).replace(/\|/g, "/")} | ${l.href.trim()}`).join("\n")}\n:::` : "";
    }
    case "raw":
      return b.text.trim();
  }
}

export function serializeBlocks(blocks: Block[]): string {
  return blocks.map(ser).filter(Boolean).join("\n\n") + (blocks.length ? "\n" : "");
}