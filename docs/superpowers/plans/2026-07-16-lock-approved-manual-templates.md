# 人工消息已发布模板锁定实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. The user explicitly requested implementation without automated tests; verification is limited to TypeScript/Vite build and diff checks.

**Goal:** 禁止修改业务审核通过并已发布的人工专用或通用消息模板，同时保留查看能力和纯事件模板的现有编辑行为。

**Architecture:** 在领域层提供唯一的锁定判断与提示文案，列表、多语言流程、只读详情和数据存储层共同引用。已锁定模板从列表进入独立只读内容组件，编辑抽屉仅负责选择只读或编辑模式；存储层负责防止绕过界面的更新调用。

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

- [ ] **Step 1: 将已锁定模板的编辑入口改为查看详情**

对每条模板计算锁定状态。锁定时渲染可点击的“查看详情”并沿用 `setEditing(r)` 打开抽屉；未锁定时显示“编辑”。两种入口共享模板选择状态，但由抽屉内部判断渲染模式。

- [ ] **Step 2: 将多语言流程切换为只读**

对模板应用同一判断。锁定时禁用“编辑源文案”并显示统一提示；同时禁止新建或重试机翻、普通语言校对和跳转专项审核，只保留多语言结果与进度查看。

---

### Task 3: 防止残留状态打开可编辑表单

**Files:**
- Create: `src/pages/templates/TemplateReadOnlyDetails.tsx`
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`

**Interfaces:**
- Consumes: `isApprovedManualTemplateLocked` 与 `APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE`。

- [ ] **Step 1: 创建只读模板详情组件**

`TemplateReadOnlyDetails` 接收 `MessageTemplate`，使用 `Alert` 展示锁定原因，使用 `Descriptions`、`Tag` 和 `Space` 展示模板 ID、编码、名称、版本、状态、分类、性质、风险、适用场景、所有者、渠道、默认语言、语言覆盖、模板变量和更新时间；存在 `content` 时使用 `MessagePreview` 展示 Web 站内信、App 站内信和 App Push。

- [ ] **Step 2: 在编辑抽屉中渲染只读详情**

当 `visible` 且模板已锁定时，抽屉标题为“查看模板”，内容渲染 `TemplateReadOnlyDetails`，底部只保留“关闭”。新建模板及未锁定模板继续使用原编辑器和保存操作。

---

### Task 4: 文档同步与静态验证

**Files:**
- Modify: `docs/prd/message-center/03-消息模板与多语言.md`

- [ ] **Step 1: 更新 PRD 模板编辑规则**

写明人工专用及通用模板业务审核通过、状态进入“已发布”后可以查看完整基础信息、变量和三端预览，但不可修改；其他状态修改后回到草稿并重走翻译与审核；纯事件模板不受本次规则影响。

- [ ] **Step 2: 运行静态验证**

Run: `npm run build && git diff --check`

Expected: TypeScript 与 Vite 构建完成，`git diff --check` 无输出。

- [ ] **Step 3: 提交实现**

```bash
git add src/domain/templatePolicy.ts src/store/prototypeStore.ts src/pages/templates/TemplateListPage.tsx src/pages/templates/TranslationWorkflowPanel.tsx src/pages/templates/TemplateEditorDrawer.tsx docs/prd/message-center
git commit -m "feat: lock approved manual templates"
```
