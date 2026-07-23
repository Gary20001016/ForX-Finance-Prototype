# Operator Permission Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static role matrix with super-admin-only, per-operator permission management that shares language authorization with language review policies.

**Architecture:** Extend the controlled operator directory with system identity and direct capability grants, then expose it through prototype state. A dedicated settings panel edits functional permissions and rewrites each language policy's reviewer IDs in one validated store operation.

**Tech Stack:** React 18, TypeScript, Arco Design React, external-store prototype state.

## Global Constraints

- Permissions are assigned directly to people and are unrelated to position or role inheritance.
- Only a system super administrator may see the personnel permission tab.
- Super administrator identity is read-only and cannot be granted from this page.
- Reviewable languages use `LanguageReviewPolicy.authorizedReviewerIds` as the only source of truth.
- An enabled language must always retain at least one authorized reviewer.
- Per user request, do not run automated tests or build verification.

---

### Task 1: Extend Operator Identity and Permission State

**Files:**
- Modify: `src/domain/reviewOperators.ts`
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/layout/AdminLayout.tsx`

**Interfaces:**
- Produces: `OperatorPermission`, `operatorPermissionLabels`, extended `ReviewOperator`.
- Produces: `PrototypeState.operators` and `updateOperatorPermissions(operatorId, permissions, reviewLocaleCodes)`.

- [ ] **Step 1: Define direct functional permissions**

Add five stable permission codes and labels. Extend operators with `isSuperAdmin`, `enabled`, and `permissions` without introducing a role or position field.

```ts
export type OperatorPermission =
  | "content.create"
  | "content.submit"
  | "variable.manage"
  | "business.review"
  | "risk.review";
```

- [ ] **Step 2: Store operators in prototype state**

Initialize `operators` from the controlled operator seed so settings pages react to permission changes.

- [ ] **Step 3: Add atomic permission and language update**

Before saving, calculate each enabled language's next reviewer list. Throw `“<语言>”至少需要 1 名授权审核人` if the update would remove the last reviewer; otherwise update both operator permissions and language policies together.

- [ ] **Step 4: Use controlled current-operator identity in the header**

Resolve the current operator by `CURRENT_REVIEW_OPERATOR_ID` and display its name plus `超级管理员` or `普通操作者`, removing duplicated hard-coded identity text.

- [ ] **Step 5: Commit the state change**

```bash
git add src/domain/reviewOperators.ts src/store/prototypeStore.ts src/layout/AdminLayout.tsx
git commit -m "feat: add direct operator permissions"
```

### Task 2: Build the Personnel Permission Panel

**Files:**
- Create: `src/pages/settings/OperatorPermissionPanel.tsx`

**Interfaces:**
- Consumes: `operators`, `languageReviewPolicies`, `operatorPermissionLabels`, and `updateOperatorPermissions`.
- Produces: searchable personnel table and permission editor drawer.

- [ ] **Step 1: Render a searchable personnel table**

Show name and operator ID, account status, granted functional abilities, reviewable languages, and an `编辑权限` action. Do not render job or role columns.

- [ ] **Step 2: Build the editor drawer**

Use a checkbox group for the five direct permissions and a searchable multi-select for enabled languages. Initialize values whenever a person is selected.

- [ ] **Step 3: Save through the atomic store operation**

Call `updateOperatorPermissions`; on success show `人员权限已更新` and close. Display the exact store validation message when a language would lose its last reviewer.

- [ ] **Step 4: Keep disabled accounts read-only**

For disabled accounts show a warning and disable functional permission, language, and save controls.

- [ ] **Step 5: Commit the panel**

```bash
git add src/pages/settings/OperatorPermissionPanel.tsx
git commit -m "feat: add personnel permission editor"
```

### Task 3: Restrict Settings Visibility to Super Administrators

**Files:**
- Modify: `src/pages/settings/SettingsPage.tsx`

**Interfaces:**
- Consumes: `CURRENT_REVIEW_OPERATOR_ID`, `PrototypeState.operators`, and `OperatorPermissionPanel`.
- Produces: conditional `人员权限` tab and safe query-parameter fallback.

- [ ] **Step 1: Resolve the current operator and access flag**

Use the current operator ID to derive `isSuperAdmin`. Keep this separate from direct functional permissions.

- [ ] **Step 2: Replace the static role matrix**

Remove the entire role matrix tab. Render `OperatorPermissionPanel` under a `人员权限` tab only when `isSuperAdmin` is true.

- [ ] **Step 3: Guard direct tab selection**

Allow `?tab=operator-permissions` only for a super administrator. For other users, choose `categories` as the initial tab.

- [ ] **Step 4: Commit visibility integration**

```bash
git add src/pages/settings/SettingsPage.tsx
git commit -m "feat: restrict personnel permissions to super admins"
```

### Task 4: Synchronize the Language Reviewer Selector

**Files:**
- Modify: `src/pages/settings/LanguageReviewPolicyPanel.tsx`

**Interfaces:**
- Consumes: reactive `PrototypeState.operators` instead of static operator seeds.
- Produces: two-way visible synchronization between personnel permissions and language policies.

- [ ] **Step 1: Read reviewer options from prototype state**

Build options from `store.operators.filter(operator => operator.enabled)` so personnel data and language review configuration show the same people.

- [ ] **Step 2: Remove the static directory import**

Keep the current minimum-one-reviewer validation unchanged.

- [ ] **Step 3: Commit synchronization**

```bash
git add src/pages/settings/LanguageReviewPolicyPanel.tsx
git commit -m "fix: synchronize personnel and language permissions"
```

### Task 5: Source Consistency Review Without Tests

**Files:**
- Inspect: all files modified in Tasks 1-4.

**Interfaces:**
- Produces: a clean source diff with no production role-matrix implementation.

- [ ] **Step 1: Search production code**

```bash
rg -n "role-matrix|角色权限|岗位" src --glob '!**/*.test.*'
```

Expected: no settings-page role matrix or role-permission UI remains.

- [ ] **Step 2: Inspect source formatting and repository state**

Run `git diff --check` and `git status --short`. Do not run tests or a build command.

- [ ] **Step 3: Commit only if consistency fixes were necessary**

```bash
git add src
git commit -m "fix: align personnel permission visibility"
```
