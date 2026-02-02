/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent any static generation caching
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        { key: "CDN-Cache-Control", value: "no-store" },
      ],
    },
  ],
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
