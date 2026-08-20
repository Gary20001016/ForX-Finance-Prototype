# Email Task Cost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calculate and display Email task cost from the compliance-filtered recipient count at `¥0.004` per send.

**Architecture:** A focused domain helper owns audience filtering, channel-specific cost calculation, and display formatting. Task authoring and approval creation both consume the helper so previewed and frozen costs cannot diverge.

**Tech Stack:** React, TypeScript, Arco Design React, Vitest, Testing Library.

## Global Constraints

- Email unit cost is exactly `¥0.004/封` in this frontend prototype.
- Billable sends equal `audienceCount - round(audienceCount × 0.047)` and never fall below zero.
- Show only selected channels and preserve channel order.
- Do not add live provider pricing, package tiers, exchange rates, or tax calculations.

---

### Task 1: Add the shared task estimate helper

**Files:**
- Create: `MSG/src/domain/taskEstimate.ts`
- Create: `MSG/src/domain/taskEstimate.test.ts`

**Interfaces:**
- Consumes: `Channel` from `MSG/src/domain/types.ts`.
- Produces: `calculateTaskAudienceEstimate(audienceCount: number)`, `formatTaskEstimatedCost(channels: Channel[], audienceCount: number)`, `EMAIL_UNIT_COST_CNY`.

- [ ] **Step 1: Write failing domain tests**

Cover an audience of `300000`, Email-only channel output, mixed selected-channel order, and zero recipients. Expected Email-only output is `Email 预计 ¥1,143.6（285,900 封 × ¥0.004）`.

- [ ] **Step 2: Run the domain test and verify RED**

Run: `npm test -- --run src/domain/taskEstimate.test.ts`

Expected: FAIL because `taskEstimate.ts` does not exist.

- [ ] **Step 3: Implement the minimal helper**

```ts
export const COMPLIANCE_FILTER_RATE = 0.047;
export const EMAIL_UNIT_COST_CNY = 0.004;

export function calculateTaskAudienceEstimate(audienceCount: number) {
  const normalizedCount = Math.max(0, Math.round(audienceCount));
  const filteredCount = Math.round(normalizedCount * COMPLIANCE_FILTER_RATE);
  return {
    filteredCount,
    finalSendCount: Math.max(0, normalizedCount - filteredCount),
  };
}

export function formatTaskEstimatedCost(
  channels: Channel[],
  audienceCount: number,
): string {
  // Map only selected channels; Email includes amount, count, and unit price.
}
```

- [ ] **Step 4: Run the domain test and verify GREEN**

Run: `npm test -- --run src/domain/taskEstimate.test.ts`

Expected: all tests PASS.

### Task 2: Render the shared estimate in task authoring

**Files:**
- Create: `MSG/src/pages/tasks/TaskSummary.email-cost.test.tsx`
- Modify: `MSG/src/pages/tasks/TaskSummary.tsx`
- Modify: `MSG/src/pages/tasks/CreateTaskPage.tsx`

**Interfaces:**
- Consumes: `calculateTaskAudienceEstimate` and `formatTaskEstimatedCost` from Task 1.
- Produces: task summary and audience preview values derived from one calculation contract.

- [ ] **Step 1: Write a failing TaskSummary component test**

Render an Email-only task with `audienceCount: 300000` and assert the summary contains `Email 预计 ¥1,143.6（285,900 封 × ¥0.004）` while omitting `Web ¥0` and `Push ¥0`.

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test -- --run src/pages/tasks/TaskSummary.email-cost.test.tsx`

Expected: FAIL because the component still renders `Web ¥0 · Push ¥0`.

- [ ] **Step 3: Replace inline calculations**

In `TaskSummary.tsx`, derive `filtered`, `deliverable`, and the “预计成本” value through the shared helper. In `CreateTaskPage.tsx`, use `calculateTaskAudienceEstimate(audience.count)` for the audience preview instead of separate `0.047` and `0.953` formulas.

- [ ] **Step 4: Run focused UI tests and verify GREEN**

Run: `npm test -- --run src/pages/tasks/TaskSummary.email-cost.test.tsx src/pages/tasks/CreateTaskPage.email.test.tsx`

Expected: all tests PASS.

### Task 3: Freeze the same cost into approvals

**Files:**
- Modify: `MSG/src/store/prototypeStore.ts`
- Modify: `MSG/src/store/prototypeStore.test.ts`

**Interfaces:**
- Consumes: `formatTaskEstimatedCost` from Task 1.
- Produces: task-linked `ApprovalItem.cost` identical to the task summary value.

- [ ] **Step 1: Add a failing store test**

Submit an Email-only task with `audienceCount: 300000`, find its linked approval, and expect `approval.cost` to equal `Email 预计 ¥1,143.6（285,900 封 × ¥0.004）`.

- [ ] **Step 2: Run the store test and verify RED**

Run: `npm test -- --run src/store/prototypeStore.test.ts -t "freezes the Email estimate"`

Expected: FAIL with the existing fixed `Web ¥0 · Push ¥0` value.

- [ ] **Step 3: Reuse the shared formatter in store flows**

Set new task approval costs with:

```ts
cost: formatTaskEstimatedCost(task.channels, task.audienceCount),
```

When normalizing seeded approvals linked to tasks, derive their channels once and calculate the same frozen task cost; preserve the original cost for approvals that are not linked to a task.

- [ ] **Step 4: Run store and focused feature tests**

Run: `npm test -- --run src/store/prototypeStore.test.ts src/domain/taskEstimate.test.ts src/pages/tasks/TaskSummary.email-cost.test.tsx`

Expected: all tests PASS.

### Task 4: Verify, publish, and deploy

**Files:**
- Modify: `MSG/docs/superpowers/plans/2026-08-20-email-task-cost.md` (mark completed)

**Interfaces:**
- Consumes: completed implementation from Tasks 1–3.
- Produces: verified Git commit, synchronized GitHub `main`, and server release.

- [ ] **Step 1: Run full verification**

Run: `npm test -- --run && npm run build && git diff --check`

Expected: all tests pass, production build succeeds, and diff check is clean.

- [ ] **Step 2: Commit and push only MSG changes**

Commit message: `feat(msg): estimate email task cost`

Push through the configured SSH remote to `origin/main` without adding root `dist`, `node_modules`, or `.superpowers`.

- [ ] **Step 3: Deploy atomically**

Upload `MSG/dist` to `/opt/forx-finance-msg/releases/release-<commit>`, atomically repoint `/opt/forx-finance-msg/current`, restart `forx-msg.service`, and retain the previous release.

- [ ] **Step 4: Verify production**

Confirm `forx-msg.service` is active, public task routes return HTTP 200, and local/server `index.html` SHA-256 values match.
