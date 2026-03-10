/**
 * Sanity Image URL Builder
 *
 * Generates optimized image URLs from Sanity's Image CDN
 * Handles hotspot cropping, responsive sizing, and format optimization
 */

import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";

const builder = createImageUrlBuilder(sanityClient);

/**
 * Get image URL builder for a Sanity image
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/**
 * Get optimized image URL with sensible defaults
 * @param source - Sanity image object
 * @param width - Target width in pixels
 * @param quality - JPEG/WebP quality (1-100), default 80
 */
export function getImageUrl(
  source: SanityImageSource,
  width?: number,
  quality: number = 80,
): string {
  let imgBuilder = urlFor(source).auto("format").quality(quality);

  if (width) {
    imgBuilder = imgBuilder.width(width);
  }

  return imgBuilder.url();
}

/**
 * Get responsive srcset for an image
 * @param source - Sanity image object
 * @param widths - Array of widths for srcset (e.g., [400, 800, 1200])
 * @param quality - JPEG/WebP quality, default 80
 */
export function getImageSrcSet(
  source: SanityImageSource,
  widths: number[] = [400, 800, 1200, 1600],
  quality: number = 80,
): string {
  return widths
    .map((width) => {
      const url = getImageUrl(source, width, quality);
      return `${url} ${width}w`;
    })
    .join(", ");
}

/**
 * Get image dimensions from Sanity image metadata
 */
export function getImageDimensions(
  source: any,
): { width: number; height: number } | null {
  if (!source?.asset?._ref) return null;

  // Parse dimensions from asset ref (e.g., "image-123abc-1920x1080-jpg")
  const ref = source.asset._ref;
  const match = ref.match(/-(\d+)x(\d+)-/);

  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }

  return null;
}

/**
 * Get blur placeholder for progressive loading
 * Generates a tiny, low-quality version for blur-up effect
 */
export function getBlurPlaceholder(source: SanityImageSource): string {
  return urlFor(source).width(20).quality(20).blur(10).url();
}
