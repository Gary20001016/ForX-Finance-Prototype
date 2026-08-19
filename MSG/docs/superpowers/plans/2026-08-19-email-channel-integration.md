# Email Channel Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Email as a first-class channel across the existing ForX Finance message-center frontend prototype and modular PRD.

**Architecture:** Extend the existing channel-scoped content model with optional Email content/configuration, keep `channels` as the source of truth, and reuse the current content approval and multilingual batch lifecycle. Render and validate Email through focused helpers/components, while representing provider delivery as prototype data behind a future backend adapter boundary.

**Tech Stack:** React 18, TypeScript 5.9, Arco Design React, Vitest, Testing Library, Vite.

## Global Constraints

- Current repository remains a frontend prototype and must not call a real Email provider or store API credentials.
- Active product channels are exactly `站内信`, `Push`, and `邮件`; `短信` remains dormant.
- Existing templates and tasks without Email data must continue to work without migration.
- Email translation processes visible text fields only; variables, URLs, HTML structure, CSS, sender identity, and provider configuration remain unchanged.
- Marketing Email requires unsubscribe content; transactional Email does not expose marketing unsubscribe.
- Published manual templates remain immutable.

---

### Task 1: Email Domain Model and Channel Policy

**Files:**
- Create: `src/domain/emailChannel.ts`
- Create: `src/domain/emailChannel.test.ts`
- Modify: `src/domain/types.ts`

**Interfaces:**
- Produces: `EmailMessageContent`, `EmailChannelConfig`, `EmailType`, `ACTIVE_MESSAGE_CHANNELS`, `createDefaultEmailContent()`, `createDefaultEmailConfig()`, `isEmailContentComplete()`, `validateEmailContent()`.

- [ ] **Step 1: Write failing domain tests**

```ts
it("enables exactly inbox, push and email", () => {
  expect(ACTIVE_MESSAGE_CHANNELS).toEqual(["站内信", "Push", "邮件"]);
});

it("requires unsubscribe copy only for marketing email", () => {
  expect(validateEmailContent(marketingWithoutUnsubscribe, marketingConfig).valid).toBe(false);
  expect(validateEmailContent(transactionalContent, transactionalConfig).valid).toBe(true);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/domain/emailChannel.test.ts`
Expected: FAIL because `emailChannel.ts` and Email types do not exist.

- [ ] **Step 3: Implement the types and helper**

```ts
export type EmailType = "事务邮件" | "营销邮件";

export interface EmailMessageContent {
  subject: string;
  preheader?: string;
  headline: string;
  body: string;
  textBody: string;
  actionText?: string;
  actionUrl?: string;
  footerText?: string;
  unsubscribeText?: string;
}

export interface EmailChannelConfig {
  emailType: EmailType;
  senderProfileId: string;
  fromName: string;
  replyTo?: string;
  trackingEnabled: boolean;
  unsubscribeRequired: boolean;
}
```

Add optional `email` and `emailConfig` to `LocalizedMessageContent`, optional `email` to `TranslationChannelContent`, Email metadata to `DeliveryRecord`, and optional `email` to `OperatorTestAccount`.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run src/domain/emailChannel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/emailChannel.ts src/domain/emailChannel.test.ts
git commit -m "feat: model email message channel"
```

### Task 2: Reusable Email Preview

**Files:**
- Create: `src/components/EmailPreview.tsx`
- Create: `src/components/EmailPreview.test.tsx`
- Modify: `src/components/MessagePreview.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `EmailMessageContent`, `EmailChannelConfig`.
- Produces: `EmailPreview` with desktop, mobile and plain-text views; `MessagePreview` renders it when `channels.includes("邮件")`.

- [ ] **Step 1: Write failing preview tests**

```tsx
render(<MessagePreview content={contentWithEmail} channels={["邮件"]} />);
expect(screen.getByLabelText("Email 桌面预览")).toBeInTheDocument();
expect(screen.getByText("提现成功通知")).toBeInTheDocument();
expect(screen.getByText("纯文本预览")).toBeInTheDocument();
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/components/EmailPreview.test.tsx`
Expected: FAIL because Email preview is not rendered.

- [ ] **Step 3: Implement the component and styles**

