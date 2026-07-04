/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxies API calls through the Vercel origin so the browser talks to
  // /api/v1/... same-origin instead of directly to the Render backend.
  // This keeps the refresh_token cookie first-party (SameSite=Lax works)
  // instead of cross-site, where Safari/Chrome would otherwise block it.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
