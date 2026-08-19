# Email Body Mode and Localized HTML Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the parallel Email HTML/plain-text editors with an exclusive body-mode selector: plain text uses external translation, while localized HTML files are uploaded per enabled locale and bypass translation review.

**Architecture:** Extend the existing shared Email content model with `bodyMode` and locale-keyed HTML assets. Keep subject and preheader in the existing translation layers, while HTML assets stay on the source content and are selected by locale for preview and content review. Isolate file parsing, sanitization and validation in the Email domain module so the shared template and temporary-message editors use the same behavior.

**Tech Stack:** React 18, TypeScript 5.9, Arco Design React 2.66, Vitest, Testing Library, Vite.

## Global Constraints

- Frontend prototype only; do not call real translation, storage or Email provider APIs.
- `bodyMode` is exactly `"text" | "html"` and only the active mode participates in validation and preview.
- Subject and preheader continue through external machine translation and multilingual human review in both modes.
- Plain-text body continues through external machine translation and multilingual human review.
- HTML is uploaded separately for every enabled locale, including the source locale; it never enters machine translation or multilingual review.
- HTML still requires upload validation, variable consistency checks and ordinary content review representation.
- Preserve compatibility with existing fixtures that do not yet contain `bodyMode` by treating them as plain-text content.
- Do not add runtime dependencies.

---

### Task 1: Add the Email body-mode and HTML asset domain model

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/emailChannel.ts`
- Test: `src/domain/emailChannel.test.ts`

**Interfaces:**
- Produces: `EmailBodyMode`, `EmailHtmlAsset`, `EmailHtmlValidationIssue`, `getEmailBodyMode()`, `validateEmailHtml()`, `createEmailHtmlAsset()` and mode-aware `validateEmailContent()`.
- Consumes: existing `EmailMessageContent`, `EmailChannelConfig` and controlled `{{ variable_name }}` convention.

- [ ] **Step 1: Write failing domain tests**

Add tests that assert defaults use `bodyMode: "text"`, text mode requires only `textBody`, HTML mode requires one passed asset for each requested locale, unsafe HTML is blocked, and valid localized HTML produces a sanitized asset with extracted fallback text.

- [ ] **Step 2: Run the focused domain test and verify failure**

Run: `npm test -- --run src/domain/emailChannel.test.ts`

Expected: FAIL because body-mode types and HTML helpers do not exist.

- [ ] **Step 3: Implement the domain types and helpers**

Add the following public shapes:

```ts
export type EmailBodyMode = "text" | "html";

export interface EmailHtmlValidationIssue {
  level: "阻断" | "警告";
  message: string;
}

export interface EmailHtmlAsset {
  locale: string;
  fileName: string;
  fileSize: number;
  sourceHtml: string;
  sanitizedHtml: string;
  generatedText: string;
  sha256: string;
  uploadedBy: string;
  uploadedAt: string;
  validationStatus: "passed" | "blocked";
  contentReviewStatus: "pending" | "approved" | "rejected";
  validationIssues: EmailHtmlValidationIssue[];
}
```

Extend `EmailMessageContent` with optional legacy fields, `bodyMode?: EmailBodyMode`, and `htmlAssets?: Record<string, EmailHtmlAsset>`. Default new content to text mode. Implement conservative HTML checks for complete document structure, blocked tags/attributes/protocols, HTTPS remote assets, declared variables and marketing unsubscribe placeholder. Sanitize blocked elements/attributes for preview, extract visible fallback text, and create a deterministic browser-side asset hash.

Update `validateEmailContent(content, config, locales?)` so text mode validates `textBody`, while HTML mode validates a passed asset for every locale. Do not require the inactive body fields.

- [ ] **Step 4: Run the focused domain test and verify pass**

Run: `npm test -- --run src/domain/emailChannel.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the domain change**

```bash
git add src/domain/types.ts src/domain/emailChannel.ts src/domain/emailChannel.test.ts
git commit -m "feat: model localized email html uploads"
```

