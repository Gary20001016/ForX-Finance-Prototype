# 单语言直接编写与语言审核 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让消息模板和人工任务临时消息支持直接使用日语等语言编写单语言内容；不创建伪机翻任务，并按语言策略进入专项原文审核。

**Architecture:** 在现有 `TranslationBatch` / `TranslationItem` 上增加语言生产模式，旧批次默认归类为外部机翻，新建单语言专项审核批次使用 `direct_source_review`。模板编辑器和临时消息编辑器根据“是否存在目标语言”和“默认语言是否需要专项审核”选择外部机翻、原文审核或直接完成语言准备；进度与审核组件根据生产模式切换语义和字段。

**Tech Stack:** React 18、TypeScript 5.9、Arco Design React 2.66、Vitest 3.2、Testing Library、Vite 7。

## Global Constraints

- 默认语言可选择 `zh-CN`、`en-US`、`zh-TW`、`ja-JP`、`ko-KR`、`es-ES`、`tr-TR`、`ru-RU`、`fr-FR`、`de-DE`。
- 目标语言允许为空，且不得包含默认语言。
- 有目标语言时继续使用外部异步机翻流程。
- 无目标语言且默认语言需要专项审核时，创建原文审核批次，不创建外部任务 ID。
- 无目标语言且默认语言不需要专项审核时，语言准备直接完成。
- 日语原文专项审核只能在“多语言审核”页签执行。
- 临时消息审核结果只关联当前人工任务内容版本，不成为可复用模板。
- 站内信和 App Push 的内容编辑、校验与预览继续跟随正式渠道选择。
- 业务状态继续保持“无结果、翻译返回待审核、已通过”三状态；“原文待审核”只作为直接编写模式的界面文案。

---

### Task 1: 增加单语言生产模式和原文审核批次

**Files:**
- Modify: `src/domain/types.ts:264-344`
- Modify: `src/store/prototypeStore.ts:103-145`
- Modify: `src/store/prototypeStore.ts:919-1045`
- Test: `src/store/prototypeStore.test.ts:139-260`

**Interfaces:**
- Produces: `LanguageProductionMode = "machine_translation" | "direct_source_review"`
- Produces: `getLanguageReviewPolicy(locale: string): LanguageReviewPolicy | undefined`
- Produces: `requiresSpecialLanguageReview(locale: string): boolean`
- Produces: `prepareSingleLanguageContent(input: SingleLanguagePreparationInput): { requiresReview: boolean; batch?: TranslationBatch }`
- Consumes: existing `TranslationSubjectType`, `TranslationContentLayer`, `LanguageReviewPolicy`, `update()` store mutation helper.

- [ ] **Step 1: Write failing store tests for direct source review and direct completion**

Add these imports and cases to `src/store/prototypeStore.test.ts`:

