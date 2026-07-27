# Hide Manual Template Version Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove operator-facing version labels from artificial message templates and tasks while retaining internal version snapshots and all event-version behavior.

**Architecture:** Keep `MessageTemplate.version` and `MessageTask.templateVersion` unchanged in the domain and store. Change only presentation and legacy display resolution, using template IDs as the primary relationship and stripping legacy trailing version tokens only when an ID lookup is unavailable.

**Tech Stack:** React, TypeScript, Arco Design React, Vitest, Testing Library.

## Global Constraints

- Artificial message operators never see a template version.
- Template names and template IDs remain visible identifiers.
- Internal template versions and translation-batch snapshots remain unchanged.
- Event definition and event content versions remain visible and unchanged.
- Existing tasks without a template ID remain readable.

---

### Task 1: Remove version presentation from artificial template pages

**Files:**
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/pages/templates/TemplateReadOnlyDetails.tsx`
- Modify: `src/pages/templates/TemplateListPage.completion.test.tsx`

**Interfaces:**
- Consumes: existing `MessageTemplate` and `MessageTask` records.
- Produces: operator-facing template list and drawers without version text.

- [ ] **Step 1: Write a failing template-page test**

```tsx
expect(screen.queryByRole("columnheader", { name: "版本" })).not.toBeInTheDocument();
expect(screen.getByText("异常登录提醒")).toBeVisible();
expect(screen.queryByText(/异常登录提醒 · v\d+/)).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run src/pages/templates/TemplateListPage.completion.test.tsx`

Expected: FAIL because the list still includes a version column or drawer title.

- [ ] **Step 3: Remove version UI while preserving ID-based usage matching**

Remove the `version` column and readonly description row. Change multilingual and usage drawer titles to `${template.name} · 多语言生产` and `${template.name} · 使用任务`. Update empty copy to “当前模板尚未被任务使用”. Keep the existing `task.templateId === template.id` relationship and legacy code/version fallback.

- [ ] **Step 4: Update page descriptions**

Change artificial template copy from “共享版本、多语言、预览和审核能力” to “共享多语言、预览和审核能力”. Leave the event entry wording unchanged only where it refers to event content versions.

- [ ] **Step 5: Run the template test and verify GREEN**

Run: `npm test -- --run src/pages/templates/TemplateListPage.completion.test.tsx`

Expected: PASS.

### Task 2: Remove version presentation from artificial task pages

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/TaskListPage.tsx`
- Modify: `src/pages/tasks/TaskListPage.test.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.translation.test.tsx`

**Interfaces:**
- Consumes: `templateId`, internal `templateVersion`, and store templates.
- Produces: template selector labels and task rows/details using template names only.

- [ ] **Step 1: Write failing task-page tests**

```tsx
expect(screen.getByRole("columnheader", { name: "消息模板" })).toBeVisible();
expect(screen.queryByRole("columnheader", { name: "模板版本" })).not.toBeInTheDocument();
expect(screen.getByText("仅显示全部目标语言人工审核通过的模板")).toBeVisible();
```

- [ ] **Step 2: Run task tests and verify RED**

Run: `npm test -- --run src/pages/tasks/TaskListPage.test.tsx src/pages/tasks/CreateTaskPage.translation.test.tsx`

Expected: FAIL because version labels remain visible.

- [ ] **Step 3: Add a display-name resolver**

```ts
const templateDisplayName = (task: MessageTask) => {
  const template = store.templates.find((item) => item.id === task.templateId);
  if (template) return template.name;
  return task.template.replace(/\s+v\d+$/i, "");
};
```

Use this resolver for the artificial task table and detail drawer. Keep event-version description rows unchanged.

- [ ] **Step 4: Remove selector and capability-strip version copy**

Display template options as `${item.name} · ${item.channels.join(" + ")}`. Change both explanatory strings to “仅显示全部目标语言人工审核通过的模板”. Keep `templateVersion: selectedTemplate?.version` in submission data.

- [ ] **Step 5: Keep copied-task compatibility**

Continue resolving copied tasks by `templateId` first. Keep the legacy `${template.code} ${template.version}` fallback so previously stored task records still open correctly.

- [ ] **Step 6: Run task tests and verify GREEN**

Run: `npm test -- --run src/pages/tasks/TaskListPage.test.tsx src/pages/tasks/CreateTaskPage.translation.test.tsx`

Expected: PASS.

### Task 3: Regression verification

**Files:**
- Verify only.

- [ ] **Step 1: Run affected suites**

Run: `npm test -- --run src/pages/templates src/pages/tasks`

Expected: PASS.

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 3: Commit implementation**

```bash
git add src/pages/templates src/pages/tasks
git commit -m "fix: hide manual template versions"
```

