# Event Rule Single Version Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove user-visible event-rule content versions and make post-approval pausing of any enabled rules optional.

**Architecture:** Keep the existing rule-version records only as hidden compatibility snapshots. Simplify the rule page so a new content revision is represented by a new rule name, while the existing atomic approval function enables the submitted rule and pauses an optional frozen list of enabled rules.

**Tech Stack:** React, TypeScript, Arco Design React, Vitest, Zustand-style prototype store.

## Global Constraints

- Only published event-message templates may be bound to event notification rules.
- Submitting a rule never pauses another rule immediately.
- Approval must atomically enable the submitted rule and pause every selected enabled rule.
- The selectable pause list includes all enabled rules except the submitted rule.
- Content-version controls and tables must not be visible.

---

### Task 1: Remove content-version operations and UI

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/pages/automation/automationLifecycle.ts`
- Modify: `src/pages/automation/automationLifecycle.test.ts`
- Modify: `src/pages/automation/AutomationRuleListPage.tsx`
- Test: `src/pages/automation/AutomationRuleListPage.test.tsx`

**Interfaces:**
- Consumes: existing `EventNotificationRule`, `getEventRuleOperations`.
- Produces: an event-rule page without content-version actions, tables, columns, dialogs, or trigger content IDs.

- [ ] **Step 1: Replace the existing content-version UI test**

Assert that an enabled rule exposes only “查看详情” and “停用规则”, and that its detail drawer does not render “内容版本” or “创建内容版本”.

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- --run src/pages/automation/automationLifecycle.test.ts src/pages/automation/AutomationRuleListPage.test.tsx
```

Expected: FAIL because content-version operations and sections still exist.

- [ ] **Step 3: Remove the content-version operation and presentation**

Remove `"创建内容版本"` from `EventRuleOperation` and the enabled-rule operation map. Remove all version editor state, callbacks, modal, table, list column, imports, and wording from `AutomationRuleListPage.tsx`. Show the bound event template in rule details.

- [ ] **Step 4: Run the tests**

Run the command from Step 2. Expected: PASS.

### Task 2: Make post-approval pausing optional across all enabled rules

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`
- Modify: `src/pages/automation/AutomationRuleListPage.tsx`
- Modify: `src/pages/automation/AutomationRuleListPage.test.tsx`

**Interfaces:**
- Consumes: `submitEventRuleForReview(ruleId, pauseRuleIds)` and `reviewEventRule(ruleId, decision)`.
- Produces: optional frozen `replacementRuleIds` selected from every enabled rule and atomically paused only after approval.

- [ ] **Step 1: Write failing store and UI tests**

Cover submission without selected rules and selection of an enabled rule from a different system event.

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- --run src/store/prototypeStore.test.ts -t "event rule"
npm test -- --run src/pages/automation/AutomationRuleListPage.test.tsx
```

Expected: FAIL because candidate and validation logic still require the same event and the modal still requires an activation mode.

- [ ] **Step 3: Implement optional cross-event pause configuration**

Build candidates from every `status === "已启用"` rule except the submitted rule. Remove the parallel/replace radio and submit-button requirement. Relax store validation to permit any enabled rule while keeping all-or-nothing approval validation.

- [ ] **Step 4: Run focused tests and build**

```bash
npm test -- --run src/pages/automation/automationLifecycle.test.ts src/pages/automation/AutomationRuleListPage.test.tsx
npm test -- --run src/store/prototypeStore.test.ts -t "atomically replaces|does not partially|published shared template"
npm run build
```

Expected: all focused tests and the production build pass.

