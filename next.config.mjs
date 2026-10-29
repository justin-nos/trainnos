// Public objects in the Supabase `media` bucket (testimonials, community, trainers).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets phones on the local network load dev assets (e.g. http://10.0.1.131:3000).
  // Dev only; Next 16 otherwise answers 403 and client components never render.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*", "*.local"],
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: supabaseHost.protocol.replace(":", ""),
            hostname: supabaseHost.hostname,
            port: supabaseHost.port,
            pathname: "/storage/v1/object/public/media/**",
          },
        ]
      : [],
    // Next 16 won't optimize images from local IPs. Only relaxed when the
    // app itself points at a local Supabase (127.0.0.1), never in production.
    dangerouslyAllowLocalIP: ["127.0.0.1", "localhost"].includes(supabaseHost?.hostname),
  },
  // Analytics became the admin home. Browsers keep the #range/tab hash.
  async redirects() {
    return [
      {source: "/admins/analytics", destination: "/admins", permanent: false},
    ];
  },
};
export default nextConfig;
