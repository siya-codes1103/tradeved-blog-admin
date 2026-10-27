import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the admin reuse the blog components and helpers from ../site (one source of truth, so the
  // editor preview always matches the real blog).
  experimental: { externalDir: true },

  // Files from ../site (store.ts etc.) should also resolve packages from admin/node_modules,
  // otherwise gray-matter and server-only are not found.
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(process.cwd(), "node_modules"),
      ...(config.resolve.modules ?? ["node_modules"]),
    ];
    return config;
  },

  // Vercel: lets the build trace files that sit outside the admin folder.
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
};
export default nextConfig;