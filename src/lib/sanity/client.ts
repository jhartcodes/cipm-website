import { createClient } from "@sanity/client";

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET;

// Pin to a recent date — you control when this changes
export const apiVersion = "2026-01-01";

export function getSanityClient(opts?: { preview?: boolean }) {
  const preview = opts?.preview === true;

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: !preview,
    perspective: preview ? "previewDrafts" : "published",
    token: preview ? import.meta.env.SANITY_API_READ_TOKEN : undefined,
  });
}
