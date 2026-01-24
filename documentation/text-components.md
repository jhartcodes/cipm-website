# Text Components Guide

This document explains the difference between the `Text` and `RichText` components and how to use them effectively.

---

## **Text Component**

### **Purpose**

A **design system primitive** for rendering individual text elements with consistent typography, colors, and spacing. This is a **controlled component** where you explicitly define the semantic HTML element, visual style, and content.

### **When to Use**

- ✅ Static UI text (headings, labels, captions)
- ✅ Component-controlled content (not from CMS)
- ✅ Single text elements that need precise styling
- ✅ When you need programmatic control over element type and variant

### **Props**

```typescript
interface Props {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  variant?:
    | "hero"
    | "headingLg"
    | "heading"
    | "headingSm"
    | "body"
    | "bodyLg"
    | "small";
  tone?: "default" | "muted" | "inverted" | "inherit";
  align?: "left" | "center" | "right";
  id?: string;
  class?: string;
}
```

### **Usage Examples**

```astro
<!-- Basic usage: element determines default variant -->
<Text as="h1">Welcome to CIPM</Text>
<!-- → Renders: <h1 class="text-[clamp(...)] font-bold ... text-navy"> -->

<!-- Override variant for different visual hierarchy -->
<Text as="h2" variant="hero">Looks like h1, semantically h2</Text>

<!-- Contextual tone for different backgrounds -->
<Section tone="inverted">
  <Text as="h2" tone="inverted">White text on navy background</Text>
  <Text as="p" tone="inverted">Also white</Text>
</Section>

<!-- Muted tone for secondary text -->
<Text as="p" tone="muted">Published on January 23, 2026</Text>

<!-- Custom color override -->
<Text as="h3" class="text-turquoise">Turquoise heading</Text>

<!-- Alignment -->
<Text as="p" align="center">Centered paragraph</Text>

<!-- Inherit color from parent -->
<div class="text-turquoise">
  <Text as="span" tone="inherit">Turquoise from parent</Text>
</div>
```

### **The Tone System**

**Tone** is a semantic prop that adapts text color to different contexts without specifying exact colors.

#### **`tone="default"` (or omitted)**

Uses each variant's default color:

- Headings (hero, headingLg, heading, headingSm) → `text-navy`
- Body (body, bodyLg) → `text-gray-900`
- Small → `text-gray-600`

```astro
<Text as="h1">Navy heading (default)</Text>
<Text as="p">Dark gray body text (default)</Text>
```

#### **`tone="muted"`**

De-emphasized, secondary text:

- All variants → `text-gray-600`
- Use for: captions, metadata, dates, supplementary info

```astro
<Text as="p" tone="muted">Last updated 2 hours ago</Text>
<Text as="span" tone="muted" variant="small">Optional field</Text>
```

#### **`tone="inverted"`**

Text on dark backgrounds:

- All variants → `text-white`
- Pairs with `<Section tone="inverted">` (navy background)

```astro
<Section tone="inverted">
  <Text as="h2" tone="inverted">White on navy</Text>
  <Text as="p" tone="inverted">White paragraph</Text>
</Section>
```

#### **`tone="inherit"`**

No color class applied:

- Inherits color from parent element
- Use when parent already sets text color

```astro
<div class="text-turquoise">
  <Text as="p" tone="inherit">Turquoise (from parent)</Text>
</div>
```

### **Color Priority Chain**

1. **Variant default** (lowest priority)
2. **Tone override** (medium priority)
3. **Custom `class` prop** (highest priority)

```astro
<!-- Priority 1: Variant default -->
<Text as="h1">
  <!-- Classes: "... text-navy" (hero's default) -->
</Text>

<!-- Priority 2: Tone overrides variant default -->
<Text as="h1" tone="muted">
  <!-- Classes: "... text-gray-600" (tone wins) -->
</Text>

<!-- Priority 3: Custom class overrides everything -->
<Text as="h1" tone="muted" class="text-turquoise">
  <!-- Classes: "... text-gray-600 text-turquoise" -->
  <!-- → Renders as turquoise (last class wins in Tailwind) -->
</Text>
```

### **Variant Classes (Size, Weight, Spacing)**

Each variant defines typography WITHOUT color:

