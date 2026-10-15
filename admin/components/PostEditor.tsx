"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { savePost, uploadCover } from "@/app/actions";
import PostBody from "@/components/blog/PostBody";
import { BLOCK_BUTTONS, BLOCK_TEMPLATES } from "@/lib/blog/block-templates";
import { COVER_MAX_WIDTH, SITE_NAME } from "@/lib/blog/config";
import { contentIssues, type IndexEntry } from "@/lib/blog/content-checks";
import BlockEditor from "@/components/blocks/BlockEditor";
import { csvToTableBlock, parseCsv } from "@/lib/blog/csv";
import { parseBody } from "@/lib/blog/markdown";
import { scoreTone, seoChecks } from "@/lib/blog/seo-score";
import type { Author, Category, Faq, Post } from "@/lib/blog/types";
import { readMinutes, slugify, wordCount } from "@/lib/blog/utils";
import { btn, btnGhost, card, field, label } from "./ui";

interface Props {
  categories: Category[];
  authors: Author[];
  post: Post | null;
  /** All articles (slug, title, keyword) so the editor can warn about duplicate keywords. */
  index: IndexEntry[];
  justSaved?: boolean;
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

async function compressToWebp(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, COVER_MAX_WIDTH / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not compress image"))), "image/webp", 0.82));
}

export default function PostEditor({ categories, authors, post, index, justSaved }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const [prevSlug, setPrevSlug] = useState<string | undefined>(post?.slug);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [category, setCategory] = useState(post?.category_slug ?? categories[0]?.slug ?? "");
  // Level is no longer shown on the site; kept in the file so older articles and a future filter still work.
  const level = post?.level ?? "Beginner";
  const [description, setDescription] = useState(post?.description ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [authorId, setAuthorId] = useState(post?.author_id ?? "");
  const [reviewerId, setReviewerId] = useState(post?.reviewer_id ?? "");
  const [coverUrl, setCoverUrl] = useState(post?.cover_url ?? "");
  const [coverAlt, setCoverAlt] = useState(post?.cover_alt ?? "");
  const [keyword, setKeyword] = useState(post?.primary_keyword ?? "");
  const [secondary, setSecondary] = useState((post?.secondary_keywords ?? []).join(", "));
  const [faqs, setFaqs] = useState<Faq[]>(post?.faqs ?? []);
  const [sources, setSources] = useState(post?.sources ?? "");
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">(post?.status ?? "draft");
  const [publishAt, setPublishAt] = useState(toLocalInput(post?.published_at ?? null));
  const [noindex, setNoindex] = useState(post?.noindex ?? false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(justSaved && post ? { ok: true, text: `Saved: /${post.category_slug}/${post.slug}` } : null);
  const [uploading, setUploading] = useState(false);
  
  const [tab, setTab] = useState<"blocks" | "write" | "preview">("blocks");
  const [editorKey, setEditorKey] = useState(0);
  const [panel, setPanel] = useState<null | "image" | "article">(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgAlt, setImgAlt] = useState("");
  const [imgCaption, setImgCaption] = useState("");
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState("");
  const [linkQuery, setLinkQuery] = useState("");

  const secondaryList = useMemo(() => secondary.split(",").map((s) => s.trim()).filter(Boolean), [secondary]);
  const seoInput = { title, slug, description, body, primary_keyword: keyword || null, secondary_keywords: secondaryList, cover_url: coverUrl || null, cover_alt: coverAlt || null, faqs, author_id: authorId || null, reviewer_id: reviewerId || null };
  const checks = useMemo(() => seoChecks(seoInput), [title, slug, description, body, keyword, secondaryList, coverUrl, coverAlt, faqs, authorId, reviewerId]); // eslint-disable-line react-hooks/exhaustive-deps
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const issues = useMemo(
    () => contentIssues({ body, status, publishedAt: publishAt ? new Date(publishAt).toISOString() : null, selfSlug: prevSlug ?? slug, index }),
    [body, status, publishAt, prevSlug, slug, index],
  );
  const parsed = useMemo(() => (tab === "preview" ? parseBody(body) : null), [tab, body]);
    const dupes = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return k ? index.filter((x) => x.slug !== prevSlug && (x.primary_keyword ?? "").trim().toLowerCase() === k) : [];
  }, [keyword, index, prevSlug]);
  const err = (k: string) => (errors[k] ? <span className="mt-1 block text-[12px] text-[var(--tv-pink)]">{errors[k]}</span> : null);

  function insert(text: string, wrap?: [string, string]) {
    const el = bodyRef.current;
    if (!el) return setBody((b) => `${b}\n\n${text}`);
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = body.slice(s, e);
    const piece = wrap ? `${wrap[0]}${selected || "text"}${wrap[1]}` : `\n\n${text}\n\n`;
    const next = body.slice(0, s) + piece + body.slice(e);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = s + piece.length;
    });
  }

  async function onCsv(file: File | undefined) {
    if (!file) return;
    const rows = parseCsv(await file.text());
    if (rows.length < 2) return setMsg({ ok: false, text: "CSV needs a header row and at least one data row" });
    insert(csvToTableBlock(rows));
    if (csvRef.current) csvRef.current.value = "";
  }

  async function onCover(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const blob = await compressToWebp(file);
      const fd = new FormData();
      fd.append("file", blob, "cover.webp");
      fd.append("name", slug || title || "cover");
      const res = await uploadCover(fd);
      if (!res.ok) throw new Error(res.error);
      setCoverUrl(res.url);
    } catch (e) {
      setMsg({ ok: false, text: `Upload failed: ${e instanceof Error ? e.message : "unknown error"}` });
    } finally {
      setUploading(false);
    }
  }

  async function addImage() {
    if (!imgFile) return setImgErr("Choose an image first");
    if (!imgAlt.trim()) return setImgErr("Write the alt text: a short description of what the image shows");
    setImgBusy(true);
    setImgErr("");
    try {
      const blob = await compressToWebp(imgFile);
      const bmp = await createImageBitmap(blob);
      const fd = new FormData();
      fd.append("file", blob, "image.webp");
      fd.append("name", slug || title || "image");
      const res = await uploadCover(fd);
      if (!res.ok) throw new Error(res.error);
      const cap = imgCaption.trim().replace(/"/g, "'");
      const alt = imgAlt.trim().replace(/[\[\]]/g, "");
      insert(`![${alt}](${res.url}#${bmp.width}x${bmp.height}${cap ? ` "${cap}"` : ""})`);
      setImgFile(null); setImgAlt(""); setImgCaption(""); setPanel(null);
    } catch (e) {
      setImgErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setImgBusy(false);
    }
  }

  function addArticleLink(p: IndexEntry) {
    insert("", [`[`, `](/blog/${p.category_slug}/${p.slug})`]);
    setPanel(null);
    setLinkQuery("");
  }

  function onSave() {
    setMsg(null);
    setErrors({});
    const blocking = issues.filter((i) => i.level === "error");
    if (status !== "draft" && blocking.length) return setMsg({ ok: false, text: `Fix this before publishing: ${blocking[0].text}` });
    let published_at: string | null = publishAt ? new Date(publishAt).toISOString() : null;
    if (status === "published" && !published_at) published_at = new Date().toISOString();
    start(async () => {
      const res = await savePost({
        previous_slug: prevSlug,
        title,
        slug,
        category_slug: category,
        level,
        description,
        seo_title: seoTitle || null,
        body,
        author_id: authorId || null,
        reviewer_id: reviewerId || null,
        cover_url: coverUrl || null,
        cover_alt: coverAlt || null,
        primary_keyword: keyword || null,
        secondary_keywords: secondaryList,
        faqs: faqs.filter((f) => f.q.trim() || f.a.trim()),
        sources: sources || null,
        status,
        published_at,
        noindex,
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return setMsg({ ok: false, text: res.error });
      }
      setMsg({ ok: true, text: `Saved: /${category}/${res.slug}` });
      setPrevSlug(res.slug);
      if (res.slug !== post?.slug) router.replace(`/${res.slug}?saved=1`);
      else router.refresh();
    });
  }

  const serpTitle = `${seoTitle || title || "Post title"} | ${SITE_NAME}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <h1 className="font-heading text-[28px] font-bold text-[var(--tv-ink)]">{post ? "Edit post" : "New post"}</h1>

        <label className={label}>Title
          <input className={field} value={title} onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
          {err("title")}
        </label>
        <label className={label}>URL slug <span className="font-normal text-[var(--tv-mut)]">(/blog/{category}/{slug || "…"})</span>
          <input className={field} value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} />
          {err("slug")}
          {post && post.status !== "draft" && slug !== post.slug && <span className="mt-1 block text-[12px] text-[var(--tv-warn)]">The old link keeps working: it redirects to the new one automatically.</span>}
        </label>

        <label className={label}>Category
          <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>{err("category_slug")}
        </label>

        <label className={label}>Quick answer / meta description <span className="font-normal text-[var(--tv-mut)]">({description.length}/160, shown at the top of the article and in Google)</span>
          <textarea rows={3} className={field} value={description} onChange={(e) => setDescription(e.target.value)} />{err("description")}
        </label>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={label}>Article body</span>
            <span className="ml-auto font-body text-[12px] text-[var(--tv-mut)]">{wordCount(body)} words · {readMinutes(body)} min read</span>
            <div className="flex rounded-full border border-[var(--tv-line)] p-0.5">
              {(["blocks", "write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { if (t === "blocks") setEditorKey((k) => k + 1); setTab(t); }}
                  className={`rounded-full px-3 py-1 font-body text-[12px] ${tab === t ? "bg-[var(--tv-lime)] text-[#0F1209]" : "text-[var(--tv-body)]"}`}
                >
                  {t === "blocks" ? "Blocks" : t === "write" ? "Text (advanced)" : "Preview"}
                </button>
              ))}
            </div>
          </div>

          {tab === "blocks" ? (
            <BlockEditor key={editorKey} initial={body} onChange={setBody} index={index} selfSlug={prevSlug ?? slug} imageName={slug || title || "image"} />
          ) : tab === "write" ? (
            <>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className={btnGhost} onClick={() => insert("", ["**", "**"])}>Bold</button>
                <button type="button" className={btnGhost} onClick={() => insert("## Heading")}>H2</button>
                <button type="button" className={btnGhost} onClick={() => insert("### Sub-heading")}>H3</button>
                <button type="button" className={btnGhost} onClick={() => insert("- Point one\n- Point two")}>Bullets</button>
                <button type="button" className={btnGhost} onClick={() => insert("1. First\n2. Second\n3. Third")}>Numbered</button>
                <button type="button" className={btnGhost} onClick={() => setPanel(panel === "image" ? null : "image")}>Image…</button>
                <button type="button" className={btnGhost} onClick={() => setPanel(panel === "article" ? null : "article")}>Link to article…</button>
                <button type="button" className={btnGhost} onClick={() => insert("> Example: ")}>Example</button>
                <button type="button" className={btnGhost} onClick={() => insert("", ["[[", "]]"])}>Glossary link</button>
                <button type="button" className={btnGhost} onClick={() => insert("", ["[", "](https://)"])}>Web link</button>
              </div>
              {panel === "image" && (
                <div className="mt-2 space-y-2.5 rounded-xl border border-[var(--tv-lime)] bg-[var(--tv-card)] p-3.5">
                  <p className="font-heading text-[13px] font-bold text-[var(--tv-ink)]">Add an image to the article</p>
                  <input type="file" accept="image/*" onChange={(e) => { setImgFile(e.target.files?.[0] ?? null); setImgErr(""); }} className="font-body text-[12px] text-[var(--tv-body)]" />
                  <label className={label}>Alt text <span className="font-normal text-[var(--tv-mut)]">(what the image shows; required)</span>
                    <input className={field} value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} />
                  </label>
                  <label className={label}>Caption <span className="font-normal text-[var(--tv-mut)]">(optional, shown under the image)</span>
                    <input className={field} value={imgCaption} onChange={(e) => setImgCaption(e.target.value)} />
                  </label>
                  {imgErr && <p role="alert" className="text-[12px] text-[var(--tv-pink)]">{imgErr}</p>}
                  <div className="flex gap-2">
                    <button type="button" className={btn} disabled={imgBusy} onClick={addImage}>{imgBusy ? "Uploading…" : "Insert image"}</button>
                    <button type="button" className={btnGhost} onClick={() => setPanel(null)}>Cancel</button>
                  </div>
                </div>
              )}
              {panel === "article" && (
                <div className="mt-2 space-y-2 rounded-xl border border-[var(--tv-lime)] bg-[var(--tv-card)] p-3.5">
                  <p className="font-heading text-[13px] font-bold text-[var(--tv-ink)]">Link to another article</p>
                  <p className="font-body text-[12px] text-[var(--tv-mut)]">Select the words in the text first, then pick the article. Without a selection, the word "text" is used.</p>
                  <input className={field} placeholder="Search by title" value={linkQuery} onChange={(e) => setLinkQuery(e.target.value)} />
                  <ul className="max-h-48 divide-y divide-[var(--tv-line)] overflow-y-auto rounded-lg border border-[var(--tv-line)]">
                    {index
                      .filter((p) => p.slug !== (prevSlug ?? slug) && p.title.toLowerCase().includes(linkQuery.trim().toLowerCase()))
                      .slice(0, 8)
                      .map((p) => (
                        <li key={p.slug}>
                          <button type="button" className="w-full px-3 py-2 text-left font-body text-[13px] text-[var(--tv-ink)] hover:bg-[var(--tv-soft)]" onClick={() => addArticleLink(p)}>
                            {p.title} <span className="text-[var(--tv-mut)]">/{p.category_slug}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                  <button type="button" className={btnGhost} onClick={() => setPanel(null)}>Close</button>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-2">
                <span className="self-center px-1 font-body text-[12px] text-[var(--tv-mut)]">Insert data:</span>
                {BLOCK_BUTTONS.map((b) => <button key={b.kind} type="button" className={btnGhost} onClick={() => insert(BLOCK_TEMPLATES[b.kind])}>{b.label}</button>)}
                <button type="button" className={btnGhost} onClick={() => csvRef.current?.click()}>Table from CSV…</button>
                <input ref={csvRef} type="file" accept=".csv" hidden onChange={(e) => onCsv(e.target.files?.[0])} />
              </div>
              <textarea ref={bodyRef} rows={24} value={body} onChange={(e) => setBody(e.target.value)} spellCheck className={`${field} font-mono text-[13px] leading-[20px]`} />
              {err("body")}
            </>
          ) : (
            <div className="mt-2 min-h-[300px] rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-bg)] p-5">{parsed && <PostBody blocks={parsed.blocks} />}</div>
          )}
        </div>

        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-[16px] font-bold text-[var(--tv-ink)]">FAQs</h2>
            <button type="button" className={btnGhost} onClick={() => setFaqs([...faqs, { q: "", a: "" }])} disabled={faqs.length >= 20}>+ Add</button>
          </div>
          <div className="mt-3 space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-[var(--tv-line)] p-3">
                <input className={field} placeholder="Question" value={f.q} onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                <textarea rows={2} className={field} placeholder="Answer (plain text, 1 to 3 sentences)" value={f.a} onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
                <button type="button" className="text-[12px] text-[var(--tv-pink)]" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
          </div>
        </section>

        <label className={label}>Sources <span className="font-normal text-[var(--tv-mut)]">(one per line; URLs become links)</span>
          <textarea rows={3} className={field} value={sources} onChange={(e) => setSources(e.target.value)} />
        </label>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <section className={`${card} space-y-3`}>
          <h2 className="font-heading text-[16px] font-bold text-[var(--tv-ink)]">Publish</h2>
          <label className={label}>Status
            <select className={field} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label className={label}>Publish date &amp; time
            <input type="datetime-local" className={field} value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />{err("published_at")}
          </label>
          <label className="flex items-center gap-2 font-body text-[13px] text-[var(--tv-body)]"><input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} /> Hide from Google (noindex)</label>
          <button type="button" className={`${btn} w-full`} disabled={pending || uploading} onClick={onSave}>{pending ? "Saving…" : "Save"}</button>
          {msg && <p role="status" className={`text-[13px] ${msg.ok ? "text-[var(--tv-accent)]" : "text-[var(--tv-pink)]"}`}>{msg.text}</p>}
        </section>

        {issues.length > 0 && (
          <section className={`${card} space-y-2`} aria-label="Content checks">
            <h2 className="font-heading text-[16px] font-bold text-[var(--tv-ink)]">Check before publishing</h2>
            <ul className="space-y-1.5">
              {issues.map((i, n) => (
                <li key={n} className={`font-body text-[12px] leading-[18px] ${i.level === "error" ? "text-[var(--tv-pink)]" : "text-[var(--tv-warn)]"}`}>
                  {i.level === "error" ? "✕" : "!"} {i.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={`${card} space-y-3`}>
          <h2 className="font-heading text-[16px] font-bold text-[var(--tv-ink)]">People</h2>
          <label className={label}>Author
            <select className={field} value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
              <option value="">None</option>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>{err("author_id")}
          </label>
          <label className={label}>Reviewer
            <select className={field} value={reviewerId} onChange={(e) => setReviewerId(e.target.value)}>
              <option value="">None</option>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>{err("reviewer_id")}
          </label>
        </section>

        <section className={`${card} space-y-3`}>
          <h2 className="font-heading text-[16px] font-bold text-[var(--tv-ink)]">Cover image</h2>
          {coverUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={coverUrl} alt="" className="aspect-[2/1] w-full rounded-xl object-cover" />}
          <input type="file" accept="image/*" disabled={uploading} onChange={(e) => onCover(e.target.files?.[0])} className="font-body text-[12px] text-[var(--tv-body)]" />
          {uploading && <p className="text-[12px] text-[var(--tv-mut)]">Compressing and uploading…</p>}
          <label className={label}>Alt text<input className={field} value={coverAlt} onChange={(e) => setCoverAlt(e.target.value)} /></label>
          {coverUrl && <button type="button" className="text-[12px] text-[var(--tv-pink)]" onClick={() => setCoverUrl("")}>Remove image</button>}
          <p className="text-[12px] text-[var(--tv-mut)]">Without an image, a branded candlestick cover is drawn automatically.</p>
        </section>

        <section className={`${card} space-y-3`}>
          <h2 className="font-heading text-[16px] font-bold text-[var(--tv-ink)]">SEO</h2>
          <label className={label}>Primary keyword
            <input className={field} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </label>
          {dupes.length > 0 && (
            <p className="rounded-lg border border-[var(--tv-warn)] p-2 text-[12px] text-[var(--tv-warn)]">Another post targets this keyword: {dupes.map((d) => d.title).join("; ")}. Two posts on one keyword compete with each other.</p>
          )}
          <label className={label}>Secondary keywords <span className="font-normal text-[var(--tv-mut)]">(comma separated)</span>
            <input className={field} value={secondary} onChange={(e) => setSecondary(e.target.value)} />
          </label>
          <label className={label}>SEO title <span className="font-normal text-[var(--tv-mut)]">(optional, else the title)</span>
            <input className={field} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </label>
          <div className="rounded-xl bg-white p-3">
            <p className="truncate font-body text-[16px] text-[#1a0dab]">{serpTitle}</p>
            <p className="truncate font-body text-[12px] text-[#006621]">tradeved.com › blog › {category} › {slug}</p>
            <p className="line-clamp-2 font-body text-[13px] text-[#545454]">{description || "Description appears here."}</p>
          </div>
          <p className="font-heading text-[14px] font-bold text-[var(--tv-ink)]">Score: <span className={scoreTone(score) === "good" ? "text-[var(--tv-accent)]" : scoreTone(score) === "mid" ? "text-[var(--tv-warn)]" : "text-[var(--tv-pink)]"}>{score}/100</span></p>
          <ul className="space-y-1">
            {checks.map((c) => <li key={c.label} className={`font-body text-[12px] ${c.ok ? "text-[var(--tv-body)]" : "text-[var(--tv-mut)]"}`}>{c.ok ? "✓" : "○"} {c.label}</li>)}
          </ul>
        </section>
      </aside>
    </div>
  );
}