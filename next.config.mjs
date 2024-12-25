/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/amplify/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ];
  },
};
module.exports = nextConfig;
