"use client";

import { useRef, useState } from "react";
import type { IndexEntry } from "@/lib/blog/content-checks";
import { btnGhost, field } from "../ui";

/** Search box that lists the site's other articles. Used for in-text links and "Related articles". */
export function ArticlePicker({ index, selfSlug, onPick, onClose }: { index: IndexEntry[]; selfSlug?: string; onPick: (p: IndexEntry) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = index.filter((p) => p.slug !== selfSlug && p.title.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-[var(--tv-lime)] bg-[var(--tv-card)] p-3">
      <input autoFocus className={field} placeholder="Search articles by title" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 ? (
        <p className="font-body text-[12px] text-[var(--tv-mut)]">{index.length === 0 ? "No other articles yet." : "No article matches."}</p>
      ) : (
        <ul className="max-h-48 divide-y divide-[var(--tv-line)] overflow-y-auto rounded-lg border border-[var(--tv-line)]">
          {list.map((p) => (
            <li key={p.slug}>
              <button type="button" className="w-full px-3 py-2 text-left font-body text-[13px] text-[var(--tv-ink)] hover:bg-[var(--tv-soft)]" onClick={() => onPick(p)}>
                {p.title} <span className="text-[var(--tv-mut)]">/{p.category_slug}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className={btnGhost} onClick={onClose}>Close</button>
    </div>
  );
}

/** A text box with Bold, Glossary and Link buttons, so authors never type the markup themselves. */
export function RichField({ value, onChange, rows = 4, placeholder, index, selfSlug }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; index: IndexEntry[]; selfSlug?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [picking, setPicking] = useState(false);

  function wrap(before: string, after: string, fallback = "text") {
    const el = ref.current;
    const s = el?.selectionStart ?? value.length;
    const e = el?.selectionEnd ?? value.length;
    const mid = value.slice(s, e) || fallback;
    onChange(value.slice(0, s) + before + mid + after + value.slice(e));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = s + before.length + mid.length + after.length;
      el.selectionStart = el.selectionEnd = pos;
    });
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        <button type="button" className={`${btnGhost} !px-2.5 !py-1 !text-[12px]`} onClick={() => wrap("**", "**")}><strong>Bold</strong></button>
        <button type="button" className={`${btnGhost} !px-2.5 !py-1 !text-[12px]`} onClick={() => wrap("[[", "]]", "term")}>Glossary term</button>
        <button type="button" className={`${btnGhost} !px-2.5 !py-1 !text-[12px]`} onClick={() => setPicking((v) => !v)}>Link to article</button>
        <button type="button" className={`${btnGhost} !px-2.5 !py-1 !text-[12px]`} onClick={() => wrap("[", "](https://)", "link text")}>Web link</button>
      </div>
      <textarea ref={ref} rows={rows} className={`${field} !mt-0`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {picking && (
        <ArticlePicker
          index={index}
          selfSlug={selfSlug}
          onClose={() => setPicking(false)}
          onPick={(p) => {
            wrap("[", `](/blog/${p.category_slug}/${p.slug})`, "link text");
            setPicking(false);
          }}
        />
      )}
      <p className="mt-1 font-body text-[11px] text-[var(--tv-mut)]">Select words first, then press a button to turn them into bold or a link.</p>
    </div>
  );
}