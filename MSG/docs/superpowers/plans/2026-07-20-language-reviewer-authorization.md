# Per-Language Reviewer Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace reviewer counts and self-review switches with direct reviewer authorization for every language, while allowing authorized users to review their own submissions.

**Architecture:** Store authorized operator IDs on each `LanguageReviewPolicy` and snapshot them onto new `TranslationItem` records. A focused reviewer directory resolves IDs to display names, while shared authorization helpers protect both inline review and the centralized multilingual review page.

**Tech Stack:** React 18, TypeScript, Arco Design React, external-store prototype state.

## Global Constraints

- Every enabled language policy must contain at least one authorized reviewer.
- Authorized reviewers may review their own submitted content.
- Remove reviewer group, reviewer count, and submitter self-review configuration.
- Ordinary inline review and special-language centralized review use the same authorization rule.
- Do not add role groups, quorum approval, backend APIs, or unrelated refactors.
- Per user request, do not run automated tests or build verification for this change.

---

### Task 1: Reviewer Directory and Authorization Data

**Files:**
- Create: `src/domain/reviewOperators.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/store/prototypeStore.ts`

**Interfaces:**
- Produces: `ReviewOperator`, `reviewOperators`, `CURRENT_REVIEW_OPERATOR_ID`, `reviewOperatorName(operatorId)`.
- Produces: `LanguageReviewPolicy.authorizedReviewerIds: string[]` and `TranslationItem.authorizedReviewerIds?: string[]`.
- Produces: `canReviewTranslation(item, operatorId): boolean` and `getTranslationReviewerIds(item): string[]`.

- [ ] **Step 1: Add the controlled reviewer directory**

Create a small immutable directory containing stable IDs, display names, teams, and enabled status. Use `admin-01` for the current prototype operator and provide language specialists for Japanese, Korean, Turkish, Russian, and European languages.

```ts
export interface ReviewOperator {
  id: string;
  name: string;
  team: string;
  enabled: boolean;
}

export const CURRENT_REVIEW_OPERATOR_ID = "admin-01";

export const reviewOperators: ReviewOperator[] = [
  { id: "admin-01", name: "Gary Ma", team: "超级管理员", enabled: true },
  { id: "reviewer-en-01", name: "Emily Chen", team: "英语审核", enabled: true },
  { id: "reviewer-ja-01", name: "松本遥", team: "日语审核", enabled: true },
  { id: "reviewer-ko-01", name: "김민준", team: "韩语审核", enabled: true },
  { id: "reviewer-tr-01", name: "Deniz Kaya", team: "土耳其语审核", enabled: true },
  { id: "reviewer-ru-01", name: "Анна Волкова", team: "俄语审核", enabled: true },
];
```

- [ ] **Step 2: Replace legacy policy fields**

Remove `reviewGroup`, `reviewerCount`, and `allowSubmitterReview` from `LanguageReviewPolicy`; add `authorizedReviewerIds`. Add the optional snapshot field to `TranslationItem`.

```ts
export interface LanguageReviewPolicy {
  localeCode: string;
  localeName: string;
  specialReviewRequired: boolean;
  authorizedReviewerIds: string[];
  reviewSlaHours?: number;
  timeoutAction: "提醒" | "升级" | "阻断发布";
  enabled: boolean;
}
```

- [ ] **Step 3: Migrate policy seeds and translation snapshots**

Seed every language with `admin-01` plus relevant specialists. Copy `authorizedReviewerIds` into new direct-source and machine-translation items. During normalization, preserve an existing snapshot or fall back to the language policy.

```ts
authorizedReviewerIds:
  item.authorizedReviewerIds?.length
    ? item.authorizedReviewerIds
    : policy?.authorizedReviewerIds || [],
```

- [ ] **Step 4: Add shared authorization helpers**

Resolve the item snapshot first and current policy second. Return `false` for missing or empty authorization.

```ts
export const getTranslationReviewerIds = (item: TranslationItem) =>
  item.authorizedReviewerIds?.length
    ? item.authorizedReviewerIds
    : getLanguageReviewPolicy(item.targetLocale)?.authorizedReviewerIds || [];

export const canReviewTranslation = (item: TranslationItem, operatorId: string) =>
  getTranslationReviewerIds(item).includes(operatorId);
```

- [ ] **Step 5: Commit the domain change**

```bash
git add src/domain/reviewOperators.ts src/domain/types.ts src/store/prototypeStore.ts
git commit -m "feat: authorize reviewers by language"
```

### Task 2: Simplify Language Review Policy Configuration

**Files:**
- Modify: `src/pages/settings/LanguageReviewPolicyPanel.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `reviewOperators` and `reviewOperatorName` from Task 1.
- Consumes: `LanguageReviewPolicy.authorizedReviewerIds` and `updateLanguageReviewPolicy`.

- [ ] **Step 1: Replace three legacy columns with one reviewer selector**

Render columns `语言 / 专项审核 / 授权审核人 / SLA / 超时动作 / 状态`. Use an Arco multi-select with search and labels that include name, operator ID, and team.

```tsx
<Select
  mode="multiple"
  allowSearch
  value={policy.authorizedReviewerIds}
  options={reviewOperators
    .filter((operator) => operator.enabled)
    .map((operator) => ({
      value: operator.id,
      label: `${operator.name} · ${operator.id} · ${operator.team}`,
    }))}
