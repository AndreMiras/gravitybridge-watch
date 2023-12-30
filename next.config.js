/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./src/proto/**", "./node_modules/@protobufs/**"],
    },
  },
  async rewrites() {
    return [
      {
        source: "/metrics",
        destination: "/api/metrics",
      },
    ];
  },
};

module.exports = nextConfig;
