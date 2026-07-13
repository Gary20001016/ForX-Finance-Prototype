# Message Center V2 Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the React prototype with PRD V2.0 by adding a Web inbox, reducing admin navigation, completing core message operations, and refocusing analytics.

**Architecture:** Keep the existing Arco Design admin shell and mock-data approach. Add a separate user-facing inbox route and layout, centralize V2 message/category mock data, and reuse that data in details and analytics. Preserve existing admin pages in code while removing deferred modules from primary navigation.

**Tech Stack:** React 18, TypeScript, React Router, Arco Design React, Vitest, Testing Library.

## Global Constraints

- Current delivery is a frontend interaction prototype; no production APIs or persistence.
- Phase 1 enables Web inbox only; App Push is visibly reserved but not connected.
- Predefine exactly seven categories from PRD V2.0.
- Risk messages must remain visually prominent after they are read.
- Deferred pages may remain routable for compatibility but must not appear in primary navigation.

---

### Task 1: V2 Message Domain and User Inbox

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/mocks/data.ts`
- Create: `src/pages/inbox/InboxPage.tsx`
- Create: `src/pages/inbox/MessageDetailPage.tsx`
- Create: `src/pages/inbox/InboxPage.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Produces: `UserMessage`, `MessageCategory`, `messageCategories`, `userMessages`.
- Produces routes: `/inbox` and `/inbox/:messageId`.

- [ ] Write a failing test that expects seven category filters, an unread counter, a working single-message read action, and a working “全部已读” action.
- [ ] Run `npm run test:run -- --run src/pages/inbox/InboxPage.test.tsx`; expect failure because the inbox page does not exist.
- [ ] Add typed category and message fixtures with title, summary, category, time, read state, risk, body, expiry and target URL.
- [ ] Implement inbox list state, category/unread filters, all-read confirmation, risk styling and detail navigation.
- [ ] Implement detail content, automatic read callback, expired-link handling and safe internal navigation.
- [ ] Run the targeted test; expect all assertions to pass.

### Task 2: Navigation and Layout Scope

**Files:**
- Modify: `src/app/navigation.tsx`
- Modify: `src/layout/AdminLayout.tsx`
- Create: `src/app/navigation.test.tsx`

**Interfaces:**
- Primary admin navigation: 工作台、消息任务、消息模板、系统事件、用户与受众、审核中心、发送记录、数据分析、系统配置.
- User entry: `/inbox` labeled 用户消息中心.

- [ ] Write a failing navigation test that rejects 自动化流程、渠道管理、合规策略 from primary navigation and expects the V2 labels.
- [ ] Run the test and confirm it fails against V1 navigation.
- [ ] Replace primary navigation items while leaving deferred routes intact for bookmarked compatibility.
- [ ] Update header copy from four-channel health to Web inbox status and add an explicit user-inbox entry.
- [ ] Run navigation and layout tests; expect pass.

### Task 3: Core Admin Forms and Taxonomy

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/events/EventListPage.tsx`
- Modify: `src/pages/settings/SettingsPage.tsx`
- Modify: `src/utils/prototypeActions.tsx`
- Modify: `src/mocks/data.ts`
- Create: `src/pages/tasks/CreateTaskPage.v2.test.tsx`

**Interfaces:**
- Audience types: all, uid, vip, agent, campaign.
- Categories use the seven V2 codes and names.
- Event list exposes eight event definitions, with withdrawal success and failure separated.

- [ ] Write failing assertions for seven task categories, five audience types, valid/retention fields, and the eight event names.
- [ ] Run the targeted tests and confirm the current limited options fail.
- [ ] Update task steps to include the exact category, audience, expiry and retention controls from V2.
- [ ] Replace event fixtures with the eight PRD event codes and risk/category mappings.
- [ ] Replace settings category dictionary with the seven fixed categories and simplify tabs to categories, links, roles and audit.
- [ ] Extend template fields with supported languages and the five standard variables.
- [ ] Run targeted tests; expect pass.

### Task 4: V2 Analytics

**Files:**
- Modify: `src/pages/analytics/AnalyticsPage.tsx`
- Create: `src/pages/analytics/AnalyticsPage.test.tsx`

**Interfaces:**
- Metrics: generated messages, reached users, read users, unread messages, read rate, clicked users, click rate, expired unread and failures.

- [ ] Write a failing test for 阅读率、点击率、过期未读 and risk 5/30-minute reading metrics.
- [ ] Run the analytics test and confirm the legacy channel-cost dashboard fails it.
- [ ] Replace cost-heavy analytics with V2 KPI cards, reading trend, seven-category performance, source comparison and risk-message panel.
- [ ] Add filters for time, category, source, risk, audience, locale and client.
- [ ] Run the analytics test; expect pass.

### Task 5: Styling, Regression and Browser Audit

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Inbox must be usable at desktop and mobile widths.
- Urgent styles use red but retain readable contrast and visible focus states.

- [ ] Add responsive inbox, message card, risk banner, detail and V2 analytics styles.
- [ ] Run `npm run test:run`; expect all tests to pass.
- [ ] Run `npm run build`; expect TypeScript and Vite build success.
- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] Audit `/inbox`, `/inbox/:id`, `/tasks/create`, `/events`, `/analytics`, and sidebar navigation in the browser.
- [ ] Commit the complete V2 frontend alignment.
