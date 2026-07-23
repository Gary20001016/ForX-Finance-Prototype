# Nested Segment Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow existing combined segments to be selected as sources for a new combined segment while preserving nested logic and preventing dependency cycles.

**Architecture:** Extend the focused set-operation domain helper with nested expression formatting and graph traversal for cycle detection. Keep the existing `sourceSegmentIds` and `setOperation` model, then update the segment editor to expose all safe source segments and label their types.

**Tech Stack:** React 18, TypeScript, Arco Design React, Vitest, Testing Library.

## Global Constraints

- Preserve nested combined logic with Chinese full-width parentheses.
- Exclude the current segment and any candidate that would create a direct or indirect cycle.
- Do not change the existing persistence fields.
- Keep union, intersection, and estimate behavior compatible with existing segments.

---

### Task 1: Nested set-operation domain behavior

**Files:**
- Modify: `src/pages/segments/segmentSetOperations.ts`
- Test: `src/pages/segments/segmentSetOperations.test.ts`

**Interfaces:**
- Produces: `segmentDependsOn(segments, candidateId, targetId): boolean`
- Updates: `segmentSetExpression(segments, sourceSegmentIds, operation): string`

- [x] **Step 1: Write failing tests**

Add a combined fixture and assert that selecting it renders `（A ∩ B）∪ C`. Add direct and indirect dependency assertions for `segmentDependsOn`.

- [x] **Step 2: Verify RED**

Run: `npm test -- --run src/pages/segments/segmentSetOperations.test.ts`

Expected: nested expression and dependency tests fail because the helper behavior is missing.

- [x] **Step 3: Implement the domain helpers**

Format combined sources from their saved `rule` inside full-width parentheses. Traverse `sourceSegmentIds` with a visited set to detect whether a candidate directly or indirectly depends on a target.

- [x] **Step 4: Verify GREEN**

Run: `npm test -- --run src/pages/segments/segmentSetOperations.test.ts`

Expected: all set-operation tests pass.

### Task 2: Expose safe combined sources in the editor

**Files:**
- Modify: `src/pages/segments/SegmentListPage.tsx`
- Test: `src/pages/segments/SegmentListPage.interactions.test.tsx`

**Interfaces:**
- Consumes: `segmentDependsOn` and the updated `segmentSetExpression`.
- Produces: a source selector containing dynamic, static, and combined segments, excluding unsafe cyclic choices while editing.

- [x] **Step 1: Write failing interaction test**

Open a new combined segment and assert that the existing combined segment `沉默交易且 ETH 活跃用户` appears as a selectable option with its `组合分群` type.

- [x] **Step 2: Verify RED**

Run: `npm test -- --run src/pages/segments/SegmentListPage.interactions.test.tsx -t "allows an existing combined segment"`

Expected: fail because combined segments are filtered out.

- [x] **Step 3: Implement the editor behavior**

Remove the blanket combined-segment exclusion. Filter out the current segment and candidates for which `segmentDependsOn(data, candidate.id, editing.id)` is true. Include segment type in option and selected-tag labels.

- [x] **Step 4: Verify GREEN and types**

Run: `npm test -- --run src/pages/segments/SegmentListPage.interactions.test.tsx -t "allows an existing combined segment"`

Run: `npx tsc --noEmit --pretty false`

Expected: both commands exit successfully.
