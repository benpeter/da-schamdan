# Domain Plan Contribution: test-minion

## Current State Assessment

### Test Suite Status

All 13 tests across 5 test files pass. Coverage stands at **77.13%** overall. The test runner is `@web/test-runner` (v0.20.2) with `@esm-bundle/chai` for assertions and `sinon` (v14.0.1) for mocking (though sinon is unused in any current test).

**Files tested:**
- `test/scripts/scripts.test.js` -- 1 test (window.hlx initialization)
- `test/scripts/block-utils.test.js` -- 7 tests (toClassName, getMetadata, loadCSS, createOptimizedPicture, decorateSections, decorateBlocks, loadSections, readBlockConfig)
- `test/blocks/header/header.test.js` -- 2 tests (hamburger toggle, section expand/collapse)
- `test/blocks/footer/footer.test.js` -- 1 test (footer link renders)
- `test/blocks/hero/hero.test.js` -- 1 test (hero block builds from picture + h1)

**Files NOT tested (no test file exists):**
- `blocks/cards/cards.js` -- DOM transformation block (18 lines)
- `blocks/columns/columns.js` -- DOM transformation block (4 lines)
- `blocks/fragment/fragment.js` -- Fragment loading with fetch + DOM (50 lines, contains `loadFragment` utility)
- `blocks/speisen/speisen.js` -- Menu block with complex parsing logic (154 lines, **highest complexity in codebase**)
- `scripts/delayed.js` -- External link handling (19 lines)
- `scripts/dapreview.js` -- Preview parameter check (3 lines)

**Coverage from `lcov.info` details on `scripts/aem.js` (the core library):**
- 729 total lines, 550 hit = 75.4% line coverage
- 32 functions total, 21 hit = 65.6% function coverage
- Untested functions include: `decorateButtons`, `decorateIcon`, `decorateTemplateAndTheme`, `toCamelCase`, `loadScript`, `loadHeader`, `loadFooter`, `waitForFirstImage`
- `blocks/header/header.js`: 100% line coverage
- `blocks/footer/footer.js`: 100% line coverage

---

## Recommendations

### (a) Run the existing test suite and report coverage gaps -- YES

The test suite runs cleanly (13 tests, all passing, 13.8s execution time) and the coverage report is already generated. The code review should include:

1. **Exact coverage numbers per file** from the lcov data (done above).
2. **Identification of the untested blocks** by name, with risk assessment based on complexity.
3. **Untested functions in `aem.js`** that are exercised only through side effects of other tests, not directly verified.

The coverage report already exists at `coverage/lcov-report/index.html` -- the review should reference it but also provide a human-readable summary since the raw lcov data is not easy to parse.

### (b) Assess test quality beyond coverage -- YES, and here are the findings

The existing tests have several quality issues that should be flagged in the review:

**1. Non-deterministic timing with `sleep(1000)`**
Both `header.test.js` and `footer.test.js` use a hardcoded `sleep(1000)` to wait for block loading. This is a classic flakiness source. The blocks are loaded asynchronously via `loadBlock()` which returns a Promise -- tests should await the returned Promise directly or use a deterministic wait (e.g., polling for a DOM condition). In a slower CI environment, 1 second may not be enough; in a fast one, it wastes time.

```javascript
// Current (fragile):
await loadBlock(headerBlock);
await sleep();

// Better: loadBlock already returns a promise that resolves when loading is complete.
// The sleep is unnecessary if loadBlock's promise is properly awaited.
```

**2. Shallow assertions**
- `hero.test.js` only asserts that `.hero` and `.hero.block` elements exist. It does not verify that the picture and h1 were correctly moved into the hero block, that the original elements were removed from their source location, or that the section structure is correct. The test essentially verifies that `buildBlock` creates a div with the right class -- it tests the framework, not the hero logic.
- `footer.test.js` asserts a single link exists with an Adobe privacy URL. This is testing boilerplate fixture content, not the footer block's actual decoration logic. The footer block fetches remote content and appends it -- the test verifies the fixture data, not the fetch-and-append behavior.
- `scripts.test.js` has a single test checking `window.hlx` exists. The `scripts.js` file contains `buildHeroBlock`, `loadFonts`, `buildAutoBlocks`, `decorateMain`, `loadEager`, `loadLazy`, `loadDelayed`, and `loadPage` -- none of which are tested.

