import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Called by the backend right after an article, category or author changes, so the live pages refresh
 * at once instead of waiting for the hourly refresh.
 *   POST /api/revalidate    header: x-revalidate-secret    body: { "paths": ["/blog/ipo/my-post", ...] }
 * The secret is the BLOG_REVALIDATE_SECRET environment variable (set to the same value on the backend).
 */
export const dynamic = "force-dynamic";

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function POST(req: Request) {
  const secret = process.env.BLOG_REVALIDATE_SECRET ?? "";
  const sent = req.headers.get("x-revalidate-secret") ?? "";
  if (!secret || !safeEqual(sent, secret)) return NextResponse.json({ ok: false }, { status: 401 });

  let paths: string[] = [];
  try {
    const body = (await req.json()) as { paths?: unknown };
    paths = Array.isArray(body.paths) ? body.paths.filter((p): p is string => typeof p === "string") : [];
  } catch {
    /* no body: just refresh the data */
  }
  // Only blog pages may be refreshed this way.
  const safe = Array.from(new Set(paths.filter((p) => p.startsWith("/blog") && !p.includes("..") && p.length < 300))).slice(0, 200);

  revalidateTag("blog"); // the data the pages are built from
  for (const p of safe) revalidatePath(p);
  return NextResponse.json({ ok: true, refreshed: safe.length });
}