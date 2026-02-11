# Test-Minion Review: Task 6 Test Coverage Assessment

## Verdict: ADVISE

Task 6 adequately covers test quality assessment with appropriate scope and references to the keeper/throwaway taxonomy. However, there are three non-blocking recommendations to strengthen the testing review.

## Advisories

### 1. Running the test suite is appropriate and necessary
The plan correctly includes running `npm test` before reviewing test files. This is essential because:
- Validates the test suite actually passes (baseline confirmation)
- Generates coverage data needed for gap analysis
- Reveals runtime behaviors not visible from static code review (e.g., actual timing issues with sleep(1000))
- Confirms test infrastructure is working (not just dead code)

This is NOT scope creep. A test quality review without running tests is like reviewing performance without checking load times.

### 2. Add flakiness detection to test review scope
The prompt mentions sleep(1000) as a latent flakiness source, which is correct. However, the test review should also check:
- Whether tests pass consistently (recommend running npm test 3-5 times to detect intermittent failures)
- Whether tests have proper isolation (can they run in any order? in parallel?)
- Whether tests clean up after themselves (temp DOM elements, event listeners, global state)

**Recommendation**: Add to Task 6 prompt under TEST findings: "Run the test suite 3 times to detect intermittent failures. Document any flakiness observed."

### 3. Coverage data interpretation needs guidance
The plan correctly identifies that "77% coverage is misleading" (finding #1). However, the task prompt should provide specific guidance on HOW to separate custom vs. boilerplate coverage:

**Current gap**: The prompt says "present coverage as custom code tested vs. not tested" but doesn't explain how to extract this from lcov.info.

**Recommendation**: Add to Task 6 prompt: "When analyzing coverage/lcov.info, categorize files as:
- Custom code (speisen.js, dapreview.js, custom functions in scripts.js/delayed.js): calculate coverage % for just these files
- Boilerplate code (aem.js, block-utils): separate these from custom coverage analysis
Present both percentages with clear labels: 'Custom code coverage: X%' vs 'Overall coverage (including boilerplate): 77%'"

### 4. Keeper/throwaway taxonomy is properly referenced
The plan correctly references testing-blocks SKILL.md for the keeper/throwaway taxonomy and instructs using it in recommendations. This is exactly right:
- Logic-heavy code (speisen.js parsing) → keeper tests
- Simple DOM decoration (cards, columns) → throwaway browser tests

No changes needed here.

## Non-Issues (Pre-emptive Clarifications)

**Test suite runtime in CI**: The plan does NOT propose adding E2E tests or expanding scope beyond the existing unit test suite. This keeps the review focused and fast.

**Test framework mismatch (SKILL.md vs reality)**: Correctly identified as a LOW finding (MAINT category). This is documentation drift, not a blocking test quality issue.

**No recommendation to write tests during review**: The prompt correctly instructs "Do NOT write actual tests. Recommend what tests to write." This maintains review vs. implementation separation.

## Summary

APPROVE with the three minor advisories above. The testing review scope is well-designed and properly bounded. Running the test suite is the correct approach. The keeper/throwaway taxonomy is appropriately integrated.

The advisories would strengthen the review but are not blocking issues.
