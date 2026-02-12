# Domain Plan Contribution: software-docs-minion

## Recommendations

### Report Format: Hybrid Markdown with Executive Summary, Categorized Findings, and Backlog Table

After reviewing the existing repo documentation style (boilerplate README, structured AGENTS.md with tables, the code-review skill's severity taxonomy), I recommend a **hybrid format** that combines narrative sections for context with structured tables for scannability. Here is the rationale and design:

#### 1. File Location and Naming

Place the report at:

```
docs/reviews/2026-02-11-comprehensive-code-review.md
```

Rationale:
- The `docs/` directory already exists and has a `history/` subdirectory, establishing it as the home for project documentation artifacts.
- Using `docs/reviews/` (not `docs/history/nefario-reports/`) makes the report discoverable as a first-class project artifact, not buried in tooling infrastructure.
- The date prefix makes chronological ordering natural and allows future reviews to coexist without filename conflicts.
- Keeping it in-repo means it is versioned, reviewable via PR, and findable by any contributor.

#### 2. Document Structure (Top-Level Outline)

```markdown
# Comprehensive Code Review: schamdan.de
> Review date: 2026-02-11 | Codebase snapshot: [commit SHA]

## Executive Summary
  - 3-5 sentence overview of codebase health
  - Key statistics (total findings by severity)
  - Top 3 priority areas

## Severity Definitions

## Findings by Category
  ### Code Quality
  ### Performance
  ### Accessibility
  ### Security
  ### SEO
  ### Test Coverage
  ### Maintainability

## Codebase-Wide Patterns
  (Cross-cutting concerns that affect multiple files)

## Prioritized Backlog
  (Standalone table of all findings, sorted by priority)

## Methodology
  (What was reviewed, what was excluded, tools used)
```

#### 3. Why This Structure Works

**Executive Summary first**: Decision-makers and busy developers scan the top. A 5-line summary with a severity count table tells them instantly whether this is "mostly healthy with some gaps" or "urgent problems need fixing."

**Severity Definitions section**: Align with the existing code-review skill's taxonomy (BLOCKING / HIGH / MEDIUM / LOW) rather than inventing a new one. This prevents cognitive friction since the project already uses this system. Map as follows:

| Report Severity | Code-Review Skill Equivalent | Meaning |
|-----------------|------------------------------|---------|
| Critical | BLOCKING | Must fix -- security vulnerabilities, broken functionality, blocking issues |
| High | HIGH | Should fix soon -- performance regressions, accessibility violations, significant quality gaps |
| Medium | MEDIUM | Should fix -- best practice violations, maintainability concerns, moderate risk |
| Low | LOW | Consider fixing -- suggestions, minor improvements, polish |

**Findings by Category (not by file)**: Grouping by review dimension (performance, accessibility, etc.) rather than by file path makes the report useful for different specialists. The performance person reads the Performance section; the accessibility person reads Accessibility. File-specific details live inside each finding. This avoids the "scroll through 50 file headings looking for what matters to me" problem.

**Codebase-Wide Patterns section**: Some findings are not file-specific -- they are patterns repeated across the codebase. Examples: "All blocks use innerHTML without sanitization comments," "No blocks have error handling for failed fetch calls," "Responsive breakpoints are inconsistent across blocks." These deserve their own section because they represent systemic issues, not individual bugs. Each pattern finding should reference all affected files.

**Prioritized Backlog as a standalone table at the end**: This is the "rip it out and use it as a task list" section. Every finding from all categories appears here as a single row, sorted by priority (Critical first, then High, then Medium, then Low). Each row is independently actionable. This table is the primary artifact that drives future work.

**Methodology last**: Important for credibility, but not what anyone reads first. Document scope, exclusions, tools run (ESLint output, Stylelint output, manual review), and commit SHA reviewed.

#### 4. Individual Finding Format

Each finding within a category section should follow this template:

```markdown
#### [ID] Short descriptive title

| Attribute | Value |
|-----------|-------|
| Severity | High |
| Category | Accessibility |
| Files | `blocks/header/header.js:42`, `blocks/header/header.css:18` |
| Effort | Small (< 1 hour) |

**Problem**: One paragraph describing what is wrong and why it matters.

**Evidence**: Code snippet, screenshot reference, or lint output showing the issue.

**Recommendation**: Specific, actionable fix. Not "improve this" but "add `aria-label="Main navigation"` to the `<nav>` element in header.js line 42."
```

Rationale for each field:
- **ID**: Short prefix like `A11Y-01`, `PERF-03`, `SEC-02`. Makes cross-referencing easy between the category section and the backlog table. Also makes it possible to reference findings in commit messages and PRs ("Fixes CODE-04").
- **Severity**: From the 4-level taxonomy above.
- **Category**: Redundant when reading within a category section, but essential in the backlog table for filtering.
- **Files**: Specific file paths and line numbers. Makes the finding grep-able and navigable.
- **Effort**: Rough t-shirt size (Small / Medium / Large). Not a time estimate -- a relative complexity indicator. Helps with prioritization: a High-severity/Small-effort finding should be done before a High-severity/Large-effort one.
- **Problem / Evidence / Recommendation**: The core content. Problem states what is wrong. Evidence proves it. Recommendation says exactly what to do.

#### 5. Backlog Table Format

The backlog table at the end should be a flat, filterable list:

```markdown
## Prioritized Backlog

| Priority | ID | Title | Severity | Category | Files | Effort |
|----------|----|-------|----------|----------|-------|--------|
| 1 | SEC-01 | innerHTML usage lacks safety documentation | Critical | Security | header.js, footer.js, fragment.js | Small |
| 2 | A11Y-01 | Hamburger button missing accessible label | Critical | Accessibility | header.js:42 | Small |
| 3 | PERF-01 | Empty fonts.css causes unnecessary network request | High | Performance | scripts.js:87, fonts.css | Small |
| ... | ... | ... | ... | ... | ... | ... |
```

Priority ordering rules:
1. Critical severity first, regardless of effort
2. Within same severity: Small effort before Large effort (quick wins first)
3. Within same severity and effort: group by category for thematic work

This table is designed to be directly convertible to GitHub Issues. Each row has enough information to create an issue title (Title), label (Severity + Category), and body (reference the finding ID in the report for full details).

#### 6. What NOT to Include in the Report

- **Do not duplicate the code-review skill's checklists**. The skill at `.skills/code-review/SKILL.md` already has comprehensive checklists. The report should reference it ("Review conducted using the project's code-review skill checklist") rather than reproducing it.
- **Do not include findings about `scripts/aem.js`**. This is upstream Adobe code. The meta-plan correctly excludes it. The report should state this exclusion in the Methodology section.
- **Do not include findings about `.skills/` or `.agents/`**. These are development tooling, not site code.
- **Do not include findings about content quality** (what is authored in DA). The report covers code, not copywriting.
- **Do not use emoji in severity indicators**. The existing repo docs use plain text. Use `Critical`, `High`, `Medium`, `Low` -- not colored circles or warning signs. (Per user preferences: no emoji.)

#### 7. Integration with Existing Repo Documentation

The report should:
- Be linked from nowhere initially. It is a standalone artifact. If the README gets updated in the future, it could link to it, but that is a separate task.
- Use the same Markdown style as AGENTS.md: tables for structured data, headers for navigation, code blocks for examples.
- Reference the code-review skill's severity definitions to maintain consistency.

### Additional Format Considerations

**Collapsible sections for large evidence blocks**: Use `<details>` tags for ESLint/Stylelint output dumps, long code snippets, or full file listings. This keeps the report scannable while preserving full evidence:

```markdown
<details>
<summary>ESLint output (23 warnings, 0 errors)</summary>

... full output here ...

</details>
```

**No Mermaid diagrams needed**: This is a findings report, not architecture documentation. Tables and lists are the right format. Diagrams would add complexity without improving scannability.

**One file, not many**: All findings go in one Markdown file, not split across multiple files. This makes the report searchable (Cmd+F works), printable, and reviewable in a single PR diff. At the expected size (~100-150 findings across all categories), one file at perhaps 500-800 lines is manageable.

---

## Proposed Tasks

### Task 1: Establish report template and skeleton

**What to do**: Create the empty report file at `docs/reviews/2026-02-11-comprehensive-code-review.md` with all section headers, the severity definition table, the methodology section (filled in with scope, exclusions, and commit SHA), and the empty backlog table header row.

**Deliverables**: The skeleton file committed to the working directory (not to git -- that happens after the full review).

**Dependencies**: Must happen before any review agent writes findings. All review agents write into this skeleton.

### Task 2: Define finding ID namespace

**What to do**: Establish the ID prefix convention for all finding categories so that agents writing findings use consistent prefixes:

| Category | Prefix | Example |
|----------|--------|---------|
| Code Quality | CODE | CODE-01 |
| Performance | PERF | PERF-01 |
| Accessibility | A11Y | A11Y-01 |
| Security | SEC | SEC-01 |
| SEO | SEO | SEO-01 |
| Test Coverage | TEST | TEST-01 |
| Maintainability | MAINT | MAINT-01 |

**Deliverables**: The prefix convention documented in the report skeleton's Methodology section.

**Dependencies**: Must be established before review agents produce findings.

### Task 3: Compile backlog table from categorized findings

**What to do**: After all review agents have written their findings into the category sections, compile the flat prioritized backlog table at the end of the report. Apply the priority ordering rules (Critical first, then quick wins within severity tiers). Assign priority numbers 1 through N. Verify every finding in the category sections has a corresponding backlog row and vice versa (no orphans).

**Deliverables**: Completed backlog table in the report. Cross-reference verification (no missing or duplicate findings).

**Dependencies**: All review category sections must be complete before this task runs.

### Task 4: Write executive summary

**What to do**: After the backlog table is compiled, write the Executive Summary section. Include:
- Total finding count by severity (table: X Critical, Y High, Z Medium, W Low)
- Top 3 priority areas with brief rationale
- Overall codebase health assessment in 3-5 sentences
- A one-sentence "what to do next" recommendation

**Deliverables**: Completed Executive Summary section.

**Dependencies**: Backlog table must be complete (Task 3) so the summary statistics are accurate.

### Task 5: Final report review and consistency check

**What to do**: Read the entire report end-to-end and verify:
- All finding IDs are unique and follow the prefix convention
- All file paths referenced actually exist in the repo
- Severity labels are consistent (no "BLOCKING" mixed with "Critical" -- pick one)
- The backlog table matches the findings sections
- Effort estimates are present for all findings
- Recommendations are specific and actionable (not vague)
- No emoji in the report
- Markdown renders correctly (tables, code blocks, details tags)

**Deliverables**: Clean, consistent final report.

**Dependencies**: Tasks 1-4 complete.

---

## Risks and Concerns

### Risk 1: Severity inflation

Multiple specialist agents reviewing the same codebase will naturally tend to rate their findings as high severity (every specialist thinks their domain is critical). Without calibration, the report could have 30 "Critical" findings, making the severity system meaningless.

**Mitigation**: The final compilation task (Task 3) should normalize severity ratings. Apply the rule: "Critical means the site is broken, insecure, or inaccessible NOW. High means it should be fixed in the next sprint. Medium means fix when convenient. Low means nice-to-have." No more than 3-5 Critical findings in a codebase of this size is a healthy signal. If more appear, re-evaluate.

### Risk 2: Findings too vague to be actionable

A finding like "improve accessibility" is not a backlog item. Each finding must specify exactly which file, which line, what to change, and why. If a finding cannot be made specific, it belongs in the "Codebase-Wide Patterns" section with a list of all affected files.

**Mitigation**: Task 5 (consistency check) explicitly verifies that recommendations are specific. Reject vague findings back to the originating review.

### Risk 3: Report becomes too long to be useful

If every possible improvement is documented, the report could reach thousands of lines. A 2000-line report will not be read.

**Mitigation**: Cap findings at the most impactful issues. The category sections should focus on the top findings per category (perhaps 5-15 per category). Minor linting issues that ESLint can auto-fix should be summarized as a single finding ("Run `npx eslint . --fix` to resolve 23 style warnings") rather than listed individually. The full lint output can go in a collapsible details block.

### Risk 4: Report format incompatible with agent writing patterns

If each specialist agent writes its findings independently, the formatting may be inconsistent (different table structures, different heading levels, different detail amounts). Merging these into a coherent document could be labor-intensive.

**Mitigation**: Task 1 (skeleton) must include a finding template that all agents follow. The template should be explicit about table columns, heading levels, and required fields. Each agent writes its section following the template exactly.

### Risk 5: Backlog not convertible to issues

If findings are not self-contained (they reference context from surrounding findings or assume the reader has read the full report), they cannot be extracted as independent GitHub Issues.

**Mitigation**: The finding format requires each finding to be independently understandable: it has its own title, file references, problem description, and recommendation. The backlog table links back to the finding ID for full details, but the table row itself should be sufficient to create an issue title and understand the scope.

---

## Additional Agents Needed

None. The current team of specialists (code-review, sitespeed, accessibility, security, seo, test, ux-strategy) plus this documentation planning covers all review dimensions and the report format design. The compilation and consistency tasks (Tasks 3-5) can be handled by the orchestrating agent or a general-purpose agent -- they do not require a new specialist.
