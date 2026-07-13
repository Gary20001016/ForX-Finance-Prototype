# CEX Activity Management Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, runnable Arco Design React admin prototype for the CEX activity-management PRD, covering activity lifecycle, participation, ranking, approvals, settlement, rewards, analytics, and audit workflows.

**Architecture:** Use a Vite React TypeScript single-page application with React Router. Separate the application shell, route metadata, shared domain types, deterministic fixtures, reusable components, and feature pages; keep all mutations in local React state and clearly label the product as a non-production prototype.

**Tech Stack:** React 19, TypeScript, Vite, React Router, `@arco-design/web-react` 2.66.15, Vitest, Testing Library, CSS custom properties.

## Global Constraints

- `PRD-CEX-activity-management.md` is the product source of truth.
- UI copy is Simplified Chinese; timestamps include `UTC+8` where relevant.
- Use Arco Design components and icons instead of recreating standard controls.
- The deliverable is a frontend prototype with deterministic local mock data; it must not call real trading, wallet, reward, or user APIs.
- Activity status and settlement status are independent fields throughout the UI.
- High-risk actions show impact, reason, and audit-oriented confirmation copy.
- Desktop is primary; layouts remain usable at 1024px and narrow mobile widths.
- Use a restrained CEX operations palette: dark navy navigation, cool gray workspace, blue primary actions, amber for risk, and red only for destructive or failed states.

---

## File Map

- `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`: application and test toolchain.
- `src/main.tsx`, `src/App.tsx`: startup, locale, and router composition.
- `src/app/navigation.tsx`, `src/app/routes.tsx`: navigation metadata and routes.
- `src/layout/AdminLayout.tsx`: responsive sidebar, header, breadcrumb, and user menu.
- `src/styles/global.css`: visual tokens, shell, content layouts, and responsive rules.
- `src/domain/types.ts`, `src/domain/status.ts`: shared entities and status presentation.
- `src/mocks/data.ts`: deterministic activity, approval, participant, leaderboard, settlement, reward, and audit fixtures.
- `src/components/*`: reusable page header, metric cards, status tags, filter bars, risk panels, and tables.
- `src/pages/dashboard/*`: operating overview.
- `src/pages/activities/*`: list, detail, and activity editor wizard.
- `src/pages/approvals/*`, `src/pages/participants/*`, `src/pages/leaderboards/*`: approval and participation operations.
- `src/pages/settlements/*`, `src/pages/rewards/*`: settlement preview and reward orders.
- `src/pages/analytics/*`, `src/pages/audit/*`, `src/pages/settings/*`: reporting and governance.
- `src/test/setup.ts`, `src/**/*.test.tsx`: test environment and behavior-focused tests.

### Task 1: Bootstrap the tested Arco React application

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `App(): JSX.Element`; scripts `dev`, `build`, `test`, and `test:run`.

- [ ] **Step 1: Create the package manifest and failing smoke test**

```json
{
  "name": "cex-activity-management-admin",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "@arco-design/web-react": "2.66.15",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.9.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.1.16",
    "@types/react-dom": "^19.1.9",
    "@vitejs/plugin-react": "^5.0.4",
    "jsdom": "^27.0.0",
    "typescript": "~5.9.3",
    "vite": "^7.1.7",
    "vitest": "^3.2.4"
  }
}
```

```tsx
// src/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from './App';

it('renders the activity operations product name', () => {
  render(<App />);
  expect(screen.getByText('活动运营中心')).toBeInTheDocument();
});
```

- [ ] **Step 2: Install packages and verify the test fails because `App` is missing**

Run: `npm install`

Run: `npm run test:run -- src/App.test.tsx`

Expected: FAIL because `src/App.tsx` has not been implemented.

- [ ] **Step 3: Add Vite, TypeScript, test setup, and minimal `App`**

```tsx
// src/App.tsx
export default function App() {
  return <main>活动运营中心</main>;
}
```

Configure Vitest in `vite.config.ts` with `environment: 'jsdom'` and `setupFiles: './src/test/setup.ts'`; import `@testing-library/jest-dom/vitest` from the setup file. `src/main.tsx` imports Arco CSS and renders `<App />` inside `React.StrictMode`.

- [ ] **Step 4: Verify the smoke test and production build**

Run: `npm run test:run -- src/App.test.tsx`

Expected: 1 passing test.

Run: `npm run build`

