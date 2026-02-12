# Domain Plan Contribution: ux-strategy-minion

## Executive Summary

Schamdan.de is a restaurant website built on AEM Edge Delivery Services. The primary user job is: "When I'm deciding where to eat or what to order, I want to quickly find the menu, hours, and location, so I can make a dining decision with minimal effort." The code review reveals several UX strategy concerns across navigation, menu browsing, error recovery, and mobile usability -- ranging from an undefined CSS variable that breaks the mobile nav background to missing accessibility primitives and a menu grid that will collapse on narrow viewports.

---

## Recommendations

### A. Navigation Structure and Information Architecture

**1. Hamburger lacks semantic role and keyboard accessibility (Severity: Major)**

The hamburger toggle (`/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js`, lines 53-61) is a bare `<div>` with a click handler. It has:
- No `role="button"` attribute
- No `aria-label` (e.g., "Open menu" / "Close menu")
- No `tabindex="0"` for keyboard focusability
- No keyboard event handler (Enter/Space)

This means the primary mobile navigation control is invisible to screen readers and unreachable via keyboard. From a cognitive load perspective, this violates Nielsen's heuristic #7 (flexibility and efficiency) and #4 (consistency) -- interactive elements should behave like interactive elements.

**2. Undefined CSS variable breaks mobile nav sections background (Severity: Major)**

In `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.css`, line 124:
```css
background-color: var(--overlay-color);
```

The variable `--overlay-color` is never defined anywhere in the codebase. The defined variable is `--overlay-background-color` (in `styles/styles.css`, line 18). This means the mobile nav sections render with no background color (transparent fallback), which likely causes readability issues when the nav overlays page content. This is a direct violation of Nielsen's heuristic #1 (visibility of system status) -- the user cannot clearly see the navigation state.

**3. No mechanism to close mobile nav when following a link (Severity: Minor)**

