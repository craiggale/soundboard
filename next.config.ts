import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Stops `next dev` writing its own block into the project's Agents.md.
  agentRules: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  // Logos are read from disk at runtime, so make sure serverless bundles include them.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@lobehub/icons-static-svg/icons/**/*"],
  },
  async redirects() {
    return [{ source: "/insights", destination: "/admin", permanent: false }];
  },
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
