# HTML Email Preview and Multilingual Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make HTML Email previews responsive and add a seeded Japanese HTML-body work order to multilingual review.

**Architecture:** Keep HTML rendering inside the existing sandboxed `EmailPreview` iframe. Carry a target-locale HTML asset in `TranslationItem.humanChannelDraft.email.htmlAssets`, let `resolveMultilingualPreview` prefer that asset, and let `TranslationReviewDrawer` switch from Markdown editing to read-only Email preview for HTML mode.

**Tech Stack:** React 18, TypeScript, Arco Design React, Vitest, Testing Library, Vite.

## Global Constraints

- HTML files are uploaded per language and are never machine translated.
- External translation handles only Email subject and preheader.
- HTML is read-only during language review; rejection sends it back for re-upload.
- Desktop and mobile previews render the same responsive HTML in sandboxed iframes.
- Compatibility plain text is system-generated, read-only, collapsed by default.

---

### Task 1: Responsive HTML preview and collapsed compatibility text

**Files:**
- Modify: `src/components/EmailPreview.tsx`
- Modify: `src/components/EmailPreview.test.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/mocks/emailDemoFixtures.ts`

**Interfaces:**
- Consumes: `EmailMessageContent.htmlAssets[locale]` and `EmailHtmlAsset.generatedText`.
- Produces: accessible `Email HTML 桌面预览`, `Email HTML 移动预览`, and a closed `纯文本兼容内容` disclosure.

- [ ] **Step 1: Write the failing component test**

```tsx
expect(screen.getByText("纯文本兼容内容").closest("details"))
  .not.toHaveAttribute("open");
expect(screen.getByTitle("zh-CN HTML 邮件预览"))
  .toHaveAttribute("data-viewport", "desktop");
expect(screen.getByTitle("zh-CN HTML 移动预览"))
  .toHaveAttribute("data-viewport", "mobile");
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:run -- src/components/EmailPreview.test.tsx`

Expected: FAIL because compatibility text is still a third card and the iframes have no viewport metadata.

- [ ] **Step 3: Implement the preview structure**

Use native disclosure semantics and keep both iframes sandboxed:

```tsx
<iframe data-viewport="desktop" sandbox="" srcDoc={htmlAsset.sanitizedHtml} />
<iframe data-viewport="mobile" sandbox="" srcDoc={htmlAsset.sanitizedHtml} />
<details className="email-compatibility-text">
  <summary>纯文本兼容内容</summary>
  <pre>{htmlAsset.generatedText || "未生成兼容性纯文本"}</pre>
  <small>由系统自动提取，不作为第二套可编辑正文。</small>
</details>
```

Change the HTML preview grid to two columns, move the disclosure below them, and constrain iframe overflow. Add a responsive media query to the seeded HTML document with smaller mobile paddings and headings, a full-width CTA, and `overflow-wrap:anywhere` for variable values.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm run test:run -- src/components/EmailPreview.test.tsx src/mocks/emailDemoFixtures.test.ts`

Expected: both files pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/EmailPreview.tsx src/components/EmailPreview.test.tsx src/styles/global.css src/mocks/emailDemoFixtures.ts
git commit -m "fix: make html email previews responsive"
```

### Task 2: Resolve and validate target-locale HTML review content

**Files:**
- Modify: `src/pages/multilingual/resolveMultilingualPreview.ts`
- Modify: `src/pages/multilingual/resolveMultilingualPreview.test.ts`
- Modify: `src/pages/approvals/TranslationReviewDrawer.tsx`
- Create: `src/pages/approvals/TranslationReviewDrawer.email-html.test.tsx`

**Interfaces:**
- Consumes: `TranslationItem.humanChannelDraft.email.htmlAssets[targetLocale]`.
- Produces: target-language `LocalizedMessageContent` for `EmailPreview` and an HTML review gate.

- [ ] **Step 1: Write failing resolver and drawer tests**

```tsx
expect(resolveMultilingualPreview(batch, item).content?.email?.htmlAssets?.["ja-JP"])
  .toEqual(japaneseAsset);
expect(screen.getByLabelText("Email HTML 桌面预览")).toBeVisible();
expect(screen.getByLabelText("Email HTML 移动预览")).toBeVisible();
expect(screen.queryByText("正文 Markdown")).not.toBeInTheDocument();
expect(screen.getByText("vip-summer-ja-JP.html")).toBeVisible();
```

