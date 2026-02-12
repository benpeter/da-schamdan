# Phase 3: Synthesis -- Delegation Plan

## Delegation Plan

**Team name**: schamdan-code-review
**Description**: Comprehensive code review of schamdan.de (AEM Edge Delivery Services restaurant site) producing a structured report with findings and prioritized backlog.

---

### Design Decisions

**Report structure**: Following software-docs-minion's recommendation: hybrid Markdown at `docs/reviews/2026-02-11-comprehensive-code-review.md` with unique finding IDs (e.g., `A11Y-01`, `PERF-03`), severity/effort metadata tables per finding, and a flat prioritized backlog table at the end.

**Severity taxonomy**: 4-tier system aligned with the project's existing code-review skill:
- **Critical** (BLOCKING equivalent): Must fix -- broken functionality, security vulnerabilities, accessibility barriers
- **High**: Should fix soon -- performance regressions, significant quality gaps
- **Medium**: Should fix -- best practice violations, maintainability concerns
- **Low**: Consider fixing -- suggestions, minor improvements

**Effort estimates**: T-shirt sizes (S/M/L/XL) per finding for prioritization.

**ID namespace**: CODE-nn, PERF-nn, A11Y-nn, SEC-nn, SEO-nn, TEST-nn, MAINT-nn, UX-nn.

**Boilerplate handling**: Findings against unmodified AEM boilerplate files (`aem.js`, `cards/`, `columns/`, `footer/`, `fragment/`, `hero/`, `header/`) are labeled as boilerplate issues with recommendation "pull upstream update" or "accept as boilerplate pattern." Project-authored code (`speisen.js`, `speisen.css`, `dapreview.js`, customizations to `scripts.js`, `delayed.js`, `styles.css`, `head.html`, `404.html`) receives full review depth.

---

### Task 1: Create report skeleton with methodology and severity definitions

