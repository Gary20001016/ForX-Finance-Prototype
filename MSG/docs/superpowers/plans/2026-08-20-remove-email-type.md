# Remove Email Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the operator-facing Email type and make sender identity, reply policy, unsubscribe, body mode, and tracking independently configurable.

**Architecture:** `EmailChannelConfig` owns independent delivery controls. Approved sender profiles carry the internal provider stream so UI and business content never expose transactional/marketing classification. Existing Email editor, preview, HTML validator, review preview, fixtures, and PRD consume the new contract.

**Tech Stack:** React, TypeScript, Arco Design React, Vitest.

## Global Constraints

- Do not expose an Email type or provider stream selector to operators.
- HTML unsubscribe validation is controlled only by `unsubscribeRequired`.
- Reply mailbox is required only when `replyMode` is `mailbox`.
- Preserve existing plain-text and localized HTML authoring and preview behavior.

---

### Task 1: Replace the Email configuration contract

**Files:**
- Modify: `MSG/src/domain/types.ts`
- Modify: `MSG/src/domain/emailChannel.ts`
- Test: `MSG/src/domain/emailChannel.test.ts`

**Interfaces:**
- Produces: `EmailReplyMode`, sender profiles with `stream`, and an `EmailChannelConfig` without `emailType`.
- Produces: HTML validation driven by `unsubscribeRequired`.

- [x] Write failing domain tests for independent reply and unsubscribe rules.
- [x] Run `npm run test:run -- src/domain/emailChannel.test.ts` and confirm failure.
- [x] Implement the minimal type, default, profile, and validation changes.
- [x] Run the domain test and confirm it passes.

### Task 2: Remove Email type from authoring and preview

**Files:**
- Modify: `MSG/src/components/EmailContentEditor.tsx`
- Modify: `MSG/src/components/EmailHtmlUploadPanel.tsx`
- Modify: `MSG/src/components/EmailPreview.tsx`
- Modify: `MSG/src/pages/approvals/TranslationReviewDrawer.tsx`
- Test: `MSG/src/pages/templates/TemplateEditorDrawer.email.test.tsx`
- Test: `MSG/src/components/EmailPreview.test.tsx`

**Interfaces:**
- Consumes: the Task 1 configuration contract.
- Produces: sender, reply, unsubscribe, tracking, and body-mode controls without an Email type selector.

- [x] Update UI tests first to require the new controls and absence of “邮件类型”.
- [x] Run the focused tests and confirm failure.
- [x] Implement editor, upload, preview, and review changes.
- [x] Run the focused tests and confirm they pass.

### Task 3: Migrate fixtures, call sites, and PRD

**Files:**
- Modify: Email-related files reported by `rg "emailType|EmailType" MSG/src`.
- Modify: `MSG/docs/prd/message-center/03-消息模板与多语言.md`
- Modify: `MSG/docs/prd/message-center/06-审核与发布.md`
- Modify: `MSG/docs/prd/message-center/07-渠道与发送记录.md`
- Modify: `MSG/docs/prd/message-center/10-邮件服务商选型对比.md`
- Modify: `MSG/docs/prd/message-center/README.md`

**Interfaces:**
- Consumes: the Task 1 configuration contract.
- Produces: compilable fixtures and PRD language aligned to the approved product decision.

- [x] Replace product call sites with sender/reply/unsubscribe configuration while retaining legacy migration compatibility.
- [x] Update modular PRD wording and remove the operator-facing type field.
- [x] Run `npm test -- --run` and `npm run build` from `MSG`.
- [x] Confirm the operator UI no longer exposes a “邮件类型” selector.
