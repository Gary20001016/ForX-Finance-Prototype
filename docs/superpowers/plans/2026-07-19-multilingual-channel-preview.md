# Multilingual Channel Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow every language in the multilingual progress drawer to preview its latest Web inbox, App inbox, and App Push output for the channels selected by the originating message.

**Architecture:** Add optional channel-aware layers to translation batches and items while retaining the existing flat translation fields for compatibility. Resolve preview content through one pure helper, then render the resolved `LocalizedMessageContent` with the existing `MessagePreview` component from a dedicated per-language preview view.

**Tech Stack:** React 19, TypeScript, Arco Design React, Vitest, Testing Library, existing prototype store.

## Global Constraints

- Every language row exposes a preview action regardless of translation or review status.
- Preview content priority is approved output, then human draft, then machine output.
- Preview renders only the formal channels recorded for the originating message.
- Special-language review limits editing and approval, never preview access.
- A language without returned content shows an explicit empty state and never presents source text as a translation.
- Existing flat translation records remain previewable through a compatibility fallback.

---

### Task 1: Channel-aware translation model and preview resolver

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/pages/multilingual/resolveMultilingualPreview.ts`
- Create: `src/pages/multilingual/resolveMultilingualPreview.test.ts`

**Interfaces:**
- Consumes: `Channel`, `LocalizedMessageContent`, `TranslationBatch`, and `TranslationItem`.
- Produces: `TranslationChannelContent`, optional channel-layer fields, and `resolveMultilingualPreview(batch, item, fallbackContent?, fallbackChannels?)` returning `{ content?: LocalizedMessageContent; channels: Channel[] }`.

- [ ] **Step 1: Write failing resolver tests**

```ts
it("prefers approved channel output and preserves channel metadata", () => {
  const result = resolveMultilingualPreview(batch, item, sourceContent);
  expect(result.content?.web.title).toBe("Approved inbox");
  expect(result.content?.push.title).toBe("Approved push");
  expect(result.content?.push.deepLink).toBe("forxfinance://security/devices");
});

it("falls back to legacy fields without inventing a missing result", () => {
  expect(resolveMultilingualPreview(batch, legacyItem).content?.web.title).toBe("Legacy title");
  expect(resolveMultilingualPreview(batch, noResultItem).content).toBeUndefined();
});
```

- [ ] **Step 2: Run resolver tests and verify RED**

Run: `npm test -- --run src/pages/multilingual/resolveMultilingualPreview.test.ts`

Expected: FAIL because `resolveMultilingualPreview` and channel-aware fields do not exist.

- [ ] **Step 3: Add channel-aware types and minimal resolver**

```ts
export interface TranslationChannelContent {
  web?: Partial<WebMessageContent>;
  push?: Partial<PushMessageContent>;
}

export function resolveMultilingualPreview(
  batch: TranslationBatch,
  item: TranslationItem,
  fallbackContent?: LocalizedMessageContent,
  fallbackChannels: Channel[] = ["站内信", "Push"],
) {
  const layer =
    item.approvedChannelOutput ||
    item.humanChannelDraft ||
    item.machineChannelOutput;
  // Merge translated text with frozen source metadata. Use legacy layers only
  // when a returned legacy translation contains title, summary, or body.
}
```

- [ ] **Step 4: Run resolver tests and verify GREEN**

Run: `npm test -- --run src/pages/multilingual/resolveMultilingualPreview.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit model and resolver**

```bash
git add src/domain/types.ts src/pages/multilingual/resolveMultilingualPreview.ts src/pages/multilingual/resolveMultilingualPreview.test.ts
git commit -m "feat: resolve multilingual channel previews"
```

### Task 2: Persist channel-aware translation layers

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/store/prototypeStore.test.ts`
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`

**Interfaces:**
- Consumes: `TranslationChannelContent` from Task 1.
- Produces: `createTranslationBatch` inputs with optional `channels` and `sourceChannelContent`; approval and draft functions that mirror edited legacy text into the active channel layer.

- [ ] **Step 1: Write failing store tests**

```ts
it("freezes selected channels and creates channel-specific machine output", () => {
  const batch = createTranslationBatch({
    subject,
    sourceLocale: "zh-CN",
    sourceContent: { title: "Inbox", summary: "Summary", body: "Body" },
    sourceChannelContent,
    channels: ["站内信", "Push"],
    targetLocales: ["en-US"],
    createdBy: "Gary Ma",
  });
  expect(batch.channels).toEqual(["站内信", "Push"]);
  expect(batch.items[0].machineChannelOutput?.push?.title).toContain("en-US");
});
```

