# Astro + Sanity Migration Tasks

## Phase 0 — Decisions (quick, but important)

- [ ] Decide preview URL style:
  - Option A: `/preview?slug=/about&secret=...` (simplest, recommended)
- [ ] Decide blog routing:
  - `/blog` (index) and `/blog/[slug]` (detail)

## Phase 1 — Create the Astro project

- [ ] Create Astro project

  ```bash
  npm create astro@latest my-site
  cd my-site
  npm install
  ```

- [ ] Add Netlify adapter (needed for on-demand SSR only on preview routes)

  ```bash
  npx astro add netlify
  ```

- [ ] Confirm Astro is in hybrid mode (static by default, opt-out per route with `prerender = false`)
  - Astro's on-demand rendering is enabled per page using `export const prerender = false`
  - In `astro.config.mjs`, ensure you're not forcing everything to SSR (`output: "server"`). Keep it hybrid/static-first.

## Phase 2 — Tailwind (recommended modern setup)

Astro's old `@astrojs/tailwind` integration is deprecated for Tailwind 4; use the Vite plugin approach.

- [ ] Install Tailwind via Vite plugin

  ```bash
  npm install tailwindcss @tailwindcss/vite
  ```

- [ ] Add Tailwind plugin to `astro.config.mjs`

  ```js
  import { defineConfig } from "astro/config";
  import netlify from "@astrojs/netlify";
  import tailwindcss from "@tailwindcss/vite";

  export default defineConfig({
    adapter: netlify(),
    vite: {
      plugins: [tailwindcss()],
    },
  });
  ```

- [ ] Create `src/styles/global.css`

  ```css
  @import "tailwindcss";
  ```

- [ ] Import global CSS once in your base layout

  ```astro
  ---
  // src/layouts/BaseLayout.astro
  import "../styles/global.css";
  ---
  <html lang="en">
    <body>
      <slot />
    </body>
  </html>
  ```

- [ ] Add a basic container pattern (keep consistent spacing)
  - [ ] Create a `Container.astro` component (optional but recommended)
  - [ ] Use it on every page section

## Phase 3 — Sanity client + query strategy (published vs preview)

You'll run two modes:

- **Published mode**: CDN on, fast
- **Preview mode**: CDN off + token + previewDrafts

Sanity's docs cover CDN usage and why `useCdn` matters. Drafts require a token.

- [ ] Install Sanity client

  ```bash
  npm install @sanity/client
  ```

- [ ] Create `src/lib/sanity/client.ts`

  ```ts
  import { createClient } from "@sanity/client";

  const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = import.meta.env.PUBLIC_SANITY_DATASET;
  const apiVersion = "2025-02-06"; // hard-code (Sanity recommends this)

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
  ```

- [ ] Add env vars (local + Netlify)

  Create `.env`:

  ```env
  PUBLIC_SANITY_PROJECT_ID="xxx"
  PUBLIC_SANITY_DATASET="production"
  SANITY_API_READ_TOKEN="xxx"  # viewer token (server only)
  SANITY_PREVIEW_SECRET="some-long-random-string"
  ```

- [ ] Add those env vars in Netlify UI (Site settings → Environment variables)

## Phase 4 — Preview system (required for every page)

Astro supports on-demand rendering per-route with `export const prerender = false`.

### 4.1 Preview entry route (sets cookie + redirects)

- [ ] Create `src/pages/preview.astro`

  ```astro
  ---
  export const prerender = false;

  const url = new URL(Astro.request.url);
  const secret = url.searchParams.get("secret");
  const slug = url.searchParams.get("slug") ?? "/";

  if (secret !== import.meta.env.SANITY_PREVIEW_SECRET) {
    return new Response("Invalid preview secret", { status: 401 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": "__preview=1; Path=/; HttpOnly; Secure; SameSite=Lax",
      Location: slug.startsWith("/") ? slug : `/${slug}`,
    },
  });
  ---
  ```

### 4.2 Preview exit route (clears cookie)

- [ ] Create `src/pages/preview-exit.astro`

  ```astro
  ---
  export const prerender = false;

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": "__preview=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
      Location: "/",
    },
  });
  ---
  ```

### 4.3 Use preview cookie in any page loader

**Important**: any page that reads cookies/headers must be SSR for that request. So your pages can stay static unless you decide to support preview on the "normal" route.

The clean pattern is:

- Normal pages stay static
- Preview always redirects into the same path but with cookie → requires the page to be able to read cookie

So either:

- Mark every route `prerender = false` (full SSR), or
- Create parallel `/p/...` preview routes (best for static production)

✅ **Since you want static production, do this:**

- [ ] Add preview "mirror routes" under `/p`:
  - [ ] `/p/` mirrors `/`
  - [ ] `/p/about` mirrors `/about`
  - [ ] `/p/services` mirrors `/services`
  - [ ] `/p/blog` mirrors `/blog`
  - [ ] `/p/blog/[slug]` mirrors `/blog/[slug]`

These `/p/*` routes are SSR only. Everything else stays static.

_(Next message I can give you the exact file structure + shared helper so you don't duplicate logic.)_

## Phase 5 — Text editor / rich content (Portable Text)

For blog body + flexible page sections, use Portable Text in Sanity and render it in Astro.

- [ ] Install Portable Text renderer recommended for Astro

  ```bash
  npm install astro-portabletext
  ```

  Sanity recommends/uses `astro-portabletext` for Astro projects.

- [ ] Create `src/components/PortableText.astro` and centralize serializers (we'll do this once your schema is confirmed)

## Phase 6 — Images (fast + correct)

Astro supports local + remote images, including CMS/CDN sources.

**Recommended approach with Sanity:**

- Use Sanity Image CDN URLs (already optimized)
- Use width/quality params via `@sanity/image-url` (we'll wire this next)
- Let the browser pick sizes with `srcset` (Sanity CDN supports it nicely)

### Checklist:

- [ ] Install `@sanity/image-url`

  ```bash
  npm install @sanity/image-url
  ```

- [ ] Create `src/lib/sanity/image.ts` helper for `urlFor(image).width(1200).auto("format")...`

- [ ] Create `SanityImage.astro` component that outputs responsive images

## Phase 7 — Performance + caching strategy (CDN + build behavior)

You'll be fast by default because:

- Static routes are CDN-cached by Netlify
- Sanity uses a CDN when `useCdn: true` (published mode)

**Optional advanced:**
If later you want incremental refresh / ISR-like behavior on Netlify + Astro, Netlify has a guide for advanced caching + revalidation.

### Checklist:

- [ ] Ensure published queries use `useCdn: true`
- [ ] Ensure preview queries use `useCdn: false` + token
- [ ] Add long-term caching headers for hashed assets if needed (usually already fine on Netlify)
- [ ] Keep blog list queries lean (only request fields you render)

## Phase 8 — Contact form (Netlify Forms: simplest)

Netlify parses static HTML forms at build time and handles submissions without extra JS.

### Checklist:

- [ ] Add a contact form with `netlify` attribute
- [ ] Add a honeypot field

**Example:**

```html
<form
  name="contact"
  method="POST"
  data-netlify="true"
  netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="contact" />
  <p class="hidden">
    <label>Don't fill this out: <input name="bot-field" /></label>
  </p>

  <input name="name" />
  <input name="email" type="email" />
  <textarea name="message"></textarea>

  <button type="submit">Send</button>
</form>
```

## Phase 9 — Animations without React

- [ ] Add Astro View Transitions site-wide (layout-level)
- [ ] Use minimal JS for IntersectionObserver "reveal" effects (no framework needed)