### Task 2: Replace the shared Email editor with exclusive body modes

**Files:**
- Create: `src/components/EmailHtmlUploadPanel.tsx`
- Create: `src/components/EmailContentEditor.test.tsx`
- Modify: `src/components/EmailContentEditor.tsx`
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/styles/global.css`
- Test: `src/pages/templates/TemplateEditorDrawer.email.test.tsx`
- Test: `src/pages/tasks/CreateTaskPage.email.test.tsx`

**Interfaces:**
- Consumes: `createEmailHtmlAsset()`, `EmailHtmlAsset`, enabled locale arrays and source locale.
- Produces: `EmailHtmlUploadPanel({ locales, assets, emailType, declaredVariables, onChange })` and shared body-mode UI in `EmailContentEditor`.

- [ ] **Step 1: Write failing editor tests**

Test that new Email content shows the `纯文本`/`HTML 文件` selector, text mode shows only the text editor, selecting HTML hides the text editor and displays one upload slot per enabled locale, and an uploaded safe HTML file becomes previewable with `待内容审核` rather than a multilingual-review label.

- [ ] **Step 2: Run focused editor tests and verify failure**

Run: `npm test -- --run src/components/EmailContentEditor.test.tsx src/pages/templates/TemplateEditorDrawer.email.test.tsx src/pages/tasks/CreateTaskPage.email.test.tsx`

Expected: FAIL because the selector and upload panel are absent.

- [ ] **Step 3: Implement the shared upload panel and body-mode selector**

Pass `sourceLocale` and `locales` from both parent pages into `EmailContentEditor`. Render an Arco radio group named `邮件正文类型`; render `VariableTextArea` named `邮件纯文本正文` only for text mode. In HTML mode render locale cards with native `.html,.htm` file inputs, file metadata, structured validation messages, `预览`, `替换` and `删除` actions, plus copy explaining “HTML 不进入机翻或多语言审核”.

When changing modes, show an Arco confirmation if the current mode has content; after confirmation update `bodyMode` and keep inactive draft data without using it. Use `File.text()` and `createEmailHtmlAsset()` for uploads. Add compact locale-card styles without changing other pages.

- [ ] **Step 4: Run focused editor tests and verify pass**

Run: `npm test -- --run src/components/EmailContentEditor.test.tsx src/pages/templates/TemplateEditorDrawer.email.test.tsx src/pages/tasks/CreateTaskPage.email.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the editor change**

```bash
git add src/components/EmailHtmlUploadPanel.tsx src/components/EmailContentEditor.tsx src/components/EmailContentEditor.test.tsx src/pages/templates/TemplateEditorDrawer.tsx src/pages/templates/TemplateEditorDrawer.email.test.tsx src/pages/tasks/CreateTaskPage.tsx src/pages/tasks/CreateTaskPage.email.test.tsx src/styles/global.css
git commit -m "feat: upload localized email html files"
```

### Task 3: Make Email preview and multilingual output mode-aware

**Files:**
- Modify: `src/components/EmailPreview.tsx`
- Modify: `src/components/EmailPreview.test.tsx`
- Modify: `src/pages/multilingual/resolveMultilingualPreview.ts`
- Modify: `src/pages/multilingual/resolveMultilingualPreview.test.ts`
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`

**Interfaces:**
- Consumes: `getEmailBodyMode()`, `EmailHtmlAsset`, source content assets and preview locale.
- Produces: safe sandboxed HTML preview and translation payloads that omit HTML body content.

- [ ] **Step 1: Write failing preview and multilingual tests**

Add tests that text mode renders only a pure-text preview; HTML mode renders the current locale asset inside a sandboxed iframe plus generated fallback text; and `resolveMultilingualPreview()` translates subject/preheader while reusing the matching uploaded HTML asset without copying HTML into machine output.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --run src/components/EmailPreview.test.tsx src/pages/multilingual/resolveMultilingualPreview.test.ts`

Expected: FAIL because preview and resolution still assume parallel body fields.