```typescript
{
  hero: 'text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight tracking-tight',
  headingLg: 'text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-snug tracking-tight',
  heading: 'text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-snug',
  headingSm: 'text-[clamp(1.25rem,2.5vw,1.5rem)] font-semibold leading-normal',
  body: 'text-base leading-relaxed',
  bodyLg: 'text-lg leading-relaxed',
  small: 'text-sm leading-normal',
}
```

**Fluid sizing** with `clamp()` ensures responsive typography without media queries.

---

## **RichText Component**

### **Purpose**

A **content renderer** for Sanity Portable Text (structured rich text from CMS). Converts Portable Text JSON into semantic HTML with appropriate styling via CSS classes.

### **When to Use**

- ✅ Long-form content from Sanity (blog posts, articles, bios)
- ✅ User-generated rich text (CMS editors control structure)
- ✅ Content with multiple paragraphs, headings, lists, quotes
- ✅ When content structure is **dynamic** and controlled by CMS

### **Props**

```typescript
interface Props {
  content?: any[]; // Portable Text blocks from Sanity
  class?: string;
}
```

### **Usage Examples**

```astro
---
// In a page/component that queries Sanity
const blogPost = await sanityClient.fetch(`
  *[_type == "blogPost" && slug.current == $slug][0] {
    title,
    content
  }
`, { slug });
---

<!-- Render entire rich text content block -->
<RichText content={blogPost.content} />

<!-- With custom wrapper class -->
<RichText content={blogPost.content} class="prose-lg" />

<!-- Fallback to slot if no content -->
<RichText>
  <p>No content available</p>
</RichText>
```

### **What It Renders**

RichText converts Sanity's Portable Text JSON structure into HTML:

**Input (Portable Text JSON):**

```json
[
  {
    "_type": "block",
    "style": "h2",
    "children": [{ "_type": "span", "text": "Introduction" }]
  },
  {
    "_type": "block",
    "style": "normal",
    "children": [
      { "_type": "span", "text": "This is a " },
      { "_type": "span", "text": "bold word", "marks": ["strong"] },
      { "_type": "span", "text": " in a sentence." }
    ]
  }
]
```

**Output (HTML):**

```html
<div class="richtext">
  <h2>Introduction</h2>
  <p>This is a <strong>bold word</strong> in a sentence.</p>
</div>
```

### **Supported Portable Text Features**

Currently supports:

- **Block types**: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `blockquote`, `normal` (paragraph)
- **Marks**: `strong`, `em`, `code`
- **Auto-escaping**: Prevents XSS attacks by escaping HTML

### **Styling via CSS**

RichText content is styled through the `.richtext` class in `src/styles/richtext.css`:

```css
/* Typography hierarchy */
.richtext h1 {
  @apply text-4xl font-bold text-navy mt-8 mb-4;
}
.richtext h2 {
  @apply text-3xl font-bold text-navy mt-6 mb-3;
}
.richtext p {
  @apply text-base text-gray-900 mb-4;
}

/* Spacing and flow */
.richtext > * + * {
  @apply mt-4;
}
```

**Why CSS instead of Text components?**

- RichText content structure is **dynamic** (controlled by CMS editors)
- You don't know ahead of time how many headings, paragraphs, etc. will exist
- CSS provides **consistent styling** across all content blocks

---

## **Tailwind v4 Color System**

### **Defining Custom Colors**

In Tailwind v4, custom colors are defined in `src/styles/global.css` using the `@theme` directive:

```css
@theme {
  /* Custom brand colors - these become utilities */
  --color-navy: #15396a;      /* → text-navy, bg-navy, border-navy */
  --color-turquoise: #4ea5c2; /* → text-turquoise, bg-turquoise */
  --color-yellow: #f2c94c;    /* → text-yellow, bg-yellow */

  /* Custom grays (use unique names, not gray-50, etc.) */
  --color-gray-50: #f4f7fa;
  --color-gray-900: #1c2b33;
}
```

### **Important Rules**

1. **Don't redefine built-in colors** - Tailwind has `white`, `black`, `transparent`, and standard `gray-*` colors built-in. Redefining them (e.g., `--color-white`) causes conflicts.

2. **Naming convention matters** - The prefix determines the utility type:
   - `--color-*` → `text-*`, `bg-*`, `border-*`
   - `--spacing-*` → `p-*`, `m-*`, `gap-*`
   - `--font-*` → `font-*`

