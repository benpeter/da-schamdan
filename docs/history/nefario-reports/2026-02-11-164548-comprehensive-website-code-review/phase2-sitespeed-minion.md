# Domain Plan Contribution: sitespeed-minion

## Codebase Performance Analysis Summary

After reading the complete codebase -- `head.html`, `scripts/scripts.js`, `scripts/aem.js`, `scripts/dapreview.js`, `scripts/delayed.js`, all block JS/CSS files, `styles/styles.css`, `styles/fonts.css`, `styles/lazy-styles.css`, and `404.html` -- I have identified several performance concerns across five major dimensions. The site uses AEM Edge Delivery Services' standard 3-phase loading pattern (eager/lazy/delayed), which is inherently well-designed for performance, but the current implementation has dead-code overhead, a critical-path bottleneck, and missed optimization opportunities that will prevent reaching Lighthouse 100.

---

## Recommendations

### 1. Critical Path Bottleneck: `dapreview.js` Dynamic Import in Eager Phase

**Severity: HIGH**

In `/Users/ben/github/benpeter/da-schamdan/scripts/scripts.js`, lines 74-75:

```js
const daPreview = (await import(`${import.meta.url.replace('scripts.js', 'dapreview.js')}`)).default;
if (daPreview) await daPreview;
```

This `await import()` sits at the very top of `loadEager()` -- the function responsible for getting to LCP as fast as possible. Every single page load pays the cost of dynamically importing `dapreview.js`, parsing it, and executing it, even when the `?dapreview` query parameter is absent. The module itself (`/Users/ben/github/benpeter/da-schamdan/scripts/dapreview.js`) conditionally loads an external script from `https://da.live/scripts/dapreview.js` only when `?dapreview` is in the URL, but the import of the wrapper module itself is unconditional.

**Impact**: This adds a network request + module parse/execute to the critical rendering path for every visitor. On slow connections, this delay directly increases LCP and FCP. The dynamic import with string concatenation (`import.meta.url.replace(...)`) also defeats static analysis, preventing bundlers and preload scanners from optimizing this.

**Recommendation**: The `dapreview.js` import should be gated by the query parameter check *before* the import, or moved entirely out of the eager phase. Ideal pattern:

```js
// Only import dapreview when the query param is present
if (new URLSearchParams(window.location.search).has('dapreview')) {
  const daPreview = (await import('./dapreview.js')).default;
  if (daPreview) await daPreview;
}
```

This eliminates the module fetch/parse for 100% of production visitors (who never have `?dapreview`).

### 2. Dead Code: Empty `fonts.css` and `lazy-styles.css`

**Severity: MEDIUM**

- `/Users/ben/github/benpeter/da-schamdan/styles/fonts.css` contains only a comment: `/* load fonts */`
- `/Users/ben/github/benpeter/da-schamdan/styles/lazy-styles.css` contains only a comment: `/* below the fold CSS goes here */`

Despite being empty, these files are fetched on every page load:

- `fonts.css` is loaded via `loadFonts()` which is called **twice**: once in `loadEager()` (line 87, conditionally for desktop or returning visitors) and once in `loadLazy()` (line 110, unconditionally). Each call triggers `loadCSS()` which creates a `<link>` element and fetches the file. The `loadCSS` function in `aem.js` does check for duplicates (line 255), so the second call resolves immediately -- but the first call still fetches an empty file.
- `lazy-styles.css` is loaded in `loadLazy()` (line 109).

**Impact**: Two unnecessary HTTP requests. Even though HTTP/2 makes these cheap and the CDN will serve them quickly, each still has latency cost (DNS + connection reuse + TLS session + request/response). More importantly, this is dead code that creates confusion about the font loading strategy.

