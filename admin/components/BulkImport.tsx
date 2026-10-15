"use client";

import { useState } from "react";
import { importMarkdown, importPosts, type ImportOptions, type ImportResult } from "@/app/actions";
import type { Category } from "@/lib/blog/types";
import { csvToObjects, parseCsv } from "@/lib/blog/csv";
import { btn, card, field } from "./ui";

const CHUNK = 25;

type Source = { kind: "rows"; rows: unknown[] } | { kind: "md"; files: { name: string; text: string }[] };

export default function BulkImport({ categories }: { categories: Category[] }) {
  const [source, setSource] = useState<Source | null>(null);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<ImportOptions["status"]>("file");
  const [overwrite, setOverwrite] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState("");
  const [results, setResults] = useState<ImportResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const total = source ? (source.kind === "rows" ? source.rows.length : source.files.length) : 0;

  async function onFiles(list: FileList | null) {
    setErr(""); setResults([]); setSource(null);
    const files = Array.from(list ?? []);
    if (!files.length) return;
    try {
      const md = files.filter((f) => /\.(md|markdown)$/i.test(f.name));
      if (md.length) {
        if (md.length !== files.length) throw new Error("Choose either Markdown files, or one CSV/JSON file. Do not mix them.");
        const loaded = await Promise.all(md.map(async (f) => ({ name: f.name, text: await f.text() })));
        setSource({ kind: "md", files: loaded });
        setLabel(`${loaded.length} Markdown file${loaded.length > 1 ? "s" : ""}`);
        return;
      }
      if (files.length > 1) throw new Error("Choose one CSV or JSON file at a time.");
      const file = files[0];
      const text = await file.text();
      let data: unknown[];
      if (/\.json$/i.test(file.name)) {
        const j = JSON.parse(text);
        data = Array.isArray(j) ? j : j.posts;
        if (!Array.isArray(data)) throw new Error("JSON must be an array of posts");
      } else if (/\.csv$/i.test(file.name)) {
        data = csvToObjects(parseCsv(text)).map((r) => ({ ...r, body: (r.body ?? "").replace(/\\n/g, "\n") }));
      } else {
        throw new Error("Use a .csv, .json or .md file");
      }
      if (!data.length) throw new Error("No rows found");
      setSource({ kind: "rows", rows: data });
      setLabel(`${file.name}: ${data.length} rows`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read file");
    }
  }

  async function run() {
    if (!source) return;
    setBusy(true); setResults([]); setErr("");
    const opts: ImportOptions = { status, overwrite, defaultCategory: defaultCategory || undefined };
    try {
      for (let i = 0; i < total; i += CHUNK) {
        const res = source.kind === "rows"
          ? await importPosts(source.rows.slice(i, i + CHUNK), i, opts)
          : await importMarkdown(source.files.slice(i, i + CHUNK), i, opts);
        setResults((prev) => [...prev, ...res]);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import stopped");
    } finally {
      setBusy(false);
    }
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  const radio = "flex items-start gap-2 font-body text-[14px] text-[var(--tv-body)]";

  return (
    <div className="max-w-3xl space-y-5">
      <h2 className="font-heading text-[22px] font-extrabold text-[var(--tv-ink)]">Import articles</h2>
      <p className="font-body text-[14px] leading-[22px] text-[var(--tv-body)]">
        Upload <strong>CSV</strong> (many articles in one file), <strong>JSON</strong>, or one or more <strong>Markdown (.md)</strong> files. Each file becomes one article. It shows on the blog right away if it is published.
      </p>
      <div className={card}>
        <input type="file" multiple accept=".csv,.json,.md,.markdown" onChange={(e) => onFiles(e.target.files)} className="font-body text-[14px] text-[var(--tv-body)]" />
        {source && <p className="mt-3 font-body text-[13px] text-[var(--tv-body)]">{label} ready</p>}
        {err && <p role="alert" className="mt-3 text-[13px] text-[var(--tv-pink)]">{err}</p>}

        <fieldset className="mt-5 space-y-2">
          <legend className="font-heading text-[13px] font-bold text-[var(--tv-ink)]">After import</legend>
          <label className={radio}><input type="radio" name="st" checked={status === "file"} onChange={() => setStatus("file")} />Use each article&apos;s own <code>status</code> (draft if missing)</label>
          <label className={radio}><input type="radio" name="st" checked={status === "published"} onChange={() => setStatus("published")} />Publish everything now</label>
          <label className={radio}><input type="radio" name="st" checked={status === "draft"} onChange={() => setStatus("draft")} />Save everything as draft</label>
        </fieldset>
        <label className="mt-4 block font-heading text-[13px] font-bold text-[var(--tv-ink)]">
          Category for articles that have none
          <select className={`${field} max-w-xs`} value={defaultCategory} onChange={(e) => setDefaultCategory(e.target.value)}>
            <option value="">None (skip those articles)</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className={`${radio} mt-4`}><input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />Replace articles that already exist with the same slug (otherwise they are skipped)</label>

        <button className={`${btn} mt-5`} disabled={busy || !source} onClick={run}>{busy ? `Importing… ${results.length}/${total}` : `Import ${total || ""} article${total === 1 ? "" : "s"}`}</button>
      </div>

      {results.length > 0 && (
        <div className={card} role="status">
          <p className="font-body text-[14px] text-[var(--tv-ink)]">{ok} imported, {failed.length} failed</p>
          {failed.length > 0 && (
            <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto font-body text-[13px] text-[var(--tv-pink)]">
              {failed.map((f) => <li key={f.index}>#{f.index + 1} {f.title || "(no title)"}: {f.error}</li>)}
            </ul>
          )}
        </div>
      )}

      <details className={card}>
        <summary className="cursor-pointer font-heading text-[14px] font-bold text-[var(--tv-ink)]">File formats</summary>
        <div className="mt-3 space-y-3 font-body text-[13px] leading-[21px] text-[var(--tv-body)]">
          <p><strong>CSV columns:</strong> <code>title</code>, <code>category</code> (required); optional: slug, level, author, reviewer, description, body, primary_keyword, secondary_keywords (split with ;), sources, cover, cover_alt, seo_title, status, published_at, noindex. Write line breaks in body as <code>\n</code>.</p>
          <p><strong>Markdown:</strong> front matter (title, category, description, author, status, published_at…) then the article body. The file name becomes the slug. Templates: <a className="underline" href="/templates/article-template.md" download>article-template.md</a>, <a className="underline" href="/templates/articles-template.csv" download>articles-template.csv</a>, <a className="underline" href="/templates/articles-template.json" download>articles-template.json</a>.</p>
          <p>New author names are created automatically. The category must already exist.</p>
        </div>
      </details>
    </div>
  );
}