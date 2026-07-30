# Content Review Before Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every newly authored message pass content review before any machine-translation or language-review work, then automatically publish templates or advance temporary tasks when all required languages pass.

**Architecture:** Add a small domain workflow layer that separates the externally visible status from the internal workflow stage. Store actions submit immutable content snapshots to the existing approval center, start localization only from an approved snapshot, and finalize the owning template/task when the localization gate completes. Existing published-template task review and event-rule review stay independent.

**Tech Stack:** React 18, TypeScript 5.9, Arco Design React, Zustand-like prototype store, Vitest, Testing Library.

## Global Constraints

- Applies to artificial message templates, event message templates, and temporary task content.
- All newly authored content must pass content review before translation or language review begins.
- Main template statuses remain exactly `草稿 / 审核中 / 驳回 / 已发布`.
- No second content review occurs after localization.
- Published templates remain immutable.
- Editing source content invalidates content approval and every localization result.
- Temporary tasks automatically enter `待发送` or `发送中` after language completion.
- Tasks using an already published template keep their existing task-configuration approval flow.
- Event notification rules keep their existing independent approval flow.

---

### Task 1: Domain workflow model and deterministic transitions

**Files:**
- Create: `src/domain/contentApprovalWorkflow.ts`
- Create: `src/domain/contentApprovalWorkflow.test.ts`
- Modify: `src/domain/types.ts`

**Interfaces:**
- Produces: `ContentApprovalStatus`, `ContentWorkflowStage`, `contentWorkflowStageLabel()`, `templateMainStatusForStage()`, `shouldStartLocalization()`, `contentApprovalHash()`.
- Consumes: `LocalizedMessageContent`, `Channel`, `RiskLevel`, `MessageCategoryCode`, `MessageTopicCode`.

- [ ] **Step 1: Write the failing workflow tests**

```ts
import {
  contentApprovalHash,
  templateMainStatusForStage,
  shouldStartLocalization,
} from "./contentApprovalWorkflow";

it("keeps detailed workflow stages behind four template statuses", () => {
  expect(templateMainStatusForStage("content_review")).toBe("审核中");
  expect(templateMainStatusForStage("localization_review")).toBe("审核中");
  expect(templateMainStatusForStage("rejected")).toBe("驳回");
  expect(templateMainStatusForStage("published")).toBe("已发布");
});

it("starts localization only after content approval", () => {
  expect(shouldStartLocalization("待审核")).toBe(false);
  expect(shouldStartLocalization("已通过")).toBe(true);
});

it("changes the source snapshot hash when governed content changes", () => {
  const base = {
    sourceLocale: "zh-CN",
    locales: ["zh-CN", "ja-JP"],
    channels: ["站内信"] as const,
    category: "asset" as const,
    topic: "withdrawal" as const,
    risk: "中" as const,
    content: { sourceLocale: "zh-CN", locales: ["zh-CN"], web: { title: "A", summary: "", body: "B", actionText: "", targetUrl: "" }, push: { title: "", body: "", deepLink: "", platform: "全部设备", priority: "高" } },
    variables: ["amount"],
  };
  expect(contentApprovalHash(base)).not.toBe(
    contentApprovalHash({ ...base, content: { ...base.content, web: { ...base.content.web, body: "C" } } }),
  );
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm test -- --run src/domain/contentApprovalWorkflow.test.ts`

Expected: FAIL because the workflow module and new types do not exist.

- [ ] **Step 3: Add the workflow types to domain objects**

```ts
export type ContentApprovalStatus =
  | "未提交"
  | "待审核"
  | "已通过"
  | "已驳回"
  | "已撤回";

export type ContentWorkflowStage =
  | "draft"
  | "content_review"
  | "rejected"
  | "translation_creating"
  | "localization_review"
  | "ready"
  | "published"
  | "sending_ready";

export interface ContentApprovalState {
  contentApprovalStatus?: ContentApprovalStatus;
  contentApprovalId?: string;
  contentApprovedAt?: string;
  contentApprovedBy?: string;
  contentApprovedHash?: string;
  workflowStage?: ContentWorkflowStage;
}
```

