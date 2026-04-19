import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Voorkomt dat Next.js de hele schijf scant voor file tracing
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingExcludes: {
    "*": [
      "**/.venv/**",
      "**/node_modules/.cache/**",
      "**/__pycache__/**",
      "**/alembic/**",
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
