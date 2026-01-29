/**
 * Link Resolution Utility
 *
 * Resolves Sanity link objects to URLs
 * Handles internal page references, external URLs, and navigation items
 */

/**
 * Map Sanity document types to frontend routes
 */
const ROUTE_MAP: Record<string, string> = {
  homePage: "/",
  aboutPage: "/about",
  servicesPage: "/services",
  contactPage: "/contact",
  blogPage: "/blog",
  blogPost: "/blog",
  service: "/services",
  propertyType: "/property-types",
};

interface InternalReference {
  _type: string;
  slug?: { current: string };
}

interface SanityLink {
  linkType?: "internal" | "external";
  externalUrl?: string;
  internalLink?: InternalReference;
  // Navigation items use internalPage instead of internalLink
  internalPage?: { _type: string };
}

/**
 * Resolve a Sanity link object to a URL string
 * Works with both regular links (internalLink) and nav items (internalPage)
 * @param link - Sanity link object
 * @returns URL string or null if invalid
 */
export function resolveLink(
  link: SanityLink | undefined | null,
): string | null {
  if (!link) return null;

  // External link
  if (link.linkType === "external") {
    return link.externalUrl || null;
  }

  // Internal link (standard link object with internalLink)
  if (link.linkType === "internal" && link.internalLink) {
    const { _type, slug } = link.internalLink;
    return resolveInternalRoute(_type, slug?.current);
  }

  // Navigation item (uses internalPage instead of internalLink)
  if (link.linkType === "internal" && link.internalPage) {
    const { _type } = link.internalPage;
    return resolveInternalRoute(_type);
  }

  return null;
}

/**
 * Resolve internal route from document type and optional slug
 */
function resolveInternalRoute(
  docType: string,
  slug?: string,
): string | null {
  const basePath = ROUTE_MAP[docType];

  if (!basePath) {
    console.warn(`Unknown document type for routing: ${docType}`);
    return null;
  }

  // Singleton pages (no slug needed)
  if (basePath === "/" || !slug) {
    return basePath;
  }

  // Document pages (with slug)
  return `${basePath}/${slug}`;
}

/**
 * Check if a link should open in a new tab
 * @param url - URL to check
 * @returns true if external link
 */
export function isExternalLink(url: string | null): boolean {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}
