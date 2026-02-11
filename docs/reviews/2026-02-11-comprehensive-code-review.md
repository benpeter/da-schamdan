# Comprehensive Code Review: schamdan.de

| Attribute       | Value                                      |
|-----------------|--------------------------------------------|
| Review Date     | 2026-02-11                                 |
| Codebase Snapshot | `929bb9120b1d7e2f1313e3f53d16db4babdb042b` |

---

## Executive Summary

### Finding Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 12 |
| Medium | 19 |
| Low | 25 |
| **Total** | **59** |

4 additional informational/positive findings (SEC-03, SEC-05, SEC-06, SEO-07) are documented in their category sections but excluded from the backlog.

### Top 3 Priority Areas

1. **Accessibility -- header navigation (A11Y-01, A11Y-02, A11Y-04, A11Y-05)**: All three Critical findings are accessibility issues in the header. The hamburger menu and dropdown sections are invisible to screen readers and inoperable via keyboard, violating WCAG Level A requirements. These are quick fixes (S effort) that unblock basic assistive technology access.

2. **Speisen block quality (A11Y-03, TEST-02, UX-02, UX-03)**: The custom menu block concentrates findings across 5 review categories. It lacks ARIA table semantics (Critical), has zero test coverage (High), no responsive breakpoints (High), and missing CSS styling for header rows (Medium). As the most complex custom code and the highest-value content for a restaurant website, this block should be the primary focus for custom code improvements.

3. **Performance critical path (PERF-01, UX-01)**: The unconditional `dapreview.js` import delays rendering for every visitor to benefit zero production users. The undefined `--overlay-color` variable leaves the mobile nav background transparent. Both are High severity, S effort fixes with immediate visible impact.

### Overall Assessment

The schamdan.de codebase is a lean AEM Edge Delivery Services site with zero runtime dependencies and clean linting baselines. The EDS boilerplate provides a solid foundation, and the site correctly leverages the platform's CDN-served content model. However, the project inherits accessibility gaps from the unmodified boilerplate header code, and the custom speisen block -- the site's most important feature -- was built without responsive design, semantic markup, or test coverage. The 3 Critical and 12 High findings are concentrated in accessibility and the speisen block, both addressable with moderate effort. The remaining Medium and Low findings represent standard technical debt for a site at this maturity level.

**Recommended next step**: Fix the 3 Critical accessibility findings first (all S effort, approximately 2-3 hours total), then address the speisen block's ARIA semantics and responsive layout.

---

## Severity Definitions

| Severity | Description | Backlog Priority |
|----------|-------------|------------------|
| Critical | Must fix -- security vulnerabilities, broken functionality, accessibility barriers blocking users. | P0 |
| High     | Should fix soon -- performance regressions, significant quality gaps, accumulating tech debt. | P1 |
| Medium   | Should fix -- best practice violations, maintainability concerns, moderate risk. | P2 |
| Low      | Consider fixing -- suggestions, minor improvements, polish. | P3 |

## Effort Definitions

| Effort | Time Estimate |
|--------|---------------|
| S      | < 1 hour      |
| M      | 1-4 hours     |
| L      | 4-16 hours    |
| XL     | > 16 hours    |

---

## Methodology

### Scope

All website source code (HTML, CSS, JS, templates, configuration, CI/CD). Excludes content accuracy and third-party service configurations.

### Tools

- ESLint (airbnb-base)
- Stylelint (standard)
- Manual code review
- Static analysis

### Baseline

- ESLint passes clean (0 violations).
- Stylelint passes clean (0 violations).
- Test suite: 13 tests, all passing, 77.13% overall coverage.

### Boilerplate Policy

Unmodified AEM boilerplate files are reviewed but labeled as boilerplate in findings. Modifications to boilerplate files are reviewed as custom code.

### Exclusions

- `scripts/aem.js` internals (AEM SDK, not project-owned code)
- `.skills/` and `.agents/` directories (tooling configuration, not website code)
- DA content (authored content, not source code)

### Finding Format

Each finding follows this template:

```
#### [ID] Short descriptive title

| Attribute | Value |
|-----------|-------|
| Severity | Critical / High / Medium / Low |
| Category | Code Quality / Performance / etc. |
| Files | `path/to/file.js:line` |
| Effort | S / M / L / XL |

**Problem**: One paragraph describing what is wrong and why it matters.

**Evidence**: Code snippet or reference showing the issue.

**Recommendation**: Specific, actionable fix.
```

---

## Findings by Category

### Code Quality (CODE)

#### CODE-01 eslint-disable audit: eight suppressions in project-owned files

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Code Quality |
| Files | `scripts/scripts.js:20,48,57,73,119`, `scripts/delayed.js:1`, `scripts/dapreview.js:2`, `blocks/fragment/fragment.js:7` |
| Effort | S |

**Problem**: There are 8 `eslint-disable` comments across 4 project-owned files (excluding `aem.js` which is AEM SDK code). While most are justified in the EDS boilerplate context, one is unnecessary, and none are documented for future contributors.

**Evidence**:
- `scripts/scripts.js:20` -- `no-bitwise`: Required for `compareDocumentPosition()` bitmask. Valid.
- `scripts/scripts.js:48` -- `no-console`: `console.error` in auto-blocking catch. Valid for error reporting.
- `scripts/scripts.js:57` -- `import/prefer-default-export`: `decorateMain` is a named export consumed by `fragment.js`. Valid.
- `scripts/scripts.js:73` -- `no-await-in-loop`: This `await` (line 74) is **not inside a loop**. The suppression is unnecessary dead configuration.
- `scripts/scripts.js:119` -- `import/no-cycle`: Circular dependency between `scripts.js` and `delayed.js`. Valid (EDS pattern).
- `scripts/delayed.js:1` -- `import/no-cycle`: Counterpart of the above. Valid.
- `scripts/dapreview.js:2` -- `import/no-unresolved`: External CDN import (`da.live`). Valid.
- `blocks/fragment/fragment.js:7` -- `import/no-cycle`: Fragment imports `decorateMain` from `scripts.js`. Valid (EDS pattern).

Note: All files except `speisen.js` and `dapreview.js` are AEM boilerplate code.

**Recommendation**: Remove the unnecessary `no-await-in-loop` suppression at `scripts/scripts.js:73`. The remaining suppressions are valid. Consider adding a brief inline comment next to the `import/no-cycle` suppressions explaining the EDS circular loading pattern for future contributors.

---

#### CODE-02 Silent catch blocks swallow errors without logging

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Code Quality |
| Files | `scripts/scripts.js:33-37`, `scripts/scripts.js:84-90` |
| Effort | S |

**Problem**: Two `try/catch` blocks in `scripts.js` catch exceptions and do nothing (`// do nothing`). The first guards `sessionStorage.setItem` in `loadFonts()`, the second guards `sessionStorage.getItem` and `loadFonts()` in `loadEager()`. While `sessionStorage` access can throw in private browsing mode, silently swallowing all errors makes debugging difficult. A thrown error inside `loadFonts()` (line 86) would also be silently lost.

**Evidence**:
```js
// scripts/scripts.js:33-37
try {
  if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
} catch (e) {
  // do nothing
}

// scripts/scripts.js:84-90
try {
  if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
    loadFonts();
  }
} catch (e) {
  // do nothing
}
```

Note: This is AEM boilerplate code.

**Recommendation**: At minimum, add `console.debug` in these catch blocks so errors are visible during development but do not disrupt production. Better yet, narrow the try/catch to only the `sessionStorage` calls and let `loadFonts()` errors propagate normally.

---

#### CODE-03 innerHTML from fetch responses (trusted content injection)

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Code Quality |
| Files | `blocks/header/header.js:31`, `blocks/footer/footer.js:17`, `blocks/fragment/fragment.js:26`, `blocks/cards/cards.js:8` |
| Effort | M |

**Problem**: Four blocks set `innerHTML` from `fetch()` responses. In the EDS architecture, these responses come from the same-origin AEM content delivery pipeline (`.plain.html` fragments), so the XSS risk is low in practice. However, `innerHTML` bypasses any sanitization and would become a vulnerability if the content source ever changed to accept user-generated content.

**Evidence**:
```js
// blocks/header/header.js:31
nav.innerHTML = html;

// blocks/footer/footer.js:17
footer.innerHTML = html;

// blocks/fragment/fragment.js:26
main.innerHTML = await resp.text();

// blocks/cards/cards.js:8
li.innerHTML = row.innerHTML;
```

Note: header.js, footer.js, fragment.js, and cards.js are AEM boilerplate code.

**Recommendation**: This is an accepted EDS pattern since the content is author-controlled. No immediate action required. If the content model ever changes to accept third-party input, introduce a sanitization step (e.g., DOMPurify or the Sanitizer API).

---

#### CODE-04 speisen.js innerHTML with regex-extracted content

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Code Quality |
| Files | `blocks/speisen/speisen.js:80-81` |
| Effort | S |

**Problem**: The `splitPrices()` function builds HTML strings from regex capture groups and assigns them via `innerHTML`. The source data comes from author-controlled AEM content (menu item labels and prices), not user input. However, the regex capture group `m[1]` (the label portion, e.g., "0,3l") is injected into HTML without escaping. If a label ever contained characters like `<` or `&`, it would be interpreted as HTML.

**Evidence**:
```js
// blocks/speisen/speisen.js:80-81
sizesEl.innerHTML = matches.map((m) => `<p>${m[1]}</p>`).join('');
pricesEl.innerHTML = matches.map((m) => `<p>${m[2]}</p>`).join('');
```

**Recommendation**: Use `textContent` with DOM creation instead of string interpolation into `innerHTML`:
```js
matches.forEach((m) => {
  const sp = document.createElement('p');
  sp.textContent = m[1];
  sizesEl.append(sp);
  const pp = document.createElement('p');
  pp.textContent = m[2];
  pricesEl.append(pp);
});
```

---

#### CODE-05 Inconsistent error handling across blocks

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Code Quality |
| Files | `blocks/header/header.js`, `blocks/footer/footer.js`, `blocks/fragment/fragment.js`, `blocks/speisen/speisen.js`, `blocks/cards/cards.js`, `blocks/columns/columns.js` |
| Effort | M |

**Problem**: Error handling is inconsistent across blocks. `scripts.js` wraps `buildAutoBlocks` in a try/catch, but none of the block `decorate()` functions have any error handling. If `header.js` or `footer.js` fetch calls fail (network error, not just non-200 response), the entire block decoration throws an unhandled rejection. The `resp.ok` check only handles HTTP error codes, not network failures or CORS errors.

**Evidence**:
- `header.js:25`: `fetch()` can throw on network error; no try/catch.
- `footer.js:13`: Same pattern.
- `fragment.js:23`: Same pattern.
- `columns.js:2`: Assumes `block.firstElementChild` is non-null with no guard.

Note: header.js, footer.js, fragment.js, cards.js, and columns.js are AEM boilerplate code.

**Recommendation**: The AEM block loading framework (`aem.js`) wraps block decoration in a try/catch at the framework level (`aem.js:576-583`), so unhandled exceptions in block decorate functions are caught and logged. This mitigates the risk. For the custom `speisen.js` block, consider adding a guard at the top: `if (!block.children.length) return;` to handle empty blocks gracefully.

---

#### CODE-06 CSS class naming follows different conventions across blocks

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Code Quality |
| Files | `blocks/speisen/speisen.css`, `blocks/cards/cards.css`, `blocks/header/header.css` |
| Effort | S |

**Problem**: CSS class naming follows different conventions across blocks. The speisen block uses `item-nr`, `item-info`, `item-desc`, `item-sizes`, `item-prices` (component-prefix pattern). The cards block uses `cards-card-image`, `cards-card-body` (block-element pattern). The header uses `nav-brand`, `nav-sections`, `nav-tools`, `nav-hamburger` (component-prefix pattern). While each block is internally consistent, there is no project-wide convention.

**Evidence**:
- speisen: `item-nr`, `item-info`, `item-desc`, `item-sizes`, `item-prices`
- cards: `cards-card-image`, `cards-card-body`
- header: `nav-brand`, `nav-sections`, `nav-tools`, `nav-hamburger`, `nav-hamburger-icon`

Note: cards.js and header.js are AEM boilerplate code. speisen.js is custom code.

