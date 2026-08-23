import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/applications", // Change to your primary route (e.g. /applications)
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
