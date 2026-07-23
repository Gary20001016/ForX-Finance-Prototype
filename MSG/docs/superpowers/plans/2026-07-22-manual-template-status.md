# 人工消息模板四状态 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将人工消息模板主状态统一为“草稿、审核中、驳回、已发布”，并彻底移除人工模板的停用状态。

**Architecture:** 新增独立的人工模板状态归一化模块，统一处理标准状态和历史状态迁移；状态生产仍由模板保存、翻译/语言审核、业务审核流程驱动；人工模板列表只消费四种标准状态。事件模板沿用既有流程，多语言状态保持独立。

**Tech Stack:** TypeScript、React 18、Arco Design React、Vitest、Testing Library。

## Global Constraints

- 人工消息模板仅允许“草稿、审核中、驳回、已发布”。
- 不新增模板停用、恢复或归档能力。
- 多语言状态不并入模板主状态。
- 事件模板及事件自动化状态不在本次范围内。
- 历史人工模板状态必须在本地数据加载时归一化。

---

### Task 1: 人工模板状态类型与归一化

**Files:**
- Create: `src/domain/manualTemplateStatus.ts`
- Create: `src/domain/manualTemplateStatus.test.ts`
- Modify: `src/domain/types.ts`

**Interfaces:**
- Produces: `ManualTemplateStatus`
- Produces: `MANUAL_TEMPLATE_STATUSES: readonly ManualTemplateStatus[]`
- Produces: `normalizeManualTemplateStatus(status: string): ManualTemplateStatus`
- Produces: `normalizeManualTemplateStatuses(templates: MessageTemplate[]): MessageTemplate[]`

- [ ] **Step 1: Write the failing normalization tests**

```ts
expect(MANUAL_TEMPLATE_STATUSES).toEqual(["草稿", "审核中", "驳回", "已发布"]);
expect(normalizeManualTemplateStatus("待业务审核")).toBe("审核中");
expect(normalizeManualTemplateStatus("待审核")).toBe("审核中");
expect(normalizeManualTemplateStatus("已驳回")).toBe("驳回");
expect(normalizeManualTemplateStatus("已停用")).toBe("草稿");
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/domain/manualTemplateStatus.test.ts --run`

Expected: FAIL because `manualTemplateStatus.ts` does not exist.

- [ ] **Step 3: Implement the controlled status type and normalizer**

```ts
export type ManualTemplateStatus = "草稿" | "审核中" | "驳回" | "已发布";

export const MANUAL_TEMPLATE_STATUSES = [
  "草稿",
  "审核中",
  "驳回",
  "已发布",
] as const;
```

`normalizeManualTemplateStatuses` only rewrites templates whose `usageScope` is `manual` or `shared`; `event` templates remain unchanged.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- src/domain/manualTemplateStatus.test.ts --run`

Expected: PASS.

---

### Task 2: 模板流程只生成四种人工状态

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`
- Modify: `src/mocks/data.ts`

**Interfaces:**
- Consumes: `normalizeManualTemplateStatuses(templates)` from Task 1.
- Produces: artificial template lifecycle `草稿 → 审核中 → 已发布/驳回`.

- [ ] **Step 1: Write failing store tests**

Add assertions that:

```ts
expect(manualTemplate.status).toBe("审核中");
expect(rejectedManualTemplate.status).toBe("驳回");
expect(allManualStatuses.every((status) => MANUAL_TEMPLATE_STATUSES.includes(status))).toBe(true);
```

The test must exercise a manual/shared template, not an event-only template.

- [ ] **Step 2: Run the focused store test and verify RED**

Run: `npm test -- src/store/prototypeStore.test.ts --run`

Expected: FAIL on legacy `待业务审核` or `已驳回`.

- [ ] **Step 3: Update state production and migration**

- `saveTemplate` and `updateTemplate` continue producing `草稿`.
- Starting translation/language review or submitting business review produces `审核中` for manual/shared templates.
- Business rejection produces `驳回` for manual/shared templates.
- Business approval produces `已发布`.
- `migrateSavedState` applies `normalizeManualTemplateStatuses` after usage-scope normalization.
- Replace the artificial seed fixture with `status: "驳回"`; no seed uses `已停用` for an artificial template.

- [ ] **Step 4: Run the store tests and verify GREEN**

Run: `npm test -- src/store/prototypeStore.test.ts --run`

Expected: PASS.

---

### Task 3: 人工模板列表只展示四状态

**Files:**
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/pages/templates/TemplateListPage.scope.test.tsx`

**Interfaces:**
- Consumes: `MANUAL_TEMPLATE_STATUSES` from Task 1.

- [ ] **Step 1: Write the failing list interaction test**

Open `/templates?scope=manual`, expand the status filter, then assert:

```ts
expect(optionNames).toEqual(expect.arrayContaining(["草稿", "审核中", "驳回", "已发布"]));
expect(screen.queryByRole("option", { name: "待业务审核" })).not.toBeInTheDocument();
expect(screen.queryByRole("option", { name: "已停用" })).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/pages/templates/TemplateListPage.scope.test.tsx --run`

Expected: FAIL because the current filter contains legacy statuses.

- [ ] **Step 3: Use the controlled status options in the manual entry**

For `entryScope === "manual"`, build the status filter from `MANUAL_TEMPLATE_STATUSES`. Keep the event-entry options unchanged.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- src/pages/templates/TemplateListPage.scope.test.tsx --run`

Expected: PASS.

---

### Task 4: Verification

**Files:**
- Verify only

- [ ] **Step 1: Run focused tests**

Run: `npm test -- src/domain/manualTemplateStatus.test.ts src/pages/templates/TemplateListPage.scope.test.tsx src/store/prototypeStore.test.ts --run`

Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Confirm the development page is available**

Run: `curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:5174/templates?scope=manual`

Expected: `200`.