**Recommendation**: Cosmetic and low priority. The EDS block scoping model (each block's CSS is scoped by the block class name in the parent) means collision risk is minimal. No action required unless the project adopts a formal CSS naming convention.

---

#### CODE-07 Magic number 900 used as breakpoint in JavaScript

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Code Quality |
| Files | `scripts/scripts.js:85` |
| Effort | S |

**Problem**: The number `900` is hardcoded in `scripts.js` as a viewport width threshold for font loading. This value corresponds to the 900px breakpoint used in `styles.css` but is not derived from a shared source. If the breakpoint changes in CSS, the JavaScript threshold would need to be updated independently.

**Evidence**:
```js
// scripts/scripts.js:85
if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
```

Note: This is AEM boilerplate code.

**Recommendation**: Low-risk since the 900px breakpoint is an EDS convention unlikely to change. For documentation, add a comment: `// matches @media (width >= 900px) breakpoint in styles.css`.

### Maintainability (MAINT)

#### MAINT-01 ESLint 8.x is end-of-life

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | Maintainability |
| Files | `package.json:30` |
| Effort | L |

**Problem**: The project uses ESLint 8.57.1, which reached end-of-life on 2024-10-05. ESLint 8.x no longer receives bug fixes, security patches, or compatibility updates. Additionally, `@babel/eslint-parser` is unnecessary for this project since all code uses standard ES module syntax that ESLint's default parser handles natively.

**Evidence**:
```json
"eslint": "8.57.1",
"eslint-config-airbnb-base": "15.0.0",
"eslint-plugin-import": "2.32.0",
"@babel/eslint-parser": "7.28.6",
```

**Recommendation**: Migrate to ESLint 9.x with the new flat config format (`eslint.config.js`). This requires: (1) Replace `.eslintrc.js` with `eslint.config.js` using flat config syntax. (2) Replace `eslint-config-airbnb-base` with `@stylistic/eslint-plugin` or equivalent (airbnb-base has limited ESLint 9 support). (3) Remove `@babel/eslint-parser` (unnecessary for ES module syntax). (4) Update `eslint-plugin-import` to a version supporting ESLint 9 or switch to `eslint-plugin-import-x`. (5) Update CI workflow to verify the migration.

---

#### MAINT-02 Breakpoint inconsistency: header uses 1000px, rest uses 900px

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Maintainability |
| Files | `blocks/header/header.css:170`, `styles/styles.css:212,218`, `blocks/columns/columns.css:10` |
| Effort | S |

**Problem**: The header block switches to desktop layout at 1000px while all other components switch at 900px. This creates a 100px window (900-999px) where the page layout is desktop but the navigation is still in mobile hamburger mode.

**Evidence**:
All breakpoints in the codebase:
- `styles/styles.css:212`: `@media (width >= 600px)` -- section padding adjustment
- `styles/styles.css:218`: `@media (width >= 900px)` -- heading size scale-up, max-width constraint
- `blocks/columns/columns.css:10`: `@media (width >= 900px)` -- horizontal column layout
- `blocks/header/header.css:170`: `@media (width >= 1000px)` -- desktop navigation

Note: header.css is AEM boilerplate code.

**Recommendation**: Change the header breakpoint from 1000px to 900px to match the rest of the site. Verify the navigation layout works at 900px viewport width. If the navigation genuinely needs more space, document why 1000px is intentional.

---

#### MAINT-03 Dead code: empty fonts.css and lazy-styles.css with active loadFonts()

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Maintainability |
| Files | `styles/fonts.css`, `styles/lazy-styles.css`, `scripts/scripts.js:31-38,86,110` |
| Effort | S |

**Problem**: Both `fonts.css` and `lazy-styles.css` contain only placeholder comments and no actual CSS rules. The `loadFonts()` function in `scripts.js` fetches `fonts.css` and sets a sessionStorage flag, but the file is empty -- the font stack relies on system fonts (`Palatino`, `Times`, `Times New Roman`) declared in `styles.css:23`. This means `loadFonts()` makes unnecessary network requests and the sessionStorage logic serves no purpose.

**Evidence**:
```css
/* styles/fonts.css -- entire file */
/* load fonts */

/* styles/lazy-styles.css -- entire file */
/* below the fold CSS goes here */
```

`loadFonts()` is called twice: once in `loadEager()` (line 86, conditionally) and once in `loadLazy()` (line 110, unconditionally).

Note: These are AEM boilerplate placeholder files.

**Recommendation**: Two options: (1) If custom web fonts will be added later, keep the files as placeholders but add a comment in `loadFonts()` explaining they are intentionally empty. (2) If the site will continue using system fonts, remove the `loadFonts()` function, its two call sites, and the empty `fonts.css`. Keep `lazy-styles.css` as an EDS convention placeholder.

---

#### MAINT-04 loadFonts() called twice: eager and lazy phases

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Maintainability |
| Files | `scripts/scripts.js:86,110` |
| Effort | S |

**Problem**: `loadFonts()` is called in both `loadEager()` (line 86, conditionally on viewport width or sessionStorage) and `loadLazy()` (line 110, unconditionally). Even if `fonts.css` had content, the duplicate call in `loadLazy` would be redundant on desktop since `loadEager` already loaded it.

**Evidence**:
```js
// loadEager (line 84-90) -- conditional
if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
  loadFonts();
}

// loadLazy (line 110) -- unconditional
loadFonts();
```

Note: This is AEM boilerplate code. The `loadCSS` function in `aem.js` already de-duplicates by checking for existing `<link>` elements, so the double call is not harmful -- just unnecessary dead code.

**Recommendation**: Since `fonts.css` is empty and the site uses system fonts, remove both `loadFonts()` calls and the function itself. If web fonts are added later, restore the EDS pattern.

---

#### MAINT-05 EDS boilerplate drift inventory

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Maintainability |
| Files | Multiple |
| Effort | S |

**Problem**: There is no documented inventory of which files are unmodified EDS boilerplate vs. project-customized. Without this, future EDS SDK upgrades risk overwriting customizations or missing improvements.

**Evidence**:

**Unmodified boilerplate** (safe to overwrite on EDS upgrade):
- `blocks/cards/cards.js`, `blocks/cards/cards.css`
- `blocks/columns/columns.js`, `blocks/columns/columns.css`
- `blocks/fragment/fragment.js`
- `blocks/hero/hero.css`
- `styles/fonts.css`, `styles/lazy-styles.css`
- `404.html`

**Lightly customized boilerplate** (merge carefully):
- `scripts/scripts.js` -- `document.documentElement.lang = 'de-DE'` (line 72), DA preview import (lines 73-75)
- `blocks/header/header.js`, `blocks/header/header.css` -- Unchanged JS logic, CSS may have minor styling tweaks
- `blocks/footer/footer.js`, `blocks/footer/footer.css` -- Unchanged JS, CSS has site-specific styling
- `head.html` -- Standard EDS head
- `.eslintrc.js` -- Standard EDS lint config
- `scripts/delayed.js` -- Custom external link handling added (lines 9-19)

**Custom (project-specific)**:
- `blocks/speisen/speisen.js`, `blocks/speisen/speisen.css` -- Entirely custom menu block
- `scripts/dapreview.js` -- DA preview integration
- `styles/styles.css` -- Custom color palette, typography, layout (lines 13-42)

**Recommendation**: Add a `# Boilerplate Status` section to the project README or a dedicated `BOILERPLATE.md` documenting which files are boilerplate vs. customized, and the EDS boilerplate version they were forked from. This enables safe future upgrades.

---

#### MAINT-06 CSS custom properties incomplete: hardcoded max-width and spacing values

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Maintainability |
| Files | `blocks/speisen/speisen.css:8,34`, `blocks/hero/hero.css:13-15,19`, `blocks/header/header.css:8`, `blocks/footer/footer.css:8`, `styles/styles.css:147` |
| Effort | S |

**Problem**: The `:root` custom properties in `styles.css` define colors, fonts, and heading sizes, but several layout values are hardcoded across multiple files. The `max-width: 900px` value appears in four separate files. Spacing values in `speisen.css` are hardcoded rather than using a shared scale.

**Evidence**:
- `max-width: 900px` repeated in: `styles/styles.css:147`, `blocks/hero/hero.css:19`, `blocks/footer/footer.css:8`, `blocks/header/header.css:8`
- `blocks/speisen/speisen.css:8`: `margin-bottom: 8px` (hardcoded spacing)
- `blocks/speisen/speisen.css:34`: `padding-left: 8px` (hardcoded spacing)
- `blocks/hero/hero.css:15`: `margin-top: 80px` (hardcoded, likely related to `--nav-height: 64px` plus padding)
- `blocks/hero/hero.css:14`: `min-height: 300px` (hardcoded)

**Recommendation**: Extract `max-width: 900px` into a custom property `--content-max-width: 900px` in `:root` and reference it across all files. For the speisen block spacing, the values are small and scoped -- custom properties are optional but would improve consistency if a design token system is adopted.

---

#### MAINT-07 CI/CD workflow only triggers on pull_request

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Maintainability |
| Files | `.github/workflows/run-tests.yaml` |
| Effort | S |

**Problem**: The GitHub Actions workflow runs `npm run lint` and `npm test` on pull requests only, not on pushes to `main`. Code merged directly to `main` (including admin merges or direct pushes) bypasses CI entirely.

**Evidence**:
```yaml
name: Tests and Linting
on: [pull_request]
```

**Recommendation**: Add `push` trigger for the `main` branch: `on: { pull_request: {}, push: { branches: [main] } }`. Consider enabling branch protection rules requiring the CI check to pass before merging.

---

#### MAINT-08 Outdated testing dependencies: sinon 14.x and chai 4.x

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Maintainability |
| Files | `package.json:26-29` |
| Effort | M |

**Problem**: Several testing dependencies are significantly outdated. `sinon` is at 14.0.1 (current major: 19.x), and `chai` at 4.3.6 with the `@esm-bundle/chai` wrapper at 4.3.4-fix.0. Chai 5.x has been available since early 2024 with native ESM support, which would eliminate the need for the `@esm-bundle/chai` wrapper.

**Evidence**:
```json
"@esm-bundle/chai": "4.3.4-fix.0",
"chai": "4.3.6",
"sinon": "14.0.1",
```

**Recommendation**: Update `sinon` to the latest 19.x and evaluate migrating from `chai` 4.x + `@esm-bundle/chai` to `chai` 5.x with native ESM. This is a test-only change with no production impact, but the `@esm-bundle/chai` wrapper may have compatibility constraints with `@web/test-runner`. Test thoroughly after upgrading.

---

#### MAINT-09 No CODEOWNERS file or branch protection

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Maintainability |
| Files | `.github/` |
| Effort | S |

**Problem**: The repository has no `CODEOWNERS` file and no documented branch protection rules. For a single-contributor project this is acceptable, but the lack of required reviewers for critical files (e.g., `scripts/scripts.js`, CI configuration) increases risk as contributors are added.

**Evidence**: No `.github/CODEOWNERS` file exists. The CI workflow only triggers on `pull_request`, and there is no evidence of branch protection rules.

**Recommendation**: Low priority for a single-contributor project. When additional contributors are added, create a `.github/CODEOWNERS` file and enable branch protection on `main` requiring at least one approval and passing CI checks.

### Performance (PERF)

#### PERF-01 dapreview.js imported unconditionally on the critical path

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | Performance |
| Files | `scripts/scripts.js:74-75` |
| Effort | S |

**Problem**: `loadEager()` unconditionally executes `await import('./dapreview.js')` before any rendering begins. Every visitor -- not just DA preview users -- pays the cost of importing and evaluating this module. The dynamic `import()` inside `dapreview.js` (line 3) is itself conditional on the `?dapreview` query parameter, but the outer import in `scripts.js` is not. This adds an unnecessary network request and JavaScript evaluation to the critical rendering path, delaying LCP for all visitors.

**Evidence**:
```js
// scripts/scripts.js:74-75
const daPreview = (await import(`${import.meta.url.replace('scripts.js', 'dapreview.js')}`)).default;
if (daPreview) await daPreview;
```
The `await import(...)` call runs before `decorateTemplateAndTheme()`, `decorateMain()`, and `document.body.classList.add('appear')`. This means the browser cannot begin rendering until `dapreview.js` has been fetched, parsed, and executed.

**Recommendation**: Guard the import with a query parameter check so non-preview visitors skip it entirely:
```js
if (new URLSearchParams(window.location.search).has('dapreview')) {
  const { default: daPreview } = await import('./dapreview.js');
  if (daPreview) await daPreview;
}
```
This removes the module from the critical path for all production visitors (100% of real users).

---

#### PERF-02 Empty CSS files fetched on every page load

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Performance |
| Files | `styles/fonts.css:1`, `styles/lazy-styles.css:1`, `scripts/scripts.js:32`, `scripts/scripts.js:109` |
| Effort | S |

**Problem**: Both `fonts.css` (contains only a comment `/* load fonts */`) and `lazy-styles.css` (contains only `/* below the fold CSS goes here */`) are fetched on every page load despite containing no useful declarations. Each file triggers an HTTP request (DNS lookup if not cached, TCP connection, TLS negotiation on first visit) with zero benefit. `fonts.css` is loaded in `loadEager()` (line 85-87) on desktop or when `sessionStorage` has the fonts-loaded flag, and again in `loadLazy()` (line 110). `lazy-styles.css` is loaded in `loadLazy()` (line 109).

**Evidence**:
```css
/* styles/fonts.css — entire file: */
/* load fonts */
```
```css
/* styles/lazy-styles.css — entire file: */
/* below the fold CSS goes here */
```

**Recommendation**: Either populate these files with actual content (e.g., `@font-face` declarations in `fonts.css` if web fonts are needed, below-fold styles in `lazy-styles.css`) or remove the `loadCSS()` calls from `scripts.js` until they contain real declarations. Removing two wasted HTTP requests improves FCP and reduces overall page load time. Note: These are AEM EDS boilerplate placeholder files. If no custom web fonts or lazy styles are needed, the safest approach is to remove the `loadCSS()` calls rather than deleting the files (to avoid confusion with the boilerplate convention).

---

#### PERF-03 Hero LCP image missing fetchpriority="high"

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Performance |
| Files | `scripts/aem.js:654-665` (upstream boilerplate) |
| Effort | S |

**Problem**: The `waitForFirstImage()` function in `aem.js` sets `loading="eager"` on the LCP candidate image but does not set `fetchpriority="high"`. Without `fetchpriority="high"`, the browser may still deprioritize the hero image fetch behind other resources (stylesheets, scripts) even though it has `loading="eager"`. This is a significant LCP optimization opportunity -- Chrome and other browsers use `fetchpriority` to boost the image in the network priority queue, which can improve LCP by 100-400ms depending on network conditions.

**Evidence**:
```js
// scripts/aem.js:654-665
async function waitForFirstImage(section) {
  const lcpCandidate = section.querySelector('img');
  await new Promise((resolve) => {
    if (lcpCandidate && !lcpCandidate.complete) {
      lcpCandidate.setAttribute('loading', 'eager');
      // Missing: lcpCandidate.setAttribute('fetchpriority', 'high');
      lcpCandidate.addEventListener('load', resolve);
      lcpCandidate.addEventListener('error', resolve);
    } else {
      resolve();
    }
  });
}
```

**Recommendation**: This involves `aem.js` (upstream boilerplate). Consider adding `fetchpriority="high"` in block-specific code. In `scripts.js`, after `waitForFirstImage` resolves, or by overriding the LCP image handling in the hero block decorator. Alternatively, add `fetchpriority="high"` directly in the hero block's `decorate()` function:
```js
const heroImg = block.querySelector('img');
if (heroImg) heroImg.fetchPriority = 'high';
```

---

#### PERF-04 Hero margin-top vs --nav-height mismatch causes layout gap

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Performance |
| Files | `blocks/hero/hero.css:15`, `styles/styles.css:41` |
| Effort | S |

**Problem**: The hero block uses `margin-top: 80px` (hero.css line 15) to account for the fixed navigation bar, but `--nav-height` is defined as `64px` (styles.css line 41). This 16px discrepancy creates an unnecessary visual gap between the nav and hero. More importantly from a performance perspective, the hero image is pushed 16px further down the viewport, which can delay when the browser considers it as the LCP element and triggers the LCP paint. Any additional space above the LCP element increases the risk of it being partially or fully below the initial viewport on smaller screens, degrading the LCP measurement.

**Evidence**:
```css
/* blocks/hero/hero.css:15 */
main .hero {
    margin-top: 80px;
}

/* styles/styles.css:41 */
:root {
    --nav-height: 64px;
}
```

**Recommendation**: Replace the hardcoded `80px` with `var(--nav-height)` to keep the hero block consistent with the navigation height. If intentional padding is desired below the nav, use `calc(var(--nav-height) + 16px)` and add a comment explaining the extra spacing.

---

#### PERF-05 No AVIF format in createOptimizedPicture

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Performance |
| Files | `scripts/aem.js:315-361` (upstream boilerplate) |
| Effort | M |

**Problem**: The `createOptimizedPicture()` function generates `<source>` elements for WebP and falls back to the original format, but does not include AVIF sources. AVIF offers ~50% better compression than JPEG and ~20% better than WebP at equivalent quality. All modern browsers (Chrome, Firefox, Safari 16+, Edge) support AVIF as of 2024. For a restaurant website where hero images and food photography are central, AVIF could significantly reduce image payload and improve LCP.

**Evidence**:
```js
// scripts/aem.js:326-336 — only WebP sources generated
breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset',
      `${origin}${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
});
```

**Recommendation**: This involves `aem.js` (upstream boilerplate). The AEM image optimization CDN supports AVIF via `format=avif`. Consider overriding `createOptimizedPicture` in project code or creating a project-level wrapper that adds AVIF `<source>` elements before WebP sources in the `<picture>` element. This is dependent on the AEM CDN supporting the `format=avif` parameter -- verify before implementing.

---

#### PERF-06 Oversized image breakpoints (2000px / 750px)

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Performance |
| Files | `scripts/aem.js:319` (upstream boilerplate) |
| Effort | M |

**Problem**: `createOptimizedPicture()` uses default breakpoints of `2000px` (desktop) and `750px` (mobile). The site's `main` content area has `max-width: 900px` (styles.css line 147), meaning a 2000px-wide image is more than 2x wider than necessary for content images. For the hero block, which is full-width (`max-width: unset` in hero.css), the 2000px breakpoint is more appropriate but still potentially oversized for most viewports. The gap between 750px and 2000px means mid-range devices (tablets at 768-1024px) receive either an undersized or oversized image.

**Evidence**:
```js
// scripts/aem.js:319
breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }]
```
```css
/* styles/styles.css:147 */
main { max-width: 900px; }
```

**Recommendation**: This involves `aem.js` (upstream boilerplate). Consider passing custom breakpoints when calling `createOptimizedPicture` in block-level code. For content images, breakpoints like `[{ media: '(min-width: 600px)', width: '900' }, { width: '750' }]` would better match the layout. For the full-width hero, a three-tier approach could reduce payload: `[{ media: '(min-width: 1200px)', width: '1600' }, { media: '(min-width: 600px)', width: '1000' }, { width: '750' }]`.

---

#### PERF-07 No performance budget defined

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Performance |
| Files | (project-wide) |
| Effort | M |

**Problem**: The project has no defined performance budget -- no Lighthouse CI configuration, no bundle size limits, and no Core Web Vitals thresholds. Without a budget, there is no automated mechanism to detect performance regressions before they reach production. Given that this is a restaurant website where mobile performance and fast LCP directly impact user experience (potential customers looking up the menu), establishing performance guardrails is important.

**Evidence**: No `lighthouserc.js`, `.lighthouserc.json`, `budget.json`, or equivalent configuration file exists in the repository. No CI/CD performance checks were found.

**Recommendation**: Define a performance budget with three tiers:
1. **Metric-based**: LCP < 2.5s, CLS < 0.1, INP < 200ms, FCP < 1.8s, TBT < 200ms
2. **Resource-based**: Total page weight < 500 KB (compressed), JavaScript < 100 KB, CSS < 30 KB, images < 300 KB
3. **Lighthouse score**: Performance score >= 90

Implement using Lighthouse CI in the CI/CD pipeline with a `lighthouserc.js` configuration that fails builds on regression. Start with the current baseline and tighten over time.

---

#### PERF-08 body { display: none } without JavaScript failure fallback

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Performance |
| Files | `styles/styles.css:52-57`, `scripts/scripts.js:80` |
| Effort | S |

**Problem**: The body starts hidden (`display: none` in styles.css line 52) and is revealed by JavaScript adding `body.appear` (scripts.js line 80). This is a standard AEM EDS pattern to prevent FOUC (flash of unstyled content), but if JavaScript fails to load or execute (network error, CSP violation, runtime exception before line 80), the page remains permanently invisible. Users see a blank page with no content whatsoever.

**Evidence**:
```css
/* styles/styles.css:52-57 */
body {
  display: none;
}
body.appear {
  display: unset;
}
```
```js
// scripts/scripts.js:80
document.body.classList.add('appear');
```

**Recommendation**: Add a `<noscript>` fallback in `head.html` to make the body visible when JavaScript is disabled:
```html
<noscript><style>body { display: unset !important; }</style></noscript>
```
Additionally, consider a timeout fallback that shows content after a reasonable delay (e.g., 5 seconds) to handle cases where JavaScript loads but fails silently:
```html
<style>
  @keyframes reveal { to { display: unset; } }
  body:not(.appear) { animation: 5s step-end reveal forwards; }