Expected: exit 0 and `dist/` is generated.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json index.html tsconfig*.json vite.config.ts src
git commit -m "chore: bootstrap activity admin"
```

### Task 2: Build the responsive admin shell and routing

**Files:**
- Create: `src/app/navigation.tsx`
- Create: `src/app/routes.tsx`
- Create: `src/layout/AdminLayout.tsx`
- Create: `src/styles/global.css`
- Create: `src/pages/PlaceholderPage.tsx`
- Modify: `src/App.tsx`
- Test: `src/layout/AdminLayout.test.tsx`

**Interfaces:**
- Produces: `navigationGroups: NavigationGroup[]`; `appRoutes: RouteObject[]`; `AdminLayout()` with `<Outlet />`.

- [ ] **Step 1: Write a failing navigation test**

```tsx
it('shows core activity operations navigation', () => {
  render(<MemoryRouter initialEntries={['/activities']}><AdminLayout /></MemoryRouter>);
  expect(screen.getByText('活动管理')).toBeInTheDocument();
  expect(screen.getByText('结算中心')).toBeInTheDocument();
  expect(screen.getByText('审核中心')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm run test:run -- src/layout/AdminLayout.test.tsx`

Expected: FAIL because `AdminLayout` does not exist.

- [ ] **Step 3: Implement routes and the Arco shell**

Create routes for `/dashboard`, `/activities`, `/activities/new`, `/activities/:id`, `/approvals`, `/participants`, `/leaderboards`, `/settlements`, `/rewards`, `/analytics`, `/audit`, and `/settings`. Use Arco `Layout`, `Menu`, `Breadcrumb`, `Badge`, `Avatar`, `Dropdown`, `Button`, and icons. Header content: environment `PROD · 只读原型`, search, pending-approval badge, `UTC+8`, help, and administrator avatar.

- [ ] **Step 4: Add global design tokens and responsive rules**

```css
:root {
  --am-nav: #0c1729;
  --am-nav-soft: #16243a;
  --am-primary: #165dff;
  --am-bg: #f4f6f9;
  --am-surface: #ffffff;
  --am-border: #e5e9ef;
  --am-text: #17233d;
  --am-muted: #6b778c;
  --am-warning: #ff9a2e;
  --am-danger: #f53f3f;
}
```

At widths below 1100px collapse the sidebar; below 720px stack page-header actions and allow horizontal overflow only inside tables.

- [ ] **Step 5: Verify shell tests and build**

Run: `npm run test:run -- src/layout/AdminLayout.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add activity admin shell"
```

### Task 3: Add domain types, fixtures, and reusable components

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/status.ts`
- Create: `src/mocks/data.ts`
- Create: `src/components/PageHeader.tsx`
- Create: `src/components/MetricCard.tsx`
- Create: `src/components/StatusTag.tsx`
- Create: `src/components/FilterBar.tsx`
- Create: `src/components/RiskNotice.tsx`
- Create: `src/components/ResourceTable.tsx`
- Test: `src/components/StatusTag.test.tsx`

**Interfaces:**
- Produces: `Activity`, `ActivityStatus`, `SettlementStatus`, `ApprovalItem`, `Participant`, `LeaderboardEntry`, `SettlementBatch`, `RewardOrder`, and `AuditEvent` types; fixture arrays; `StatusTag({ status })`.

- [ ] **Step 1: Define shared status types and write a failing mapping test**

```ts
export type ActivityStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'ended' | 'offline';
export type SettlementStatus = 'not_started' | 'pending' | 'calculating' | 'preview' | 'reviewing' | 'ready' | 'issuing' | 'partial_failed' | 'completed' | 'cancelled';
```

```tsx
it('renders activity and settlement labels independently', () => {
  render(<><StatusTag status="running" /><StatusTag status="reviewing" /></>);
  expect(screen.getByText('进行中')).toBeInTheDocument();
  expect(screen.getByText('审核中')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:run -- src/components/StatusTag.test.tsx`

Expected: FAIL because status metadata and component do not exist.

- [ ] **Step 3: Implement types, status metadata, fixtures, and components**

Create at least 12 realistic activities spanning all six types and all activity states. Include separate settlement states, UTC+8 timestamps, owner, region, budget, participant count, metric, risk level, and approval progress. Shared components accept typed props and avoid importing page-specific fixtures.

- [ ] **Step 4: Verify the component test and build**

Run: `npm run test:run -- src/components/StatusTag.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/domain src/mocks src/components
git commit -m "feat: add activity domain foundation"
```

### Task 4: Implement the operating dashboard and activity list

**Files:**
- Create: `src/pages/dashboard/DashboardPage.tsx`
- Create: `src/pages/activities/ActivityListPage.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/pages/activities/ActivityListPage.test.tsx`

**Interfaces:**
- Consumes: `activities`, `MetricCard`, `StatusTag`, `FilterBar`, `ResourceTable`.
- Produces: dashboard overview and filterable `/activities` list.

- [ ] **Step 1: Write a failing list behavior test**

```tsx
it('filters activities by keyword and preserves separate statuses', async () => {
  render(<MemoryRouter><ActivityListPage /></MemoryRouter>);
  await userEvent.type(screen.getByPlaceholderText('搜索活动名称或 ID'), 'BTC');
  expect(screen.getByText('BTC 巅峰交易赛')).toBeInTheDocument();
  expect(screen.queryByText('邀请好友赢返佣')).not.toBeInTheDocument();
  expect(screen.getByText('进行中')).toBeInTheDocument();
  expect(screen.getByText('未开始')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm run test:run -- src/pages/activities/ActivityListPage.test.tsx`

Expected: FAIL because the page is missing.

- [ ] **Step 3: Implement dashboard and list**

Dashboard cards: active activities, pending approvals, pending settlements, reward budget, participants, valid trading volume, conversion, and active alerts. Add trend placeholders, upcoming lifecycle tasks, settlement-risk list, and recent audit events. Activity list filters: keyword, type, activity status, settlement status, risk, business line, owner, and date range. Row actions depend on activity state and include view, edit, copy, pause, resume, offline, settle, and export.

- [ ] **Step 4: Verify behavior and build**

Run: `npm run test:run -- src/pages/activities/ActivityListPage.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/dashboard src/pages/activities src/app/routes.tsx
git commit -m "feat: add activity dashboard and list"
```

### Task 5: Build the activity creation and editing wizard

**Files:**
- Create: `src/pages/activities/editor/ActivityEditorPage.tsx`
- Create: `src/pages/activities/editor/BasicInfoStep.tsx`
- Create: `src/pages/activities/editor/ParticipationStep.tsx`
- Create: `src/pages/activities/editor/MetricRankingStep.tsx`
- Create: `src/pages/activities/editor/RewardStep.tsx`
- Create: `src/pages/activities/editor/PreviewSubmitStep.tsx`
- Create: `src/pages/activities/editor/editorValidation.ts`
- Modify: `src/app/routes.tsx`
- Test: `src/pages/activities/editor/editorValidation.test.ts`

**Interfaces:**
- Produces: `validateSchedule(values): ValidationIssue[]`; typed `ActivityDraft`; `/activities/new` and `/activities/:id/edit`.

- [ ] **Step 1: Write failing validation tests**

```ts
it('rejects display and activity time in the wrong order', () => {
  expect(validateSchedule({
    displayStart: 40,
    activityStart: 30,
    activityEnd: 20,
    displayEnd: 10,
  })).toEqual(expect.arrayContaining([
    expect.objectContaining({ field: 'schedule', level: 'error' }),
  ]));
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:run -- src/pages/activities/editor/editorValidation.test.ts`

Expected: FAIL because the validator is missing.

- [ ] **Step 3: Implement validation and the five-step wizard**

Use Arco `Steps`, `Form`, `DatePicker.RangePicker`, `Upload`, `InputNumber`, `Select`, `Switch`, `Radio`, `Tabs`, `Table`, `Alert`, and `Result`. Enforce `displayStart ≤ activityStart < activityEnd ≤ displayEnd`; require budget, ranking tie-break, region, fallback language, and settlement mode; warn when maximum reward cost exceeds reserved budget. Each activity type reveals its dedicated metric fields.

- [ ] **Step 4: Implement preview and submission review**

Show desktop/mobile activity cards, user eligibility states, maximum-cost summary, impacted users, risk level, approval route, and a `仅创建模拟审批单，不会真实上线或发奖` warning. Save draft and submit actions update local state and show Arco messages.

- [ ] **Step 5: Verify tests and build**

Run: `npm run test:run -- src/pages/activities/editor/editorValidation.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/activities/editor src/app/routes.tsx
git commit -m "feat: add activity configuration wizard"
```

### Task 6: Add activity detail, lifecycle operations, and version comparison

**Files:**
- Create: `src/pages/activities/ActivityDetailPage.tsx`
- Create: `src/pages/activities/ActivityOverviewTab.tsx`
- Create: `src/pages/activities/ActivityRulesTab.tsx`
- Create: `src/pages/activities/ActivityVersionsTab.tsx`
- Create: `src/components/HighRiskActionModal.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/components/HighRiskActionModal.test.tsx`

**Interfaces:**
- Produces: details route; `HighRiskActionModal` requiring action reason and activity-name confirmation.

- [ ] **Step 1: Write a failing confirmation-safety test**

```tsx
it('keeps a destructive action disabled until reason and activity name match', async () => {
  render(<HighRiskActionModal open activityName="BTC 巅峰交易赛" action="offline" onConfirm={vi.fn()} />);
  expect(screen.getByRole('button', { name: '确认下线' })).toBeDisabled();
  await userEvent.type(screen.getByLabelText('操作原因'), '市场异常，立即停止活动');
  await userEvent.type(screen.getByLabelText('输入活动名称确认'), 'BTC 巅峰交易赛');
  expect(screen.getByRole('button', { name: '确认下线' })).toBeEnabled();
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm run test:run -- src/components/HighRiskActionModal.test.tsx`

Expected: FAIL because the modal does not exist.

- [ ] **Step 3: Implement activity detail and state-aware actions**

Header shows activity status and settlement status separately. Tabs cover overview, participation rules, metrics/ranking, rewards, front-end preview, versions, and operation logs. Pause, resume, early-end, and offline actions show impacted users, whether metrics continue, whether paused data is recalculated, audit reason, and approval requirement.

- [ ] **Step 4: Add version comparison**

Display immutable published versions, field-level before/after changes, approvers, effective time, and affected scopes. Key-field changes are highlighted amber; budget or eligibility expansion is red.

- [ ] **Step 5: Verify safety tests and build**

Run: `npm run test:run -- src/components/HighRiskActionModal.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/activities src/components/HighRiskActionModal.tsx src/app/routes.tsx
git commit -m "feat: add lifecycle and version controls"
```

### Task 7: Implement approvals, participation, and leaderboard operations

**Files:**
- Create: `src/pages/approvals/ApprovalCenterPage.tsx`
- Create: `src/pages/participants/ParticipantPage.tsx`
- Create: `src/pages/leaderboards/LeaderboardPage.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/pages/approvals/ApprovalCenterPage.test.tsx`

**Interfaces:**
- Consumes: approval, participant, and leaderboard fixtures.
- Produces: `/approvals`, `/participants`, and `/leaderboards` routes.

- [ ] **Step 1: Write a failing approval-risk test**

```tsx
it('shows dual approval for high-risk activities', () => {
  render(<ApprovalCenterPage />);
  expect(screen.getByText('双审')).toBeInTheDocument();
  expect(screen.getByText('财务复核')).toBeInTheDocument();
  expect(screen.getByText('最大成本')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm run test:run -- src/pages/approvals/ApprovalCenterPage.test.tsx`

Expected: FAIL because the page is missing.

- [ ] **Step 3: Implement the three operations pages**

Approval center shows version diff, impacted users, maximum cost, regions, data-source readiness, and approve/reject comments. Participant page shows registration status, eligibility checks, masked UID, progress, source, risk label, and export guardrails. Leaderboard page shows live/final snapshot toggle, watermark, masked users, metric values, tie-break result, anomaly flags, and the signed-in user's row.

- [ ] **Step 4: Verify tests and build**

Run: `npm run test:run -- src/pages/approvals/ApprovalCenterPage.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/approvals src/pages/participants src/pages/leaderboards src/app/routes.tsx
git commit -m "feat: add approval and participation operations"
```

### Task 8: Implement settlement preview and reward-order management

**Files:**
- Create: `src/pages/settlements/SettlementCenterPage.tsx`
- Create: `src/pages/settlements/SettlementDetailPage.tsx`
- Create: `src/pages/settlements/SettlementPreviewPanel.tsx`
- Create: `src/pages/rewards/RewardOrdersPage.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/pages/settlements/SettlementPreviewPanel.test.tsx`

**Interfaces:**
- Produces: settlement summary, exception removal review, reward confirmation, reward order status, and reconciliation views.

- [ ] **Step 1: Write a failing settlement preview test**

```tsx
it('separates excluded users and blocks payout while reconciliation differs', () => {
  render(<SettlementPreviewPanel batch={partialFailedBatch} />);
  expect(screen.getByText('异常剔除 38 人')).toBeInTheDocument();
  expect(screen.getByText('对账差异 3 笔')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '确认生成奖励单' })).toBeDisabled();
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm run test:run -- src/pages/settlements/SettlementPreviewPanel.test.tsx`

Expected: FAIL because the preview panel is missing.

- [ ] **Step 3: Implement settlement center and detail**

Show independent settlement states, data cutoff, calculator version, candidate users, qualified users, excluded users, live-to-final ranking differences, reward totals, budget release, and reconciliation. The exclusion drawer requires rule ID, evidence reference, reason, and second reviewer. Automatic and manual settlement share the same preview flow.

- [ ] **Step 4: Implement reward orders**

Show masked UID, activity, reward item, amount, currency, idempotency key, reward-center status, ledger reference, retries, and failure reason. Retrying preserves the idempotency key and displays a non-production warning.

- [ ] **Step 5: Verify tests and build**

Run: `npm run test:run -- src/pages/settlements/SettlementPreviewPanel.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/settlements src/pages/rewards src/app/routes.tsx
git commit -m "feat: add settlement and reward operations"
```

### Task 9: Add analytics, audit, settings, and end-to-end route coverage

**Files:**
- Create: `src/pages/analytics/AnalyticsPage.tsx`
- Create: `src/pages/audit/AuditLogPage.tsx`
- Create: `src/pages/settings/SettingsPage.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/app/routes.test.tsx`

**Interfaces:**
- Produces: analytics, governance, and configuration routes; verifies every primary navigation route renders.

- [ ] **Step 1: Write failing route coverage tests**

```tsx
it.each([
  ['/analytics', '活动数据分析'],
  ['/audit', '操作审计日志'],
  ['/settings', '活动平台配置'],
])('renders %s', async (path, title) => {
  render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
  expect(await screen.findByText(title)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm run test:run -- src/app/routes.test.tsx`

Expected: FAIL because the routes are missing.

- [ ] **Step 3: Implement analytics and governance pages**

Analytics shows participants, valid trading volume, reward cost, conversion, funnel, type comparison, region distribution, and estimated/final labeling. Audit supports filters for actor, action, object, risk, and time, with before/after diff drawer. Settings provides read-only prototype panels for activity types, metrics, approval thresholds, regions, and permission roles.

- [ ] **Step 4: Verify all tests and build**

Run: `npm run test:run`

Expected: all tests pass with 0 failures.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/analytics src/pages/audit src/pages/settings src/app
git commit -m "feat: complete activity admin prototype"
```

### Task 10: Perform visual and responsive verification

**Files:**
- Modify: `src/styles/global.css`
- Modify: affected page/component files discovered during verification
- Create: `docs/activity-admin-verification.md`

**Interfaces:**
- Consumes: completed application.
- Produces: verified responsive behavior and a concise verification record.

- [ ] **Step 1: Run the full automated verification**

Run: `npm run test:run`

Expected: all tests pass with 0 failures.

Run: `npm run build`

Expected: TypeScript and Vite exit 0.

- [ ] **Step 2: Launch the prototype and inspect representative routes**

Run: `npm run dev -- --host 127.0.0.1`

Inspect `/dashboard`, `/activities`, `/activities/new`, `/activities/ACT-2026-0712`, `/approvals`, `/leaderboards`, `/settlements`, and `/analytics` at approximately 1440px, 1024px, and 390px widths. Confirm no page-level horizontal scroll, clipped dialogs, unreadable tags, or inaccessible primary actions.

- [ ] **Step 3: Record evidence and fix defects**

Write `docs/activity-admin-verification.md` with the exact commands, test counts, build result, inspected routes, viewport widths, and resolved visual defects. Apply focused CSS or component fixes only where verification finds a concrete defect.

- [ ] **Step 4: Re-run verification after fixes**

Run: `npm run test:run && npm run build`

Expected: all tests pass and the build exits 0.

- [ ] **Step 5: Commit**

```bash
git add src docs/activity-admin-verification.md
git commit -m "test: verify activity admin experience"
```
