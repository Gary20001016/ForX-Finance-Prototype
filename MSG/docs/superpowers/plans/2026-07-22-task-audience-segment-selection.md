# 人工消息任务选择用户分群 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在人工消息任务的目标用户步骤中支持单选已有用户分群，并支持多选其他分群作为排除分群。

**Architecture:** 复用 `src/mocks/data.ts` 中用户与受众模块的 `segments` 数据作为前端原型数据源。`CreateTaskPage` 管理主分群和排除分群 ID，统一派生受众摘要与人数，并在任务数据中保存 ID 以支持编辑和复制恢复。

**Tech Stack:** React 18、TypeScript、Arco Design React、Vitest、Testing Library。

## Global Constraints

- 主用户分群只能单选。
- 排除分群允许多选。
- 主分群不能同时出现在排除分群中。
- 未选择主分群时不能进入下一步。
- 本次仅修改前端，不新增后端接口。

---

### Task 1: 扩展人工任务受众数据结构

**Files:**
- Modify: `src/domain/types.ts`
- Test: `src/pages/tasks/CreateTaskPage.segment-audience.test.tsx`

**Interfaces:**
- Produces: `MessageTask.audienceType` 新增 `"segment"`；新增 `audienceSegmentId?: string`、`excludedSegmentIds?: string[]`。

- [ ] **Step 1: Write the failing test**

创建 `CreateTaskPage.segment-audience.test.tsx`，先断言目标用户步骤存在“用户分群”受众方式。

```tsx
expect(screen.getByRole("radio", { name: "用户分群" })).toBeVisible();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/tasks/CreateTaskPage.segment-audience.test.tsx --run`

Expected: FAIL，页面尚未提供“用户分群”。

- [ ] **Step 3: Add the task fields**

将人工任务受众类型扩展为：

```ts
audienceType?: "all" | "uid" | "vip" | "agent" | "campaign" | "segment";
audienceSegmentId?: string;
excludedSegmentIds?: string[];
```

- [ ] **Step 4: Keep the test red until the UI is implemented**

该测试在 Task 2 完成前保持失败，类型检查应无新增错误。

---

### Task 2: 实现主分群与排除分群选择

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Test: `src/pages/tasks/CreateTaskPage.segment-audience.test.tsx`

**Interfaces:**
- Consumes: `segments: AudienceSegment[]` from `src/mocks/data.ts`。
- Produces: `selectedAudienceSegmentId: string | undefined`、`excludedSegmentIds: string[]` 状态；`audience` 派生对象。

- [ ] **Step 1: Extend the failing interaction test**

测试选择“用户分群”后：

```tsx
await user.click(screen.getByRole("radio", { name: "用户分群" }));
expect(screen.getByText("选择用户分群")).toBeVisible();
expect(screen.getByText("排除分群")).toBeVisible();
```

并测试未选择主分群时点击“下一步”显示“请选择用户分群”。

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/tasks/CreateTaskPage.segment-audience.test.tsx --run`

Expected: FAIL，选择控件和校验尚不存在。

- [ ] **Step 3: Implement state and derived audience**

新增状态并从复制/编辑任务恢复：

```ts
const [selectedAudienceSegmentId, setSelectedAudienceSegmentId] = useState(
  copiedTask?.audienceSegmentId,
);
const [excludedSegmentIds, setExcludedSegmentIds] = useState<string[]>(
  copiedTask?.excludedSegmentIds || [],
);
```

选择主分群时自动移除同 ID 的排除项。`audienceType === "segment"` 时，`audience.label`、`audience.count` 从所选分群派生。

- [ ] **Step 4: Implement controls and validation**

新增 Radio：

```tsx
<Radio value="segment">用户分群</Radio>
```

主分群用单选 `Select`，选项为 `${segment.name} · ${segment.count.toLocaleString()} 人`。排除分群使用多选 `Select`，过滤掉当前主分群。目标用户步骤未选主分群时阻止前进并提示“请选择用户分群”。

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/pages/tasks/CreateTaskPage.segment-audience.test.tsx --run`

Expected: PASS。

---

### Task 3: 保存与恢复分群选择

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.segment-audience.test.tsx`

**Interfaces:**
- Consumes: `MessageTask.audienceSegmentId`、`MessageTask.excludedSegmentIds`。
- Produces: `submission()` 返回稳定的主分群与排除分群 ID。

- [ ] **Step 1: Add a failing submission test**

通过页面选择主分群和排除分群，进入预览并提交草稿；断言 store 中新增任务包含：

```ts
expect(task).toMatchObject({
  audienceType: "segment",
  audienceSegmentId: "SEG-101",
  excludedSegmentIds: ["SEG-105"],
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/tasks/CreateTaskPage.segment-audience.test.tsx --run`

Expected: FAIL，submission 尚未保存分群 ID。

- [ ] **Step 3: Save IDs and restore copied tasks**

在 `submission()` 中加入：

```ts
audienceSegmentId:
  triggerType === "manual" && audienceType === "segment"
    ? selectedAudienceSegmentId
    : undefined,
excludedSegmentIds:
  triggerType === "manual" ? excludedSegmentIds : undefined,
```

初始化状态时读取同名字段；失效主分群保持空选择并触发现有必填校验。

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- src/pages/tasks/CreateTaskPage.segment-audience.test.tsx src/pages/tasks/CreateTaskPage.test.tsx src/pages/tasks/CreateTaskPage.v2.test.tsx --run`

Expected: PASS。

---

### Task 4: 完整验证

**Files:**
- Verify only

- [ ] **Step 1: Run task page tests**

Run: `npm test -- src/pages/tasks --run`

Expected: PASS。

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS，无 TypeScript 或 Vite 构建错误。

- [ ] **Step 3: Inspect scope**

Run: `git diff -- src/domain/types.ts src/pages/tasks/CreateTaskPage.tsx src/pages/tasks/CreateTaskPage.segment-audience.test.tsx`

Expected: 仅包含用户分群受众、排除分群及相关类型和测试。
