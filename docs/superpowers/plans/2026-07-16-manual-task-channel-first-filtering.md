# Manual Task Channel-First Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move artificial-message channel selection into “内容与多语言” and make the selected channels drive template availability, temporary content, translation readiness, preview, and the read-only sending-strategy summary.

**Architecture:** Keep the selected channel list as explicit state in `CreateTaskPage` so every step consumes one source of truth. Isolate template coverage and channel equality in a small policy module, and make `MessagePreview` channel-aware through an optional prop that preserves existing callers.

**Tech Stack:** React 18, TypeScript, Arco Design React, Zustand-style prototype store, Vite.

## Global Constraints

- At least one of `站内信` or `Push` must be selected.
- A template is available when its channels cover every selected task channel.
- Dual-channel templates may be used for a single-channel task; single-channel templates may not be used for a dual-channel task.
- Temporary content, validation, translation scope, preview, and App Push checks only apply to selected channels.
- Do not change message-category-derived nature, audience, scheduling, or frequency-control behavior.
- Per user instruction, do not run automated tests for this change.

---

### Task 1: Add channel policy and channel-aware preview

**Files:**
- Create: `src/pages/tasks/taskChannelPolicy.ts`
- Modify: `src/components/MessagePreview.tsx`

**Interfaces:**
- Produces: `templateCoversChannels(templateChannels: Channel[], selectedChannels: Channel[]): boolean`
- Produces: `sameChannels(left: Channel[], right: Channel[]): boolean`
- Produces: `MessagePreview({ content, compact?, channels? })`, where omitted `channels` preserves both previews.

- [ ] **Step 1: Add the task channel policy**

```ts
import type { Channel } from "../../domain/types";

export const templateCoversChannels = (
  templateChannels: Channel[],
  selectedChannels: Channel[],
) =>
  selectedChannels.length > 0 &&
  selectedChannels.every((channel) => templateChannels.includes(channel));

export const sameChannels = (left: Channel[], right: Channel[]) =>
  left.length === right.length &&
  left.every((channel) => right.includes(channel));
```

- [ ] **Step 2: Make message preview conditional by channel**

Add `channels?: Channel[]`, default it to `["站内信", "Push"]`, render Web and App inbox sections only when `channels.includes("站内信")`, and render the Push section only when `channels.includes("Push")`.

- [ ] **Step 3: Check formatting and commit**

Run: `git diff --check`

Expected: no output.

Commit: `feat: add task channel display policy`

### Task 2: Move channels into content authoring

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx`

**Interfaces:**
- Consumes: `templateCoversChannels` and `sameChannels` from Task 1.
- Consumes: channel-aware `MessagePreview` from Task 1.

- [ ] **Step 1: Introduce a single channel state**

Initialize `selectedChannels` with `copiedTask?.channels || ["站内信", "Push"]`; replace the form/snapshot-derived channel value with this state.

- [ ] **Step 2: Filter templates by coverage**

Keep the existing published/manual eligibility filter as the base list, then filter it with:

```ts
templateCoversChannels(template.channels, selectedChannels)
```

When channels change and the current template no longer covers them, set `templateId` to the first compatible template ID.

- [ ] **Step 3: Add channel selection to step 1**

Place a controlled `Checkbox.Group` after task basics and before content source. Show the explanatory copy “先确定发送渠道，模板、临时内容、多语言和预览将按渠道筛选。” Block Next when the list is empty.

- [ ] **Step 4: Make temporary content channel-specific**

Render the station-message editor only for `站内信`; render the Push editor only for `Push`. Validate only selected channel fields, save temporary templates with `channels: selectedChannels`, and select source translation fields from the active channel for single-channel tasks.

- [ ] **Step 5: Invalidate stale translation scope**

Track the channels used by the latest temporary translation batch. If channels change after batch creation, mark translation readiness false and show “发送渠道已变更，请重新创建机翻任务”. A new batch records the current channels and restores the normal translation gate.

- [ ] **Step 6: Filter template and temporary previews**

Pass `channels={selectedChannels}` to every `MessagePreview` in the task authoring page. If no compatible approved template exists, show a warning and block Next until channels change or temporary content is selected.

- [ ] **Step 7: Make step 3 read-only**

Remove the `正式渠道` checkbox. Render selected channels as tags, and render the `App Push 正式发送检查` alert only when Push is selected.

- [ ] **Step 8: Check formatting and commit**

Run: `git diff --check`

Expected: no output.

Commit: `feat: filter manual task content by channel`

### Task 3: Align PRD and perform non-test verification

**Files:**
- Modify: `docs/prd/message-center/02-消息任务.md`

**Interfaces:**
- Documents the final operator workflow implemented in Tasks 1 and 2.

- [ ] **Step 1: Document the channel-first workflow**

Add that channels are selected in “内容与多语言”, filter eligible templates by channel coverage, constrain temporary content and translation, and become read-only in “发送策略”.

- [ ] **Step 2: Perform allowed static checks**

Run: `git diff --check`

Expected: no output. Do not run automated tests or `npm run build` because the user explicitly requested no testing.

- [ ] **Step 3: Commit documentation**

Commit: `docs: align manual task channel workflow`
