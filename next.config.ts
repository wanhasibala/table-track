import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL("https://zdcbvcxgacnjlbkjnprm.supabase.co/**")],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
