# Sanity Visual Editing with Astro

This document explains how visual editing (live preview with click-to-edit overlays) works in this Astro + Sanity project.

This repository uses a standalone Studio plus a separate Astro frontend. The Studio is not embedded inside `cipm-astro`.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sanity Studio                            │
│                   (cipm.sanity.studio)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Presentation Tool                        │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Preview Site (iframe)                   │  │  │
│  │  │         (cipm-preview.netlify.app)                   │  │  │
│  │  │                                                      │  │  │
│  │  │   ┌─────────┐  ┌─────────┐  ┌─────────┐            │  │  │
│  │  │   │ Overlay │  │ Overlay │  │ Overlay │  ← Click   │  │  │
│  │  │   └────┬────┘  └────┬────┘  └────┬────┘    to edit │  │  │
│  │  │        │            │            │                  │  │  │
│  │  │   [Content]    [Content]    [Content]              │  │  │
│  │  │        ↑            ↑            ↑                  │  │  │
│  │  │        └────────────┴────────────┘                  │  │  │
│  │  │                     │                               │  │  │
│  │  │              Stega-encoded                          │  │  │
│  │  │              strings from                           │  │  │
│  │  │              Sanity API                             │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Stega Encoding (Content Source Maps)

When visual editing is enabled, Sanity embeds invisible characters into string content. These characters encode:
- Document ID
- Field path
- Dataset information

This allows the `VisualEditing` component to know which Studio field each piece of content comes from.

### 2. The VisualEditing Component

```astro
<VisualEditing enabled={visualEditingEnabled} />
```

This component:
- Scans the DOM for stega-encoded content
- Renders blue overlay boxes on hover
- Establishes postMessage communication with the Studio
- Handles click events to open the correct field in the Studio

### 3. Environment-Based Activation

Visual editing is controlled by a single environment variable:

```typescript
const visualEditingEnabled =
  import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === "true";
```

| Environment | `DEV` | Env Var | Result |
|-------------|-------|---------|--------|
| Local dev (`npm run dev`) | n/a | `"true"` | **Enabled** |
| Local dev (`npm run dev`) | n/a | `"false"` | **Disabled** |
| Preview deployment | `false` | `"true"` | **Enabled** |
| Production deployment | `false` | `"false"` | **Disabled** |

In this project, the preview deployment is the Presentation frontend. It does not use per-request draft-mode cookies or URL heuristics.

## Required Configuration

### Environment Variables

#### Astro Frontend (.env)

```bash
# Sanity project
PUBLIC_SANITY_PROJECT_ID="your-project-id"
PUBLIC_SANITY_DATASET="production"

# Visual editing (set to "true" for preview deployments)
PUBLIC_SANITY_VISUAL_EDITING_ENABLED="false"

# Studio URL (where overlays link to)
PUBLIC_SANITY_STUDIO_URL="https://your-studio.sanity.studio"

# API token with Viewer permissions (required for draft content)
SANITY_API_READ_TOKEN="sk..."
```

#### Sanity Studio (.env)

```bash
# Preview URL for Presentation tool
SANITY_STUDIO_VISUAL_EDITING_PREVIEW_URL="https://your-preview-site.netlify.app"
```

### Netlify Environment Variables

| Site | Variable | Value |
|------|----------|-------|
| **Production** | `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` | `false` |
| **Preview** | `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` | `true` |
| **Preview** | `SANITY_API_READ_TOKEN` | Your viewer token |
| **Preview** | `PUBLIC_SANITY_STUDIO_URL` | `https://cipm.sanity.studio` |

## File Structure

```
cipm-astro/
├── astro.config.mjs          # Sanity integration + stega config
├── src/
│   ├── lib/sanity/
│   │   └── loadQuery.ts      # Data fetching with stega support
│   └── layouts/
│       └── BaseLayout.astro  # VisualEditing component
│
studio-cipm-/
├── sanity.cli.ts             # Hosted Studio URL + deployment config
├── sanity.config.ts          # Presentation tool config
└── presentation/
    └── resolve.ts            # Document location resolver
```

## Key Files Explained

### astro.config.mjs

```javascript
sanity({
  projectId: "your-id",
  dataset: "production",
  useCdn: false,
  stega: {
    studioUrl,  // Where overlay clicks navigate to
  },
})
```

