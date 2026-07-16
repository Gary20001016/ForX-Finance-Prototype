# 人工任务继承分类默认消息性质实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除人工消息任务对消息性质的手工选择，让任务、临时模板和预览统一使用消息分类的默认性质。

**Architecture:** 扩展现有 `messageCategories` 共享分类定义，使其同时提供默认消息性质；通过一个纯函数按分类名称读取默认值。系统配置页与人工任务页都消费这一配置，任务提交时仍将最终性质冻结到任务数据中。

**Tech Stack:** React 18、TypeScript、Arco Design React、现有外部状态仓库。

## Global Constraints

- 人工任务页保留消息性质只读展示，不允许操作者修改。
- 切换消息分类时立即更新默认消息性质。
- 保存草稿、临时消息机翻、预览和提交使用同一个默认值。
- 历史任务已保存的性质不被批量回写。
- 按用户要求，本次不新增或运行自动化测试。

---

### Task 1: 建立共享分类默认性质

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/mocks/data.ts`
- Create: `src/domain/messageCategoryPolicy.ts`
- Modify: `src/pages/settings/SettingsPage.tsx`

**Interfaces:**
- Produces: `getMessageCategoryDefaultNature(categoryName: string): string | undefined`
- Consumes: `messageCategories: MessageCategory[]`

- [ ] **Step 1: 扩展分类类型和种子数据**

给 `MessageCategory` 增加 `defaultNature: "事务" | "服务" | "营销"`，并按设计文档给七个分类填入默认值。

- [ ] **Step 2: 增加按分类名称读取默认性质的纯函数**

```ts
export const getMessageCategoryDefaultNature = (categoryName: string) =>
  messageCategories.find((item) => item.name === categoryName)?.defaultNature;
```

- [ ] **Step 3: 让系统配置页使用共享分类定义**

删除 `SettingsPage` 内重复维护的分类名称、性质和风险种子；从 `messageCategories` 生成分类配置页面数据。

### Task 2: 人工任务只读继承默认性质

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`

**Interfaces:**
- Consumes: `getMessageCategoryDefaultNature(categoryName)`
- Produces: `submission().nature`、临时模板 `nature` 和 `TaskSummary.nature` 的统一值

- [ ] **Step 1: 计算当前消息性质**

从表单当前分类读取默认性质；编辑已有任务且尚未切换分类时保留任务冻结值，切换分类后读取新的默认值。

- [ ] **Step 2: 替换可编辑控件**

删除 `nature` 表单字段和事务/服务/营销单选按钮，改为只读提示：

```tsx
<div className="readonly-policy-field">
  <strong>{resolvedNature}</strong>
  <span>由消息分类自动确定</span>
</div>
```

- [ ] **Step 3: 统一所有数据出口**

`submission()`、`createTemporaryTranslation()` 与 `summary` 直接使用 `resolvedNature`，删除 `values.nature` 和 `form.getFieldValue("nature")` 依赖。

### Task 3: 文档、静态检查与提交

**Files:**
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/prd/message-center/09-系统配置与审计.md`

- [ ] **Step 1: 更新 PRD**

明确人工任务不可覆盖消息性质，消息性质由分类配置决定并在提交时冻结。

- [ ] **Step 2: 执行非测试检查**

```bash
rg -n 'field="nature"|getFieldValue\("nature"\)|values\.nature' src/pages/tasks/CreateTaskPage.tsx
git diff --check
```

预期：第一条无匹配；第二条无输出。

- [ ] **Step 3: 提交代码**

```bash
git add src/domain src/mocks/data.ts src/pages/settings/SettingsPage.tsx src/pages/tasks/CreateTaskPage.tsx docs/prd/message-center docs/superpowers/plans
git commit -m "feat: derive manual task nature from category"
```
