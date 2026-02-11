import type { APIRoute } from "astro";
import { sanityClient } from "sanity:client";

const STATIC_ROUTES = ["/", "/about", "/services", "/contact", "/request-proposal", "/blog"];

function toXmlUrl(loc: string, lastmod?: string) {
  return [
    "<url>",
    `<loc>${loc}</loc>`,
    lastmod ? `<lastmod>${lastmod}</lastmod>` : "",
    "</url>",
  ]
    .filter(Boolean)
    .join("");
}

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response("Missing site URL", { status: 500 });
  }

  const urls: string[] = [...STATIC_ROUTES.map((route) => new URL(route, site).toString())];

  try {
    const [blogSlugs, serviceSlugs] = await Promise.all([
      sanityClient.fetch<string[]>(
        `*[_type == "blogPost" && defined(slug.current)] | order(publishedAt desc).slug.current`,
      ),
      sanityClient.fetch<string[]>(
        `*[_type == "service" && defined(slug.current) && enableDetailPage == true] | order(title asc).slug.current`,
      ),
    ]);

    for (const slug of blogSlugs ?? []) {
      if (slug) urls.push(new URL(`/blog/${slug}`, site).toString());
    }

    for (const slug of serviceSlugs ?? []) {
      if (slug) urls.push(new URL(`/services/${slug}`, site).toString());
    }
  } catch (error) {
    console.error("Sitemap generation partial fallback:", error);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => toXmlUrl(url)),
    "</urlset>",
  ].join("");

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