- **Agent**: software-docs-minion
- **Delegation type**: standard
- **Model**: sonnet
- **Mode**: default
- **Blocked by**: none
- **Approval gate**: no
- **Prompt**: |
    You are writing the skeleton for a comprehensive code review report for the schamdan.de restaurant website, an AEM Edge Delivery Services project.

    ## What to do

    Create the report file at `/Users/ben/github/benpeter/da-schamdan/docs/reviews/2026-02-11-comprehensive-code-review.md` with:

    1. **Document header**: Title "Comprehensive Code Review: schamdan.de", review date 2026-02-11, codebase snapshot commit SHA (run `git rev-parse HEAD` in `/Users/ben/github/benpeter/da-schamdan` to get it).

    2. **Executive Summary section**: Placeholder text "[To be completed after all findings are compiled]".

    3. **Severity Definitions section**: A table defining the 4-tier system:
       - Critical: Must fix -- security vulnerabilities, broken functionality, accessibility barriers blocking users. Backlog priority P0.
       - High: Should fix soon -- performance regressions, significant quality gaps, accumulating tech debt. Backlog priority P1.
       - Medium: Should fix -- best practice violations, maintainability concerns, moderate risk. Backlog priority P2.
       - Low: Consider fixing -- suggestions, minor improvements, polish. Backlog priority P3.

    4. **Effort Definitions**: S (< 1 hour), M (1-4 hours), L (4-16 hours), XL (> 16 hours).

    5. **Findings by Category sections**: Empty sections with headers for each category:
       - Code Quality (prefix: CODE)
       - Performance (prefix: PERF)
       - Accessibility (prefix: A11Y)
       - Security (prefix: SEC)
       - SEO (prefix: SEO)
       - Test Coverage (prefix: TEST)
       - UX and Usability (prefix: UX)
       - Maintainability (prefix: MAINT)

    6. **Codebase-Wide Patterns section**: Empty, with a note that cross-cutting patterns go here.

    7. **Prioritized Backlog section**: Empty table with headers: Priority | ID | Title | Severity | Category | Files | Effort.

    8. **Methodology section**: Document:
       - Scope: All website source code in the repository (HTML, CSS, JS, templates, configuration, CI/CD setup). Content accuracy and third-party service configurations outside the repo are excluded.
       - Tools used: ESLint (airbnb-base), Stylelint (standard), manual code review, static analysis.
       - Baseline: ESLint passes clean (0 violations). Stylelint passes clean (0 violations). Test suite: 13 tests, all passing, 77.13% overall coverage.
       - Boilerplate policy: Unmodified AEM boilerplate files (aem.js, standard block templates) are reviewed but findings are labeled as boilerplate issues.
       - Exclusions: `scripts/aem.js` internals (upstream Adobe code), `.skills/` and `.agents/` directories (development tooling), content authored in Document Authoring.
       - Finding format: Each finding has a unique ID (prefix-nn), metadata table (Severity, Category, Files, Effort), and three paragraphs (Problem, Evidence, Recommendation).

    9. **Finding template** (in Methodology): Show the exact template all reviewers must follow:

    ```markdown
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

    ## What NOT to do
    - Do not write any actual findings -- only the skeleton structure.
    - Do not add emoji anywhere in the file.
    - Do not create any other files.
    - Do not duplicate the code-review skill's checklists.

    First create the `docs/reviews/` directory if it does not exist, then write the file.

    ## Available Skills
    The following project skills are available for reference:
    - code-review: `/Users/ben/github/benpeter/da-schamdan/.skills/code-review/SKILL.md` (EDS code review checklists and severity taxonomy)
- **Deliverables**: `/Users/ben/github/benpeter/da-schamdan/docs/reviews/2026-02-11-comprehensive-code-review.md` (skeleton)
- **Success criteria**: File exists with all section headers, severity definitions, methodology, and finding template. No actual findings yet.

---

### Task 2: Code quality and maintainability review

- **Agent**: code-review-minion
- **Delegation type**: standard
- **Model**: sonnet
- **Mode**: default
- **Blocked by**: Task 1
- **Approval gate**: no
- **Prompt**: |
    You are conducting the Code Quality and Maintainability portion of a comprehensive code review for schamdan.de, an AEM Edge Delivery Services restaurant website.

    ## What to do

    Review all JavaScript and CSS files in the repository for code quality and maintainability issues. Write your findings directly into the report file at `/Users/ben/github/benpeter/da-schamdan/docs/reviews/2026-02-11-comprehensive-code-review.md`, populating the "Code Quality" and "Maintainability" sections.

    ### Files to review (read all of these):
    - `/Users/ben/github/benpeter/da-schamdan/scripts/scripts.js` -- site initialization, hero auto-block, loading phases
    - `/Users/ben/github/benpeter/da-schamdan/scripts/delayed.js` -- deferred operations
    - `/Users/ben/github/benpeter/da-schamdan/scripts/dapreview.js` -- DA preview loading
    - `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.js` -- restaurant menu block (most complex custom code, 154 lines)
    - `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.css` -- menu block styles
    - `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js` -- navigation block
    - `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.css` -- navigation styles
    - `/Users/ben/github/benpeter/da-schamdan/blocks/footer/footer.js` -- footer block
    - `/Users/ben/github/benpeter/da-schamdan/blocks/footer/footer.css` -- footer styles
    - `/Users/ben/github/benpeter/da-schamdan/blocks/cards/cards.js` -- cards block
    - `/Users/ben/github/benpeter/da-schamdan/blocks/cards/cards.css` -- cards styles
    - `/Users/ben/github/benpeter/da-schamdan/blocks/columns/columns.js` -- columns block
    - `/Users/ben/github/benpeter/da-schamdan/blocks/columns/columns.css` -- columns styles
    - `/Users/ben/github/benpeter/da-schamdan/blocks/fragment/fragment.js` -- fragment loader
    - `/Users/ben/github/benpeter/da-schamdan/blocks/fragment/fragment.css` -- fragment styles (may be empty)
    - `/Users/ben/github/benpeter/da-schamdan/blocks/hero/hero.css` -- hero styles
    - `/Users/ben/github/benpeter/da-schamdan/styles/styles.css` -- global styles and design tokens
    - `/Users/ben/github/benpeter/da-schamdan/styles/fonts.css` -- font loading (currently empty)
    - `/Users/ben/github/benpeter/da-schamdan/styles/lazy-styles.css` -- below-fold styles (currently empty)
    - `/Users/ben/github/benpeter/da-schamdan/head.html` -- HTML head content
    - `/Users/ben/github/benpeter/da-schamdan/404.html` -- error page
    - `/Users/ben/github/benpeter/da-schamdan/.eslintrc.json` -- ESLint config
    - `/Users/ben/github/benpeter/da-schamdan/.stylelintrc.json` -- Stylelint config
    - `/Users/ben/github/benpeter/da-schamdan/package.json` -- dependencies

    Also run linting to confirm the baseline:
    ```bash
    cd /Users/ben/github/benpeter/da-schamdan && npm run lint
    ```

    ### Review dimensions for Code Quality (prefix CODE):
    1. **eslint-disable audit**: Document all `eslint-disable` comments in project-owned files (not aem.js). For each one: location, rule disabled, and whether the justification is valid.
    2. **Error handling**: Which blocks/scripts have try/catch? Which silently fail? Which propagate errors?
    3. **DOM manipulation patterns**: Is innerHTML used safely? Are elements reused vs recreated?
    4. **Naming consistency**: CSS class naming patterns across blocks, variable naming in JS.
    5. **Hardcoded values**: Magic numbers, hardcoded pixel values that should be CSS variables, hardcoded strings that should be configurable.

    ### Review dimensions for Maintainability (prefix MAINT):
    1. **EDS boilerplate drift**: Which files are unmodified boilerplate vs. customized? Flag any divergence from standard EDS patterns. Catalog: aem.js (should be untouched), cards/, columns/, footer/, fragment/, header/, hero/ (boilerplate-origin), speisen/ and dapreview.js (project-specific).
    2. **Breakpoint consistency**: The code-review skill mandates 600px, 900px, 1200px breakpoints. The header uses 1000px. Document all breakpoints found.
    3. **CSS custom property completeness**: Are all colors, fonts, sizes using design tokens from `:root`? Any hardcoded values that should use variables?
    4. **Dependency health**: ESLint 8.x is EOL (October 2024). Document dependency freshness.
    5. **CI/CD assessment**: Review `.github/workflows/` for completeness (no npm caching, no coverage threshold, no Lighthouse CI).
    6. **Dead code**: Empty fonts.css, empty lazy-styles.css, unused `loadFonts()` function loading empty files.
    7. **SKILL.md consistency**: The testing-blocks SKILL.md references Vitest but the project uses @web/test-runner + chai. Flag this mismatch.

    ### Boilerplate labeling
    For findings in boilerplate files (header.js, footer.js, cards.js, columns.js, fragment.js, hero.css), add a note: "Note: This is AEM boilerplate code. Recommendation: Pull upstream update or accept as boilerplate pattern."

    ### Finding format
    Use the finding template from the report's Methodology section. Each finding needs: unique ID, severity, category, files with line numbers, effort estimate, Problem/Evidence/Recommendation paragraphs.

    ### Severity calibration
    - Critical: Active bugs, broken functionality. Expect 0-2 findings in this category.
    - High: Issues causing maintenance problems or technical debt accumulation. Expect 3-5.
    - Medium: Inconsistencies, missing best practices. Expect 5-10.
    - Low: Suggestions, modernization opportunities. Expect 3-8.

    ## What NOT to do
    - Do NOT modify any source code. This is a review, not an implementation task.
    - Do NOT review the internals of `scripts/aem.js` (upstream Adobe code). You may reference it for context.
    - Do NOT review `.skills/` or `.agents/` directories.
    - Do NOT touch sections of the report that are not Code Quality or Maintainability.
    - Do NOT add emoji.

    ## Available Skills
    - code-review: `/Users/ben/github/benpeter/da-schamdan/.skills/code-review/SKILL.md` (EDS review checklists and patterns)
    - building-blocks: `/Users/ben/github/benpeter/da-schamdan/.skills/building-blocks/SKILL.md` (EDS coding standards)
- **Deliverables**: Populated "Code Quality" and "Maintainability" sections in the report file
- **Success criteria**: Each finding has unique ID, severity, files, effort, and actionable recommendation. eslint-disable comments are individually audited. Boilerplate vs. custom code is clearly distinguished.

---

### Task 3: Performance review

- **Agent**: sitespeed-minion
- **Delegation type**: standard
- **Model**: sonnet
- **Mode**: default
- **Blocked by**: Task 1
- **Approval gate**: no
- **Prompt**: |
    You are conducting the Performance portion of a comprehensive code review for schamdan.de, an AEM Edge Delivery Services restaurant website.

    ## What to do

    Review the codebase for performance issues. Write your findings into the "Performance" section of the report at `/Users/ben/github/benpeter/da-schamdan/docs/reviews/2026-02-11-comprehensive-code-review.md`.

    ### Files to review (read all of these):
    - `/Users/ben/github/benpeter/da-schamdan/scripts/scripts.js` -- loading phases (eager/lazy/delayed), dapreview import, font loading
    - `/Users/ben/github/benpeter/da-schamdan/scripts/dapreview.js` -- dynamic import from da.live
    - `/Users/ben/github/benpeter/da-schamdan/scripts/delayed.js` -- deferred operations
    - `/Users/ben/github/benpeter/da-schamdan/scripts/aem.js` -- for context: createOptimizedPicture, waitForFirstImage, loadCSS, loadBlock
    - `/Users/ben/github/benpeter/da-schamdan/head.html` -- what loads in the critical path
    - `/Users/ben/github/benpeter/da-schamdan/styles/styles.css` -- body display:none pattern, design tokens
    - `/Users/ben/github/benpeter/da-schamdan/styles/fonts.css` -- empty file, still fetched
    - `/Users/ben/github/benpeter/da-schamdan/styles/lazy-styles.css` -- empty file, still fetched
    - `/Users/ben/github/benpeter/da-schamdan/blocks/hero/hero.css` -- LCP candidate styling, margin-top mismatch
    - `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.css` -- fixed nav height
    - `/Users/ben/github/benpeter/da-schamdan/blocks/cards/cards.js` -- image optimization usage
    - `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.js` -- menu block DOM manipulation
    - `/Users/ben/github/benpeter/da-schamdan/404.html` -- loads full JS pipeline unnecessarily

    ### Key findings from planning (verify and document these):
    1. **dapreview.js critical path bottleneck** (HIGH): `scripts.js` unconditionally imports `dapreview.js` at the top of `loadEager()`. Every visitor pays the import cost even though `?dapreview` is never present in production. The import should be gated behind a URL parameter check BEFORE the import.
    2. **Empty fonts.css and lazy-styles.css** (MEDIUM): Two empty files fetched on every page load via loadCSS. Each adds a network request with no benefit. The `loadFonts()` function and its two call sites are dead code.
    3. **Hero image missing fetchpriority="high"** (MEDIUM-HIGH): `waitForFirstImage()` in aem.js sets `loading="eager"` but not `fetchpriority="high"`. Adding fetchpriority can improve LCP by 100-400ms.
    4. **Hero margin-top: 80px vs --nav-height: 64px mismatch** (MEDIUM): The hero CSS uses hardcoded `margin-top: 80px` but the nav height variable is 64px. This 16px discrepancy may cause layout issues.
    5. **No performance budget defined** (LOW): No Lighthouse CI configuration, no budget enforcement.
    6. **body { display: none } risk** (LOW): Standard EDS pattern, but if JS fails before `appear` class is added, the page is permanently invisible. The dapreview.js import sits in the error path.
    7. **Image optimization gaps** (LOW): No AVIF support in createOptimizedPicture, 2000px desktop breakpoint may be oversized for content areas capped at 900-1200px.

    ### Finding format
    Use the finding template from the report's Methodology section. Prefix: PERF. Each finding needs unique ID (PERF-01, PERF-02, etc.), severity, files with line numbers, effort estimate, Problem/Evidence/Recommendation.

    For findings related to aem.js internals (like fetchpriority and image breakpoints), note: "This involves aem.js (upstream boilerplate). Consider whether to modify locally or override in block-specific code."

    ### Severity calibration
    - dapreview.js in critical path: HIGH (affects every page load)
    - Empty CSS files fetched: MEDIUM (unnecessary network requests)
    - Missing fetchpriority: MEDIUM (missed LCP optimization)
    - margin-top mismatch: MEDIUM (potential CLS)
    - No performance budget: LOW (nice-to-have)
    - body display:none risk: LOW (standard pattern, edge case)
    - Image optimization gaps: LOW (aem.js upstream concern)

    ## What NOT to do
    - Do NOT modify any source code. Document findings only.
    - Do NOT run Lighthouse against the live site (code review only).
    - Do NOT touch other sections of the report.
    - Do NOT add emoji.
- **Deliverables**: Populated "Performance" section in the report
- **Success criteria**: Each finding has PERF-nn ID, severity, files, effort, and specific recommendation. The dapreview.js bottleneck is the top finding.

---

### Task 4: Accessibility review

- **Agent**: accessibility-minion
- **Delegation type**: standard
- **Model**: sonnet
- **Mode**: default
- **Blocked by**: Task 1
- **Approval gate**: no
- **Prompt**: |
    You are conducting the Accessibility portion of a comprehensive code review for schamdan.de, an AEM Edge Delivery Services restaurant website.

    ## What to do

    Review the codebase for WCAG 2.2 Level AA accessibility violations. Write your findings into the "Accessibility" section of the report at `/Users/ben/github/benpeter/da-schamdan/docs/reviews/2026-02-11-comprehensive-code-review.md`.

    ### Files to review (read all of these):
    - `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js` -- hamburger navigation (lines 53-61: div without button role/keyboard/ARIA), nav section dropdowns (lines 42-49: click-only, no keyboard)
    - `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.css` -- hamburger sizing, overlay-color variable
    - `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.js` -- menu data in divs with no table semantics
    - `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.css` -- grid layout, no responsive breakpoint, no .price-header styling
    - `/Users/ben/github/benpeter/da-schamdan/styles/styles.css` -- focus indicators, link text-decoration:none, color contrast values
    - `/Users/ben/github/benpeter/da-schamdan/scripts/aem.js` -- decorateIcon (line ~472: alt="" default), decorateButtons (line ~426: redundant title)
    - `/Users/ben/github/benpeter/da-schamdan/scripts/scripts.js` -- lang attribute set via JS (line 72)
    - `/Users/ben/github/benpeter/da-schamdan/404.html` -- missing lang attribute, English text on German site
    - `/Users/ben/github/benpeter/da-schamdan/blocks/hero/hero.css` -- background image pattern, z-index:-1

    ### Key findings from planning (verify and document these):

    **Critical (Level A violations):**
    1. **Hamburger button** (SC 4.1.2, 2.1.1): `div.nav-hamburger` has no accessible name, no button role, no keyboard operability. `aria-expanded` is on the `<nav>` instead of the control.
    2. **Nav dropdown keyboard** (SC 2.1.1): Nav sections use only click handlers on `<li>` elements. No keydown/keypress handlers. No Escape key to close.
    3. **Speisen table semantics** (SC 1.3.1): Restaurant menu data (item numbers, names, descriptions, sizes, prices) rendered as CSS Grid of `<div>` elements. No table/ARIA table roles. Screen readers hear disconnected text fragments.

    **Serious (Level A/AA violations):**
    4. **No skip-nav link** (SC 2.4.1): No skip navigation link. Fixed nav requires tabbing through all items to reach content.
    5. **Missing focus indicators** (SC 2.4.13, 2.4.7): No `:focus-visible` styles. Links have `text-decoration: none` (rely on color only). Button `:focus` changes background-color to same as default.
    6. **Icon alt text** (SC 1.1.1): `decorateIcon()` defaults `alt=""` for all icons. Icons as sole content of interactive elements are invisible to screen readers.
    7. **404 missing lang** (SC 3.1.1): `<html>` without `lang` attribute. Content in English on a German site.
    8. **Color contrast** (SC 1.4.3): #492000 on rgb(240 240 220) needs verification. Hero overlay at 30% opacity may reduce contrast.
    9. **Hamburger touch target** (SC 2.5.8): Icon is 20x22px, below 24x24px minimum.

    **Important:**
    10. **Redundant title attributes** (SC 2.4.4): `decorateButtons()` sets `a.title = a.title || a.textContent`, causing double announcements.
    11. **No ARIA landmarks on nav** (SC 1.3.1): `<nav>` element lacks `aria-label`.

    ### Finding format
    Use the finding template from the report's Methodology section. Prefix: A11Y. Each finding needs unique ID (A11Y-01, A11Y-02, etc.), severity, files with line numbers, effort estimate, Problem/Evidence/Recommendation. Include the specific WCAG 2.2 success criterion in each finding's Problem paragraph.

    For findings in aem.js (icon alt text, redundant titles), note: "This is AEM boilerplate code. Consider wrapping fixes in scripts.js rather than modifying aem.js directly."

    ### Severity calibration
    - Hamburger inaccessible, nav keyboard, speisen semantics: Critical (assistive tech users completely blocked)
    - Skip-nav, focus indicators, icon alt: High (degraded experience)
    - 404 lang, contrast, touch targets, landmarks: Medium
    - Redundant titles: Low

    ## What NOT to do
    - Do NOT modify any source code. Document findings only.
    - Do NOT run automated accessibility tools (axe, Lighthouse). This is a code-level review.
    - Do NOT touch other sections of the report.
    - Do NOT add emoji.
- **Deliverables**: Populated "Accessibility" section in the report
- **Success criteria**: Each finding cites the specific WCAG 2.2 success criterion, includes exact file/line references, and has a concrete remediation recommendation.

---

### Task 5: Security and SEO review

- **Agent**: security-minion
- **Delegation type**: standard
- **Model**: sonnet
- **Mode**: default
- **Blocked by**: Task 1
- **Approval gate**: no
- **Prompt**: |
    You are conducting the Security AND SEO portions of a comprehensive code review for schamdan.de, an AEM Edge Delivery Services restaurant website.

    ## What to do

    Review the codebase for security concerns and SEO gaps. Write your findings into BOTH the "Security" and "SEO" sections of the report at `/Users/ben/github/benpeter/da-schamdan/docs/reviews/2026-02-11-comprehensive-code-review.md`.

    ### Files to review (read all of these):
    - `/Users/ben/github/benpeter/da-schamdan/scripts/dapreview.js` -- loads remote script from da.live based on URL param
    - `/Users/ben/github/benpeter/da-schamdan/scripts/scripts.js` -- unconditional dapreview import in loadEager
    - `/Users/ben/github/benpeter/da-schamdan/scripts/delayed.js` -- external link handling (noopener noreferrer)
    - `/Users/ben/github/benpeter/da-schamdan/scripts/aem.js` -- readBlockConfig, decorateButtons, for context
    - `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js` -- innerHTML from fetch
    - `/Users/ben/github/benpeter/da-schamdan/blocks/footer/footer.js` -- innerHTML from fetch
    - `/Users/ben/github/benpeter/da-schamdan/blocks/fragment/fragment.js` -- innerHTML from fetch, path validation
    - `/Users/ben/github/benpeter/da-schamdan/blocks/cards/cards.js` -- innerHTML DOM copy
    - `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.js` -- innerHTML with regex-extracted content (lines 27, 80-81)
    - `/Users/ben/github/benpeter/da-schamdan/head.html` -- no CSP, no structured data, placeholder favicon
    - `/Users/ben/github/benpeter/da-schamdan/404.html` -- referrer handling, English on German site
    - `/Users/ben/github/benpeter/da-schamdan/helix-query.yaml` -- site index properties
    - `/Users/ben/github/benpeter/da-schamdan/fstab.yaml` -- content source
    - `/Users/ben/github/benpeter/da-schamdan/tools/sidekick/config.json` -- production host
    - `/Users/ben/github/benpeter/da-schamdan/package.json` -- dependencies

    ### SECURITY findings (prefix SEC):

    1. **dapreview.js loads remote script without environment guard** (MEDIUM): Any visitor can trigger remote script loading by appending `?dapreview=anything` to any URL. The script from `https://da.live/scripts/dapreview.js` loads with no SRI hash, no hostname guard. This is a standard DA pattern but should be restricted to non-production environments.
    2. **innerHTML in speisen.js with regex-extracted content** (LOW): `sizesEl.innerHTML` and `pricesEl.innerHTML` interpolate regex capture groups. Also `headerCellHTML()` interpolates `rest` without encoding. Low risk (author-controlled content) but defense-in-depth suggests using escapeHTML.
    3. **innerHTML pattern from fetch (informational)**: header.js, footer.js, fragment.js all fetch `.plain.html` and assign to innerHTML. This is standard EDS practice with same-origin constraints. Document the trust model: content comes from DA authoring pipeline, not user input.
    4. **No Content Security Policy** (LOW): No CSP meta tag in head.html. EDS may configure this at CDN level, but no client-side fallback exists.
    5. **Missing security headers** (LOW/INFORMATIONAL): Verify HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy at CDN level. Note: this is informational since these are typically CDN-configured in EDS.
    6. **External link handling is correct** (POSITIVE): delayed.js correctly adds `noopener noreferrer` to external links. Document as positive finding.
    7. **Zero runtime npm dependencies** (POSITIVE): Excellent supply chain posture. Document as positive finding.

    ### SEO findings (prefix SEO):

    1. **No structured data** (HIGH): Zero JSON-LD or schema.org markup. A restaurant website should have Restaurant/LocalBusiness schema (address, hours, phone, cuisine, menu URL). This is the single highest-value SEO improvement.
    2. **No Menu structured data** (HIGH): The speisen block renders a full restaurant menu but does not generate Menu/MenuItem schema. This data could drive rich results.
    3. **Placeholder favicon** (MEDIUM): `<link rel="icon" href="data:,">` suppresses favicon requests but means no favicon in browser tabs, bookmarks, or Google mobile SERPs.
    4. **Missing default-meta-image.png** (MEDIUM): EDS falls back to `/default-meta-image.png` for og:image when no page-specific image is set. This file does not exist in the content root.
    5. **helix-query.yaml missing image property** (MEDIUM): No `image` property indexed, limiting image sitemap capabilities.
    6. **404 page in English** (LOW): "Page Not Found", "Go home", "Go back" on a German-language site. Should be localized.
    7. **EDS handles automatically** (INFORMATIONAL): Document what EDS handles: robots.txt, XML sitemap, canonical tags, OG/Twitter cards from DA metadata, title tags. These are NOT in-repo concerns.

    ### Finding format
    Use the finding template from the report's Methodology section. Each finding needs unique ID, severity, files with line numbers, effort estimate, Problem/Evidence/Recommendation.

    For positive findings (external links, zero deps), use a slightly modified format: replace "Problem" with "Positive Finding" and "Recommendation" with "Maintain".

    ### Severity calibration
    Security: dapreview.js MEDIUM, speisen innerHTML LOW, no CSP LOW, all others LOW/INFORMATIONAL.
    SEO: No structured data HIGH, no menu schema HIGH, favicon MEDIUM, meta-image MEDIUM, query-index MEDIUM, 404 English LOW.

    ## What NOT to do
    - Do NOT modify any source code. Document findings only.
    - Do NOT scan the live site for security headers (code review only). Recommend verification as a follow-up task.
    - Do NOT touch other sections of the report.
    - Do NOT add emoji.
