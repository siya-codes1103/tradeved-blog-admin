"use client";

import { useState } from "react";
import { BLOCK_MENU, newBlock, parseBlocks, serializeBlocks, type Block } from "@/lib/blog/blocks";
import type { IndexEntry } from "@/lib/blog/content-checks";
import { parseCsv } from "@/lib/blog/csv";
import { btn, btnGhost, card, field, label } from "../ui";
import { uploadImage } from "./image";
import { ArticlePicker, RichField } from "./TextTools";

interface Props {
  /** The article body as text. Read once when the editor opens. */
  initial: string;
  /** Called with the new body text after every change. */
  onChange: (body: string) => void;
  index: IndexEntry[];
  selfSlug?: string;
  /** Used to name uploaded images. */
  imageName: string;
}

const small = "!px-2.5 !py-1 !text-[12px]";
const input = `${field} !mt-0`;

const TITLES: Record<Block["type"], string> = {
  paragraph: "Text",
  heading: "Heading",
  list: "List",
  example: "Example",
  note: "Callout",
  image: "Image",
  table: "Table",
  facts: "Key facts",
  chart: "Chart",
  proscons: "Pros & cons",
  steps: "Steps",
  links: "Related articles",
  raw: "Advanced block",
};

export default function BlockEditor({ initial, onChange, index, selfSlug, imageName }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(initial));
  const [menuAt, setMenuAt] = useState<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const commit = (next: Block[]) => {
    setBlocks(next);
    onChange(serializeBlocks(next));
  };
  const patch = (id: string, p: Partial<Block>) => commit(blocks.map((b) => (b.id === id ? ({ ...b, ...p } as Block) : b)));
  const insert = (at: number, type: Parameters<typeof newBlock>[0]) => {
    const next = [...blocks];
    next.splice(at, 0, newBlock(type));
    commit(next);
    setMenuAt(null);
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length || from === to) return;
    const next = [...blocks];
    const [b] = next.splice(from, 1);
    next.splice(to, 0, b);
    commit(next);
  };
  const remove = (b: Block) => {
    if (serializeBlocks([b]).trim() && !window.confirm("Delete this block?")) return;
    commit(blocks.filter((x) => x.id !== b.id));
  };
  const duplicate = (i: number) => {
    const copy = { ...structuredClone(blocks[i]), id: `${blocks[i].id}c${Date.now().toString(36)}` } as Block;
    const next = [...blocks];
    next.splice(i + 1, 0, copy);
    commit(next);
  };

  return (
    <div className="mt-2">
      {blocks.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[var(--tv-line)] px-5 py-8 text-center font-body text-[14px] text-[var(--tv-mut)]">
          Nothing here yet. Add your first block: a heading, some text, a table, an image.
        </p>
      )}

      {blocks.map((b, i) => (
        <div key={b.id}>
          {i > 0 && <Inserter open={menuAt === i} onToggle={() => setMenuAt(menuAt === i ? null : i)} onPick={(t) => insert(i, t)} />}
          <section
            className={`${card} !p-4 ${dragId === b.id ? "opacity-50" : ""}`}
            onDragOver={(e) => dragId && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = blocks.findIndex((x) => x.id === dragId);
              setDragId(null);
              if (from >= 0) move(from, i);
            }}
          >
            <header className="mb-3 flex items-center gap-2">
              <span
                draggable
                role="button"
                tabIndex={-1}
                aria-label="Drag to move this block"
                title="Drag to move"
                className="cursor-grab select-none px-1 text-[16px] leading-none text-[var(--tv-mut)]"
                onDragStart={(e) => {
                  setDragId(b.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", b.id);
                }}
                onDragEnd={() => setDragId(null)}
              >
                ⠿
              </span>
              <span className="font-heading text-[12px] font-extrabold uppercase tracking-wider text-[var(--tv-accent)]">{TITLES[b.type]}</span>
              <span className="ml-auto flex gap-1.5">
                <button type="button" className={`${btnGhost} ${small}`} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button type="button" className={`${btnGhost} ${small}`} onClick={() => move(i, i + 1)} disabled={i === blocks.length - 1} aria-label="Move down">↓</button>
                <button type="button" className={`${btnGhost} ${small}`} onClick={() => duplicate(i)}>Duplicate</button>
                <button type="button" className={`${btnGhost} ${small} !text-[var(--tv-pink)]`} onClick={() => remove(b)}>Delete</button>
              </span>
            </header>
            <Body b={b} set={(p) => patch(b.id, p)} index={index} selfSlug={selfSlug} imageName={imageName} />
          </section>
        </div>
      ))}

      <div className="mt-3">
        <button type="button" className={btn} onClick={() => setMenuAt(menuAt === blocks.length ? null : blocks.length)}>
          + Add block
        </button>
        {menuAt === blocks.length && <Menu onPick={(t) => insert(blocks.length, t)} />}
      </div>
    </div>
  );
}

