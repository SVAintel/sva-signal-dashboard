/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  // "ws" (used by the naval-vessel AIS route) relies on optional native
  // binary addons (bufferutil/utf-8-validate) that break when webpack tries
  // to bundle them into the serverless function — keep it as a real
  // require() against node_modules instead. Same story for "pg" (used by the
  // historical event/fleet-snapshot store): its optional pg-native addon
  // should not be webpack-bundled.
  experimental: {
    serverComponentsExternalPackages: ["ws", "pg"],
  },
};

module.exports = nextConfig;
