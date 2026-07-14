# Event Automation Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a complete frontend that separates artificial tasks, event definitions, event notification rules, rule content versions, trigger records, and channel delivery records.

**Architecture:** Introduce typed automation entities and store operations, then build dedicated routed pages over those entities. Existing event-triggered `MessageTask` seed data migrates into rules; manual task UI filters it out. Content replacement uses immutable rule content versions and an atomic current-version pointer switch.

**Tech Stack:** React 18, TypeScript, Arco Design React, React Router, prototype external store, Vitest, Testing Library.

## Global Constraints

- System events define schemas only and never bind message templates directly.
- Event notification rules are long-lived and do not become sending or completed because of one event instance.
- A rule may have many content versions and many trigger records.
- Publishing a new content version keeps the rule enabled and atomically replaces `currentVersionId`.
- Trigger idempotency uses rule ID plus event instance ID, not content version.
- Artificial message tasks remain isolated from event automation.
- Existing Web/App inbox and App Push delivery behavior must remain intact.

---

### Task 1: Automation domain and store

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`
- Create: `src/pages/automation/automationLifecycle.ts`
- Create: `src/pages/automation/automationLifecycle.test.ts`

**Interfaces:**
- Produces `EventNotificationRule`, `RuleContentVersion`, `TriggerRecord`, rule/version status unions, and `DeliveryRecord.triggerId`.
- Produces `createEventRule`, `changeEventRuleStatus`, `createRuleContentVersion`, `advanceRuleContentVersion`, `publishRuleContentVersion`, and an updated `testSystemEvent`.

- [ ] Write failing lifecycle tests for allowed rule actions, version progression, atomic publish, and idempotency-key stability.
- [ ] Run `npm test -- --run src/pages/automation/automationLifecycle.test.ts src/store/prototypeStore.test.ts` and verify missing types/functions fail.
- [ ] Implement typed automation entities, seed migration, lifecycle helpers, store actions, trigger generation and delivery linkage.
- [ ] Re-run the selected tests and verify they pass.

### Task 2: Navigation and artificial-task isolation

**Files:**
- Modify: `src/app/navigation.tsx`
- Modify: `src/app/navigation.test.tsx`
- Modify: `src/app/routes.tsx`
- Modify: `src/layout/AdminLayout.test.tsx`
- Modify: `src/pages/tasks/TaskListPage.tsx`
- Modify: `src/pages/tasks/TaskListPage.test.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`

**Interfaces:**
- Adds routes `/automation`, `/events`, `/triggers`, and keeps `/deliveries` as the channel-record route.

- [ ] Write failing navigation/task tests asserting the five separated objects and no event-triggered rows in artificial tasks.
- [ ] Run `npm test -- --run src/app/navigation.test.tsx src/layout/AdminLayout.test.tsx src/pages/tasks/TaskListPage.test.tsx` and verify RED.
- [ ] Rename navigation labels, register routes, filter artificial tasks, update page copy, and remove the event-trigger option from the artificial-task creation entry.
- [ ] Re-run the selected tests and verify GREEN.

### Task 3: Event notification rule frontend

**Files:**
- Create: `src/pages/automation/AutomationRuleListPage.tsx`
- Create: `src/pages/automation/AutomationRuleListPage.test.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/components/StatusTag.tsx`

**Interfaces:**
- Consumes automation store arrays/actions from Task 1.
- Produces a list, detail drawer, create-rule modal, lifecycle actions, version timeline and content-version workflow.

- [ ] Write failing UI tests for rule list fields, create rule, stop/start rule, create V2, machine translation progression, manual review, business review and atomic publish.
- [ ] Run `npm test -- --run src/pages/automation/AutomationRuleListPage.test.tsx` and verify the missing page fails.
- [ ] Implement the rule page and state-aware actions with exact confirmation copy for version switching.
- [ ] Re-run the page test and verify GREEN.

### Task 4: Event catalog, trigger records and channel linkage

**Files:**
- Modify: `src/pages/events/EventListPage.tsx`
- Modify: `src/pages/events/EventListPage.v2.test.tsx`
- Create: `src/pages/triggers/TriggerRecordPage.tsx`
- Create: `src/pages/triggers/TriggerRecordPage.test.tsx`
- Modify: `src/pages/deliveries/DeliveryPage.tsx`
- Modify: `src/pages/deliveries/DeliveryPage.test.tsx`

**Interfaces:**
- Event catalog reads `events` and `rules`.
- Trigger page reads `triggerRecords` and linked deliveries.
- Channel page reads `DeliveryRecord.triggerId`.

- [ ] Write failing tests for renamed event catalog, associated-rule counts, test-event trigger creation, trigger detail/version traceability, and delivery trigger IDs.
- [ ] Run the three page test files and verify RED.
- [ ] Refactor the event page, build trigger-record page, and add trigger columns/filters/details to channel records.
- [ ] Re-run the three page test files and verify GREEN.

### Task 5: PRD alignment and full verification

**Files:**
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/prd/message-center/04-系统事件.md`
- Modify: `docs/prd/message-center/07-渠道与发送记录.md`
- Create: `docs/prd/message-center/10-事件通知规则与触发记录.md`

- [ ] Update PRD terminology, object relations, version hot-swap flow, trigger fields, routes, states and acceptance criteria.
- [ ] Run `git diff --check` and resolve all whitespace errors.
- [ ] Run `npm test -- --run` and require zero failed tests and zero unhandled errors.
- [ ] Run `npm run build` and require exit code 0.
- [ ] Verify `/tasks`, `/automation`, `/events`, `/triggers`, and `/deliveries` in the running browser with no console errors.