</style>
```
Note: This is a standard AEM EDS boilerplate pattern. The `<noscript>` addition is low-risk and recommended.

### Accessibility (A11Y)

#### A11Y-01 Hamburger menu has no accessible name, role, or keyboard operability

| Attribute | Value |
|-----------|-------|
| Severity | Critical |
| Category | Accessibility |
| Files | `blocks/header/header.js:53-61`, `blocks/header/header.css:58-63` |
| Effort | S |

**Problem**: The mobile hamburger menu toggle is a `<div>` with no `role="button"`, no `aria-label`, and no `tabindex`. It is invisible to screen readers and unreachable via keyboard. This violates WCAG 2.2 SC 4.1.2 Name, Role, Value (Level A) -- interactive components must expose their role and accessible name to assistive technologies. It also violates SC 2.1.1 Keyboard (Level A) -- all functionality must be operable through a keyboard. Mobile and tablet users relying on screen readers or keyboard/switch access cannot open the navigation menu.

**Evidence**:
```js
// blocks/header/header.js:53-61
const hamburger = document.createElement('div');
hamburger.classList.add('nav-hamburger');
hamburger.innerHTML = '<div class="nav-hamburger-icon"></div>';
hamburger.addEventListener('click', () => {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  document.body.classList.toggle('nav-open', !expanded);
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
});
```
The element is a `<div>` with only a `click` event listener. No `role`, `tabindex`, `aria-label`, or `keydown` handler is present. The `aria-expanded` state is set on the parent `<nav>`, not on the button itself.

**Recommendation**: Replace the `<div>` with a `<button>` element (or add `role="button"` and `tabindex="0"`). Add an accessible name and move `aria-expanded` to the toggle itself:
```js
const hamburger = document.createElement('button');
hamburger.classList.add('nav-hamburger');
hamburger.setAttribute('aria-label', 'Menu');
hamburger.setAttribute('aria-expanded', 'false');
hamburger.innerHTML = '<span class="nav-hamburger-icon" aria-hidden="true"></span>';
hamburger.addEventListener('click', () => {
  const expanded = hamburger.getAttribute('aria-expanded') === 'true';
  hamburger.setAttribute('aria-expanded', String(!expanded));
  nav.setAttribute('aria-expanded', String(!expanded));
  document.body.classList.toggle('nav-open', !expanded);
});
```

---

#### A11Y-02 Nav dropdown sections not keyboard accessible

| Attribute | Value |
|-----------|-------|
| Severity | Critical |
| Category | Accessibility |
| Files | `blocks/header/header.js:42-49` |
| Effort | S |

**Problem**: Navigation dropdown sections (`.nav-drop` items) use only `click` event listeners with no keyboard event handling. There are no `keydown` handlers for Enter, Space, Escape, or arrow keys. The `<li>` elements have `aria-expanded` but no `role` or `tabindex`, making them unfocusable and inoperable via keyboard. This violates WCAG 2.2 SC 2.1.1 Keyboard (Level A) -- all functionality available via pointer must also be available via keyboard. Desktop keyboard users cannot expand or collapse dropdown navigation sections.

**Evidence**:
```js
// blocks/header/header.js:42-49
navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
  if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
  navSection.addEventListener('click', () => {
    const expanded = navSection.getAttribute('aria-expanded') === 'true';
    collapseAllNavSections(navSections);
    navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });
});
```
Only `click` is bound. No `keydown` listener exists anywhere in the file. The `<li>` elements are not natively focusable.

**Recommendation**: Add `role="button"`, `tabindex="0"`, and keyboard event handling to dropdown triggers:
```js
navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
  if (navSection.querySelector('ul')) {
    navSection.classList.add('nav-drop');
    navSection.setAttribute('role', 'button');
    navSection.setAttribute('tabindex', '0');
  }
  navSection.addEventListener('click', toggleSection);
  navSection.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSection.call(navSection);
    }
    if (e.key === 'Escape') {
      collapseAllNavSections(navSections);
      navSection.focus();
    }
  });
});
```
Also add an Escape key handler on the hamburger menu to close mobile navigation and return focus to the toggle button.

---

#### A11Y-03 Speisen menu block lacks table semantics

| Attribute | Value |
|-----------|-------|
| Severity | Critical |
| Category | Accessibility |
| Files | `blocks/speisen/speisen.js:96-153`, `blocks/speisen/speisen.css:1-41` |
| Effort | M |

**Problem**: The speisen (menu) block presents tabular data -- menu items with item numbers, names, descriptions, sizes, and prices -- using CSS Grid on generic `<div>` elements with no ARIA table roles. Screen readers cannot convey the columnar relationship between a menu item and its price. This violates WCAG 2.2 SC 1.3.1 Info and Relationships (Level A) -- information and relationships conveyed through presentation must be programmatically determinable. A sighted user visually associates "Schnitzel" with "12,50 EUR" via spatial proximity, but a screen reader user hears a flat stream of text with no structural cues.

**Evidence**:
```js
// blocks/speisen/speisen.js:142-152 — builds a 5-cell row of plain divs
const nrEl = document.createElement('div');
nrEl.className = 'item-nr';
// ...
row.replaceChildren(nrEl, info, descEl, sizesEl, pricesEl);
```
```css
/* blocks/speisen/speisen.css:2-9 — visual table via CSS Grid */
.speisen > div {
  display: grid;
  grid-template:
    "nr name   sizes prices"
    "nr desc   sizes prices" / 2em auto auto 4em;
}
```
No `role="table"`, `role="row"`, `role="cell"`, `role="columnheader"`, or `role="rowheader"` attributes are present.

**Recommendation**: Add ARIA table roles to the generated structure. On the block container, add `role="table"` and `aria-label="Speisekarte"` (or the section heading text). On each row `<div>`, add `role="row"`. On each cell `<div>`, add `role="cell"`. On header rows (`.price-header`), use `role="columnheader"` for the header cells:
```js
// In decorate(block):
block.setAttribute('role', 'table');
block.setAttribute('aria-label', 'Speisekarte');

