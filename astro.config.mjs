import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Use "static" (default in Astro 5) - pages prerender by default
  // Pages that need SSR (like preview) use: export const prerender = false
  output: "static",
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
  },
});
