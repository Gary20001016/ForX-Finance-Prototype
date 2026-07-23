# Template Channel Content Linkage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the template content editor, preview, validation, and test send follow the selected formal delivery channels.

**Architecture:** Keep `channels` as controlled state inside `TemplateEditorDrawer`, matching the existing channel-first pattern in `CreateTaskPage`. Render and validate each channel independently while retaining the inactive channel content in the local `content` object so an operator can restore it by reselecting the channel.

**Tech Stack:** React 18, TypeScript 5.9, Arco Design React, Vitest, Testing Library.

## Global Constraints

- At least one of `站内信` or `Push` must remain selected.
- Only selected channels are rendered, previewed, validated, test-sent, translated, and published.
- Deselecting a channel preserves its current drawer-session content and reselecting restores it.
- One selected editor uses 24/24 grid width; two selected editors use 12/24 each.
- Do not change template storage types, translation states, approved-template locking, or event-only Push priority and collapse-key behavior.

---

### Task 1: Add failing channel-linkage coverage

**Files:**
- Create: `src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx`

**Interfaces:**
- Consumes: `TemplateEditorDrawer` public props.
- Verifies: selected-channel editor visibility, preview filtering, content restoration, final-channel protection, and selected-channel-only save validation.

- [ ] **Step 1: Write the editor and preview linkage test**

Create a test that opens a new manual template, enters a Push title, deselects Push, verifies the Push editor is absent and the station editor occupies `.arco-col-24`, opens “双端预览” and verifies only the Web/App station previews remain, then reselects Push and verifies the Push title is restored.

```tsx
import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resetPrototypeStore } from "../../store/prototypeStore";
import TemplateEditorDrawer from "./TemplateEditorDrawer";

beforeEach(() => resetPrototypeStore());

it("links editors and previews to formal channels without clearing hidden content", async () => {
  const user = userEvent.setup();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="manual"
      onClose={() => undefined}
    />,
  );

  await user.type(screen.getByLabelText("Push 标题"), "保留的 Push 标题");
  await user.click(screen.getByRole("checkbox", { name: "Push" }));

  expect(screen.queryByLabelText("Push 标题")).not.toBeInTheDocument();
  expect(screen.getByLabelText("站内信标题")).toBeVisible();
  expect(
    screen.getByText("站内信（Web + App 共用）").closest(".arco-col"),
  ).toHaveClass("arco-col-24");

  await user.click(screen.getByRole("tab", { name: "双端预览" }));
  expect(screen.getByRole("region", { name: "Web 站内信预览" })).toBeVisible();
  expect(screen.getByRole("region", { name: "App 站内信预览" })).toBeVisible();
  expect(
    screen.queryByRole("region", { name: "App Push 预览" }),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("checkbox", { name: "Push" }));
  await user.click(screen.getByRole("tab", { name: "内容编辑" }));
  expect(screen.getByLabelText("Push 标题")).toHaveValue("保留的 Push 标题");
});
```

- [ ] **Step 2: Write the final-channel and save-validation test**

Create a test that leaves only station inbox selected, attempts to remove it and sees “请至少保留一个正式渠道”, then fills only station content and successfully saves a template whose channels equal `['站内信']`.

```tsx
it("keeps one formal channel and validates only selected channel content", async () => {
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

  await user.click(screen.getByRole("checkbox", { name: "Push" }));
  const stationChannel = screen.getByRole("checkbox", { name: "站内信" });
  await user.click(stationChannel);
  expect(stationChannel).toBeChecked();
  expect(screen.getByText("请至少保留一个正式渠道")).toBeVisible();

  await user.type(screen.getByPlaceholderText(/snake_case/), "station_only");
  await user.type(screen.getByPlaceholderText("后台识别名称"), "仅站内信模板");
  await user.type(screen.getByLabelText("站内信标题"), "标题");
  await user.type(screen.getByLabelText("站内信摘要"), "摘要");
  await user.type(screen.getByLabelText("Markdown 站内信正文"), "正文");
  await user.click(screen.getByRole("button", { name: "保存草稿" }));

  await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  expect(onCreated.mock.calls[0][0].channels).toEqual(["站内信"]);
});
```

