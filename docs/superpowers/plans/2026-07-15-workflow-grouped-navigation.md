# Workflow-Grouped Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group navigation by manual messaging, event automation, and shared governance while exposing one template library through manual- and event-filtered views.

**Architecture:** Replace the flat navigation array with typed groups and a query-aware route resolver. Keep `/templates` as the single template route, add `usageScope` to the shared template entity, and use one scope helper in the template list, artificial task creator, and event-rule editor.

**Tech Stack:** React 18, TypeScript, React Router 6, Arco Design React, Vitest, Testing Library, Vite.

## Global Constraints

- Existing direct paths remain valid; `/templates` defaults to the manual view.
- Template scopes are exactly `manual`, `event`, and `shared`.
- Manual and event template entries use the same page, data, versions, multilingual flow, preview, and approval logic.
- Multilingual review, approvals, deliveries, and analytics remain shared pages.
- Preserve all existing uncommitted multilingual work.

---

### Task 1: Grouped navigation model

**Files:**
- Modify: `src/app/navigation.tsx`
- Modify: `src/app/navigation.test.tsx`

**Interfaces:**
- Produces: `NavigationGroup`, `navigationGroups`, flattened `navigationItems`, and `navigationContextForLocation(pathname, search)`.

- [ ] **Step 1: Write the failing test**

```tsx
expect(navigationGroups.map((group) => group.label)).toEqual([
  "人工消息", "事件自动化", "运营与治理",
]);
expect(navigationContextForLocation("/templates", "?scope=event")).toMatchObject({
  key: "/templates?scope=event",
  groupLabel: "事件自动化",
  label: "事件消息模板",
});
expect(navigationContextForLocation("/templates", "")).toMatchObject({
  key: "/templates?scope=manual",
  label: "人工消息模板",
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/app/navigation.test.tsx`

Expected: FAIL because grouped exports do not exist.

- [ ] **Step 3: Implement the typed groups and resolver**

Each item has `key`, `path`, `label`, `icon`, `groupKey`, and `groupLabel`. Template keys include the scope query. The resolver normalizes every non-event template query to manual and otherwise uses the longest matching path.

```tsx
const scope = new URLSearchParams(search).get("scope") === "event" ? "event" : "manual";
const effectiveKey = pathname === "/templates" ? `/templates?scope=${scope}` : pathname;
```

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/app/navigation.test.tsx`

```bash
git add src/app/navigation.tsx src/app/navigation.test.tsx
git commit -m "feat: group navigation by message workflow"
```

### Task 2: Nested sidebar and breadcrumbs

**Files:**
- Modify: `src/layout/AdminLayout.tsx`
- Modify: `src/layout/AdminLayout.test.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: Task 1 navigation groups and resolver.
- Produces: group-aware selection, query-aware clicks, and three-level breadcrumbs.

- [ ] **Step 1: Write the failing layout test**

Render `/templates?scope=event`; assert `nav-/templates?scope=event`, the “事件自动化” group, and the “事件消息模板” breadcrumb are visible. Render `/tasks`; assert the manual group and task item are visible.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/layout/AdminLayout.test.tsx`

Expected: FAIL because the layout is flat and query-unaware.

- [ ] **Step 3: Render grouped Arco menus**

Use `Menu.SubMenu` for the three groups, standalone `Menu.Item` for workbench and settings, the resolved full key for `selectedKeys`, and controlled `openKeys` synchronized from the resolved group so refreshes and route changes open the correct group. Navigate using item keys including query strings. Add the group breadcrumb only when a group exists.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/layout/AdminLayout.test.tsx src/app/navigation.test.tsx`

```bash
git add src/layout/AdminLayout.tsx src/layout/AdminLayout.test.tsx src/styles/global.css
git commit -m "feat: render workflow navigation groups"
```

### Task 3: Template scope domain and migration

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/pages/templates/templateScope.ts`
- Create: `src/pages/templates/templateScope.test.ts`
- Modify: `src/mocks/data.ts`
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Produces: `TemplateUsageScope`, `templateSupportsScope(template, scope)`, and `inferTemplateUsageScope(template, tasks, rules)`.

- [ ] **Step 1: Write failing scope tests**

```ts
expect(templateSupportsScope({ usageScope: "manual" }, "manual")).toBe(true);
expect(templateSupportsScope({ usageScope: "manual" }, "event")).toBe(false);
expect(templateSupportsScope({ usageScope: "shared" }, "event")).toBe(true);
```

Add migration assertions: manual-only references infer `manual`, event-only references infer `event`, both or neither infer `shared`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/pages/templates/templateScope.test.ts src/store/prototypeStore.test.ts`

Expected: FAIL because scope types and helpers do not exist.

- [ ] **Step 3: Implement scope and legacy inference**

```ts
export type TemplateUsageScope = "manual" | "event" | "shared";
export const templateSupportsScope = (template, scope) =>
  template.usageScope === scope || template.usageScope === "shared";
```

