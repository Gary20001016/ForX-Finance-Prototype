# Controlled Manual Message Variables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a controlled variable library for artificial messages, with permission-gated maintenance, CSV import preview, and search/copy/insert support limited to station-message and App Push bodies.

**Architecture:** Add a persistent controlled-variable collection to the prototype store and centralize token extraction, validation, insertion, and CSV parsing in a focused domain module. A new management page owns browsing and maintenance, while a reusable picker is embedded in both manual template and temporary-message body editors. Event templates keep their current event-field mapping path.

**Tech Stack:** React 19, TypeScript, Arco Design React, React Router, Vitest, Testing Library, Vite.

## Global Constraints

- The page lives under the “人工消息” navigation group as “模板变量”.
- Every variable is controlled; the frontend stores only name, description, status, updated time, and updater.
- Variable tokens use exact syntax `{{ variable_name }}` and names use `snake_case`.
- Variables can be inserted only into station-message Markdown bodies and App Push bodies.
- Manual template and temporary-message editors cannot declare arbitrary variable names.
- Machine translation and language review must keep each token name and occurrence count unchanged.
- Event-template variables and event-field mappings remain unchanged.
- Only operators with variable-maintenance permission can add, edit, enable, disable, or import; the prototype’s displayed “超级管理员” has this permission.

---

### Task 1: Controlled-variable domain and persistent store

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/manualMessageVariables.ts`
- Test: `src/domain/manualMessageVariables.test.ts`
- Modify: `src/store/prototypeStore.ts`
- Test: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Produces: `ControlledTemplateVariable`, `extractVariableNames`, `validateVariableTokens`, `insertVariableToken`, `parseVariableCsv`, `addControlledVariable`, `updateControlledVariable`, and `importControlledVariables`.
- Consumes: the prototype store’s existing immutable-update and local-storage migration pattern.

- [ ] **Step 1: Write failing domain tests**

Cover token extraction and repeated-token counts, cursor insertion, invalid/inactive token validation, malformed braces, CSV header validation, `snake_case` validation, duplicate-row errors, and create-versus-update preview counts.

```ts
expect(extractVariableNames('Hi {{ user_nickname }} {{ user_nickname }}'))
  .toEqual(['user_nickname', 'user_nickname']);
expect(validateVariableTokens('{{ disabled_key }}', variables)).toEqual({
  valid: false,
  invalid: [],
  inactive: ['disabled_key'],
  malformed: false,
});
expect(parseVariableCsv('variable_name,description\nuser_nickname,用户昵称', variables))
  .toMatchObject({ createCount: 0, updateCount: 1, errorCount: 0 });
```

- [ ] **Step 2: Run the domain tests and verify RED**

Run: `npm test -- --run src/domain/manualMessageVariables.test.ts`

Expected: FAIL because the domain module and exports do not exist.

- [ ] **Step 3: Implement the focused domain module**

Define:

```ts
export interface ControlledTemplateVariable {
  id: string;
  name: string;
  description: string;
  status: '启用' | '停用';
  updatedAt: string;
  updatedBy: string;
}

export type VariableValidationResult = {
  valid: boolean;
  invalid: string[];
  inactive: string[];
  malformed: boolean;
};
```

Use one parser for both preview and import application. A duplicate variable in the existing library is an update; duplicate rows inside one file are errors and are not applied twice.

- [ ] **Step 4: Add store seed, migration, and actions**

Add `templateVariables` to `PrototypeState`, seed at least `user_nickname`, `uid`, `vip_level`, `platform_name`, and `support_email`, and migrate saved states with `saved.templateVariables || fresh.templateVariables`.

Store actions enforce immutable names:

```ts
addControlledVariable({ name, description, updatedBy })
updateControlledVariable(id, { description, status, updatedBy })
importControlledVariables(rows, updatedBy)
```

- [ ] **Step 5: Test store persistence behavior and run GREEN**

Run: `npm test -- --run src/domain/manualMessageVariables.test.ts src/store/prototypeStore.test.ts`

Expected: PASS with additions, description updates, enable/disable transitions, and CSV upserts covered.

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/manualMessageVariables.ts src/domain/manualMessageVariables.test.ts src/store/prototypeStore.ts src/store/prototypeStore.test.ts
git commit -m "feat: add controlled manual message variables"
```

