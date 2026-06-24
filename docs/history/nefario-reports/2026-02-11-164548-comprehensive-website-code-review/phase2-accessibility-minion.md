# Domain Plan Contribution: accessibility-minion

## Recommendations

### Priority WCAG 2.2 Criteria for This Site

Based on thorough analysis of the codebase, this restaurant site has **critical accessibility gaps** concentrated in navigation, semantic structure, and data presentation. The following WCAG 2.2 success criteria are highest priority, ordered by severity and frequency of impact:

**Critical (Level A violations -- blocking for assistive technology users):**

1. **SC 4.1.2 Name, Role, Value (A)** -- The hamburger toggle (`div.nav-hamburger`) has no accessible name, no button role, and no keyboard operability. Screen readers cannot identify or operate it.
2. **SC 2.1.1 Keyboard (A)** -- The hamburger and nav section dropdowns use only `click` event listeners on `<div>` and `<li>` elements. No `keydown`/`keypress` handlers exist. Keyboard-only users cannot open/close the mobile nav or expand dropdown sections.
3. **SC 1.3.1 Info and Relationships (A)** -- The speisen (menu) block presents tabular data (item number, name, description, sizes, prices) in a CSS Grid of `<div>` elements. This data has clear row/column relationships that are invisible to screen readers. Should use `<table>` or ARIA table roles.
4. **SC 1.1.1 Non-text Content (A)** -- The `decorateIcon()` function in `aem.js` sets `alt=""` (empty string) for all icons by default (line 472). Icons used as the sole content of interactive elements (e.g., search icon in nav tools) will be invisible to screen readers. The hero block's background images need appropriate alt text handling.

**Serious (Level A/AA violations -- degraded experience):**

5. **SC 2.4.1 Bypass Blocks (A)** -- No skip navigation link exists. The fixed navigation requires tabbing through all nav items before reaching main content.
6. **SC 2.4.6 Headings and Labels (AA)** -- Need to verify heading hierarchy across pages. The hero block extracts `h1` and moves it into the hero section, which could disrupt heading order.
7. **SC 2.4.11 Focus Not Obscured (Minimum) (A, new in WCAG 2.2)** -- The navigation is `position: fixed` with `z-index: 1`. Focused elements near the top of the page may be completely hidden behind the fixed header.
8. **SC 2.4.13 Focus Appearance (AA, new in WCAG 2.2)** -- No custom focus styles are defined in `styles.css` for links (`text-decoration: none` removes the default underline, and button `:focus` only changes background color -- no visible focus ring). The default browser outline may be removed or insufficient.
9. **SC 1.4.3 Contrast (Minimum) (AA)** -- The color scheme uses `--text-color: #492000` on `--background-color: rgb(240 240 220)`. The hero overlay uses `background: rgb(204 204 204 / 30%)` which may reduce contrast for h1 text over images. Must verify all color combinations.
10. **SC 2.5.8 Target Size (Minimum) (AA, new in WCAG 2.2)** -- The hamburger icon is 20x22px (CSS lines 71-73 in header.css), below the 24x24px minimum. Nav dropdown items on mobile need size verification.

**Important (Level AA violations -- compliance gaps):**

11. **SC 1.3.2 Meaningful Sequence (A)** -- The speisen block's 5-cell grid uses CSS Grid named areas that visually reorder content. Need to verify DOM order matches logical reading order.
12. **SC 3.1.1 Language of Page (A)** -- The `404.html` has `<html>` without a `lang` attribute (line 2). The main pages set `document.documentElement.lang = 'de-DE'` via JavaScript (scripts.js line 72), but this fails if JS is blocked or errors.
13. **SC 2.4.4 Link Purpose (In Context) (A)** -- The `decorateButtons()` function in `aem.js` sets `a.title = a.title || a.textContent` (line 426), which creates redundant title attributes that screen readers announce twice.

### Highest-Risk Accessibility Patterns

**1. The Hamburger Navigation (CRITICAL RISK)**

File: `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js` (lines 53-61)

```javascript
const hamburger = document.createElement('div');
hamburger.classList.add('nav-hamburger');
hamburger.innerHTML = '<div class="nav-hamburger-icon"></div>';
hamburger.addEventListener('click', () => { ... });
```

