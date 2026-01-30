import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";

export default defineConfig({
  projectId: "sv0c67ot",
  dataset: "production",
  plugins: [
    structureTool(),
    presentationTool({
      previewUrl: import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_PREVIEW_URL || "http://localhost:4321",
    }),
  ],
  schema: { types: [] },
});
