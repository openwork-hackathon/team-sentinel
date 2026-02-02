/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: false, // 307 — avoids CDN caching stale 404s
      },
    ];
  },
};

module.exports = nextConfig;
