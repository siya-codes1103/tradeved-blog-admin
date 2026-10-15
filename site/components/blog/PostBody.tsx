import Link from "next/link";
import { GLOSSARY_ROUTE } from "@/lib/site-links";
import { safeHref, type Block, type Inline } from "@/lib/blog/markdown";
import Chart from "./Chart";

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((it, i) => {
        switch (it.t) {
          case "text":
            return <span key={i}>{it.v}</span>;
          case "bold":
            return (
              <strong key={i} className="font-bold text-[var(--tv-ink)]">
                {it.v}
              </strong>
            );
          case "gloss":
            return (
              <Link
                key={i}
                href={`${GLOSSARY_ROUTE}/${it.slug}`}
                prefetch={false}
                title={`${it.v}: see the TradeVed glossary`}
                className="font-semibold text-[var(--tv-ink)] underline decoration-[var(--tv-lime)] decoration-2 decoration-dotted underline-offset-4 hover:text-[var(--tv-accent)]"
              >
                {it.v}
              </Link>
            );
          case "link": {
            const target = safeHref(it.href);
            if (!target) return <span key={i}>{it.v}</span>;
            const cls = "font-semibold text-[var(--tv-ink)] underline decoration-[var(--tv-lime)] decoration-2 underline-offset-4 hover:text-[var(--tv-accent)]";
            return target.external ? (
              <a key={i} href={target.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {it.v}
              </a>
            ) : (
              <Link key={i} href={target.href} className={cls}>
                {it.v}
              </Link>
            );
          }
        }
      })}
    </>
  );
}

