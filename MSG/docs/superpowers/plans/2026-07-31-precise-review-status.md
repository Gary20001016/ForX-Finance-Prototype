# 精确审核状态展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保持模板四状态生命周期，并通过独立的当前节点展示“内容审核中”或“多语言审核中”。

**Architecture:** 以 `workflowStage` 作为流程事实来源，在数据归一化时校正四状态生命周期；模板列表和详情展示四状态，任务与模板当前节点共用精确节点文案。

**Tech Stack:** React、TypeScript、Arco Design、Vitest

## Global Constraints

- 不修改持久化模板状态。
- 不增加新的后台接口或模拟数据字段。
- 人工模板、事件模板、任务列表和详情使用同一文案。

---

### Task 1: 统一审核状态派生

**Files:**
- Modify: `src/domain/contentApprovalWorkflow.ts`
- Test: `src/domain/contentApprovalWorkflow.test.ts`

**Interfaces:**
- Produces: `templateOperatorStatusLabel(status, workflowStage): string`
- Produces: `contentWorkflowStageLabel(stage): string`

- [ ] **Step 1: 写失败测试**

覆盖内容审核、多语言任务创建、多语言审核以及非审核状态。

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- src/domain/contentApprovalWorkflow.test.ts`

- [ ] **Step 3: 实现最小状态派生逻辑**

在领域层集中映射精确展示状态。

- [ ] **Step 4: 运行测试并确认通过**

Run: `npm test -- src/domain/contentApprovalWorkflow.test.ts`

### Task 2: 接入模板与任务页面

**Files:**
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/pages/templates/TemplateReadOnlyDetails.tsx`
- Modify: `src/components/StatusTag.tsx`
- Test: `src/components/StatusTag.test.tsx`
- Test: `src/pages/templates/TemplateListPage.completion.test.tsx`

**Interfaces:**
- Consumes: `templateOperatorStatusLabel(status, workflowStage): string`

- [ ] **Step 1: 写失败测试**

断言内容审核阶段显示“内容审核中”，多语言阶段显示“多语言审核中”。

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- src/components/StatusTag.test.tsx src/pages/templates/TemplateListPage.completion.test.tsx`

- [ ] **Step 3: 接入统一状态派生**

模板列表与详情使用派生状态，状态标签补充对应颜色。

- [ ] **Step 4: 运行测试并确认通过**

Run: `npm test -- src/domain/contentApprovalWorkflow.test.ts src/components/StatusTag.test.tsx src/pages/templates/TemplateListPage.completion.test.tsx`

- [ ] **Step 5: 构建验证**

Run: `npm run build`
