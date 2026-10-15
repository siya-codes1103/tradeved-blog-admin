import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the admin reuse the blog components and helpers from ../site (one source of truth, so the
  // editor preview always matches the real blog).
  experimental: { externalDir: true },
};
export default nextConfig;
