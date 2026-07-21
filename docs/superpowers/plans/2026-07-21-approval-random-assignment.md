# 审核工单随机指派 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为发布审核工单实现随机单人指派、禁止自审、权限失效自动改派和无候选人时的原子阻断。

**Architecture:** 新建纯领域模块集中计算合格审核人、随机选择、操作资格和批量改派；Store 在创建、迁移、权限更新和审核提交四个边界调用该模块；审核中心只负责按当前人筛选与呈现唯一审核人。随机函数允许注入，确保领域测试可重复。

**Tech Stack:** TypeScript 5.9、React 18、Arco Design React、Vitest。

## Global Constraints

- 审核人必须账号启用、拥有 `operations.approvals` 写权限且不是发起者。
- 每张待处理工单始终只有一个审核人。
- 无候选人时阻止提交；无替代人时阻止权限变更。
- 多语言审核授权不参与发布审核候选人筛选。
- 正式审核操作必须由当前指派审核人执行，且禁止自审。

---

### Task 1: 审核指派领域规则

**Files:**
- Create: `src/domain/approvalAssignment.ts`
- Create: `src/domain/approvalAssignment.test.ts`
- Modify: `src/domain/types.ts`

**Interfaces:**
- Consumes: `ReviewOperator`、`ApprovalItem`、`canWritePage(operator, "operations.approvals")`。
- Produces: `eligibleApprovalReviewers()`、`assignApprovalReviewer()`、`canReviewAssignedApproval()`、`reassignInvalidApprovals()`。

- [ ] **Step 1: 写失败测试覆盖候选过滤、随机单选、禁止自审和失权改派**

```ts
it("randomly assigns exactly one eligible non-submitter reviewer", () => {
  const assignment = assignApprovalReviewer(operators, "admin-01", () => 0);
  expect(assignment.assigneeId).toBe("reviewer-zh-01");
});

it("reassigns a pending approval when its reviewer loses write access", () => {
  const result = reassignInvalidApprovals([approval], operatorsAfterPermissionLoss, () => 0);
  expect(result[0].assigneeId).toBe("admin-01");
});
```

- [ ] **Step 2: 运行领域测试并确认因模块不存在而失败**

Run: `npm test -- --run src/domain/approvalAssignment.test.ts`

Expected: FAIL，提示无法解析 `./approvalAssignment`。

- [ ] **Step 3: 实现最小领域模块**

```ts
export const assignApprovalReviewer = (
  operators: ReviewOperator[],
  submitterId: string,
  random: () => number = Math.random,
) => {
  const eligible = eligibleApprovalReviewers(operators, submitterId);
  if (!eligible.length) throw new Error("当前没有可用审核人，请联系超级管理员配置审核中心写权限");
  const reviewer = eligible[Math.min(eligible.length - 1, Math.floor(random() * eligible.length))];
  return { assigneeId: reviewer.id, assignee: reviewer.name };
};
```

- [ ] **Step 4: 运行领域测试并确认通过**

Run: `npm test -- --run src/domain/approvalAssignment.test.ts`

Expected: PASS。

### Task 2: Store 创建、迁移、改派与审核校验

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`
- Modify: `src/mocks/data.ts`

**Interfaces:**
- Consumes: Task 1 的四个领域函数。
- Produces: 所有新审批单包含唯一 `assigneeId`；`reviewApproval()` 接收并校验 `reviewerId`；人员权限更新原子改派。

- [ ] **Step 1: 写失败测试覆盖提交随机指派、非指派人拒绝和权限撤销改派**

```ts
expect(created.assigneeId).not.toBe(created.submitterId);
expect(() => reviewApproval(created.id, { reviewerId: "admin-01", decision: "approve", reviewer: "Gary Ma", opinion: "ok" })).toThrow("只有被指派的审核人");
expect(after.approvals.find((item) => item.id === created.id)?.assigneeId).not.toBe(previousAssigneeId);
```

- [ ] **Step 2: 运行 Store 定向测试并确认失败**

Run: `npm test -- --run src/store/prototypeStore.test.ts`

Expected: FAIL，现有 Store 仍使用硬编码审核人且不校验 `reviewerId`。

- [ ] **Step 3: 接入领域规则**

```ts
const assignment = assignApprovalReviewer(state.operators, submitterId);
const approval: ApprovalItem = { ...input, ...assignment };

const nextOperators = current.operators.map((candidate) =>
  candidate.id === operatorId
    ? { ...candidate, pagePermissions: normalizePagePermissions(pagePermissions) }
    : candidate,
);
const approvals = reassignInvalidApprovals(current.approvals, nextOperators);
return { ...current, operators: nextOperators, approvals };
```

迁移时保留仍合格的现有指派，只为缺失或失效的待处理工单改派；已完成工单保留历史审核人。

- [ ] **Step 4: 运行 Store 定向测试并确认通过**

Run: `npm test -- --run src/store/prototypeStore.test.ts`

Expected: PASS。

### Task 3: 审核中心按指派人展示和操作

**Files:**
- Modify: `src/pages/approvals/ApprovalCenterPage.tsx`
- Modify: `src/pages/approvals/ApprovalDrawer.tsx`
- Modify: `src/pages/approvals/ApprovalCenter.completion.test.tsx`

**Interfaces:**
- Consumes: 工单的 `assigneeId`、`assignee` 和 Store 的 `reviewApproval(..., reviewerId)`。
- Produces: “待我审核”只显示当前人的工单；非指派人、发起者和无写权限人员只读。

- [ ] **Step 1: 写失败测试覆盖待办过滤与非指派人只读**

```tsx
expect(screen.getByText("指派给 Gary 的工单")).toBeVisible();
expect(screen.queryByText("指派给其他人的工单")).not.toBeInTheDocument();
expect(screen.getByRole("button", { name: "通过审核" })).toBeDisabled();
```

- [ ] **Step 2: 运行审核中心测试并确认失败**

Run: `npm test -- --run src/pages/approvals/ApprovalCenter.completion.test.tsx`

Expected: FAIL，现有用例未按唯一指派人约束展示和操作。

- [ ] **Step 3: 更新列表与详情交互**

```tsx
const mine = approvals.filter(
  (item) => item.assigneeId === currentAdminId && pendingStatuses.includes(item.status),
);
const canReview = canWrite && item.assigneeId === currentAdminId && item.submitterId !== currentAdminId;
```

列表展示唯一审核人；详情显示非指派只读提示；提交审核时传入 `reviewerId: currentAdminId`。

- [ ] **Step 4: 运行审核中心测试并确认通过**

Run: `npm test -- --run src/pages/approvals/ApprovalCenter.completion.test.tsx`

Expected: PASS。

- [ ] **Step 5: 完整验证**

Run: `npm run build`

Expected: TypeScript 与 Vite 构建成功。
