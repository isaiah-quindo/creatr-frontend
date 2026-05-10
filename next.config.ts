import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Django's URL patterns all use trailing slashes. Don't let Next strip them
  // on /api/* requests, otherwise Django's APPEND_SLASH bounces us into a loop.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      // Always forward to Django with a trailing slash, regardless of how the
      // browser asked, so APPEND_SLASH never has reason to redirect.
      { source: "/api/:path*/", destination: `${BACKEND_URL}/api/:path*/` },
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*/` },
    ];
  },
};

export default nextConfig;