**Recommendation**:
- If no custom web fonts are planned, remove the `loadFonts()` function and both calls to it. Remove `fonts.css`.
- If custom web fonts *are* planned (restaurant sites often benefit from distinctive typography), implement a proper font loading strategy: add `@font-face` declarations to `fonts.css`, use `font-display: swap` (or `optional` for best CLS), preload the WOFF2 files in `head.html`, and keep the session storage optimization for returning visitors.
- If no below-fold styles are needed yet, remove the `lazy-styles.css` load. Add it back when there is actual content.
- Remove the duplicate `loadFonts()` call -- it should only be called once, in `loadLazy()`.

### 3. Font Strategy: System Fonts Are Good, but Configuration Is Messy

**Severity: LOW (functionally) / MEDIUM (code quality)**

The site currently uses system fonts defined in `/Users/ben/github/benpeter/da-schamdan/styles/styles.css` (lines 23-25):

```css
--body-font-family: 'Palatino', 'Times', 'Times New Roman', serif;
--heading-font-family: var(--body-font-family);
--fixed-font-family: 'Roboto Mono', menlo, consolas, 'Liberation Mono', monospace;
```

Using system fonts is excellent for performance -- zero font loading delay, zero CLS from font swaps, zero additional HTTP requests. However:

- The `loadFonts()` infrastructure remains in place doing nothing, which is misleading.
- `Roboto Mono` is listed in `--fixed-font-family` but is never loaded via `@font-face`. It will only render if the user happens to have it installed locally. On most systems, it will fall back to `menlo` (macOS) or `consolas` (Windows), which is fine -- but the declaration is misleading.
- The conditional font loading logic in `loadEager()` (lines 84-90) checks `window.innerWidth >= 900` and `sessionStorage.getItem('fonts-loaded')` -- this is the standard AEM EDS pattern for deferring font loads on mobile first visits, but it is loading an empty file.

**Recommendation**: Either commit to system fonts (clean up the dead code) or implement a proper web font strategy. Do not leave the skeleton in place.

### 4. Hero Block: Image Sizing and LCP Optimization

**Severity: MEDIUM-HIGH**

The hero block (`/Users/ben/github/benpeter/da-schamdan/blocks/hero/hero.css`) uses absolute positioning for the background image:

```css
main .hero picture {
    position: absolute;
    z-index: -1;
    inset: 0;
    object-fit: cover;
}

main .hero img {
    object-fit: cover;
    width: 100%;
    height: 100%;
}
```

The hero container has `min-height: 300px` and `margin-top: 80px`. There is no `hero.js` file (the glob found nothing -- it was an empty file or the read returned no content), meaning the hero block relies entirely on CSS for its presentation. The hero is auto-built in `scripts.js` (lines 17-26) by the `buildHeroBlock()` function.

**Performance concerns**:

a) **No explicit width/height on hero image**: The `<picture>` element created by AEM's content pipeline should have width/height attributes on the `<img>` tag, but because the hero uses `position: absolute` with `inset: 0`, the browser cannot determine the image's layout dimensions from the HTML alone. The image size is entirely CSS-dependent, which means the browser's preload scanner cannot reserve space properly.

b) **LCP candidate identification**: The `waitForFirstImage()` function in `aem.js` (lines 654-665) correctly finds the first `<img>` in the first section and sets it to `loading="eager"`. This is the hero image. Good -- this ensures the LCP image is eager-loaded.

c) **No `fetchpriority="high"` on LCP image**: The `waitForFirstImage` function sets `loading="eager"` but does not set `fetchpriority="high"`. Adding `fetchpriority="high"` on the LCP candidate image tells the browser to prioritize this fetch above other resources, which can improve LCP by 100-400ms.

d) **No `<link rel="preload">` for hero image**: Since the hero image URL is dynamic (from content), it cannot be preloaded in `head.html`. However, the `waitForFirstImage` pattern compensates for this by ensuring eager loading.

e) **CLS risk**: The absolute-positioned image with `min-height: 300px` may cause layout shifts if the header or content above it changes height. The `margin-top: 80px` for the nav offset is hardcoded rather than using `var(--nav-height)` (which is 64px), creating a 16px discrepancy that should be verified.