### Task 2: Navigation and variable management page

**Files:**
- Modify: `src/app/navigation.tsx`
- Modify: `src/app/navigation.test.tsx`
- Modify: `src/app/routes.tsx`
- Create: `src/pages/variables/TemplateVariablePage.tsx`
- Create: `src/pages/variables/TemplateVariablePage.test.tsx`
- Create: `src/pages/variables/VariableCsvImportModal.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: Task 1 store collection, domain CSV preview, and CRUD actions.
- Produces: `/template-variables` route and management UI.

- [ ] **Step 1: Write failing navigation and page tests**

Assert that “模板变量” is the third item under “人工消息”, the route is selected correctly, keyword/status filters work, copying is available to all users, and the displayed super-admin can add/edit/disable/import.

```ts
expect(manualGroup.children.map((item) => item.label)).toEqual([
  '人工消息任务', '人工消息模板', '模板变量',
]);
expect(screen.getByRole('heading', { name: '模板变量' })).toBeVisible();
expect(screen.getByRole('button', { name: 'CSV 导入' })).toBeVisible();
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run src/app/navigation.test.tsx src/pages/variables/TemplateVariablePage.test.tsx`

Expected: FAIL because the route and page do not exist.

- [ ] **Step 3: Implement route, page, and single-item editor**

The table columns are 变量名、变量说明、状态、更新时间、更新人、操作. Use a modal with immutable name in edit mode and a `Switch` for status. Copy writes `{{ name }}` to the clipboard and reports success or failure.

- [ ] **Step 4: Implement CSV preview modal**

Accept `.csv` up to 10 MB, parse locally, show 新增/更新/错误 statistics and an error table, and require explicit confirmation before calling the store import action. Provide a CSV template download.

- [ ] **Step 5: Run page tests and verify GREEN**

Run: `npm test -- --run src/app/navigation.test.tsx src/pages/variables/TemplateVariablePage.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/navigation.tsx src/app/navigation.test.tsx src/app/routes.tsx src/pages/variables src/styles/global.css
git commit -m "feat: add manual template variable management"
```

### Task 3: Reusable variable picker and body insertion controls

**Files:**
- Create: `src/components/VariablePicker.tsx`
- Create: `src/components/VariablePicker.test.tsx`
- Modify: `src/components/MarkdownEditor.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `ControlledTemplateVariable` and `insertVariableToken` from Task 1.
- Produces: `VariablePicker` and optional Markdown editor props `variables` and `onInsertVariable`.

- [ ] **Step 1: Write failing picker and Markdown insertion tests**

Assert name/description search, inactive-variable exclusion, copy behavior, and insertion at the current Markdown cursor.

```tsx
<VariablePicker variables={variables} onInsert={onInsert} />
expect(screen.queryByText('停用变量')).not.toBeInTheDocument();
await user.click(screen.getByRole('button', { name: '插入 user_nickname' }));
expect(onInsert).toHaveBeenCalledWith('user_nickname');
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run src/components/VariablePicker.test.tsx`

Expected: FAIL because the picker does not exist.

- [ ] **Step 3: Implement the picker and Markdown toolbar integration**

Use an Arco popover/drawer-style selector with a search box and two actions per row. Markdown insertion reuses the editor’s selection-aware replacement function so the token is written at the current cursor.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- --run src/components/VariablePicker.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/VariablePicker.tsx src/components/VariablePicker.test.tsx src/components/MarkdownEditor.tsx src/styles/global.css
git commit -m "feat: add controlled variable picker"
```

### Task 4: Manual template editor integration

**Files:**
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Modify: `src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx`
- Modify: `src/pages/templates/TemplateEditorDrawer.test-send.test.tsx`

**Interfaces:**
- Consumes: Tasks 1 and 3 token extraction, validation, variable list, and picker.
- Produces: controlled variables in manual reusable templates; event templates retain the existing variable-input path.

- [ ] **Step 1: Write failing manual-template tests**

Assert that manual scope has no free-form “模板变量” input, station and Push bodies expose insert controls, title/summary do not, inserted tokens update body content, and invalid/inactive tokens block submit. Assert event scope still shows its existing variable declaration field.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx src/pages/templates/TemplateEditorDrawer.test-send.test.tsx`