Add a second drawer test with a missing or blocked `ja-JP` asset and assert that `专项审核通过` is disabled.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm run test:run -- src/pages/multilingual/resolveMultilingualPreview.test.ts src/pages/approvals/TranslationReviewDrawer.email-html.test.tsx`

Expected: FAIL because the resolver reuses source assets and the drawer always renders Markdown fields.

- [ ] **Step 3: Implement target asset resolution and HTML review UI**

In `resolveMultilingualPreview`, prefer item-level assets:

```ts
htmlAssets: emailLayer?.htmlAssets || source?.email?.htmlAssets,
```

In `TranslationReviewDrawer`, call `resolveMultilingualPreview`, derive the target asset, and branch on `bodyMode === "html"`. Render title/preheader inputs plus `EmailPreview`, file metadata, validation tags, and a copy explaining that HTML changes require rejection and re-upload.

```ts
const htmlReviewBlocked = isHtmlEmail &&
  (!targetHtmlAsset || targetHtmlAsset.validationStatus !== "passed");
```

Do not render `MarkdownEditor` for HTML mode.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `npm run test:run -- src/pages/multilingual/resolveMultilingualPreview.test.ts src/pages/approvals/TranslationReviewDrawer.email-html.test.tsx`

Expected: both files pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/multilingual/resolveMultilingualPreview.ts src/pages/multilingual/resolveMultilingualPreview.test.ts src/pages/approvals/TranslationReviewDrawer.tsx src/pages/approvals/TranslationReviewDrawer.email-html.test.tsx
git commit -m "feat: review localized html email bodies"
```

### Task 3: Seed and expose a Japanese HTML Email review work order

**Files:**
- Modify: `src/mocks/emailDemoFixtures.ts`
- Modify: `src/mocks/emailDemoFixtures.test.ts`
- Modify: `src/pages/multilingual/MultilingualReviewPage.test.tsx`
- Modify: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Produces: batch `MT-EMAIL-DEMO-HTML-JA-REVIEW` and item `MTI-EMAIL-DEMO-HTML-JA-REVIEW`, assigned to `admin-01`.
- Consumes: the HTML review behavior from Task 2.

- [ ] **Step 1: Write the failing fixture and page tests**

```tsx
const htmlReview = fixtures.translationBatches.find(
  (batch) => batch.id === "MT-EMAIL-DEMO-HTML-JA-REVIEW",
);
expect(htmlReview?.items[0]).toMatchObject({
  targetLocale: "ja-JP",
  status: "翻译返回待审核",
  specialReviewRequired: true,
  assigneeId: "admin-01",
});
expect(htmlReview?.items[0].humanChannelDraft?.email?.htmlAssets?.["ja-JP"])
  .toBeDefined();
```

Render `MultilingualReviewPage`, locate `夏季 VIP 专属礼遇 Email · 日语 HTML 审核`, open it, and assert the Email HTML desktop/mobile previews and file name are visible.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm run test:run -- src/mocks/emailDemoFixtures.test.ts src/pages/multilingual/MultilingualReviewPage.test.tsx src/store/prototypeStore.test.ts`

Expected: FAIL because the Japanese HTML work order does not exist.

- [ ] **Step 3: Add the responsive Japanese asset and review batch**

Create a trusted `ja-JP` demo asset named `vip-summer-ja-JP.html`. Add a pending special-review batch whose machine/human output contains only translated subject and preheader plus the uploaded `ja-JP` asset. Keep the existing published HTML template and approved English batch unchanged.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `npm run test:run -- src/mocks/emailDemoFixtures.test.ts src/pages/multilingual/MultilingualReviewPage.test.tsx src/store/prototypeStore.test.ts`

Expected: all selected files pass.

- [ ] **Step 5: Run final verification and commit**

Run: `npm run test:run && npm run build`

Expected: all test files pass and Vite production build exits with code 0. Then inspect `/templates?scope=manual` and `/multilingual-review` in the browser.

```bash
git add src/mocks/emailDemoFixtures.ts src/mocks/emailDemoFixtures.test.ts src/pages/multilingual/MultilingualReviewPage.test.tsx src/store/prototypeStore.test.ts
git commit -m "feat: seed html email language review demo"
```