**Recommendation**:
- Add `fetchpriority="high"` to the hero image in `waitForFirstImage()` or in the hero block decoration.
- Verify that `margin-top: 80px` in hero.css is intentional vs. the `--nav-height: 64px` variable, as this mismatch may indicate a layout issue.
- Consider adding `aspect-ratio` to the hero container for more predictable layout before the image loads.

### 5. Image Optimization Patterns Across Blocks

**Severity: MEDIUM**

a) **`createOptimizedPicture()` in `aem.js`** (lines 315-361): Uses two breakpoints -- `width=2000` for desktop (`min-width: 600px`) and `width=750` for mobile. Serves WebP via `<source type="image/webp">` with original format fallback. This is good but has gaps:

- **No AVIF support**: The function only generates WebP sources. AVIF provides 50% better compression than JPEG and has full modern browser support (Chrome, Firefox, Safari, Edge). Adding AVIF as a higher-priority source would reduce image payload significantly.
- **Desktop image at 2000px width**: This is very large. For a site with `max-width: 900px` on `main` and `max-width: 1200px` on sections, a 2000px image is oversized even for 2x retina displays (1200px * 2 = 2400px would be the theoretical max, but most content is 900px wide, making 1800px the practical 2x max). The hero is full-width so 2000px may be appropriate there, but for cards and other blocks it is wasteful.

b) **Cards block** (`/Users/ben/github/benpeter/da-schamdan/blocks/cards/cards.js`, line 15): Replaces images with `createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])` -- a single breakpoint at 750px with `loading="lazy"` (the `false` parameter). This is reasonable for card images within a grid, but:
- Only one breakpoint means no responsive serving -- both mobile (320px viewport) and desktop (1200px viewport) get the same 750px image.
- Cards are below the fold so `lazy` loading is correct.

c) **Columns block** (`/Users/ben/github/benpeter/da-schamdan/blocks/columns/columns.js`): Only adds a CSS class, does not process images. Images in columns will use whatever the content pipeline provides (likely the default `<picture>` from AEM with standard breakpoints).

d) **No `aspect-ratio` on card images in CSS**: The cards CSS sets `aspect-ratio: 4 / 3` on `img` which is correct for preventing CLS. Good pattern.

**Recommendation**:
- Evaluate adding AVIF as a source format in `createOptimizedPicture()` -- this is an `aem.js` framework change that benefits all blocks.
- Review the 2000px desktop breakpoint -- for most content areas capped at 900-1200px, a 1600px image would serve 2x retina adequately and save bandwidth.
- Consider adding a medium breakpoint (e.g., `width=1200` for tablets) to `createOptimizedPicture()` defaults.

### 6. CSS Delivery Strategy

**Severity: LOW**

The CSS delivery is well-structured for the AEM EDS pattern:
- `styles.css` is loaded synchronously in `head.html` (render-blocking, intentional for above-fold styling).
- Block-specific CSS (e.g., `hero.css`, `header.css`) is loaded dynamically when blocks are decorated via `loadCSS()` in `loadBlock()`.
- `lazy-styles.css` is loaded asynchronously in `loadLazy()`.

This is the correct pattern. The only issue is the empty `lazy-styles.css` generating an unnecessary request (covered in recommendation 2).

**Additional observation**: The `styles.css` file is 243 lines and relatively lean (no bloat, no unused styles apparent). This is good -- small render-blocking CSS minimizes FCP delay.

### 7. `body { display: none }` / `.appear` Pattern

**Severity: LOW (standard pattern, but worth documenting)**

In `/Users/ben/github/benpeter/da-schamdan/styles/styles.css` (lines 52-57):

```css
body { display: none; }
body.appear { display: unset; }
```

The body is hidden until `document.body.classList.add('appear')` is called in `loadEager()` (line 80). This prevents FOUC (Flash of Unstyled Content) but means:
- FCP is blocked until JavaScript executes and adds the `appear` class.
- If JavaScript fails, the page is permanently invisible.
- This is the standard AEM EDS pattern and is generally accepted, but it ties FCP directly to JS execution time.