- **Deliverables**: Populated "Security" and "SEO" sections in the report
- **Success criteria**: Security findings clearly document the trust model for innerHTML. SEO findings identify structured data as the top gap. Each finding has actionable recommendations.

---

### Task 6: Test coverage and UX review

- **Agent**: test-minion
- **Delegation type**: standard
- **Model**: sonnet
- **Mode**: default
- **Blocked by**: Task 1
- **Approval gate**: no
- **Prompt**: |
    You are conducting the Test Coverage AND UX/Usability portions of a comprehensive code review for schamdan.de, an AEM Edge Delivery Services restaurant website.

    ## What to do

    Review the test suite and UX patterns. Write your findings into BOTH the "Test Coverage" and "UX and Usability" sections of the report at `/Users/ben/github/benpeter/da-schamdan/docs/reviews/2026-02-11-comprehensive-code-review.md`.

    ### Files to review for Test Coverage:

    First, run the test suite:
    ```bash
    cd /Users/ben/github/benpeter/da-schamdan && npm test
    ```

    Then read:
    - `/Users/ben/github/benpeter/da-schamdan/test/scripts/scripts.test.js` -- 1 test (window.hlx check only)
    - `/Users/ben/github/benpeter/da-schamdan/test/scripts/block-utils.test.js` -- 7 tests (aem.js utilities)
    - `/Users/ben/github/benpeter/da-schamdan/test/blocks/header/header.test.js` -- 2 tests (hamburger, section expand)
    - `/Users/ben/github/benpeter/da-schamdan/test/blocks/footer/footer.test.js` -- 1 test (footer link)
    - `/Users/ben/github/benpeter/da-schamdan/test/blocks/hero/hero.test.js` -- 1 test (hero build)
    - `/Users/ben/github/benpeter/da-schamdan/coverage/lcov.info` -- coverage data (if exists after test run)
    - `/Users/ben/github/benpeter/da-schamdan/package.json` -- test runner config
    - `/Users/ben/github/benpeter/da-schamdan/.github/workflows/` -- CI pipeline

    ### Files to review for UX:
    - `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js` -- hamburger behavior
    - `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.css` -- undefined --overlay-color, width:100vw
    - `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.js` -- menu grid
    - `/Users/ben/github/benpeter/da-schamdan/blocks/speisen/speisen.css` -- no responsive breakpoint, no .price-header styling
    - `/Users/ben/github/benpeter/da-schamdan/styles/styles.css` -- breakpoints at 600px, 900px
    - `/Users/ben/github/benpeter/da-schamdan/404.html` -- minimal recovery paths

    ### TEST COVERAGE findings (prefix TEST):

    1. **77% coverage is misleading** (HIGH): The overall 77.13% is dominated by aem.js side effects. Custom project code (speisen.js, fragment.js, scripts.js functions, delayed.js, dapreview.js, cards.js, columns.js) has effectively 0% direct test coverage. The review should present coverage as "custom code tested vs. not tested."
    2. **Speisen block has zero tests** (HIGH): The most complex custom code (154 lines, regex parsing, multiple code paths) has no test coverage at all. This is the single highest-priority test gap.
    3. **sleep(1000) flakiness** (MEDIUM): header.test.js and footer.test.js use hardcoded `sleep(1000)` after `loadBlock()`. This is a latent flakiness source in CI.
    4. **Shallow assertions** (MEDIUM): hero.test.js only checks element existence. footer.test.js tests fixture data, not decoration logic. scripts.test.js only checks window.hlx exists.
    5. **Module-scope setup** (LOW): Tests perform setup at module scope rather than in before/beforeEach hooks. Fragile pattern.
    6. **Unused sinon dependency** (LOW): sinon v14.0.1 in devDependencies, never imported.
    7. **No coverage threshold in CI** (MEDIUM): Coverage is measured but not gated. No npm caching in CI either.
    8. **SKILL.md/test stack mismatch** (LOW): testing-blocks SKILL.md references Vitest but project uses @web/test-runner + chai.

    ### UX findings (prefix UX):

    1. **Undefined --overlay-color CSS variable** (HIGH): header.css line 124 uses `var(--overlay-color)` but this variable is never defined. The defined variable is `--overlay-background-color`. Mobile nav sections render with transparent background, breaking readability over page content.
    2. **Speisen block has no responsive breakpoint** (HIGH): Zero `@media` queries in speisen.css. On 320px mobile, the 5-column grid compresses to ~288px content area. The menu is the restaurant's core content and is currently unusable on small phones.
    3. **No .price-header CSS styling** (MEDIUM): Menu section headers (e.g., "Vorspeisen", "Hauptgerichte") get the `.price-header` class in JS but have no CSS differentiation. Users cannot visually scan menu categories.
    4. **Header breakpoint at 1000px, content breakpoints at 900px** (MEDIUM): The 900px-999px range uses desktop content sizing but still shows mobile hamburger nav. Inconsistent experience.
    5. **No mobile nav dismiss behaviors** (MEDIUM): No Escape key, no click-outside-to-close, no close-on-navigate. Missing standard "emergency exit" patterns.
    6. **width: 100vw on fixed nav** (LOW): Causes horizontal scrollbar on browsers with layout-consuming scrollbars. Should be width: 100%.
    7. **404 page minimal recovery** (LOW): Only "Go home" and conditional "Go back". Missing direct links to menu and contact pages.

    ### Finding format
    Use the finding template from the report's Methodology section. Each finding needs unique ID, severity, files with line numbers, effort estimate, Problem/Evidence/Recommendation.

    For test findings, use the keeper/throwaway taxonomy from the project's testing philosophy: recommend keeper tests for logic-heavy code (speisen.js parsing), throwaway browser tests for DOM decoration (cards, columns).

    ## What NOT to do
    - Do NOT modify any source code or tests. Document findings only.
    - Do NOT write actual tests. Recommend what tests to write.
    - Do NOT touch other sections of the report.
    - Do NOT add emoji.

    ## Available Skills
    - testing-blocks: `/Users/ben/github/benpeter/da-schamdan/.skills/testing-blocks/SKILL.md` (test philosophy and keeper/throwaway taxonomy)
