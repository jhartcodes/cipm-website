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
    <slot />
    <!-- Page content swapped here -->
  </main>

  <Footer data={footer} transition:persist />
</body>
```

---

## Common Issues & Fixes

### 1. JavaScript Not Running After Navigation

**Problem:** IIFEs only run when the script is evaluated. With view transitions, scripts may not re-run for swapped content, so use astro:page-load for initialization.

**Symptom:** Interactive components (accordions, modals, menus) work on first page load but break after navigating to/from the page.

**Solution:** Use `astro:page-load` event instead of IIFE:

```javascript
// BAD - runs once, never again after navigation
(function () {
  const buttons = document.querySelectorAll("[data-trigger]");
  buttons.forEach((btn) => btn.addEventListener("click", handleClick));
})();

// GOOD - runs on initial load AND after every navigation
document.addEventListener("astro:page-load", () => {
  const buttons = document.querySelectorAll("[data-trigger]");
  buttons.forEach((btn) => btn.addEventListener("click", handleClick));
});
```

**Why it works:** When View Transitions swap the DOM, old elements (with their listeners) are removed and new elements are inserted. `astro:page-load` fires after the swap, allowing you to attach listeners to fresh elements.

**Files fixed:**

- `src/components/sections/about/FaqSection.astro`
- `src/components/sections/about/TeamSection.astro`
- `src/components/sections/Navigation.astro`

---

### 2. Use Property Assignment to Prevent Listener Stacking

**Problem:** `addEventListener` stacks handlers - calling it multiple times adds multiple listeners. This causes issues with:

- Persisted elements (listeners added on each navigation)
- Document-level listeners (`document.onclick`, etc.)

**Solution:** Use property assignment (`.onclick =`) which **overwrites** instead of stacking:

```javascript
// BAD - addEventListener stacks handlers
button.addEventListener("click", handler); // listener 1
button.addEventListener("click", handler); // listener 2 (both fire!)

// GOOD - property assignment overwrites
button.onclick = handler; // sets handler
button.onclick = handler; // replaces handler (only one fires)
```

**Recommended pattern:**

```javascript
document.addEventListener("astro:page-load", () => {
  const button = document.getElementById("menu-button");
  const menu = document.getElementById("menu");
  if (!button || !menu) return;

  const closeMenu = () => menu.classList.add("hidden");
  const openMenu = () => menu.classList.remove("hidden");

  // Property assignment - overwrites, no stacking
  button.onclick = (e) => {
    e.stopPropagation();
    menu.classList.contains("hidden") ? openMenu() : closeMenu();
  };

  document.onclick = (e) => {
    if (!button.contains(e.target) && !menu.contains(e.target)) closeMenu();
  };

  document.onkeydown = (e) => {
    if (e.key === "Escape") closeMenu();
  };

  // Self-cleaning listener for cleanup
  document.addEventListener("astro:before-swap", closeMenu, { once: true });
});
```

**Benefits:**

- No initialization guard (`dataset.initialized`) needed
- Simpler, more predictable code
- Works for both persisted and swapped elements
- `{ once: true }` makes cleanup listeners self-removing

**Files using this pattern:**

- `src/components/sections/Navigation.astro`
- `src/components/sections/about/FaqSection.astro`
- `src/components/sections/about/TeamSection.astro`

---

### 3. CSS Shadow/Styles Lost During Transition

**Problem:** Elements with `box-shadow` or other visual effects lose their styles during View Transition animations, causing a flicker.

**Symptom:** Header shadow disappears during navigation and reappears after transition completes.

**Solution:** Add `transition:animate="none"` to prevent animation on that element:

```astro
<!-- The shadow stays intact because no animation is applied -->
<header class="sticky top-0 shadow-md" transition:animate="none">
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
document.addEventListener("astro:before-swap", () => {
  closeModal();
  closeMenu();
  resetState();
});
```

**Files using this pattern:**

- `src/components/sections/Navigation.astro` - Closes mobile menu before swap

---

## View Transitions Lifecycle Events

| Event                      | When it fires              | Use case                        |
| -------------------------- | -------------------------- | ------------------------------- |
| `astro:before-preparation` | Before new page is fetched | Cancel navigation, show loading |
| `astro:after-preparation`  | After new page is fetched  | Access new document             |
| `astro:before-swap`        | Before DOM is swapped      | Cleanup, close modals           |
| `astro:after-swap`         | After DOM is swapped       | Low-level DOM access            |
| `astro:page-load`          | After swap + scripts run   | **Initialize components**       |

**Most common:** Use `astro:page-load` for component initialization.

---

## Transition Directives Reference

| Directive                    | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `transition:persist`         | Keep element in DOM across navigations  |
| `transition:persist="id"`    | Persist with explicit ID (for matching) |
| `transition:animate="fade"`  | Fade in/out animation                   |
| `transition:animate="slide"` | Slide animation                         |
| `transition:animate="none"`  | No animation (prevents style flicker)   |
| `transition:name="unique"`   | Named transition for custom CSS         |

---

## Script Pattern Summary

**Preferred pattern for all components (swapped or persisted):**

```javascript
document.addEventListener("astro:page-load", () => {
  const element = document.getElementById("my-element");
  if (!element) return;

  // Property assignment overwrites - no stacking, no guards needed
  element.onclick = () => {
    /* handler */
  };
  element.onkeydown = (e) => {
    /* handler */
  };

  // Document-level listeners
  document.onclick = (e) => {
    /* handler */
  };
  document.onkeydown = (e) => {
    /* handler */
  };

  // Cleanup before navigation (self-removing)
  document.addEventListener("astro:before-swap", cleanup, { once: true });
});
```

**Why property assignment over addEventListener:**

- **Simpler** - No initialization guards needed
- **Predictable** - Overwrites instead of stacking
- **Universal** - Same pattern works for swapped and persisted elements

---

## Related Files

- `src/layouts/BaseLayout.astro` - View Transitions setup
- `src/components/sections/Navigation.astro` - Persisted nav with mobile menu
- `src/components/sections/about/FaqSection.astro` - Accordion with page-load pattern
- `src/components/sections/about/TeamSection.astro` - Modal with page-load pattern