```ts
import {
  prepareSingleLanguageContent,
  requiresSpecialLanguageReview,
} from "./prototypeStore";

it("creates a direct source review batch for a special-review source locale", () => {
  const result = prepareSingleLanguageContent({
    subject: {
      type: "manual_task_content",
      id: "TASK-JA-001",
      name: "日本語の臨時メッセージ",
      version: "draft-1",
      returnPath: "/tasks/create",
    },
    sourceLocale: "ja-JP",
    sourceContent: {
      title: "出金完了",
      summary: "出金処理が完了しました。",
      body: "詳細をご確認ください。",
    },
    createdBy: "operator-01",
  });

  expect(result.requiresReview).toBe(true);
  expect(result.batch).toMatchObject({
    productionMode: "direct_source_review",
    sourceLocale: "ja-JP",
    targetLocales: [],
    status: "翻译返回待审核",
  });
  expect(result.batch?.items[0]).toMatchObject({
    productionMode: "direct_source_review",
    sourceLocale: "ja-JP",
    targetLocale: "ja-JP",
    attemptNo: 0,
    status: "翻译返回待审核",
    externalTaskId: undefined,
    specialReviewRequired: true,
    humanDraft: {
      title: "出金完了",
      summary: "出金処理が完了しました。",
      body: "詳細をご確認ください。",
    },
  });
});

it("completes language preparation without a batch for an ordinary single language", () => {
  const result = prepareSingleLanguageContent({
    subject: {
      type: "template_version",
      id: "TPL-1001",
      name: "单语言中文模板",
      version: "v12",
      returnPath: "/templates",
    },
    sourceLocale: "zh-CN",
    sourceContent: { title: "系统公告", summary: "摘要", body: "正文" },
    createdBy: "operator-01",
  });

  expect(result).toEqual({ requiresReview: false, batch: undefined });
  expect(
    getPrototypeState().templates.find((item) => item.id === "TPL-1001"),
  ).toMatchObject({
    translationReadiness: "已通过",
    locales: ["zh-CN"],
  });
});

it("uses the configured language policy for direct source review", () => {
  expect(requiresSpecialLanguageReview("ja-JP")).toBe(true);
  expect(requiresSpecialLanguageReview("zh-CN")).toBe(false);
});

it("reuses the effective direct review batch for identical source content", () => {
  const input = {
    subject: {
      type: "manual_task_content" as const,
      id: "TASK-JA-IDEMPOTENT",
      name: "日本語メッセージ",
      version: "draft-1",
      returnPath: "/tasks/create",
    },
    sourceLocale: "ja-JP",
    sourceContent: { title: "通知", summary: "概要", body: "本文" },
    createdBy: "operator-01",
  };
  const first = prepareSingleLanguageContent(input);
  const second = prepareSingleLanguageContent(input);

  expect(second.batch?.id).toBe(first.batch?.id);
  expect(
    getPrototypeState().translationBatches.filter(
      (batch) => batch.subjectId === "TASK-JA-IDEMPOTENT",
    ),
  ).toHaveLength(1);
});
```

- [ ] **Step 2: Run the focused store tests and verify failure**

Run:

```bash
npm test -- --run src/store/prototypeStore.test.ts
```

Expected: FAIL because `prepareSingleLanguageContent`, `requiresSpecialLanguageReview`, and `productionMode` do not exist.

- [ ] **Step 3: Add the production-mode domain fields**

Update `src/domain/types.ts`:

```ts
export type LanguageProductionMode =
  | "machine_translation"
  | "direct_source_review";

export interface TranslationItem {
  // existing fields
  productionMode?: LanguageProductionMode;
  externalTaskId?: string;
  // existing fields
}

export interface TranslationBatch {
  // existing fields
  productionMode?: LanguageProductionMode;
  // existing fields
}
```

The properties remain optional only for legacy mock/local-storage compatibility. Every newly created batch and item must set `productionMode` explicitly.

- [ ] **Step 4: Normalize legacy batches as machine translation**

In `normalizeTranslationBatches`, set batch and item production mode while preserving direct-review data:

```ts
const productionMode = batch.productionMode || "machine_translation";

const items = batch.items
  .filter((item) => String(item.status) !== "已取消")
  .map((item) => ({
    ...item,
    productionMode: item.productionMode || productionMode,
    // existing normalization fields
  }));

return {
  ...batch,
  productionMode,
  // existing normalized fields
  items,
};
```

- [ ] **Step 5: Implement language policy lookup and direct source preparation**

Add beside `createTranslationBatch` in `src/store/prototypeStore.ts`:

```ts
export const getLanguageReviewPolicy = (locale: string) =>
  state.languageReviewPolicies.find((policy) => policy.localeCode === locale);

export const requiresSpecialLanguageReview = (locale: string) => {
  const policy = getLanguageReviewPolicy(locale);
  return Boolean(policy?.enabled && policy.specialReviewRequired);
};

type SingleLanguagePreparationInput = {
  subject: {
    type: TranslationSubjectType;
    id: string;
    name: string;
    version: string;
    returnPath: string;
  };
  sourceLocale: string;
  sourceContent: TranslationContentLayer;
  createdBy: string;
};

export const prepareSingleLanguageContent = (
  input: SingleLanguagePreparationInput,
): { requiresReview: boolean; batch?: TranslationBatch } => {
  const policy = getLanguageReviewPolicy(input.sourceLocale);
  if (policy?.specialReviewRequired && (!policy.enabled || !policy.reviewGroup)) {
    throw new Error(`${input.sourceLocale} 的专项语言审核配置不可用`);
  }

  if (!requiresSpecialLanguageReview(input.sourceLocale)) {
    if (input.subject.type === "template_version") {
      update((current) => ({
        ...current,
        templates: current.templates.map((template) =>
          template.id === input.subject.id
            ? {
                ...template,
                translationBatchId: "",
                translationReadiness: "已通过",
                locales: [input.sourceLocale],
                content: template.content
                  ? {
                      ...template.content,
                      sourceLocale: input.sourceLocale,
                      locales: [input.sourceLocale],
                    }
                  : template.content,
                status: "待业务审核",
                updatedAt: "刚刚",
              }
            : template,
        ),
      }));
    }
    return { requiresReview: false, batch: undefined };
  }

  const sourceContentHash = JSON.stringify([
    input.sourceLocale,
    input.sourceContent.title || "",
    input.sourceContent.summary || "",
    input.sourceContent.body || "",
  ]);
  const existing = state.translationBatches.find(
    (batch) =>
      batch.productionMode === "direct_source_review" &&
      batch.subjectType === input.subject.type &&
      batch.subjectId === input.subject.id &&
      batch.sourceLocale === input.sourceLocale &&
      batch.items[0]?.sourceContentHash === sourceContentHash,
  );
  if (existing) return { requiresReview: true, batch: existing };

  const stamp = Date.now().toString().slice(-7);
  const batchId = `LR-${stamp}`;
  const item: TranslationItem = {
    id: `LRI-${stamp}`,
    batchId,
    templateId: input.subject.id,
    templateName: input.subject.name,
    subjectType: input.subject.type,
    subjectId: input.subject.id,
    subjectName: input.subject.name,
    sourceLocale: input.sourceLocale,
    targetLocale: input.sourceLocale,
    productionMode: "direct_source_review",
    attemptNo: 0,
    status: "翻译返回待审核",
    sourceContentHash,
    humanDraft: { ...input.sourceContent },
    submittedAt: "刚刚",
    submitter: input.createdBy,
    variablesValid: true,
    specialReviewRequired: true,
    reviewGroup: policy?.reviewGroup,
    reviewSlaHours: policy?.reviewSlaHours,
  };
  const batch: TranslationBatch = {
    id: batchId,
    productionMode: "direct_source_review",
    subjectType: input.subject.type,
    subjectId: input.subject.id,
    subjectName: input.subject.name,
    contentVersion: input.subject.version,
    returnPath: input.subject.returnPath,
    templateId: input.subject.id,
    templateVersion: input.subject.version,
    sourceLocale: input.sourceLocale,
    targetLocales: [],
    status: "翻译返回待审核",
    createdBy: input.createdBy,
    createdAt: "刚刚",
    updatedAt: "刚刚",
    sourceContent: { ...input.sourceContent },
    items: [item],
  };

  update((current) => ({
    ...current,
    translationBatches: [batch, ...current.translationBatches],
    templates: current.templates.map((template) =>
      input.subject.type === "template_version" &&
      template.id === input.subject.id
        ? {
            ...template,
            translationBatchId: batch.id,
            translationReadiness: "翻译返回待审核",
            locales: [input.sourceLocale],
            status: "审核中",
            updatedAt: "刚刚",
          }
        : template,
    ),
  }));
  return { requiresReview: true, batch };
};
```

Set `productionMode: "machine_translation"` on the batch and each item created by `createTranslationBatch`.

- [ ] **Step 6: Run store tests and commit**

Run:

```bash
npm test -- --run src/store/prototypeStore.test.ts src/domain/translationStatus.test.ts
```

Expected: both files PASS.

Commit:

```bash
git add src/domain/types.ts src/store/prototypeStore.ts src/store/prototypeStore.test.ts
git commit -m "feat: add direct source language review model"
```

---

### Task 2: 接入消息模板的单语言直写流程

**Files:**
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx:42-352`
- Create: `src/pages/templates/TemplateEditorDrawer.single-language.test.tsx`

**Interfaces:**
- Consumes: `prepareSingleLanguageContent(input)` and `requiresSpecialLanguageReview(locale)` from Task 1.
- Produces: template editor behavior for empty target languages, source-language filtering, and dynamic submission copy.

- [ ] **Step 1: Write failing template-editor tests**

Create `src/pages/templates/TemplateEditorDrawer.single-language.test.tsx`:

```tsx
import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  getPrototypeState,
  resetPrototypeStore,
} from "../../store/prototypeStore";
import TemplateEditorDrawer from "./TemplateEditorDrawer";