Extend `MessageTemplate` and `MessageTask` from `ContentApprovalState`.

- [ ] **Step 4: Implement pure workflow helpers**

```ts
export const templateMainStatusForStage = (
  stage: ContentWorkflowStage,
): ManualTemplateStatus =>
  stage === "published"
    ? "已发布"
    : stage === "rejected"
      ? "驳回"
      : stage === "draft"
        ? "草稿"
        : "审核中";

export const shouldStartLocalization = (
  status: ContentApprovalStatus,
) => status === "已通过";

export const contentWorkflowStageLabel = (
  stage?: ContentWorkflowStage,
) => ({
  draft: "编辑内容",
  content_review: "内容待审核",
  rejected: "内容已驳回",
  translation_creating: "创建翻译任务",
  localization_review: "语言审核中",
  ready: "发布就绪",
  published: "已发布",
  sending_ready: "发送就绪",
}[stage || "draft"]);
```

Implement `contentApprovalHash()` with stable `JSON.stringify()` input ordering and include source locale, locales, channels, category, topic, risk, content, and sorted variables.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- --run src/domain/contentApprovalWorkflow.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the domain workflow**

```bash
git add src/domain/types.ts src/domain/contentApprovalWorkflow.ts src/domain/contentApprovalWorkflow.test.ts
git commit -m "feat: model content-first localization workflow"
```

---

### Task 2: Template submission, approval, localization, and automatic publishing

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Modify: `src/pages/templates/TranslationWorkflowPanel.tsx`
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Create: `src/store/templateContentFirstWorkflow.test.ts`
- Modify: `src/pages/templates/TemplateEditorDrawer.single-language.test.tsx`
- Modify: `src/pages/templates/TemplateListPage.translation.test.tsx`

**Interfaces:**
- Consumes: Task 1 workflow types and helpers.
- Produces: `submitTemplateContentForApproval(templateId)`, `startTemplateLocalization(templateId)`, `finalizeLocalizedTemplate(templateId)`.

- [ ] **Step 1: Write failing store tests for template order**

```ts
it("creates content approval before a translation batch", () => {
  const template = saveTemplate(multilingualTemplateInput());
  const approval = submitTemplateContentForApproval(template.id);
  const state = getPrototypeState();
  expect(approval.objectType).toBe("人工消息模板");
  expect(state.templates.find((item) => item.id === template.id)?.workflowStage)
    .toBe("content_review");
  expect(state.translationBatches.some((item) => item.templateId === template.id))
    .toBe(false);
});

it("starts localization only after content approval", () => {
  const template = saveTemplate(multilingualTemplateInput());
  const approval = submitTemplateContentForApproval(template.id);
  resolveApproval(approval.id, assignedApprovalResult(approval, "approve"));
  const current = getPrototypeState().templates.find((item) => item.id === template.id)!;
  expect(current.contentApprovalStatus).toBe("已通过");
  expect(current.workflowStage).toBe("localization_review");
  expect(current.translationBatchId).not.toBe("");
});

it("publishes automatically when every target language passes", () => {
  // Approve content, then approve each generated TranslationItem.
  expect(getPrototypeState().templates.find((item) => item.id === template.id)?.status)
    .toBe("已发布");
});
```

- [ ] **Step 2: Run focused tests and confirm current order fails**

Run: `npm test -- --run src/store/templateContentFirstWorkflow.test.ts`

Expected: FAIL because the editor/store currently creates translation before business approval.

- [ ] **Step 3: Initialize and invalidate template approval state**

In `saveTemplate()` initialize:

```ts
contentApprovalStatus: "未提交",
workflowStage: "draft",
contentApprovedHash: "",
```

In `updateTemplate()` clear:

```ts
contentApprovalStatus: "未提交",
contentApprovalId: undefined,
contentApprovedAt: undefined,
contentApprovedBy: undefined,
contentApprovedHash: "",
workflowStage: "draft",
translationBatchId: "",
translationReadiness: "无结果",
status: "草稿",
```

Mark pending approval records for the edited template as `已撤回`.

- [ ] **Step 4: Replace translation-first template submission**

Implement `submitTemplateContentForApproval()` by reusing the existing approval assignment rules and frozen `ApprovalItem` content. Remove the `translationReadiness === "已通过"` precondition. Store the generated approval ID and source hash on the template.

```ts
if (template.contentApprovalStatus === "待审核" && template.contentApprovalId) {
  return existingApproval;
}
```

- [ ] **Step 5: Start localization from approved content**

Add an internal `advanceApprovedTemplate()` helper:

```ts
const needsMachineTranslation =
  template.locales.some((locale) => locale !== template.sourceLocale);
const needsDirectSourceReview =
  !needsMachineTranslation && requiresSpecialLanguageReview(template.sourceLocale);

if (needsMachineTranslation) return startTemplateLocalization(template.id);
if (needsDirectSourceReview) return startTemplateSourceReview(template.id);
return finalizeLocalizedTemplate(template.id);
```

Verify the current hash matches `contentApprovedHash` before creating/reusing a batch.

- [ ] **Step 6: Change approval resolution**

When a template content approval is approved:

```ts
contentApprovalStatus: "已通过",
contentApprovedAt: "刚刚",
contentApprovedBy: reviewer.name,
workflowStage: "translation_creating",
status: "审核中",
```

Then call `advanceApprovedTemplate()` after the atomic approval update. On rejection:

```ts
contentApprovalStatus: "已驳回",
workflowStage: "rejected",
status: "驳回",
```

Do not publish a template directly from content approval when localization is required.

- [ ] **Step 7: Finalize templates from language approval**

When `recomputeBatch()` makes a template batch `已通过`, set:

```ts
translationReadiness: "已通过",
workflowStage: "published",
status: "已发布",
updatedAt: "刚刚",
```

Remove the old intermediate `待业务审核` transition and the second `submitTemplateForApproval()` gate.

- [ ] **Step 8: Update template editor interaction**

Change the primary action label to `保存并提交内容审核`. The submit action must:

```ts
const entity = template ? updateTemplate(template.id, payload) : saveTemplate(payload);
const approval = submitTemplateContentForApproval(entity.id);
Message.success(`内容已提交审核 ${approval.id}`);
```

It must not call `createTranslationBatch()` or `prepareSingleLanguageContent()` directly.

- [ ] **Step 9: Update template list and progress UI**

Add a `当前节点` column using `contentWorkflowStageLabel()`. Before content approval, `TranslationWorkflowPanel` shows:

```tsx
<Alert
  type="info"
  title="等待内容审核"
  content="默认语言内容审核通过后，系统将自动创建机器翻译或原文审核任务。"
/>
```

Remove `提交业务审核` buttons from the language workflow. When ready, show automatic-publish confirmation.

- [ ] **Step 10: Run template tests**

Run:

```bash
npm test -- --run \
  src/store/templateContentFirstWorkflow.test.ts \
  src/pages/templates/TemplateEditorDrawer.single-language.test.tsx \
  src/pages/templates/TemplateListPage.translation.test.tsx
```

Expected: PASS.

- [ ] **Step 11: Commit template workflow**

```bash
git add src/store/prototypeStore.ts src/pages/templates src/store/templateContentFirstWorkflow.test.ts
git commit -m "feat: review template content before localization"
```

---