Seed representative scopes. In `migrateSavedState`, after merging tasks and rules, infer every missing scope from `task.templateId` and `rule.currentVersionId`/rule versions; fall back to shared.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/pages/templates/templateScope.test.ts src/store/prototypeStore.test.ts`

```bash
git add src/domain/types.ts src/pages/templates/templateScope.ts src/pages/templates/templateScope.test.ts src/mocks/data.ts src/store/prototypeStore.ts src/store/prototypeStore.test.ts
git commit -m "feat: model template usage scopes"
```

### Task 4: Shared template page with filtered entry views

**Files:**
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Create: `src/pages/templates/TemplateListPage.scope.test.tsx`
- Modify: `src/pages/templates/TemplateListPage.translation.test.tsx`
- Modify: `src/pages/templates/TemplateListPage.completion.test.tsx`

**Interfaces:**
- Consumes: Task 3 scope helper and router search params.
- Produces: scoped title, description, rows, empty state, and creation defaults.

- [ ] **Step 1: Write the failing view tests**

At `?scope=event`, expect heading “事件消息模板”, event/shared rows, and no manual-only rows. At `?scope=manual`, expect heading “人工消息模板”, manual/shared rows, and an editor whose “适用场景” defaults to “人工消息”.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/pages/templates/TemplateListPage.scope.test.tsx`

Expected: FAIL because the page currently shows every template under one generic heading.

- [ ] **Step 3: Implement the shared views**

```tsx
const [searchParams] = useSearchParams();
const entryScope = searchParams.get("scope") === "event" ? "event" : "manual";
const title = entryScope === "event" ? "事件消息模板" : "人工消息模板";
const data = store.templates.filter((item) =>
  item.owner !== "临时任务" && templateSupportsScope(item, entryScope),
);
```

Pass `entryScope` to the editor. New-template scope options are the entry scope and `shared`; existing templates retain their current scope. Save `usageScope` in both create and update payloads.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/pages/templates/TemplateListPage.scope.test.tsx src/pages/templates/TemplateListPage.translation.test.tsx src/pages/templates/TemplateListPage.completion.test.tsx`

```bash
git add src/pages/templates/TemplateListPage.tsx src/pages/templates/TemplateEditorDrawer.tsx src/pages/templates/TemplateListPage*.test.tsx
git commit -m "feat: add manual and event template views"
```

### Task 5: Scope template consumers

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.translation.test.tsx`
- Modify: `src/pages/automation/AutomationRuleListPage.tsx`
- Modify: `src/pages/automation/AutomationRuleListPage.test.tsx`

**Interfaces:**
- Consumes: `templateSupportsScope`.
- Produces: manual/shared candidates for artificial tasks and event/shared candidates for event rules.

- [ ] **Step 1: Write failing consumer tests**

Seed manual-, event-, and shared-scope templates. Assert artificial tasks exclude event-only templates and event rules exclude manual-only templates.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/pages/tasks/CreateTaskPage.translation.test.tsx src/pages/automation/AutomationRuleListPage.test.tsx`

Expected: FAIL because consumers use the unscoped collection.

- [ ] **Step 3: Filter both consumers**

```ts
const manualTemplates = store.templates.filter((template) =>
  templateSupportsScope(template, "manual"),
);
const eventTemplates = store.templates.filter((template) =>
  templateSupportsScope(template, "event"),
);
```

Retain the existing translation-readiness gate for the artificial task creator.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/pages/tasks/CreateTaskPage.translation.test.tsx src/pages/automation/AutomationRuleListPage.test.tsx`

```bash
git add src/pages/tasks/CreateTaskPage.tsx src/pages/tasks/CreateTaskPage.translation.test.tsx src/pages/automation/AutomationRuleListPage.tsx src/pages/automation/AutomationRuleListPage.test.tsx
git commit -m "feat: enforce template workflow scope"
```

### Task 6: PRD alignment and full verification

**Files:**
- Modify: `docs/prd/message-center/00-消息中心总览.md`
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/prd/message-center/03-消息模板与多语言.md`
- Modify: `docs/prd/message-center/04-系统事件.md`

- [ ] **Step 1: Update the modular PRD**

Document the navigation tree, shared template library, usage scopes, route queries, legacy inference, consumer restrictions, and shared governance pages.

- [ ] **Step 2: Scan for contradictions**

Run: `rg -n "导航|消息模板|人工消息模板|事件消息模板" docs/prd/message-center`

Expected: every navigation statement agrees with the workflow-grouped structure.

- [ ] **Step 3: Run complete verification**

Run: `npm test -- --run && npm run build && git diff --check`

Expected: all tests pass with zero unhandled errors, production build succeeds, and diff check prints no output.

- [ ] **Step 4: Commit final docs and regression fixes**

```bash
git add docs/prd/message-center src
git commit -m "feat: complete workflow-grouped message navigation"
```