// For each row:
row.setAttribute('role', 'row');
nrEl.setAttribute('role', 'cell');
info.setAttribute('role', 'cell');
descEl.setAttribute('role', 'cell');
sizesEl.setAttribute('role', 'cell');
pricesEl.setAttribute('role', 'cell');

// For header rows:
sizesEl.setAttribute('role', 'columnheader');
pricesEl.setAttribute('role', 'columnheader');
```

---

#### A11Y-04 No skip navigation link

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | Accessibility |
| Files | `scripts/scripts.js:97-98`, `blocks/header/header.js:19-64` |
| Effort | S |

**Problem**: There is no skip navigation link allowing keyboard and screen reader users to bypass the header and jump directly to main content. This violates WCAG 2.2 SC 2.4.1 Bypass Blocks (Level A) -- a mechanism must be available to bypass blocks of content repeated on multiple pages. Keyboard users must tab through every navigation link on every page before reaching the main content area.

**Evidence**: Searching the entire codebase for "skip" returns no results. Neither `header.js` nor `scripts.js` creates a skip link. The `<main>` element exists but has no `id` attribute for a skip link to target. No visually hidden anchor linking to `#main` or `#content` is present.

**Recommendation**: Add a skip link as the first focusable element in the page. In `scripts.js` `loadEager()` or in the header block, prepend a skip link before the header:
```js
const skipLink = document.createElement('a');
skipLink.href = '#main';
skipLink.className = 'skip-link';
skipLink.textContent = 'Zum Inhalt springen';
document.body.prepend(skipLink);
document.querySelector('main').id = 'main';
```
```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 100;
  padding: 8px 16px;
  background: var(--background-color);
  color: var(--text-color);
}
.skip-link:focus {
  top: 0;
}
```

---

#### A11Y-05 Focus indicators rely on browser defaults with no custom enhancement

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | Accessibility |
| Files | `styles/styles.css:85-93`, `styles/styles.css:130-133` |
| Effort | S |

**Problem**: The site defines no custom `:focus` or `:focus-visible` styles for links. For buttons, the `:focus` rule (line 130) sets `background-color: var(--link-hover-color)`, but `--link-hover-color` and `--link-color` are both `#622a0f` -- meaning the focus state is visually identical to the default state. Links have `text-decoration: none` (line 87) with no focus indicator to compensate. While browser default outlines are not explicitly removed, the lack of custom focus styling means the focus indicator depends entirely on browser defaults, which may not meet WCAG 2.2 SC 2.4.13 Focus Appearance (Level AA) requirements for minimum contrast and area. This also affects SC 2.4.7 Focus Visible (Level AA).

**Evidence**:
```css
/* styles/styles.css:85-93 — no :focus rule for links */
a:any-link {
  color: var(--link-color);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
  color: var(--link-hover-color);
}

/* styles/styles.css:130-133 — focus identical to default state */
a.button:hover, a.button:focus, button:hover, button:focus {
  background-color: var(--link-hover-color);
  /* --link-hover-color === --link-color === #622a0f */
  cursor: pointer;
}
```
No `outline`, `box-shadow`, or other focus indicator is defined anywhere in the project CSS (confirmed by searching all `.css` files for "outline" and ":focus-visible" -- zero results).

**Recommendation**: Add explicit focus-visible styles for interactive elements:
```css
:focus-visible {
  outline: 2px solid var(--text-color);
  outline-offset: 2px;
}

a.button:focus-visible, button:focus-visible {
  outline: 2px solid var(--text-color);
  outline-offset: 2px;
}
```
Using `:focus-visible` ensures the outline appears for keyboard users but not mouse clicks, maintaining visual polish while satisfying WCAG requirements.

---

#### A11Y-06 Icons default to empty alt text regardless of context

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | Accessibility |
| Files | `scripts/aem.js:464-476` |
| Effort | S |

**Problem**: The `decorateIcon()` function in `aem.js` defaults the `alt` attribute to an empty string for all icon images (`alt = ''` on line 464). Empty alt marks images as decorative, meaning screen readers skip them entirely. If any icon conveys meaning -- for example, a phone icon, email icon, or social media icon in the navigation tools area -- that information is lost to assistive technology users. This violates WCAG 2.2 SC 1.1.1 Non-text Content (Level A) when icons convey information that is not available through surrounding text. This is AEM boilerplate code. Consider wrapping fixes in `scripts.js` rather than modifying `aem.js` directly.

**Evidence**:
```js
// scripts/aem.js:464-476
function decorateIcon(span, prefix = '', alt = '') {
  const iconName = Array.from(span.classList)
    .find((c) => c.startsWith('icon-'))
    .substring(5);
  const img = document.createElement('img');
  img.alt = alt;  // Always empty string unless explicitly overridden
  // ...
}
```
The function signature accepts an `alt` parameter, but `decorateIcons()` (line 483-488) never passes it, so all icons get `alt=""`.

**Recommendation**: After `decorateIcons()` runs in `scripts.js`, iterate over icons and set meaningful alt text based on icon name:
```js
// In scripts.js after decorateIcons(main):
const iconAltMap = {
  'phone': 'Telefon',
  'email': 'E-Mail',
  'instagram': 'Instagram',
  'facebook': 'Facebook',
};
main.querySelectorAll('span.icon img').forEach((img) => {
  const name = img.dataset.iconName;
  if (iconAltMap[name]) img.alt = iconAltMap[name];
});
```
Alternatively, if all current icons are truly decorative (accompanied by visible text), document this assumption. Audit icons whenever new ones are added.

---

#### A11Y-07 404 page missing lang attribute

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | Accessibility |
| Files | `404.html:2` |
| Effort | S |

**Problem**: The 404 error page's `<html>` tag has no `lang` attribute. This violates WCAG 2.2 SC 3.1.1 Language of Page (Level A) -- the default human language of each page must be programmatically determinable. Without `lang`, screen readers may use the wrong language pronunciation engine, making content unintelligible. The main site pages get `lang="de-DE"` set by `scripts.js` line 72, but the 404 page has its own static HTML where this attribute must be set directly. Note: `scripts.js` is loaded on the 404 page (line 12), so `lang` is eventually set by JavaScript. However, the page content renders before `scripts.js` executes, creating a window where screen readers may misidentify the language.

**Evidence**:
```html
<!-- 404.html:2 -->
<html>
```
Compare with `scripts.js` which sets the language for dynamically loaded pages:
```js
// scripts/scripts.js:72
document.documentElement.lang = 'de-DE';
```

**Recommendation**: Add the `lang` attribute directly to the HTML element:
```html
<html lang="de-DE">
```

---

#### A11Y-08 Hamburger touch target below 24x24 CSS pixel minimum

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Accessibility |
| Files | `blocks/header/header.css:58-63`, `blocks/header/header.css:65-76` |
| Effort | S |

**Problem**: The hamburger icon is rendered as a CSS pseudo-element construction that is 20px wide and approximately 22px tall (including the three lines created with `::before` and `::after`). The clickable `.nav-hamburger` div has `height: 22px` with no explicit width constraint (it gets `50px` from the grid column, but the visual target is only 20px wide). This is below the WCAG 2.2 SC 2.5.8 Target Size Minimum (Level AA) requirement of 24x24 CSS pixels. Users with motor impairments may have difficulty tapping the hamburger icon on touch devices.

**Evidence**:
```css
/* blocks/header/header.css:58-63 */
header nav .nav-hamburger {
  grid-area: hamburger;
  height: 22px;
  padding-top: 3px;
  cursor: pointer;
}

/* blocks/header/header.css:65-76 — icon lines are 20px wide */
header nav[aria-expanded='false'] .nav-hamburger-icon {
  width: 20px;
  height: 2px;
}
```
The grid column is 50px wide, so the click target width is adequate, but the height of `.nav-hamburger` is 22px (plus 3px padding-top = 25px total), which marginally passes. However, the visual affordance (the three lines) is only 20x14px, making it difficult for users to identify and target.

**Recommendation**: Increase the minimum dimensions and center the icon for a larger touch target:
```css
header nav .nav-hamburger {
  grid-area: hamburger;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
```

---

#### A11Y-09 Nav element has no accessible label

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Accessibility |
| Files | `blocks/header/header.js:30-31` |
| Effort | S |

**Problem**: The `<nav>` element is created without an `aria-label` or `aria-labelledby` attribute. When a page has multiple `<nav>` elements (e.g., header navigation and footer navigation), screen readers announce each as "navigation" with no way to distinguish them. This is a best practice for WCAG 2.2 SC 1.3.1 Info and Relationships (Level A) and SC 2.4.1 Bypass Blocks (Level A) -- landmark regions should have distinct accessible names when multiples of the same type exist on a page.

**Evidence**:
```js
// blocks/header/header.js:30-31
const nav = document.createElement('nav');
nav.innerHTML = html;
```
No `aria-label` is set on the `<nav>` element. Screen readers announce it as an unnamed "navigation" landmark.

**Recommendation**: Add an accessible label to the nav element:
```js
const nav = document.createElement('nav');
nav.setAttribute('aria-label', 'Hauptnavigation');
nav.innerHTML = html;
```

---

#### A11Y-10 Redundant title attributes on button links

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Accessibility |
| Files | `scripts/aem.js:426` |
| Effort | S |

**Problem**: The `decorateButtons()` function in `aem.js` sets `a.title = a.title || a.textContent` on every link (line 426). This creates redundant `title` attributes that duplicate the visible link text. Screen readers announce both the accessible name (link text) and the title, causing users to hear the same content twice. The `title` attribute should only be used when it provides information not already available in the visible text. This is a WCAG 2.2 SC 2.4.4 Link Purpose (Level A) best practice concern -- while not strictly a violation, the redundant announcement degrades the user experience for assistive technology users. This is AEM boilerplate code. Consider wrapping fixes in `scripts.js` rather than modifying `aem.js` directly.

**Evidence**:
```js
// scripts/aem.js:426
a.title = a.title || a.textContent;
```
For a link like `<a href="/speisen">Speisekarte</a>`, this produces `<a href="/speisen" title="Speisekarte">Speisekarte</a>`, causing screen readers to announce "Speisekarte, Speisekarte, link".

**Recommendation**: After `decorateButtons()` runs in `decorateMain()`, remove redundant titles:
```js
// In scripts.js decorateMain(), after decorateButtons(main):
main.querySelectorAll('a[title]').forEach((a) => {
  if (a.title === a.textContent.trim()) a.removeAttribute('title');
});
```

---

#### A11Y-11 Hero image text-over-image contrast depends on photo content

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Accessibility |
| Files | `blocks/hero/hero.css:18-24` |
| Effort | S |

**Problem**: The hero block overlays heading text on a background image with a semi-transparent overlay (`background: rgb(204 204 204 / 30%)`). The actual contrast ratio between the heading text and its background depends on the underlying photograph, which varies by page and is controlled by content authors. The 30% opacity overlay provides minimal contrast enhancement. While the text color (`--text-color: #492000`) has excellent contrast against the base page background (12.2:1), contrast against a dark photograph behind a 30% gray overlay may fall below the 4.5:1 requirement of WCAG 2.2 SC 1.4.3 Contrast Minimum (Level AA).

**Evidence**:
```css
/* blocks/hero/hero.css:18-24 */
main .hero h1 {
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    color: var(--text-color);
    background: rgb(204 204 204 / 30%);
}
```
A 30% opacity gray overlay over a dark image region (e.g., RGB 50,50,50) produces an effective background of approximately RGB 96,96,96, yielding a contrast ratio of approximately 2.7:1 with `#492000` -- well below the 4.5:1 minimum.