Issues found:
- Element is a `<div>`, not a `<button>` -- no implicit button role, not in tab order, not keyboard operable
- No `aria-label` or visible text -- screen readers announce nothing meaningful
- No `aria-controls` pointing to the nav sections
- Only `click` handler, no `keydown` handler for Enter/Space
- The `aria-expanded` state is set on the parent `<nav>` element (line 62) rather than on the hamburger itself, which is semantically incorrect -- the control (hamburger) should carry `aria-expanded`, not the container

**2. Nav Section Dropdowns (CRITICAL RISK)**

File: `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js` (lines 42-49)

```javascript
navSection.addEventListener('click', () => {
  const expanded = navSection.getAttribute('aria-expanded') === 'true';
  collapseAllNavSections(navSections);
  navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
});
```

Issues found:
- `<li>` elements with `aria-expanded` but no button role -- screen readers may not announce expandability
- Only `click` handler -- keyboard users cannot toggle dropdowns
- No `role="button"` or wrapping `<button>` element
- No `aria-haspopup` to indicate dropdown behavior
- The dropdown pattern does not follow the WAI-ARIA APG Disclosure Navigation Menu pattern

**3. Speisen (Menu) Block -- Tabular Data in CSS Grid (HIGH RISK)**

File: `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.js`

The speisen block transforms authored content into a 5-cell grid per row: `item-nr | item-info | item-desc | item-sizes | item-prices`. This is fundamentally tabular data (a restaurant menu with item numbers, names, descriptions, size variants, and prices), but it uses `<div>` elements with CSS Grid layout.

Issues found:
- No `<table>`, `role="table"`, `role="row"`, or `role="cell"` semantics
- No column headers (`<th>` or `role="columnheader"`) associating prices with items
- Header rows (`.price-header` class, line 55) use `<strong>` for visual emphasis but have no semantic header role
- Screen reader users navigating this content will hear a flat sequence of disconnected text fragments with no understanding of which price belongs to which item or size
- The "header row" pattern (empty info + bold labels in price column, lines 103-107) creates visual column headers but has no ARIA semantics

**4. Hero Block Background Images (MODERATE RISK)**

File: `/Users/ben/github/benpeter/da-schamdan/blocks/hero/hero.css` (lines 27-38)

The hero positions the `<picture>` element as a background via `position: absolute; z-index: -1; inset: 0`. The `<img>` inside will still be in the accessibility tree. If the image is decorative (purely atmospheric), it needs `alt=""`. If it conveys information about the restaurant, it needs meaningful alt text. The current implementation inherits whatever alt text was authored in the CMS, which may or may not be appropriate.

**5. Link and Button Focus Indicators (MODERATE RISK)**

File: `/Users/ben/github/benpeter/da-schamdan/styles/styles.css`

```css
a:any-link {
  color: var(--link-color);
  text-decoration: none;  /* removes underline -- links only distinguishable by color */
}

a.button:hover, a.button:focus, button:hover, button:focus {
  background-color: var(--link-hover-color);  /* same as default link-color */
  cursor: pointer;
}
```

Issues found:
- Links have `text-decoration: none` and rely solely on color to distinguish from surrounding text (violates SC 1.4.1 Use of Color)
- No explicit `:focus-visible` or `:focus` outline styles -- relies on browser defaults which may be suppressed
- Button focus style only changes `background-color` to `var(--link-hover-color)`, which equals `var(--link-color)` (`#622a0f`) -- effectively no visible change on focus
- The `cursor: pointer` change on focus is not perceivable by keyboard users

**6. 404 Page Missing `lang` Attribute**

File: `/Users/ben/github/benpeter/da-schamdan/404.html` (line 2)

```html
<html>
```

Missing `lang="de"` attribute. Screen readers will default to the user's language setting, potentially mispronouncing German content.

**7. Icon Alt Text Handling**

File: `/Users/ben/github/benpeter/da-schamdan/scripts/aem.js` (lines 464-476)

```javascript
function decorateIcon(span, prefix = '', alt = '') {
  // ...
  img.alt = alt;  // defaults to empty string
}
```

The `alt` parameter defaults to `''`. The `decorateIcons()` function (line 483-488) never passes an alt value -- it calls `decorateIcon(span, prefix)` without the `alt` argument. This means ALL icons rendered through this system have `alt=""`, making them decorative. If an icon is the sole content of a link or button (like the search icon in the nav tools), the parent interactive element has no accessible name.

### Automated vs. Manual Testing Split

For this site, I estimate:

