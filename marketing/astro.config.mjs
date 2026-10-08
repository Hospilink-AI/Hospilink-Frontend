// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// SITE_URL: the public marketing domain. Update when the final domain is confirmed.
export default defineConfig({
  site: "https://hospilink.in",
  trailingSlash: "ignore",
  outDir: process.env.ASTRO_OUT || "./dist",
  build: { format: "directory" },
  integrations: [sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
});
