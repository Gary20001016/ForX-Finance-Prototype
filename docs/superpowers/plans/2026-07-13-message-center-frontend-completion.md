# Message Center Frontend Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every missing frontend interaction identified by the PRD audit while keeping the project frontend-only.

**Architecture:** A typed external React store owns all mutable prototype entities and persists them locally. Feature pages consume domain actions and reusable content/preview components, while external services are represented by deterministic mock adapters.

**Tech Stack:** React 18, TypeScript, React Router, Arco Design React, Vitest, Testing Library.

## Global Constraints

- First-phase channels are Web inbox and App Push only.
- Machine translation is an external asynchronous task represented by a replaceable frontend adapter.
- All important actions must change observable frontend state; success-only placeholders are not acceptable.
- Preserve the seven PRD message categories and five manual audience types.

---

### Task 1: Typed prototype store

**Files:** Create `src/store/prototypeStore.ts`; modify `src/domain/types.ts`, `src/test/setup.ts`.

- [ ] Write store transition tests for read state, task submission, translation review and approval.
- [ ] Run the tests and confirm they fail because the store does not exist.
- [ ] Implement immutable state transitions, persistence and reset.
- [ ] Run store tests and the existing suite.

### Task 2: Template and translation production

**Files:** Create `src/pages/templates/TemplateEditorDrawer.tsx`; modify template and approval pages.

- [ ] Write failing interaction tests for content editing and initial machine translation creation.
- [ ] Implement Web/Push content fields, target locales, batch creation, retry and human review.
- [ ] Verify translation status updates and publishing gate behavior.

### Task 3: Task authoring and preview

**Files:** Modify `CreateTaskPage.tsx`, `TaskSummary.tsx`, `TaskListPage.tsx`; create reusable preview components.

- [ ] Write failing tests for temporary content, sample users and form-driven preview.
- [ ] Implement template/temporary branches, content fields, Push fields and audience calculation.
- [ ] Persist drafts and submitted tasks, and implement copy/pause/resume/cancel transitions.

### Task 4: Approval and user inbox

**Files:** Modify approval and inbox pages.

- [ ] Write failing tests for object-bound preview, risk confirmation, rejection and persisted read state.
- [ ] Implement frozen-content preview, maker-checker gates, rejection validation, action link and expiry behavior.

### Task 5: Operations pages

**Files:** Modify deliveries, settings, events, segments and analytics pages.

- [ ] Write failing tests for record filtering, allowlist CRUD, event test delivery and channel analytics.
- [ ] Implement interactive filtering and state-changing actions.
- [ ] Remove first-phase email/SMS options from task and template authoring.

### Task 6: Verification

- [ ] Run `npm run test:run` and confirm all tests pass.
- [ ] Run `npm run build` and confirm production build succeeds.
- [ ] Walk the four primary browser flows and fix visual or interaction regressions.
