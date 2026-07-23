# 多语言单状态模型实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将目标语言和翻译批次统一收敛为“无结果、翻译返回待审核、已通过”三个状态，并在所有前端入口使用同一映射、聚合和操作规则。

**Architecture:** 领域层新增唯一的状态规范化与批次聚合函数，数据初始化和本地存储恢复都先迁移旧状态。Store 只写入三种新状态；多语言列表、进度抽屉、普通审核和专项审核仅消费统一状态，并通过 `specialReviewRequired`、错误字段和审核记录表达专项路由、失败与驳回。

**Tech Stack:** React 18、TypeScript 5.9、Arco Design React、Vitest、Testing Library、本地外部 Store Mock。

## Global Constraints

- 唯一业务状态链为：`无结果 → 翻译返回待审核 → 已通过`。
- 小语种专项审核使用 `specialReviewRequired` 和审核组标签，不增加状态。
- 审核驳回后保持“翻译返回待审核”，驳回原因写入错误/审核详情字段。
- 外部任务 ID、尝试次数、时间和错误码继续保留，但不得作为业务状态。
- 全部有效目标语言为“已通过”时才开放后续业务审核和发布。
- 已取消旧数据不计入有效语言；其他旧状态在读取时完成兼容迁移。
- 不新增运行时依赖。

---

### Task 1: 建立三状态领域模型和旧状态迁移

**Files:**
- Create: `src/domain/translationStatus.ts`
- Create: `src/domain/translationStatus.test.ts`
- Modify: `src/domain/types.ts:268-290`

**Interfaces:**
- Produces: `normalizeTranslationStatus(status: string): TranslationItemStatus`
- Produces: `deriveTranslationBatchStatus(items: Array<Pick<TranslationItem, "status">>): TranslationBatchStatus`
- Produces: `hasTranslationResult(status: TranslationItemStatus): boolean`
- Produces: `isTranslationApproved(status: TranslationItemStatus): boolean`

- [ ] **Step 1: 写入失败测试**

```ts
expect(normalizeTranslationStatus("翻译失败")).toBe("无结果");
expect(normalizeTranslationStatus("待小语种专审")).toBe("翻译返回待审核");
expect(normalizeTranslationStatus("审核驳回")).toBe("翻译返回待审核");
expect(normalizeTranslationStatus("审核通过")).toBe("已通过");
expect(
  deriveTranslationBatchStatus([
    { status: "已通过" },
    { status: "无结果" },
  ]),
).toBe("无结果");
```

- [ ] **Step 2: 运行测试并确认因接口不存在而失败**

Run: `npm run test:run -- src/domain/translationStatus.test.ts`

Expected: FAIL，提示 `translationStatus` 模块或导出不存在。

- [ ] **Step 3: 收敛类型并实现规范化函数**

```ts
export type TranslationStatus =
  | "无结果"
  | "翻译返回待审核"
  | "已通过";
export type TranslationItemStatus = TranslationStatus;
export type TranslationBatchStatus = TranslationStatus;

const approved = new Set(["已通过", "审核通过", "全部审核通过"]);
const returned = new Set([
  "翻译返回待审核",
  "待普通确认",
  "修改中",
  "待小语种专审",
  "专审中",
  "待人工审核",
  "审核驳回",
  "审核被驳回",
]);

export const normalizeTranslationStatus = (status: string) =>
  approved.has(status)
    ? "已通过"
    : returned.has(status)
      ? "翻译返回待审核"
      : "无结果";
```

`deriveTranslationBatchStatus` 按“任一无结果 → 无结果；全部通过 → 已通过；否则 → 翻译返回待审核”聚合。

- [ ] **Step 4: 运行领域测试**