Render a 600px responsive Email card, a compact mobile card and a `<pre>` plain-text fallback. Show sender, subject, preheader, CTA, transaction/marketing tag and unsubscribe footer only for marketing Email.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run src/components/EmailPreview.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/EmailPreview.tsx src/components/EmailPreview.test.tsx src/components/MessagePreview.tsx src/styles.css
git commit -m "feat: preview email channel content"
```

### Task 3: Template Authoring and Test Email

**Files:**
- Create: `src/pages/templates/TemplateEditorDrawer.email.test.tsx`
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Modify: `src/pages/templates/TemplateTestSendModal.tsx`
- Modify: `src/pages/settings/TestAccountPanel.tsx`
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Consumes: Email domain helpers and `MessagePreview`.
- Produces: Email channel checkbox/editor, Email validation, operator test Email and Email test-send calculation.

- [ ] **Step 1: Write failing template tests**

```tsx
await user.click(screen.getByLabelText("邮件"));
expect(screen.getByLabelText("邮件标题")).toBeInTheDocument();
expect(screen.getByLabelText("邮件纯文本正文")).toBeInTheDocument();
expect(screen.getByLabelText("邮件类型")).toHaveTextContent("事务邮件");
```

Add a store test proving Email test send fails without a test Email and succeeds after adding one.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/pages/templates/TemplateEditorDrawer.email.test.tsx src/store/prototypeStore.test.ts`
Expected: FAIL because Email is filtered and has no editor/test target.

- [ ] **Step 3: Implement template Email authoring**

Add `邮件` to formal channels. Use `createDefaultEmailContent()` and `createDefaultEmailConfig()`. Show type, sender profile, reply-to, subject, preheader, headline, body, text body, CTA, URL, footer and marketing unsubscribe fields. Validate only when Email is selected and include Email fields in variable extraction.

- [ ] **Step 4: Implement test Email configuration and send calculation**

Allow each operator test account to store one optional Email. In `sendTemplateTest`, count UID targets for inbox/Push and Email targets for Email; return total generated deliveries rather than multiplying one account count by every channel.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- --run src/pages/templates/TemplateEditorDrawer.email.test.tsx src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx src/pages/templates/TemplateEditorDrawer.test-send.test.tsx src/store/prototypeStore.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/templates src/pages/settings/TestAccountPanel.tsx src/store/prototypeStore.ts src/store/prototypeStore.test.ts
git commit -m "feat: author and test email templates"
```

### Task 4: Email Multilingual Output

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/pages/multilingual/resolveMultilingualPreview.ts`
- Modify: `src/pages/multilingual/resolveMultilingualPreview.test.ts`
- Modify: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Consumes: `TranslationChannelContent.email`.
- Produces: machine, human and approved Email channel output and localized Email preview.

- [ ] **Step 1: Write failing multilingual tests**

```ts
expect(batch.items[0].machineChannelOutput?.email?.subject).toContain("en-US");
expect(batch.items[0].machineChannelOutput?.email?.actionUrl).toBe(source.email?.actionUrl);
expect(resolved.content?.email?.subject).toContain("en-US");
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/pages/multilingual/resolveMultilingualPreview.test.ts src/store/prototypeStore.test.ts`
Expected: FAIL because Email output is absent.

- [ ] **Step 3: Implement Email translation mapping**

When `channels` contains `邮件`, copy non-translatable config/URL and generate localized subject, preheader, headline, body, text body, CTA, footer and unsubscribe copy. Extend review merge and preview resolution without changing the three-state multilingual lifecycle.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run src/pages/multilingual/resolveMultilingualPreview.test.ts src/store/prototypeStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/prototypeStore.ts src/store/prototypeStore.test.ts src/pages/multilingual
git commit -m "feat: localize email channel content"
```

### Task 5: Manual Tasks, Event Rules and Approval

**Files:**
- Create: `src/pages/tasks/CreateTaskPage.email.test.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/automation/AutomationRuleListPage.tsx`
- Modify: `src/pages/approvals/ApprovalDrawer.tsx`
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/pages/tasks/TaskListPage.tsx`

**Interfaces:**
- Consumes: Email content helpers, template channel coverage and shared preview.
- Produces: Email reusable/temporary task authoring, event rule selection, approval preview and Email event delivery fixture.

- [ ] **Step 1: Write failing task and event tests**

```tsx
expect(screen.getByRole("checkbox", { name: "Email" })).toBeInTheDocument();
await user.click(screen.getByRole("checkbox", { name: "Email" }));
expect(screen.getByLabelText("邮件标题")).toBeInTheDocument();
```