**Recommendation**: Increase the overlay opacity to ensure sufficient contrast regardless of background image content. A minimum of 70-80% opacity is typically needed:
```css
main .hero h1 {
    background: rgb(240 240 220 / 80%);  /* Use page background color at high opacity */
    padding: 8px 16px;
}
```
Alternatively, add a text-shadow or use a solid background with slight transparency to guarantee contrast.

### Security (SEC)

#### [SEC-01] DA preview script loaded from remote origin without environment guard

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Security |
| Files | `scripts/dapreview.js:1-3` |
| Effort | S |

**Problem**: `dapreview.js` dynamically imports a script from `https://da.live/scripts/dapreview.js` whenever the `?dapreview` query parameter is present. While the parameter acts as a gate, there is no check restricting this to non-production environments (e.g., localhost, `*.aem.page`, `*.aem.live`). If an attacker convinces a content author to visit a production URL with `?dapreview` appended, the remote script executes in the production origin with full DOM access. The remote script is controlled by the DA platform and could change at any time without notice to the site owner.

**Evidence**:
```js
// scripts/dapreview.js:1-3
const defined = new URLSearchParams(window.location.search).get('dapreview');
// eslint-disable-next-line import/no-unresolved
export default defined ? import('https://da.live/scripts/dapreview.js') : undefined;
```
The `import()` on line 3 fetches and executes arbitrary JavaScript from `da.live` with no subresource integrity (SRI) check and no hostname restriction.

**Recommendation**: Add a hostname allowlist so the import only fires on preview/development origins:
```js
const defined = new URLSearchParams(window.location.search).get('dapreview');
const isPreviewEnv = ['localhost', '.aem.page', '.aem.live', '.hlx.page', '.hlx.live']
  .some((h) => window.location.hostname.endsWith(h) || window.location.hostname === 'localhost');
export default (defined && isPreviewEnv)
  ? import('https://da.live/scripts/dapreview.js')
  : undefined;
```

---

#### [SEC-02] innerHTML in speisen.js with regex-extracted content

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Security |
| Files | `blocks/speisen/speisen.js:25-27`, `blocks/speisen/speisen.js:80-81` |
| Effort | S |

**Problem**: The `headerCellHTML` function reconstructs HTML from `textContent` of `<strong>` elements and assigns it via `innerHTML` (lines 25-27). The `splitPrices` function interpolates regex capture groups into HTML template literals via `innerHTML` (lines 80-81). While the source data comes from the trusted DA content store (not end-user input), this creates a pattern where content containing HTML-special characters (e.g., `<`, `>`, `&`) could produce unexpected DOM structures. If the content trust model ever changes -- for example, if menu items are sourced from an external POS system or user-contributed content -- these become XSS vectors.

**Evidence**:
```js
// blocks/speisen/speisen.js:25-27
let html = `<p><strong>${boldText}</strong></p>`;
if (rest) html += `<p>${rest}</p>`;

// blocks/speisen/speisen.js:80-81
sizesEl.innerHTML = matches.map((m) => `<p>${m[1]}</p>`).join('');
pricesEl.innerHTML = matches.map((m) => `<p>${m[2]}</p>`).join('');
```
The variables `boldText`, `rest`, `m[1]`, and `m[2]` are derived from `textContent` and regex matches on DOM content but are interpolated back into HTML without encoding.

**Recommendation**: Use `textContent` and DOM APIs instead of string interpolation into `innerHTML`. For `splitPrices`:
```js
sizesEl.append(...matches.map((m) => {
  const p = document.createElement('p');
  p.textContent = m[1];
  return p;
}));
pricesEl.append(...matches.map((m) => {
  const p = document.createElement('p');
  p.textContent = m[2];
  return p;
}));
```

---

#### [SEC-03] innerHTML from fetch -- standard EDS document trust model

| Attribute | Value |
|-----------|-------|
| Severity | Informational |
| Category | Security |
| Files | `blocks/header/header.js:31`, `blocks/footer/footer.js:17`, `blocks/fragment/fragment.js:26` |
| Effort | -- |

**Positive Finding**: The header, footer, and fragment blocks fetch `.plain.html` content from the same origin and assign it via `innerHTML`. This is the standard AEM Edge Delivery Services pattern where content is authored in a trusted CMS (Document Authoring) and served from the same CDN origin. The trust boundary is the content authoring layer, not the browser. The fragment block additionally validates that paths start with `/` and do not start with `//` (line 22), preventing open redirect or cross-origin fetches.

**Maintain**: Continue following the EDS content trust model. If the site ever serves user-generated content or content from untrusted origins, these assignments would need sanitization (e.g., DOMPurify).

---

#### [SEC-04] No Content Security Policy

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Security |
| Files | `head.html:1-5` |
| Effort | M |

**Problem**: The site has no Content Security Policy (CSP), neither as a `<meta>` tag in `head.html` nor as an HTTP response header (no CDN/edge configuration found in the repo). CSP is a defense-in-depth measure that mitigates XSS impact by restricting which origins can serve scripts, styles, and other resources. Without CSP, any XSS vulnerability has unrestricted impact. The site loads scripts from `self` and `ot.aem.live` (RUM enhancer), and optionally from `da.live` (preview script) -- a CSP would codify these as the only permitted script sources.

**Evidence**:
```html
<!-- head.html -- complete file, no CSP -->
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<script src="/scripts/aem.js" type="module"></script>
<script src="/scripts/scripts.js" type="module"></script>
<link rel="stylesheet" href="/styles/styles.css"/>
<link rel="icon" href="data:,">
```

**Recommendation**: Add a CSP meta tag to `head.html`. Start with report-only to identify violations, then enforce:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://ot.aem.live;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.aem.live;
  connect-src 'self' https://*.aem.live;
  font-src 'self';
">
```
Note: The DA preview script (`da.live`) should only be allowed in non-production CSP configurations. For greater flexibility (e.g., environment-specific policies), manage CSP via HTTP headers at the CDN level rather than a meta tag.

---

#### [SEC-05] External links correctly marked with noopener noreferrer

| Attribute | Value |
|-----------|-------|
| Severity | Informational |
| Category | Security |
| Files | `scripts/delayed.js:9-19` |
| Effort | -- |

**Positive Finding**: All external links are automatically set to `target="_blank"` with `rel="noopener noreferrer"`, preventing reverse tabnabbing attacks. The `isLocal` function correctly identifies same-origin links using hostname comparison and handles relative links (empty hostname) as local.

**Maintain**: Continue applying `noopener noreferrer` to external links.

---

#### [SEC-06] Zero runtime npm dependencies

| Attribute | Value |
|-----------|-------|
| Severity | Informational |
| Category | Security |
| Files | `package.json:24-36` |
| Effort | -- |

**Positive Finding**: The project has zero runtime dependencies -- all npm packages are `devDependencies` used only for linting and testing. No dependency code ships to end users. This eliminates the supply chain attack surface for production code entirely.

**Maintain**: Continue keeping runtime dependencies at zero. If a runtime dependency is ever needed, evaluate carefully against supply chain security best practices (SBOM, lock file verification, SCA in CI).

### SEO (SEO)

#### [SEO-01] No structured data (JSON-LD) for the restaurant

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | SEO |
| Files | `head.html:1-5`, `scripts/scripts.js` (no JSON-LD generation) |
| Effort | M |

**Problem**: The site has zero JSON-LD structured data. For a restaurant website, Google explicitly recommends `Restaurant` schema markup (from schema.org) to enable rich results in search -- including business hours, address, cuisine type, price range, and aggregate ratings. Without structured data, the site cannot appear in Google's restaurant knowledge panels, rich cards, or local pack enhancements. This is a significant SEO gap for a local business website where search visibility directly drives foot traffic.

**Evidence**: No `<script type="application/ld+json">` tags exist anywhere in the codebase. `head.html` contains no structured data. No JavaScript generates JSON-LD dynamically.

**Recommendation**: Add a `Restaurant` JSON-LD block to the homepage. This can be injected via `head.html` or dynamically in `scripts.js` during `loadEager()`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Schamdan",
  "url": "https://schamdan.de",
  "servesCuisine": ["Persian", "Middle Eastern"],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "...",
    "addressRegion": "...",
    "postalCode": "...",
    "addressCountry": "DE"
  },
  "telephone": "...",
  "openingHoursSpecification": [ ... ],
  "priceRange": "$$"
}
</script>
```
Populate fields from actual business data. Validate with Google's Rich Results Test after implementation.

---

#### [SEO-02] No Menu structured data from speisen block

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | SEO |
| Files | `blocks/speisen/speisen.js:96-153` |
| Effort | L |

**Problem**: The speisen (menu) block renders menu items with prices as visual HTML but generates no `Menu` or `MenuItem` structured data. Google supports `Menu`, `MenuSection`, and `MenuItem` schema types that enable rich menu results in search. For a restaurant site, the menu is the highest-value content -- potential customers search for specific dishes, prices, and dietary information. Without structured data, this content is only accessible via full-text indexing, missing the rich result opportunity entirely.

**Evidence**:
```js
// blocks/speisen/speisen.js:96 -- decorate function produces only visual DOM
export default function decorate(block) {
  [...block.children].forEach((row) => {
    // ... builds visual grid cells only, no JSON-LD output
  });
}
```

**Recommendation**: Extend the `decorate` function to generate a `Menu` JSON-LD block alongside the visual rendering. After processing all rows, collect item names and prices into structured data:
```js
// At the end of decorate(), after visual rendering:
const menuItems = [...block.querySelectorAll('.item-info')].map((info, i) => {
  const prices = block.querySelectorAll('.item-prices')[i];
  return {
    '@type': 'MenuItem',
    name: info.textContent.trim(),
    offers: {
      '@type': 'Offer',
      price: prices?.textContent.trim().replace(/[^\d,.]/g, ''),
      priceCurrency: 'EUR',
    },
  };
}).filter((item) => item.name);

const script = document.createElement('script');
script.type = 'application/ld+json';
script.textContent = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Menu',
  hasMenuSection: [{ '@type': 'MenuSection', hasMenuItem: menuItems }],
});
document.head.appendChild(script);
```
This is a larger effort due to needing to map the authored content model (item numbers, multi-price variants, size labels) into the schema.org `Menu` hierarchy accurately.

---

#### [SEO-03] Placeholder favicon

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | SEO |
| Files | `head.html:5` |
| Effort | S |

**Problem**: The site uses a placeholder empty favicon (`href="data:,"`) which is a development trick to suppress 404 errors in the browser console. In production, this means the site has no visible favicon in browser tabs, bookmarks, or search results. Google displays favicons in mobile search results -- a missing or blank favicon reduces visual trust and click-through rate. It also impacts brand recognition when users have multiple tabs open.

**Evidence**:
```html
<!-- head.html:5 -->
<link rel="icon" href="data:,">
```
No `.ico`, `.png`, or `.svg` favicon files exist in the repository.

**Recommendation**: Create a proper favicon set and replace the placeholder:
```html
<link rel="icon" href="/icons/favicon.ico" sizes="32x32">
<link rel="icon" href="/icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
```
Use the restaurant's logo or brand mark. SVG favicons are preferred for scalability. Include an `apple-touch-icon` for iOS home screen bookmarks. Generate the favicon set from a high-resolution source using a tool like realfavicongenerator.net.

---

#### [SEO-04] Missing default-meta-image.png for Open Graph fallback

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | SEO |
| Files | `head.html` (no og:image fallback), project root (no default-meta-image.png) |
| Effort | S |

**Problem**: AEM Edge Delivery Services uses a `default-meta-image.png` (or configured equivalent) as the fallback Open Graph image when pages lack a specific `og:image` meta tag. No such file exists in the repository. When pages are shared on social media (Facebook, WhatsApp, Twitter/X, LinkedIn) or messaging apps without a page-specific image, they will display with no preview image, significantly reducing click-through rates. Social sharing is a major discovery channel for restaurants.

**Evidence**: No `default-meta-image.png` or equivalent file found in the project root or any subdirectory. The `head.html` file does not define an `og:image` fallback.

**Recommendation**: Create a `default-meta-image.png` (recommended: 1200x630px) in the DA content root with the restaurant's branding -- logo, signature dish photo, or storefront image. EDS will automatically use it as the `og:image` fallback for pages that do not define their own. Additionally, verify that key pages (homepage, menu) have page-specific Open Graph images set in their metadata.

---

#### [SEO-05] helix-query.yaml missing image property

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | SEO |
| Files | `helix-query.yaml:19-35` |
| Effort | S |

**Problem**: The `helix-query.yaml` index configuration defines properties for `lastModified`, `title`, `description`, `content`, and `robots`, but does not include an `image` property. The query index is used by EDS for sitemap generation and internal search. Without an image property, any feature that relies on the query index for page thumbnails (e.g., card blocks pulling from the index, sitemap image extensions, internal search with previews) will have no image data available.