- **Automated testing (axe-core/Lighthouse)** will catch approximately 35-40% of issues: missing alt text, color contrast failures, missing form labels, missing lang attribute, ARIA attribute validation
- **Manual testing** is required for the remaining 60-65%: keyboard operability of custom widgets, screen reader announcements, logical reading order of the speisen grid, focus management during nav open/close, hero image alt text appropriateness

### Recommended axe-core Configuration

```javascript
axe.run({
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
  },
  rules: {
    'target-size': { enabled: true },     // WCAG 2.2 SC 2.5.8
    'color-contrast': { enabled: true },  // SC 1.4.3
    'region': { enabled: true },          // landmark structure
    'landmark-one-main': { enabled: true }
  }
});
```

## Proposed Tasks

### Task A1: Fix Hamburger Navigation Accessibility (Critical)
**What to do:** Replace the hamburger `<div>` with a `<button>` element. Add `aria-label="Menu"` (or the German equivalent `aria-label="Menue"` since the site language is `de-DE`). Move `aria-expanded` from the `<nav>` to the button. Add `aria-controls` pointing to the nav sections container's id. The button gets keyboard operability for free from native HTML.

**Deliverables:** Updated `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js` with accessible hamburger button. Updated `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.css` to style `button` instead of `div`. Screen reader testing notes confirming correct announcement.

**Dependencies:** None. Can start immediately.

**WCAG criteria addressed:** SC 4.1.2 (A), SC 2.1.1 (A), SC 1.3.1 (A), SC 2.5.8 (AA)

### Task A2: Fix Nav Section Dropdown Keyboard Accessibility (Critical)
**What to do:** Wrap the text content of each `nav-drop` `<li>` in a `<button>` element that carries `aria-expanded` and handles keyboard events (Enter/Space to toggle). Follow the WAI-ARIA APG Disclosure Navigation Menu pattern. Ensure focus management: when dropdown opens, focus remains on the button; when dropdown closes, focus returns to the button. Add `keydown` handler for Escape to close open dropdown.

**Deliverables:** Updated `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js`. Updated `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.css` for button styling within nav. Keyboard interaction test script.

**Dependencies:** None. Can run in parallel with A1.

**WCAG criteria addressed:** SC 2.1.1 (A), SC 4.1.2 (A), SC 2.1.2 (A -- no keyboard trap)

### Task A3: Add Semantic Table Structure to Speisen Block (Critical)
**What to do:** Refactor the speisen block to use either native `<table>` markup or ARIA table roles (`role="table"`, `role="row"`, `role="rowheader"`, `role="cell"`, `role="columnheader"`). Header rows should use `role="columnheader"` or `<th>`. Each menu item row should associate its number, name, description, sizes, and prices as cells within a row. Alternatively, use a description list (`<dl>`) structure if the data is better modeled as term/definition pairs.

**Deliverables:** Updated `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.js` with semantic markup. Updated `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.css` to style the new elements. Screen reader testing verification that item-price associations are announced correctly.

**Dependencies:** None. Can start immediately. Coordinate with frontend-minion for implementation.

**WCAG criteria addressed:** SC 1.3.1 (A), SC 1.3.2 (A)

### Task A4: Add Skip Navigation Link (Serious)
**What to do:** Add a visually-hidden skip link as the first focusable element on the page that becomes visible on focus and links to `#main` (or the main content landmark). The `<main>` element in the EDS boilerplate already exists. Add `id="main"` to it or use `<main>` as the skip target.

**Deliverables:** Updated `/Users/ben/github/benpeter/da-schamdan/scripts/scripts.js` or `/Users/ben/github/benpeter/da-schamdan/head.html` with skip link. CSS for visually-hidden-but-focusable pattern in `/Users/ben/github/benpeter/da-schamdan/styles/styles.css`.

**Dependencies:** None.

**WCAG criteria addressed:** SC 2.4.1 (A)

### Task A5: Fix Focus Indicators Across All Interactive Elements (Serious)
**What to do:** Add visible `:focus-visible` styles that meet WCAG 2.2 SC 2.4.13 Focus Appearance requirements. The focus indicator must have a contrast ratio of at least 3:1 against adjacent colors and provide a minimum area of focus indication. Add `:focus-visible` outlines to links, buttons, and nav items. Ensure links are distinguishable from surrounding text without relying solely on color (add underline on focus/hover at minimum, consider underline always).