- **Deliverables**: Populated "Test Coverage" and "UX and Usability" sections in the report
- **Success criteria**: Test findings clearly distinguish custom code coverage from overall coverage. UX findings identify the undefined CSS variable and speisen responsive gap as top issues.

---

### Task 7: Compile backlog, write executive summary, and final consistency check

- **Agent**: software-docs-minion
- **Delegation type**: standard
- **Model**: sonnet
- **Mode**: default
- **Blocked by**: Task 2, Task 3, Task 4, Task 5, Task 6
- **Approval gate**: yes
- **Gate reason**: The complete report is the primary deliverable. User should review the compiled report before it is considered final. This is a MUST gate: hard to reverse (report becomes the reference document) and high blast radius (no downstream tasks, but it is the entire outcome of this project).
- **Prompt**: |
    You are finalizing the comprehensive code review report for schamdan.de.

    ## What to do

    Read the complete report at `/Users/ben/github/benpeter/da-schamdan/docs/reviews/2026-02-11-comprehensive-code-review.md`. All category sections have been populated by specialist reviewers. You need to:

    ### Step 1: Add the Codebase-Wide Patterns section

    Review all findings across all categories and identify patterns that appear in multiple files or categories. Move these into the "Codebase-Wide Patterns" section (not duplicating but cross-referencing by finding ID). Examples of cross-cutting patterns:
    - innerHTML usage across multiple blocks (reference SEC and CODE findings)
    - Missing responsive breakpoints (reference UX and A11Y findings)
    - Boilerplate drift patterns (reference MAINT findings)
    - Missing error handling across blocks (reference CODE findings)

    ### Step 2: Compile the Prioritized Backlog table

    Extract every finding from all category sections and compile them into the flat backlog table at the end of the report. Apply these priority ordering rules:
    1. Critical severity first, regardless of effort
    2. Within same severity: Small effort before Large effort (quick wins first)
    3. Within same severity and effort: group by category

    The table format:
    | Priority | ID | Title | Severity | Category | Files | Effort |
    |----------|----|-------|----------|----------|-------|--------|

    Assign sequential priority numbers (1, 2, 3...).

    ### Step 3: Write the Executive Summary

    Replace the placeholder text with:
    1. A finding count table: X Critical, Y High, Z Medium, W Low
    2. Top 3 priority areas with brief rationale (1-2 sentences each)
    3. Overall codebase health assessment (3-5 sentences). The site is a small restaurant site on EDS with good baseline hygiene (clean linting, zero runtime deps) but significant gaps in accessibility, mobile usability, and SEO structured data.
    4. One-sentence "what to do next" recommendation

    ### Step 4: Final consistency check

    Read the entire report end-to-end and verify:
    - All finding IDs are unique and follow the prefix convention (CODE-nn, PERF-nn, etc.)
    - All referenced file paths actually exist (spot-check 5-10 file paths by reading them)
    - Severity labels are consistent (Critical/High/Medium/Low only, no "BLOCKING" or other variants)
    - The backlog table matches the findings sections exactly (no orphans, no missing entries)
    - Effort estimates are present for all findings
    - Recommendations are specific and actionable (flag any that say just "improve this" or "fix this")
    - No emoji anywhere in the report
    - Markdown renders correctly (tables aligned, code blocks closed, details tags matched)
    - Positive findings (if any) are clearly marked as such

    ### Step 5: Normalize severity if needed

    If any category has more than 5 Critical findings, re-evaluate. Critical means "the site is broken, insecure, or inaccessible NOW." For a small restaurant site with 10-15 total JS/CSS files, expect 2-4 Critical findings total across all categories. If there are more, some should probably be High.

    ## What NOT to do
    - Do NOT modify the individual findings (wording, severity, recommendations) unless there is an objective inconsistency (e.g., duplicate IDs, contradictory severities for the same issue).
    - Do NOT add new findings. You are compiling, not reviewing.
    - Do NOT add emoji.
    - Do NOT remove positive findings.
