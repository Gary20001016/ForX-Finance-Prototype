# Exchange Message Center Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, runnable Arco Design React admin prototype for the exchange message center PRD, with realistic routes, data, filters, forms, approval interactions, and responsive behavior.

**Architecture:** Use a Vite React TypeScript single-page application. Keep global shell, route metadata, mock domain data, and feature pages separate; share reusable `PageHeader`, `MetricCard`, `StatusTag`, and `ResourceTable` components. All mutations remain local mock state and clearly identify that no real message is sent.

**Tech Stack:** React 19, TypeScript, Vite, React Router, `@arco-design/web-react` 2.66.15, Vitest, Testing Library, CSS custom properties.

## Global Constraints

- The existing PRD at `PRD-exchange-message-center-admin.md` is the source of truth.
- UI copy is Simplified Chinese; timestamps visibly include timezone where relevant.
- Use Arco Design components and icons rather than recreating controls.
- The first version is a frontend prototype with mock data; it must not call real messaging providers.
- All high-risk actions show confirmation and audit-oriented copy.
- Desktop is primary, but navigation and data layouts remain usable at 1024px and narrow mobile widths.
- Use a restrained exchange-operations visual language: slate navigation, white work surfaces, blue primary actions, amber/red only for risk and failure.

---

## File Map

- `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`: app and test toolchain.
- `src/main.tsx`, `src/App.tsx`: startup, Arco locale, router composition.
- `src/styles/global.css`: design tokens, shell, responsive and page-level layout.
- `src/app/routes.tsx`: route definitions and lazy-loaded pages.
- `src/app/navigation.ts`: sidebar hierarchy and route labels.
- `src/layout/AdminLayout.tsx`: sidebar, header, breadcrumb, notification and user controls.
- `src/components/*`: reusable page header, metric, status, filter and table components.
- `src/domain/types.ts`: shared admin domain types.
- `src/mocks/data.ts`: deterministic fixture data for all routes.
- `src/pages/*`: feature pages organized by responsibility.
- `src/test/*`: test environment and behavior-focused tests.

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
- Produces: `App(): JSX.Element`; npm scripts `dev`, `build`, `test`, and `test:run`.

- [ ] **Step 1: Create the package manifest and failing smoke test**

```json
{
  "name": "exchange-message-center-admin",
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

it('renders the message center product name', () => {
  render(<App />);
  expect(screen.getByText('消息中心')).toBeInTheDocument();
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
  return <main>消息中心</main>;
}
```

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@arco-design/web-react/dist/css/arco.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
```

Configure Vitest in `vite.config.ts` with `environment: 'jsdom'` and `setupFiles: './src/test/setup.ts'`; import `@testing-library/jest-dom/vitest` in setup.

- [ ] **Step 4: Verify the app test and production build**

Run: `npm run test:run -- src/App.test.tsx`

Expected: 1 passing test.

Run: `npm run build`

Expected: TypeScript and Vite exit 0 and create `dist/`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json index.html tsconfig*.json vite.config.ts src
git commit -m "chore: bootstrap Arco message center admin"
```

### Task 2: Build the responsive admin shell and routing

