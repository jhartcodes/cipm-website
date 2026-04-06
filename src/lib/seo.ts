import { stegaClean } from "@sanity/client/stega";
import type { SanityImageSource } from "@sanity/image-url";
import { getImageUrl } from "./sanity/image";

export type StructuredData = Record<string, unknown>;

export function toPlainText(value: unknown): string {
  if (typeof value === "string") {
    return stegaClean(value).replace(/\s+/g, " ").trim();
  }

  if (!Array.isArray(value)) {
    return "";
  }

  const text = value
    .map((block) => {
      if (!block || typeof block !== "object") return "";

      if ((block as { _type?: string })._type === "block") {
        const children = (block as { children?: Array<{ text?: string }> })
          .children;
        return (children || [])
          .map((child) => (typeof child?.text === "string" ? child.text : ""))
          .join("");
      }

      if ((block as { _type?: string })._type === "textBlock") {
        return toPlainText((block as { content?: unknown[] }).content);
      }

      return "";
    })
    .filter(Boolean)
    .join(" ");

  return text.replace(/\s+/g, " ").trim();
}

export function buildMetaDescription(
  values: unknown[],
  maxLength: number = 160,
): string | undefined {
  const text = values
    .map((value) => toPlainText(value))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return undefined;
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const cutoff = lastSpace > maxLength - 30 ? lastSpace : maxLength;

  return `${truncated.slice(0, cutoff).trimEnd()}...`;
}

export function compactJsonLd<T>(value: T): T | undefined {
  if (value === null || value === undefined) return undefined;

  if (Array.isArray(value)) {
    const items = value
      .map((item) => compactJsonLd(item))
      .filter((item): item is NonNullable<typeof item> => item !== undefined);
    return items.length > 0 ? (items as unknown as T) : undefined;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, compactJsonLd(item)] as const)
      .filter(([, item]) => {
        if (item === undefined) return false;
        if (item === "") return false;
        if (Array.isArray(item) && item.length === 0) return false;
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          return Object.keys(item).length > 0;
        }
        return true;
      });

    return entries.length > 0 ? (Object.fromEntries(entries) as T) : undefined;
  }

  return value;
}

export function buildBreadcrumbStructuredData(
  items: Array<{ name: string; item: string }>,
): StructuredData | undefined {
  return compactJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  });
}

export function buildArticleStructuredData({
  headline,
  description,
  url,
  publishedAt,
  image,
  authorName,
  publisherId,
}: {
  headline?: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  image?: SanityImageSource;
  authorName?: string;
  publisherId?: string;
}): StructuredData | undefined {
  const imageUrl = image ? getImageUrl(image, 1200, 85) : undefined;

  return compactJsonLd({
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    mainEntityOfPage: url,
    datePublished: publishedAt,
    image: imageUrl ? [imageUrl] : undefined,
    author: authorName
      ? {
          "@type": "Person",
          name: authorName,
        }
      : undefined,
    publisher: publisherId
      ? {
          "@id": publisherId,
        }
      : undefined,
  });
}
