# Cross-Platform Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make station inbox messages available on both Web and App while keeping App Push as a separate delivery channel.

**Architecture:** Keep `Channel` as `站内信 | Push`; one inbox message instance and read state serves Web and App. Add three content previews (Web inbox, App inbox, App Push), separate channel and client dimensions in analytics, and align the modular PRD with this model.

**Tech Stack:** React 18, TypeScript 5.9, Arco Design React 2.66, Vitest, React Testing Library, Markdown.

## Global Constraints

- `站内信` is one channel shared by Web and App; do not create separate Web/App inbox channel enums.
- Web and App share one `message_id`, unread count, `read_at`, `clicked_at`, and risk acknowledgement state.
- App Push is a separate device notification channel and does not replace App inbox messages.
- Operators maintain one inbox content version; Web and App previews render the same content with different layouts.
- Keep the repository frontend-only and use the existing shared prototype store.
- Preserve existing task, event, translation, approval, delivery, and App Push behavior.

---

### Task 1: Add Web inbox, App inbox, and App Push previews

**Files:**
- Create: `src/components/MessagePreview.test.tsx`
- Modify: `src/components/MessagePreview.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/pages/approvals/ApprovalCenter.completion.test.tsx`

**Interfaces:**
- Consumes: `LocalizedMessageContent.web` as the temporary code key for shared inbox content and `LocalizedMessageContent.push` for App Push.
- Produces: three accessible preview regions named `Web 站内信预览`, `App 站内信预览`, and `App Push 预览`.

- [ ] **Step 1: Write failing preview tests**

Render `MessagePreview` with one inbox title and assert all three regions exist, both inbox regions contain the shared title, and the Push region contains the Push title. Update the approval test to expect all three preview labels.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm run test:run -- src/components/MessagePreview.test.tsx src/pages/approvals/ApprovalCenter.completion.test.tsx --maxWorkers=1 --testTimeout=15000
```

Expected: fail because `App 站内信预览` does not exist.

- [ ] **Step 3: Implement the third preview**

Add an App inbox phone card that reuses `content.web.title`, `summary`, `body`, risk copy, button, and link. Change the grid to three columns on desktop and one column on narrow screens.

- [ ] **Step 4: Run tests and verify GREEN**

Run the Task 1 command. Expected: all tests pass.

---

### Task 2: Align task, template, approval, layout, and dashboard language

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.v2.test.tsx`
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Modify: `src/layout/AdminLayout.tsx`
- Modify: `src/pages/dashboard/DashboardPage.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: the three-region preview from Task 1.
- Produces: product language that describes `站内信（Web + App）` and `App Push` as separate channels.

- [ ] **Step 1: Update the task-page test first**

Replace the assertion for `Web 站内信` with `站内信（Web + App）`, and assert the task page exposes the App inbox preview.

- [ ] **Step 2: Run the task test and verify RED**

Run:

```bash
npm run test:run -- src/pages/tasks/CreateTaskPage.v2.test.tsx --maxWorkers=1 --testTimeout=15000
```

Expected: fail until task-page labels are updated.

- [ ] **Step 3: Update UI language**

Use `站内信（Web + App）` in capability strips, task validation, template headings, system status, dashboard descriptions, delivery descriptions, and README route descriptions. Use shorter `站内信` for checkbox and table values.

- [ ] **Step 4: Run affected tests**

Run:

```bash
npm run test:run -- src/pages/tasks src/pages/templates src/layout src/pages/dashboard src/pages/approvals --maxWorkers=1 --testTimeout=15000 --reporter=dot
```

Expected: all affected tests pass.

---

### Task 3: Demonstrate shared Web/App inbox state

**Files:**
- Modify: `src/pages/inbox/InboxPage.tsx`
- Modify: `src/pages/inbox/InboxPage.test.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: the existing shared `messages` store and read actions.
- Produces: a Web/App view switch that keeps the same messages and unread count.

- [ ] **Step 1: Write the failing shared-state test**

Assert that the page offers `Web 端` and `App 端`, shows `Web / App 共享已读状态`, marks all messages read in Web view, switches to App view, and still shows `0 条未读`.

- [ ] **Step 2: Run the inbox test and verify RED**

Run:

```bash
npm run test:run -- src/pages/inbox/InboxPage.test.tsx --maxWorkers=1 --testTimeout=15000
```

