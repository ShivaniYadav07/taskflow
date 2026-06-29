import type { NextConfig } from 'next';

// API_URL is a server-side env var (no NEXT_PUBLIC_ prefix) — never exposed to the browser.
// The rewrite proxies all /api/* calls through the Next.js server to the Express backend,
// making them same-origin. This is what allows httpOnly cookies to work without CORS issues.
const API_URL = process.env.API_URL ?? 'http://localhost:8000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
