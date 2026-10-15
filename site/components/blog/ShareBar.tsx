"use client";

import { useState } from "react";

const item =
  "inline-flex h-10 items-center rounded-full border border-[var(--tv-line)] bg-[var(--tv-card)] px-4 font-heading text-[13px] font-bold text-[var(--tv-ink)] transition-colors hover:border-[var(--tv-accent)] hover:text-[var(--tv-accent)]";

/** WhatsApp, LinkedIn, X and copy link. Plain links, no third-party scripts. */
export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div className="mt-10 flex flex-wrap items-center gap-2.5 border-t border-[var(--tv-line)] pt-6">
      <span className="mr-1 font-heading text-[13px] font-bold text-[var(--tv-mut)]">Share</span>
      <a className={item} href={`https://wa.me/?text=${t}%20${u}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a className={item} href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <a className={item} href={`https://twitter.com/intent/tweet?text=${t}&url=${u}`} target="_blank" rel="noopener noreferrer">X</a>
      <button type="button" className={item} onClick={copy} aria-live="polite">{copied ? "Link copied" : "Copy link"}</button>
    </div>
  );
}