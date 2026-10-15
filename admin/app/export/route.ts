import { API_MODE } from "@/lib/api/config";
import { getAllPostsForExport } from "@/lib/data";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  let s = Array.isArray(v) ? v.join("; ") : String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // stops spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (process.env.NODE_ENV === "production" && !API_MODE) return new Response("Not found", { status: 404 });
  const cols = ["slug", "category_slug", "title", "status", "level", "primary_keyword", "secondary_keywords", "description", "published_at", "updated_at"] as const;
  const rows = await getAllPostsForExport();
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
  return new Response("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="tradeved-blog-posts.csv"' } });
}