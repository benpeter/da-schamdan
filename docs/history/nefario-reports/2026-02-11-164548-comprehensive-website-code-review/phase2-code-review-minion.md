# Domain Plan Contribution: code-review-minion

## Recommendations

### (a) Review Categories Beyond the Existing Skill

The project's `.skills/code-review/SKILL.md` is comprehensive for per-PR review (JS, CSS, HTML, performance, content/authoring, security). However, a **comprehensive codebase-wide review** differs from a per-PR review in important ways. The existing skill is optimized for incremental change validation ("does this PR make things worse?"), not for assessing overall codebase health. The comprehensive review should cover these additional dimensions:

#### 1. EDS Boilerplate Drift (NEW CATEGORY)

This is the most impactful category specific to AEM Edge Delivery Services projects. The codebase was forked from the EDS boilerplate (`aem-boilerplate`), and blocks like cards, columns, header, footer, hero, and fragment are boilerplate-standard. Over time, customizations accumulate and the boilerplate diverges from upstream. A comprehensive review should:

- **Catalog which files are unmodified boilerplate** vs. customized. Currently: `scripts/aem.js` (should be untouched upstream), `blocks/cards/`, `blocks/columns/`, `blocks/footer/`, `blocks/fragment/`, `blocks/header/`, `blocks/hero/` are all boilerplate-origin. Only `blocks/speisen/` and `scripts/dapreview.js` are project-specific.
- **Flag any `aem.js` modifications** -- the skill already checks this per-PR, but a comprehensive review should verify the file is pristine.
- **Assess header/footer customization level** -- are customizations minimal and clean, or have they drifted significantly from boilerplate patterns?
- **Identify boilerplate updates not yet pulled** -- compare against current upstream `aem-boilerplate`.

#### 2. Cross-Cutting Consistency (NEW CATEGORY)

Per-PR review checks individual files. A comprehensive review should check cross-file consistency:

- **CSS custom property usage**: Are all colors, fonts, sizes using the design tokens defined in `:root`? Or are there hardcoded values (`8px`, `16px`, magic numbers) that should use variables?
- **Breakpoint consistency**: The skill mandates `600px`, `900px`, `1200px` breakpoints. The header uses `1000px` (non-standard). Are all breakpoints consistent?
- **Naming conventions**: Are CSS class naming patterns consistent across blocks? Some use `item-nr`, `item-info` (speisen), others use `cards-card-body`, `cards-card-image` (cards).
- **Error handling patterns**: Some blocks silently ignore errors, others log to console. Is there a consistent pattern?

#### 3. Accessibility Audit (DEEPER THAN EXISTING)

The skill has a one-line checkbox for accessibility. A comprehensive review should go deeper:

- **ARIA usage**: The header uses `aria-expanded` for navigation (good), but is the hamburger button keyboard-accessible? Does it have an accessible label?
- **Heading hierarchy**: Is `h1` used only once per page? Does the heading flow make semantic sense?
- **Focus management**: When the mobile nav opens, does focus move appropriately?
- **Color contrast**: The color scheme (brown text on beige background) needs contrast ratio verification.
- **Link text quality**: Are there "click here" or empty link texts?

#### 4. Test Coverage Assessment (NEW CATEGORY)

The skill does not audit test coverage depth. The comprehensive review should:

- **Map test coverage**: Which blocks have tests? Currently: header, hero, footer, and aem.js utilities have tests. Blocks without tests: `cards`, `columns`, `speisen` (the custom block), `fragment`.
- **Assess test quality**: The existing tests are minimal smoke tests (check DOM element existence), not behavioral tests.
- **Identify critical untested paths**: The `speisen` block is the most complex custom code and has zero tests.

#### 5. Build/Tooling Health (NEW CATEGORY)

- **Dependency freshness**: ESLint 8.x is installed; ESLint 9.x has been out for over a year. Stylelint 17.x is installed; current is 16.x+ (actually 17 is fine). `@babel/eslint-parser` is used -- is it necessary or can the project use the default parser?
- **CI/CD adequacy**: GitHub Actions runs lint + test on PRs. No Lighthouse CI, no automated accessibility checks, no branch protection rules visible.
- **npm scripts**: The `lint:css` glob only covers `blocks/**/*.css` and `styles/*.css` -- are there other CSS files that should be linted?

#### 6. Content Model & Authoring Quality (DEEPER THAN EXISTING)

