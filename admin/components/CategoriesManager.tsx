"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addStarterCategories, deleteCategory, saveCategory } from "@/app/actions";
import type { Category } from "@/lib/blog/types";
import { slugify } from "@/lib/blog/utils";
import { btn, btnGhost, card, field, label } from "./ui";

const empty = { editing: false, name: "", slug: "", description: "", sort: "0", accent: "#9BEC00" };

export default function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof typeof empty, v: string) =>
    setF((p) => ({ ...p, [k]: v, ...(k === "name" && !p.editing && (!p.slug || p.slug === slugify(p.name)) ? { slug: slugify(v) } : {}) }));

  const submit = () =>
    start(async () => {
      const res = await saveCategory({ editing: f.editing, name: f.name, slug: f.slug, description: f.description || null, sort: Number(f.sort) || 0, accent: f.accent });
      setMsg(res.ok ? "Saved" : res.error ?? "Failed");
      if (res.ok) {
        setF(empty);
        router.refresh();
      }
    });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        <h2 className="font-heading text-[22px] font-extrabold text-[var(--tv-ink)]">Categories</h2>
        {categories.map((c) => (
          <div key={c.slug} className={`${card} flex items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-8 w-1.5 rounded-full" style={{ background: c.accent }} />
              <div>
                <p className="font-heading text-[15px] font-bold text-[var(--tv-ink)]">{c.name}</p>
                <p className="font-body text-[12px] text-[var(--tv-mut)]">/blog/{c.slug} · order {c.sort}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className={btnGhost} onClick={() => setF({ editing: true, name: c.name, slug: c.slug, description: c.description ?? "", sort: String(c.sort), accent: c.accent })}>Edit</button>
              <button
                className={btnGhost}
                onClick={() => {
                  if (confirm(`Delete "${c.name}"? This only works when it has no articles.`)) start(async () => { const r = await deleteCategory(c.slug); setMsg(r.ok ? "Deleted" : r.error ?? "Failed"); router.refresh(); });
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className={`${card} space-y-3`}>
            <p className="font-body text-[14px] text-[var(--tv-body)]">No categories yet. Every article needs one. Add the 8 TradeVed starter categories in one click, or add your own on the right.</p>
            <button className={btn} disabled={pending} onClick={() => start(async () => { const r = await addStarterCategories(); setMsg(r.ok ? "Added" : r.error ?? "Failed"); router.refresh(); })}>
              Add the starter categories
            </button>
          </div>
        )}
        <p className="font-body text-[12px] text-[var(--tv-mut)]">The URL slug of a category cannot be changed later, because it is part of every article address.</p>
      </div>

      <div className={`${card} h-fit space-y-3`}>
        <h2 className="font-heading text-[18px] font-bold text-[var(--tv-ink)]">{f.editing ? "Edit category" : "Add category"}</h2>
        <label className={label}>Name<input className={field} value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label className={label}>URL slug<input className={field} value={f.slug} disabled={f.editing} onChange={(e) => set("slug", e.target.value)} /></label>
        <label className={label}>Short description<textarea rows={3} className={field} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>Order<input type="number" min={0} className={field} value={f.sort} onChange={(e) => set("sort", e.target.value)} /></label>
          <label className={label}>Colour<input type="color" className={`${field} h-[42px] p-1`} value={f.accent} onChange={(e) => set("accent", e.target.value)} /></label>
        </div>
        <div className="flex items-center gap-3">
          <button className={btn} disabled={pending} onClick={submit}>{pending ? "Saving…" : "Save"}</button>
          {f.editing && <button className={btnGhost} onClick={() => setF(empty)}>Cancel</button>}
          {msg && <span className="font-body text-[13px] text-[var(--tv-body)]" role="status">{msg}</span>}
        </div>
      </div>
    </div>
  );
}