# Meta-Plan: Comprehensive Website Code Review

## Codebase Summary

This is an **AEM Edge Delivery Services** (EDS) website for **schamdan.de**, a restaurant site. The codebase follows the standard EDS boilerplate pattern with:

- **7 blocks**: cards, columns, footer, fragment, header, hero, speisen (custom menu block)
- **Core scripts**: aem.js (framework, not to be modified), scripts.js, delayed.js, dapreview.js
- **Styles**: styles.css, lazy-styles.css, fonts.css (empty)
- **Tests**: Unit tests for header, footer, hero, and scripts (using @web/test-runner + chai)
- **Linting**: ESLint (airbnb-base) + Stylelint (standard config)
- **CI**: GitHub Actions running lint + test on PRs
- **Content source**: Document Authoring (DA) via `content.da.live`
- **No CLAUDE.md** in the project (no project-specific skill preferences declared)

The site is relatively small (~700 lines of custom JS, ~500 lines of custom CSS) but touches all standard EDS patterns: auto-blocking, header/footer fragments, responsive layouts, and a custom content-heavy block (speisen).

---

## Planning Consultations

### Consultation 1: Code Quality and EDS Best Practices Review Strategy

- **Agent**: code-review-minion
- **Planning question**: Given this AEM Edge Delivery Services codebase with 7 blocks (including a custom speisen menu block), standard boilerplate patterns, and an existing project-specific code-review skill (`.skills/code-review/SKILL.md`), what code quality dimensions should the comprehensive review cover beyond what the project skill already checks? Specifically: (a) What review categories should we use for organizing findings? (b) How should we structure the severity classification to produce an actionable backlog? (c) Should we run ESLint/Stylelint as part of the review to capture baseline linting state?
- **Context to provide**: The project has an extensive code-review skill at `.skills/code-review/SKILL.md` that covers JS review, CSS review, HTML review, performance review, content/authoring review, and security review. The ESLint config extends airbnb-base. Stylelint uses standard config. The codebase has some existing eslint-disable comments.
- **Why this agent**: code-review-minion brings structured review methodology and can design the review dimensions, severity taxonomy, and report format. The project skill provides EDS-specific checklists that should inform but not limit the review scope.

### Consultation 2: Performance and Core Web Vitals Review Strategy

- **Agent**: sitespeed-minion
- **Planning question**: For an AEM Edge Delivery Services site that uses the standard 3-phase loading pattern (eager/lazy/delayed) and targets Lighthouse 100, what performance review dimensions should we focus on? Key areas of interest: (a) The font loading strategy (fonts.css is empty, loadFonts() is called but does nothing useful), (b) The dapreview.js dynamic import in the critical path, (c) CSS delivery strategy (styles.css in head, lazy-styles.css loaded later but also empty), (d) Image optimization patterns across blocks, (e) The hero block's absolute-positioned image approach. What specific metrics and checks should the review include?
- **Context to provide**: `head.html` content, `scripts.js` loading phases, the empty `fonts.css` and `lazy-styles.css`, the hero block's CSS approach, and the overall EDS architecture where Lighthouse 100 is the performance target.
- **Why this agent**: sitespeed-minion can identify performance budget concerns, CWV-specific issues (LCP from the hero pattern, CLS risks from progressive section loading, INP from nav interactions), and loading strategy optimizations specific to this architecture.

### Consultation 3: Accessibility Audit Scope

- **Agent**: accessibility-minion
- **Planning question**: For a restaurant website built on AEM Edge Delivery Services with these interactive components -- (a) a hamburger navigation with aria-expanded toggling, (b) nav sections with click-based dropdown expansion, (c) a menu/speisen block displaying food items in a CSS grid, (d) auto-generated hero blocks with background images -- what WCAG 2.2 criteria should the review prioritize? What are the highest-risk accessibility patterns to look for in this type of site? Consider that the nav uses click handlers but no keyboard event handlers, the hamburger has no ARIA label, and the speisen block uses a visual grid layout for tabular menu data.
- **Context to provide**: `blocks/header/header.js` (hamburger and nav interaction patterns), `blocks/header/header.css` (responsive nav styles), `blocks/speisen/speisen.js` (menu data in grid layout), `blocks/hero/hero.css` (background image pattern), `styles/styles.css` (global styles, button styles), `404.html`.
- **Why this agent**: accessibility-minion can identify WCAG conformance gaps specific to the interactive patterns in this codebase. The nav component and the speisen block are the highest-risk areas for accessibility violations.