Expected: FAIL on the current free-form input and missing body insertion controls.

- [ ] **Step 3: Implement manual-template integration**

Condition the legacy variable input on `entryScope === 'event'`. For manual templates, derive `variables` from both body fields with `extractVariableNames`, deduplicate before persistence and test send, and validate against `store.templateVariables` before submit. Saving a draft may retain invalid tokens but displays a warning.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- --run src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx src/pages/templates/TemplateEditorDrawer.test-send.test.tsx src/pages/templates/TemplateEditorDrawer.single-language.test.tsx`

Expected: PASS, including unchanged event behavior.

- [ ] **Step 5: Commit**

```bash
git add src/pages/templates/TemplateEditorDrawer.tsx src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx src/pages/templates/TemplateEditorDrawer.test-send.test.tsx
git commit -m "feat: control variables in manual templates"
```

### Task 5: Temporary artificial-message integration and language protection

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.completion.test.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.single-language.test.tsx`
- Modify: `src/pages/multilingual/multilingualProgress.test.ts`

**Interfaces:**
- Consumes: Tasks 1 and 3 token extraction, validation, and picker.
- Produces: controlled variables in temporary artificial-message bodies and translation-batch token integrity.

- [ ] **Step 1: Write failing temporary-message tests**

Assert station and Push bodies offer search/insert, title and summary do not, submit is blocked for unknown or inactive tokens, valid tokens populate the temporary translation carrier’s `variables`, and translation batches preserve token names and occurrence counts.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run src/pages/tasks/CreateTaskPage.completion.test.tsx src/pages/tasks/CreateTaskPage.single-language.test.tsx src/pages/multilingual/multilingualProgress.test.ts`

Expected: FAIL because temporary content has no picker and uses a fixed variable list.

- [ ] **Step 3: Implement temporary-message integration**

Pass controlled variables to the Markdown body picker, place the same picker next to Push body, derive variables from both bodies when building the temporary translation carrier, and call `validateVariableTokens` before language preparation and task submission. Error text names the affected channel and variables and leaves the wizard on 内容与多语言.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- --run src/pages/tasks/CreateTaskPage.completion.test.tsx src/pages/tasks/CreateTaskPage.single-language.test.tsx src/pages/multilingual/multilingualProgress.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/tasks/CreateTaskPage.tsx src/pages/tasks/CreateTaskPage.completion.test.tsx src/pages/tasks/CreateTaskPage.single-language.test.tsx src/pages/multilingual/multilingualProgress.test.ts
git commit -m "feat: control variables in temporary messages"
```

### Task 6: Full regression and production verification

**Files:**
- Modify only files required to resolve failures introduced by Tasks 1–5.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified production-ready frontend change.

- [ ] **Step 1: Run focused feature suite**

Run: `npm test -- --run src/domain/manualMessageVariables.test.ts src/pages/variables src/components/VariablePicker.test.tsx src/pages/templates src/pages/tasks src/pages/multilingual`

Expected: all selected test files pass.

- [ ] **Step 2: Run navigation and layout regression**

Run: `npm test -- --run src/app/navigation.test.tsx src/layout/AdminLayout.test.tsx`

Expected: PASS with the new third artificial-message navigation item.

- [ ] **Step 3: Build production bundle**

Run: `npm run build`

Expected: TypeScript and Vite finish with exit code 0.

- [ ] **Step 4: Inspect change boundaries**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; pre-existing translation-review drawer changes remain outside feature commits.
