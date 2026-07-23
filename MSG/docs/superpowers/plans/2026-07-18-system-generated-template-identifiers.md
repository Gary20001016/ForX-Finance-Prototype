# System-Generated Template Identifiers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove operator-authored template codes and generate immutable template IDs and internal codes in the data layer.

**Architecture:** `prototypeStore` owns identifier generation for every reusable or temporary template creation path. UI components expose only `MessageTemplate.id` as “模板编号”; `MessageTemplate.code` remains an internal, immutable compatibility field for existing event and task references.

**Tech Stack:** React 18, TypeScript 5.9, Arco Design React, Vitest, Testing Library.

## Global Constraints

- New template IDs use `TPL-{MAN|EVT|SHR}-{YYYYMMDD}-{NNNN}`.
- Internal codes are derived from IDs as lowercase underscore strings, such as `tpl_man_20260718_0001`.
- Existing template IDs and codes are not migrated.
- Callers cannot supply or update `id` or `code` through `saveTemplate` and `updateTemplate` types.
- Operators see “模板编号” only; they never enter or see the internal code.
- Existing event and historical task compatibility matching remains unchanged.

---

### Task 1: Generate and protect template identifiers

**Files:**
- Create: `src/store/templateIdentifiers.test.ts`
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.completion.test.tsx`

**Interfaces:**
- Produces: `saveTemplate(input: TemplateCreateInput): MessageTemplate`, where `TemplateCreateInput` omits all generated workflow fields plus `id` and `code`.
- Produces: `updateTemplate(id: string, changes: TemplateUpdateInput): MessageTemplate`, where `TemplateUpdateInput` is `Partial<Omit<MessageTemplate, "id" | "code">>`.
- Preserves: `MessageTemplate.code` on the stored entity for compatibility consumers.

- [ ] **Step 1: Write the failing data-layer tests**

Create `src/store/templateIdentifiers.test.ts`:

```ts
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MessageTemplate } from "../domain/types";
import {
  getPrototypeState,
  resetPrototypeStore,
  saveTemplate,
  updateTemplate,
} from "./prototypeStore";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-18T09:30:00+08:00"));
  resetPrototypeStore();
});

afterEach(() => vi.useRealTimers());

const templateInput = (name: string) => ({
  name,
  category: "系统公告",
  nature: "事务",
  risk: "低" as const,
  channels: ["站内信" as const],
  locales: ["zh-CN"],
  sourceLocale: "zh-CN",
  content: getPrototypeState().templates[0].content,
  variables: [],
  owner: "消息运营",
  usageScope: "manual" as const,
});

it("generates readable sequential IDs and internal codes", () => {
  const first = saveTemplate(templateInput("模板一"));
  const second = saveTemplate(templateInput("模板二"));

  expect(first).toMatchObject({
    id: "TPL-MAN-20260718-0001",
    code: "tpl_man_20260718_0001",
  });
  expect(second).toMatchObject({
    id: "TPL-MAN-20260718-0002",
    code: "tpl_man_20260718_0002",
  });
});

it("keeps identifiers immutable during updates", () => {
  const created = saveTemplate(templateInput("原名称"));
  const changes = {
    id: "TPL-TAMPERED",
    code: "tampered",
    name: "新名称",
  } as Partial<MessageTemplate>;

  const updated = updateTemplate(created.id, changes);

  expect(updated).toMatchObject({
    id: "TPL-MAN-20260718-0001",
    code: "tpl_man_20260718_0001",
    name: "新名称",
  });
});
```

- [ ] **Step 2: Run the data-layer test and verify RED**

Run: `npm run test:run -- src/store/templateIdentifiers.test.ts`

Expected: FAIL because `saveTemplate` currently generates a timestamp-only ID, accepts no generated code fallback, and `updateTemplate` spreads attempted identifier changes.

- [ ] **Step 3: Implement identifier generation and immutable update types**

Add these types and helpers immediately before `saveTemplate` in `src/store/prototypeStore.ts`:

```ts
type TemplateCreateInput = Omit<
  MessageTemplate,
  | "id"
  | "code"
  | "translationBatchId"
  | "translationReadiness"
  | "version"
  | "status"
  | "updatedAt"
>;

type TemplateUpdateInput = Partial<Omit<MessageTemplate, "id" | "code">>;

const templateScopeCode: Record<TemplateUsageScope, string> = {
  manual: "MAN",
  event: "EVT",
  shared: "SHR",
};

const localDateStamp = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

const nextTemplateIdentifiers = (usageScope: TemplateUsageScope) => {
  const prefix = `TPL-${templateScopeCode[usageScope]}-${localDateStamp(new Date())}`;
  let sequence = 1;
  let id = "";
  do {
    id = `${prefix}-${String(sequence).padStart(4, "0")}`;
    sequence += 1;
  } while (state.templates.some((template) => template.id === id));
  return { id, code: id.toLowerCase().replaceAll("-", "_") };
};
```

Ensure `TemplateUsageScope` is added to the existing type import. Replace the create and update signatures and bodies with:

```ts
export const saveTemplate = (input: TemplateCreateInput) => {
  const identifiers = nextTemplateIdentifiers(input.usageScope);
  const template: MessageTemplate = {
    ...input,
    ...identifiers,
    translationBatchId: "",
    translationReadiness: "无结果",
    version: "v1",
    status: "草稿",
    updatedAt: "刚刚",
  };
  update((current) => ({
    ...current,
    templates: [template, ...current.templates],
  }));
  return template;
};