**Files:**
- Create: `src/app/navigation.ts`
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
it('shows primary navigation and current breadcrumb', async () => {
  render(<MemoryRouter initialEntries={['/tasks']}><AdminLayout /></MemoryRouter>);
  expect(screen.getByText('消息任务')).toBeInTheDocument();
  expect(screen.getByText('审核中心')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:run -- src/layout/AdminLayout.test.tsx`

Expected: FAIL because the layout does not exist.

- [ ] **Step 3: Implement navigation, router, and shell**

Navigation groups must contain routes for `/dashboard`, `/tasks`, `/templates`, `/segments`, `/automations`, `/events`, `/approvals`, `/deliveries`, `/analytics`, `/channels`, `/compliance`, and `/settings`. Use Arco `Layout`, `Menu`, `Breadcrumb`, `Badge`, `Avatar`, `Dropdown`, `Button`, and icons. Persist the collapsed sidebar flag in component state and derive the active menu from `location.pathname`.

The header must show environment label `PROD · 只读原型`, global search, pending approvals badge, timezone `UTC+8`, and administrator avatar. The sidebar brand is `ForX Finance / 消息中心`.

- [ ] **Step 4: Add design tokens and responsive rules**

Define `--mc-nav`, `--mc-primary`, `--mc-bg`, `--mc-border`, `--mc-text`, and risk color tokens. At widths below 1100px collapse the sidebar; below 720px allow horizontal overflow only inside tables and stack page header actions.

- [ ] **Step 5: Verify shell tests and build**

Run: `npm run test:run -- src/layout/AdminLayout.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add message center admin shell"
```

### Task 3: Add shared domain types, fixtures, and reusable components

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/mocks/data.ts`
- Create: `src/components/PageHeader.tsx`
- Create: `src/components/MetricCard.tsx`
- Create: `src/components/StatusTag.tsx`
- Create: `src/components/FilterBar.tsx`
- Create: `src/components/ResourceTable.tsx`
- Test: `src/components/StatusTag.test.tsx`

**Interfaces:**
- Produces: `MessageTask`, `MessageTemplate`, `AudienceSegment`, `ApprovalItem`, `DeliveryRecord`, `ChannelProvider`, `CompliancePolicy` types; fixture arrays; `StatusTag({ status })`.

- [ ] **Step 1: Write status mapping tests**

```tsx
it.each([
  ['发送中', 'arcoblue'],
  ['已完成', 'green'],
  ['待审核', 'orange'],
  ['失败', 'red'],
])('renders %s with semantic styling', (status) => {
  render(<StatusTag status={status} />);
  expect(screen.getByText(status)).toBeVisible();
});
```

- [ ] **Step 2: Confirm the component test fails**

Run: `npm run test:run -- src/components/StatusTag.test.tsx`

Expected: FAIL because shared components do not exist.

- [ ] **Step 3: Implement types and deterministic fixtures**

Create at least 8 tasks, 6 templates, 5 segments, 5 approvals, 10 delivery records, 4 providers, and 5 compliance policies. Fixtures must cover success, partial failure, paused, pending approval, critical risk, marketing opt-out, and multi-language scenarios.

- [ ] **Step 4: Implement shared components**

`PageHeader` accepts eyebrow, title, description, tags and action nodes. `MetricCard` accepts title, value, change, trend direction, icon and tone. `StatusTag` maps semantic states to Arco colors. `FilterBar` renders children plus reset/search actions. `ResourceTable<T>` wraps Arco `Table` with row key, pagination and empty state.

- [ ] **Step 5: Verify shared tests and typecheck**

Run: `npm run test:run -- src/components/StatusTag.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add message center domain fixtures and UI primitives"
```

### Task 4: Implement dashboard and operational resource pages

**Files:**
- Create: `src/pages/dashboard/DashboardPage.tsx`
- Create: `src/pages/tasks/TaskListPage.tsx`
- Create: `src/pages/templates/TemplateListPage.tsx`
- Create: `src/pages/segments/SegmentListPage.tsx`
- Create: `src/pages/events/EventListPage.tsx`
- Create: `src/pages/automations/AutomationListPage.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/pages/tasks/TaskListPage.test.tsx`

**Interfaces:**
- Consumes: shared fixtures and UI primitives.
- Produces: routable list pages and dashboard.

- [ ] **Step 1: Write failing task filtering test**

```tsx
it('filters task rows by keyword and status', async () => {
  render(<TaskListPage />);
  await userEvent.type(screen.getByPlaceholderText('搜索任务 ID、名称或创建人'), '提现');
  expect(screen.getByText('提现安全通知')).toBeVisible();
  expect(screen.queryByText('夏季交易赛召回')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the task page test and confirm failure**

Run: `npm run test:run -- src/pages/tasks/TaskListPage.test.tsx`

Expected: FAIL because `TaskListPage` does not exist.

- [ ] **Step 3: Implement dashboard**

Include date/channel/region filters; 8 metric cards; 7-day send-volume visualization made with CSS bars; channel health cards; approval queue; active campaign table; failure-reason ranking; and risk alert panel. Use Arco `Grid`, `Card`, `Statistic`, `Progress`, `Table`, `Alert`, and `Timeline`.

- [ ] **Step 4: Implement task and template pages**

Task table columns follow PRD 8.2.2 and expose view, copy, pause, cancel actions through a dropdown. Template page includes channel icons, language coverage, version, state, event code and a right-side preview drawer with tabs for inbox, Push, email and SMS.

- [ ] **Step 5: Implement segment, event, and automation list pages**

Each page provides PRD-aligned filters, summary cards, realistic columns, empty/loading states, and a detail drawer. Automation cards show entry trigger, active users, conversion, version and status.

- [ ] **Step 6: Verify route pages and build**

Run: `npm run test:run -- src/pages/tasks/TaskListPage.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: add message operations dashboards and lists"
```

### Task 5: Implement the message task wizard and approval flow

**Files:**
- Create: `src/pages/tasks/CreateTaskPage.tsx`
- Create: `src/pages/tasks/TaskSummary.tsx`
- Create: `src/pages/approvals/ApprovalCenterPage.tsx`
- Create: `src/pages/approvals/ApprovalDrawer.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/pages/tasks/CreateTaskPage.test.tsx`
- Test: `src/pages/approvals/ApprovalCenterPage.test.tsx`

**Interfaces:**
- Produces: `/tasks/create` four-step wizard; local approval decisions with confirmation.

- [ ] **Step 1: Write failing wizard validation test**

```tsx
it('blocks progression until required basic fields are complete', async () => {
  render(<CreateTaskPage />);
  await userEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(await screen.findByText('请输入任务名称')).toBeVisible();
});
```

- [ ] **Step 2: Write failing separation-of-duties approval test**

```tsx
it('disables approval for an item created by the current administrator', () => {
  render(<ApprovalCenterPage currentAdminId="admin-01" />);
  expect(screen.getByText('不可审核本人创建的任务')).toBeVisible();
});
```

- [ ] **Step 3: Confirm both tests fail**

Run: `npm run test:run -- src/pages/tasks/CreateTaskPage.test.tsx src/pages/approvals/ApprovalCenterPage.test.tsx`

Expected: FAIL because pages do not exist.

- [ ] **Step 4: Implement the four-step task wizard**

Steps are `基础信息与模板`, `目标用户`, `发送策略`, `检查并提交`. Use PRD fields: business line, category, nature, risk, template, locales, channels, variables, audience method, inclusion/exclusion segments, schedule, timezone, quiet hours, frequency cap, priority, channel relationship, fallback, batch size, circuit breaker, expiry and cost center.

The summary displays content previews, an audience funnel, estimated cost, risk warnings and approval chain. `保存草稿`, `测试发送`, and `提交审核` show Arco messages but never call external services.

- [ ] **Step 5: Implement approval center and review drawer**

Provide `待我审核`, `全部工单`, and `紧急审批` tabs. Drawer sections show content diff, audience snapshot, compliance decision, channel cost, test results and audit timeline. Approve requires risk acknowledgement for high/critical items; reject requires category and comment; self-created items disable decisions.

- [ ] **Step 6: Verify wizard, approval and build**

Run: `npm run test:run -- src/pages/tasks/CreateTaskPage.test.tsx src/pages/approvals/ApprovalCenterPage.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: add task creation and risk approval flows"
```

### Task 6: Implement deliveries, analytics, channels, compliance and settings

**Files:**
- Create: `src/pages/deliveries/DeliveryPage.tsx`
- Create: `src/pages/analytics/AnalyticsPage.tsx`
- Create: `src/pages/channels/ChannelManagementPage.tsx`
- Create: `src/pages/compliance/CompliancePage.tsx`
- Create: `src/pages/settings/SettingsPage.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/pages/deliveries/DeliveryPage.test.tsx`
- Test: `src/pages/compliance/CompliancePage.test.tsx`

**Interfaces:**
- Produces: all remaining PRD routes with local interactions.

- [ ] **Step 1: Write failing delivery status and compliance tests**

```tsx
it('shows masked destinations and failure reason details', () => {
  render(<DeliveryPage />);
  expect(screen.getByText(/\*\*\*/)).toBeVisible();
  expect(screen.getByText('查看失败原因')).toBeVisible();
});

it('shows the policy conflict priority', () => {
  render(<CompliancePage />);
  expect(screen.getByText(/法律禁止.*用户退订.*黑名单/)).toBeVisible();
});
```

- [ ] **Step 2: Confirm the focused tests fail**

Run: `npm run test:run -- src/pages/deliveries/DeliveryPage.test.tsx src/pages/compliance/CompliancePage.test.tsx`

Expected: FAIL because pages do not exist.

- [ ] **Step 3: Implement delivery and analytics pages**

Delivery page includes user-message and channel-detail tabs, masked destinations, unified statuses, failure drawer, retry confirmation and export approval modal. Analytics includes KPI definitions, delivery funnel, channel comparison, regional results, failure ranking and cost cards.

- [ ] **Step 4: Implement channel management**

Show provider cards for inbox, APNs/FCM, email and SMS; include health, QPS, success, latency, balance, routing priority and region. Configuration drawer masks credentials and includes test-connection confirmation.

- [ ] **Step 5: Implement compliance and settings**

Compliance tabs cover region policy, quiet hours, frequency caps, consent/opt-out and suppression list. Settings tabs cover categories, deep-link allowlist, sensitive words, roles and audit logs. Destructive and production-like actions require confirmation.

- [ ] **Step 6: Verify focused tests and build**

Run: `npm run test:run -- src/pages/deliveries/DeliveryPage.test.tsx src/pages/compliance/CompliancePage.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: add delivery channel compliance and analytics views"
```

### Task 7: Final interaction, accessibility, and visual verification

**Files:**
- Modify: `src/styles/global.css`
- Modify: feature files only where verification finds an issue
- Create: `README.md`
- Test: all `src/**/*.test.tsx`

**Interfaces:**
- Produces: verified local prototype and usage documentation.

- [ ] **Step 1: Run the complete test suite**

Run: `npm run test:run`

Expected: all tests pass with zero unhandled errors.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite exit 0.

- [ ] **Step 3: Start the app and inspect primary routes**

Run: `npm run dev -- --host 127.0.0.1`

Inspect `/dashboard`, `/tasks`, `/tasks/create`, `/templates`, `/approvals`, `/deliveries`, `/channels`, and `/compliance` at desktop and narrow widths. Verify no clipped actions, unreadable tags, console errors or dead controls.

- [ ] **Step 4: Add README and fix verified issues**

README must state prerequisites, `npm install`, `npm run dev`, `npm run test:run`, `npm run build`, prototype limitations, route list, and that all data/actions are mocked.

- [ ] **Step 5: Re-run full verification after any fix**

Run: `npm run test:run`

Expected: all tests pass.

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add README.md src
git commit -m "docs: finish and verify message center prototype"
```
