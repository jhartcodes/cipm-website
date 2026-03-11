import { type QueryParams } from "sanity";
import { sanityClient } from "sanity:client";

const visualEditingGloballyEnabled =
  import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === "true" ||
  import.meta.env.DEV;
const token = import.meta.env.SANITY_API_READ_TOKEN;
const previewPerspectiveParam = "sanity-preview-perspective";

interface VisualEditingRequestContext {
  url?: URL;
  request?: {
    url: string;
  };
  cookies?: {
    has(name: string): boolean;
    set?: (
      name: string,
      value: string,
      options?: {
        path?: string;
        sameSite?: "lax" | "strict" | "none";
        secure?: boolean;
      },
    ) => void;
  };
}

export function isVisualEditingEnabledForRequest(
  context: VisualEditingRequestContext,
): boolean {
  if (!visualEditingGloballyEnabled) return false;

  const requestUrl = context.request?.url
    ? new URL(context.request.url)
    : context.url;

  if (!requestUrl) return false;

  const hasPreviewPerspectiveParam =
    requestUrl.searchParams.has(previewPerspectiveParam);
  const previewPerspectiveValue = requestUrl.searchParams.get(
    previewPerspectiveParam,
  );

  if (
    hasPreviewPerspectiveParam &&
    previewPerspectiveValue &&
    context.cookies?.set
  ) {
    try {
      const secure = requestUrl.protocol === "https:";
      context.cookies.set(previewPerspectiveParam, previewPerspectiveValue, {
        path: "/",
        sameSite: secure ? "none" : "lax",
        secure,
      });
    } catch {
      // Ignore cookie persistence failures on unsupported/prerendered routes.
    }
  }

  // `Astro.cookies` can throw on prerendered pages because it depends on request headers.
  // Fail closed to keep static routes build-safe.
  let hasPreviewPerspectiveCookie = false;
  if (context.cookies) {
    try {
      hasPreviewPerspectiveCookie =
        context.cookies.has(previewPerspectiveParam) === true;
    } catch {
      hasPreviewPerspectiveCookie = false;
    }
  }

  return hasPreviewPerspectiveParam || hasPreviewPerspectiveCookie;
}

export async function loadQuery<T>({
  query,
  params,
  visualEditingEnabled = false,
}: {
  query: string;
  params?: QueryParams;
  visualEditingEnabled?: boolean;
}) {
  if (visualEditingEnabled && !visualEditingGloballyEnabled) {
    throw new Error(
      "Visual Editing is disabled for this environment. Set PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true for preview deployments.",
    );
  }

  if (visualEditingEnabled && !token) {
    throw new Error("SANITY_API_READ_TOKEN is required for Visual Editing.");
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