**Deliverables:** Updated `/Users/ben/github/benpeter/da-schamdan/styles/styles.css` with comprehensive focus styles. Contrast ratio documentation for focus indicators.

**Dependencies:** Coordinate with ux-design-minion for focus indicator design that fits the site's visual language.

**WCAG criteria addressed:** SC 2.4.13 (AA), SC 2.4.7 (AA), SC 1.4.1 (A), SC 1.4.11 (AA)

### Task A6: Fix 404 Page `lang` Attribute (Quick Win)
**What to do:** Add `lang="de"` to the `<html>` element in 404.html. Also add `<meta charset="utf-8">` which is missing.

**Deliverables:** Updated `/Users/ben/github/benpeter/da-schamdan/404.html`.

**Dependencies:** None.

**WCAG criteria addressed:** SC 3.1.1 (A)

### Task A7: Fix Icon Alt Text for Interactive Contexts (Serious)
**What to do:** When icons are the sole content of an interactive element (link or button), they must have meaningful alt text. Update `decorateIcons()` in `aem.js` to detect when an icon span is inside an otherwise-empty link/button and set appropriate alt text (derived from the icon name or a data attribute). For the search icon in the nav tools, ensure the parent link has an accessible name.

**Deliverables:** Updated `/Users/ben/github/benpeter/da-schamdan/scripts/aem.js` with context-aware icon alt text. Audit of all icon usages across the site.

**Dependencies:** Requires inventory of all icons used and their contexts.

**WCAG criteria addressed:** SC 1.1.1 (A), SC 4.1.2 (A), SC 2.4.4 (A)

