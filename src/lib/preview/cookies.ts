/**
 * Preview Mode Cookie Utilities
 *
 * Manages preview mode state via cookies
 * Used for /preview and /preview-exit routes
 */

import type { AstroCookies } from "astro";

const PREVIEW_COOKIE_NAME = "sanity-preview";
const PREVIEW_SECRET_COOKIE = "sanity-preview-secret";

// Only set secure flag in production (HTTPS)
const isProduction = import.meta.env.PROD;

/**
 * Enable preview mode
 * Sets cookies to activate draft content fetching
 */
export function enablePreview(cookies: AstroCookies, secret?: string) {
  cookies.set(PREVIEW_COOKIE_NAME, "true", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 60 * 60 * 24, // 24 hours
  });

  if (secret) {
    cookies.set(PREVIEW_SECRET_COOKIE, secret, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 60 * 60 * 24,
    });
  }
}

/**
 * Disable preview mode
 * Clears preview cookies
 */
export function disablePreview(cookies: AstroCookies) {
  cookies.delete(PREVIEW_COOKIE_NAME, { path: "/" });
  cookies.delete(PREVIEW_SECRET_COOKIE, { path: "/" });
}

/**
 * Check if preview mode is enabled
 */
export function isPreviewMode(cookies: AstroCookies): boolean {
  return cookies.get(PREVIEW_COOKIE_NAME)?.value === "true";
}

/**
 * Validate preview secret
 * Compares cookie secret with environment variable
 */
export function validatePreviewSecret(cookies: AstroCookies): boolean {
  const cookieSecret = cookies.get(PREVIEW_SECRET_COOKIE)?.value;
  const envSecret = import.meta.env.SANITY_PREVIEW_SECRET;

  return !!cookieSecret && !!envSecret && cookieSecret === envSecret;
}