function renderBlock(b: Block, key: number) {
  switch (b.t) {
    case "h2":
      return (
        <h2 key={key} id={b.id} className="mb-3 mt-10 scroll-mt-8 font-heading text-[26px] font-bold leading-[32px] text-[var(--tv-ink)] md:text-[30px] md:leading-[38px]">
          {b.text}
        </h2>
      );
    case "h3":
      return (
        <h3 key={key} className="mb-2 mt-7 font-heading text-[21px] font-bold leading-[28px] text-[var(--tv-ink)]">
          {b.text}
        </h3>
      );
    case "ol":
      return (
        <ol key={key} className="mb-4 list-decimal space-y-1.5 pl-6 font-body text-[17px] leading-[28px] text-[var(--tv-body)] marker:font-bold marker:text-[var(--tv-accent)]">
          {b.items.map((it, i) => (
            <li key={i}>
              <Inlines items={it} />
            </li>
          ))}
        </ol>
      );
    case "p":
      return (
        <p key={key} className="mb-4 font-body text-[17px] leading-[29px] text-[var(--tv-body)]">
          <Inlines items={b.inl} />
        </p>
      );
    case "ul":
      return (
        <ul key={key} className="mb-4 list-disc space-y-1.5 pl-6 font-body text-[17px] leading-[28px] text-[var(--tv-body)] marker:text-[var(--tv-accent)]">
          {b.items.map((it, i) => (
            <li key={i}>
              <Inlines items={it} />
            </li>
          ))}
        </ul>
      );
    case "img":
      return (
        <figure key={key} className="my-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.src}
            alt={b.alt}
            width={b.width ?? undefined}
            height={b.height ?? undefined}
            loading="lazy"
            decoding="async"
            className="h-auto w-full rounded-2xl border border-[var(--tv-line)]"
          />
          {b.caption && <figcaption className="mt-2 text-center font-body text-[13px] leading-[20px] text-[var(--tv-mut)]">{b.caption}</figcaption>}
        </figure>
      );
    case "example":
      return (
        <aside key={key} className="my-5 rounded-r-xl border-l-4 border-[var(--tv-lime)] bg-[var(--tv-soft)] px-5 py-3.5">
          <p className="font-heading text-[11px] font-extrabold uppercase tracking-widest text-[var(--tv-accent)]">Example</p>
          <p className="mt-1 font-body text-[15px] leading-[24px] text-[var(--tv-ink)]">
            <Inlines items={b.inl} />
          </p>
        </aside>
      );
    case "note":
      return (
        <aside key={key} className="my-5 rounded-r-xl border-l-4 border-[var(--tv-lime)] bg-[var(--tv-soft)] px-5 py-3.5 font-body text-[15px] leading-[24px] text-[var(--tv-ink)]">
          {b.lines.map((l, i) => (
            <p key={i} className={i ? "mt-2" : ""}>
              <Inlines items={l} />
            </p>
          ))}
        </aside>
      );
    case "links":
      return (
        <aside key={key} className="my-6 rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-5">
          <p className="font-heading text-[11px] font-extrabold uppercase tracking-widest text-[var(--tv-accent)]">Read also</p>
          <ul className="mt-2 space-y-1.5">
            {b.items.map((l, i) => (
              <li key={i}>
                {l.external ? (
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="font-body text-[16px] font-semibold text-[var(--tv-ink)] underline decoration-[var(--tv-lime)] decoration-2 underline-offset-4 hover:text-[var(--tv-accent)]">
                    {l.title}
                  </a>
                ) : (
                  <Link href={l.href} className="font-body text-[16px] font-semibold text-[var(--tv-ink)] underline decoration-[var(--tv-lime)] decoration-2 underline-offset-4 hover:text-[var(--tv-accent)]">
                    {l.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </aside>
      );
    case "table":
      return (
        <div key={key} className="my-6 overflow-x-auto rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)]">
          <table className="w-full min-w-[480px] border-collapse text-left font-body text-[14px]">
            <thead>
              <tr className="tv-dark">
                {b.head.map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-3 font-heading text-[11px] font-extrabold uppercase tracking-wider text-[#9BEC00]">
                    <Inlines items={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-[var(--tv-soft)]" : ""}>
                  {r.map((c, ci) =>
                    ci === 0 ? (
                      <th key={ci} scope="row" className="border-b border-[var(--tv-line)] px-4 py-3 align-top font-bold text-[var(--tv-ink)]">
                        <Inlines items={c} />
                      </th>
                    ) : (
                      <td key={ci} className="border-b border-[var(--tv-line)] px-4 py-3 align-top text-[var(--tv-body)]">
                        <Inlines items={c} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "facts":
      return (
        <dl key={key} className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {b.items.map((f, i) => (
            <div key={i} className="rounded-xl border border-[var(--tv-line)] bg-[var(--tv-card)] px-4 py-3.5">
              <dt className="font-heading text-[11px] font-bold uppercase tracking-wider text-[var(--tv-mut)]">
                <Inlines items={f.label} />
              </dt>
              <dd className="mt-1 font-heading text-[18px] font-extrabold leading-[24px] text-[var(--tv-ink)]">
                <Inlines items={f.value} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "proscons":
      return (
        <div key={key} className="my-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-4">
            <p className="mb-2 font-heading text-[14px] font-extrabold text-[var(--tv-accent)]">✓ Pros</p>
            <ul className="list-disc space-y-1.5 pl-5 font-body text-[14px] leading-[22px] text-[var(--tv-body)]">
              {b.pros.map((p, i) => (
                <li key={i}>
                  <Inlines items={p} />
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-4">
            <p className="mb-2 font-heading text-[14px] font-extrabold text-[var(--tv-pink)]">✕ Cons</p>
            <ul className="list-disc space-y-1.5 pl-5 font-body text-[14px] leading-[22px] text-[var(--tv-body)]">
              {b.cons.map((p, i) => (
                <li key={i}>
                  <Inlines items={p} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    case "steps":
      return (
        <ol key={key} className="my-6 space-y-3">
          {b.items.map((s, i) => (
            <li key={i} className="flex items-start gap-3 font-body text-[16px] leading-[26px] text-[var(--tv-body)]">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--tv-lime)] font-heading text-[13px] font-extrabold text-[#0F1209]">{i + 1}</span>
              <span>
                <Inlines items={s} />
              </span>
            </li>
          ))}
        </ol>
      );
    case "chart":
      return <Chart key={key} block={b} />;
  }
}

export default function PostBody({ blocks }: { blocks: Block[] }) {
  return <div>{blocks.map(renderBlock)}</div>;
}