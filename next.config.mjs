/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel fix: ensure no basePath/assetPrefix/output:export that would cause 404
  // Previously app was in school-marketplace subdirectory causing Vercel to miss .next output
  // Now app is at repo root, so Vercel can correctly detect Next.js
  images: { unoptimized: true },
  poweredByHeader: false,
  // Explicitly ensure we are NOT using static export (which breaks dynamic routes on Vercel)
  // output: 'export' would cause 404 for all dynamic routes
  // basePath and assetPrefix must be undefined for Vercel
};

export default nextConfig;