- [ ] **Step 3: Implement mode-aware preview and translation resolution**

Pass the active locale into `EmailPreview`. For HTML mode select `htmlAssets[locale]`, render `sanitizedHtml` through `<iframe sandbox="" srcDoc={...}>`, show file/validation/content-review state, and present `generatedText` only as compatibility fallback. For text mode render `textBody` and no HTML frame.

Update variable extraction and translation-layer resolution so only `subject`, `preheader` and text-mode `textBody` enter the translation content; HTML assets are selected from frozen source content by locale and retain ordinary content-review status.

- [ ] **Step 4: Run focused tests and verify pass**

Run: `npm test -- --run src/components/EmailPreview.test.tsx src/pages/multilingual/resolveMultilingualPreview.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the preview change**

```bash
git add src/components/EmailPreview.tsx src/components/EmailPreview.test.tsx src/pages/multilingual/resolveMultilingualPreview.ts src/pages/multilingual/resolveMultilingualPreview.test.ts src/pages/templates/TemplateEditorDrawer.tsx
git commit -m "feat: preview email body modes by locale"
```

### Task 4: Align validation call sites, fixtures and the modular PRD

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/prd/message-center/03-消息模板与多语言.md`
- Modify: `docs/prd/message-center/06-审核与发布.md`

**Interfaces:**
- Consumes: mode-aware `validateEmailContent()` and the finalized design spec.
- Produces: consistent template/task submission gates, fixtures and PRD wording.

- [ ] **Step 1: Write failing store coverage**

Add a test that HTML mode test-send/submission accepts complete locale assets without `textBody`, and rejects a missing target-locale asset with a locale-specific error. Preserve the existing pure-text test-send case.

- [ ] **Step 2: Run focused store tests and verify failure**

Run: `npm test -- --run src/store/prototypeStore.test.ts`

Expected: FAIL because store validation does not pass enabled locales and fixtures still require parallel content.

- [ ] **Step 3: Update call sites, fixtures and documentation**

Pass the enabled locale list into every Email validation gate. Seed existing Email fixtures with `bodyMode: "text"` or keep compatibility through `getEmailBodyMode()`. Update PRD language so it states:

```text
标题/预览文字：外部机翻 → 多语言人工审核
纯文本正文：外部机翻 → 多语言人工审核
HTML 正文：按语言上传 → 安全/变量校验 → 普通内容审核
```

Replace obsolete claims that operators maintain structured HTML and plain-text bodies simultaneously.

- [ ] **Step 4: Run focused store tests and verify pass**

Run: `npm test -- --run src/store/prototypeStore.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit validation and PRD changes**

```bash
git add src/store/prototypeStore.ts src/store/prototypeStore.test.ts src/pages/tasks/CreateTaskPage.tsx docs/prd/message-center/02-消息任务.md docs/prd/message-center/03-消息模板与多语言.md docs/prd/message-center/06-审核与发布.md
git commit -m "docs: align email html review workflow"
```

### Task 5: Full regression and browser verification

**Files:**
- Modify only files required by discovered regressions.

**Interfaces:**
- Consumes: all preceding tasks.
- Produces: a type-safe, tested, visually verified frontend prototype.

- [ ] **Step 1: Run all automated tests**

Run: `npm run test:run`

Expected: all suites and tests PASS.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite build PASS; the existing chunk-size warning is acceptable.

- [ ] **Step 3: Inspect the running template editor**

Open `http://127.0.0.1:5174/templates?scope=manual`, create/edit an Email template, switch between `纯文本` and `HTML 文件`, verify locale upload cards, upload a safe sample HTML file, preview it, and confirm the screen never labels HTML as multilingual review.

- [ ] **Step 4: Inspect temporary and event-message reuse**

Open the temporary-message and event-template entry points and verify they use the same body selector, locale slots and preview rules.

- [ ] **Step 5: Check the final diff and status**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only intentional changes remain, or the worktree is clean after the final regression commit.