- **Deliverables**: Complete, consistent report with executive summary, cross-cutting patterns, and prioritized backlog
- **Success criteria**: Every finding appears in both its category section and the backlog table. Executive summary accurately reflects the finding counts. File paths are verified. No formatting issues.

---

### Cross-Cutting Coverage

| Dimension | Covered by | Justification |
|-----------|-----------|---------------|
| **Testing** | Task 6 (TEST findings) | Test suite quality and coverage gaps documented |
| **Security** | Task 5 (SEC findings) | innerHTML trust model, dapreview.js, CSP documented |
| **Usability -- Strategy** | Task 6 (UX findings) | Navigation, menu browsing, error recovery reviewed |
| **Usability -- Design** | Task 4 (A11Y findings) + Task 6 (UX findings) | WCAG compliance and visual usability covered |
| **Documentation** | Task 1 + Task 7 (report structure and compilation) | The review report IS the documentation deliverable |
| **Observability** | Excluded | No runtime components being created. This is a static site review producing a report, not a deployed service. |

---

### Architecture Review Agents

- **Always**: security-minion (covered in Task 5), test-minion (covered in Task 6), ux-strategy-minion (covered in Task 6 UX section), software-docs-minion (covered in Tasks 1 and 7), lucy, margo
- **Conditional**: None triggered. No runtime components, no web-facing UI being built (this is a review, not implementation).

