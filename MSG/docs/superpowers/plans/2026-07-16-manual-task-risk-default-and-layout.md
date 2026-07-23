# Manual Task Risk Default and Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the redundant sending-method description from manual task authoring and make low risk the consistent default for newly created tasks.

**Architecture:** Keep the change inside `CreateTaskPage`: remove presentation-only JSX and replace every manual-task risk fallback from `中` to `低`. Preserve `copiedTask.risk` whenever a task is edited or copied.

**Tech Stack:** React 18, TypeScript, Arco Design React.

## Global Constraints

- New blank tasks default to `低` risk.
- Edited and copied tasks preserve `copiedTask.risk`.
- Operators can still select `低 / 中 / 高 / 关键`.
- Remove only the description module; do not change content source or channel behavior.
- Per user instruction, do not run tests or the production build.

---

### Task 1: Update task defaults and layout

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`

- [x] **Step 1: Change all risk fallbacks**

Change the submission fallback, temporary-template fallback, summary fallback, and form initial value from `中` to `低`, while keeping `copiedTask?.risk || "低"` for edit and copy flows.

- [x] **Step 2: Remove the sending-method description**

Delete the divider, `发送方式` heading, and informational alert between the channel selector and content source. Keep the existing content-source divider so the next section remains visually separated.

- [x] **Step 3: Run allowed static check**

Run: `git diff --check`

Expected: no output. Do not run tests or `npm run build`.

- [x] **Step 4: Commit implementation**

Commit: `fix: simplify manual task defaults`

### Task 2: Close documentation

**Files:**
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/superpowers/plans/2026-07-16-manual-task-risk-default-and-layout.md`

- [x] **Step 1: Document the new default**

State that new manual tasks default to low risk, while edit and copy retain the existing risk level.

- [x] **Step 2: Mark plan complete and check whitespace**

Mark every checkbox complete and run `git diff --check`.

- [x] **Step 3: Commit documentation**

Commit: `docs: align manual task risk default`