**3. Test structure anti-patterns**
- Tests perform setup (DOM manipulation, block loading) at module scope rather than inside `before`/`beforeEach` hooks. This means setup errors crash the entire test file rather than failing individual tests.
- The `dummy.html` -> body swap pattern (load dummy first to initialize `aem.js`, then replace with real body) is an undocumented workaround for `aem.js` side effects on import. This is fragile and not explained anywhere.
- No teardown/cleanup between tests. The header test clicks hamburger open, then clicks closed -- if the second click fails, the DOM is left in expanded state for any subsequent test.

**4. Unused dependency**
`sinon` (v14.0.1) is declared in devDependencies but never imported in any test file. This is not a test quality issue per se, but it indicates the test suite may have been scaffolded from a template rather than grown organically.

**5. Missing negative/edge case testing**
No test verifies error handling. What happens when `loadBlock` fails? When `fetch` returns a non-ok response? When metadata is missing? The `aem.js` file has several try/catch blocks and null checks that are never exercised.

### (c) Recommend specific test additions vs. flag gaps -- RECOMMEND SPECIFIC ADDITIONS with priority tiers

The review should go beyond just listing missing files. It should recommend specific tests organized by the project's own "keeper vs. throwaway" taxonomy.

**Priority 1 -- Keeper tests (unit tests worth maintaining):**

- **`speisen.js` parsing logic**: This is the most complex custom code in the project (154 lines, regex parsing, multiple code paths for header rows, multi-price splitting, item number extraction, description extraction). The `PRICE_RE` regex, `splitPrices()`, `headerCellHTML()`, and `decorateHeaderRow()` functions contain genuine business logic. This block has at minimum 6 distinct code paths that should each have a test case. This is the single highest-value test addition.

- **`fragment.js` `loadFragment()` function**: Contains path validation logic (`startsWith('/')`, `!startsWith('//')`), fetch + response handling, and media URL rebasing. The `loadFragment` export is a reusable utility. Test the path validation edge cases and the media URL rebasing.

**Priority 2 -- Improve existing keeper tests:**

- Add meaningful assertions to `hero.test.js` (verify picture/h1 are inside the hero block, original elements removed).
- Remove `sleep()` calls from header and footer tests; rely on `loadBlock()` Promise.
- Add `decorateButtons` test to `block-utils.test.js` (currently 0% coverage for a function that handles 4 button style variants).

**Priority 3 -- Throwaway tests (browser validation, not committed):**

- `cards.js` and `columns.js` are simple DOM transformers (18 and 4 lines respectively). Their logic is straightforward and unlikely to regress independently. Per the project's testing-blocks skill, these belong in `test/tmp/` as throwaway browser tests.

### (d) Adopt the keeper/throwaway taxonomy -- YES, with caveats

The project's `testing-blocks` SKILL.md establishes a clear and pragmatic distinction:

- **Keeper tests** = unit tests for logic-heavy utilities, committed to the repo, run in CI
- **Throwaway tests** = browser-based validation for DOM decoration, kept in gitignored `test/tmp/`

The code review should adopt this taxonomy because:
1. It aligns with the project's established conventions.
2. It correctly identifies that most AEM block decoration logic is low-value for permanent tests (DOM structure changes frequently).
3. It focuses testing effort where it matters most -- the `speisen.js` parsing logic, `fragment.js` utility, and `aem.js` core functions.

**Caveat**: The SKILL.md references Vitest in its code examples (`import { describe, it, expect } from 'vitest'`) but the project actually uses `@web/test-runner` with `chai`. The review should flag this inconsistency. The SKILL.md was likely generated from a template and not updated to match the project's actual test stack.

---

## Proposed Tasks

### Task 1: Run test suite and generate coverage report summary

**What to do:** Run `npm test`, capture the pass/fail results and the 77.13% coverage number. Parse `coverage/lcov.info` to produce a per-file coverage breakdown. Include the untested files list.

**Deliverables:** A section in the code review report with:
- Test suite status (13 tests, 5 files, all passing)
- Per-file coverage table (footer: 100%, header: 100%, aem.js: 75.4%)
- List of completely untested files with line counts
- List of untested functions in aem.js

