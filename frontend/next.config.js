/** @type {import('next').NextConfig} */
const basePath = "/app-platform";
const nextConfig = {
    reactStrictMode: false,
    basePath,
    env: {
      NEXT_PUBLIC_BASE_PATH: basePath,
    },
};

module.exports = nextConfig;