export const updateTemplate = (
  id: string,
  changes: TemplateUpdateInput,
) => {
  const existing = state.templates.find((item) => item.id === id);
  if (!existing) throw new Error("模板不存在");
  if (isApprovedManualTemplateLocked(existing))
    throw new Error(APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE);

  const {
    id: ignoredId,
    code: ignoredCode,
    ...mutableChanges
  } = changes as Partial<MessageTemplate>;
  void ignoredId;
  void ignoredCode;

  let result = existing;
  update((current) => ({
    ...current,
    templates: current.templates.map((item) => {
      if (item.id !== id) return item;
      result = {
        ...item,
        ...mutableChanges,
        translationReadiness: "无结果",
        translationBatchId: "",
        status: "草稿",
        version: `v${Number(item.version.replace(/\D/g, "")) + 1}`,
        updatedAt: "刚刚",
      };
      return result;
    }),
  }));
  return result;
};
```

- [ ] **Step 4: Remove caller-authored temporary codes**

Delete the `code` property from the `saveTemplate` object in `CreateTaskPage.createTemporaryTranslation` and from the `saveTemplate` object in `CreateTaskPage.completion.test.tsx`. No replacement property is added because `saveTemplate` generates both identifiers.

- [ ] **Step 5: Run the data-layer tests and verify GREEN**

Run: `npm run test:run -- src/store/templateIdentifiers.test.ts src/store/prototypeStore.test.ts src/pages/tasks/CreateTaskPage.completion.test.tsx`

Expected: 3 test files pass with no failed tests.

### Task 2: Remove internal codes from operator interfaces

**Files:**
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/pages/templates/TemplateReadOnlyDetails.tsx`
- Modify: `src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx`
- Modify: `src/pages/templates/TemplateListPage.completion.test.tsx`
- Modify: `src/pages/templates/TemplateEditorDrawer.test-send.test.tsx`

**Interfaces:**
- Consumes: data-layer generated identifiers from Task 1.
- Produces: operator UI that displays `template.id` as “模板编号” and never exposes `template.code`.

- [ ] **Step 1: Write the failing operator-interface assertions**

In `TemplateListPage.completion.test.tsx`, extend the new-template test with:

```ts
expect(screen.queryByText("模板编码", { selector: "label" })).not.toBeInTheDocument();
expect(screen.queryByPlaceholderText(/snake_case/)).not.toBeInTheDocument();
```

Add a list test:

```ts
it("shows the system template number instead of the internal code", () => {
  render(
    <MemoryRouter initialEntries={["/templates?scope=manual"]}>
      <TemplateListPage />
    </MemoryRouter>,
  );

  expect(screen.getByText("TPL-1004")).toBeVisible();
  expect(screen.queryByText("network_maintenance")).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText("搜索模板编号或名称")).toBeVisible();
});
```

In the locked-template test in `TemplateEditorDrawer.test-send.test.tsx`, add:

```ts
expect(screen.getByText("模板编号")).toBeVisible();
expect(screen.queryByText("模板编码")).not.toBeInTheDocument();
expect(screen.getByText(template.id)).toBeVisible();
```

- [ ] **Step 2: Run the UI tests and verify RED**

Run: `npm run test:run -- src/pages/templates/TemplateListPage.completion.test.tsx src/pages/templates/TemplateEditorDrawer.test-send.test.tsx`

Expected: FAIL because the editor still shows the code input, the list renders the internal code, and the read-only detail displays both identifiers.

- [ ] **Step 3: Remove the code field from the editor**

In `TemplateEditorDrawer.tsx`:

- Remove `code: template?.code` from `form.setFieldsValue`.
- Remove `code: values.code` from the save payload.
- Delete the complete `Form.Item` whose label is “模板编码”.
- Change the template-name `Grid.Col` from `span={6}` to `span={12}` so the remaining first-row columns total 24.

Update `TemplateEditorDrawer.channel-linkage.test.tsx` by deleting:

```ts
await user.type(screen.getByPlaceholderText(/snake_case/), "station_only");
```

- [ ] **Step 4: Show only the operator-facing template number**

In `TemplateListPage.tsx`, change the secondary template text to `r.id` and change the search placeholder to:

```tsx
placeholder="搜索模板编号或名称"
```

Keep the current internal filtering expression `${item.id}${item.code}${item.name}` for historical compatibility.

In `TemplateReadOnlyDetails.tsx`, replace the two identifier description items with exactly one:

```tsx
{
  label: "模板编号",
  value: <span className="mono">{template.id}</span>,
},
```

- [ ] **Step 5: Run the complete targeted regression set**

Run: `npm run test:run -- src/store/templateIdentifiers.test.ts src/store/prototypeStore.test.ts src/pages/tasks/CreateTaskPage.completion.test.tsx src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx src/pages/templates/TemplateListPage.completion.test.tsx src/pages/templates/TemplateEditorDrawer.test-send.test.tsx src/pages/templates/TemplateListPage.scope.test.tsx`

Expected: 7 test files pass with no failed tests.

- [ ] **Step 6: Run the production build and formatting check**

Run: `npm run build && git diff --check`

Expected: TypeScript and Vite production build succeed; `git diff --check` prints no output.

- [ ] **Step 7: Commit the implementation**

```bash
git add src/store/prototypeStore.ts src/store/templateIdentifiers.test.ts src/pages/tasks/CreateTaskPage.tsx src/pages/tasks/CreateTaskPage.completion.test.tsx src/pages/templates/TemplateEditorDrawer.tsx src/pages/templates/TemplateListPage.tsx src/pages/templates/TemplateReadOnlyDetails.tsx src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx src/pages/templates/TemplateListPage.completion.test.tsx src/pages/templates/TemplateEditorDrawer.test-send.test.tsx
git commit -m "feat: generate template identifiers automatically"
```