**Note on Phase 3.5**: lucy and margo should review this delegation plan for intent alignment and simplicity. Specifically:
- **lucy**: Verify the plan aligns with the user's intent (comprehensive code review producing report + backlog, not implementation).
- **margo**: Verify the plan is not over-engineered. 7 tasks for a code review report is reasonable given the 8 specialist domains being consolidated. The alternative (fewer, larger tasks) would create file contention on the report.

---

### Conflict Resolutions

1. **Severity calibration across specialists**: Each specialist naturally rates their domain findings as high severity. Resolution: Task 7 includes severity normalization step with a cap of 2-4 Critical findings total. Critical means "broken NOW," not "important to fix."

2. **innerHTML findings overlap**: code-review-minion, security-minion, and accessibility-minion all flag innerHTML usage but from different angles. Resolution: Security section documents the trust model and specific innerHTML risks. Code Quality section documents it as a code pattern. Accessibility section documents it where innerHTML creates semantic issues (speisen block). The Codebase-Wide Patterns section (Task 7) will cross-reference all three perspectives.

3. **dapreview.js: performance vs. security**: sitespeed-minion flags it as a critical-path performance bottleneck; security-minion flags it as an environment guard concern. Resolution: Two separate findings (PERF for performance, SEC for security) since they have different recommendations (gate behind URL param check vs. gate behind hostname check). The optimal fix addresses both: check hostname first (security), then check URL param before import (performance).

