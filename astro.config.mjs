import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";
import sanity from "@sanity/astro";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  adapter: netlify(),
  image: {
    domains: ["cdn.sanity.io"],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
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