3. **Use utilities in templates, `var()` in CSS**:
   ```astro
   <!-- In Astro/HTML: use utility class -->
   <div class="bg-navy text-white">...</div>
   ```
   ```css
   /* In CSS files: use var() syntax */
   body {
     color: var(--color-gray-900);
   }
   ```

### **Available Color Utilities**

From our `@theme` configuration:

| Variable | Utilities Created |
|----------|-------------------|
| `--color-navy` | `text-navy`, `bg-navy`, `border-navy` |
| `--color-turquoise` | `text-turquoise`, `bg-turquoise`, `border-turquoise` |
| `--color-yellow` | `text-yellow`, `bg-yellow`, `border-yellow` |
| `--color-gray-50` | `text-gray-50`, `bg-gray-50` |
| `--color-gray-600` | `text-gray-600`, `bg-gray-600` |
| `--color-gray-900` | `text-gray-900`, `bg-gray-900` |

Plus all built-in Tailwind colors: `white`, `black`, `transparent`, etc.

---

## **Key Differences**

| Feature            | **Text**                              | **RichText**                      |
| ------------------ | ------------------------------------- | --------------------------------- |
| **Purpose**        | Single text primitive                 | Rich content renderer             |
| **Content source** | Hardcoded/static                      | Sanity CMS (dynamic)              |
| **Structure**      | Single element                        | Multiple nested elements          |
| **Styling**        | Props + Tailwind classes              | CSS (`.richtext` wrapper)         |
| **Control**        | Explicit (you choose `as`, `variant`) | Implicit (CMS controls structure) |
| **Use case**       | UI text, headings, labels             | Blog content, articles, bios      |

### **Example: Homepage Hero**

```astro
---
const homePage = await sanityClient.fetch(`
  *[_type == "homePage"][0] {
    hero {
      title,
      subtitle,
      description
    }
  }
`);
---

<!-- Use Text for controlled, single elements -->
<Section>
  <Text as="h1" variant="hero" align="center">
    {homePage.hero.title}
  </Text>

  <Text as="p" variant="bodyLg" align="center" tone="muted">
    {homePage.hero.subtitle}
  </Text>

  <!-- Use RichText for multi-paragraph, rich content -->
  <RichText content={homePage.hero.description} />
</Section>
```

### **Example: Blog Post**

```astro
---
const blogPost = await sanityClient.fetch(`
  *[_type == "blogPost" && slug.current == $slug][0] {
    title,
    publishedAt,
    content
  }
`, { slug });
---

<article>
  <!-- Static UI text: use Text -->
  <Text as="h1">{blogPost.title}</Text>
  <Text as="p" tone="muted" variant="small">
    Published {new Date(blogPost.publishedAt).toLocaleDateString()}
  </Text>

  <!-- Dynamic rich content: use RichText -->
  <RichText content={blogPost.content} class="mt-8" />
</article>
```

---

## **Best Practices**

### **Use Text When:**

- ✅ Building UI components (headers, footers, cards)
- ✅ You need precise control over element type and styling
- ✅ Content is static or from simple CMS fields (plain strings)
- ✅ You want to leverage tone for semantic color adaptation

### **Use RichText When:**

- ✅ Rendering CMS-controlled rich text content
- ✅ Content includes multiple paragraphs, headings, formatting
- ✅ CMS editors need to control content structure
- ✅ You're rendering blog posts, articles, long-form text

### **Combining Both:**

```astro
<Section>
  <!-- Text for controlled UI -->
  <Text as="h2">Related Articles</Text>

  {articles.map(article => (
    <article class="mb-8">
      <!-- Text for metadata -->
      <Text as="h3">{article.title}</Text>
      <Text as="p" tone="muted" variant="small">{article.date}</Text>

      <!-- RichText for content -->
      <RichText content={article.excerpt} />
    </article>
  ))}
</Section>
```

---

## **Migration Notes**

If you have existing markup, here's how to convert:

**Before (plain HTML):**

```astro
<h1 class="text-4xl font-bold text-navy">Hello</h1>
<p class="text-gray-600">Secondary text</p>
```

**After (Text component):**

```astro
<Text as="h1">Hello</Text>
<Text as="p" tone="muted">Secondary text</Text>
```

**Before (Portable Text in template):**

```astro
{portableTextData.map(block => {
  if (block.style === 'h2') return <h2>{block.text}</h2>;
  return <p>{block.text}</p>;
})}
```

**After (RichText component):**

```astro
<RichText content={portableTextData} />
```
