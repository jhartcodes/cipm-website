import { type QueryParams } from "sanity";
import { sanityClient } from "sanity:client";

type VisualEditingContext = {
  url: URL;
  request?: Request;
};

const previewQueryParams = new Set([
  "sanity-preview-secret",
  "sanity-preview-pathname",
  "sanity-preview-perspective",
]);
const perspectiveCookieName = "sanity-preview-perspective";

// Master switch for Visual Editing support.
const visualEditingConfigured =
  String(
    import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED ??
      process.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED,
  ).toLowerCase() === "true";

// Emergency rollback flag if preview detection becomes too strict.
const visualEditingAlwaysOn =
  String(
    import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ALWAYS_ON ??
      process.env.PUBLIC_SANITY_VISUAL_EDITING_ALWAYS_ON,
  ).toLowerCase() === "true";

const token = import.meta.env.SANITY_API_READ_TOKEN;

function hasPreviewSearchParams(url: URL): boolean {
  for (const key of previewQueryParams) {
    if (url.searchParams.has(key)) {
      return true;
    }
  }
  return false;
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const target = `${name}=`;
  const match = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(target));
  return match ? decodeURIComponent(match.slice(target.length)) : null;
}

/**
 * Determine if the current request should use draft/stega mode.
 * Keeps preview fully functional while serving published content for normal traffic.
 */
export function isVisualEditingEnabled(context?: VisualEditingContext): boolean {
  if (!visualEditingConfigured) return false;
  if (visualEditingAlwaysOn) return true;
  if (!context) return false;

  if (hasPreviewSearchParams(context.url)) return true;

  if (context.request) {
    const perspective = getCookieValue(
      context.request.headers.get("cookie"),
      perspectiveCookieName,
    );
    if (perspective && perspective !== "published") return true;

    const referer = context.request.headers.get("referer") ?? "";
    if (referer.includes("sanity.studio") || referer.includes("mode=presentation")) {
      return true;
    }
  }

  return false;
}

export async function loadQuery<T>({
  query,
  params,
  visualEditingEnabled = isVisualEditingEnabled(),
}: {
  query: string;
  params?: QueryParams;
  visualEditingEnabled?: boolean;
}) {
  if (visualEditingEnabled && !token) {
    throw new Error(
      "The `SANITY_API_READ_TOKEN` environment variable is required during Visual Editing.",
    );
  }

  const perspective = visualEditingEnabled ? "drafts" : "published";

  const { result, resultSourceMap } = await sanityClient.fetch<T>(
    query,
    params ?? {},
    {
      filterResponse: false,
      perspective,
      resultSourceMap: visualEditingEnabled ? "withKeyArraySelector" : false,
      stega: visualEditingEnabled,
      useCdn: !visualEditingEnabled,
      ...(visualEditingEnabled ? { token } : {}),
    },
  );

  return { data: result, sourceMap: resultSourceMap, perspective };
}