Run: `npm run test:run -- src/domain/translationStatus.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交领域状态模型**

```bash
git add src/domain/types.ts src/domain/translationStatus.ts src/domain/translationStatus.test.ts
git commit -m "refactor: simplify translation status model"
```

---

### Task 2: 迁移 Mock 和 Store 状态写入

**Files:**
- Modify: `src/mocks/data.ts:510-740`
- Modify: `src/mocks/translationData.test.ts`
- Modify: `src/store/prototypeStore.ts:95-150,960-1240`
- Modify: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `normalizeTranslationStatus`、`deriveTranslationBatchStatus`
- Produces: Store 中所有 `TranslationItem.status` 和 `TranslationBatch.status` 只写入三种新状态

- [ ] **Step 1: 写入 Store 失败测试**

```ts
const batch = createTranslationBatch({
  templateId: "TPL-1004",
  targetLocales: ["en-US"],
  createdBy: "Gary Ma",
});
expect(batch.status).toBe("翻译返回待审核");
expect(batch.items[0].status).toBe("翻译返回待审核");

retryTranslation(batch.items[0].id);
expect(getPrototypeState().translationBatches[0].items[0].status)
  .toBe("翻译返回待审核");
```

再覆盖：普通/专项审核通过写“已通过”；审核驳回写“翻译返回待审核”；旧状态恢复会被迁移；旧“已取消”条目被有效集合过滤。

- [ ] **Step 2: 运行 Store 和 Mock 测试并确认失败**

Run: `npm run test:run -- src/store/prototypeStore.test.ts src/mocks/translationData.test.ts`

Expected: FAIL，实际仍返回“待人工审核、待小语种专审、翻译失败”等旧状态。

- [ ] **Step 3: 更新初始化迁移**

在 `normalizeTranslationBatches` 中：

```ts
const items = batch.items
  .filter((item) => String(item.status) !== "已取消")
  .map((item) => ({
    ...item,
    status: normalizeTranslationStatus(String(item.status)),
    specialReviewRequired: policy?.specialReviewRequired || false,
  }));

return {
  ...batch,
  items,
  status: deriveTranslationBatchStatus(items),
};
```

- [ ] **Step 4: 更新所有写状态操作**

- 创建外部机翻 Mock 时直接生成机器译文，条目和批次写“翻译返回待审核”。
- 重试成功后写“翻译返回待审核”，清除旧错误并更新时间。
- 开始普通审核或专项审核时不改变状态。
- 审核通过写“已通过”。
- 审核驳回写“翻译返回待审核”，保留 `errorMessage` 和审核记录。
- 每次操作后用 `deriveTranslationBatchStatus` 重算批次和模板 `translationReadiness`。

- [ ] **Step 5: 更新 Mock 固定数据**

将固定数据改为三状态；无结果条目不提供 `translatedAt`，翻译返回待审核和已通过条目提供机器译文；专项语言继续设置 `specialReviewRequired`。

- [ ] **Step 6: 运行 Store 和 Mock 测试**

Run: `npm run test:run -- src/store/prototypeStore.test.ts src/mocks/translationData.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交状态写入和数据迁移**

```bash
git add src/store/prototypeStore.ts src/store/prototypeStore.test.ts src/mocks/data.ts src/mocks/translationData.test.ts
git commit -m "refactor: migrate translation data to three statuses"
```

---

### Task 3: 简化进度聚合、列表单元格和抽屉

**Files:**
- Modify: `src/pages/multilingual/multilingualProgress.ts`
- Modify: `src/pages/multilingual/multilingualProgress.test.ts`
- Modify: `src/pages/multilingual/MultilingualProgressCell.tsx`
- Modify: `src/pages/multilingual/MultilingualProgressDrawer.tsx`
- Modify: `src/pages/multilingual/MultilingualProgress.test.tsx`

**Interfaces:**
- Produces: `deriveMultilingualProgress(batch)` 返回 `approved`、`total`、`percent`、`status`、`missingResultLocales`
- Produces: `unfinishedLocales(batch)` 只返回“无结果”或“翻译返回待审核”的有效语言

- [ ] **Step 1: 写入新的聚合失败测试**

```ts
expect(deriveMultilingualProgress(batchWith([
  ["en-US", "已通过"],
  ["ru-RU", "无结果"],
  ["ja-JP", "翻译返回待审核"],
]))).toMatchObject({
  approved: 1,
  total: 3,
  percent: 33,
  status: "无结果",
  missingResultLocales: ["ru-RU"],
});
```

