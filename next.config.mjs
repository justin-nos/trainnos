/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets phones on the local network load dev assets (e.g. http://10.0.1.131:3000).
  // Dev only; Next 16 otherwise answers 403 and client components never render.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*", "*.local"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname:
          "/v0/b/nos-training-facility.appspot.com/o/testimonialImages**",
      },
    ],
  },
  // Analytics became the admin home. Browsers keep the #range/tab hash.
  async redirects() {
    return [
      {source: "/admins/analytics", destination: "/admins", permanent: false},
    ];
  },
};
export default nextConfig;