The `stega.studioUrl` tells overlays where the Studio is hosted.

### loadQuery.ts

```typescript
const perspective = visualEditingEnabled ? "drafts" : "published";

await sanityClient.fetch(query, params, {
  perspective,
  resultSourceMap: visualEditingEnabled ? "withKeyArraySelector" : false,
  stega: visualEditingEnabled,
  useCdn: !visualEditingEnabled,
  ...(visualEditingEnabled ? { token } : {}),
});
```

When visual editing is enabled:
- Uses `drafts` perspective (shows unpublished changes)
- Enables `resultSourceMap` (required for stega)
- Enables `stega` encoding
- Disables CDN (ensures fresh content)
- Includes auth token (required for drafts)

### presentation/resolve.ts (Studio)

Maps document types to frontend URLs for:
1. **Location badges** - Shows "Used on: /about" in Studio
2. **Navigation sync** - When you navigate in iframe, Studio shows correct document

```typescript
export const resolve = {
  locations: {
    aboutPage: defineLocations({
      select: {},
      resolve: () => ({
        locations: [{ title: 'About', href: '/about' }],
      }),
    }),
    blogPost: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          { title: doc.title, href: `/blog/${doc.slug}` },
        ],
      }),
    }),
  },
  mainDocuments: defineDocuments([
    { route: '/about', filter: `_type == "aboutPage"` },
    { route: '/blog/:slug', filter: `_type == "blogPost" && slug.current == $slug` },
  ]),
}
```

## Deployment Strategy

You need **two separate deployments**:

### Production Site
- URL: Your public domain
- `PUBLIC_SANITY_VISUAL_EDITING_ENABLED=false`
- `output: "static"` in Astro config
- Shows published content only
- No overlays, no draft access
- Fast, CDN-cached

### Preview Site
- URL: Separate preview subdomain/URL
- `PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true`
- `output: "server"` in Astro config (SSR required for drafts)
- Shows draft content
- Overlays enabled
- Used inside Presentation tool iframe

## View Transitions

Preview deployments intentionally disable Astro client-side transitions.

Reason:

- Presentation worked on the initial page load
- client-side navigation broke overlays until a hard refresh
- full document navigation is the more reliable match for the current `@sanity/astro` Presentation setup

Production deployments can still use Astro transitions.

## Common Issues

### Overlays Not Appearing

1. **Check env var** - Is `PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true`?
2. **Check token** - Is `SANITY_API_READ_TOKEN` set and valid?
3. **Check Studio URL** - Is `PUBLIC_SANITY_STUDIO_URL` correct?
4. **Check allowOrigins** - Does Studio config include your preview URL?

### Wrong Studio URL

The `PUBLIC_SANITY_STUDIO_URL` must be your actual Studio URL:
- Correct: `https://cipm.sanity.studio`
- Wrong: `https://www.sanity.io/@username/studio/...` (this is the dashboard URL)

The dashboard URL may still appear when navigating from Sanity Manage, but it should not be treated as the canonical frontend overlay target.

### Preview Crawlability

Preview deployments should not be indexed:
- `PUBLIC_SANITY_VISUAL_EDITING_ENABLED="true"` forces `noindex, nofollow`
- `robots.txt` disallows crawling
- the sitemap is not emitted for preview builds

### Navigation Not Syncing in Presentation Tool

Ensure `presentation/resolve.ts` includes:
- `mainDocuments` array with routes for all page types
- Correct GROQ filters matching your document types

## Security Notes

1. **Never expose `SANITY_API_READ_TOKEN` to the client** - It's only used server-side in `loadQuery.ts`
2. **Preview site should not be indexed** - This setup enforces `noindex`, `robots.txt` blocking, and no sitemap on preview builds
3. **Consider auth for preview site** - Netlify password protection or similar is still a good idea if the preview URL is public

## References

- [Sanity Astro Blog Guide](https://www.sanity.io/docs/developer-guides/sanity-astro-blog)
- [Presentation Tool Docs](https://www.sanity.io/docs/visual-editing/configuring-the-presentation-tool)
- [Visual Editing Overlays](https://www.sanity.io/docs/visual-editing/visual-editing-overlays)
- [@sanity/astro Package](https://www.sanity.io/plugins/sanity-astro)