The mobile nav opens as a full-screen overlay (`min-height: 100vh`, `overflow-y: scroll`). When `aria-expanded='true'`, clicking a nav link will navigate but there is no explicit close-on-navigate behavior. For single-page anchor navigation (if used), the nav would remain open after the user clicks a link. Additionally, there is no Escape key handler to dismiss the nav, and no click-outside-to-close behavior. These are standard "emergency exit" patterns (Nielsen #3: user control and freedom).

**4. Desktop dropdown navigation relies on click, not hover (Severity: Cosmetic)**

The nav sections with dropdowns (`/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js`, lines 42-49) use click-to-toggle. For restaurant sites where the nav is typically shallow (3-6 items), click-to-reveal adds an unnecessary interaction step. However, click is more accessible and mobile-friendly than hover, so this is a reasonable tradeoff. The concern is that there's no visual affordance (the CSS chevron at line 183-193 only appears at >= 1000px) telling mobile users that items have sub-navigation.

**5. Fixed nav uses `width: 100vw` which may cause horizontal scroll (Severity: Minor)**

In `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.css`, line 23:
```css
width: 100vw;
```

On devices where the scrollbar consumes layout width (some desktop browsers), `100vw` includes the scrollbar width, causing a horizontal overflow. This is a well-known CSS issue. Should be `width: 100%` for a fixed-position element, or use `overflow-x: hidden` on body.

### B. Speisen Block: Menu Browsing Usability

**6. No responsive breakpoint for the 5-column menu grid (Severity: Major)**

The speisen block (`/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.css`) defines a grid:
```css
grid-template:
  "nr name   sizes prices"
  "nr desc   sizes prices" / 2em auto auto 4em;
```

There are zero `@media` queries in `speisen.css`. On a 320px mobile viewport with 16px padding on each side (from `styles.css` line 172), the content area is ~288px. With a 22px base font size, 2em = 44px for `nr` and 4em = 88px for `prices`, leaving only ~156px for `name` + `sizes`. Menu item names, descriptions, and size labels will be severely compressed.

For a restaurant menu -- the single most important content for driving the dining decision -- this is a critical usability failure. Diners scan menus quickly; a cramped, hard-to-read grid directly undermines the primary user job.

**7. Item numbers consume space without clear user value (Severity: Minor)**

The `item-nr` column occupies 2em of every row. From a JTBD perspective, numbered menu items serve a specific job: "When I want to order by phone or at a counter, I want to reference an item number so I can communicate my choice quickly." This is valid for phone/takeout ordering. However, the numbers add visual noise for dine-in browsing. Consider whether these numbers are essential in all contexts or could be de-emphasized (smaller font, lighter color).

**8. No visual grouping or section headings pattern in the CSS (Severity: Minor)**

The speisen block handles "header rows" in JS (lines 30-57 of `speisen.js`) -- rows with empty info and bold text in the price column become `.price-header` rows. But there is no CSS styling for `.price-header` in `speisen.css`. This means section headers in the menu (e.g., "Vorspeisen", "Hauptgerichte") have no visual differentiation from regular items. Menu scanning depends heavily on clear category boundaries (Krug's visual hierarchy principle). Without distinct header styling, users must read every row to find their desired category.

**9. Description text has no max-width or overflow handling (Severity: Cosmetic)**

`.item-desc` uses `font-size: smaller` and `font-style: italic` but has no overflow protection. Long descriptions in a compressed grid could break the layout. This is a defensive design concern.

### C. 404 Page Recovery Paths

**10. 404 provides minimal recovery options (Severity: Minor)**

The 404 page (`/Users/ben/github/benpeter/da-schamdan/404.html`) offers:
- A "Go home" button (always present)
- A "Go back" button (conditionally added via JS if referrer is same-origin)

This is adequate but minimal. For a restaurant site, the highest-value recovery paths would be:
- Link to the menu (the #1 reason people visit restaurant sites)
- Link to contact/hours/location (the #2 reason)

The current implementation satisfices (users can get to home, then navigate) but adds one unnecessary click for the most common user jobs. The SVG "404" text is a nice touch visually but consumes most of the viewport without providing informational value.

**11. 404 page loads full scripts.js machinery unnecessarily (Severity: Cosmetic)**

The 404 page loads `scripts.js` which runs the full EDS decoration pipeline. For an error page, this is unnecessary overhead. The header/footer load, but the main content is static HTML. This is primarily a performance concern but has UX implications: slow 404 pages compound user frustration (they're already lost; making them wait adds insult).

### D. Mobile Usability

**12. Desktop breakpoint at 1000px leaves a gap (Severity: Minor)**

The header transitions from hamburger to full nav at `width >= 1000px` (header.css line 170). But `styles.css` has breakpoints at 600px and 900px. The 900px-999px range uses desktop content sizing (larger headings, wider sections) but still shows the mobile hamburger nav. This creates an inconsistent experience: content says "desktop" but navigation says "mobile." Users on tablets in landscape orientation are particularly affected.

**13. Mobile nav overlay scrolls but has no visual scroll indicator (Severity: Cosmetic)**

When expanded, the mobile nav uses `overflow-y: scroll` (header.css line 36). If the nav content is longer than the viewport, users must discover scrollability by trying to scroll. There's no visual indicator (scroll shadow, fade, etc.) that more content exists below. This violates the visibility principle.

**14. Touch targets not explicitly sized (Severity: Minor)**

The hamburger icon area is 50px wide (from the grid column) by `var(--nav-height)` (64px) tall, which meets the 48x48px minimum recommended by Google's mobile guidelines. However, the nav section list items (`header.css` line 135-138) have no explicit padding or min-height. At `font-size: 20px` with default line-height, tap targets may be adequate but are not guaranteed. Apple's HIG recommends 44pt minimum; WCAG 2.5.8 requires 24x24px with sufficient spacing.

**15. Body scroll lock uses `overflow-y: hidden` without scroll position preservation (Severity: Cosmetic)**

When the mobile nav opens (`body.nav-open { overflow-y: hidden }` in header.css line 4), the page scroll position may shift on some browsers. When the nav closes, the user should return to their previous scroll position. This is not explicitly handled in the JS. Modern approach: use `position: fixed` with stored `scrollY` value.

---

## Proposed Tasks

### Task 1: Fix undefined `--overlay-color` CSS variable
- **What**: Replace `var(--overlay-color)` with `var(--overlay-background-color)` in header.css line 124, or define `--overlay-color` in `:root`
- **Deliverables**: Corrected CSS, visual verification that mobile nav has proper background
- **Dependencies**: None. Quick bug fix.
- **Priority**: P1 -- this is a functional bug breaking mobile nav readability

### Task 2: Add accessibility primitives to hamburger toggle
- **What**: Add `role="button"`, `aria-label="Open menu"` (toggling to "Close menu"), `tabindex="0"`, and keyboard event handling (Enter/Space) to the hamburger div in header.js
- **Deliverables**: Updated header.js with semantic attributes and keyboard support
- **Dependencies**: None
- **Priority**: P1 -- primary mobile navigation is inaccessible

### Task 3: Add responsive breakpoint to speisen block
- **What**: Design and implement a mobile-friendly layout for the menu grid. At narrow viewports, consider stacking (item name on one line, description below, price right-aligned) or reducing the 5-column grid to a simpler layout. Ensure readability at 320px.
- **Deliverables**: Updated speisen.css with `@media` query for narrow viewports. UX recommendation for the target layout.
- **Dependencies**: Needs UX design input on the desired mobile menu layout pattern. Should validate against actual menu content (item name lengths, description lengths, number of size variants).
- **Priority**: P1 -- the menu is the restaurant's core content and currently unusable on small phones

### Task 4: Add CSS styling for `.price-header` rows in speisen block
- **What**: Create visual differentiation for menu category headers. Recommendations: larger/bolder text, top margin for breathing room, optional bottom border as a separator.
- **Deliverables**: Updated speisen.css with `.price-header` styles
- **Dependencies**: Task 3 (should be designed together with the responsive layout)
- **Priority**: P2 -- menu scannability improvement

### Task 5: Enhance 404 page with restaurant-specific recovery paths
- **What**: Add direct links to the menu page and contact/hours page below the "Go home" button. Consider reducing the SVG 404 visual to make room for helpful content.
- **Deliverables**: Updated 404.html with additional navigation links
- **Dependencies**: Need to know the actual URL paths for the menu and contact pages
- **Priority**: P3 -- nice improvement, but 404 pages are infrequently encountered

### Task 6: Add mobile nav dismiss behaviors
- **What**: Implement Escape key to close nav, click-outside-to-close, and close-on-navigate for anchor links. Preserve scroll position when toggling body scroll lock.
- **Deliverables**: Updated header.js with event handlers
- **Dependencies**: Task 2 (accessibility work on the hamburger should be done first or together)
- **Priority**: P2 -- user control and freedom improvement

### Task 7: Align breakpoints across header and content
- **What**: Audit the 600px / 900px / 1000px breakpoint inconsistency. Either move the header desktop breakpoint to 900px to match content, or document the intentional gap. Evaluate tablet experience.
- **Deliverables**: Breakpoint alignment recommendation with rationale. Potentially updated CSS.
- **Dependencies**: Needs testing on actual tablet devices or emulators
- **Priority**: P3 -- affects a narrow device range

### Task 8: Fix `width: 100vw` horizontal scroll issue on fixed nav
- **What**: Replace `width: 100vw` with `width: 100%` on the fixed `header nav` element
- **Deliverables**: One-line CSS fix
- **Dependencies**: None
- **Priority**: P3 -- only affects browsers with layout-consuming scrollbars

---

## Risks and Concerns

### Risk 1: No access to live content for validation
The speisen block analysis is based on code structure alone. Without seeing actual menu content (real item names, descriptions, number of items per category, number of size variants), the severity assessment of the responsive layout issue is estimated. The grid could be "fine" with short German menu item names, or it could be catastrophic with longer ones. **Mitigation**: Test with representative real content at multiple viewport widths.

### Risk 2: Nav content is fetched dynamically
The navigation structure comes from `/nav.plain.html`, which is authored content. The test fixture (`/Users/ben/github/benpeter/da-schamdan/test/blocks/header/nav.plain.html`) still has boilerplate links (hlx.live, Adobe references). The actual production nav content may differ significantly. **Mitigation**: Review the actual authored nav content in Document Authoring to evaluate the real information architecture.

### Risk 3: Speisen responsive redesign scope creep
Redesigning the menu layout for mobile is the highest-impact task but also the most complex. The current 5-column grid with the JS transformation logic is tightly coupled. A responsive redesign may require changes to both CSS and JS. **Mitigation**: Start with CSS-only changes (grid restructuring at breakpoints) before considering JS changes.

### Risk 4: Boilerplate code debt
The header.js and much of the CSS appear to be standard AEM EDS boilerplate with minimal customization. Improvements need to be weighed against the cost of diverging from the boilerplate -- future boilerplate updates become harder to merge. **Mitigation**: Document which changes are custom versus boilerplate divergences.

### Risk 5: Font loading strategy affects mobile perceived performance
`scripts.js` line 85 defers font loading on mobile (`window.innerWidth >= 900`), which means mobile users see system Palatino/Times first. If the web fonts differ significantly, this creates a layout shift. While not a UX strategy issue per se, it affects the perception of polish. **Mitigation**: Verify that the font stack (Palatino, Times, Times New Roman) is close enough to any web font being loaded that the shift is imperceptible.

---

## Additional Agents Needed

### Accessibility Specialist
The findings in this review surface multiple accessibility gaps (missing ARIA roles, keyboard navigation, touch target sizing, focus management) but a comprehensive accessibility audit is beyond UX strategy scope. An accessibility specialist should:
- Perform a full WCAG 2.2 AA audit across all blocks
- Evaluate focus order, color contrast ratios (the warm brown palette `#622a0f` on `rgb(240 240 220)` needs contrast verification), and screen reader announcements
- Test with actual assistive technology

### Performance/Frontend Specialist
Several findings have performance implications (404 page loading full JS pipeline, font loading strategy, `100vw` scroll issue). A frontend specialist should evaluate:
- Core Web Vitals impact of the current loading strategy
- Whether the speisen block's DOM manipulation in JS causes layout shifts
- The overall CSS specificity and selector efficiency

The current team composition appears otherwise sufficient, provided the code review specialist covers the general code quality, maintainability, and EDS-specific best practices.