The `dapreview.js` bottleneck (recommendation 1) directly delays this `.appear` class addition.

### 8. Delayed Phase: External Link Processing

**Severity: LOW**

In `/Users/ben/github/benpeter/da-schamdan/scripts/delayed.js` (lines 14-18):

```js
document.querySelectorAll('a').forEach((a) => {
  if (!isLocal(a)) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
});
```

This runs after a 3-second delay, which is correct -- it is not performance-critical. However, `document.querySelectorAll('a')` scans the entire DOM. For a small restaurant site this is negligible, but the pattern is worth noting for future reference. The `sampleRUM('cwv')` call in delayed.js correctly defers Core Web Vitals collection to avoid impacting the metrics themselves.

### 9. Header Block: Network Fetch in Decoration

**Severity: LOW-MEDIUM**

The header block (`/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js`) fetches `/nav.plain.html` during decoration. Since the header is loaded in `loadLazy()` (not eager), this does not block LCP. However, the header is fixed-position and visible at the top of the viewport, so a delayed header render can cause:
- Visual instability as the nav pops in.
- The `header { height: var(--nav-height) }` rule in `styles.css` reserves space (64px), which prevents CLS. This is correct.

The same pattern applies to the footer block fetching `/footer.plain.html`.

---

## Proposed Tasks

### Task 1: Audit and Fix Critical Path (`dapreview.js` Bottleneck)
**What**: Gate the `dapreview.js` import behind a URL parameter check so production visitors never pay the import cost. Move the check from inside `dapreview.js` to before the import in `scripts.js`.
**Deliverable**: Updated `/Users/ben/github/benpeter/da-schamdan/scripts/scripts.js` with conditional import; performance audit report item documenting the before/after impact on FCP and LCP.
**Dependencies**: None. This is the highest-priority fix.
**Estimated LCP improvement**: 50-200ms depending on connection speed.

### Task 2: Clean Up Dead Font/CSS Loading Code
**What**: Remove empty `fonts.css` and `lazy-styles.css` files, remove the `loadFonts()` function and its two call sites, remove the `loadCSS` call for `lazy-styles.css`. If custom fonts are desired for the restaurant brand, replace with a proper implementation instead.
**Deliverable**: Updated `/Users/ben/github/benpeter/da-schamdan/scripts/scripts.js` (remove `loadFonts()`, remove `lazy-styles.css` load), deletion of empty CSS files; or alternatively, a proper font loading implementation with `@font-face`, WOFF2 files, and preload hints.
**Dependencies**: Design decision on whether custom fonts are wanted. This task should include a recommendation in either direction.

### Task 3: Add `fetchpriority="high"` to LCP Image
**What**: Modify the `waitForFirstImage()` function in `aem.js` to set `fetchpriority="high"` on the LCP candidate image, in addition to `loading="eager"`.
**Deliverable**: Updated `/Users/ben/github/benpeter/da-schamdan/scripts/aem.js` with `fetchpriority` attribute; audit report documenting LCP impact.
**Dependencies**: None. Low-risk, high-reward change.
**Estimated LCP improvement**: 100-400ms on congested connections.

### Task 4: Hero Block CLS and Layout Audit
**What**: Verify the hero block's `margin-top: 80px` vs `--nav-height: 64px` discrepancy. Add `aspect-ratio` to the hero container for predictable layout. Verify no CLS occurs during hero image load across mobile and desktop viewports.
**Deliverable**: Updated `/Users/ben/github/benpeter/da-schamdan/blocks/hero/hero.css` with corrected spacing and aspect-ratio; CLS measurement report.
**Dependencies**: Depends on Task 3 for complete hero optimization.

### Task 5: Image Optimization Strategy Review
**What**: Evaluate adding AVIF support to `createOptimizedPicture()`. Review default breakpoints (2000px desktop, 750px mobile) against actual content area widths. Add a tablet breakpoint. Verify card images are appropriately sized.
**Deliverable**: Audit report with specific breakpoint recommendations per block type. If AVIF is recommended, provide the implementation pattern for `createOptimizedPicture()`.
**Dependencies**: This is an `aem.js` framework-level change -- coordinate with AEM EDS best practices (some teams prefer not to modify `aem.js` and instead override per-block).

