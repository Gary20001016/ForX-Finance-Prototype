# Multilingual Review and Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared multilingual production flow for templates, temporary tasks, and event-rule content versions, with configurable special-language review, a standalone review page, and explainable progress in all source lists.

**Architecture:** Generalize translation batches from template-only ownership to a `subjectType + subjectId + contentVersion` subject. Centralize progress derivation in pure utilities, reuse the existing translation comparison UI, and expose source-specific adapters rather than duplicating translation state. Ordinary locales remain editable in source pages; configured special-review locales route to a dedicated review queue.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, Arco Design React, local prototype store.

**Execution note:** This plan is executed in the existing `codex/event-automation` feature branch because the active browser preview and prior translation-progress changes are already attached to this workspace.

## Global Constraints

- Do not add a generic multilingual management page; add a review page only for locales configured for special review.
- The three sources are `template_version`, `manual_task_content`, and `rule_content_version`.
- The list cell must show completion ratio, current stage, and unfinished locales.
- Ordinary locales may be confirmed in the source page; special-review locales are read-only there and can only be approved in the review page.
- Machine output, human draft, and approved output remain distinct.
- Existing user inbox, audience, delivery, and analytics behavior must not regress.
- Use existing Arco components and ForX Finance visual tokens; add no dependency.

---

### Task 1: Translation domain and progress aggregation

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/pages/multilingual/multilingualProgress.ts`
- Test: `src/pages/multilingual/multilingualProgress.test.ts`

**Interfaces:**
- Produces: `TranslationSubjectType`, `LanguageReviewPolicy`, expanded `TranslationItemStatus`, expanded `TranslationBatch`, `deriveMultilingualProgress(batch)`, `unfinishedLocales(batch)`.
- Consumes: Existing `TranslationBatch`, `TranslationItem`, and locale strings.

- [ ] **Step 1: Write failing aggregation tests**

Cover completed ratio, special-review stage, failure priority, unfinished locale labels, and canceled-locale exclusion.

```ts
expect(deriveMultilingualProgress(batch)).toMatchObject({
  approved: 2,
  total: 5,
  percent: 40,
  stage: "小语种专审",
  blockingStatus: "待小语种专审",
});
expect(unfinishedLocales(batch)).toEqual([
  { locale: "ru-RU", status: "翻译失败" },
  { locale: "ja-JP", status: "待小语种专审" },
  { locale: "tr-TR", status: "专审中" },
]);
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run src/pages/multilingual/multilingualProgress.test.ts`

Expected: FAIL because the module and expanded statuses do not exist.

- [ ] **Step 3: Add exact domain fields**

Add subject ownership, language policy, special-review routing, three output layers, changed fields, review group, return path, and content version.

```ts
export type TranslationSubjectType =
  | "template_version"
  | "manual_task_content"
  | "rule_content_version";

export interface LanguageReviewPolicy {
  localeCode: string;
  localeName: string;
  specialReviewRequired: boolean;
  reviewGroup?: string;
  reviewerCount: 1 | 2;
  allowSubmitterReview: boolean;
  reviewSlaHours?: number;
  timeoutAction: "提醒" | "升级" | "阻断发布";
  enabled: boolean;
}
```

- [ ] **Step 4: Implement pure progress aggregation**

Use priority: `翻译失败 > 源文案已变更 > 审核驳回 > 待小语种专审 > 专审中 > 待普通确认 > 修改中 > 翻译中 > 排队中 > 已通过`.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npm test -- --run src/pages/multilingual/multilingualProgress.test.ts`

Expected: all progress tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/pages/multilingual/multilingualProgress.ts src/pages/multilingual/multilingualProgress.test.ts
git commit -m "feat: add multilingual progress domain"
```

### Task 2: Generalized translation store and language policies

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`
- Modify: `src/mocks/data.ts`

**Interfaces:**
- Produces: `createTranslationBatch({ subject, sourceContent, targetLocales, createdBy })`, `saveTranslationDraft`, `approveOrdinaryTranslation`, `startSpecialReview`, `approveSpecialReview`, `rejectTranslation`, `retryTranslation`, `updateLanguageReviewPolicy`.
- Consumes: Task 1 domain types.

- [ ] **Step 1: Add failing store tests**

Test one batch for each subject type, policy-based status routing, ordinary confirmation, special review permission, and all-language gate recomputation.

```ts
expect(batch.items.find((item) => item.targetLocale === "en-US")?.status)
  .toBe("待普通确认");
expect(batch.items.find((item) => item.targetLocale === "ja-JP")?.status)
  .toBe("待小语种专审");
expect(() => approveOrdinaryTranslation(japaneseItem.id, values))
  .toThrow("该语言必须进入小语种专审");
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run src/store/prototypeStore.test.ts`