### Task 3: Temporary task content review before localization

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/TaskListPage.tsx`
- Modify: `src/pages/tasks/TaskSummary.tsx`
- Create: `src/store/temporaryTaskContentFirstWorkflow.test.ts`
- Modify: `src/pages/tasks/CreateTaskPage.completion.test.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.translation.test.tsx`

**Interfaces:**
- Consumes: Task 1 workflow types; Task 2 approval-resolution hook.
- Produces: `submitTemporaryTaskForContentApproval()`, `startTemporaryTaskLocalization()`, `finalizeLocalizedTemporaryTask()`.

- [ ] **Step 1: Write failing temporary-task tests**

```ts
it("submits temporary content without a pre-existing translation batch", () => {
  const task = submitTask(temporaryMultilingualSubmission());
  expect(task.status).toBe("待审核");
  expect(task.translationBatchId).toBeUndefined();
  expect(task.workflowStage).toBe("content_review");
});

it("creates localization after task content approval", () => {
  const task = submitTask(temporaryMultilingualSubmission());
  const approval = getApprovalForTask(task.id);
  resolveApproval(approval.id, assignedApprovalResult(approval, "approve"));
  const current = getTask(task.id);
  expect(current.workflowStage).toBe("localization_review");
  expect(current.translationBatchId).toMatch(/^(MT|LR)-/);
  expect(current.status).toBe("待审核");
});

it("advances automatically after every language passes", () => {
  // Immediate task -> 发送中; scheduled task -> 待发送.
});
```

- [ ] **Step 2: Run focused test and confirm failure**

Run: `npm test -- --run src/store/temporaryTaskContentFirstWorkflow.test.ts`

Expected: FAIL because `CreateTaskPage` and store currently require localization before `submitTask()`.

- [ ] **Step 3: Save target-language intent on the task snapshot**

Extend task submission data with source locale and target locales through its existing `content.locales`. Set:

```ts
contentApprovalStatus: "待审核",
workflowStage: "content_review",
translationBatchId: undefined,
```

Only do this for `contentMode === "temporary"`. Template-backed tasks retain the existing configuration-review behavior.

- [ ] **Step 4: Remove the pre-approval translation gate**

In `CreateTaskPage`, remove:

```ts
if (!translationReady) {
  Message.warning("仍有目标语言未完成人工审核，不能提交业务审核");
  return;
}
```

For temporary content, change the language action from creating a batch to saving the source/target-language draft. Primary submit creates the task approval directly.

- [ ] **Step 5: Advance temporary tasks after approval**

On approved task content:

```ts
if (task.contentMode !== "temporary") return finalizeApprovedTask(task);
if (taskNeedsLocalization(task)) return startTemporaryTaskLocalization(task.id);
return finalizeApprovedTask(task);
```

Keep the task in `待审核` while localization is unfinished, but display `多语言生产` or `语言审核` as the current node.

- [ ] **Step 6: Finalize task from translation completion**

When its batch reaches `已通过`:

```ts
status: task.schedule === "立即" ? "发送中" : "待发送",
approvalStatus: "通过",
approval: "已通过",
workflowStage: "sending_ready",
deliveryResult: task.schedule === "立即" ? "处理中" : "未开始",
```

If `expiresAt` is demonstrably in the past, set `status: "已过期"` and do not start sending.

- [ ] **Step 7: Update task UI**

- Step 1 continues to collect target languages.
- Before content approval, show `等待内容审核`.
- After approval, show live localization results.
- The final submit button reads `提交内容与任务审核`.
- Task list/detail shows `当前节点` separately from task status.
- Remove copy that says language review must finish before task approval.

- [ ] **Step 8: Run task tests**

Run:

```bash
npm test -- --run \
  src/store/temporaryTaskContentFirstWorkflow.test.ts \
  src/pages/tasks/CreateTaskPage.completion.test.tsx \
  src/pages/tasks/CreateTaskPage.translation.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit temporary-task workflow**

```bash
git add src/store/prototypeStore.ts src/pages/tasks src/store/temporaryTaskContentFirstWorkflow.test.ts
git commit -m "feat: review temporary content before localization"
```

---

### Task 4: Approval-center copy, lifecycle visibility, and normalized mock data