- [ ] **Step 3: Run the new test and verify RED**

Run: `npm run test:run -- src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx`

Expected: FAIL because the current drawer always renders and validates both channel modules, the preview omits the `channels` prop, and the last channel can be deselected.

### Task 2: Implement controlled channel linkage

**Files:**
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`

**Interfaces:**
- Produces: a controlled `channels: Channel[]` state used by editing, validation, preview, payload, and `TemplateTestSendModal`.
- Consumes: existing `MessagePreview.channels` and `TemplateTestSendModal.channels` props.

- [ ] **Step 1: Add channel state and final-channel protection**

Add `Channel` to the existing type import, initialize the state from the template or `["站内信", "Push"]`, and insert the channel reset at the start of the existing drawer/template reset effect before `form.setFieldsValue`.

```tsx
const defaultChannels: Channel[] = ["站内信", "Push"];
const [channels, setChannels] = useState<Channel[]>(defaultChannels);

useEffect(() => {
  const nextChannels = template?.channels?.length
    ? [...template.channels]
    : [...defaultChannels];
  setChannels(nextChannels);
}, [template, visible, form, entryScope]);

const updateChannels = (values: Channel[]) => {
  if (!values.length) {
    Message.warning("请至少保留一个正式渠道");
    return;
  }
  setChannels(values);
};
```

Render `Checkbox.Group` with `value={channels}` and `onChange={(values) => updateChannels(values as Channel[])}`; remove `field="channels"` so the controlled state is the single source of truth.

- [ ] **Step 2: Validate and save only selected channels**

Replace unconditional content validation with channel-specific checks and use `channels` in the payload.

```tsx
const stationIncomplete =
  channels.includes("站内信") &&
  (!content.web.title || !content.web.summary || !content.web.body);
const pushIncomplete =
  channels.includes("Push") &&
  (!content.push.title || !content.push.body);

if (stationIncomplete || pushIncomplete) {
  Message.warning("请完整填写已选正式渠道的内容");
  return;
}
if (channels.includes("站内信") && hasUnsafeMarkdownLinks(content.web.body)) {
  Message.error(
    "站内信 Markdown 包含不允许的链接，仅支持 http、https 和 forxfinance 协议",
  );
  return;
}
```

Set `payload.channels = channels` and leave both channel content objects intact.

- [ ] **Step 3: Render editors with selected-channel widths**

For the `Grid.Col` whose first child is `<h3>站内信（Web + App 共用）</h3>`, change the opening tag from `<Grid.Col span={12}>` to the first two lines below and add the matching `)}` immediately after its closing `</Grid.Col>`. Apply the same exact transformation to the `Grid.Col` whose first child is `<h3>App Push</h3>` using the second condition.

```tsx
{channels.includes("站内信") && (
  <Grid.Col span={channels.length === 1 ? 24 : 12}>
)}
{channels.includes("Push") && (
  <Grid.Col span={channels.length === 1 ? 24 : 12}>
)}
```

- [ ] **Step 4: Filter preview and test-send channels**

Pass the same state to both consumers.

```tsx
<MessagePreview
  content={content}
  channels={channels}
  showPushPriority={entryScope === "event"}
/>

<TemplateTestSendModal
  visible={testSendVisible}
  content={content}
  channels={channels}
  variables={String(form.getFieldValue("variables") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)}
  onClose={() => setTestSendVisible(false)}
/>
```

- [ ] **Step 5: Run targeted tests and verify GREEN**

Run: `npm run test:run -- src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx src/pages/templates/TemplateEditorDrawer.test-send.test.tsx src/pages/templates/TemplateListPage.completion.test.tsx src/pages/templates/TemplateListPage.scope.test.tsx`

Expected: 4 test files pass with no failed tests.

- [ ] **Step 6: Run static verification and commit**

Run: `npm run build && git diff --check`

Expected: TypeScript build and Vite build succeed; `git diff --check` produces no output.

Commit:

```bash
git add src/pages/templates/TemplateEditorDrawer.tsx src/pages/templates/TemplateEditorDrawer.channel-linkage.test.tsx
git commit -m "feat: link template content to formal channels"
```