- **Speisen block content model robustness**: How does it handle malformed input? Empty rows? Missing columns? The regex `PRICE_RE` has specific expectations -- what happens when content authors deviate?
- **Fragment loading**: The fragment block sets `innerHTML` from fetched HTML -- is this consistent with EDS security practices?

### Proposed Review Category Structure

I recommend organizing the comprehensive report into these categories, ordered by impact:

| # | Category | Scope | New vs. Existing Skill |
|---|----------|-------|------------------------|
| 1 | **Linting Baseline** | Run ESLint + Stylelint, document clean/violation state | Existing (automated) |
| 2 | **JavaScript Quality** | Code patterns, complexity, error handling, DOM manipulation | Existing (deeper) |
| 3 | **CSS Quality** | Scoping, specificity, responsiveness, design token usage | Existing (deeper) |
| 4 | **EDS Pattern Compliance** | Boilerplate drift, aem.js integrity, block architecture | Partially new |
| 5 | **Cross-Cutting Consistency** | Naming, breakpoints, hardcoded values, error patterns | New |
| 6 | **Performance** | LCP impact, critical path, lazy loading, font strategy | Existing (deeper) |
| 7 | **Accessibility** | ARIA, keyboard nav, contrast, semantic HTML, focus mgmt | Existing (much deeper) |
| 8 | **Security** | innerHTML usage, external resource loading, CSP | Existing |
| 9 | **Test Coverage** | Coverage map, test quality, untested critical paths | New |
| 10 | **Build & Tooling** | Dependency health, CI/CD, linter config adequacy | New |
| 11 | **Content Model Robustness** | Edge cases, error resilience, author experience | Existing (deeper) |

### (b) Severity Classification for Actionable Backlog

I recommend a 4-tier severity system that maps directly to backlog priority. The existing skill uses 3 tiers (Must Fix / Should Fix / Consider), but for a comprehensive review producing a backlog rather than a PR gatekeep, we need a slightly different model:

#### Tier 1: CRITICAL (Fix immediately)
- **Definition**: Active bugs, security vulnerabilities, broken functionality, accessibility barriers that block users.
- **Backlog priority**: P0 -- address before any new feature work.
- **Examples**: XSS via innerHTML, broken navigation for keyboard users, hardcoded secrets, production console errors.

#### Tier 2: HIGH (Fix in next sprint)
- **Definition**: Code quality issues that accumulate technical debt or cause maintenance problems. Not broken today, but will cause problems.
- **Backlog priority**: P1 -- schedule in upcoming sprints.
- **Examples**: Untested custom block (speisen), non-standard breakpoints, missing error handling, `eslint-disable` without justification, CSS specificity hacks.

#### Tier 3: MODERATE (Plan for improvement)
- **Definition**: Inconsistencies, style issues, missing best practices that reduce maintainability but do not cause immediate harm.
- **Backlog priority**: P2 -- address opportunistically or as part of related work.
- **Examples**: Hardcoded pixel values that should be CSS variables, boilerplate drift, inconsistent naming conventions, missing JSDoc on public functions.

#### Tier 4: LOW / NIT (Track for future)
- **Definition**: Suggestions, optimizations, modernization opportunities. Code works fine as-is.
- **Backlog priority**: P3 -- nice-to-have, address when touching related code.
- **Examples**: Could use newer CSS features, dependency version upgrades, additional test scenarios, code organization improvements.

#### Backlog Output Format

Each finding should be structured as a backlog item:

```markdown
### [SEVERITY] Short title

**Category**: JavaScript Quality
**File(s)**: `/Users/ben/github/benpeter/da-schamdan/blocks/header/header.js:54-60`
**Description**: The hamburger menu uses a `<div>` without a button role or keyboard event handler. Screen reader users and keyboard-only users cannot open the mobile navigation.
**Recommendation**: Replace the `<div>` with a `<button>` element, or add `role="button"`, `tabindex="0"`, and a `keydown` handler for Enter/Space.
**Effort**: S (small)
```

Include an effort estimate (S/M/L/XL) so the backlog can be prioritized by impact-to-effort ratio.

### (c) Running ESLint/Stylelint as Part of the Review

**Yes, absolutely run both linters.** I have already run them as part of this planning phase. Here is the current baseline:

- **ESLint**: **Clean pass** -- zero violations. The codebase lints cleanly against airbnb-base. There are 7 `eslint-disable-next-line` comments in project-owned files (`scripts/scripts.js`, `scripts/delayed.js`, `blocks/fragment/fragment.js`) and 1 file-level `eslint-disable` in `scripts/dapreview.js`. The `aem.js` file has additional disables but that is upstream boilerplate code.
- **Stylelint**: **Clean pass** -- zero violations. There is one `stylelint-disable no-empty-source` in `blocks/fragment/fragment.css` (empty file with required CSS stub).

**What this means for the review**: The linting baseline is healthy. The review should:

1. **Document the clean state** as a positive finding -- this is good project hygiene.
2. **Audit each `eslint-disable` comment** for justification. Specifically:
   - `no-bitwise` in `scripts/scripts.js:20` -- justified (DOM `compareDocumentPosition` uses bitwise).
   - `no-console` in `scripts/scripts.js:48` -- justified (error logging in catch block).
   - `import/prefer-default-export` in `scripts/scripts.js:57` -- questionable (could restructure exports).
   - `no-await-in-loop` in `scripts/scripts.js:73` -- needs audit (dynamic import, may be valid).
   - `import/no-cycle` in `scripts/scripts.js:119` and `scripts/delayed.js:1` and `blocks/fragment/fragment.js:7` -- these are circular dependency flags and should be investigated.
   - `import/no-unresolved` in `scripts/dapreview.js:2` -- justified (external CDN URL).
3. **Review linter configuration adequacy**: The ESLint config extends airbnb-base with minimal overrides. Consider whether additional rules would catch EDS-specific patterns (e.g., no direct `element.style` manipulation, no `document.write`).
4. **Do NOT run linting as a blocking gate** for this review -- it already passes. Instead, include linting state as context in the report's Build & Tooling section.

## Proposed Tasks

### Task 1: Run Automated Linters and Document Baseline
- **What**: Run `npm run lint` (ESLint + Stylelint), capture output, document pass/fail state and all `eslint-disable` / `stylelint-disable` comments with justification assessment.
- **Deliverable**: Linting baseline section of the review report.
- **Dependencies**: None (can run immediately). Already completed during planning -- linters pass clean.
- **Effort**: S

### Task 2: Review All JavaScript Files for Code Quality
- **What**: Review each `.js` file in `blocks/` and `scripts/` for correctness, error handling, DOM manipulation patterns, complexity, and EDS compliance. Key files: `speisen.js` (most complex custom code), `header.js` (navigation logic), `scripts.js` (initialization flow), `dapreview.js` (external dependency loading).
- **Deliverable**: JavaScript Quality findings with severity, file references, and recommendations.
- **Dependencies**: Task 1 (linting baseline provides context).
- **Effort**: M

### Task 3: Review All CSS Files for Quality and Consistency
- **What**: Review each `.css` file for selector scoping, specificity, responsive design patterns, design token usage, hardcoded values, and cross-block consistency. Check `styles/styles.css` for design token completeness. Verify breakpoint consistency (the `1000px` breakpoint in header.css vs. standard `900px`).
- **Deliverable**: CSS Quality + Cross-Cutting Consistency findings.
- **Dependencies**: None (can run in parallel with Task 2).
- **Effort**: M

### Task 4: Assess EDS Boilerplate Compliance
- **What**: Compare boilerplate-origin files against current upstream `aem-boilerplate`. Verify `aem.js` is unmodified. Assess block architecture compliance. Check that no frameworks or build steps have been introduced. Verify `head.html` contains only essentials.
- **Deliverable**: EDS Pattern Compliance findings.
- **Dependencies**: None (can run in parallel).
- **Effort**: S

### Task 5: Accessibility Audit
- **What**: Review all blocks for ARIA usage, keyboard accessibility, semantic HTML, heading hierarchy, and color contrast. Focus on header (hamburger menu accessibility) and speisen (menu data table semantics). Assess whether the speisen block should use `<table>` semantics or ARIA grid roles for screen readers.
- **Deliverable**: Accessibility findings.
- **Dependencies**: None (can run in parallel).
- **Effort**: M

### Task 6: Test Coverage Assessment
- **What**: Map which blocks/scripts have tests and which do not. Assess test quality (smoke test vs. behavioral test). Identify highest-priority untested code (speisen block, cards block, columns block).
- **Deliverable**: Test Coverage findings with recommendations for priority test additions.
- **Dependencies**: None.
- **Effort**: S

