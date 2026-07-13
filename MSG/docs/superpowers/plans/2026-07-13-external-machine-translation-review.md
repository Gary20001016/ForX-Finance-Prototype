# External Machine Translation Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the V2 PRD and Arco Design React prototype so multi-language message content moves through an external asynchronous machine-translation task, per-language human review, and an all-languages-approved publishing gate.

**Architecture:** Add typed translation batches and locale items to the existing domain fixtures, then expose that state through the template list, a focused translation-review drawer in the approval center, and the task template selector. The frontend remains a deterministic prototype: external callbacks, polling, retries, and approvals are represented by local fixtures and UI state; the PRD defines the future backend contract.

**Tech Stack:** React 18, TypeScript 5.9, Arco Design React 2.66, React Testing Library, Vitest, Markdown PRD.

## Global Constraints

- The default locale is operator-authored and is not machine translated.
- One template version owns one translation batch; each target locale owns one child item.
- The browser never calls the external translation provider directly.
- External translation is asynchronous, using callback completion and active-query fallback.
- Every selected target locale must pass human review before business review or publishing is enabled.
- Editing approved translated content invalidates that locale's approval.
- This change implements the PRD and frontend prototype only; no real backend or provider integration is included.

---

### Task 1: Translation domain model and fixtures

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/mocks/data.ts`
- Test: `src/mocks/translationData.test.ts`

**Interfaces:**
- Produces: `TranslationItemStatus`, `TranslationItem`, `TranslationBatch`, and `translationBatches` used by template, approval, and task pages.
- `MessageTemplate` gains `sourceLocale`, `translationBatchId`, and `translationReadiness`.

- [ ] **Step 1: Write the failing fixture test**

```tsx
import { describe, expect, it } from 'vitest';
import { templates, translationBatches } from './data';

