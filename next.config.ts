import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Auth-gated pages read cookies/headers, so these two cache flags are
     disabled (they are incompatible with dynamic route segments). */
  allowedDevOrigins: ["43.156.225.212"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
