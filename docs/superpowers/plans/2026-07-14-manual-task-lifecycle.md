# Manual Task Lifecycle Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mixed artificial-message task statuses with nine lifecycle states, separate approval and delivery-result fields, and state-aware standardized operations throughout the frontend.

**Architecture:** Add a pure lifecycle rules module that owns allowed operations and state transitions. The prototype store applies those rules and synchronizes approval/result fields, while the task list renders the three dimensions separately and derives its operation menu from the same rules. Event-triggered task lifecycle remains independent.

**Tech Stack:** React 18, TypeScript, Arco Design React, Zustand-style prototype store, Vitest, Testing Library.

## Global Constraints

- Artificial task states are exactly: `草稿`、`待审核`、`待修改`、`待发送`、`发送中`、`已暂停`、`已完成`、`已取消`、`已过期`.
- Approval status and delivery result must not be represented as artificial task status.
- User operation labels are exactly: `查看详情`、`编辑任务`、`复制任务`、`提交审核`、`撤回审核`、`通过审核`、`驳回审核`、`取消任务`、`暂停发送`、`恢复发送`、`重试失败项`.
- Completed tasks keep `已完成`; outcome is `成功`、`部分失败` or `失败`.
- Event-triggered tasks retain `草稿 → 待审核 → 已启用 → 已停用/已过期` and event delivery outcomes stay in delivery records.
- Preserve unrelated dirty-worktree changes and stage only newly created planning artifacts automatically.

---

### Task 1: Pure artificial-task lifecycle rules

**Files:**
- Create: `src/pages/tasks/taskLifecycle.ts`
- Create: `src/pages/tasks/taskLifecycle.test.ts`
- Modify: `src/domain/types.ts`

**Interfaces:**
- Produces: `ManualTaskStatus`, `ManualTaskApprovalStatus`, `ManualTaskDeliveryResult`, `ManualTaskOperation`.
- Produces: `MANUAL_TASK_STATUSES`, `getManualTaskOperations(task)`, `canEditManualTask(status)`, `transitionManualTask(status, operation)`.

- [ ] **Step 1: Write failing lifecycle tests**

Test the exact nine-state array, allowed operation sets for every state, retry visibility only for completed partial/failed tasks, and transitions for edit, withdraw, pause, resume, cancel, complete and expire.

- [ ] **Step 2: Run the lifecycle test and verify RED**

Run: `npm test -- --run src/pages/tasks/taskLifecycle.test.ts`

Expected: FAIL because `taskLifecycle.ts` and the new domain types do not exist.

- [ ] **Step 3: Implement the typed rule module**

Use exhaustive records for operation availability and a transition table. `查看详情` and `复制任务` never change the original status. Invalid state/action pairs return the original status so the store can reject or ignore them safely.

- [ ] **Step 4: Run the lifecycle test and verify GREEN**

Run: `npm test -- --run src/pages/tasks/taskLifecycle.test.ts`

Expected: all lifecycle tests pass.

### Task 2: Store and mock-data synchronization

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/mocks/data.ts`
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Consumes: lifecycle types and `transitionManualTask` from Task 1.
- Produces: `performManualTaskOperation(taskId, operation)`.

- [ ] **Step 1: Write failing store tests**

Cover draft submission, approval pass for immediate versus scheduled artificial tasks, rejection to `待修改`, withdrawal to `草稿`, pause/resume/cancel transitions, and completed tasks retaining `已完成` with separate failed outcome.

- [ ] **Step 2: Run store tests and verify RED**

Run: `npm test -- --run src/store/prototypeStore.test.ts`

Expected: FAIL on missing separated fields and operation function.

- [ ] **Step 3: Implement store synchronization and normalize mocks**

Add optional `approvalStatus` and `deliveryResult` to `MessageTask`. Save and submit functions populate them; approval review updates them without using approval results as task status. Normalize artificial mock tasks; normalize event tasks to `已启用` where appropriate.

- [ ] **Step 4: Run store tests and verify GREEN**

Run: `npm test -- --run src/store/prototypeStore.test.ts`

Expected: all store tests pass.

### Task 3: Task-list columns, filters and standardized operations

**Files:**
- Modify: `src/pages/tasks/TaskListPage.tsx`
- Modify: `src/pages/tasks/TaskListPage.test.tsx`
- Modify: `src/components/StatusTag.tsx`
- Modify: `src/components/StatusTag.test.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`

**Interfaces:**
- Consumes: `MANUAL_TASK_STATUSES`, `getManualTaskOperations`, `canEditManualTask`, `performManualTaskOperation`.

- [ ] **Step 1: Write failing page tests**

Assert separate task/approval/result columns, nine standardized artificial states in the filter, absence of mixed task statuses, exact action labels per current state, and state changes after withdraw, pause, resume and cancel confirmations.

- [ ] **Step 2: Run page tests and verify RED**

Run: `npm test -- --run src/pages/tasks/TaskListPage.test.tsx src/components/StatusTag.test.tsx`

Expected: FAIL because the current page mixes status dimensions and uses `继续编辑`/`再次编辑`.

- [ ] **Step 3: Implement the state-aware task list**

Render task status, approval status and delivery result separately. Derive menu entries from the lifecycle rule module; keep common `查看详情` and `复制任务`; use `编辑任务` consistently; add withdrawal and failed-item retry behavior; preserve event task handling. Make copied/resumed editing honor `canEditManualTask`.

- [ ] **Step 4: Run page and related create-task tests**

Run: `npm test -- --run src/pages/tasks/TaskListPage.test.tsx src/components/StatusTag.test.tsx src/pages/tasks/CreateTaskPage.test.tsx src/pages/tasks/CreateTaskPage.event.test.tsx`

Expected: all selected tests pass.

### Task 4: PRD lifecycle alignment

**Files:**
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/prd/message-center/06-审核与发布.md`
- Modify: `docs/prd/message-center/07-渠道与发送记录.md`

- [ ] **Step 1: Replace the mixed artificial-task state definitions**

Document the nine lifecycle states, standardized operation names, separate approval/delivery fields, immediate-versus-scheduled approval behavior, immutable terminal states, and retry-batch behavior.

- [ ] **Step 2: Validate terminology and formatting**

Run: `rg -n "已通过 → 待发送|任务状态.*部分失败|任务状态.*失败|已驳回" docs/prd/message-center/02-消息任务.md docs/prd/message-center/06-审核与发布.md docs/prd/message-center/07-渠道与发送记录.md`

Expected: no obsolete artificial-task lifecycle definitions remain; translation and channel-record uses may remain.

### Task 5: Full verification and browser acceptance

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run formatting integrity check**

Run: `git diff --check`

Expected: exit code 0.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test -- --run`

Expected: all test files and assertions pass with zero unhandled errors.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite build exit code 0.

- [ ] **Step 4: Verify the running task-list page**

Open `http://127.0.0.1:5174/tasks`, verify separated columns and state-aware operation menus, exercise one reversible pause/resume or withdrawal flow, and confirm the browser console has no errors.