### Consultation 4: Security Review Scope

- **Agent**: security-minion
- **Planning question**: For a mostly-static AEM Edge Delivery Services site that fetches fragment content via `fetch()` and sets `innerHTML` in the header, footer, and fragment blocks, what security review dimensions are most relevant? Specifically: (a) The `innerHTML` usage pattern in header.js, footer.js, and fragment.js -- are these XSS vectors given the content comes from the same-origin DA endpoint? (b) The `dapreview.js` pattern that conditionally imports from `da.live` based on a URL query parameter -- is this a concern? (c) The external link handling in `delayed.js` -- is the noopener/noreferrer pattern correctly implemented? (d) Any concerns with the `readBlockConfig` usage pattern? What should we flag vs. accept as standard EDS practice?
- **Context to provide**: `blocks/header/header.js`, `blocks/footer/footer.js`, `blocks/fragment/fragment.js`, `scripts/dapreview.js`, `scripts/delayed.js`, `head.html`, `404.html`.
- **Why this agent**: security-minion can distinguish between actual security concerns and standard EDS patterns that appear risky but are architecturally safe (e.g., innerHTML from trusted content sources). This prevents false positives that would reduce report credibility.

### Consultation 5: SEO Technical Audit Dimensions

- **Agent**: seo-minion
- **Planning question**: For a restaurant website on AEM Edge Delivery Services where content is authored in Document Authoring and served via the EDS CDN, what SEO technical audit dimensions should the review cover? Consider: (a) The `head.html` is minimal (no meta description, no OG tags beyond what DA provides), (b) The `helix-query.yaml` defines a site index but the schema is basic, (c) There's no robots.txt in the repo, (d) The site has `lang="de-DE"` set, (e) The 404 page exists but doesn't use structured data, (f) There's no sitemap configuration visible. What should we check that is within the codebase's control (vs. what EDS handles automatically)?
- **Context to provide**: `head.html`, `helix-query.yaml`, `404.html`, `scripts/scripts.js` (lang setting), `tools/sidekick/config.json`.
- **Why this agent**: seo-minion can distinguish what EDS handles automatically (e.g., meta tags from content, CDN-level robots.txt) vs. what the codebase is responsible for (structured data, heading hierarchy, semantic HTML, image alt texts). This avoids false findings about things outside codebase control.

### Consultation 6: Test Coverage and Strategy Review

- **Agent**: test-minion
- **Planning question**: The project has unit tests for header, footer, hero, and scripts blocks using @web/test-runner with chai, but is missing tests for cards, columns, fragment, and speisen blocks. The CI pipeline runs lint + test on PRs. For a comprehensive code review: (a) Should we run the existing test suite and report coverage gaps? (b) How should we assess test quality (not just coverage) -- are the existing tests meaningful? (c) Should we recommend specific test additions or just flag the gaps? (d) The project has a testing-blocks skill that distinguishes "keeper tests" (unit) from "throwaway tests" (browser) -- should our review adopt this taxonomy?
- **Context to provide**: `test/` directory structure, `package.json` test scripts, `.github/workflows/run-tests.yaml`, the testing-blocks skill's philosophy.
- **Why this agent**: test-minion can evaluate whether the existing test strategy is sound and identify the most valuable test additions, rather than just flagging missing coverage percentages.

---

## Cross-Cutting Checklist