**Files:**
- Modify: `src/pages/approvals/ApprovalCenterPage.tsx`
- Modify: `src/pages/approvals/ApprovalDrawer.tsx`
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/mocks/data.ts`
- Create: `src/store/contentFirstMockState.test.ts`
- Modify: `src/pages/approvals/ApprovalCenter.completion.test.tsx`

**Interfaces:**
- Consumes: workflow fields and store actions from Tasks 1–3.
- Produces: normalized persisted/demo state with no translation-first combinations.

- [ ] **Step 1: Write failing state-normalization tests**

```ts
it("contains no template whose localization passed before content approval", () => {
  const invalid = getPrototypeState().templates.filter(
    (item) =>
      item.translationReadiness === "已通过" &&
      item.contentApprovalStatus !== "已通过",
  );
  expect(invalid).toEqual([]);
});

it("contains representative objects at each content-first stage", () => {
  const stages = new Set(getPrototypeState().templates.map((item) => item.workflowStage));
  expect(stages).toEqual(expect.objectContaining(
    new Set(["content_review", "rejected", "localization_review", "published"]),
  ));
});
```

- [ ] **Step 2: Run the test and confirm old mock states fail**

Run: `npm test -- --run src/store/contentFirstMockState.test.ts`

Expected: FAIL until seeded and persisted state are normalized.

- [ ] **Step 3: Normalize legacy state**

During store hydration:

- Published templates become `contentApprovalStatus: "已通过"` and `workflowStage: "published"`.
- Existing translation-reviewed unpublished templates become `contentApprovalStatus: "已通过"` and finalize to published.
- Old `待业务审核` templates become content-reviewed only if an approved content approval exists; otherwise return to `content_review`.
- Draft templates with translation batches have those stale batches detached and return to `draft`.
- Temporary tasks with localization in progress receive `contentApprovalStatus: "已通过"`.

- [ ] **Step 4: Seed representative valid examples**

Add named examples for:

```text
人工模板 · 内容待审核
人工模板 · 内容已驳回
事件模板 · 日语待审核
事件模板 · 已发布
临时消息 · 内容待审核
临时消息 · 多语言审核中
临时消息 · 待发送
```

- [ ] **Step 5: Update approval-center semantics**

Use labels `内容审核` and `内容与任务配置审核`. Approval detail explains:

```text
审核通过后，系统自动创建多语言任务；全部语言通过后不再进行第二次内容审核。
```

Do not show language results as a prerequisite for the current content approval.

- [ ] **Step 6: Run approval and mock-state tests**

Run:

```bash
npm test -- --run \
  src/store/contentFirstMockState.test.ts \
  src/pages/approvals/ApprovalCenter.completion.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit normalized UI and data**

```bash
git add src/pages/approvals src/store/prototypeStore.ts src/mocks/data.ts src/store/contentFirstMockState.test.ts
git commit -m "feat: align approvals and demo data with content-first flow"
```

---

### Task 5: Regression verification and browser-ready handoff

**Files:**
- Modify only files required to fix regressions discovered by the commands below.

**Interfaces:**
- Consumes: all earlier tasks.
- Produces: buildable, runnable frontend with consistent workflow state.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test -- --run`

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript succeeds and Vite emits `dist/`.

- [ ] **Step 3: Inspect workflow invariants**

Run:

```bash
rg -n "多语言人工审核尚未全部通过|仍有目标语言未完成人工审核，不能提交业务审核|提交外部机翻|提交业务审核" src
```

Expected: no active UI/store gate preserves the old translation-first order. Test fixture text may remain only when explicitly asserting its absence.

- [ ] **Step 4: Verify representative routes**

Start: `npm run dev -- --host 127.0.0.1`

Check:

```text
/templates?scope=manual
/templates?scope=event
/tasks/create
/tasks
/approvals
```

Expected: each route renders, the primary actions follow the content-first order, and current-node labels match the underlying mock state.

- [ ] **Step 5: Commit regression fixes**

```bash
git add src
git commit -m "fix: complete content-first localization interactions"
```
