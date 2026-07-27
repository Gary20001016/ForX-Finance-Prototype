# Web Message Center Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Web message center as a dark standalone exchange page with left-side categories, a flat message list, and a right-side detail drawer.

**Architecture:** Keep the existing static HTML data and JavaScript state model in `html/message-center-web.html`. Replace the page shell and CSS while preserving the public interaction functions used by inline handlers.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript.

## Global Constraints

- Do not change `html/message-center-app.html` visual behavior.
- Keep the six existing primary message categories and their compact topics.
- Keep search, unread filtering, mark-all-read, message detail, and query-parameter preview behavior.
- Do not add runtime dependencies or remote assets.

---

### Task 1: Replace the Web page shell

**Files:**
- Modify: `html/message-center-web.html`

**Interfaces:**
- Consumes: Existing element IDs used by the render functions.
- Produces: Platform header, category sidebar, message toolbar, flat list container, and existing detail drawer.

- [ ] **Step 1: Preserve the current JavaScript hooks**

Keep these IDs in the replacement markup: `unreadSummary`, `searchInput`, `readAllButton`, `categoryTabs`, `topics`, `unreadFilter`, `riskBanner`, `riskTitle`, `riskSummary`, `riskAction`, `messageList`, `drawerMask`, `drawerMeta`, `drawerTitle`, `drawerSummary`, `drawerRisk`, `drawerBody`, `drawerAction`, and `toast`.

- [ ] **Step 2: Replace the three-column application shell**

Replace the old product sidebar, content card, and summary sidebar with:

```html
<header class="platform-header">...</header>
<main class="message-page">
  <header class="page-heading">...</header>
  <div class="message-layout">
    <aside class="category-panel">...</aside>
    <section class="message-content">...</section>
  </div>
</main>
```

- [ ] **Step 3: Verify static structure**

Run:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('html/message-center-web.html','utf8');for(const id of ['categoryTabs','messageList','drawerMask'])if(!s.includes('id=\"'+id+'\"'))process.exit(1)"
```

Expected: exit code 0.

### Task 2: Apply the dark exchange visual system

**Files:**
- Modify: `html/message-center-web.html`

**Interfaces:**
- Consumes: Markup from Task 1.
- Produces: Responsive Aster-style layout and Apex-style drawer.

- [ ] **Step 1: Replace old layout styles**

Use a centered 1320px content area, 220px category panel, flat list rows, `#0b0b0d` background, fine borders, and `#69f0a0` active/unread color.

- [ ] **Step 2: Remove card and icon styling**

Remove the message category icon from rendered rows and eliminate `list-card`, `unread-card`, and summary-panel visual dependencies.

- [ ] **Step 3: Add responsive rules**

At widths below 900px, move categories into a horizontal row. At widths below 640px, stack heading actions and expand the drawer to full width.

### Task 3: Adapt rendering to the new flat list

**Files:**
- Modify: `html/message-center-web.html`

**Interfaces:**
- Consumes: Existing `messages`, `groupConfig`, `selectedGroup`, `selectedTopic`, and `unreadOnly`.
- Produces: Flat message rows with category/topic metadata, risk label, title, summary, time, and unread indicator.

- [ ] **Step 1: Update `renderTabs()`**

Render the six categories into the left panel and retain unread counts.

- [ ] **Step 2: Update `renderMessages()`**

Render each message without a category icon:

```html
<button class="message">
  <span class="message-copy">
    <span class="message-meta">...</span>
    <strong class="message-title">...</strong>
    <span class="message-summary">...</span>
  </span>
  <span class="message-status">...</span>
</button>
```

- [ ] **Step 3: Preserve all event handlers**

Keep `selectGroup`, `selectTopic`, `toggleUnread`, `markAllRead`, `openDetail`, `closeDetail`, and `forceCloseDetail` signatures unchanged.

### Task 4: Validate the standalone page

**Files:**
- Verify: `html/message-center-web.html`

**Interfaces:**
- Consumes: Completed Web page.
- Produces: A loadable standalone page with working interactions.

- [ ] **Step 1: Run the embedded script syntax check**

Run:

```bash
node -e "const fs=require('fs'),vm=require('vm');const s=fs.readFileSync('html/message-center-web.html','utf8');const js=[...s.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)].map(m=>m[1]).filter(Boolean).join('\\n');new vm.Script(js)"
```

Expected: exit code 0.

- [ ] **Step 2: Confirm the preview server response**

Run:

```bash
curl -fsS http://127.0.0.1:5180/message-center-web.html | grep -q "消息中心"
```

Expected: exit code 0.

- [ ] **Step 3: Inspect the page at desktop width**

Open `http://127.0.0.1:5180/message-center-web.html` and confirm the category panel, flat list, search controls, and detail drawer fit without horizontal overflow.
