"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAuthor, saveAuthor } from "@/app/actions";
import type { Author } from "@/lib/blog/types";
import { slugify } from "@/lib/blog/utils";
import { btn, btnGhost, card, field, label } from "./ui";

const empty = { id: "", name: "", slug: "", role: "", bio: "", avatar_url: "", linkedin_url: "" };

export default function AuthorsManager({ authors }: { authors: Author[] }) {
  const router = useRouter();
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof typeof empty, v: string) => setF((p) => ({ ...p, [k]: v, ...(k === "name" && !p.id && (!p.slug || p.slug === slugify(p.name)) ? { slug: slugify(v) } : {}) }));

  const submit = () =>
    start(async () => {
      const res = await saveAuthor({ id: f.id || undefined, name: f.name, slug: f.slug, role: f.role || null, bio: f.bio || null, avatar_url: f.avatar_url || null, linkedin_url: f.linkedin_url || null });
      setMsg(res.ok ? "Saved" : res.error ?? "Failed");
      if (res.ok) {
        setF(empty);
        router.refresh();
      }
    });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        <h2 className="font-heading text-[22px] font-extrabold text-[var(--tv-ink)]">Authors & reviewers</h2>
        {authors.map((a) => (
          <div key={a.id} className={`${card} flex items-center justify-between gap-3`}>
            <div>
              <p className="font-heading text-[15px] font-bold text-[var(--tv-ink)]">{a.name}</p>
              <p className="font-body text-[12px] text-[var(--tv-mut)]">{a.role ?? "No role"} · /blog/author/{a.slug}</p>
            </div>
            <div className="flex gap-2">
              <button className={btnGhost} onClick={() => setF({ id: a.id, name: a.name, slug: a.slug, role: a.role ?? "", bio: a.bio ?? "", avatar_url: a.avatar_url ?? "", linkedin_url: a.linkedin_url ?? "" })}>Edit</button>
              <button
                className={btnGhost}
                onClick={() => {
                  if (confirm(`Delete ${a.name}? Their posts will have no author.`)) start(async () => { const r = await deleteAuthor(a.id); setMsg(r.ok ? "Deleted" : r.error ?? "Failed"); router.refresh(); });
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {authors.length === 0 && <p className="text-[var(--tv-mut)]">No authors yet. Add one on the right.</p>}
      </div>

      <div className={`${card} h-fit space-y-3`}>
        <h2 className="font-heading text-[18px] font-bold text-[var(--tv-ink)]">{f.id ? "Edit author" : "Add author"}</h2>
        <label className={label}>Name<input className={field} value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label className={label}>URL slug<input className={field} value={f.slug} onChange={(e) => set("slug", e.target.value)} /></label>
        <label className={label}>Role (e.g. SEBI-registered analyst)<input className={field} value={f.role} onChange={(e) => set("role", e.target.value)} /></label>
        <label className={label}>Short bio<textarea rows={3} className={field} value={f.bio} onChange={(e) => set("bio", e.target.value)} /></label>
        <label className={label}>Photo URL<input className={field} value={f.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} /></label>
        <label className={label}>LinkedIn URL<input className={field} value={f.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} /></label>
        <div className="flex items-center gap-3">
          <button className={btn} disabled={pending} onClick={submit}>{pending ? "Saving…" : "Save"}</button>
          {f.id && <button className={btnGhost} onClick={() => setF(empty)}>Cancel</button>}
          {msg && <span className="font-body text-[13px] text-[var(--tv-body)]" role="status">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