### Task 6: Define Performance Budgets
**What**: Establish performance budgets for the site based on current baseline measurements. Define metric-based budgets (LCP < 2.5s, CLS < 0.1, INP < 200ms, FCP < 1.8s, TBT < 200ms), resource-based budgets (total page weight, JS budget, CSS budget, image budget), and provide Lighthouse CI configuration for CI/CD enforcement.
**Deliverable**: Performance budget document with current baselines, target values, and Lighthouse CI configuration file (`.lighthouserc.js`).
**Dependencies**: Tasks 1-5 should be assessed first to establish realistic baselines.

### Task 7: 404 Page Performance Review
**What**: The `/Users/ben/github/benpeter/da-schamdan/404.html` page loads both `scripts.js` and `lazy-styles.css` synchronously in the `<head>`. The inline `<script>` also uses `window.addEventListener('load', ...)` which fires late. Review and optimize.
**Deliverable**: Report item with recommendations for 404 page loading strategy.
**Dependencies**: None. Low priority.

---

## Risks and Concerns

1. **`aem.js` modification risk**: The `aem.js` file is the AEM Edge Delivery Services framework library. Modifying it (Tasks 3, 5) means diverging from the upstream boilerplate. Future AEM EDS updates may conflict with custom changes. Recommendation: document all `aem.js` modifications and evaluate whether changes can be made in `scripts.js` or per-block instead.

2. **`dapreview.js` is a DA (Document Authoring) preview tool**: Removing or gating it incorrectly could break the content authoring preview workflow. The fix (Task 1) must preserve functionality when `?dapreview` is in the URL. Testing should verify DA preview still works after the change.

3. **Image breakpoints depend on CDN behavior**: The `?width=X&format=webply&optimize=medium` URL parameters depend on the AEM/Helix image optimization CDN. AVIF support (Task 5) requires verifying the CDN supports `format=avif` -- if it does not, the recommendation changes to "wait for CDN support."

4. **System font fallback chain**: The current `Palatino, Times, Times New Roman, serif` stack renders differently across operating systems. On Android, none of these fonts are typically available, falling back to the platform serif (usually Noto Serif). This is a design concern more than a performance concern, but it affects perceived quality on mobile.

5. **No RUM data available for baseline**: Without access to the live site's Chrome UX Report or RUM data, all performance estimates are based on code analysis. Actual measurements (Lighthouse audit of the deployed site, WebPageTest runs, CrUX data) are needed to validate priorities and measure improvement.

6. **`body { display: none }` risk**: If any JavaScript error occurs before `document.body.classList.add('appear')`, the page is permanently blank. The `dapreview.js` import (if it fails on a network error) could potentially cause this, since it sits in the `try`-less part of `loadEager()` before the `appear` class is added. The current error handling in `loadEager` does not have a try/catch around the dapreview import.

---

## Additional Agents Needed

1. **frontend-minion**: Required for implementing the recommended changes (Tasks 1-5). sitespeed-minion identifies and prescribes; frontend-minion executes the code changes. Specifically needed for: modifying `scripts.js` loading logic, cleaning up dead code, adding `fetchpriority`, hero CSS fixes, and potentially modifying `createOptimizedPicture()`.

2. **accessibility-minion** (if available): The hero block's `z-index: -1` pattern and the `body { display: none }` pattern have accessibility implications. The fixed nav and hamburger menu need keyboard navigation and ARIA attribute verification. While not strictly performance-related, a comprehensive code review should include this.

3. **seo-minion** (if available): Core Web Vitals are Google ranking signals. The performance recommendations (especially LCP and CLS fixes) directly impact SEO. An SEO specialist should validate that the `head.html` has proper meta tags, structured data for a restaurant (LocalBusiness schema), and that the performance budget targets align with competitive SEO requirements for local restaurant searches.
