# 人工消息已发布模板锁定实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. The user explicitly requested implementation without automated tests; verification is limited to TypeScript/Vite build and diff checks.

**Goal:** 禁止修改业务审核通过并已发布的人工专用或通用消息模板，同时保留查看能力和纯事件模板的现有编辑行为。

**Architecture:** 在领域层提供唯一的锁定判断与提示文案，列表、多语言流程、编辑抽屉和数据存储层共同引用。界面层阻止正常入口，存储层负责防止绕过界面的更新调用。

**Tech Stack:** React 18、TypeScript、Arco Design React、Vite、本地原型状态仓库。

## Global Constraints

- 锁定条件必须同时满足 `status === "已发布"` 与 `usageScope` 为 `manual` 或 `shared`。
- `usageScope === "event"` 的纯事件模板保持可编辑。
- 本次不新增创建新版本、复制模板或解除锁定能力。
- 按用户要求不新增、不运行自动化测试。

---

### Task 1: 建立统一模板锁定策略

**Files:**
- Create: `src/domain/templatePolicy.ts`
- Modify: `src/store/prototypeStore.ts`

**Interfaces:**
- Produces: `isApprovedManualTemplateLocked(template): boolean`
- Produces: `APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE: string`
- Consumes: `MessageTemplate` 的 `status` 与 `usageScope` 字段。

- [ ] **Step 1: 新增统一锁定策略**

```ts
import type { MessageTemplate } from "./types";

export const APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE =
  "业务审核已通过，已发布的人工消息模板不可修改";

export const isApprovedManualTemplateLocked = (
  template: Pick<MessageTemplate, "status" | "usageScope">,
) => template.status === "已发布" && template.usageScope !== "event";
```

- [ ] **Step 2: 在数据层更新前执行兜底检查**

在 `updateTemplate` 开头读取现有模板。模板不存在时沿用“模板不存在”；命中锁定策略时抛出 `APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE`，且不进入状态更新函数。

---

### Task 2: 锁定人工模板页面的编辑入口

**Files:**
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/pages/templates/TranslationWorkflowPanel.tsx`

**Interfaces:**
- Consumes: `isApprovedManualTemplateLocked` 与 `APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE`。

- [ ] **Step 1: 锁定列表编辑按钮**

对每条模板计算锁定状态。锁定时渲染禁用的“编辑”按钮，并使用 Arco `Tooltip` 展示统一提示；未锁定时沿用现有 `setEditing(r)` 行为。

- [ ] **Step 2: 锁定多语言流程的源文案编辑按钮**

对模板应用同一判断。锁定时禁用“编辑源文案”并显示统一提示；多语言结果、进度和其他查看操作不变。

---

### Task 3: 防止残留状态打开可编辑表单

**Files:**
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`

**Interfaces:**
- Consumes: `isApprovedManualTemplateLocked` 与 `APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE`。

- [ ] **Step 1: 为已锁定模板渲染只读拦截抽屉**

当 `visible` 且模板已锁定时，只展示错误提示与关闭按钮，不渲染表单和保存/机翻操作。新建模板及未锁定模板继续使用原编辑器。

---

### Task 4: 文档同步与静态验证

**Files:**
- Modify: `docs/prd/message-center/03-消息模板与多语言.md`

- [ ] **Step 1: 更新 PRD 模板编辑规则**

写明人工专用及通用模板业务审核通过、状态进入“已发布”后不可修改；其他状态修改后回到草稿并重走翻译与审核；纯事件模板不受本次规则影响。

- [ ] **Step 2: 运行静态验证**

Run: `npm run build && git diff --check`

Expected: TypeScript 与 Vite 构建完成，`git diff --check` 无输出。

- [ ] **Step 3: 提交实现**

```bash
git add src/domain/templatePolicy.ts src/store/prototypeStore.ts src/pages/templates/TemplateListPage.tsx src/pages/templates/TranslationWorkflowPanel.tsx src/pages/templates/TemplateEditorDrawer.tsx docs/prd/message-center
git commit -m "feat: lock approved manual templates"
```