Expected: FAIL on missing generalized APIs and policy routing.

- [ ] **Step 3: Seed language policies**

Seed ordinary locales `en-US`, `zh-TW`, `fr-FR`, `es-ES`; seed `ja-JP`, `ko-KR`, `tr-TR`, `ru-RU` as special-review locales with named groups and SLAs.

- [ ] **Step 4: Generalize batch creation**

Retain the old template call signature as a compatibility wrapper while migrating callers. Store subject identity, source content snapshot, return path, and policy snapshot on the batch/items.

- [ ] **Step 5: Implement draft, ordinary, and special-review actions**

Keep `machineOutput`, `humanDraft`, and `approvedOutput` separate. Enforce special-review group and submitter separation in store operations.

- [ ] **Step 6: Run store tests and related translation tests**

Run: `npm test -- --run src/store/prototypeStore.test.ts src/mocks/translationData.test.ts`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/store/prototypeStore.ts src/store/prototypeStore.test.ts src/mocks/data.ts
git commit -m "feat: generalize multilingual translation state"
```

### Task 3: Shared workspace and list progress UI

**Files:**
- Create: `src/pages/multilingual/MultilingualProgressCell.tsx`
- Create: `src/pages/multilingual/MultilingualProgressDrawer.tsx`
- Create: `src/pages/multilingual/MultilingualProgress.test.tsx`
- Modify: `src/pages/templates/TranslationWorkflowPanel.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.completion.test.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: `<MultilingualProgressCell batch onOpen />`, `<MultilingualProgressDrawer batch visible onClose />`, policy-aware `TranslationWorkflowPanel`.
- Consumes: Task 1 aggregation and Task 2 store actions.

- [ ] **Step 1: Write failing component tests**

Assert `3/6 已通过`, current stage, unfinished `日语 · 待专审`, `俄语 · 翻译失败`, and `其余 N 种`. Assert special-review language has `前往专审` and no ordinary approval control.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run src/pages/multilingual/MultilingualProgress.test.tsx src/pages/tasks/CreateTaskPage.completion.test.tsx`

Expected: FAIL because shared progress components do not exist and the workspace is not policy-aware.

- [ ] **Step 3: Implement compact cell and read-only drawer**

Render progress ratio, stage path, up to three unfinished locales, and full language rows in the drawer. Keep editing out of the drawer.

- [ ] **Step 4: Make the workspace policy-aware**

Ordinary locales expose save/confirm/retranslate. Special-review locales expose status, assigned group, SLA, and navigation to `/multilingual-review?item=<id>`.

- [ ] **Step 5: Preserve temporary-message progress regression fix**

Keep the current temporary message batch panel and migrate it from hidden-template identity to `manual_task_content` subject identity.

- [ ] **Step 6: Run component tests and verify GREEN**

Run: `npm test -- --run src/pages/multilingual/MultilingualProgress.test.tsx src/pages/tasks/CreateTaskPage.completion.test.tsx src/pages/templates/TemplateListPage.translation.test.tsx`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/multilingual src/pages/templates/TranslationWorkflowPanel.tsx src/pages/tasks/CreateTaskPage.tsx src/pages/tasks/CreateTaskPage.completion.test.tsx src/styles/global.css
git commit -m "feat: add shared multilingual workspace progress"
```

### Task 4: Standalone special-language review and policy settings

**Files:**
- Create: `src/pages/multilingual/MultilingualReviewPage.tsx`
- Create: `src/pages/multilingual/MultilingualReviewPage.test.tsx`
- Create: `src/pages/settings/LanguageReviewPolicyPanel.tsx`
- Create: `src/pages/settings/LanguageReviewPolicyPanel.test.tsx`
- Modify: `src/pages/settings/SettingsPage.tsx`
- Modify: `src/pages/approvals/ApprovalCenterPage.tsx`
- Modify: `src/pages/approvals/ApprovalCenter.translation.test.tsx`
- Modify: `src/app/routes.tsx`
- Modify: `src/app/navigation.tsx`
- Modify: `src/app/navigation.test.tsx`
- Modify: `src/layout/AdminLayout.test.tsx`

**Interfaces:**
- Produces: `/multilingual-review` route and `语言审核策略` settings tab.
- Consumes: Task 2 store and Task 3 workspace/detail UI.

- [ ] **Step 1: Write failing navigation, review queue, and policy tests**