describe('translation fixtures', () => {
  it('models external jobs and blocks templates with incomplete locale reviews', () => {
    const partial = translationBatches.find((batch) => batch.status === '部分失败');
    expect(partial?.items.some((item) => item.externalTaskId && item.status === '翻译失败')).toBe(true);
    expect(templates.some((template) => template.translationReadiness !== '全部审核通过')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `npm run test:run -- src/mocks/translationData.test.ts`

Expected: FAIL because `translationBatches` and translation properties do not exist.

- [ ] **Step 3: Add typed translation models and representative fixtures**

Add status unions for `未提交`, `排队中`, `翻译中`, `待人工审核`, `审核通过`, `翻译失败`, `审核驳回`, and `已取消`. Add batch fixtures that cover all-approved, in-progress, pending-review, and partial-failure states. Each item includes locale, platform item ID, external task ID, attempt number, source hash, machine content, optional reviewed content, error information, timestamps, and reviewer information.

- [ ] **Step 4: Run the test to verify GREEN**

Run: `npm run test:run -- src/mocks/translationData.test.ts`

Expected: PASS.

### Task 2: PRD external translation lifecycle

**Files:**
- Modify: `PRD-exchange-message-center-admin.md`

**Interfaces:**
- Consumes: exact status and field names introduced in Task 1.
- Produces: authoritative product flow, backend contract, permissions, exceptions, and acceptance criteria.

- [ ] **Step 1: Replace the existing manual-translation assumption**

Change “模板翻译由业务团队或翻译团队提供” to an external asynchronous translation dependency. State that the platform backend creates provider jobs, receives signed idempotent callbacks, and actively queries timed-out jobs.

- [ ] **Step 2: Expand the multi-language template section**

Document the sequence `源文案 → 选择目标语言 → 提交外部机翻 → 回调/查询结果 → 逐语言人工审核 → 全部通过 → 业务审核 → 发布`. Add batch and locale-item fields from the approved design, including `translation_batch_id`, `external_task_id`, `attempt_no`, `source_content_hash`, machine content, reviewed content, errors, reviewer, and timestamps.

- [ ] **Step 3: Add state machine, permission, audit, exception, and acceptance rules**

Explicitly block business review and publishing until all selected locales are approved. Cover per-locale retry, stale callbacks after source changes, missing variables, duplicate callbacks, provider outage, self-review prohibition, and approval invalidation after editing.

- [ ] **Step 4: Check documentation consistency**

Run: `rg -n "翻译由业务团队|机翻|translation_batch_id|external_task_id|全部审核通过|主动查询" PRD-exchange-message-center-admin.md`

Expected: no outdated manual-translation assumption; all new lifecycle terms are present.

### Task 3: Template translation production workspace

**Files:**
- Create: `src/pages/templates/TranslationWorkflowPanel.tsx`
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/styles/global.css`
- Test: `src/pages/templates/TemplateListPage.translation.test.tsx`

**Interfaces:**
- Consumes: `MessageTemplate`, `TranslationBatch`, and `translationBatches`.
- Produces: reusable `TranslationWorkflowPanel({ template, batch })` showing provider workflow and locale states.

- [ ] **Step 1: Write the failing page test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateListPage from './TemplateListPage';

it('shows external translation progress and publishing gate', async () => {
  render(<TemplateListPage />);
  expect(screen.getByText('翻译进度')).toBeVisible();
  await userEvent.click(screen.getAllByText('多语言流程')[0]);
  expect(screen.getByText('外部异步机翻')).toBeVisible();
  expect(screen.getByText(/发布门禁/)).toBeVisible();
  expect(screen.getByText(/MT-/)).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `npm run test:run -- src/pages/templates/TemplateListPage.translation.test.tsx`

Expected: FAIL because translation progress and workflow controls are absent.

- [ ] **Step 3: Implement the template workflow UI**

Add a `翻译进度` table column and rename the row action to `多语言流程`. In a 760px drawer, show the source locale, translation batch ID, provider pattern `回调 + 主动查询兜底`, aggregate progress, a four-step flow, and one row per locale with external task ID, attempt count, status, timestamp, and context-sensitive operation. Failed locales show `重试该语言`; pending-review locales show `进入人工审核`; approved locales show reviewer details. The footer's `提交业务审核` button is disabled unless readiness is `全部审核通过`, with a visible gate explanation.

- [ ] **Step 4: Add focused responsive styles**

Add `.translation-flow`, `.translation-steps`, `.translation-locale-list`, `.translation-locale-row`, `.translation-gate`, and compact breakpoint rules without changing unrelated page styles.

- [ ] **Step 5: Run the test to verify GREEN**

Run: `npm run test:run -- src/pages/templates/TemplateListPage.translation.test.tsx`

Expected: PASS.

### Task 4: Human translation review workspace

**Files:**
- Create: `src/pages/approvals/TranslationReviewDrawer.tsx`
- Modify: `src/pages/approvals/ApprovalCenterPage.tsx`
- Modify: `src/styles/global.css`
- Test: `src/pages/approvals/ApprovalCenter.translation.test.tsx`

**Interfaces:**
- Consumes: pending-review `TranslationItem` fixtures.
- Produces: translation-specific review tab and `TranslationReviewDrawer` with approve/reject prototype actions.

- [ ] **Step 1: Write the failing review test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApprovalCenterPage from './ApprovalCenterPage';

it('reviews machine translation beside the source copy', async () => {
  render(<ApprovalCenterPage />);
  await userEvent.click(screen.getByText(/翻译审核/));
  await userEvent.click(screen.getAllByText('审核翻译')[0]);
  expect(screen.getByText('默认语言源文案')).toBeVisible();
  expect(screen.getByText('机器翻译与人工修订')).toBeVisible();
  expect(screen.getByText(/外部任务 ID/)).toBeVisible();
  expect(screen.getByRole('button', { name: '修订并通过' })).toBeEnabled();
  expect(screen.getByRole('button', { name: '驳回重翻' })).toBeEnabled();
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `npm run test:run -- src/pages/approvals/ApprovalCenter.translation.test.tsx`

Expected: FAIL because the translation-review tab and drawer are absent.

- [ ] **Step 3: Implement translation-review routing inside the page**

Add a `翻译审核 (N)` tab. When selected, render a table of pending locale items with template, target locale, external task ID, completed time, variable-check status, submitter, and `审核翻译`. Preserve existing business-approval tabs and drawer behavior.

- [ ] **Step 4: Implement the comparison drawer**

Show source copy on the left and editable machine content on the right, plus locale, external task ID, attempt number, source hash, variable integrity, numeric/currency checks, and review history. `驳回重翻` requires a reason in the visible form; `修订并通过` displays success feedback and explains that all locales must pass before publishing.

- [ ] **Step 5: Run the test to verify GREEN**

Run: `npm run test:run -- src/pages/approvals/ApprovalCenter.translation.test.tsx`

Expected: PASS.

### Task 5: Message-task template publishing gate

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/TaskSummary.tsx`
- Test: `src/pages/tasks/CreateTaskPage.translation.test.tsx`

**Interfaces:**
- Consumes: templates whose `translationReadiness` is `全部审核通过`.
- Produces: template selector options and task summary that communicate translation readiness.

- [ ] **Step 1: Write the failing task-creation test**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateTaskPage from './CreateTaskPage';

it('only offers translation-approved template versions', () => {
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);
  expect(screen.getByText('仅显示全部目标语言人工审核通过的模板版本')).toBeVisible();
  expect(screen.getByText('翻译审核通过')).toBeVisible();
  expect(screen.queryByText('夏季交易赛 · v4')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `npm run test:run -- src/pages/tasks/CreateTaskPage.translation.test.tsx`

Expected: FAIL because the selector includes an unready template and has no gate copy.

- [ ] **Step 3: Implement the selector and summary gate**

Build selector options from approved fixture data only. Display an info panel with source locale, approved locales, `翻译审核通过`, and an explanation that content changes invalidate approval. Update the final summary approval chain to show `多语言人工审核 · 已通过` before business review.

- [ ] **Step 4: Run the test to verify GREEN**

Run: `npm run test:run -- src/pages/tasks/CreateTaskPage.translation.test.tsx`

Expected: PASS.

### Task 6: Full verification and commit

**Files:**
- Verify all files changed in Tasks 1-5.

**Interfaces:**
- Consumes: all implementation outputs.
- Produces: a verified, reviewable frontend and PRD change set.

- [ ] **Step 1: Run focused translation tests**

Run: `npm run test:run -- src/mocks/translationData.test.ts src/pages/templates/TemplateListPage.translation.test.tsx src/pages/approvals/ApprovalCenter.translation.test.tsx src/pages/tasks/CreateTaskPage.translation.test.tsx`

Expected: 4 files PASS.

- [ ] **Step 2: Run the complete suite**

Run: `npm run test:run`

Expected: all existing and new tests PASS with no unhandled errors.

- [ ] **Step 3: Build production assets**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 4: Check diff hygiene and PRD terminology**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `rg -n "翻译由业务团队|翻译团队提供" PRD-exchange-message-center-admin.md`

Expected: no outdated manual-translation assumption.

- [ ] **Step 5: Commit the verified change set**

```bash
git add PRD-exchange-message-center-admin.md docs/superpowers/specs/2026-07-13-external-machine-translation-review-design.md docs/superpowers/plans/2026-07-13-external-machine-translation-review.md src/domain/types.ts src/mocks/data.ts src/mocks/translationData.test.ts src/pages/templates src/pages/approvals src/pages/tasks src/styles/global.css
git commit -m "feat: add external translation review workflow"
```
