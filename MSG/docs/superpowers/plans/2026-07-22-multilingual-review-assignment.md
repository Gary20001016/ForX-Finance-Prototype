# 多语言审核唯一指派 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为小语种审核工单增加随机唯一指派、允许合格发起者自审，以及“待我审核/全部工单”双视图。

**Architecture:** 在独立领域模块内完成候选过滤、随机指派和操作资格判断；Store 在任务生成、数据迁移和语言权限变更时调用；页面只根据唯一指派结果控制列表与操作。

**Tech Stack:** TypeScript、React、Arco Design React、Vitest。

## Global Constraints

- 仅小语种专项审核生成工单。
- 一个译文只能有一个指派审核人。
- 发起者具有目标语言审核权限时可以参与随机指派并自审。
- 所有工单可查看，只有被指派人可操作。

---

### Task 1: 指派领域规则与数据模型

**Files:**
- Create: `src/domain/translationReviewAssignment.ts`
- Create: `src/domain/translationReviewAssignment.test.ts`
- Modify: `src/domain/types.ts`

- [ ] 写失败测试：过滤语言授权人、随机单选、允许合格发起者、阻止非指派人审核。
- [ ] 运行 `npm test -- --run src/domain/translationReviewAssignment.test.ts` 确认失败。
- [ ] 实现 `assignTranslationReviewer()`、`canOperateAssignedTranslation()`、`reassignInvalidTranslationReviews()`。
- [ ] 再次运行定向测试并确认通过。

### Task 2: Store 接入

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`

- [ ] 写失败测试：专项工单包含唯一指派人、非指派人不能审核、失权自动改派。
- [ ] 运行 Store 定向测试确认失败。
- [ ] 在翻译批次生成、旧数据迁移、权限更新和审核操作中接入领域规则。
- [ ] 运行 Store 定向测试确认通过。

### Task 3: 多语言审核页面

**Files:**
- Modify: `src/pages/multilingual/MultilingualReviewPage.tsx`
- Modify: `src/pages/approvals/TranslationReviewDrawer.tsx`
- Modify: `src/pages/multilingual/MultilingualReviewPage.test.tsx`

- [ ] 写失败测试：待我审核过滤、全部工单展示、非指派人只读。
- [ ] 运行页面定向测试确认失败。
- [ ] 增加双 Tab、指派审核人列和审核按钮权限控制。
- [ ] 运行页面定向测试并执行 `npm run build`。