**Evidence**:
```yaml
# helix-query.yaml:19-35 -- no image property defined
properties:
  lastModified:
    select: none
    value: parseTimestamp(headers["last-modified"], "ddd, DD MMM YYYY hh:mm:ss GMT")
  title:
    select: head > meta[property="og:title"]
    value: attribute(el, "content")
  description:
    select: head > meta[name="description"]
    value: attribute(el, "content")
  content:
    select: main > div
    value: textContent(el)
  robots:
    select: head > meta[name="robots"]
    value: attribute(el, "content")
```

**Recommendation**: Add an `image` property to extract the Open Graph image:
```yaml
  image:
    select: head > meta[property="og:image"]
    value: attribute(el, "content")
```
This enables card blocks, search features, and sitemap image extensions to reference page images from the query index.

---

#### [SEO-06] 404 page in English on a German-language site

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | SEO |
| Files | `404.html:5`, `404.html:58-60` |
| Effort | S |

**Problem**: The 404 error page displays English text ("Page Not Found", "Go home", "Go back") while the rest of the site is configured as German (`document.documentElement.lang = 'de-DE'` in `scripts.js:72`). The `<html>` tag in `404.html` also lacks a `lang` attribute entirely. This language inconsistency confuses both users and search engines. When Googlebot encounters a 404, it notes the page language -- an English 404 on a German site sends mixed signals about site language, potentially affecting how the site is classified in regional search results.

**Evidence**:
```html
<!-- 404.html:5 -->
<title>Page not found</title>

<!-- 404.html:58-60 -->
<h2 class="error-message">Page Not Found</h2>
<p class="button-container">
  <a href="/" class="button secondary error-button-home">Go home</a>
</p>
```
Compare with `scripts/scripts.js:72`:
```js
document.documentElement.lang = 'de-DE';
```

**Recommendation**: Translate the 404 page content to German and add the `lang` attribute:
```html
<html lang="de-DE">
  ...
  <title>Seite nicht gefunden</title>
  ...
  <h2 class="error-message">Seite nicht gefunden</h2>
  <a href="/" class="button secondary error-button-home">Zur Startseite</a>
```
Also update the dynamically generated "Go back" button text in the inline script (line 22) to "Zuruck" or "Vorherige Seite".

---

#### [SEO-07] EDS handles robots.txt, sitemap, canonical, and OG tags automatically

| Attribute | Value |
|-----------|-------|
| Severity | Informational |
| Category | SEO |
| Files | `helix-query.yaml`, `fstab.yaml`, `scripts/aem.js` |
| Effort | -- |

**Positive Finding**: AEM Edge Delivery Services automatically generates and serves several critical SEO assets that do not need manual implementation: `robots.txt` (generated from site configuration), `sitemap.xml` (generated from `helix-query.yaml` index), canonical URLs (added as `<link rel="canonical">` in the HTML response), and Open Graph meta tags (`og:title`, `og:description`, `og:url` derived from page metadata). The `helix-query.yaml` is properly configured with exclude patterns for navigation fragments, footer, drafts, and tool pages -- preventing these from appearing in the sitemap.

**Maintain**: Continue relying on EDS for these automated SEO features. Verify periodically that `robots.txt` and `sitemap.xml` are accessible and correct at the production domain. Ensure all pages have `title` and `description` metadata set in the DA content authoring layer.

### Test Coverage (TEST)

#### TEST-01 Reported 73% coverage is inflated by aem.js side effects

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | Test Coverage |
| Files | `test/scripts/scripts.test.js:7`, `test/scripts/block-utils.test.js:14`, `scripts/aem.js` |
| Effort | M |

**Problem**: The test suite reports 73.18% overall code coverage, but this number is misleading. The coverage breakdown reveals that `scripts/aem.js` (AEM SDK boilerplate, 729 statements) dominates the total. `aem.js` reaches 68% coverage purely through side effects -- importing the module triggers top-level code execution and the tests call its exported functions. Meanwhile, the project's most important custom code has zero direct test coverage: `speisen.js` (the most complex custom block, 154 lines of parsing logic) does not appear in the coverage report at all because no test imports it. `scripts/scripts.js` is also absent from coverage. The only custom files with measured coverage are `header.js` (100%, but tested via `loadBlock` side effects) and `footer.js` (100%, same pattern). The real custom code coverage is effectively 0% for logic that the team owns and maintains.

**Evidence**:
Coverage report breakdown (from `coverage/lcov-report/index.html`):
| File | Statements | Functions | Lines |
|------|-----------|-----------|-------|
| `scripts/aem.js` | 68.03% (496/729) | 59.37% (19/32) | 68.03% |
| `blocks/header/header.js` | 100% (65/65) | 100% (2/2) | 100% |
| `blocks/footer/footer.js` | 100% (21/21) | 100% (1/1) | 100% |
| `blocks/speisen/speisen.js` | **Not measured** | **Not measured** | **Not measured** |
| `scripts/scripts.js` | **Not measured** | **Not measured** | **Not measured** |

**Recommendation**: Distinguish between boilerplate coverage (aem.js) and custom code coverage. Add tests for `speisen.js` (see TEST-02). Configure coverage thresholds that exclude `aem.js` or report custom code coverage separately. In `package.json`, the `wtr` command could be configured with explicit include/exclude patterns for coverage reporting. At minimum, add a note to the CI output or README acknowledging that the headline coverage number is inflated by boilerplate.

---

#### TEST-02 Speisen block has zero test coverage

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | Test Coverage |
| Files | `blocks/speisen/speisen.js:1-154` |
| Effort | M |

**Problem**: The speisen block is the most complex custom code in the project (154 lines, 6 functions, regex parsing, multi-branch DOM transformation) and has zero test coverage. This block handles: item number extraction via regex (`/^[A-Za-z]?\d+[a-z]?$/`), price splitting with the `PRICE_RE` pattern (`/^(.+?)\s+(\d[\d,.]*\s*€)$/`), header row detection, multi-price distribution logic (labeled prices, bare multi-prices, single bare prices), and `<em>` description extraction. Each of these code paths contains branching logic that could silently break when content structure changes. This is a *keeper* test candidate -- the parsing logic is deterministic, pure-function-like, and highly testable.

**Evidence**:
```js
// blocks/speisen/speisen.js:18 -- regex used for price parsing
const PRICE_RE = /^(.+?)\s+(\d[\d,.]*\s*€)$/;

// blocks/speisen/speisen.js:59-94 -- splitPrices has 4 distinct code paths
function splitPrices(priceCol) {
  // Path 1: no <p> elements (raw text)
  // Path 2: all paragraphs match "label price" pattern
  // Path 3: multiple bare prices
  // Path 4: single bare price
}
```
The `speisen.js` file does not appear in the coverage report because no test file imports or exercises it.

**Recommendation**: Create `test/blocks/speisen/speisen.test.js` as a keeper test suite. Focus on the pure transformation logic:
1. **Price splitting**: Test all 4 `splitPrices` paths -- labeled prices ("0,3l 3,30 EUR"), bare multi-prices, single prices, and raw text fallback.
2. **Item number extraction**: Test the regex pattern with valid numbers (e.g., "A1", "12", "5a") and non-matches.
3. **Header row detection**: Test rows with empty info + bold price labels.
4. **Description extraction**: Test `<em>` extraction and text cleanup.
Create HTML fixture files with representative menu structures from the actual site content. This block's logic is deterministic and DOM-in/DOM-out, making it ideal for fast, reliable unit tests.

---

#### TEST-03 Hardcoded sleep(1000) creates latent flakiness risk

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Test Coverage |
| Files | `test/blocks/header/header.test.js:13-17`, `test/blocks/footer/footer.test.js:13-17` |
| Effort | S |

**Problem**: Both the header and footer test files use a `sleep(1000)` (1-second fixed delay) after `loadBlock()` to wait for async initialization to complete. This pattern is a classic source of test flakiness: on fast machines the delay is wasted time (tests take >2 seconds when they could take <100ms), and on slow CI runners the delay may be insufficient, causing sporadic failures. In 3 local test runs, no flakiness was observed (all 13 tests passed consistently in 3-8 seconds), but the risk increases under CI load or if block initialization becomes slower.

**Evidence**:
```js
// test/blocks/header/header.test.js:13-17
const sleep = async (time = 1000) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(true);
  }, time);
});
// ...
await loadBlock(headerBlock);
await sleep();
```
The identical pattern is duplicated in `test/blocks/footer/footer.test.js:13-17`.

**Recommendation**: Replace fixed sleep with deterministic waiting. After `loadBlock()`, poll for the expected DOM state:
```js
async function waitForSelector(selector, timeout = 5000) {
  const start = Date.now();
  while (!document.querySelector(selector) && Date.now() - start < timeout) {
    await new Promise((r) => setTimeout(r, 50));
  }
}
// Usage:
await loadBlock(headerBlock);
await waitForSelector('header nav');
```
This is faster on fast machines and more reliable on slow ones. Extract the helper to a shared test utility to avoid duplication.

---

#### TEST-04 Shallow assertions test existence rather than behavior

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Test Coverage |
| Files | `test/blocks/hero/hero.test.js:27-28`, `test/blocks/footer/footer.test.js:27-29` |
| Effort | S |

**Problem**: Several tests verify only that elements exist in the DOM rather than testing meaningful behavior. The hero test checks `expect(document.querySelector('.hero')).to.exist` and `expect(document.querySelector('.hero.block')).to.exist` -- confirming only that `buildBlock` and `decorateBlocks` added CSS classes, which is boilerplate functionality. The footer test asserts a specific Adobe privacy link URL (`https://www.adobe.com/privacy.html`) from the test fixture, which validates the fixture data rather than the footer's decoration logic. These are *throwaway* tests -- they test AEM SDK behavior, not custom code. They provide a false sense of security.

**Evidence**:
```js
// test/blocks/hero/hero.test.js:27-28
expect(document.querySelector('.hero')).to.exist;
expect(document.querySelector('.hero.block')).to.exist;

// test/blocks/footer/footer.test.js:27-29
const a = document.querySelector('footer a');
expect(a).to.exist;
expect(a.href).to.equal('https://www.adobe.com/privacy.html');
```

**Recommendation**: For the hero block, this test is a throwaway -- the hero block's `decorate()` function is only 2 lines of CSS manipulation (boilerplate). The test adds no value beyond confirming SDK behavior. Mark it as a boilerplate smoke test or remove it. For the footer, test the actual footer decoration logic: verify that `decorateIcons` was called (icon `<span>` elements created), that the footer block structure matches the expected output after decoration. Replace the Adobe fixture URL with site-specific content that validates real behavior.

---

#### TEST-05 Module-scope setup prevents test isolation

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Test Coverage |
| Files | `test/blocks/header/header.test.js:9-23`, `test/blocks/footer/footer.test.js:9-23`, `test/blocks/hero/hero.test.js:6-12` |
| Effort | M |

**Problem**: All three block test files perform setup at module scope (top-level `await`) rather than inside `before`/`beforeEach` hooks. The header and footer tests import `aem.js`, set `document.body.innerHTML`, build blocks, and await `loadBlock()` all before any `describe` block. This means: (1) setup failures crash the entire test file with no diagnostic output, (2) adding a second `describe` block would share the same DOM state, and (3) test isolation is impossible -- each test mutates the same DOM created at module scope. The `scripts.test.js` and `block-utils.test.js` files partially use `before()` hooks but still perform `document.body.innerHTML` assignment at module scope (line 9 in both files).

**Evidence**:
```js
// test/blocks/header/header.test.js:9-23 -- all at module scope
const { buildBlock, decorateBlock, loadBlock } = await import('../../../scripts/aem.js');
document.body.innerHTML = await readFile({ path: '../../scripts/body.html' });
const headerBlock = buildBlock('header', [['Nav', '/test/blocks/header/nav']]);
document.querySelector('header').append(headerBlock);
decorateBlock(headerBlock);
await loadBlock(headerBlock);
await sleep();
```

**Recommendation**: Move all setup into `before()` or `beforeEach()` hooks inside the `describe` block. This ensures proper test runner lifecycle management, better error reporting on setup failures, and enables future test isolation if `beforeEach()` is used:
```js
describe('Header block', () => {
  before(async () => {
    const { buildBlock, decorateBlock, loadBlock } = await import('../../../scripts/aem.js');
    document.body.innerHTML = await readFile({ path: '../../scripts/body.html' });
    // ... rest of setup
  });
  // tests...
});
```

---

#### TEST-06 Unused sinon dependency

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Test Coverage |
| Files | `package.json:33` |
| Effort | S |

**Problem**: The `sinon` test double library (v14.0.1) is listed in `devDependencies` but is never imported or referenced in any test file. This adds unnecessary weight to `npm install` (sinon has a significant dependency tree) and creates confusion about the intended test architecture -- developers may assume spies/stubs/mocks are expected but find no examples.

