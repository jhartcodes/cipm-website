# Astro View Transitions

Documentation for View Transitions setup and common issues encountered in this project.

---

## Setup

### BaseLayout Configuration

View Transitions are enabled via `ClientRouter` in `src/layouts/BaseLayout.astro`:

```astro
---
import { ClientRouter } from "astro:transitions";
---

<head>
  <!-- Other head content -->
  <ClientRouter prefetch="viewport" fallback="swap" />
</head>
```

**Options used:**
- `prefetch="viewport"` - Prefetch links when they enter the viewport
- `fallback="swap"` - Full page swap if View Transitions API not supported

### Persisted Elements

Elements that stay in the DOM across navigations use `transition:persist`:

```astro
<body>
  <TopRibbon data={topRibbon} transition:persist />
  <Navigation data={nav} transition:persist />

  <main transition:animate="fade">
    <slot /> <!-- Page content swapped here -->
  </main>

  <Footer data={footer} transition:persist />
</body>
```

---

## Common Issues & Fixes

### 1. JavaScript Not Running After Navigation

**Problem:** Inline `<script>` tags in components use IIFEs that run once on initial page load. After View Transitions navigation, the DOM is swapped but scripts don't re-execute.

**Symptom:** Interactive components (accordions, modals, menus) work on first page load but break after navigating to/from the page.

**Solution:** Use `astro:page-load` event instead of IIFE:

```javascript
// BAD - runs once, never again after navigation
(function() {
  const buttons = document.querySelectorAll('[data-trigger]');
  buttons.forEach(btn => btn.addEventListener('click', handleClick));
})();

// GOOD - runs on initial load AND after every navigation
document.addEventListener('astro:page-load', () => {
  const buttons = document.querySelectorAll('[data-trigger]');
  buttons.forEach(btn => btn.addEventListener('click', handleClick));
});
```

**Why it works:** When View Transitions swap the DOM, old elements (with their listeners) are removed and new elements are inserted. `astro:page-load` fires after the swap, allowing you to attach listeners to fresh elements.

**Files fixed:**
- `src/components/sections/about/FaqSection.astro`
- `src/components/sections/about/TeamSection.astro`
- `src/components/sections/Navigation.astro`

---

### 2. Persisted Elements Need Initialization Guard

**Problem:** Elements with `transition:persist` stay in the DOM across navigations. If using `astro:page-load`, listeners would be added multiple times.

**Solution:** Check for initialization flag on persisted elements:

```javascript
document.addEventListener('astro:page-load', () => {
  const button = document.getElementById('menu-button');
  if (!button) return;

  // Skip if already initialized (element persisted from previous page)
  if (button.dataset.initialized === 'true') return;
  button.dataset.initialized = 'true';

  // Attach listeners only once
  button.addEventListener('click', handleClick);
});
```

**Files using this pattern:**
- `src/components/sections/Navigation.astro` (uses `transition:persist`)

---

### 3. CSS Shadow/Styles Lost During Transition

**Problem:** Elements with `box-shadow` or other visual effects lose their styles during View Transition animations, causing a flicker.

**Symptom:** Header shadow disappears during navigation and reappears after transition completes.

**Solution:** Add `transition:animate="none"` to prevent animation on that element:

```astro
<!-- The shadow stays intact because no animation is applied -->
<header
  class="sticky top-0 shadow-md"
  transition:animate="none"
>
  <!-- Header content -->
</header>
```

**Files fixed:**
- `src/components/sections/Navigation.astro` - Added `transition:animate="none"` to `<header>`

---

### 4. Cleanup Before Navigation

**Problem:** Open modals, menus, or other UI state should be closed before View Transitions swap the DOM.

**Solution:** Listen for `astro:before-swap` event:

```javascript
document.addEventListener('astro:before-swap', () => {
  closeModal();
  closeMenu();
  resetState();
});
```

**Files using this pattern:**
- `src/components/sections/Navigation.astro` - Closes mobile menu before swap

---

## View Transitions Lifecycle Events

| Event | When it fires | Use case |
|-------|--------------|----------|
| `astro:before-preparation` | Before new page is fetched | Cancel navigation, show loading |
| `astro:after-preparation` | After new page is fetched | Access new document |
| `astro:before-swap` | Before DOM is swapped | Cleanup, close modals |
| `astro:after-swap` | After DOM is swapped | Low-level DOM access |
| `astro:page-load` | After swap + scripts run | **Initialize components** |

**Most common:** Use `astro:page-load` for component initialization.

---

## Transition Directives Reference

| Directive | Purpose |
|-----------|---------|
| `transition:persist` | Keep element in DOM across navigations |
| `transition:persist="id"` | Persist with explicit ID (for matching) |
| `transition:animate="fade"` | Fade in/out animation |
| `transition:animate="slide"` | Slide animation |
| `transition:animate="none"` | No animation (prevents style flicker) |
| `transition:name="unique"` | Named transition for custom CSS |

---

## Script Pattern Summary

### For components inside `<main>` (swapped on navigation):

```javascript
document.addEventListener('astro:page-load', () => {
  // Query fresh DOM elements
  // Attach event listeners
  // No initialization guard needed - elements are new each time
});
```

### For persisted components (Navigation, Footer, etc.):

```javascript
document.addEventListener('astro:page-load', () => {
  const element = document.getElementById('my-element');
  if (!element || element.dataset.initialized === 'true') return;
  element.dataset.initialized = 'true';

  // Attach event listeners once
});
```

---

## Related Files

- `src/layouts/BaseLayout.astro` - View Transitions setup
- `src/components/sections/Navigation.astro` - Persisted nav with mobile menu
- `src/components/sections/about/FaqSection.astro` - Accordion with page-load pattern
- `src/components/sections/about/TeamSection.astro` - Modal with page-load pattern
