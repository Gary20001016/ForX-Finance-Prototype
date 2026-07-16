# Inbox Markdown Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one safe Markdown editor and renderer for station-message bodies across manual templates, event templates, temporary tasks, translation review, previews, and published read-only details.

**Architecture:** Store Markdown source in the existing `web.body` string and render it only through a shared `MarkdownContent` component backed by `react-markdown` and `remark-gfm`. Use a controlled Arco-based `MarkdownEditor` for every editable station-message body; Push remains plain text.

**Tech Stack:** React 18, TypeScript, Arco Design React, react-markdown, remark-gfm, Vite.

## Global Constraints

- Apply Markdown only to station-message body content.
- Keep titles, summaries, risk copy, button labels, and all Push content as plain text.
- Do not render raw HTML or executable code.
- Allow Markdown links only for `https://`, `http://`, and `forxfinance://` URLs.
- Preserve existing `LocalizedMessageContent.web.body: string` storage and old plain-text compatibility.
- Per user instruction, do not run automated tests or the production build.

---

### Task 1: Install safe Markdown rendering dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [x] **Step 1: Install dependencies**

Run: `npm install react-markdown remark-gfm`

Expected: both packages appear in `dependencies` and the lockfile is updated.

- [x] **Step 2: Commit dependencies**

Commit: `build: add markdown rendering dependencies`

### Task 2: Build shared Markdown components

**Files:**
- Create: `src/components/MarkdownContent.tsx`
- Create: `src/components/MarkdownEditor.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: `MarkdownContent({ value, emptyText?, compact? })`
- Produces: `MarkdownEditor({ value, onChange, placeholder?, minRows?, readOnly? })`

- [x] **Step 1: Implement safe Markdown rendering**

Use `ReactMarkdown` with `remarkGfm`, `skipHtml`, a URL transform that only returns allowed protocols, disabled remote image rendering, safe external link attributes, scoped class names, and an error boundary that falls back to plain text.

- [x] **Step 2: Implement controlled Markdown editing**

Use Arco `Input.TextArea` with `RefTextAreaType` to insert or wrap selected text. Provide toolbar actions for H2, bold, italic, unordered list, ordered list, quote, link, inline code, and fenced code; provide “编辑 / 分屏预览” modes and a character count.

- [x] **Step 3: Add scoped editor and renderer styles**

Style toolbars, split panes, tables, quotes, lists, links, code, source blocks, compact phone rendering, and responsive single-column fallback under the existing global stylesheet.

- [x] **Step 4: Run static whitespace check and commit**

Run: `git diff --check`

Expected: no output.

Commit: `feat: add shared inbox markdown components`

### Task 3: Connect authoring and previews

**Files:**
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/components/MessagePreview.tsx`

**Interfaces:**
- Consumes: `MarkdownEditor` from Task 2.
- Consumes: `MarkdownContent` from Task 2.

- [x] **Step 1: Replace template station-body textarea**

Use `MarkdownEditor` for `content.web.body`. Because manual, event, and shared templates use the same drawer, this covers every template scope without branching.

- [x] **Step 2: Replace temporary task station-body textarea**

Use `MarkdownEditor` for `temporary.web.body` while preserving the channel-first conditional display added previously.

- [x] **Step 3: Render station-message previews as Markdown**

Replace the Web and App station-message body `<p>` elements in `MessagePreview` with `MarkdownContent`; leave Push rendering untouched.

- [x] **Step 4: Run static whitespace check and commit**

Run: `git diff --check`

Expected: no output.

Commit: `feat: author station messages in markdown`

### Task 4: Connect translation review and published source viewing

**Files:**
- Modify: `src/pages/approvals/TranslationReviewDrawer.tsx`
- Modify: `src/pages/templates/TemplateReadOnlyDetails.tsx`

**Interfaces:**
- Consumes: `MarkdownEditor` and `MarkdownContent` from Task 2.

- [x] **Step 1: Add Markdown translation comparison**

Show source Markdown in a read-only source block plus rendered `MarkdownContent`, and replace the target-language body textarea with `MarkdownEditor`. Keep title, summary, reason, variables, and approval actions unchanged.

- [x] **Step 2: Add published Markdown source disclosure**

Below the existing rendered template preview, add a native disclosure containing the stored Markdown source. Keep approved templates read-only.

- [x] **Step 3: Run static whitespace check and commit**

Run: `git diff --check`

Expected: no output.

Commit: `feat: review and inspect markdown source`

### Task 5: Align PRD and close the plan

**Files:**
- Modify: `docs/prd/message-center/03-消息模板与多语言.md`
- Modify: `docs/superpowers/plans/2026-07-16-inbox-markdown-authoring.md`

- [x] **Step 1: Document Markdown authoring rules**

Document supported scopes, stored source, safe rendering, translation structure preservation, Push exclusion, and read-only source access.

- [x] **Step 2: Mark the plan complete and run allowed static checks**

Mark all checkboxes complete and run `git diff --check`. Do not run tests or `npm run build`.

- [x] **Step 3: Commit documentation**

Commit: `docs: define station message markdown rules`
