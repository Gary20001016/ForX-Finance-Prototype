# Page Read/Write Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace coarse operator capabilities with per-page read/write permissions that consistently control navigation, direct route access, system settings tabs, and mutating UI actions, while keeping multilingual review authorization language-specific.

**Architecture:** A central permission catalog defines every resource and route mapping. Operators persist a normalized `pagePermissions` map; the current route is resolved to one resource and exposed through a permission context. Navigation and settings tabs filter by read access, route boundaries block direct access, and mutation controls use the same write-access result.

**Tech Stack:** React 18, TypeScript, React Router, Arco Design React, external-store prototype state persisted in localStorage.

## Global Constraints

- Write access implies read access; enabling write enables read, and disabling read disables write.
- Super administrators always have all page permissions and are the only users who can open personnel permissions.
- Multilingual review access remains language-specific and is not represented as page read/write access.
- No new package dependencies.
- Per the user's instruction, do not execute automated or manual tests for this change.

---

### Task 1: Central Permission Domain and Legacy Migration

**Files:**
- Create: `src/domain/pagePermissions.ts`
- Modify: `src/domain/reviewOperators.ts`
- Modify: `src/store/prototypeStore.ts`

**Interfaces:**
- Produces: `PagePermissionKey`, `PageAccess`, `PagePermissionMap`, `pagePermissionGroups`, `fullPagePermissions()`, `normalizePagePermissions()`, `canReadPage()`, and `canWritePage()`.
- Produces: `ReviewOperator.pagePermissions` as the only page authorization source.
- Updates: `updateOperatorPermissions(operatorId, pagePermissions, reviewLocaleCodes)`.

- [ ] **Step 1: Create the permission catalog and helpers**

Define resource keys for all 12 top-level pages and five configurable settings tabs. Store labels and groups in the catalog. Normalize every access entry with `write: false` whenever `read` is false.

```ts
export type PagePermissionKey =
  | "dashboard"
  | "audiences"
  | "manual.tasks"
  | "manual.templates"
  | "manual.variables"
  | "event.rules"
  | "event.templates"
  | "event.catalog"
  | "event.triggers"
  | "operations.approvals"
  | "operations.deliveries"
  | "operations.analytics"
  | "settings.categories"
  | "settings.links"
  | "settings.languageReview"
  | "settings.testAccounts"
  | "settings.audit";

export interface PageAccess { read: boolean; write: boolean }
export type PagePermissionMap = Record<PagePermissionKey, PageAccess>;
```

- [ ] **Step 2: Replace legacy operator capability types**

Remove the obsolete `OperatorPermission` union and `permissions` array from active authorization. Add `pagePermissions` to every seed operator. Give the current super administrator full access; give ordinary seed operators read access and map legacy business abilities to the relevant write resources.

- [ ] **Step 3: Normalize persisted operators during store migration**

Add `normalizeReviewOperators(savedOperators)` so stale localStorage data receives a complete permission map. Use the saved legacy capability array only during migration, and default missing resources to read-only for enabled ordinary operators.

- [ ] **Step 4: Update the store mutation**

Change `updateOperatorPermissions` to normalize and save a complete `PagePermissionMap` together with language assignments. Keep the existing safeguards for disabled accounts and at least one authorized reviewer per enabled language.

- [ ] **Step 5: Commit the domain layer**

```bash
git add src/domain/pagePermissions.ts src/domain/reviewOperators.ts src/store/prototypeStore.ts
git commit -m "feat: add page permission domain"
```

### Task 2: Route Resolution, Permission Context, and Navigation Filtering

**Files:**
- Create: `src/app/routePermissions.ts`
- Create: `src/components/PagePermissionBoundary.tsx`
- Create: `src/components/PermissionDenied.tsx`
- Create: `src/components/WritePermissionButton.tsx`
- Modify: `src/app/navigation.tsx`
- Modify: `src/layout/AdminLayout.tsx`

**Interfaces:**
- Produces: `permissionForLocation(pathname, search)` returning a page resource or the special `multilingual-review` authorization.
- Produces: `useCurrentPagePermission()` returning `{ canRead, canWrite, permissionKey }`.
- Produces: `WritePermissionButton` with ordinary Arco Button props and automatic no-write disabling/tooltip.

- [ ] **Step 1: Resolve every route to one permission resource**

Handle manual/event template scope separately, map `/tasks/create` to manual tasks, map each settings query Tab independently, and mark `/multilingual-review` as language-controlled.

- [ ] **Step 2: Add route and write-access boundaries**

`PagePermissionBoundary` reads the current operator and current location. Missing/disabled operators and unreadable resources render `PermissionDenied`. `/tasks/create` additionally requires write access. Multilingual review requires at least one enabled policy that includes the operator ID.

- [ ] **Step 3: Attach permission keys to navigation items**

Add `permissionKey?: PagePermissionKey` to `NavigationItem`. Keep multilingual review without a normal page key so the language-specific rule remains explicit.

- [ ] **Step 4: Filter the sidebar**

Filter standalone items, child items, and empty groups using the current operator. Show system configuration if any settings resource is readable. Navigate that entry to the first readable settings Tab. Show multilingual review only when at least one authorized enabled language exists.

- [ ] **Step 5: Wrap page output and expose current write access**

Wrap `<Outlet />` in `PagePermissionBoundary`, then expose the resolved write status through context so page controls and drawers use the same result.

- [ ] **Step 6: Commit access infrastructure**