/>
```

- [ ] **Step 2: Prevent an enabled policy from losing all reviewers**

When the operator clears the last selected reviewer, keep the existing value and show `每个启用语言至少需要 1 名授权审核人`. Allow an empty list only while the language policy is disabled.

- [ ] **Step 3: Simplify policy row layout**

Change the CSS grid to six columns and give the reviewer selector a flexible minimum width so selected people remain readable without creating an excessively wide table.

```css
.language-policy-head,.language-policy-row{
  grid-template-columns:130px 90px minmax(320px,1fr) 120px 130px 110px;
  min-width:980px;
}
```

- [ ] **Step 4: Commit the configuration UI**

```bash
git add src/pages/settings/LanguageReviewPolicyPanel.tsx src/styles/global.css
git commit -m "feat: configure language reviewers directly"
```

### Task 3: Enforce Authorization in Review Operations

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/pages/approvals/TranslationReviewDrawer.tsx`
- Modify: `src/pages/multilingual/MultilingualResultPanel.tsx`
- Modify: `src/pages/templates/TranslationWorkflowPanel.tsx`

**Interfaces:**
- Consumes: `canReviewTranslation(item, operatorId)` and `CURRENT_REVIEW_OPERATOR_ID`.
- Produces: read-only review UI with the copy `无该语言审核权限`.

- [ ] **Step 1: Guard store mutations**

Before approving, rejecting, or saving a translation draft, verify that the supplied operator ID is authorized for the item. Keep self-review allowed by removing all submitter-versus-reviewer checks.

```ts
if (!canReviewTranslation(currentItem, reviewerId)) {
  throw new Error("无该语言审核权限");
}
```

Change draft and reject operations to accept the acting reviewer ID so direct calls cannot bypass the same rule.

- [ ] **Step 2: Make the review drawer permission-aware**

Use `currentAdmin` as an operator ID. When unauthorized, show an info alert, disable editing and all footer mutation buttons, and retain only `取消`. Remove the self-review warnings and disabled-state logic.

- [ ] **Step 3: Protect inline ordinary-language review**

Derive `canEdit` from both item status and `canReviewTranslation(item, CURRENT_REVIEW_OPERATOR_ID)`. Show translated content read-only and a permission alert when the current operator lacks authorization. Pass the stable operator ID to save and approve operations.

- [ ] **Step 4: Standardize existing drawer callers**

Pass `CURRENT_REVIEW_OPERATOR_ID` from template workflows and other inline entry points instead of display names. Resolve stored reviewer IDs to display names when rendering audit text.

- [ ] **Step 5: Commit operation guards**

```bash
git add src/store/prototypeStore.ts src/pages/approvals/TranslationReviewDrawer.tsx src/pages/multilingual/MultilingualResultPanel.tsx src/pages/templates/TranslationWorkflowPanel.tsx
git commit -m "feat: enforce language reviewer authorization"
```

### Task 4: Simplify the Central Multilingual Review Page

**Files:**
- Modify: `src/pages/multilingual/MultilingualReviewPage.tsx`

**Interfaces:**
- Consumes: `CURRENT_REVIEW_OPERATOR_ID`, `canReviewTranslation`, and `reviewOperatorName`.
- Produces: a reviewer-scoped special-language review queue without group concepts.

- [ ] **Step 1: Remove group filtering and group display**

Delete `group` state, the `审核组` filter, and the `审核组` table column. Add an `授权审核人` column that renders names from the item authorization snapshot.

- [ ] **Step 2: Scope the queue to authorized work**

Filter pending special-review items with `canReviewTranslation(item, CURRENT_REVIEW_OPERATOR_ID)` so the current operator sees only languages they may act on.

- [ ] **Step 3: Pass the current operator ID to the drawer**

Use `CURRENT_REVIEW_OPERATOR_ID` for the centralized drawer, preserving the same authorization behavior as inline review.

- [ ] **Step 4: Commit the centralized queue change**

```bash
git add src/pages/multilingual/MultilingualReviewPage.tsx
git commit -m "feat: scope multilingual review by reviewer"
```

### Task 5: Final Consistency Review Without Running Tests

**Files:**
- Inspect: all files modified in Tasks 1-4.

**Interfaces:**
- Consumes: the completed reviewer authorization flow.
- Produces: a clean source diff with no remaining production references to removed policy fields.

- [ ] **Step 1: Search for removed production fields**

Run a read-only search and update any remaining production references returned by it:

```bash
rg -n "reviewGroup|reviewerCount|allowSubmitterReview" src --glob '!**/*.test.*'
```

Expected: no matches.

- [ ] **Step 2: Review the final diff**

Inspect `git diff --check` and `git status --short`. Do not run the test suite or build command, as requested by the user.

- [ ] **Step 3: Commit any final consistency fixes**

```bash
git add src
git commit -m "fix: align language review authorization flow"
```