function Menu({ onPick }: { onPick: (t: Parameters<typeof newBlock>[0]) => void }) {
  return (
    <div className="mt-2 grid gap-2 rounded-2xl border border-[var(--tv-lime)] bg-[var(--tv-card)] p-3 sm:grid-cols-3 lg:grid-cols-4">
      {BLOCK_MENU.map((m) => (
        <button key={m.type} type="button" onClick={() => onPick(m.type)} className="rounded-xl border border-[var(--tv-line)] p-3 text-left transition hover:border-[var(--tv-lime)] hover:bg-[var(--tv-soft)]">
          <span className="block font-heading text-[14px] font-bold text-[var(--tv-ink)]">{m.label}</span>
          <span className="mt-0.5 block font-body text-[12px] text-[var(--tv-mut)]">{m.hint}</span>
        </button>
      ))}
    </div>
  );
}

function Inserter({ open, onToggle, onPick }: { open: boolean; onToggle: () => void; onPick: (t: Parameters<typeof newBlock>[0]) => void }) {
  return (
    <div className="py-1.5">
      <div className="flex items-center gap-2">
        <span className="h-px flex-1 bg-[var(--tv-line)]" />
        <button type="button" onClick={onToggle} className="rounded-full border border-[var(--tv-line)] bg-[var(--tv-card)] px-3 py-0.5 font-heading text-[12px] font-bold text-[var(--tv-body)] hover:border-[var(--tv-lime)]">
          + Add block here
        </button>
        <span className="h-px flex-1 bg-[var(--tv-line)]" />
      </div>
      {open && <Menu onPick={onPick} />}
    </div>
  );
}

// ------------------------------------------------------------------ block bodies

function Body({ b, set, index, selfSlug, imageName }: { b: Block; set: (p: Partial<Block>) => void; index: IndexEntry[]; selfSlug?: string; imageName: string }) {
  switch (b.type) {
    case "paragraph":
      return <RichField value={b.text} onChange={(text) => set({ text })} rows={4} placeholder="Write your paragraph…" index={index} selfSlug={selfSlug} />;
    case "example":
      return <RichField value={b.text} onChange={(text) => set({ text })} rows={2} placeholder="Example: …" index={index} selfSlug={selfSlug} />;
    case "note":
      return <RichField value={b.text} onChange={(text) => set({ text })} rows={3} placeholder="An important point for the reader…" index={index} selfSlug={selfSlug} />;
    case "heading":
      return (
        <div className="flex gap-2">
          <select className={`${field} !mt-0 !w-auto`} value={b.level} onChange={(e) => set({ level: Number(e.target.value) as 2 | 3 })} aria-label="Heading size">
            <option value={2}>Section (H2)</option>
            <option value={3}>Sub-section (H3)</option>
          </select>
          <input className={input} value={b.text} placeholder="Heading text" onChange={(e) => set({ text: e.target.value })} />
        </div>
      );
    case "list":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button type="button" className={`${btnGhost} ${small} ${!b.ordered ? "!border-[var(--tv-lime)]" : ""}`} onClick={() => set({ ordered: false })}>Bullets</button>
            <button type="button" className={`${btnGhost} ${small} ${b.ordered ? "!border-[var(--tv-lime)]" : ""}`} onClick={() => set({ ordered: true })}>Numbered</button>
          </div>
          <StringList items={b.items} onChange={(items) => set({ items })} placeholder="List item" addLabel="+ Add item" />
        </div>
      );
    case "steps":
      return <StringList items={b.items} onChange={(items) => set({ items })} placeholder="Step" addLabel="+ Add step" numbered />;
    case "proscons":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className={`${label} mb-1.5`}>Pros</p>
            <StringList items={b.pros} onChange={(pros) => set({ pros })} placeholder="A pro" addLabel="+ Add pro" />
          </div>
          <div>
            <p className={`${label} mb-1.5`}>Cons</p>
            <StringList items={b.cons} onChange={(cons) => set({ cons })} placeholder="A con" addLabel="+ Add con" />
          </div>
        </div>
      );
    case "facts":
      return (
        <div className="space-y-2">
          {b.items.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input className={input} placeholder="Label (e.g. Lock-in)" value={f.label} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <input className={input} placeholder="Value (e.g. 3 years)" value={f.value} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <button type="button" className={`${btnGhost} ${small}`} onClick={() => set({ items: b.items.filter((_, j) => j !== i) })} aria-label="Remove">✕</button>
            </div>
          ))}
          <button type="button" className={`${btnGhost} ${small}`} onClick={() => set({ items: [...b.items, { label: "", value: "" }] })}>+ Add fact</button>
        </div>
      );
    case "chart":
      return <ChartEditor b={b} set={set} />;
    case "table":
      return <TableEditor b={b} set={set} />;
    case "image":
      return <ImageEditor b={b} set={set} imageName={imageName} />;
    case "links":
      return <LinksEditor b={b} set={set} index={index} selfSlug={selfSlug} />;
    case "raw":
      return (
        <div>
          <p className="mb-1.5 font-body text-[12px] text-[var(--tv-mut)]">This part uses a format the visual editor does not know. It is kept exactly as written.</p>
          <textarea rows={5} className={`${field} !mt-0 font-mono text-[12px]`} value={b.text} onChange={(e) => set({ text: e.target.value })} />
        </div>
      );
  }
}

