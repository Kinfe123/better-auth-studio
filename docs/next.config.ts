import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "better-auth-studio.vercel.app" }],
        destination: "https://www.better-auth.studio/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "better-auth.studio" }],
        destination: "https://www.better-auth.studio/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