- **Testing** (test-minion): INCLUDE for planning. The project has an existing test suite with gaps (4 blocks untested). Test strategy review and coverage gap analysis are core review dimensions. See Consultation 6 above.
- **Security** (security-minion): INCLUDE for planning. The codebase uses innerHTML patterns in 3 blocks and has a dynamic import from an external domain (da.live). See Consultation 4 above.
- **Usability -- Strategy** (ux-strategy-minion): INCLUDE for planning. This is a restaurant website where user journey coherence (finding the menu, making reservations, getting directions) is critical. Planning question: "For a restaurant website code review, what user journey and cognitive load dimensions should we evaluate in the code? Consider: (a) navigation structure and information architecture as expressed in the header/nav, (b) the speisen block's usability for browsing a menu with numbered items, sizes, and prices, (c) whether the 404 page provides useful recovery paths, (d) mobile usability given the hamburger-based navigation pattern." Context: header.js, speisen.js, 404.html, styles.css.
- **Usability -- Design** (ux-design-minion): EXCLUDE from planning. This is a code review, not a design audit. Visual design findings will emerge naturally from accessibility and performance reviews. The code review itself does not need design planning input.
- **Accessibility** (accessibility-minion): INCLUDE for planning. The codebase has interactive navigation, a data-display block (speisen), and a hero pattern. See Consultation 3 above.
- **Documentation** (software-docs-minion): INCLUDE for planning. Planning question: "For a code review report that will serve as both a quality snapshot and a prioritized backlog, what document structure and format would be most useful? Consider: (a) the report needs to be scannable by severity, (b) each finding should be independently actionable as a future task, (c) the report should capture both codebase-wide patterns and file-specific issues, (d) the report lives in the repo alongside the project's existing AGENTS.md and README.md. What format (markdown sections, tables, or hybrid) works best?" Context: existing repo docs (README.md, AGENTS.md), project structure.
- **Observability** (observability-minion): EXCLUDE from planning. This is a static site served by EDS CDN with no custom backend services, APIs, or background processes. Observability is handled by EDS's built-in RUM (sampleRUM in aem.js/delayed.js). No custom observability review needed.
- **SEO** (seo-minion): INCLUDE for planning. Restaurant websites depend heavily on local SEO and discoverability. See Consultation 5 above.
- **Performance** (sitespeed-minion): INCLUDE for planning. EDS targets Lighthouse 100; the codebase has several patterns worth evaluating. See Consultation 2 above.

---

## Anticipated Approval Gates

### Gate 1: Review Report and Backlog (single gate)