4. **Speisen block: accessibility vs. UX**: accessibility-minion wants table semantics; ux-strategy-minion wants responsive breakpoints and header styling. Resolution: These are separate findings in different categories. The backlog table will show both as high priority. They can be addressed in the same implementation sprint since they both modify speisen.js/speisen.css.

5. **aem.js modification policy**: Multiple specialists recommend modifying aem.js (fetchpriority, icon alt text, redundant titles, AVIF support). Resolution: All findings note "This is AEM boilerplate code" and recommend considering overrides in scripts.js or per-block code rather than modifying aem.js directly, consistent with the project's code-review skill.

6. **SKILL.md Vitest vs. @web/test-runner**: test-minion flagged this. Resolution: Documented as a MAINT finding (test stack mismatch between documentation and reality). Recommendation: update SKILL.md to reference the actual stack.

---

### Risks and Mitigations

1. **Report file contention**: Tasks 2-6 all write to the same report file. Mitigation: Each task writes only to its designated sections. Task 1 creates the skeleton with clear section boundaries. Tasks 2-6 run in parallel but write to different sections. If file locking is an issue, tasks can be sequenced in two batches: (2,3) then (4,5,6).

2. **Severity inflation**: Multiple specialists each rating their findings as Critical. Mitigation: Task 7 includes severity normalization with explicit cap guidance.