**Dependencies:** None (test suite already passes).

### Task 2: Assess test quality and document findings

**What to do:** Evaluate the 5 test files for test quality issues beyond coverage. Assess assertion depth, test isolation, timing reliability, structural patterns, and edge case coverage.

**Deliverables:** A section in the code review report documenting:
- The `sleep(1000)` flakiness risk in header/footer tests
- Shallow assertion patterns (hero, footer, scripts tests)
- Module-scope setup anti-pattern
- Unused sinon dependency
- Missing negative/error case tests

**Dependencies:** Task 1 (needs test run to verify current state).

### Task 3: Produce prioritized test backlog

**What to do:** Create a ranked list of recommended test additions using the keeper/throwaway taxonomy. Each item should include: what to test, why it matters, estimated complexity, and a code snippet showing the test structure.

**Deliverables:** A backlog section in the code review report with:
- P1: `speisen.js` unit tests (keeper) -- 6-8 test cases for parsing logic
- P1: `fragment.js` `loadFragment()` unit tests (keeper) -- path validation, media rebasing
- P2: Existing test improvements (remove sleep, deepen assertions, add decorateButtons)
- P3: `cards.js` / `columns.js` throwaway browser tests (informational, not committed)
- Note flagging SKILL.md Vitest/WTR inconsistency

**Dependencies:** Tasks 1 and 2.

### Task 4: CI pipeline assessment

**What to do:** Review `.github/workflows/run-tests.yaml` for CI best practices. The current pipeline is minimal (checkout, node setup, npm install, lint, test).

**Deliverables:** Brief notes in the review covering:
- No caching of node_modules (adds unnecessary install time on every PR)
- No coverage threshold enforcement (coverage is measured but not gated)
- No test artifact upload (coverage HTML report not saved as build artifact)
- Node.js version 20 is fine for current needs
- Sequential lint-then-test is correct (lint failures should fail fast before slower tests)

**Dependencies:** None.

---

## Risks and Concerns

### Risk 1: `sleep(1000)` causing intermittent CI failures

**Likelihood:** Medium. The header and footer tests both rely on a 1-second sleep after `loadBlock()`. In a GitHub Actions Ubuntu runner under load, this could intermittently fail. The tests have likely been passing consistently so far because the block loading is fast, but this is a latent defect.

**Mitigation:** Replace with deterministic waiting (await the loadBlock Promise directly, or poll for expected DOM state).

### Risk 2: Speisen block has zero test coverage for its most complex logic

**Likelihood:** High impact if changes are made. The `speisen.js` block is 154 lines of custom parsing logic with regex, multiple conditional branches, and DOM manipulation. It is the only truly custom business logic in the codebase (the other blocks are boilerplate patterns). Any future changes to the menu content model will require modifying this code, and without tests, regressions will only be caught by manual browser testing.

**Mitigation:** Priority 1 recommendation is to write keeper tests for `speisen.js` parsing functions.

### Risk 3: Test stack inconsistency with SKILL.md documentation

**Likelihood:** Confusion for future contributors. The `testing-blocks` SKILL.md shows Vitest examples, but the project uses `@web/test-runner` + `chai`. A contributor following the SKILL.md guide would write incompatible tests.

**Mitigation:** Either update the SKILL.md to reference the actual test stack, or migrate to Vitest (which would be faster but is a separate task outside this review).

### Risk 4: Coverage percentage is misleading

**Likelihood:** High. The 77.13% number looks healthy, but it is heavily skewed by `aem.js` (the Adobe framework code) being partially exercised as a side effect of other tests. The project's own custom code (`speisen.js`, `fragment.js`, `scripts.js`, `delayed.js`, `dapreview.js`, `cards.js`, `columns.js`) has effectively **0% direct test coverage**. The coverage number reflects framework code being initialized, not custom logic being verified.

**Mitigation:** The review should present coverage in terms of "custom code tested vs. not tested" rather than a single overall percentage.

---

## Additional Agents Needed

None. The current team composition is sufficient for the code review. The test assessment is one section of the broader review, and the findings above provide everything the review lead needs to incorporate testing into the final report and backlog.

If the project later decides to act on the test recommendations (particularly writing `speisen.js` tests), that would be execution work for the test-minion at that stage, not planning work now.
