# Email 全链路演示数据 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为消息中心所有主要业务入口补充至少一条可直接查看的 Email 演示记录。

**Architecture:** 新建独立 `emailDemoFixtures` 模块集中生成互相关联的模板、任务、审核、多语言和投递数据。`prototypeStore` 在创建种子和迁移旧本地状态时按固定 ID 合并这些记录，使现有用户无需清空浏览器数据即可看到新案例。

**Tech Stack:** React 18、TypeScript、Arco Design React、Vitest、现有内存状态与 localStorage 迁移层。

## Global Constraints

- 每个主要页面至少一条 Email 示例，但不把全部现有记录改成 Email。
- HTML 示例按 `zh-CN`、`en-US` 分别上传，正文不进入机翻或多语言审核。
- 纯文本示例的标题、预览文字和正文进入外部机翻与人工审核。
- 使用固定 ID 合并数据，刷新后不重复，且不要求清空已有本地操作。
- 不增加后端服务或第三方依赖。

---

### Task 1: 建立关联完整的 Email fixture 模块

**Files:**
- Create: `src/mocks/emailDemoFixtures.ts`
- Create: `src/mocks/emailDemoFixtures.test.ts`

**Interfaces:**
- Consumes: `createEmailHtmlAsset()`, `createDefaultEmailConfig()` 和领域类型。
- Produces: `createEmailDemoFixtures(): { templates; tasks; translationBatches; approvals; deliveries }`。

- [ ] **Step 1: 写 fixture 失败测试**

测试断言：人工模板 `TPL-EMAIL-DEMO-HTML` 为 HTML 模式且含两个校验通过的语言资源；事件模板 `TPL-EMAIL-DEMO-EVENT` 为纯文本模式；人工/事件任务均含 Email；审核、多语言批次和投递记录均通过固定 ID 关联。

```ts
const fixtures = createEmailDemoFixtures();
expect(fixtures.templates.find(({ id }) => id === "TPL-EMAIL-DEMO-HTML")?.content?.email)
  .toMatchObject({ bodyMode: "html" });
expect(Object.keys(htmlTemplate!.content!.email!.htmlAssets!)).toEqual(["zh-CN", "en-US"]);
expect(fixtures.translationBatches[0].channels).toEqual(["邮件"]);
```

- [ ] **Step 2: 运行测试并确认因模块不存在而失败**

Run: `npm run test:run -- src/mocks/emailDemoFixtures.test.ts`

Expected: FAIL，提示无法解析 `./emailDemoFixtures`。

- [ ] **Step 3: 实现最小 fixture 生成器**

在一个函数中创建：

```ts
export function createEmailDemoFixtures() {
  const htmlTemplate = createHtmlMarketingTemplate();
  const eventTemplate = createTextEventTemplate();
  return {
    templates: [htmlTemplate, eventTemplate],
    tasks: [createManualTask(htmlTemplate), createEventTask(eventTemplate)],
    translationBatches: [createHtmlTitleBatch(htmlTemplate), createTextEmailBatch(eventTemplate)],
    approvals: [createEmailApproval(htmlTemplate)],
    deliveries: [createOpenedDelivery(), createBouncedDelivery()],
  };
}
```

HTML 文件使用完整 doctype、内联样式、HTTPS 链接及 `{{ unsubscribe_url }}`，并将通过校验的资源标记为 `contentReviewStatus: "approved"`。纯文本事件正文只使用已登记的 `user_nickname`、`amount`、`currency`、`occurred_at` 变量。

- [ ] **Step 4: 运行 fixture 测试并确认通过**

Run: `npm run test:run -- src/mocks/emailDemoFixtures.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交 fixture 模块**

```bash
git add src/mocks/emailDemoFixtures.ts src/mocks/emailDemoFixtures.test.ts
git commit -m "feat: add linked email demo fixtures"
```

### Task 2: 将 fixtures 注入初始状态与旧状态迁移

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Consumes: `createEmailDemoFixtures()`。
- Produces: `createSeed()` 与 `migrateSavedState()` 中按 ID 去重的模板、任务、翻译批次、审核和投递数据。

- [ ] **Step 1: 写状态覆盖失败测试**

新增两组断言：全新状态包含全部 Email fixture ID；移除 fixture 后执行迁移，缺失记录被补回且原有记录不重复。

```ts
const migrated = migrateSavedState(savedWithoutEmailFixtures);
expect(migrated.templates.filter(({ id }) => id === "TPL-EMAIL-DEMO-HTML")).toHaveLength(1);
expect(migrated.tasks.filter(({ id }) => id === "MSG-EMAIL-DEMO-MANUAL")).toHaveLength(1);
expect(migrated.deliveries.filter(({ id }) => id === "DEL-EMAIL-DEMO-OPENED")).toHaveLength(1);
```

- [ ] **Step 2: 运行目标测试并确认缺少记录**

Run: `npm run test:run -- src/store/prototypeStore.test.ts`

Expected: FAIL，缺少 Email fixture 固定 ID。

- [ ] **Step 3: 实现种子注入和通用按 ID 合并**

创建 fixtures 后，将模板加入 `enrichTemplates` 的输入；任务、翻译批次、审核与投递分别加入 `createSeed`。迁移时采用保存记录优先、缺失新种子追加的策略：

```ts
const mergeMissingById = <T extends { id: string }>(saved: T[], fresh: T[]) => [
  ...saved,
  ...fresh.filter((seed) => !saved.some((item) => item.id === seed.id)),
];
```

任务仍执行既有显示位置和事件状态规范化；投递仍执行来源、风险和渠道字段规范化。

- [ ] **Step 4: 运行状态测试并确认通过**

Run: `npm run test:run -- src/store/prototypeStore.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交状态集成**