beforeEach(() => resetPrototypeStore());

it("submits a Japanese-only template to direct language review", async () => {
  const user = userEvent.setup();
  const onCreated = vi.fn();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="manual"
      onClose={() => undefined}
      onCreated={onCreated}
    />,
  );

  await user.type(screen.getByPlaceholderText("后台识别名称"), "日文单语言模板");
  await user.click(screen.getByText("zh-CN"));
  await user.click(screen.getByText("ja-JP"));
  await user.type(screen.getByLabelText("站内信标题"), "お知らせ");
  await user.type(screen.getByLabelText("站内信摘要"), "概要");
  await user.type(screen.getByLabelText("Markdown 站内信正文"), "本文");
  await user.type(screen.getByLabelText("Push 标题"), "お知らせ");
  await user.type(screen.getByLabelText("Push 正文"), "本文");

  expect(screen.getByText("单语言模板，无需机器翻译")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "提交语言审核" }));

  await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  const template = onCreated.mock.calls[0][0];
  expect(template.sourceLocale).toBe("ja-JP");
  expect(template.locales).toEqual(["ja-JP"]);
  expect(
    getPrototypeState().translationBatches.find(
      (batch) => batch.templateId === template.id,
    ),
  ).toMatchObject({ productionMode: "direct_source_review" });
});

