import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const previewDeployment =
    String(
      import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED ??
        process.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED,
    ).toLowerCase() === "true";
  const lines = previewDeployment
    ? ["User-agent: *", "Disallow: /"]
    : ["User-agent: *", "Allow: /"];

  if (!previewDeployment && site) {
    lines.push(`Sitemap: ${new URL("/sitemap.xml", site).toString()}`);
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
};
