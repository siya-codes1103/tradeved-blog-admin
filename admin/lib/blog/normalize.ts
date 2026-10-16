/**
 * Cleans article text coming from other tools (AI drafts, Notion, Google Docs exports, other CMS files)
 * so it matches the TradeVed body format. Safe to run on text that is already clean.
 */

const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isSeparator = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes("-");

const cells = (l: string) =>
  l
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim().replace(/\*\*/g, "").replace(/\s+/g, " "));

export function normalizeBody(input: string): string {
  const lines = input.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    // Leave our own ":::" blocks untouched.
    if (/^:::\s*\S/.test(t)) inBlock = true;
    else if (t === ":::") inBlock = false;
    if (inBlock || t === ":::") {
      out.push(line);
      continue;
    }

    // "| a | b |" tables (GitHub style) -> ":::table" block.
    if (isRow(line) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const rows = [cells(line)];
      i += 2;
      while (i < lines.length && isRow(lines[i])) rows.push(cells(lines[i++]));
      i--;
      out.push(":::table", ...rows.map((r) => r.join(" | ")), ":::");
      continue;
    }

    // "#### x" is not supported; make it a bold line instead of showing the hashes.
    const deep = /^#{4,6}\s+(.*)$/.exec(t);
    if (deep) {
      out.push(`**${deep[1].replace(/\*\*/g, "")}**`);
      continue;
    }
    // Italic markers *x* / _x_ are not supported; keep the words, drop the marks.
    out.push(line);
  }

  let text = out.join("\n").trim();
  // A leading "# Title" duplicates the page title.
  text = text.replace(/^#\s+[^\n]*\n+/, "");
  return text;
}