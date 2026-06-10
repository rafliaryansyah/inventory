import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint stylistic rules shouldn't block production builds for this app.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Signature PNGs (base64) and uploads can exceed the default 1MB action body.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
