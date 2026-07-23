# Event Rule Atomic Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow an event notification rule submission to declare enabled rules that must be stopped when the new rule is approved, preventing simultaneous sends.

**Architecture:** Store replacement rule IDs on the new rule when it is submitted. Approval validates that every selected rule still belongs to the same event and remains enabled, then updates the selected rules to `已停用` and the new rule to `已启用` in one store update. The frontend collects the relationship at submission time and shows the frozen impact in the rule drawer.

**Tech Stack:** React 18, TypeScript, Arco Design React, Vitest.

## Global Constraints

- Do not modify the event directory or event definitions.
- Rejected or withdrawn reviews must not change old rules.
- Approval must not partially apply replacement state.
- Do not delete old rules; keep them as `已停用` with a replacement reference for audit.
- Do not mutate git state because this is a shared dirty workspace.

---

### Task 1: Replacement domain behavior

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/store/prototypeStore.ts`
- Test: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Produces: `replacementRuleIds?: string[]` and `replacedByRuleId?: string` on `EventNotificationRule`.
- Produces: `submitEventRuleForReview(ruleId: string, replacementRuleIds: string[]): EventNotificationRule`.
- Updates: `reviewEventRule(ruleId, "approve")` performs all-or-nothing validation and state changes.

- [ ] Write a failing store test that submits a draft rule with `RULE-001` as its replacement and expects approval to enable the new rule, stop `RULE-001`, and record both references.
- [ ] Run `npm test -- --run src/store/prototypeStore.test.ts -t "atomically replaces selected event rules"` and confirm the missing interface/function failure.
- [ ] Add the relationship fields, submission validator, and one-update approval transition.
- [ ] Run the same test and confirm it passes.

### Task 2: Submission and detail UI

**Files:**
- Modify: `src/pages/automation/AutomationRuleListPage.tsx`
- Test: `src/pages/automation/AutomationRuleListPage.test.tsx`

**Interfaces:**
- Consumes: `submitEventRuleForReview` and `replacementRuleIds` from Task 1.
- Produces: a submission modal with “与现有规则并行生效” and “审核通过后替换旧规则”.

- [ ] Write a failing UI test that opens a draft rule, submits it for review, selects `RULE-001`, and verifies the frozen replacement relationship.
- [ ] Run `npm test -- --run src/pages/automation/AutomationRuleListPage.test.tsx -t "selects old rules when submitting"` and confirm failure because the modal is absent.
- [ ] Replace direct submission with a modal; limit candidates to enabled rules for the same event and display name, ID, condition, channels, and current content version.
- [ ] Show selected replacement rules in the rule detail drawer and use “审核并完成替换” for the approval action.
- [ ] Run the automation page tests and confirm they pass.

### Task 3: Verification

**Files:**
- Verify only; no production file changes expected.

- [ ] Run `npm test -- --run src/pages/automation/AutomationRuleListPage.test.tsx src/pages/automation/automationLifecycle.test.ts src/store/prototypeStore.test.ts`.
- [ ] Run `npm run build` and confirm TypeScript and Vite complete successfully.
