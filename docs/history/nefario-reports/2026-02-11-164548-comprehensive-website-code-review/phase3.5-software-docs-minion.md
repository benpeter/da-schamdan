# software-docs-minion Review: ADVISE

## Non-Blocking Concerns

### 1. File Contention Risk is Real

The plan acknowledges "report file contention" as a risk but underestimates it. Five agents (Tasks 2-6) writing to the same file in parallel will cause issues:

- **Write conflicts**: If two agents read the skeleton, add their sections, and write back, one will overwrite the other's work
- **Merge failures**: Even with careful section boundaries, file-level writes are not atomic
- **Recommended mitigation**: Serialize Tasks 2-6 or have each agent write to a separate file (`findings-code.md`, `findings-perf.md`, etc.) that Task 7 then merges

The suggested "batch (2,3) then (4,5,6)" does not fully address this since each batch still has parallel writes.

### 2. Finding Template Clarity

The finding template (lines 79-94) is clear and well-structured. However:

- **Missing guidance on code snippet length**: "Evidence" section needs bounds (e.g., "max 15 lines, show relevant context")
- **Missing example of completed finding**: Template shows structure but no concrete example. New reviewers may interpret "One paragraph" differently
- **Recommendation**: Add one complete example finding after the template

### 3. Backlog Table Usefulness

The backlog table (line 67, detailed in Task 7) is well-designed for prioritization. One enhancement:

- **Missing "Status" column**: Once fixes begin, tracking "Open/In Progress/Done" requires modifying the report or creating a separate tracker
- **Consider**: Add Status column (default: Open) or note that backlog should be migrated to GitHub Issues for tracking

### 4. Methodology Section Placement

The Methodology section is listed last (line 69) but contains critical information reviewers need upfront, including:

- The finding template (lines 77-94)
- Boilerplate policy
- Severity definitions (duplicated in lines 47-51)

**Recommendation**: Move Methodology immediately after Executive Summary, before category sections.

### 5. Missing Report Metadata

The skeleton (Task 1, lines 41-43) includes review date and commit SHA. Consider adding:

- **Reviewers**: List of agents/specialists who contributed (for transparency)
- **Review duration**: Start/end timestamps (auto-generated from delegation execution)
- **Tool versions**: ESLint, Stylelint, test runner versions from package.json

This metadata is standard in professional code review reports and enables future readers to assess context.

### 6. Cross-Reference Mechanism

Task 7 (line 498) mentions "cross-referencing by finding ID" for codebase-wide patterns. The plan does not specify the cross-reference format.

**Recommendation**: Specify that cross-references use markdown links: `[CODE-05](#code-05-short-title)` to enable navigation in rendered markdown.

## Positive Aspects

- Finding template is structured and consistent
- Severity taxonomy is clearly defined and aligned with existing project skill
- Effort estimates (S/M/L/XL) are practical for prioritization
- Boilerplate labeling prevents false positives
- Executive summary includes finding count table and prioritization rationale
- Task 7 consistency check is thorough (lines 527-543)

## Summary

The report structure is sound. The finding template is clear enough for consistent output, though a concrete example would help. The backlog table will be useful for prioritization but lacks status tracking for execution phase.

**The primary concern is file contention**. Recommend serializing Tasks 2-6 or using separate files per task that Task 7 merges. The risk is not hypothetical: concurrent file writes will cause overwrites or require manual merge conflict resolution.

Minor improvements: move Methodology earlier, add report metadata, specify cross-reference format, bound code snippet length in template.