```bash
git add src/store/prototypeStore.ts src/store/prototypeStore.test.ts
git commit -m "feat: seed email demos across message workflows"
```

### Task 3: 验证各页面能找到并打开 Email 案例

**Files:**
- Modify: `src/pages/templates/TemplateListPage.scope.test.tsx`
- Modify: `src/pages/tasks/TaskListPage.test.tsx`
- Modify: `src/pages/multilingual/MultilingualReviewPage.test.tsx`
- Modify: `src/pages/approvals/ApprovalCenterPage.test.tsx`

**Interfaces:**
- Consumes: 状态层中的固定 Email fixture。
- Produces: 页面级回归覆盖，确保人工模板、事件模板、人工任务、事件任务、内容审核和多语言审核入口可见。

- [ ] **Step 1: 添加页面级失败断言**

分别渲染页面并断言以下名称可见：`夏季 VIP 专属礼遇邮件`、`充值到账 Email 通知`、`VIP 礼遇 Email 群发`、`充值到账 Email 事件任务`、`Email 营销内容审核`、`充值到账 Email 日语审核`；打开详情后断言出现 `Email` 与对应邮件标题。

- [ ] **Step 2: 运行页面测试并确认失败原因是 fixture 尚未展示**

Run: `npm run test:run -- src/pages/templates/TemplateListPage.scope.test.tsx src/pages/tasks/TaskListPage.test.tsx src/pages/multilingual/MultilingualReviewPage.test.tsx src/pages/approvals/ApprovalCenterPage.test.tsx`

Expected: FAIL，目标案例名称或 Email 内容不存在。

- [ ] **Step 3: 在多语言审核列表补充渠道字段**

从 `item.batchId` 查找翻译批次，在多语言审核列表新增“渠道”列，并把 `邮件` 显示为 `Email` 标签。其他页面复用现有渠道 Tag 和 `MessagePreview`，不新增平行预览组件。

- [ ] **Step 4: 运行页面测试并确认通过**

Run: `npm run test:run -- src/pages/templates/TemplateListPage.scope.test.tsx src/pages/tasks/TaskListPage.test.tsx src/pages/multilingual/MultilingualReviewPage.test.tsx src/pages/approvals/ApprovalCenterPage.test.tsx`

Expected: PASS。

- [ ] **Step 5: 提交页面回归**

```bash
git add src/pages/templates/TemplateListPage.scope.test.tsx src/pages/tasks/TaskListPage.test.tsx src/pages/multilingual/MultilingualReviewPage.test.tsx src/pages/approvals/ApprovalCenterPage.test.tsx src/pages/multilingual/MultilingualReviewPage.tsx
git commit -m "test: cover email demos across workflow pages"
```

### Task 4: 全量验证与浏览器检查

**Files:**
- Verify only; no planned production changes.

**Interfaces:**
- Consumes: 完整实现。
- Produces: 测试、构建和浏览器证据。

- [ ] **Step 1: 运行完整测试**

Run: `npm run test:run`

Expected: 全部测试通过，0 failures。

- [ ] **Step 2: 运行生产构建**

Run: `npm run build`

Expected: TypeScript 与 Vite 构建成功。

- [ ] **Step 3: 在浏览器逐入口检查**

检查 `/templates?scope=manual`、`/templates?scope=event`、`/tasks`、事件任务页面、`/approvals`、`/multilingual-review` 和 `/deliveries`。确认案例可见、渠道为 Email、详情/预览可打开，HTML 案例可切换 `zh-CN` 与 `en-US`。

- [ ] **Step 4: 提交必要的验证修正**

浏览器检查发现的任何展示问题都单独执行“失败测试 → 最小修复 → 目标测试 → 全量测试”的回归循环后再提交。
