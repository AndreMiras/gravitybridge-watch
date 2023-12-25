/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./src/proto/**", "./node_modules/@protobufs/**"],
    },
  },
}

module.exports = nextConfig
