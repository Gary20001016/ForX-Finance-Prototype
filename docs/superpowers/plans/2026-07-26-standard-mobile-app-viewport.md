# Standard Mobile App Viewport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the App message-center HTML render as a standard `390 × 844` phone page with internal scrolling and phone-scoped fixed layers.

**Architecture:** `.phone` becomes the clipped visual viewport. A new `.phone-scroll` child owns vertical scrolling, while sticky top content, bottom navigation, detail overlay, bottom sheet, and toast remain positioned within the phone viewport.

**Tech Stack:** Standalone HTML, CSS, and vanilla JavaScript.

## Global Constraints

- Desktop phone width is exactly `390px`.
- Desktop phone maximum height is `844px`.
- Mobile layout fills `100% × 100dvh`.
- Existing DOM IDs and JavaScript interactions remain unchanged.
- Web HTML is not modified.

---

### Task 1: Restructure the App viewport

**Files:**
- Modify: `html/message-center-app.html`

**Interfaces:**
- Consumes: existing message-center DOM IDs and event handlers.
- Produces: `.phone-scroll` and `.top-shell` layout containers without changing JavaScript selectors.

- [ ] **Step 1: Add viewport containers**

Wrap the status bar, header, and primary tabs in:

```html
<div class="phone-scroll">
  <div class="top-shell">...</div>
  ...
</div>
```

Keep bottom navigation, overlay, sheet, and toast inside `.phone` but outside `.phone-scroll`.

- [ ] **Step 2: Add standard viewport CSS**

Use:

```css
.phone {
  width: 390px;
  height: min(844px, calc(100dvh - 32px));
  position: relative;
  overflow: hidden;
}
.phone-scroll {
  height: 100%;
  overflow-y: auto;
}
```

Use `position: absolute` for phone-scoped bottom navigation, overlay, and toast.

- [ ] **Step 3: Add full-screen mobile override**

```css
@media (max-width: 599px) {
  .phone {
    width: 100%;
    height: 100dvh;
    border: 0;
    border-radius: 0;
  }
}
```

- [ ] **Step 4: Verify structure and CSS**

Run:

```bash
node - <<'NODE'
const fs = require("fs");
const source = fs.readFileSync("html/message-center-app.html", "utf8");
for (const fragment of [
  'class="phone-scroll"',
  'class="top-shell"',
  'width: 390px',
  'height: min(844px, calc(100dvh - 32px))',
  'height: 100dvh',
]) {
  if (!source.includes(fragment)) throw new Error(`missing ${fragment}`);
}
NODE
```

Expected: exit code `0`.