Extend event-rule tests to select Email only when the bound template covers it.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/pages/tasks/CreateTaskPage.email.test.tsx src/pages/automation/AutomationRuleListPage.test.tsx`
Expected: FAIL because task and rule forms offer only inbox/Push.

- [ ] **Step 3: Implement task and rule Email flow**

Enable Email in copied tasks, channel selection, template filtering, temporary content, content validation, variable extraction, summary and preview. Add eligible Email audience guidance. Enable Email in automation rules and map Email event delivery to `Postmark Sandbox` with masked destination.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run src/pages/tasks/CreateTaskPage.email.test.tsx src/pages/tasks/CreateTaskPage.translation.test.tsx src/pages/automation/AutomationRuleListPage.test.tsx src/pages/approvals/ApprovalCenter.completion.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/tasks src/pages/automation src/pages/approvals src/store/prototypeStore.ts
git commit -m "feat: use email in tasks and event rules"
```

### Task 6: Channel Configuration and Analytics

**Files:**
- Create: `src/pages/channels/ChannelManagementPage.email.test.tsx`
- Modify: `src/pages/channels/ChannelManagementPage.tsx`
- Modify: `src/pages/analytics/AnalyticsPage.tsx`
- Modify: `src/pages/analytics/AnalyticsPage.test.tsx`
- Modify: `src/domain/types.ts`

**Interfaces:**
- Produces: Email provider configuration display and Email delivery metrics.

- [ ] **Step 1: Write failing UI tests**

```tsx
expect(screen.getByText("事务发送流")).toBeInTheDocument();
expect(screen.getByRole("option", { name: "Email" })).toBeInTheDocument();
expect(screen.getByText("退信率")).toBeInTheDocument();
expect(screen.getByText("投诉数")).toBeInTheDocument();
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/pages/channels/ChannelManagementPage.email.test.tsx src/pages/analytics/AnalyticsPage.test.tsx`
Expected: FAIL because Email details and metrics are absent.

- [ ] **Step 3: Implement Email configuration and analytics**

Show sending domains, transactional/broadcast streams, webhook and SPF/DKIM/DMARC status for Email providers. Add Email channel filter/card with delivered, bounced, complained, unsubscribed, clicked, retried and cost metrics.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run src/pages/channels/ChannelManagementPage.email.test.tsx src/pages/analytics/AnalyticsPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/channels src/pages/analytics src/domain/types.ts
git commit -m "feat: govern and analyze email delivery"
```

### Task 7: Modular PRD and Full Regression

**Files:**
- Modify: `docs/prd/message-center/README.md`
- Modify: `docs/prd/message-center/00-消息中心总览.md`
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/prd/message-center/03-消息模板与多语言.md`
- Modify: `docs/prd/message-center/04-系统事件.md`
- Modify: `docs/prd/message-center/05-用户与受众.md`
- Modify: `docs/prd/message-center/06-审核与发布.md`
- Modify: `docs/prd/message-center/07-渠道与发送记录.md`
- Modify: `docs/prd/message-center/08-数据分析.md`
- Modify: `docs/prd/message-center/09-系统配置与审计.md`
- Modify: `docs/prd/message-center/10-邮件服务商选型对比.md`
- Modify: `README.md`

**Interfaces:**
- Documents the implemented frontend scope and production backend boundary.

- [ ] **Step 1: Update PRD scope and field tables**

Change Email from “out of scope” to a formal channel, document Email content/configuration, eligibility, multilingual, approval, delivery states, provider webhooks, suppression and metrics. Keep the repository boundary explicit: real provider calls are backend work.

- [ ] **Step 2: Check documentation consistency**

Run: `rg -n "邮件.*不在|Email.*不在|仅.*站内信.*Push|inbox.*push[^,]" docs/prd/message-center README.md`
Expected: no stale statement that excludes Email from the selected scope.

- [ ] **Step 3: Run focused and full verification**

Run: `npm run test:run`
Expected: all tests pass.

Run: `npm run build`
Expected: TypeScript and Vite build complete successfully.

Run: `git diff --check`
Expected: no whitespace errors.

- [ ] **Step 4: Commit**

```bash
git add docs README.md src
git commit -m "docs: add email channel to message center prd"
```

