import type { NextConfig } from "next";

// Images uploaded through the admin live on S3 / CloudFront. Next must be told that host is allowed.
const imageHosts = [process.env.BLOG_ASSET_BASE_URL, ...(process.env.BLOG_IMAGE_HOSTS ?? "").split(",")]
  .map((v) => (v ?? "").trim())
  .filter(Boolean)
  .map((v) => {
    try {
      return new URL(v.includes("://") ? v : `https://${v}`);
    } catch {
      return null;
    }
  })
  .filter((u): u is URL => !!u)
  .map((u) => ({ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, ...(u.port ? { port: u.port } : {}) }));

// Only for trying things out on your own computer with the test backend (images served from localhost).
const localAssets = imageHosts.some((h) => h.hostname === "localhost" || h.hostname === "127.0.0.1");

const nextConfig: NextConfig = {
  // File mode: articles are read from the content/ folder at request time (for pages built on demand),
  // so make sure that folder is shipped with the deployment.
  outputFileTracingIncludes: {
    "/blog/**": ["./content/**/*"],
    "/blog": ["./content/**/*"],
    "/blog/sitemap.xml": ["./content/**/*"],
    "/blog/feed.xml": ["./content/**/*"],
  },
    images: { remotePatterns: imageHosts, ...(localAssets ? { unoptimized: true } : {}) },
};
export default nextConfig;