Expected: fail because the client switch and shared-state explanation do not exist.

- [ ] **Step 3: Implement the client view switch**

Add local `client` state for presentation only, a two-button Web/App selector, shared-state copy, and an App presentation class. Do not duplicate `messages` or read state.

- [ ] **Step 4: Run the inbox test and verify GREEN**

Run the Task 3 command. Expected: all inbox tests pass.

---

### Task 4: Separate channel and client dimensions in delivery and analytics

**Files:**
- Modify: `src/pages/deliveries/DeliveryPage.tsx`
- Modify: `src/pages/analytics/AnalyticsPage.tsx`
- Modify: `src/pages/analytics/AnalyticsPage.test.tsx`

**Interfaces:**
- Consumes: `DeliveryRecord.channel` and `DeliveryRecord.devicePlatform`.
- Produces: channel comparison `站内信 / App Push` and client filter `全部客户端 / Web / App` without treating App as Push.

- [ ] **Step 1: Write failing analytics assertions**

Assert the page shows a `站内信（Web + App）` metric card, an `App Push` card, and separate `全部渠道`, `站内信`, `App Push`, `全部客户端`, `Web`, `App` filters.

- [ ] **Step 2: Run the analytics test and verify RED**

Run:

```bash
npm run test:run -- src/pages/analytics/AnalyticsPage.test.tsx --maxWorkers=1 --testTimeout=15000
```

Expected: fail because App currently filters Push records and the explicit channel/client controls do not exist.

- [ ] **Step 3: Implement separate filters and labels**

Add `channel` and `client` states. Channel filters `站内信` and `Push`; client filters only `devicePlatform` for station inbox records. Rename the delivery tab to `站内信` and describe Web/App read-source tracking in the detail drawer.

- [ ] **Step 4: Run analytics and delivery tests**

Run:

```bash
npm run test:run -- src/pages/analytics src/pages/deliveries --maxWorkers=1 --testTimeout=15000 --reporter=dot
```

Expected: all tests pass.

---

### Task 5: Update the modular PRD

**Files:**
- Modify: `PRD-exchange-message-center-admin.md`
- Modify: `docs/prd/message-center/README.md`
- Modify: `docs/prd/message-center/00-消息中心总览.md`
- Modify: `docs/prd/message-center/01-用户消息中心.md`
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/prd/message-center/03-消息模板与多语言.md`
- Modify: `docs/prd/message-center/07-渠道与发送记录.md`
- Modify: `docs/prd/message-center/08-数据分析.md`
- Modify: `docs/prd/message-center/09-系统配置与审计.md`

**Interfaces:**
- Consumes: the confirmed design spec.
- Produces: one consistent product definition across all authoritative PRDs.

- [ ] **Step 1: Replace Web-only inbox wording**

Define product scope as Web/App user message centers plus App Push. State that Web/App share message IDs and read state, while App Push has separate device delivery records.

- [ ] **Step 2: Update preview and analytics requirements**

Require three previews and separate channel/client analysis dimensions.

- [ ] **Step 3: Validate PRD terminology and links**

Run:

```bash
if rg -n 'Web 站内信(?!预览)' PRD-exchange-message-center-admin.md docs/prd/message-center --pcre2; then exit 1; fi
rg -n 'Web/App|App 站内信预览|共享.*已读|客户端维度|App Push' PRD-exchange-message-center-admin.md docs/prd/message-center
git diff --check -- PRD-exchange-message-center-admin.md docs/prd/message-center
```

Expected: no Web-exclusive channel wording, required cross-platform terms present, and diff check exits 0.

---

### Task 6: Full regression and browser verification

**Files:**
- Verify all modified files.

**Interfaces:**
- Consumes: Tasks 1-5.
- Produces: evidence that cross-platform inbox semantics and existing workflows remain valid.

- [ ] **Step 1: Run full tests**

```bash
npm run test:run -- --maxWorkers=1 --testTimeout=15000 --reporter=dot
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: TypeScript and Vite build exit 0.

- [ ] **Step 3: Verify in the browser**

Open `/tasks/create`, confirm the three previews and `站内信（Web + App）`; open `/inbox`, switch Web/App and confirm the unread state remains shared; open `/analytics`, confirm channel and client controls are separate; inspect console errors.

- [ ] **Step 4: Check diff hygiene**

```bash
git diff --check
```

Expected: exit 0 with no output.