### Task 7: Performance Assessment
- **What**: Review critical rendering path: `head.html` contents, font loading strategy, script loading order, lazy loading patterns. Assess the `dapreview.js` dynamic import in `loadEager` (runs before LCP -- is this impacting performance?). Check image optimization patterns.
- **Deliverable**: Performance findings.
- **Dependencies**: None.
- **Effort**: S

### Task 8: Security Review
- **What**: Audit all `innerHTML` assignments (header.js:31, footer.js:17, fragment.js:27, cards.js:8, 404.html). Assess external resource loading (dapreview.js loads from `da.live` CDN). Verify external links have `rel="noopener noreferrer"` (delayed.js handles this -- verify completeness). Check for hardcoded secrets or sensitive URLs.
- **Deliverable**: Security findings.
- **Dependencies**: None.
- **Effort**: S

### Task 9: Build & Tooling Health Assessment
- **What**: Assess dependency freshness, CI/CD workflow adequacy, linter configuration completeness. Check if GitHub branch protection is configured. Evaluate whether the test runner configuration is adequate.
- **Deliverable**: Build & Tooling findings.
- **Dependencies**: None.
- **Effort**: S

### Task 10: Compile Report and Prioritized Backlog
- **What**: Aggregate all findings into a structured report with the recommended category structure and severity classification. Generate a prioritized backlog sorted by severity and effort. Include summary statistics (total findings by severity, findings by category).
- **Deliverable**: Final comprehensive review report + prioritized backlog document.
- **Dependencies**: Tasks 1-9 (all findings).
- **Effort**: M

## Risks and Concerns

### 1. Scope Creep Between Review and Implementation
The review must produce findings and a backlog, **not fixes**. There is a risk that reviewers will want to fix issues as they find them. The plan must enforce a strict boundary: document, do not implement.

### 2. False Positives from Boilerplate Code
Many files (header, footer, cards, columns, hero, fragment, aem.js) are boilerplate code. Findings against boilerplate code should be flagged as such -- the recommendation for boilerplate issues is "pull upstream update" or "accept as boilerplate pattern", not "rewrite". The review should clearly distinguish project-authored code (`speisen.js`, `dapreview.js`, customizations to `scripts.js` and `styles.css`) from boilerplate code.

### 3. Circular Dependency Chain
There are `import/no-cycle` disables in three files: `scripts.js` imports from `aem.js`, `delayed.js` imports from `aem.js`, and `fragment.js` imports `decorateMain` from `scripts.js` which imports from `aem.js`. This is a known EDS boilerplate pattern, not a project-specific issue. The review should note it but classify it as LOW/NIT since it is inherent to the EDS architecture.

### 4. Accessibility Depth vs. Expertise
A thorough accessibility audit requires specialized knowledge (WCAG 2.1 AA compliance, screen reader testing). The code-level review can catch structural issues (missing ARIA, keyboard handlers, semantic HTML), but cannot substitute for actual assistive technology testing. The report should note this limitation and recommend manual accessibility testing as a follow-up.

### 5. Performance Assessment Without Live Testing
Code-level performance review can identify anti-patterns (blocking resources, unoptimized images) but cannot measure actual Core Web Vitals without running Lighthouse against the live site. If preview URLs are available, Lighthouse should be run. If not, the review should be limited to code-level assessment and flag the need for live testing.

### 6. ESLint 8.x End-of-Life
The project uses ESLint 8.57.1. ESLint 8 reached end of life in October 2024. ESLint 9.x introduced flat config format, which is a breaking change. This is a real finding for the Build & Tooling category, but migration to ESLint 9 is non-trivial and should be sized as M/L effort in the backlog.

## Additional Agents Needed

### accessibility-minion (if available)
The accessibility audit (Task 5) goes beyond code quality review into specialized WCAG compliance territory. If an accessibility specialist agent exists, it should handle the deeper accessibility assessment: color contrast ratio calculations, screen reader interaction patterns, focus trap verification, and WCAG 2.1 AA conformance mapping. Without a specialist, the code-review-minion can cover structural accessibility issues but should clearly state the limitation.

### performance-minion (if available)
Performance assessment (Task 7) would benefit from a specialist who can run Lighthouse CI against preview URLs, analyze Core Web Vitals, and provide detailed LCP/CLS/INP analysis. The code-review-minion can identify code-level performance anti-patterns but cannot substitute for actual performance measurement.

If neither specialist agent is available, the code-review-minion can handle both areas at a structural/code-pattern level, with explicit caveats about the limitations documented in the report.