### Task A8: Color Contrast Audit (Important)
**What to do:** Run automated contrast checks on all color combinations: text color (#492000) on background (rgb 240 240 220), link color (#622a0f) on background, hero h1 text on semi-transparent overlay over images, nav text on overlay-color, button text on button background. Document all failures and provide corrected color values.

**Deliverables:** Color contrast audit report with pass/fail for each combination. Recommended color adjustments for any failures. Coordinate with ux-design-minion for approved color changes.

**Dependencies:** Need rendered pages (or screenshots) to test hero contrast over actual images.

**WCAG criteria addressed:** SC 1.4.3 (AA), SC 1.4.11 (AA)

### Task A9: Verify Heading Hierarchy Across Pages (Important)
**What to do:** Audit heading levels across all pages. The hero block extracts `h1` from content and moves it into the hero section -- verify this does not create duplicate h1 elements or skip heading levels. Verify each page has exactly one `h1`. Check heading order does not skip levels (h1 to h3 without h2).

**Deliverables:** Heading hierarchy audit per page. List of any violations with remediation guidance.

**Dependencies:** Need access to rendered pages (content from CMS).

**WCAG criteria addressed:** SC 1.3.1 (A), SC 2.4.6 (AA)

### Task A10: Add ARIA Landmarks and Verify Page Structure (Important)
**What to do:** Verify that the page uses proper landmark regions. The boilerplate has `<header>`, `<main>`, `<footer>` which is good. Verify `<nav>` element is properly nested. Check that all page content is contained within landmark regions (the `region` axe rule). Add `aria-label` to the nav element (e.g., `aria-label="Hauptnavigation"`).

**Deliverables:** Landmark audit. Updated nav element with `aria-label`. Verification that all content is within landmarks.

**Dependencies:** None.

**WCAG criteria addressed:** SC 1.3.1 (A), SC 2.4.1 (A)

### Task A11: Add Automated Accessibility Testing to CI (Enhancement)
**What to do:** Integrate axe-core into the project's test suite. Add Lighthouse CI with a minimum accessibility score threshold of 90%. Configure axe rules for WCAG 2.2 AA conformance.

**Deliverables:** Test configuration file. CI pipeline integration. Documentation of configured rules and thresholds.

**Dependencies:** Depends on test-minion's test infrastructure. Depends on iac-minion for CI pipeline.

**WCAG criteria addressed:** Ongoing regression prevention for all criteria.

### Task A12: Redundant Title Attributes on Links (Minor)
**What to do:** The `decorateButtons()` function in `aem.js` (line 426) sets `a.title = a.title || a.textContent`. This creates redundant title attributes that cause screen readers to announce the link text twice (once for the text content, once for the title). Remove the automatic title assignment or only set title when it provides additional information beyond the link text.

**Deliverables:** Updated `/Users/ben/github/benpeter/da-schamdan/scripts/aem.js` line 426.

**Dependencies:** This is in the AEM boilerplate code (`aem.js`). Modifying it may diverge from upstream. Evaluate whether to patch locally or accept the divergence.

**WCAG criteria addressed:** SC 2.4.4 (A), best practice for screen reader UX.

## Risks and Concerns

### Risk 1: AEM Boilerplate Code Modifications (HIGH)
The `aem.js` file is Adobe's boilerplate framework code. Modifications to fix accessibility issues (icon alt text in Task A7, redundant titles in Task A12) will create divergence from upstream. Future boilerplate updates may overwrite fixes. **Mitigation:** Document all boilerplate modifications. Consider wrapping fixes in `scripts.js` (the site-specific script) rather than modifying `aem.js` directly where possible.

### Risk 2: Speisen Block Refactoring Scope (MEDIUM)
Task A3 (semantic table structure for the speisen block) is a significant refactoring that changes the DOM structure. The CSS Grid layout is tightly coupled to the current `<div>` structure with named grid areas. Switching to `<table>` elements or ARIA table roles will require corresponding CSS changes. **Mitigation:** Consider using ARIA table roles on existing `<div>` elements as a lower-risk alternative to full `<table>` conversion, preserving the existing CSS Grid layout.

### Risk 3: Content-Authored Alt Text Quality (MEDIUM)
Image alt text comes from the CMS (Document Authoring). Automated tools can detect *missing* alt text but cannot evaluate *quality* of authored alt text. If content authors write poor alt text (e.g., "image1.jpg" or "photo"), the site will pass automated checks but fail manual screen reader testing. **Mitigation:** Provide content authoring guidelines for alt text. Consider adding alt text quality checks (minimum length, no file extension patterns) in CI.

### Risk 4: Hero Contrast Over Images (MEDIUM)
The hero block overlays text (h1) on a semi-transparent background (`rgb(204 204 204 / 30%)`) over photographs. Contrast will vary depending on the underlying image content. Light-colored food photographs may produce insufficient contrast. **Mitigation:** Increase overlay opacity or use a solid background behind text. Test with actual production images, not just default content.

### Risk 5: Mobile Navigation Focus Management (MEDIUM)
When the hamburger menu opens on mobile, it creates a full-viewport overlay (`min-height: 100vh`, `overflow-y: scroll`). There is no focus trap -- keyboard users can tab behind the overlay to elements hidden underneath. When the menu closes, focus is not explicitly managed (it stays wherever it was). **Mitigation:** Add focus trap when nav is expanded. Return focus to hamburger button when nav closes. This needs to be part of Task A1.

### Risk 6: JavaScript-Dependent Language Declaration (LOW)
The `lang="de-DE"` attribute is set via JavaScript in `scripts.js` line 72. If JavaScript fails to load or errors before this line, the page has no language declaration, causing screen readers to potentially mispronounce all German text. **Mitigation:** Set `lang="de"` in the HTML template served by the EDS platform rather than relying on client-side JavaScript.

### Risk 7: Testing Coverage Gaps for Dynamic Content (LOW)
The nav content is fetched asynchronously (`fetch('/nav.plain.html')`). Automated accessibility testing tools that run before the fetch completes will not test the navigation at all. Similarly, footer content is fetched asynchronously. **Mitigation:** Ensure test harness waits for all async content to load before running accessibility checks. Use axe-playwright or similar tools that can wait for network idle.

## Additional Agents Needed

**ux-design-minion** -- Required for collaboration on Tasks A5 (focus indicator design) and A8 (color contrast adjustments). Focus indicators and color changes must fit the site's warm brown/beige visual identity while meeting WCAG contrast requirements. The current color palette (`#492000` brown on `rgb(240 240 220)` beige) may need adjustment, which is a visual design decision.

**frontend-minion** -- Required for implementation of Tasks A1-A5 and A7. The accessibility-minion provides remediation guidance and code patterns, but the frontend-minion implements the actual production fixes. The speisen block refactoring (Task A3) in particular requires careful DOM restructuring while preserving the visual layout.

**test-minion** -- Required for Task A11 (CI integration). The test-minion owns test infrastructure and CI pipeline configuration. The accessibility-minion provides axe-core configuration, rule selection, and score thresholds; the test-minion integrates these into the existing test workflow.

No additional agents beyond those likely already involved in the project are needed.
