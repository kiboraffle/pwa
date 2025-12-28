/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Enable for Static Export (Capacitor). Note: Requires client-side data fetching for dynamic routes.
  images: {
      unoptimized: true
  }
};

export default nextConfig;