```bash
git add src/app/routePermissions.ts src/components/PagePermissionBoundary.tsx src/components/PermissionDenied.tsx src/components/WritePermissionButton.tsx src/app/navigation.tsx src/layout/AdminLayout.tsx
git commit -m "feat: enforce route and navigation permissions"
```

### Task 3: Personnel Permission Matrix and Settings Tab Authorization

**Files:**
- Modify: `src/pages/settings/OperatorPermissionPanel.tsx`
- Modify: `src/pages/settings/SettingsPage.tsx`
- Modify: `src/pages/settings/LanguageReviewPolicyPanel.tsx`
- Modify: `src/pages/settings/TestAccountPanel.tsx`

**Interfaces:**
- Consumes: `pagePermissionGroups`, `PagePermissionMap`, and `useCurrentPagePermission()`.
- Produces: a grouped read/write permission matrix with language review selection.

- [ ] **Step 1: Replace capability checkboxes with a permission matrix**

Render rows grouped as “后台页面”和“系统配置”. Each row displays resource label plus read and write checkboxes. Apply the linkage rules in local state before saving.

- [ ] **Step 2: Update the personnel list summary**

Replace capability tags with counts for readable and writable resources. Preserve account state, super-administrator badge, and assigned language display.

- [ ] **Step 3: Filter settings tabs by their resource permissions**

Build the settings Tab list from readable resources. Keep the personnel permission Tab hard-coded to super administrators. When the side navigation opens `/settings` without a Tab query, select the first readable Tab; when an explicit unreadable Tab is requested, let the route boundary show `PermissionDenied`.

- [ ] **Step 4: Gate settings mutations by the active Tab write permission**

Disable category editing, allowlist creation/edit/status updates, language policy edits, and test-account changes when the corresponding resource is read-only. Keep audit-log viewing available with read access.

- [ ] **Step 5: Commit permission configuration UI**

```bash
git add src/pages/settings/OperatorPermissionPanel.tsx src/pages/settings/SettingsPage.tsx src/pages/settings/LanguageReviewPolicyPanel.tsx src/pages/settings/TestAccountPanel.tsx
git commit -m "feat: add page permission matrix"
```

### Task 4: Gate Mutating Actions Across Business Pages

**Files:**
- Modify: `src/pages/segments/SegmentListPage.tsx`
- Modify: `src/pages/tasks/TaskListPage.tsx`
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/pages/variables/TemplateVariablePage.tsx`
- Modify: `src/pages/automation/AutomationRuleListPage.tsx`
- Modify: `src/pages/events/EventListPage.tsx`
- Modify: `src/pages/approvals/ApprovalCenterPage.tsx`
- Modify: `src/pages/approvals/ApprovalDrawer.tsx`
- Modify: `src/pages/deliveries/DeliveryPage.tsx`

**Interfaces:**
- Consumes: `useCurrentPagePermission()` and `WritePermissionButton`.
- Preserves: detail, search, filter, preview, and export actions for read-only users.

- [ ] **Step 1: Gate user and manual-message mutations**

Disable audience creation/import/edit controls, task creation/edit/copy/pause/resume/cancel controls, manual template create/edit controls, and template-variable create/import/edit/status controls when the page is read-only.

- [ ] **Step 2: Gate event-automation mutations**

Disable rule create/edit/enable/disable/version actions and event configuration mutations while preserving event and trigger-record detail viewing.

- [ ] **Step 3: Gate approval and delivery mutations**

Keep approval drawers viewable but disable approve/reject/revise actions without write access. Disable delivery retry or state-changing controls while preserving delivery detail and export actions.

- [ ] **Step 4: Keep read-only affordances explicit**

Every disabled mutation button uses the shared tooltip text “当前账号无写权限”; existing business-condition disabling remains effective in addition to the permission check.

- [ ] **Step 5: Commit page action enforcement**

```bash
git add src/pages/segments/SegmentListPage.tsx src/pages/tasks/TaskListPage.tsx src/pages/templates/TemplateListPage.tsx src/pages/variables/TemplateVariablePage.tsx src/pages/automation/AutomationRuleListPage.tsx src/pages/events/EventListPage.tsx src/pages/approvals/ApprovalCenterPage.tsx src/pages/approvals/ApprovalDrawer.tsx src/pages/deliveries/DeliveryPage.tsx
git commit -m "feat: enforce page write permissions"
```

### Task 5: Consistency Review and Documentation Update

**Files:**
- Modify: `docs/superpowers/specs/2026-07-21-page-read-write-permissions-design.md` only if implementation details require exact wording alignment.

**Interfaces:**
- Consumes: all permission modules and page integrations from Tasks 1–4.
- Produces: a clean, internally consistent implementation and handoff summary.

- [ ] **Step 1: Review permission coverage without running tests**

Use static searches to confirm every navigation resource exists in the catalog, every settings Tab maps to a settings resource, and obsolete capability labels are absent from active UI code.

```bash
rg -n "content\.create|content\.submit|variable\.manage|business\.review|risk\.review|operatorPermissionLabels" src
rg -n "permissionKey|settings\." src/app src/layout src/pages/settings
```

- [ ] **Step 2: Review the diff for accidental unrelated edits**

```bash
git diff --check
git status --short
git diff --stat HEAD~4..HEAD
```

- [ ] **Step 3: Commit any consistency correction**

Only create an additional commit if the static review finds a concrete inconsistency.