**Evidence**:
```json
// package.json:33
"sinon": "14.0.1",
```
No test file imports sinon:
- `test/scripts/scripts.test.js` -- imports `readFile`, `chai`
- `test/scripts/block-utils.test.js` -- imports `readFile`, `chai`
- `test/blocks/header/header.test.js` -- imports `readFile`, `chai`
- `test/blocks/footer/footer.test.js` -- imports `readFile`, `chai`
- `test/blocks/hero/hero.test.js` -- imports `readFile`, `chai`, `aem.js`

**Recommendation**: Remove `sinon` from `devDependencies`. If stubs or spies are needed for future tests (e.g., mocking `fetch` in header tests), re-add it at that time. Modern alternatives like `@web/test-runner`'s built-in mocking or native `structuredClone`-based approaches may also suffice.

---

#### TEST-07 No coverage threshold enforced in CI

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | Test Coverage |
| Files | `.github/workflows/run-tests.yaml:16`, `package.json:7` |
| Effort | S |

**Problem**: The CI pipeline runs `npm test` which includes `--coverage`, but no minimum coverage threshold is configured. The `@web/test-runner` supports `coverageConfig` with threshold enforcement, but no `web-test-runner.config.mjs` or equivalent config file exists. This means coverage can silently decrease with each PR without any CI failure. Combined with the inflated coverage number (TEST-01), there is no mechanism to detect when custom code loses test coverage.

**Evidence**:
```yaml
# .github/workflows/run-tests.yaml:16
- run: npm test
  env:
    CI: true
```
```json
// package.json:7 -- no coverage threshold in test command
"test": "wtr \"./test/**/*.test.js\" --node-resolve --port=2000 --coverage"
```
No `web-test-runner.config.mjs`, `web-test-runner.config.js`, or `.wtrrc` configuration file exists in the repository.

**Recommendation**: Create a `web-test-runner.config.mjs` with coverage thresholds:
```js
export default {
  coverageConfig: {
    threshold: {
      statements: 70,
      branches: 80,
      functions: 60,
      lines: 70,
    },
  },
};
```
Start with thresholds at or slightly below current values (statements: 71%, branches: 87%, functions: 63%), then increase as custom code tests are added. Consider adding separate threshold configurations for custom code files vs boilerplate.

---

#### TEST-08 No web-test-runner configuration file

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | Test Coverage |
| Files | `package.json:7` |
| Effort | S |

**Problem**: The project uses `@web/test-runner` but relies entirely on CLI flags in `package.json` for configuration. There is no `web-test-runner.config.mjs` file, making the test configuration implicit and harder to extend (e.g., adding coverage thresholds, custom reporters, browser configuration, or file include/exclude patterns for coverage reporting).

**Evidence**:
```json
// package.json -- test configuration via CLI flags only
"test": "wtr \"./test/**/*.test.js\" --node-resolve --port=2000 --coverage"
```
No `web-test-runner.config.mjs` or equivalent configuration file exists.

**Recommendation**: Create a `web-test-runner.config.mjs` to make the test configuration explicit and extensible. Move CLI flags into the config file and add coverage thresholds (see TEST-07). This also enables adding browser configuration, custom reporters, and coverage include/exclude patterns in a maintainable way.

### UX and Usability (UX)

#### UX-01 Undefined --overlay-color CSS variable in header

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | UX and Usability |
| Files | `blocks/header/header.css:124`, `styles/styles.css:18` |
| Effort | S |

**Problem**: The header navigation sections use `background-color: var(--overlay-color)` but this CSS custom property is never defined anywhere in the codebase. The correct variable name is `--overlay-background-color` (defined in `styles/styles.css:18` as `rgb(230 230 210)`). Because `var(--overlay-color)` resolves to the initial value (transparent), the mobile nav sections have no background color when expanded. This means the nav menu content overlaps with page content behind it without any visual separation, making navigation items difficult or impossible to read on content-heavy pages.

**Evidence**:
```css
/* blocks/header/header.css:124 */
header nav .nav-sections {
  background-color: var(--overlay-color);  /* UNDEFINED */
}

/* styles/styles.css:18 -- the correct variable */
--overlay-background-color: rgb(230 230 210);
```
Every other file in the codebase uses the correct name:
- `styles/styles.css:136` -- `var(--overlay-background-color)`
- `styles/styles.css:175` -- `var(--overlay-background-color)`
- `blocks/footer/footer.css:3` -- `var(--overlay-background-color)`

**Recommendation**: Fix the typo in `blocks/header/header.css:124`:
```css
background-color: var(--overlay-background-color);
```

---

#### UX-02 Speisen block has no responsive breakpoints

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | UX and Usability |
| Files | `blocks/speisen/speisen.css:1-40` |
| Effort | M |

**Problem**: The speisen (menu) block CSS contains zero `@media` queries. The grid layout uses fixed column widths (`2em auto auto 4em`) that do not adapt to small screens. On phones under 375px wide (iPhone SE, older Android devices), the 5-column grid compresses item names and prices into unreadably small columns. The `auto` columns compete for space, and the rigid `4em` price column consumes a disproportionate share of narrow viewports. For a restaurant website, the menu is the highest-traffic page -- users check it on their phones while deciding where to eat. An unusable mobile menu directly impacts business.

**Evidence**:
```css
/* blocks/speisen/speisen.css:3-8 -- no responsive adaptation */
.speisen > div {
  display: grid;
  grid-template:
    "nr name   sizes prices"
    "nr desc   sizes prices" / 2em auto auto 4em;
  gap: 0;
  margin-bottom: 8px;
}
```
The global `styles.css` uses breakpoints at 600px and 900px. The header uses 1000px. The speisen block uses none.

**Recommendation**: Add a mobile-first responsive layout. On small screens, stack the grid vertically or simplify to fewer columns:
```css
@media (width < 600px) {
  .speisen > div {
    grid-template:
      "nr name   name   prices"
      ".  desc   desc   prices" / 2em auto auto auto;
  }
  .speisen .item-sizes {
    display: none;  /* or integrate into prices column */
  }
}
```
Alternatively, consider a completely stacked layout on small screens where each menu item is a vertical card. Test with actual menu content at 320px, 375px, and 414px viewport widths.

---

#### UX-03 Missing .price-header CSS styling

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | UX and Usability |
| Files | `blocks/speisen/speisen.js:55`, `blocks/speisen/speisen.css` |
| Effort | S |

**Problem**: The speisen block JavaScript adds a `.price-header` class to header rows (`speisen.js:55`), but no CSS rule targets this class. Header rows are meant to display column labels (e.g., size labels like "0,3l" / "0,5l" above their respective price columns). Without specific styling, header rows are visually indistinguishable from regular menu items. They should be styled differently -- typically with bold text, smaller font, or a visual separator -- to communicate their purpose as column headers.

**Evidence**:
```js
// blocks/speisen/speisen.js:55
row.classList.add('price-header');
```
Searching the entire codebase for `.price-header` in CSS files returns zero results.

**Recommendation**: Add styling for `.price-header` in `blocks/speisen/speisen.css`:
```css
.speisen .price-header {
  font-size: var(--body-font-size-xs);
  font-weight: 600;
  border-bottom: 1px solid var(--overlay-background-color);
  margin-top: 16px;
}
```
Review the actual menu content to determine the appropriate visual treatment. The header rows may need different grid proportions or alignment than regular item rows.

---

#### UX-04 Inconsistent responsive breakpoints between header and content

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | UX and Usability |
| Files | `blocks/header/header.css:170`, `styles/styles.css:218`, `blocks/columns/columns.css:10` |
| Effort | S |

**Problem**: The header switches from mobile hamburger layout to desktop horizontal nav at `1000px`, while the main content area and columns block switch to their desktop layouts at `900px`. This creates a 100px "dead zone" (900-999px) where content displays in desktop layout but the navigation is still in mobile hamburger mode. On tablets and small laptops in this viewport range, the visual language is inconsistent -- the wide content layout suggests "desktop" but the hamburger icon signals "mobile". Users may not discover desktop navigation features because the hamburger icon trains them to expect a mobile experience.

**Evidence**:
```css
/* blocks/header/header.css:170 */
@media (width >= 1000px) {  /* header desktop breakpoint */

/* styles/styles.css:218 */
@media (width >= 900px) {   /* content desktop breakpoint */

/* blocks/columns/columns.css:10 */
@media (width >= 900px) {   /* columns desktop breakpoint */
```

**Recommendation**: Align the header breakpoint with the content breakpoint at `900px`, or move the content breakpoint to `1000px` to match the header. The former is preferred -- `900px` matches the `main { max-width: 900px }` content width, and the header `max-width: 900px` (header.css:8) already uses this value. Changing the header breakpoint to `900px` requires reviewing that the horizontal nav fits within 900px viewport width.

---

#### UX-05 No mobile nav dismiss behaviors (Escape key, click-outside)

| Attribute | Value |
|-----------|-------|
| Severity | Medium |
| Category | UX and Usability |
| Files | `blocks/header/header.js:52-60` |
| Effort | S |

**Problem**: The mobile navigation hamburger menu can only be dismissed by clicking the hamburger icon again. There is no Escape key handler and no click-outside-to-close behavior. Both are standard UX patterns for overlay/drawer menus. Users expect to press Escape to dismiss any overlay, and tapping outside a mobile nav menu to close it. The current implementation also does not trap focus within the open nav, meaning keyboard users can tab to content behind the overlay (the `body.nav-open { overflow-y: hidden }` only prevents scrolling, not focus movement).

**Evidence**:
```js
// blocks/header/header.js:56-60 -- only click handler on hamburger
hamburger.addEventListener('click', () => {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  document.body.classList.toggle('nav-open', !expanded);
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
});
```
No `keydown` event listener for Escape. No click handler on the document or a backdrop element.

**Recommendation**: Add Escape key and click-outside handlers:
```js
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.getAttribute('aria-expanded') === 'true') {
    nav.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    hamburger.focus();
  }
});

nav.addEventListener('click', (e) => {
  if (e.target === nav && nav.getAttribute('aria-expanded') === 'true') {
    nav.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  }
});
```
The click-outside approach depends on the nav layout -- if the expanded nav covers the full viewport, an explicit "backdrop" element may be needed instead.

---

#### UX-06 Fixed nav uses width: 100vw causing horizontal scrollbar

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | UX and Usability |
| Files | `blocks/header/header.css:23` |
| Effort | S |

**Problem**: The fixed navigation uses `width: 100vw` which includes the width of any visible scrollbar. On pages with vertical scrollbar (most pages with content taller than the viewport), the nav extends beyond the visible area by the scrollbar width (~15-17px on desktop browsers). This causes a horizontal scrollbar to appear or, in combination with `box-sizing: border-box`, causes the nav content to be slightly offset from the page content below. The issue is subtle but visible on desktop browsers that show classic scrollbars (Windows, some Linux desktops, macOS when "Always show scrollbars" is enabled).

**Evidence**:
```css
/* blocks/header/header.css:22-26 */
header nav {
  position: fixed;
  width: 100vw;  /* includes scrollbar width */
  box-sizing: border-box;
}
```

**Recommendation**: Replace `width: 100vw` with `width: 100%`:
```css
header nav {
  position: fixed;
  width: 100%;  /* excludes scrollbar, matches visible area */
  left: 0;
}
```
For `position: fixed` elements, `width: 100%` is relative to the viewport minus scrollbar, which is the correct behavior. Alternatively, use `inset: 0` or `left: 0; right: 0;` to avoid width calculation entirely.

---

#### UX-07 404 page provides minimal recovery paths

| Attribute | Value |
|-----------|-------|
| Severity | Low |
| Category | UX and Usability |
| Files | `404.html:53-63` |
| Effort | S |

**Problem**: The 404 page offers only "Go home" (always) and "Go back" (conditionally, only when same-origin referrer exists). For a restaurant website, a lost visitor most likely wants to find the menu, contact information, or hours. The 404 page includes no direct content links beyond the home button. The `<header>` element is empty and relies on JavaScript to populate the nav -- if JavaScript fails, the user has only the "Go home" link.

**Evidence**:
```html
<!-- 404.html:52-64 -->
<body>
  <header></header>  <!-- JS-dependent, no fallback -->
  <main class="error">
    <div class="section">
      <svg viewBox="1 0 38 18" class="error-number">
        <text x="0" y="17">404</text>
      </svg>
      <h2 class="error-message">Page Not Found</h2>
      <p class="button-container">
        <a href="/" class="button secondary error-button-home">Go home</a>
      </p>
    </div>
  </main>
  <footer></footer>
</body>
```

**Recommendation**: Add direct links to the most important pages for a restaurant visitor:
```html
<p class="button-container">
  <a href="/" class="button secondary error-button-home">Zur Startseite</a>
  <a href="/speisen" class="button secondary">Speisekarte</a>
  <a href="/kontakt" class="button secondary">Kontakt</a>
</p>
```
Adjust link targets to match actual page paths. This ensures visitors can find key content even if the header JavaScript fails to load. Also note the language issue documented in SEO-06.

