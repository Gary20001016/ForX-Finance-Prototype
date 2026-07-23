# 多语言审核完成时间 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在多语言审核详情中移除内容哈希，分别展示人工审核完成时间与机器翻译完成时间。

**Architecture:** 保留现有领域数据，只调整 `TranslationReviewDrawer` 的 Descriptions 字段映射。使用现有 `reviewedAt` 表示人工审核完成时间，使用 `translatedAt` 表示机器翻译完成时间。

**Tech Stack:** TypeScript 5.9、React 18、Arco Design React、Vitest、Testing Library。

## Global Constraints

- 不删除或修改底层 `sourceContentHash` 字段。
- 人工审核未完成时，“审核完成时间”显示“—”。
- 直接编写原文不展示机器翻译完成时间。

---

### Task 1: 审核详情时间字段

**Files:**
- Modify: `src/pages/approvals/TranslationReviewDrawer.tsx`
- Modify: `src/pages/approvals/TranslationReviewDrawer.direct-source.test.tsx`

**Interfaces:**
- Consumes: `TranslationItem.reviewedAt`、`TranslationItem.translatedAt`。
- Produces: “审核完成时间”和“机翻完成时间”详情字段。

- [ ] **Step 1: 写失败展示测试**

```tsx
expect(screen.queryByText("源内容哈希")).not.toBeInTheDocument();
expect(screen.getByText("审核完成时间")).toBeVisible();
expect(screen.getByText("机翻完成时间")).toBeVisible();
```

- [ ] **Step 2: 运行定向测试并确认失败**

Run: `npm test -- --run src/pages/approvals/TranslationReviewDrawer.direct-source.test.tsx`

Expected: FAIL，当前页面仍展示“源内容哈希”，并使用含义不明确的“完成时间”。

- [ ] **Step 3: 修改详情字段映射**

机器翻译内容展示：

```ts
{ label: "审核完成时间", value: current.reviewedAt || "—" },
{ label: "机翻完成时间", value: current.translatedAt || "—" },
```

直接编写原文仅展示：

```ts
{ label: "审核完成时间", value: current.reviewedAt || "—" },
```

- [ ] **Step 4: 运行定向测试与生产构建**

Run: `npm test -- --run src/pages/approvals/TranslationReviewDrawer.direct-source.test.tsx && npm run build`

Expected: 定向测试通过，TypeScript 与 Vite 构建成功。