Assert a `多语言审核` nav item, only special-review items in the queue, source type/name, review group/SLA, and editable policy fields.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run src/pages/multilingual/MultilingualReviewPage.test.tsx src/pages/settings/LanguageReviewPolicyPanel.test.tsx src/app/navigation.test.tsx`

Expected: FAIL because route, page, and config tab do not exist.

- [ ] **Step 3: Implement review queue and review drawer reuse**

Move translation review out of `ApprovalCenterPage`. The new page supports filters for source, locale, group, status, and SLA; it opens the existing comparison editor with special-review actions.

- [ ] **Step 4: Implement language policy settings**

Allow toggling special review, group, reviewer count, self-review, SLA, timeout action, and status. Update store state immediately in the prototype.

- [ ] **Step 5: Add route and navigation**

Add `/multilingual-review` after `消息模板` and before `事件目录`. Keep `审核中心` for business/risk approvals only.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `npm test -- --run src/pages/multilingual/MultilingualReviewPage.test.tsx src/pages/settings/LanguageReviewPolicyPanel.test.tsx src/pages/approvals/ApprovalCenter.translation.test.tsx src/app/navigation.test.tsx src/layout/AdminLayout.test.tsx`

Expected: all tests PASS with approval-center expectations updated to business approval only.

- [ ] **Step 7: Commit**

```bash
git add src/pages/multilingual src/pages/settings src/pages/approvals src/app src/layout
git commit -m "feat: add special-language review center"
```

### Task 5: Integrate multilingual flow into all source lists

**Files:**
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/pages/templates/TemplateListPage.translation.test.tsx`
- Modify: `src/pages/tasks/TaskListPage.tsx`
- Modify: `src/pages/tasks/TaskListPage.test.tsx`
- Modify: `src/pages/automation/AutomationRuleListPage.tsx`
- Modify: `src/pages/automation/AutomationRuleListPage.test.tsx`
- Modify: `src/store/prototypeStore.ts`

**Interfaces:**
- Consumes: Tasks 1–4 components and generalized batch lookup.
- Produces: Explainable progress in templates, artificial tasks, and rule content versions.

- [ ] **Step 1: Write failing list tests**

Each list must show ratio, stage, and unfinished locale. Task list must keep send progress separate. Rule-version action must no longer use one-click `机翻完成` as a batch-wide shortcut.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run src/pages/templates/TemplateListPage.translation.test.tsx src/pages/tasks/TaskListPage.test.tsx src/pages/automation/AutomationRuleListPage.test.tsx`

Expected: FAIL on missing multilingual flow cells and old event-version shortcut.

- [ ] **Step 3: Integrate template list**

Replace batch ID-only progress with `MultilingualProgressCell`; retain the full workflow drawer.

- [ ] **Step 4: Integrate artificial task list**

Add `多语言流程` separately from task status, approval status, delivery result, and send progress. Use `translationBatchId` to resolve the batch.

- [ ] **Step 5: Integrate event-rule content versions**

Create a real `rule_content_version` batch when machine translation starts. Display progress on each content-version row and drive its version status from batch gate state.

- [ ] **Step 6: Run integration tests and verify GREEN**

Run: `npm test -- --run src/pages/templates/TemplateListPage.translation.test.tsx src/pages/tasks/TaskListPage.test.tsx src/pages/automation/AutomationRuleListPage.test.tsx src/store/prototypeStore.test.ts`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/templates src/pages/tasks src/pages/automation src/store/prototypeStore.ts
git commit -m "feat: show multilingual flow across source lists"
```

### Task 6: PRD synchronization and final verification

**Files:**
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/prd/message-center/03-消息模板与多语言.md`
- Modify: `docs/prd/message-center/04-系统事件.md`
- Modify: `docs/prd/message-center/06-审核与发布.md`
- Modify: `docs/prd/message-center/09-系统配置与审计.md`
- Modify: `docs/prd/message-center/README.md`

**Interfaces:**
- Documents: Final navigation, language policy, ordinary/special split, list progress, and gate rules.

- [ ] **Step 1: Update module PRDs**

Document the exact process:

```text
源文案完成 → 生成机器翻译 → 普通语言确认 → 小语种专项审核 → 全部语言通过
```

Include list fields, status definitions, policy fields, and source-change rules.

- [ ] **Step 2: Run documentation consistency scans**

Run: `rg -n "审核中心.*翻译审核|所有语言.*人工审核|不新增独立多语言" docs/prd docs/superpowers/specs`

Expected: no obsolete claims remain outside historical documents.

- [ ] **Step 3: Run full tests**

Run: `npm test -- --run`

Expected: all test files PASS.

- [ ] **Step 4: Run production build and diff checks**

Run: `npm run build && git diff --check`

Expected: build exits 0 and diff check is clean.

- [ ] **Step 5: Browser verification**

Verify `/templates`, `/tasks`, `/automation`, `/multilingual-review`, and `/settings`: progress cells display missing languages, special-review routing works, policy edits update routing, and browser console has no errors.

- [ ] **Step 6: Commit documentation and final fixes**

```bash
git add docs/prd docs/superpowers/specs src
git commit -m "docs: align multilingual review workflow"
```
