import { SITE_NAME, SITE_URL } from "@/lib/blog/config";
import { getFeedPosts } from "@/lib/blog/repository";
import { postUrl } from "@/lib/blog/utils";

export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const posts = await getFeedPosts(50);
  const items = posts
    .map(
      (p) => `<item><title>${esc(p.title)}</title><link>${postUrl(p)}</link><guid isPermaLink="true">${postUrl(p)}</guid><pubDate>${new Date(p.published_at ?? p.updated_at).toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${SITE_NAME} Blog</title><link>${SITE_URL}/blog</link><description>Trading and investing guides for Indian markets.</description><language>en-IN</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600" } });
}
