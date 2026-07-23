# 组合分群交集与并集 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在用户分群前端中提供可操作的多分群并集/交集构造器，并将集合表达式保存和展示出来。

**Architecture:** 为集合表达式和原型预估人数建立纯函数，页面根据分群类型切换动态条件构造器与组合分群构造器。组合分群只引用已有分群 ID，列表与详情继续读取统一的 `rule` 摘要。

**Tech Stack:** TypeScript 5.9、React 18、Arco Design React、Vitest、Testing Library。

## Global Constraints

- 组合分群必须选择至少两个已有分群。
- 只支持一个全局集合运算：`union` 或 `intersection`。
- 不允许组合分群引用自身。
- 本期只实现前端原型展示，不调用真实集合计算接口。
- 不实现差集和嵌套组合。

---

### Task 1: 集合规则数据与计算函数

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/pages/segments/segmentSetOperations.ts`
- Create: `src/pages/segments/segmentSetOperations.test.ts`

**Interfaces:**
- Consumes: `AudienceSegment[]`、`sourceSegmentIds: string[]`、`SetOperation`。
- Produces: `SetOperation`、`segmentSetExpression()`、`estimateSegmentSetCount()`。

- [ ] **Step 1: 写失败测试**

```ts
expect(segmentSetExpression(segments, ["SEG-101", "SEG-102"], "union"))
  .toBe("近30天沉默交易用户 ∪ ETH 活跃用户");
expect(estimateSegmentSetCount(segments, ["SEG-101", "SEG-102"], "intersection"))
  .toBeLessThanOrEqual(328400);
```

- [ ] **Step 2: 运行定向测试并确认模块缺失**

Run: `npm test -- --run src/pages/segments/segmentSetOperations.test.ts`

Expected: FAIL，提示无法解析 `./segmentSetOperations`。

- [ ] **Step 3: 实现类型和纯函数**

```ts
export type SetOperation = "union" | "intersection";

export const segmentSetExpression = (segments, ids, operation) =>
  ids.map((id) => segments.find((segment) => segment.id === id)?.name)
    .filter(Boolean)
    .join(operation === "union" ? " ∪ " : " ∩ ");
```

并集预估为人数总和且不超过所有可选分群总人数；交集预估为最小来源人数的 60%，四舍五入为整数。

- [ ] **Step 4: 运行定向测试并确认通过**

Run: `npm test -- --run src/pages/segments/segmentSetOperations.test.ts`

Expected: PASS。

### Task 2: 组合分群前端构造器

**Files:**
- Modify: `src/pages/segments/SegmentListPage.tsx`
- Modify: `src/pages/segments/SegmentListPage.interactions.test.tsx`
- Modify: `src/mocks/data.ts`

**Interfaces:**
- Consumes: Task 1 的集合运算类型和纯函数。
- Produces: 根据分群类型切换的表单、至少两个来源分群校验、表达式预览、保存后的规则摘要。

- [ ] **Step 1: 写失败交互测试**

```tsx
await user.click(screen.getByText("组合分群"));
expect(screen.getByText("组合规则")).toBeVisible();
expect(screen.getByText("并集（满足任一分群）")).toBeVisible();
expect(screen.getByText("交集（同时满足全部分群）")).toBeVisible();
expect(screen.getByText("集合表达式")).toBeVisible();
```

- [ ] **Step 2: 运行页面定向测试并确认失败**

Run: `npm test -- --run src/pages/segments/SegmentListPage.interactions.test.tsx`

Expected: FAIL，当前页面仍显示单条动态条件构造器。

- [ ] **Step 3: 实现组合构造器**

页面监听 `type`、`setOperation` 和 `sourceSegmentIds`：

```tsx
{segmentType === "组合分群" ? (
  <SegmentCombinationBuilder
    availableSegments={availableSegments}
    operation={setOperation}
    selectedIds={sourceSegmentIds}
  />
) : (
  <DynamicConditionBuilder />
)}
```

使用 Arco 多选 `Select` 选择来源分群，使用按钮式 `Radio.Group` 切换并集/交集，展示每个来源分群的人数标签、集合表达式和原型预估人数。

- [ ] **Step 4: 保存组合数据与摘要**

```ts
const rule = segmentSetExpression(data, values.sourceSegmentIds, values.setOperation);
const count = estimateSegmentSetCount(data, values.sourceSegmentIds, values.setOperation);
```

保存 `setOperation` 和 `sourceSegmentIds`；动态条件仍按原有字段、运算符和阈值保存。

- [ ] **Step 5: 运行页面定向测试并确认通过**

Run: `npm test -- --run src/pages/segments/SegmentListPage.interactions.test.tsx`

Expected: PASS。

- [ ] **Step 6: 运行生产构建**

Run: `npm run build`

Expected: TypeScript 与 Vite 构建成功。
