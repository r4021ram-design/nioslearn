/* eslint-disable @typescript-eslint/no-require-imports */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    outputFileTracingIncludes: {
      '/**': ['./public/books/**/*'],
    },
  },
};

module.exports = withPWA(nextConfig);
