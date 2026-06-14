import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint stylistic rules shouldn't block production builds for this app.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Signature PNGs (base64) and uploads (foto aset s/d 5MB) can exceed defaults.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