3. **Scope creep to implementation**: Reviewers may want to fix issues as they find them. Mitigation: Every task prompt explicitly states "Do NOT modify any source code. Document findings only."

4. **Boilerplate false positives**: Findings against unmodified AEM boilerplate code may not be actionable. Mitigation: Every task prompt requires labeling boilerplate findings. The backlog separates boilerplate recommendations from project-specific fixes.

5. **Missing live site data**: Some findings (CWV, contrast ratios, screen reader behavior) cannot be fully validated without live testing. Mitigation: Report Methodology section documents this limitation. Findings are based on code analysis with recommendations for live testing as follow-up.

---

### Execution Order

```
Batch 1 (parallel: 0 dependencies):
  Task 1: Create report skeleton

Batch 2 (parallel: all depend on Task 1):
  Task 2: Code quality + maintainability review
  Task 3: Performance review
  Task 4: Accessibility review
  Task 5: Security + SEO review
  Task 6: Test coverage + UX review

  [GATE: All Batch 2 tasks must complete]

Batch 3 (sequential: depends on all of Batch 2):
  Task 7: Compile backlog + executive summary + consistency check

  [APPROVAL GATE: User reviews final report]
```

---

### External Skills

| Skill | Classification | Tasks Using |
|-------|---------------|-------------|
| code-review | LEAF | Task 2 (reference for EDS review checklists and severity taxonomy) |
| testing-blocks | LEAF | Task 6 (reference for keeper/throwaway test taxonomy) |
| building-blocks | LEAF | Task 2 (reference for EDS coding standards) |

---

### Verification Steps

After Task 7 completes and the approval gate passes:

1. **Report completeness**: Verify all 8 category sections have findings (none are empty).
2. **Backlog integrity**: Count findings in category sections vs. backlog rows -- numbers must match.
3. **File existence**: Spot-check 5 file paths from findings to confirm they exist in the repo.
4. **Actionability**: Pick 3 random backlog items and verify each could be turned into a standalone GitHub Issue with enough context to act on.
5. **Report file location**: Confirm `docs/reviews/2026-02-11-comprehensive-code-review.md` exists and renders correctly in Markdown preview.