---

## Codebase-Wide Patterns

### Pattern 1: innerHTML usage across the codebase

Multiple findings identify `innerHTML` assignments from various content sources. Boilerplate blocks (header, footer, fragment, cards) use `innerHTML` with same-origin fetch responses (CODE-03, SEC-03), which is the accepted EDS trust model. The custom speisen block also uses `innerHTML` with regex-extracted content (CODE-04, SEC-02). While the current risk is low (all content is author-controlled), this pattern creates a latent XSS surface if the content trust model ever changes. A codebase-wide shift to DOM APIs (`textContent`, `createElement`, `append`) for custom code would reduce this surface without affecting boilerplate.

**Related findings**: CODE-03, CODE-04, SEC-02, SEC-03

### Pattern 2: Missing responsive design in custom code

The site's responsive strategy is incomplete. The header uses a 1000px breakpoint while the rest of the site uses 900px, creating a 100px inconsistency zone (MAINT-02, UX-04). The speisen block -- the most important custom code -- has zero media queries, making the menu unusable on small screens (UX-02). The hero block's hardcoded `margin-top: 80px` does not derive from the `--nav-height: 64px` variable (PERF-04). These issues cluster around the same root cause: layout values are not centralized, and responsive behavior was not tested across the custom blocks.

**Related findings**: MAINT-02, PERF-04, UX-02, UX-04

### Pattern 3: Header/navigation accessibility debt

The header block has the highest density of accessibility issues in the codebase. The hamburger menu has no accessible name, role, or keyboard operability (A11Y-01). Dropdown sections lack keyboard handling (A11Y-02). The nav element has no accessible label (A11Y-09). Touch target size is below minimum (A11Y-08). No skip navigation link exists (A11Y-04). Focus indicators are absent (A11Y-05). There is no Escape key or click-outside dismiss (UX-05). These all stem from the same boilerplate code in `header.js` and `header.css` that was not adapted for accessibility compliance.

**Related findings**: A11Y-01, A11Y-02, A11Y-04, A11Y-05, A11Y-08, A11Y-09, UX-05

### Pattern 4: Boilerplate code inherited without adaptation

Many findings affect AEM EDS boilerplate files that were inherited without project-specific adaptation. Empty placeholder files are still fetched (MAINT-03, MAINT-04, PERF-02). The ESLint config uses the original toolchain without updates (MAINT-01). The `loadFonts()` function runs for a site that uses system fonts. The default image breakpoints do not match the site's max-width (PERF-06). The default `createOptimizedPicture` lacks AVIF (PERF-05). No boilerplate inventory exists to track what has been customized (MAINT-05). This pattern suggests the boilerplate was forked and custom code was added on top, but the boilerplate itself was not pruned or adapted to the project's actual needs.

**Related findings**: MAINT-01, MAINT-03, MAINT-04, MAINT-05, PERF-02, PERF-05, PERF-06

### Pattern 5: Speisen block is the primary custom code risk

The speisen block is the most complex custom code (154 lines, 6 functions, regex parsing) and concentrates multiple categories of findings: no test coverage (TEST-02), no responsive breakpoints (UX-02), no ARIA table semantics (A11Y-03), innerHTML with regex content (CODE-04, SEC-02), and missing `.price-header` CSS styling (UX-03). This single block accounts for findings across 5 of 8 review categories. Prioritizing speisen block improvements would yield the highest return on effort.

**Related findings**: TEST-02, UX-02, UX-03, A11Y-03, CODE-04, SEC-02

---

## Prioritized Backlog

| Priority | ID | Title | Severity | Category | Files | Effort |
|----------|----|-------|----------|----------|-------|--------|
| 1 | A11Y-01 | Hamburger menu has no accessible name, role, or keyboard operability | Critical | Accessibility | `blocks/header/header.js:53-61`, `blocks/header/header.css:58-63` | S |
| 2 | A11Y-02 | Nav dropdown sections not keyboard accessible | Critical | Accessibility | `blocks/header/header.js:42-49` | S |
| 3 | A11Y-03 | Speisen menu block lacks table semantics | Critical | Accessibility | `blocks/speisen/speisen.js:96-153`, `blocks/speisen/speisen.css:1-41` | M |
| 4 | PERF-01 | dapreview.js imported unconditionally on the critical path | High | Performance | `scripts/scripts.js:74-75` | S |
| 5 | A11Y-04 | No skip navigation link | High | Accessibility | `scripts/scripts.js:97-98`, `blocks/header/header.js:19-64` | S |
| 6 | A11Y-05 | Focus indicators rely on browser defaults with no custom enhancement | High | Accessibility | `styles/styles.css:85-93`, `styles/styles.css:130-133` | S |
| 7 | A11Y-06 | Icons default to empty alt text regardless of context | High | Accessibility | `scripts/aem.js:464-476` | S |
| 8 | A11Y-07 | 404 page missing lang attribute | High | Accessibility | `404.html:2` | S |
| 9 | UX-01 | Undefined --overlay-color CSS variable in header | High | UX and Usability | `blocks/header/header.css:124`, `styles/styles.css:18` | S |
| 10 | SEO-01 | No structured data (JSON-LD) for the restaurant | High | SEO | `head.html:1-5`, `scripts/scripts.js` | M |
| 11 | TEST-01 | Reported 73% coverage is inflated by aem.js side effects | High | Test Coverage | `test/scripts/scripts.test.js:7`, `scripts/aem.js` | M |
| 12 | TEST-02 | Speisen block has zero test coverage | High | Test Coverage | `blocks/speisen/speisen.js:1-154` | M |
| 13 | UX-02 | Speisen block has no responsive breakpoints | High | UX and Usability | `blocks/speisen/speisen.css:1-40` | M |
| 14 | MAINT-01 | ESLint 8.x is end-of-life | High | Maintainability | `package.json:30` | L |
| 15 | SEO-02 | No Menu structured data from speisen block | High | SEO | `blocks/speisen/speisen.js:96-153` | L |
| 16 | CODE-02 | Silent catch blocks swallow errors without logging | Medium | Code Quality | `scripts/scripts.js:33-37`, `scripts/scripts.js:84-90` | S |
| 17 | MAINT-02 | Breakpoint inconsistency: header uses 1000px, rest uses 900px | Medium | Maintainability | `blocks/header/header.css:170`, `styles/styles.css:212,218` | S |
| 18 | MAINT-07 | CI/CD workflow only triggers on pull_request | Medium | Maintainability | `.github/workflows/run-tests.yaml` | S |
| 19 | PERF-02 | Empty CSS files fetched on every page load | Medium | Performance | `styles/fonts.css`, `styles/lazy-styles.css`, `scripts/scripts.js:32,109` | S |
| 20 | PERF-03 | Hero LCP image missing fetchpriority="high" | Medium | Performance | `scripts/aem.js:654-665` | S |
| 21 | PERF-04 | Hero margin-top vs --nav-height mismatch causes layout gap | Medium | Performance | `blocks/hero/hero.css:15`, `styles/styles.css:41` | S |
| 22 | A11Y-08 | Hamburger touch target below 24x24 CSS pixel minimum | Medium | Accessibility | `blocks/header/header.css:58-63` | S |
| 23 | A11Y-09 | Nav element has no accessible label | Medium | Accessibility | `blocks/header/header.js:30-31` | S |
| 24 | SEC-01 | DA preview script loaded from remote origin without environment guard | Medium | Security | `scripts/dapreview.js:1-3` | S |
| 25 | SEO-03 | Placeholder favicon | Medium | SEO | `head.html:5` | S |
| 26 | SEO-04 | Missing default-meta-image.png for Open Graph fallback | Medium | SEO | `head.html`, project root | S |
| 27 | SEO-05 | helix-query.yaml missing image property | Medium | SEO | `helix-query.yaml:19-35` | S |
| 28 | TEST-03 | Hardcoded sleep(1000) creates latent flakiness risk | Medium | Test Coverage | `test/blocks/header/header.test.js:13-17` | S |
| 29 | TEST-04 | Shallow assertions test existence rather than behavior | Medium | Test Coverage | `test/blocks/hero/hero.test.js:27-28` | S |
| 30 | TEST-07 | No coverage threshold enforced in CI | Medium | Test Coverage | `.github/workflows/run-tests.yaml:16`, `package.json:7` | S |
| 31 | UX-03 | Missing .price-header CSS styling | Medium | UX and Usability | `blocks/speisen/speisen.js:55`, `blocks/speisen/speisen.css` | S |
| 32 | UX-04 | Inconsistent responsive breakpoints between header and content | Medium | UX and Usability | `blocks/header/header.css:170`, `styles/styles.css:218` | S |
| 33 | UX-05 | No mobile nav dismiss behaviors (Escape key, click-outside) | Medium | UX and Usability | `blocks/header/header.js:52-60` | S |
| 34 | CODE-05 | Inconsistent error handling across blocks | Medium | Code Quality | `blocks/header/header.js`, `blocks/footer/footer.js`, `blocks/speisen/speisen.js` | M |
| 35 | CODE-01 | eslint-disable audit: eight suppressions in project-owned files | Low | Code Quality | `scripts/scripts.js`, `scripts/delayed.js`, `blocks/fragment/fragment.js` | S |
| 36 | CODE-04 | speisen.js innerHTML with regex-extracted content | Low | Code Quality | `blocks/speisen/speisen.js:80-81` | S |
| 37 | CODE-06 | CSS class naming follows different conventions across blocks | Low | Code Quality | `blocks/speisen/speisen.css`, `blocks/cards/cards.css` | S |
| 38 | CODE-07 | Magic number 900 used as breakpoint in JavaScript | Low | Code Quality | `scripts/scripts.js:85` | S |
| 39 | MAINT-03 | Dead code: empty fonts.css and lazy-styles.css with active loadFonts() | Low | Maintainability | `styles/fonts.css`, `styles/lazy-styles.css`, `scripts/scripts.js` | S |
| 40 | MAINT-04 | loadFonts() called twice: eager and lazy phases | Low | Maintainability | `scripts/scripts.js:86,110` | S |
| 41 | MAINT-05 | EDS boilerplate drift inventory | Low | Maintainability | Multiple | S |
| 42 | MAINT-06 | CSS custom properties incomplete: hardcoded max-width and spacing | Low | Maintainability | `blocks/speisen/speisen.css`, `blocks/hero/hero.css`, `styles/styles.css` | S |
| 43 | MAINT-09 | No CODEOWNERS file or branch protection | Low | Maintainability | `.github/` | S |
| 44 | PERF-08 | body { display: none } without JavaScript failure fallback | Low | Performance | `styles/styles.css:52-57`, `scripts/scripts.js:80` | S |
| 45 | A11Y-10 | Redundant title attributes on button links | Low | Accessibility | `scripts/aem.js:426` | S |
| 46 | A11Y-11 | Hero image text-over-image contrast depends on photo content | Low | Accessibility | `blocks/hero/hero.css:18-24` | S |
| 47 | SEC-02 | innerHTML in speisen.js with regex-extracted content | Low | Security | `blocks/speisen/speisen.js:25-27,80-81` | S |
| 48 | SEO-06 | 404 page in English on a German-language site | Low | SEO | `404.html:5,58-60` | S |
| 49 | TEST-06 | Unused sinon dependency | Low | Test Coverage | `package.json:33` | S |
| 50 | TEST-08 | No web-test-runner configuration file | Low | Test Coverage | `package.json:7` | S |
| 51 | UX-06 | Fixed nav uses width: 100vw causing horizontal scrollbar | Low | UX and Usability | `blocks/header/header.css:23` | S |
| 52 | UX-07 | 404 page provides minimal recovery paths | Low | UX and Usability | `404.html:53-63` | S |
| 53 | CODE-03 | innerHTML from fetch responses (trusted content injection) | Low | Code Quality | `blocks/header/header.js:31`, `blocks/footer/footer.js:17` | M |
| 54 | MAINT-08 | Outdated testing dependencies: sinon 14.x and chai 4.x | Low | Maintainability | `package.json:26-29` | M |
| 55 | PERF-05 | No AVIF format in createOptimizedPicture | Low | Performance | `scripts/aem.js:315-361` | M |
| 56 | PERF-06 | Oversized image breakpoints (2000px / 750px) | Low | Performance | `scripts/aem.js:319` | M |
| 57 | PERF-07 | No performance budget defined | Low | Performance | (project-wide) | M |
| 58 | SEC-04 | No Content Security Policy | Low | Security | `head.html:1-5` | M |
| 59 | TEST-05 | Module-scope setup prevents test isolation | Low | Test Coverage | `test/blocks/header/header.test.js`, `test/blocks/footer/footer.test.js` | M |