组件测试要求抽屉不再出现“生成机器翻译、普通语言确认、小语种专项审核”步骤，只出现三状态；专项语言显示“专项审核”标签和“前往专项审核”。

- [ ] **Step 2: 运行进度测试并确认失败**

Run: `npm run test:run -- src/pages/multilingual/multilingualProgress.test.ts src/pages/multilingual/MultilingualProgress.test.tsx`

Expected: FAIL，实际仍返回阶段和旧状态。

- [ ] **Step 3: 实现三状态聚合**

```ts
export const unfinishedLocales = (batch: TranslationBatch) =>
  batch.items
    .filter((item) => item.status !== "已通过")
    .sort((a, b) => Number(a.status !== "无结果") - Number(b.status !== "无结果"))
    .map((item) => ({ locale: item.targetLocale, status: item.status }));
```

进度对象以 `deriveTranslationBatchStatus(batch.items)` 产生唯一状态，并单独计算 `missingResultLocales`。

- [ ] **Step 4: 简化列表单元格**

列表显示：

```text
3/6 已通过  [无结果]
缺少结果：俄语
待审核：日语、土耳其语
```

不显示“当前阶段”和旧状态短文案。

- [ ] **Step 5: 简化抽屉**

删除阶段 `Steps`。摘要展示唯一批次状态、通过比例和缺少结果语言；逐语言行显示三状态，专项语言额外显示“专项审核”标签。按钮规则：无结果“重新机翻”，翻译返回待审核普通语言“审核译文”、专项语言“前往专项审核”，已通过“查看译文”。

- [ ] **Step 6: 运行进度与组件测试**

Run: `npm run test:run -- src/pages/multilingual/multilingualProgress.test.ts src/pages/multilingual/MultilingualProgress.test.tsx`

Expected: PASS。

- [ ] **Step 7: 提交进度 UI**

```bash
git add src/pages/multilingual/multilingualProgress.ts src/pages/multilingual/multilingualProgress.test.ts src/pages/multilingual/MultilingualProgressCell.tsx src/pages/multilingual/MultilingualProgressDrawer.tsx src/pages/multilingual/MultilingualProgress.test.tsx
git commit -m "refactor: simplify multilingual progress UI"
```

---

### Task 4: 更新结果审核、专项审核和模板门禁

**Files:**
- Modify: `src/pages/multilingual/MultilingualResultPanel.tsx`
- Modify: `src/pages/multilingual/MultilingualReviewPage.tsx`
- Modify: `src/pages/multilingual/MultilingualReviewPage.test.tsx`
- Modify: `src/pages/approvals/TranslationReviewDrawer.tsx`
- Modify: `src/pages/approvals/ApprovalCenter.translation.test.tsx`
- Modify: `src/pages/templates/TranslationWorkflowPanel.tsx`
- Modify: `src/pages/templates/TemplateListPage.translation.test.tsx`

**Interfaces:**
- Consumes: 三状态和 `specialReviewRequired`
- Produces: 普通审核与专项审核在“翻译返回待审核”状态下工作；发布门禁只接受“已通过”

- [ ] **Step 1: 写入审核 UI 失败测试**

```ts
expect(screen.getByText("翻译返回待审核")).toBeVisible();
expect(screen.queryByText("待小语种专审")).not.toBeInTheDocument();
expect(screen.getByText("专项审核")).toBeVisible();
```

再覆盖审核驳回后状态仍为“翻译返回待审核”，并能看到驳回原因。

- [ ] **Step 2: 运行审核和模板测试并确认失败**

Run: `npm run test:run -- src/pages/multilingual/MultilingualReviewPage.test.tsx src/pages/approvals/ApprovalCenter.translation.test.tsx src/pages/templates/TemplateListPage.translation.test.tsx`

Expected: FAIL，页面仍依赖“待小语种专审、专审中、待普通确认”等旧状态。

- [ ] **Step 3: 更新结果面板与审核抽屉**

