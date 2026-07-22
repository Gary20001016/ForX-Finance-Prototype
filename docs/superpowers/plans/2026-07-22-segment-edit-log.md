# 用户分群字段级编辑日志 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在用户分群详情中展示字段级编辑日志，并在创建、编辑分群时自动生成可追溯的变更记录。

**Architecture:** 在领域类型中增加编辑日志模型；用独立纯函数比较分群编辑前后的受控字段并生成人类可读差异；分群页面在保存时写入日志，在详情抽屉按时间倒序渲染日志。现有模拟数据补充历史记录以便原型直接展示。

**Tech Stack:** React 18、TypeScript、Arco Design React、Vitest、Testing Library、Vite。

## Global Constraints

- 仅实现前端原型，不新增接口或服务端持久化。
- 日志不可编辑、不可删除。
- 无字段变化时不产生编辑日志。
- 组合分群的来源分群使用名称展示，集合运算展示为“并集”或“交集”。
- 当前操作者固定展示为 `Gary Ma`。

---

### Task 1: 建立编辑日志模型与字段差异计算

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/pages/segments/segmentEditLog.ts`
- Test: `src/pages/segments/segmentEditLog.test.ts`

**Step 1: Write the failing test**

- 覆盖新建分群时生成“创建分群”字段集。
- 覆盖编辑时只返回发生变化的字段。
- 覆盖集合运算和来源分群的中文可读值。
- 覆盖无变化时返回空数组。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/segments/segmentEditLog.test.ts --run`

Expected: FAIL，因为差异计算模块尚不存在。

**Step 3: Write minimal implementation**

- 新增 `SegmentEditChange`、`SegmentEditLog` 类型。
- 为 `AudienceSegment` 增加可选字段 `editLogs`。
- 实现受控字段快照、值格式化与差异计算。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/pages/segments/segmentEditLog.test.ts --run`

Expected: PASS。

---

### Task 2: 保存分群时记录创建与编辑日志

**Files:**
- Modify: `src/pages/segments/SegmentListPage.tsx`
- Modify: `src/mocks/data.ts`

**Step 1: Add representative mock history**

- 为现有分群补充至少一条创建记录和一条字段编辑记录。
- 日志按最新记录在前排列。

**Step 2: Integrate log generation into save flow**

- 新建分群时生成“创建分群”日志。
- 编辑分群时比较保存前后字段，只在存在差异时追加“编辑规则”日志。
- 保留原有日志，并将最新日志插入首位。

**Step 3: Preserve current segment behavior**

- 不改变动态条件、静态名单、组合分群现有创建和估算逻辑。
- 不改变列表的筛选、查看与编辑入口。

---

### Task 3: 在分群详情抽屉展示字段级日志

**Files:**
- Modify: `src/pages/segments/SegmentListPage.tsx`
- Modify: `src/pages/segments/SegmentListPage.interactions.test.tsx`

**Step 1: Write the failing interaction test**

- 打开已有分群详情。
- 断言存在“编辑日志”。
- 断言展示操作名称、操作者、时间与字段的前后值。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/segments/SegmentListPage.interactions.test.tsx --run`

Expected: FAIL，因为详情抽屉还没有日志区域。

**Step 3: Implement the log display**

- 在基础信息下方增加“编辑日志”。
- 按时间倒序展示操作、操作者和操作时间。
- 每条日志展开显示字段名及“旧值 → 新值”。
- 没有记录时显示空状态。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/pages/segments/SegmentListPage.interactions.test.tsx --run`

Expected: PASS。

---

### Task 4: 完整验证

**Files:**
- Verify only

**Step 1: Run focused tests**

Run: `npm test -- src/pages/segments/segmentEditLog.test.ts src/pages/segments/segmentSetOperations.test.ts src/pages/segments/SegmentListPage.interactions.test.tsx --run`

Expected: PASS。

**Step 2: Run production build**

Run: `npm run build`

Expected: PASS，无 TypeScript 或打包错误。

**Step 3: Inspect the final diff**

Run: `git diff -- src/domain/types.ts src/mocks/data.ts src/pages/segments/SegmentListPage.tsx src/pages/segments/SegmentListPage.interactions.test.tsx src/pages/segments/segmentEditLog.ts src/pages/segments/segmentEditLog.test.ts`

Expected: 仅包含编辑日志能力相关变更。
