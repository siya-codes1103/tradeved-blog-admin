import { ImageResponse } from "next/og";
import { getCategory, getPostBySlug } from "@/lib/blog/repository";

export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TradeVed article";

export default async function Image({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const category = post ? await getCategory(post.category_slug) : null;
  const title = post?.title ?? "TradeVed Blog";
  const accent = category?.accent ?? "#9BEC00";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0F1209", padding: 64, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 44, background: "#9BEC00", borderRadius: 4 }} />
          <div style={{ width: 14, height: 30, background: "#CC0066", borderRadius: 4 }} />
          <div style={{ fontSize: 34, fontWeight: 700, marginLeft: 8 }}>TradeVed</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {category && <div style={{ display: "flex", alignSelf: "flex-start", background: accent, color: "#0F1209", fontSize: 26, fontWeight: 700, padding: "8px 20px", borderRadius: 999 }}>{category.name}</div>}
          <div style={{ fontSize: title.length > 80 ? 48 : 62, fontWeight: 700, lineHeight: 1.12, display: "flex" }}>{title}</div>
        </div>
        <div style={{ fontSize: 26, color: "#A2AB9A", display: "flex" }}>{post ? `${post.read_minutes} min read` : "tradeved.com/blog"}</div>
      </div>
    ),
    size,
  );
}