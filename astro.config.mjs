import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import sanity from "@sanity/astro";
import react from "@astrojs/react";

const siteUrl =
  process.env.SITE_URL ||
  process.env.URL ||
  "https://poetic-starlight-a799dd.netlify.app";

export default defineConfig({
  site: siteUrl,
  output: "static",
  adapter: netlify(),
  image: {
    domains: ["cdn.sanity.io"],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap(),
    sanity({
      projectId: "sv0c67ot",
      dataset: "production",
      useCdn: false,
      apiVersion: "2026-01-01",
      stega: {
        studioUrl: "https://cipm.sanity.studio",
      },
    }),
    react(),
  ],
});
