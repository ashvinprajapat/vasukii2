/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js only inlines NEXT_PUBLIC_* into the browser bundle, so the project's
  // VITE_API_BASE_URL is forwarded under the name lib/api/config.ts reads.
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.VITE_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