it("removes the source locale from target languages", async () => {
  const user = userEvent.setup();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="manual"
      onClose={() => undefined}
    />,
  );
  await user.click(screen.getByText("zh-CN"));
  await user.click(screen.getByText("ja-JP"));
  expect(screen.queryByRole("option", { name: "ja-JP" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
npm test -- --run src/pages/templates/TemplateEditorDrawer.single-language.test.tsx
```

Expected: FAIL because the default-language options and single-language action do not exist.

- [ ] **Step 3: Add reactive source language and target filtering**

In `TemplateEditorDrawer.tsx`, replace the separate target-only constant with:

```ts
const supportedLocales = [
  "zh-CN", "en-US", "zh-TW", "ja-JP", "ko-KR",
  "es-ES", "tr-TR", "ru-RU", "fr-FR", "de-DE",
];
```

Add state and initialize it with the template:

```ts
const [sourceLocale, setSourceLocale] = useState("zh-CN");

useEffect(() => {
  const nextSourceLocale = template?.sourceLocale || "zh-CN";
  setSourceLocale(nextSourceLocale);
  setTargetLocales(
    (template?.locales || []).filter((locale) => locale !== nextSourceLocale),
  );
  // existing initialization
}, [template, visible, form, entryScope]);

const updateSourceLocale = (locale: string) => {
  setSourceLocale(locale);
  setTargetLocales((current) => current.filter((item) => item !== locale));
};
```

Bind the default-language select to `sourceLocale`, call `updateSourceLocale` from `onChange`, and build target options with `supportedLocales.filter(locale => locale !== sourceLocale)`.

- [ ] **Step 4: Replace boolean submit behavior with language-aware submission**

Use `save("draft" | "submit")`, and on submit choose exactly one branch:

```ts
if (mode === "submit") {
  if (targetLocales.length) {
    createTranslationBatch({
      templateId: entity.id,
      targetLocales,
      createdBy: "Gary Ma",
    });
  } else {
    prepareSingleLanguageContent({
      subject: {
        type: "template_version",
        id: entity.id,
        name: entity.name,
        version: entity.version,
        returnPath: "/templates",
      },
      sourceLocale,
      sourceContent: {
        title: channels.includes("站内信")
          ? content.web.title
          : content.push.title,
        summary: channels.includes("站内信")
          ? content.web.summary
          : undefined,
        body: channels.includes("站内信")
          ? content.web.body
          : content.push.body,
      },
      createdBy: "Gary Ma",
    });
  }
}
```

The payload must use `[sourceLocale, ...targetLocales]` for both template and content locales. Remove the old “请至少选择一个目标语言” validation.

- [ ] **Step 5: Add dynamic helper and primary-button copy**

Render these exact states:

```tsx
{targetLocales.length === 0 && (
  <Alert
    type="info"
    showIcon
    content={
      requiresSpecialLanguageReview(sourceLocale)
        ? "单语言模板，无需机器翻译；当前语言需要专项人工审核。"
        : "单语言模板，无需机器翻译；保存后可进入业务审核。"
    }
  />
)}
```

Primary button label:

```ts
const submitLabel = targetLocales.length
  ? "提交外部机翻"
  : requiresSpecialLanguageReview(sourceLocale)
    ? "提交语言审核"
    : "保存并进入业务审核";
```

Target select placeholder is `可留空，表示单语言模板`.

- [ ] **Step 6: Run template tests and commit**

Run:

```bash
npm test -- --run \
  src/pages/templates/TemplateEditorDrawer.single-language.test.tsx \
  src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx \
  src/pages/templates/TemplateEditorDrawer.test-send.test.tsx
```

Expected: all three files PASS.

Commit:

```bash
git add src/pages/templates/TemplateEditorDrawer.tsx src/pages/templates/TemplateEditorDrawer.single-language.test.tsx
git commit -m "feat: support single-language template authoring"
```

---

### Task 3: 接入临时消息的单语言直写流程

**Files:**
- Modify: `src/pages/tasks/CreateTaskPage.tsx:52-673`
- Create: `src/pages/tasks/CreateTaskPage.single-language.test.tsx`

**Interfaces:**
- Consumes: `prepareSingleLanguageContent`, `requiresSpecialLanguageReview` from Task 1.
- Produces: a `sourceLocale`-aware temporary message draft and a direct-review batch only when the selected source locale requires special review.

- [ ] **Step 1: Write failing task-page tests**

Create `src/pages/tasks/CreateTaskPage.single-language.test.tsx`:

```tsx
import { beforeEach, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  getPrototypeState,
  resetPrototypeStore,
} from "../../store/prototypeStore";
import CreateTaskPage from "./CreateTaskPage";

beforeEach(() => resetPrototypeStore());

it("creates a direct review batch for a Japanese-only temporary message", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);

  await user.click(screen.getByText("临时消息"));
  await user.click(screen.getByLabelText("临时消息默认语言"));
  await user.click(screen.getByText("ja-JP"));
  await user.type(screen.getByLabelText("站内信标题"), "お知らせ");
  await user.type(screen.getByRole("textbox", { name: "站内信摘要" }), "概要");
  await user.type(screen.getByLabelText("Markdown 站内信正文"), "本文");
  await user.type(screen.getByLabelText("Push 标题"), "お知らせ");
  await user.type(screen.getByLabelText("Push 正文"), "本文");

  expect(screen.getByText(/单语言临时消息，无需机器翻译/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "提交语言审核" }));

  await waitFor(() =>
    expect(
      getPrototypeState().translationBatches.find(
        (batch) => batch.subjectType === "manual_task_content",
      ),
    ).toMatchObject({
      productionMode: "direct_source_review",
      sourceLocale: "ja-JP",
      targetLocales: [],
    }),
  );
});

it("does not require a translation batch for an ordinary single-language temporary message", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);
  await user.click(screen.getByText("临时消息"));
  expect(screen.getByText(/单语言临时消息，无需机器翻译/)).toBeVisible();
  expect(screen.getByRole("button", { name: "完成语言准备" })).toBeEnabled();
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
npm test -- --run src/pages/tasks/CreateTaskPage.single-language.test.tsx
```

Expected: FAIL because temporary messages have no source-language selector and still require at least one target language.

- [ ] **Step 3: Add temporary-message source language state**

Add:

```ts
const [temporarySourceLocale, setTemporarySourceLocale] = useState(
  copiedTask?.content?.sourceLocale || "zh-CN",
);

const updateTemporarySourceLocale = (locale: string) => {
  setTemporarySourceLocale(locale);
  setTargetLocales((current) => current.filter((item) => item !== locale));
  setTemporary((current) => ({
    ...current,
    sourceLocale: locale,
    locales: [locale],
  }));
};
```

Initialize target languages by removing `copiedTask.content.sourceLocale`, not hard-coded `zh-CN`. Build all temporary content and submission locales from `[temporarySourceLocale, ...targetLocales]`.

Render a labeled source-language selector above the target-language selector:

```tsx
<Select
  aria-label="临时消息默认语言"
  value={temporarySourceLocale}
  onChange={updateTemporarySourceLocale}
  options={supportedLocales.map((value) => ({ label: value, value }))}
/>
```

Target options exclude `temporarySourceLocale` and use the placeholder `可留空，表示单语言临时消息`.

- [ ] **Step 4: Replace temporary-machine-translation creation with language preparation**

Rename `createTemporaryTranslation` to `prepareTemporaryLanguageContent`. Preserve the existing channel-content validation, create the hidden temporary carrier only when a batch is needed, and branch as follows:

```ts
const sourceContent = {
  title:
    channels.length === 1 && channels.includes("Push")
      ? temporary.push.title
      : channels.length === 1
        ? temporary.web.title
        : `站内信：${temporary.web.title} / Push：${temporary.push.title}`,
  summary: channels.includes("站内信") ? temporary.web.summary : undefined,
  body:
    channels.length === 1 && channels.includes("Push")
      ? temporary.push.body
      : channels.length === 1
        ? temporary.web.body
        : `【站内信】\n${temporary.web.body}\n\n【App Push】\n${temporary.push.body}`,
};

const batchRequired =
  targetLocales.length > 0 ||
  requiresSpecialLanguageReview(temporarySourceLocale);
const draft = batchRequired
  ? saveTemplate({
      name: `临时消息 · ${form.getFieldValue("name") || "未命名"}`,
      category: form.getFieldValue("category") || "系统公告",
      nature: resolvedNature,
      risk: form.getFieldValue("risk") || "低",
      channels,
      locales: [temporarySourceLocale, ...targetLocales],
      sourceLocale: temporarySourceLocale,
      content: {
        ...temporary,
        sourceLocale: temporarySourceLocale,
        locales: [temporarySourceLocale, ...targetLocales],
      },
      variables: [
        "user_nickname", "amount", "currency", "symbol", "occurred_at",
      ],
      owner: "临时任务",
      usageScope: "manual",
    })
  : undefined;
const subject = draft
  ? {
      type: "manual_task_content" as const,
      id: draft.id,
      name: draft.name,
      version: draft.version,
      returnPath: "/tasks/create",
    }
  : undefined;

if (targetLocales.length && subject) {
  const batch = createTranslationBatch({
    subject,
    sourceLocale: temporarySourceLocale,
    sourceContent,
    targetLocales,
    createdBy: "Gary Ma",
  });
  setTemporaryBatchId(batch.id);
} else if (requiresSpecialLanguageReview(temporarySourceLocale) && subject) {
  const result = prepareSingleLanguageContent({
    subject,
    sourceLocale: temporarySourceLocale,
    sourceContent,
    createdBy: "Gary Ma",
  });
  setTemporaryBatchId(result.batch?.id);
} else {
  setTemporaryBatchId(undefined);
}
```

Always save the task draft with the current source language and locales after this action.

- [ ] **Step 5: Correct the temporary-language release gate and copy**

Replace the `targetLocales.length === 0` shortcut with:

```ts
const directReviewRequired =
  targetLocales.length === 0 &&
  requiresSpecialLanguageReview(temporarySourceLocale);

const translationReady =
  contentMode === "template"
    ? selectedTemplate?.translationReadiness === "已通过"
    : directReviewRequired
      ? currentBatch?.productionMode === "direct_source_review" &&
        currentBatch.status === "已通过" &&
        translationScopeCurrent
      : targetLocales.length === 0 ||
        (currentBatch?.status === "已通过" && translationScopeCurrent);
```

`translationScopeCurrent` must compare channels, source locale, and target locales. Source or target changes invalidate the existing batch.

Render exact action labels:

```ts
const temporaryLanguageAction = targetLocales.length
  ? temporaryBatchId && !translationScopeCurrent
    ? "按当前语言重新创建机翻任务"
    : "创建外部机翻任务"
  : directReviewRequired
    ? "提交语言审核"
    : "完成语言准备";
```

Replace the warning “临时消息同样必须完成外部机翻” with a dynamic explanation that distinguishes single-language direct authoring from external machine translation.

- [ ] **Step 6: Run task-page tests and commit**

Run:

```bash
npm test -- --run \
  src/pages/tasks/CreateTaskPage.single-language.test.tsx \
  src/pages/tasks/CreateTaskPage.translation.test.tsx \
  src/pages/tasks/CreateTaskPage.completion.test.tsx
```

Expected: all three files PASS.

Commit:

```bash
git add src/pages/tasks/CreateTaskPage.tsx src/pages/tasks/CreateTaskPage.single-language.test.tsx
git commit -m "feat: support single-language temporary messages"
```

---

### Task 4: 让进度与审核页面识别原文审核

**Files:**
- Modify: `src/pages/templates/TranslationWorkflowPanel.tsx:32-282`
- Modify: `src/pages/approvals/TranslationReviewDrawer.tsx:27-284`
- Modify: `src/pages/multilingual/MultilingualReviewPage.tsx:25-108`
- Modify: `src/pages/multilingual/MultilingualProgressDrawer.tsx:20-106`
- Modify: `src/pages/multilingual/MultilingualResultPanel.tsx:37-158`
- Modify: `src/pages/templates/TranslationWorkflowPanel.test.tsx`
- Modify: `src/pages/multilingual/MultilingualReviewPage.test.tsx`
- Create: `src/pages/approvals/TranslationReviewDrawer.direct-source.test.tsx`

**Interfaces:**
- Consumes: `TranslationBatch.productionMode` and `TranslationItem.productionMode` from Task 1.
- Produces: conditional display semantics for machine translation versus direct source review without adding new stored statuses.

- [ ] **Step 1: Add failing direct-review presentation tests**

Add a direct batch fixture to `TranslationWorkflowPanel.test.tsx` and assert:

```tsx
expect(screen.getByText("单语言直接编写")).toBeVisible();
expect(screen.getByText("原文待审核")).toBeVisible();
expect(screen.getByRole("button", { name: "前往语言审核" })).toBeEnabled();
expect(screen.queryByText("外部任务 ID")).not.toBeInTheDocument();
expect(screen.queryByText(/第 0 次/)).not.toBeInTheDocument();
expect(screen.queryByRole("button", { name: "重试该语言" })).not.toBeInTheDocument();
```

Create `TranslationReviewDrawer.direct-source.test.tsx` with a direct-source item in the store and assert:

```tsx
expect(screen.getByText("原文校对")).toBeVisible();
expect(screen.getByText("操作者提交原文")).toBeVisible();
expect(screen.getByText("人工审核稿")).toBeVisible();
expect(screen.getByText(/提交原文审核/)).toBeVisible();
expect(screen.queryByText("外部任务 ID")).not.toBeInTheDocument();
expect(screen.queryByText(/外部服务回调/)).not.toBeInTheDocument();
```

Extend `MultilingualReviewPage.test.tsx` so a Japanese direct-source item produces an `审核原文` operation and does not render an external task ID.

- [ ] **Step 2: Run presentation tests and verify failure**

Run:

```bash
npm test -- --run \
  src/pages/templates/TranslationWorkflowPanel.test.tsx \
  src/pages/approvals/TranslationReviewDrawer.direct-source.test.tsx \
  src/pages/multilingual/MultilingualReviewPage.test.tsx
```

Expected: FAIL because every component currently assumes machine translation.

- [ ] **Step 3: Make the workflow panel production-mode aware**

At the top of `TranslationWorkflowPanel`, derive:

```ts
const directSourceReview = batch?.productionMode === "direct_source_review";
const displayStatus = (status: TranslationItemStatus) =>
  directSourceReview && status === "翻译返回待审核"
    ? "原文待审核"
    : status;
```

For direct review:

- Alert title is `单语言直接编写`.
- Description says `当前内容未调用机器翻译，原文按语言策略进入专项人工审核。`.
- Descriptions show `审核语言` and `审核批次 ID`, not target-language or translation-task terminology.
- Locale rows omit external task ID, attempt count, result time, retry action.
- Pending special-review action text is `前往语言审核`.
- Gate text says `原文语言审核通过后可继续业务审核`.

When a template has no batch and `template.translationReadiness === "已通过"`, render a success alert `单语言模板，无需机器翻译，语言准备已完成` and preserve the template business-approval action.

- [ ] **Step 4: Make the review drawer production-mode aware**

Derive:

```ts
const directSourceReview = current?.productionMode === "direct_source_review";
```

Use these exact direct-mode strings:

```ts
const reviewNoun = directSourceReview ? "原文" : "译文";
const drawerAction = directSourceReview ? "原文校对" : "翻译校对";
const separationMessage = directSourceReview
  ? "内容提交人与语言审核人必须不同"
  : "机翻提交人与人工审核人必须不同";
```

Direct mode descriptions contain only审核语言、源内容哈希、变量完整性、提交时间. The comparison headings are `操作者提交原文` and `人工审核稿`; the editable fields initialize from `humanDraft`. Timeline is:

```tsx
<Timeline.Item>
  {current.submittedAt} {current.submitter} 提交原文审核
</Timeline.Item>
<Timeline.Item>当前 · 原文待审核</Timeline.Item>
```

Reject helper becomes `驳回时必填；原文保持待审核，可修改后重新提交` and does not mention retranslation.

- [ ] **Step 5: Update the unified multilingual list, drawer, and result panel**

For `direct_source_review` items:

- Column label is `审核语言`; machine items remain `目标语言` at row-content level.
- External task cell shows `单语言原文` instead of an empty ID.
- Operation is `审核原文`.
- Progress drawer uses `查看原文` / `收起原文`.
- Result metadata uses a single locale tag rather than `source → target`.
- Result comparison has two columns: `操作者提交原文` and `当前审核稿`; it does not render a `机器翻译` column.
- Search concatenation uses `item.externalTaskId || ""` so direct-review records remain searchable without `undefined` text.

In `MultilingualResultPanel`, do not use machine-output availability as the direct-mode empty-state condition:

```ts
const directSourceReview = item.productionMode === "direct_source_review";
const resultReady = directSourceReview
  ? hasContent(sourceContent)
  : hasContent(machineContent);
```

Only show “暂无可查看的译文” when `resultReady` is false.

- [ ] **Step 6: Run multilingual tests and commit**

Run:

```bash
npm test -- --run \
  src/pages/templates/TranslationWorkflowPanel.test.tsx \
  src/pages/approvals/TranslationReviewDrawer.direct-source.test.tsx \
  src/pages/multilingual/MultilingualReviewPage.test.tsx \
  src/pages/multilingual/MultilingualProgress.test.tsx \
  src/pages/multilingual/multilingualProgress.test.ts
```

Expected: all five files PASS.

Commit:

```bash
git add \
  src/pages/templates/TranslationWorkflowPanel.tsx \
  src/pages/approvals/TranslationReviewDrawer.tsx \
  src/pages/multilingual/MultilingualReviewPage.tsx \
  src/pages/multilingual/MultilingualProgressDrawer.tsx \
  src/pages/multilingual/MultilingualResultPanel.tsx \
  src/pages/templates/TranslationWorkflowPanel.test.tsx \
  src/pages/approvals/TranslationReviewDrawer.direct-source.test.tsx \
  src/pages/multilingual/MultilingualReviewPage.test.tsx
git commit -m "feat: present direct source language reviews"
```

---

### Task 5: 全量回归与交付

**Files:**
- Verify: all files under `src/`
- Verify: `docs/superpowers/specs/2026-07-18-single-language-direct-authoring-design.md`
- Verify: `docs/superpowers/plans/2026-07-18-single-language-direct-authoring.md`

**Interfaces:**
- Consumes: all deliverables from Tasks 1-4.
- Produces: a buildable, regression-tested frontend prototype.

- [ ] **Step 1: Run the complete test suite**

Run:

```bash
npm run test:run
```

Expected: every Vitest file passes with zero failed tests.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: TypeScript build and Vite production build both exit with code `0`.

- [ ] **Step 3: Check the final diff for unintended scope**

Run:

```bash
git diff --check
git status --short
git diff --stat HEAD~4..HEAD
```

Expected: no whitespace errors; changes are limited to language-production types/store, template editing, temporary-message editing, multilingual progress/review, tests, and the approved design/plan documents.

- [ ] **Step 4: Record the verified implementation state**

If verification requires a final correction, commit only that correction:

```bash
git add src
git commit -m "fix: complete single-language authoring regression"
```

If the worktree is already clean after Tasks 1-4, do not create an empty commit.
