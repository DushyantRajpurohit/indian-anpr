import type { NextConfig } from "next";

// GitHub Pages serves the repo at /indian-anpr; local dev runs at the root.
const basePath = process.env.NODE_ENV === "production" ? "/indian-anpr" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