This task produces a single deliverable: the comprehensive code review report with prioritized backlog. Since this is a **read-only analysis** task (no code changes), the deliverable is **easy to reverse** (it's a report file). However, the backlog will drive future development priorities, giving it **high blast radius** on downstream decisions.

Classification: **OPTIONAL gate**. Present the report for user review before considering it final, but it does not block any code execution tasks. The user may want to adjust severity classifications or reprioritize backlog items before the report is committed to the repo.

Given the nature of this task (analysis, not implementation), we anticipate only this single gate. The review itself IS the deliverable -- there are no architectural decisions, schema designs, or API contracts to gate.

---

## Rationale

This meta-plan prioritizes **seven planning consultations** (code-review, sitespeed, accessibility, security, seo, test, ux-strategy) plus software-docs, because a comprehensive code review must cover all these dimensions to be credible and actionable.

The specialists were chosen based on the review dimensions in scope:
- **code-review-minion** designs the review methodology, severity taxonomy, and report structure -- the backbone of the entire effort.
- **sitespeed-minion** and **seo-minion** bring domain-specific knowledge about what EDS handles automatically vs. what falls to the codebase, preventing false positives.
- **accessibility-minion** evaluates the interactive components (nav, speisen) which are the highest-risk areas for WCAG violations.
- **security-minion** distinguishes genuine security concerns from standard EDS patterns in the innerHTML/fetch usage.
- **test-minion** evaluates the existing test strategy and identifies the highest-value coverage gaps.
- **ux-strategy-minion** ensures the review considers user journey coherence, not just code quality.
- **software-docs-minion** designs the report format to maximize actionability.

Agents **excluded** from planning:
- **ux-design-minion**: Visual design assessment is out of scope for a code review. Accessibility covers the functional design concerns.
- **observability-minion**: No custom backend; EDS RUM handles observability.
- **frontend-minion**: The code review itself examines frontend code, but frontend-minion's planning input is not needed -- the code-review-minion and the project's code-review skill cover frontend review methodology.
- **margo** and **lucy**: Governance agents are triggered unconditionally in Phase 3.5 architecture review, not during planning consultations.

---

## Scope

**In scope**:
- All website source code: blocks (7), scripts (4), styles (3), HTML (head.html, 404.html)
- Configuration files: fstab.yaml, helix-query.yaml, package.json, eslint/stylelint configs, sidekick config
- Build and CI setup: package.json scripts, GitHub Actions workflow, PR template
- Test suite: existing tests in test/ directory
- Code quality, performance, accessibility, security, SEO, maintainability, and test coverage

**Out of scope**:
- Content accuracy or copywriting (what's authored in DA)
- Business logic decisions (e.g., menu pricing structure)
- Third-party service configurations outside the repo (DA platform, EDS CDN config, DNS)
- `scripts/aem.js` (upstream Adobe framework code, not to be modified)
- Visual design assessment (colors, typography choices, layout aesthetics)
- The `.skills/` and `.agents/` directories (development tooling, not site code)

---

## External Skill Integration

### Discovered Skills

| Skill | Location | Classification | Domain | Recommendation |
|-------|----------|---------------|--------|----------------|
| code-review | `.skills/code-review/SKILL.md` | LEAF | Code quality review for EDS projects | **USE** -- Primary reference for EDS-specific review checklists. Highly relevant. |
| testing-blocks | `.skills/testing-blocks/SKILL.md` | LEAF | Testing methodology for EDS blocks | **USE** -- Informs test coverage gap analysis and test philosophy taxonomy. |
| building-blocks | `.skills/building-blocks/SKILL.md` | LEAF | Block development guide for EDS | **REFERENCE** -- Provides EDS coding standards context for the review. |
| docs-search | `.skills/docs-search/SKILL.md` | LEAF | AEM documentation search | **REFERENCE** -- May be useful if reviewers need to verify EDS best practices. |
| content-driven-development | `.skills/content-driven-development/SKILL.md` | ORCHESTRATION | Full CDD development workflow | **SKIP** -- Development workflow skill, not relevant to a code review task. |
| content-modeling | `.skills/content-modeling/SKILL.md` | LEAF | Content model design for EDS blocks | **SKIP** -- Content modeling decisions are out of scope. |
| block-collection-and-party | `.skills/block-collection-and-party/SKILL.md` | LEAF | Reference block discovery | **REFERENCE** -- Could inform review of whether blocks follow standard patterns. |
| block-inventory | `.skills/block-inventory/SKILL.md` | LEAF | Block palette survey | **SKIP** -- Inventory tool, not relevant to code review. |
| authoring-analysis | `.skills/authoring-analysis/SKILL.md` | LEAF | Content analysis for import | **SKIP** -- Import workflow, not relevant. |
| generate-import-html | `.skills/generate-import-html/SKILL.md` | LEAF | HTML generation for import | **SKIP** -- Import workflow, not relevant. |
| identify-page-structure | `.skills/identify-page-structure/SKILL.md` | LEAF | Page structure analysis for import | **SKIP** -- Import workflow, not relevant. |
| page-decomposition | `.skills/page-decomposition/SKILL.md` | LEAF | Section analysis for import | **SKIP** -- Import workflow, not relevant. |
| page-import | `.skills/page-import/SKILL.md` | ORCHESTRATION | Full page import workflow | **SKIP** -- Import workflow, not relevant. |
| preview-import | `.skills/preview-import/SKILL.md` | LEAF | Import verification | **SKIP** -- Import workflow, not relevant. |
| scrape-webpage | `.skills/scrape-webpage/SKILL.md` | LEAF | Web scraping for import | **SKIP** -- Import workflow, not relevant. |

### Precedence Decisions

- **code-review skill vs. code-review-minion**: The project's `code-review` skill provides EDS-specific checklists and review patterns. The built-in `code-review-minion` brings general code review methodology. **Decision**: The project skill takes precedence for EDS-specific criteria (it is more specific). The code-review-minion augments with general code quality patterns and designs the overall review methodology and report format. Both are used complementarily, not in conflict.
- **testing-blocks skill vs. test-minion**: Similar complementary relationship. The project skill's "keeper vs. throwaway" test taxonomy should be adopted. test-minion evaluates overall test strategy and identifies gaps.
- No other precedence conflicts exist -- the remaining skills are either irrelevant to this task or provide reference context only.
