# Unified Front-Display Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy seven-category/admin-only taxonomy with one shared five-category front-display taxonomy, controlled topics, and the four-level risk model across templates, tasks, event automation, approvals, analytics, and the user inbox.

**Architecture:** Add a single display-taxonomy domain module that owns category codes, topic definitions, labels, defaults, and lookup helpers. Persist `category` and `topic` on message-producing entities; keep message nature internal and derived from the controlled topic rather than editable. UI modules consume the shared taxonomy instead of declaring local category/risk arrays.

**Tech Stack:** React 18, TypeScript 5.9, Arco Design React, Vitest, Testing Library.

## Global Constraints

- Primary categories are exactly `announcement`, `trade`, `asset`, `security_risk`, and `campaign_reward`.
- Operator-facing risk levels are exactly `低`, `中`, `高`, and `关键`.
- Topics are controlled by system configuration and cannot be entered as arbitrary text.
- Reusable-template tasks inherit category, topic, and risk as read-only values.
- Temporary messages select category, topic, and risk, with risk defaulting to `低`.
- Event rules inherit display location from their selected event template.
- Message nature is not an editable field on category, template, or task screens.

---

### Task 1: Shared display taxonomy

**Files:**
- Create: `src/domain/messageDisplayTaxonomy.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/mocks/data.ts`
- Test: `src/domain/messageDisplayTaxonomy.test.ts`

**Interfaces:**
- Produces: `MESSAGE_DISPLAY_CATEGORIES`, `getDisplayCategory`, `getTopicsForCategory`, `getDisplayTopic`, `getTopicDefaults`, and `formatDisplayLocation`.
- Produces entity fields `category: MessageCategoryCode`, `topic: MessageTopicCode`, and `risk: RiskLevel`.

- [ ] **Step 1: Write failing taxonomy tests**

```ts
expect(MESSAGE_DISPLAY_CATEGORIES.map((item) => item.code)).toEqual([
  "announcement", "trade", "asset", "security_risk", "campaign_reward",
]);
expect(getTopicsForCategory("security_risk")).toHaveLength(6);
expect(getTopicDefaults("security_risk", "liquidation_warning")?.risk).toBe("关键");
```

- [ ] **Step 2: Run the test and confirm legacy taxonomy fails**

Run: `npm test -- --run src/domain/messageDisplayTaxonomy.test.ts`
Expected: FAIL because the shared taxonomy module does not exist.

- [ ] **Step 3: Implement types, five categories, controlled topics, and migrated fixtures**

Define five category records with 5/3/4/6/5 topics. Use topic metadata for internal nature and default risk. Replace user-message fixture codes and old three-level risks.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --run src/domain/messageDisplayTaxonomy.test.ts src/pages/inbox/InboxPage.test.tsx`
Expected: PASS with five user-facing categories.

### Task 2: System configuration

**Files:**
- Modify: `src/pages/settings/SettingsPage.tsx`
- Modify: `src/store/prototypeStore.ts`
- Test: `src/pages/settings/SettingsPage.v2.test.tsx`

**Interfaces:**
- Consumes: `MessageCategory.topics` and taxonomy lookup helpers.
- Produces: category ordering/status/default-risk updates and controlled topic management UI.

- [ ] **Step 1: Change the settings test to require “前台展示分类”, five rows, topic counts, and no message-nature field**
- [ ] **Step 2: Run the focused test and confirm failure**
- [ ] **Step 3: Replace the legacy settings list with the six-column display-category table and topic drawer**
- [ ] **Step 4: Run the focused settings tests**

### Task 3: Manual and event templates

**Files:**
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Modify: `src/pages/templates/TemplateReadOnlyDetails.tsx`
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/store/prototypeStore.ts`
- Test: `src/pages/templates/TemplateEditorDrawer.single-language.test.tsx`
- Test: `src/pages/templates/TemplateListPage.scope.test.tsx`

**Interfaces:**
- Consumes: shared category/topic options.
- Produces: templates with controlled `category`, `topic`, and `risk`.

- [ ] **Step 1: Update tests to require category/topic/risk and to reject the legacy nature field**
- [ ] **Step 2: Run tests and confirm failure**
- [ ] **Step 3: Implement linked category/topic selection, default risk, and saved topic snapshots**
- [ ] **Step 4: Run template tests**

### Task 4: Manual tasks

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/TaskListPage.tsx`
- Modify: `src/pages/tasks/TaskSummary.tsx`
- Test: `src/pages/tasks/CreateTaskPage.test.tsx`
- Test: `src/pages/tasks/TaskListPage.test.tsx`

**Interfaces:**
- Consumes: template display-location snapshot or shared taxonomy for temporary content.
- Produces: read-only inherited template location and editable temporary-message location.

- [ ] **Step 1: Add failing tests for inherited read-only fields, temporary linked selectors, and “展示位置” list output**
- [ ] **Step 2: Run focused tests and confirm failure**
- [ ] **Step 3: Implement template inheritance and temporary-message selectors**
- [ ] **Step 4: Run task tests**

### Task 5: Event rules and approvals

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/pages/automation/AutomationRuleListPage.tsx`
- Modify: `src/pages/approvals/ApprovalDrawer.tsx`
- Modify: `src/store/prototypeStore.ts`
- Test: `src/pages/automation/AutomationRuleListPage.test.tsx`
- Test: `src/pages/approvals/ApprovalCenter.completion.test.tsx`

**Interfaces:**
- Consumes: selected event-template category/topic/risk.
- Produces: immutable event-rule display-location snapshots and approval-detail display fields.

- [ ] **Step 1: Add failing tests for rule inheritance and approval display-location/source fields**
- [ ] **Step 2: Run focused tests and confirm failure**
- [ ] **Step 3: Snapshot template display location into rules and approvals; render it read-only**
- [ ] **Step 4: Run automation and approval tests**

### Task 6: Analytics and cleanup

**Files:**
- Modify: `src/pages/analytics/AnalyticsPage.tsx`
- Modify: `src/pages/deliveries/DeliveryPage.tsx`
- Modify: `src/pages/inbox/InboxPage.tsx`
- Delete: `src/domain/messageCategoryPolicy.ts`
- Test: `src/pages/analytics/AnalyticsPage.test.tsx`

**Interfaces:**
- Consumes: shared taxonomy and risk options.
- Produces: category/topic/source/risk/channel/client/language/time filters.

- [ ] **Step 1: Add failing analytics and cleanup assertions**
- [ ] **Step 2: Run focused tests and confirm failure**
- [ ] **Step 3: Replace remaining local seven-category and three-risk arrays**
- [ ] **Step 4: Run the complete test suite and build**

Run: `npm test -- --run`
Expected: 0 failed tests.

Run: `npm run build`
Expected: TypeScript and Vite build complete successfully.
