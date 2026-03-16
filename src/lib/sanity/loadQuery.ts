import { type QueryParams } from "sanity";
import { sanityClient } from "sanity:client";

type VisualEditingContext = {
  url?: URL;
  request?: Request;
};

const visualEditingEnabled =
  String(
    import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED ??
      process.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED,
  ).toLowerCase() === "true" || import.meta.env.DEV;

const token = import.meta.env.SANITY_API_READ_TOKEN;

/**
 * Presentation mode is environment-wide for this Astro setup:
 * - preview/local deployments enable drafts + stega everywhere
 * - production deployments serve published content only
 */
export function isVisualEditingEnabled(_context?: VisualEditingContext): boolean {
  return visualEditingEnabled;
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