- [ ] **Step 2: Run store tests and verify RED**

Run: `npm test -- --run src/store/prototypeStore.test.ts`

Expected: FAIL because the input and batch do not contain channel-aware data.

- [ ] **Step 3: Extend translation creation and review persistence**

Update generalized and legacy translation creation to freeze `channels` and `sourceChannelContent`. Populate `machineChannelOutput` for each selected channel. When saving or approving the current flat editor values, update the corresponding channel-aware layer while preserving the other channel metadata.

- [ ] **Step 4: Pass complete source content from template and task creation**

```ts
createTranslationBatch({
  subject,
  sourceLocale,
  sourceContent,
  sourceChannelContent: content,
  channels,
  targetLocales,
  createdBy: "Gary Ma",
});
```

- [ ] **Step 5: Run store and creation-page tests**

Run: `npm test -- --run src/store/prototypeStore.test.ts src/pages/templates/TemplateEditorDrawer.single-language.test.tsx src/pages/tasks/CreateTaskPage.single-language.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit persistence changes**

```bash
git add src/store/prototypeStore.ts src/store/prototypeStore.test.ts src/pages/templates/TemplateEditorDrawer.tsx src/pages/tasks/CreateTaskPage.tsx
git commit -m "feat: persist multilingual channel content"
```

### Task 3: Per-language rendered preview interaction

**Files:**
- Modify: `src/pages/multilingual/MultilingualProgressDrawer.tsx`
- Create: `src/pages/multilingual/MultilingualMessagePreview.tsx`
- Modify: `src/pages/multilingual/MultilingualProgress.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `resolveMultilingualPreview` from Task 1 and existing `MessagePreview`.
- Produces: a `MultilingualMessagePreview` component with `batch` and `item` props and a row-level “预览” action.

- [ ] **Step 1: Write failing drawer interaction tests**

```tsx
expect(screen.getAllByRole("button", { name: "预览" })).toHaveLength(batch.items.length);
fireEvent.click(screen.getAllByRole("button", { name: "预览" })[0]);
expect(screen.getByLabelText("Web 站内信预览")).toBeVisible();
expect(screen.getByLabelText("App 站内信预览")).toBeVisible();
expect(screen.getByLabelText("App Push 预览")).toBeVisible();
```

Add coverage for an approved language, a special-review language, a legacy language, and a no-result language.

- [ ] **Step 2: Run drawer tests and verify RED**

Run: `npm test -- --run src/pages/multilingual/MultilingualProgress.test.tsx`

Expected: FAIL because language rows do not expose rendered preview actions.

- [ ] **Step 3: Implement preview view switching**

Track `{ itemId, mode: "content" | "preview" }`. Keep “查看译文” for the comparison/editor panel and add “预览” for `MultilingualMessagePreview`. Switching language or mode replaces the currently expanded panel.

- [ ] **Step 4: Render resolved content and empty state**

```tsx
const resolved = resolveMultilingualPreview(batch, item, template?.content, template?.channels);
return resolved.content ? (
  <MessagePreview content={resolved.content} channels={resolved.channels} showPushPriority={false} />
) : (
  <Alert type="info" showIcon title="暂无可预览内容" />
);
```

- [ ] **Step 5: Run multilingual UI tests and verify GREEN**

Run: `npm test -- --run src/pages/multilingual/MultilingualProgress.test.tsx src/pages/multilingual/MultilingualProgressDrawer.direct-source.test.tsx`

Expected: PASS. If the second file is absent, run all files returned by `rg --files src/pages/multilingual | rg 'test\\.(ts|tsx)$'`.

- [ ] **Step 6: Run regression suite and build**

Run: `npm test -- --run src/pages/multilingual src/pages/templates src/pages/tasks src/store/prototypeStore.test.ts`

Run: `npm run build`

Expected: all tests PASS and build exits with code 0.

- [ ] **Step 7: Commit UI changes**

```bash
git add src/pages/multilingual/MultilingualProgressDrawer.tsx src/pages/multilingual/MultilingualMessagePreview.tsx src/pages/multilingual/MultilingualProgress.test.tsx src/styles.css
git commit -m "feat: preview every translated language"
```

