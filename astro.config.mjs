import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import sanity from "@sanity/astro";
import react from "@astrojs/react";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

const siteUrl =
  env.SITE_URL ||
  env.URL ||
  "https://poetic-starlight-a799dd.netlify.app";

const visualEditingRuntimeEnabled =
  env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === "true";

const studioUrl =
  env.PUBLIC_SANITY_STUDIO_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3333"
    : "https://cipm.sanity.studio");

export default defineConfig({
  site: siteUrl,
  output: visualEditingRuntimeEnabled ? "server" : "static",
  adapter: netlify(),
  image: {
    domains: ["cdn.sanity.io"],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    ...(visualEditingRuntimeEnabled ? [] : [sitemap()]),
    sanity({
      projectId: "sv0c67ot",
      dataset: "production",
      useCdn: false,
      apiVersion: "2026-01-01",
      stega: {
        studioUrl,
      },
    }),
    react(),
  ],
});
