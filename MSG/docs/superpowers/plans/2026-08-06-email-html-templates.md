# ForX Finance Email HTML Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide production-ready HTML bodies for transaction notifications and marketing campaigns.

**Architecture:** Store two standalone, table-layout HTML documents under `html/email/`. They share ForX Finance visual tokens and placeholder syntax but encode different CTA and footer rules: transaction notices avoid marketing layout and unsubscribe copy, while marketing emails include campaign content and unsubscribe URLs.

**Tech Stack:** Static HTML, inline CSS, Vitest, Node file assertions.

## Global Constraints

- Outer background `#F5F7FA`, card width 600px, system font, 14px body and `#1D2129` text.
- Brand color is `#165DFF`; each message has one primary CTA.
- Use table layout and inline CSS; no JavaScript, external CSS, video or complex positioning.
- Both templates must use `{{ variable_name }}` syntax and retain readable text when images are blocked.
- Transaction notice has a status card and key-data table, and must not contain marketing unsubscribe copy.
- Marketing email includes campaign content, one primary CTA, rules and `{{ unsubscribe_url }}`.

---

### Task 1: Add tested HTML email bodies

**Files:**
- Create: `src/email/emailTemplates.test.ts`
- Create: `html/email/transactional-notification.html`
- Create: `html/email/marketing-campaign.html`

**Interfaces:**
- Produces two standalone email documents, consumed by email-template authors and provider preview tools.
- Both documents use the placeholders `{{ user_nickname }}`, `{{ action_url }}` and `{{ support_email }}`.

- [ ] **Step 1: Write the failing static-template test.**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

const email = (name: string) =>
  readFileSync(resolve(process.cwd(), "html/email", name), "utf8");

it("ships a transaction notice with status, data rows and a single CTA", () => {
  const html = email("transactional-notification.html");
  expect(html).toContain("{{ user_nickname }}");
  expect(html).toContain("{{ detail_rows }}");
  expect(html).toContain("{{ action_url }}");
  expect(html).not.toContain("{{ unsubscribe_url }}");
});

it("ships a marketing campaign with campaign variables and unsubscribe", () => {
  const html = email("marketing-campaign.html");
  expect(html).toContain("{{ campaign_name }}");
  expect(html).toContain("{{ action_url }}");
  expect(html).toContain("{{ unsubscribe_url }}");
});
```

- [ ] **Step 2: Run the focused test and confirm it fails.**

Run: `npm test -- --run src/email/emailTemplates.test.ts`

Expected: fail because the test and both HTML documents do not exist.

- [ ] **Step 3: Create the transaction notification HTML.**

```html
<body style="margin:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1D2129;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:24px 32px;background:#165DFF;color:#FFFFFF;font-size:20px;font-weight:700;">ForX Finance</td></tr>
      <tr><td style="padding:32px;"><p>Hi {{ user_nickname }},</p><h1>{{ email_title }}</h1>{{ status_block }}{{ detail_rows }}<a href="{{ action_url }}">查看详情</a></td></tr>
      <tr><td>Official support: {{ support_email }}</td></tr>
    </table>
  </td></tr></table>
</body>
```

Use the snippet’s visual hierarchy but expand it into valid HTML with inline styles, Outlook-safe presentation tables, a preheader, success/failure status placeholders, `{{ amount }}`, `{{ currency }}`, `{{ occurred_at }}`, and a text-link fallback. The final footer contains risk/copyright copy but no unsubscribe link.

- [ ] **Step 4: Create the marketing campaign HTML.**

```html
<body style="margin:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1D2129;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:36px 32px;background:#165DFF;color:#FFFFFF;"><p>ForX Finance Rewards</p><h1>{{ campaign_name }}</h1></td></tr>
      <tr><td style="padding:32px;"><p>Hi {{ user_nickname }},</p><h2>{{ benefit }}</h2><a href="{{ action_url }}">立即参与</a><p>{{ campaign_rules }}</p></td></tr>
      <tr><td><a href="{{ unsubscribe_url }}">取消订阅营销邮件</a></td></tr>
    </table>
  </td></tr></table>
</body>
```

Use the snippet’s visual hierarchy but expand it into valid responsive HTML with a hidden preheader, `{{ expires_at }}`, `{{ campaign_rules }}`, one primary button and a secondary plain-text link. The footer contains preference and unsubscribe links.

- [ ] **Step 5: Run focused tests and commit.**

Run: `npm test -- --run src/email/emailTemplates.test.ts && npm run build`

Expected: two static-template tests pass and TypeScript/Vite build exits 0.

```bash
git add src/email/emailTemplates.test.ts html/email/transactional-notification.html html/email/marketing-campaign.html
git commit -m "feat: add email HTML templates"
```

### Task 2: Make templates discoverable

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documents the two template paths and the transaction-versus-marketing usage boundary.

- [ ] **Step 1: Add the exact usage note.**

```markdown
## 邮件 HTML 模板

- `html/email/transactional-notification.html`：用于充值、提现、订单和安全通知；不包含营销退订链接。
- `html/email/marketing-campaign.html`：用于活动、奖励和召回；必须保留 `{{ unsubscribe_url }}`。
```

- [ ] **Step 2: Verify the tracked outputs and commit.**

Run: `git diff --check && npm test -- --run src/email/emailTemplates.test.ts`

Expected: no whitespace errors and both template assertions pass.

```bash
git add README.md
git commit -m "docs: document email HTML templates"
```