- `无结果`：不展示编辑器，展示错误详情和重新机翻入口。
- `翻译返回待审核`：普通语言可编辑和通过；专项语言只读并跳转专项审核页。
- `已通过`：只读展示机器译文和最终人工版本。
- 驳回原因由 `errorMessage` 或审核记录展示，不通过状态表达。

- [ ] **Step 4: 更新专项审核列表**

专项审核列表筛选条件改为：

```ts
item.specialReviewRequired && item.status === "翻译返回待审核"
```

操作按钮统一为“开始专项审核”，点击或保存过程中不改变状态；通过后写“已通过”。

- [ ] **Step 5: 更新模板翻译工作区和门禁**

删除阶段 `Steps` 和旧状态颜色表。批次和逐语言行只显示三状态；操作按状态与专项标识选择；`ready` 改为 `batch.status === "已通过"`。

- [ ] **Step 6: 运行审核和模板测试**

Run: `npm run test:run -- src/pages/multilingual/MultilingualReviewPage.test.tsx src/pages/approvals/ApprovalCenter.translation.test.tsx src/pages/templates/TemplateListPage.translation.test.tsx`

Expected: PASS。

- [ ] **Step 7: 提交审核和门禁调整**

```bash
git add src/pages/multilingual/MultilingualResultPanel.tsx src/pages/multilingual/MultilingualReviewPage.tsx src/pages/multilingual/MultilingualReviewPage.test.tsx src/pages/approvals/TranslationReviewDrawer.tsx src/pages/approvals/ApprovalCenter.translation.test.tsx src/pages/templates/TranslationWorkflowPanel.tsx src/pages/templates/TemplateListPage.translation.test.tsx
git commit -m "refactor: align translation review with single status"
```

---

### Task 5: 同步任务、事件页面与 PRD，完成全量验证

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.translation.test.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.completion.test.tsx`
- Modify: `src/pages/automation/AutomationRuleListPage.test.tsx`
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/prd/message-center/03-消息模板与多语言.md`
- Modify: `docs/prd/message-center/04-系统事件.md`

**Interfaces:**
- Consumes: 前四项统一状态模型
- Produces: 所有业务入口和 PRD 使用同一三状态术语

- [ ] **Step 1: 更新跨页面验收测试**

人工任务的临时消息、模板任务和事件内容版本在打开多语言进度时，只允许出现三状态。断言页面不再出现：

```ts
for (const legacy of [
  "排队中",
  "翻译中",
  "待普通确认",
  "修改中",
  "待小语种专审",
  "专审中",
  "待人工审核",
  "审核驳回",
]) {
  expect(screen.queryByText(legacy)).not.toBeInTheDocument();
}
```

- [ ] **Step 2: 运行跨页面测试并修复剩余旧状态引用**

Run: `npm run test:run -- src/pages/tasks/CreateTaskPage.translation.test.tsx src/pages/tasks/CreateTaskPage.completion.test.tsx src/pages/automation/AutomationRuleListPage.test.tsx`

Expected: PASS，且 `rg` 不再找到业务 UI 中的旧翻译状态分支。

- [ ] **Step 3: 同步模块 PRD**

将多语言流程统一写为：

```text
无结果 → 翻译返回待审核 → 已通过
```

说明专项审核是路由标签；失败、源文案变化和驳回使用详情提示；发布门禁要求全部语言已通过。

- [ ] **Step 4: 执行静态扫描**

Run:

```bash
rg -n '排队中|翻译中|待普通确认|修改中|待小语种专审|专审中|待人工审核|审核通过|翻译失败|审核驳回|全部审核通过|部分失败' src --glob '!**/*.test.*'
```

Expected: 业务翻译状态分支无匹配；若其他领域使用同名“待人工审核”，必须确认不是多语言状态。

- [ ] **Step 5: 执行全量测试和构建**

Run:

```bash
npm run test:run -- --silent=passed-only
npm run build
git diff --check
```

Expected: 所有测试通过、Vite 生产构建成功、无空白错误。

- [ ] **Step 6: 提交跨页面和文档调整**

```bash
git add src/pages/tasks src/pages/automation docs/prd/message-center
git commit -m "docs: align multilingual workflow statuses"
```
