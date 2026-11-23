import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `cacheComponents` (Next 16) is intentionally left off. Forge is a
  // data-heavy, per-request-authenticated app; plain async Server Components
  // with explicit caching where it helps is easier to reason about than the
  // `'use cache'` + Suspense ceremony that flag requires.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
    ],
  },
};

export default nextConfig;