function StringList({ items, onChange, placeholder, addLabel, numbered }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; addLabel: string; numbered?: boolean }) {
  return (
    <div className="space-y-2">
      {items.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          {numbered && <span className="w-5 text-right font-heading text-[12px] font-bold text-[var(--tv-mut)]">{i + 1}</span>}
          <input className={input} placeholder={placeholder} value={t} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className={`${btnGhost} ${small}`} onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
        </div>
      ))}
      <button type="button" className={`${btnGhost} ${small}`} onClick={() => onChange([...items, ""])}>{addLabel}</button>
    </div>
  );
}

function ChartEditor({ b, set }: { b: Extract<Block, { type: "chart" }>; set: (p: Partial<Block>) => void }) {
  const valid = b.points.filter((p) => p.label.trim() && Number.isFinite(parseFloat(p.value.replace(/,/g, "")))).length;
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[130px_1fr_110px]">
        <select className={input} value={b.kind} onChange={(e) => set({ kind: e.target.value as "bar" | "line" })} aria-label="Chart type">
          <option value="bar">Bar chart</option>
          <option value="line">Line chart</option>
        </select>
        <input className={input} placeholder="Chart title" value={b.title} onChange={(e) => set({ title: e.target.value })} />
        <input className={input} placeholder="Unit (e.g. %)" value={b.unit} onChange={(e) => set({ unit: e.target.value })} />
      </div>
      <div className="space-y-2">
        {b.points.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input className={input} placeholder={b.kind === "line" ? "Year or date (e.g. 2024)" : "Label"} value={p.label} onChange={(e) => set({ points: b.points.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
            <input className={`${input} !w-32`} inputMode="decimal" placeholder="Value" value={p.value} onChange={(e) => set({ points: b.points.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
            <button type="button" className={`${btnGhost} ${small}`} onClick={() => set({ points: b.points.filter((_, j) => j !== i) })} aria-label="Remove">✕</button>
          </div>
        ))}
        <button type="button" className={`${btnGhost} ${small}`} disabled={b.points.length >= 24} onClick={() => set({ points: [...b.points, { label: "", value: "" }] })}>+ Add point</button>
      </div>
      <input className={input} placeholder="Source (e.g. SEBI, NSE data)" value={b.source} onChange={(e) => set({ source: e.target.value })} />
      {valid < 2 && <p className="font-body text-[12px] text-[var(--tv-warn)]">A chart needs at least 2 points with a label and a number. Until then it will not show on the page.</p>}
    </div>
  );
}

function TableEditor({ b, set }: { b: Extract<Block, { type: "table" }>; set: (p: Partial<Block>) => void }) {
  const width = Math.max(1, ...b.rows.map((r) => r.length));
  const rows = b.rows.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ""));

  const setCell = (r: number, c: number, v: string) => set({ rows: rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)) });

  function paste(e: React.ClipboardEvent, r: number, c: number) {
    const text = e.clipboardData.getData("text");
    if (!/[\t\n]/.test(text.trim())) return; // a single value pastes normally
    e.preventDefault();
    const grid = text.includes("\t") ? text.replace(/\r/g, "").replace(/\n+$/, "").split("\n").map((l) => l.split("\t")) : parseCsv(text);
    const next = rows.map((row) => [...row]);
    grid.forEach((line, i) =>
      line.forEach((v, j) => {
        while (next.length <= r + i) next.push(Array(width).fill(""));
        while (next[0].length <= c + j) next.forEach((row) => row.push(""));
        next[r + i][c + j] = v.trim();
      }),
    );
    set({ rows: next });
  }

  async function onCsv(file: File | undefined) {
    if (!file) return;
    const grid = parseCsv(await file.text());
    if (grid.length) set({ rows: grid });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${field} !mt-0 !w-auto`} value={b.variant} onChange={(e) => set({ variant: e.target.value as "table" | "compare" })} aria-label="Table style">
          <option value="table">Table</option>
          <option value="compare">Comparison</option>
        </select>
        <button type="button" className={`${btnGhost} ${small}`} onClick={() => set({ rows: [...rows, Array(width).fill("")] })}>+ Row</button>
        <button type="button" className={`${btnGhost} ${small}`} onClick={() => set({ rows: rows.map((r) => [...r, ""]) })} disabled={width >= 8}>+ Column</button>
        <label className={`${btnGhost} ${small} cursor-pointer`}>
          Import CSV
          <input type="file" accept=".csv" hidden onChange={(e) => { void onCsv(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--tv-line)]">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr>
              {rows[0].map((_, c) => (
                <th key={c} className="border-b border-[var(--tv-line)] bg-[var(--tv-soft)] p-1 text-right">
                  <button type="button" disabled={width <= 1} className="px-2 font-body text-[11px] text-[var(--tv-pink)] disabled:opacity-30" onClick={() => set({ rows: rows.map((r) => r.filter((_, j) => j !== c)) })}>
                    Remove column
                  </button>
                </th>
              ))}
              <th className="w-8 border-b border-[var(--tv-line)] bg-[var(--tv-soft)]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((v, c) => (
                  <td key={c} className="border-b border-[var(--tv-line)] p-1">
                    <input
                      className={`w-full rounded-lg border border-transparent px-2 py-1.5 font-body text-[13px] text-[var(--tv-ink)] outline-none focus:border-[var(--tv-lime)] ${r === 0 ? "bg-[var(--tv-soft)] font-bold" : "bg-transparent"}`}
                      placeholder={r === 0 ? `Heading ${c + 1}` : ""}
                      value={v}
                      aria-label={`Row ${r + 1}, column ${c + 1}`}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      onPaste={(e) => paste(e, r, c)}
                    />
                  </td>
                ))}
                <td className="border-b border-[var(--tv-line)] p-1 text-center">
                  <button type="button" disabled={rows.length <= 2} className="font-body text-[14px] text-[var(--tv-pink)] disabled:opacity-30" aria-label={`Remove row ${r + 1}`} onClick={() => set({ rows: rows.filter((_, i) => i !== r) })}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-body text-[12px] text-[var(--tv-mut)]">The first row is the heading. You can paste cells copied from Excel or Google Sheets straight into the grid.</p>
    </div>
  );
}

function ImageEditor({ b, set, imageName }: { b: Extract<Block, { type: "image" }>; set: (p: Partial<Block>) => void; imageName: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const r = await uploadImage(file, imageName);
      set({ src: r.url, width: r.width, height: r.height });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {b.src && /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.src} alt={b.alt} className="max-h-64 rounded-xl border border-[var(--tv-line)]" />}
      <input type="file" accept="image/*" disabled={busy} onChange={(e) => void onFile(e.target.files?.[0])} className="font-body text-[13px] text-[var(--tv-body)]" />
      {busy && <p className="font-body text-[12px] text-[var(--tv-mut)]">Compressing and uploading…</p>}
      {err && <p role="alert" className="font-body text-[12px] text-[var(--tv-pink)]">{err}</p>}
      <label className={label}>
        Alt text <span className="font-normal text-[var(--tv-mut)]">(what the image shows; needed for Google and screen readers)</span>
        <input className={field} value={b.alt} onChange={(e) => set({ alt: e.target.value })} />
      </label>
      <label className={label}>
        Caption <span className="font-normal text-[var(--tv-mut)]">(optional, shown under the image)</span>
        <input className={field} value={b.caption} onChange={(e) => set({ caption: e.target.value })} />
      </label>
      {b.src && !b.alt.trim() && <p className="font-body text-[12px] text-[var(--tv-warn)]">Add alt text before publishing.</p>}
    </div>
  );
}

function LinksEditor({ b, set, index, selfSlug }: { b: Extract<Block, { type: "links" }>; set: (p: Partial<Block>) => void; index: IndexEntry[]; selfSlug?: string }) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="space-y-2">
      {b.items.length === 0 && <p className="font-body text-[13px] text-[var(--tv-mut)]">Add the articles you want readers to open next.</p>}
      {b.items.map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <input className={input} placeholder="Link title" value={l.title} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
          <input className={`${input} !w-56 font-mono text-[12px]`} aria-label="Link address" value={l.href} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)) })} />
          <button type="button" className={`${btnGhost} ${small}`} onClick={() => set({ items: b.items.filter((_, j) => j !== i) })} aria-label="Remove">✕</button>
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" className={`${btnGhost} ${small}`} onClick={() => setPicking((v) => !v)}>+ Add article</button>
        <button type="button" className={`${btnGhost} ${small}`} onClick={() => set({ items: [...b.items, { title: "", href: "https://" }] })}>+ Add web link</button>
      </div>
      {picking && (
        <ArticlePicker
          index={index}
          selfSlug={selfSlug}
          onClose={() => setPicking(false)}
          onPick={(p) => {
            set({ items: [...b.items, { title: p.title, href: `/blog/${p.category_slug}/${p.slug}` }] });
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}