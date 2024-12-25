/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/amplify/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ];
  },
};
export default nextConfig;
