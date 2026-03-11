import { type QueryParams } from "sanity";
import { sanityClient } from "sanity:client";

// Visual editing is enabled when the env var is true OR in dev mode
const visualEditingEnabled =
  import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === "true" ||
  import.meta.env.DEV;

const token = import.meta.env.SANITY_API_READ_TOKEN;

/**
 * Check if visual editing is enabled for the current environment.
 * Use this in components/layouts to conditionally render the VisualEditing component.
 */
export function isVisualEditingEnabled(): boolean {
  return visualEditingEnabled;
}

export async function loadQuery<T>({
  query,
  params,
}: {
  query: string;
  params?: QueryParams;
}) {
  if (visualEditingEnabled && !token) {
    throw new Error(
      "The `SANITY_API_READ_TOKEN` environment variable is required during Visual Editing.",
    );
  }

  const perspective = visualEditingEnabled ? "previewDrafts" : "published";

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
