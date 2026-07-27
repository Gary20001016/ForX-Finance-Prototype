# App Inbox Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove list icons and replace the App bottom-sheet message preview with a full in-app message-detail page.

**Architecture:** Keep list filtering and read-state logic unchanged. Replace the overlay/sheet DOM with an absolute `.detail-page` inside the phone canvas and update `openDetail`/`closeDetail` to navigate between list and detail states.

**Tech Stack:** Standalone HTML, CSS, and vanilla JavaScript.

## Global Constraints

- Do not modify the Web HTML.
- Do not display any message logo or icon.
- Preserve existing message IDs and filter behavior.
- Keep the detail page inside the standard phone canvas.

---

### Task 1: Text-only message rows

**Files:**
- Modify: `html/message-center-app.html`

- [ ] Remove `.message-icon` rendering from `renderMessages`.
- [ ] Change `.message` to a two-column content/trailing-state grid.
- [ ] Remove unused category-icon CSS and `groupIcon`.
- [ ] Remove the redundant list heading from `renderMessages` and its unused `.day-label` styles.

### Task 2: Full inbox detail page

**Files:**
- Modify: `html/message-center-app.html`

- [ ] Replace overlay/sheet markup with `.detail-page`.
- [ ] Add a sticky detail header, independently scrollable body, and optional bottom action.
- [ ] Update `openDetail` to populate and open the full page.
- [ ] Update `closeDetail` to return to the list and refresh unread state.
- [ ] Show the action only when both `action` and `targetUrl` exist.

### Task 3: Verification

- [ ] Confirm `message-icon` and `detailOverlay` are absent.
- [ ] Confirm `detailPage`, `detailScroll`, `openDetail`, and `closeDetail` are present.
- [ ] Confirm the local preview server returns the updated structure.
