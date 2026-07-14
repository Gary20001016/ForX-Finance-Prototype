# 指定 UID CSV 受众导入实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在人工消息任务的“指定用户”区域实现手动 UID 与 CSV UID 合并去重、校验确认、结果预览、错误下载和草稿持久化。

**Architecture:** 将 CSV 解析、UID 校验和集合合并放入无 UI 的纯函数模块，将上传和结果交互封装为受控的 `UidAudienceImporter`，`CreateTaskPage` 只负责选择受众类型、保存受众值及提交门禁。任务草稿保存确认后的受众快照数据，正式用户存在性和可触达校验保持在生产后端边界之外。

**Tech Stack:** React 18、TypeScript 5.9、Arco Design React 2.66、Vitest 3.2、Testing Library、Vite 7。

## Global Constraints

- 当前仓库只实现前端交互原型，不调用真实用户服务或上传原始 CSV 到服务器。
- CSV 必须包含 `uid` 列；可选 `remark` 列；支持 UTF-8 BOM 和双引号字段。
- UID 格式固定为 `^[A-Za-z0-9_-]{1,64}$`，始终按字符串处理。
- 单文件最大 10 MB、最多 100,000 个数据行。
- 无效 UID 排除后必须由操作者确认；CSV UID 与手动 UID 合并并统一去重。
- 未确认 CSV 不进入最终 UID 集合，并阻止任务最终提交。
- 再次上传替换上一份 CSV；删除 CSV 不影响手动 UID。
- 不增加 CSV 解析依赖；使用小型纯函数解析本次限定格式。
- 所有生产代码遵循测试先行的 RED → GREEN → REFACTOR 顺序。

---

## File Structure

- Create `src/pages/tasks/uidAudience.ts`：类型、CSV 解析、UID 校验、合并、脱敏和下载文本生成。
- Create `src/pages/tasks/uidAudience.test.ts`：纯函数边界与异常测试。
- Create `src/pages/tasks/UidAudienceImporter.tsx`：受控输入、文件选择/拖拽、统计、确认、删除与下载界面。
- Create `src/pages/tasks/UidAudienceImporter.test.tsx`：组件交互和可访问性测试。
- Modify `src/pages/tasks/CreateTaskPage.tsx`：接入组件、动态受众、下一步和提交门禁、草稿恢复。
- Create `src/pages/tasks/CreateTaskPage.uid-audience.test.tsx`：页面级完整流程测试。
- Modify `src/domain/types.ts`：任务持久化的 UID 受众快照类型。
- Modify `src/store/prototypeStore.ts`：允许任务提交和草稿保存携带 UID 受众快照。
- Modify `src/styles/global.css`：导入卡片、统计、异常行和响应式布局。
- Modify `docs/prd/message-center/02-消息任务.md`：同步 CSV 受众能力和提交门禁。
- Modify `docs/prd/message-center/05-用户与受众.md`：同步格式、校验、去重和快照规则。

---

### Task 1: UID CSV 解析与集合合并

**Files:**
- Create: `src/pages/tasks/uidAudience.ts`
- Create: `src/pages/tasks/uidAudience.test.ts`

**Interfaces:**
- Produces: `parseUidCsv(text: string): UidCsvParseResult`
- Produces: `parseManualUids(text: string): string[]`
- Produces: `mergeUidAudience(manualUids: string[], csvValidUids: string[], csvConfirmed: boolean): UidAudienceMergeResult`
- Produces: `maskUid(uid: string): string`
- Produces: `UID_CSV_TEMPLATE: string`
- Produces: `createUidErrorCsv(rows: UidInvalidRow[]): string`

- [ ] **Step 1: Write failing parser tests**

```ts
import { describe, expect, it } from "vitest";
import {
  createUidErrorCsv,
  mergeUidAudience,
  parseManualUids,
  parseUidCsv,
} from "./uidAudience";

describe("UID audience parsing", () => {
  it("parses uid column, excludes invalid values and counts duplicates", () => {
    const result = parseUidCsv(
      "\uFEFFuid,remark\n100001,first\n100001,duplicate\nbad uid,invalid\nUSER-02,quoted",
    );
    expect(result.validUids).toEqual(["100001", "USER-02"]);
    expect(result.duplicateCount).toBe(1);
    expect(result.invalidRows).toEqual([
      { row: 4, uid: "bad uid", reason: "UID 格式错误" },
    ]);
  });

  it("rejects a CSV without the uid header", () => {
    expect(() => parseUidCsv("user_id\n100001")).toThrow("CSV 必须包含 uid 列");
  });

  it("merges manual and confirmed CSV UIDs without duplicates", () => {
    const manual = parseManualUids("100001\n100002\n100001");
    expect(mergeUidAudience(manual, ["100002", "100003"], false).finalUids)
      .toEqual(["100001", "100002"]);
    expect(mergeUidAudience(manual, ["100002", "100003"], true)).toMatchObject({
      finalUids: ["100001", "100002", "100003"],
      crossSourceDuplicateCount: 1,
    });
  });

  it("creates an error CSV with row, masked uid and reason", () => {
    expect(createUidErrorCsv([{ row: 3, uid: "12345678", reason: "UID 格式错误" }]))
      .toContain("3,12***78,UID 格式错误");
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test:run -- src/pages/tasks/uidAudience.test.ts --maxWorkers=1`

Expected: FAIL because `./uidAudience` does not exist.

- [ ] **Step 3: Implement the parser and types**

```ts
export interface UidInvalidRow {
  row: number;
  uid: string;
  reason: string;
}

export interface UidCsvParseResult {
  totalRows: number;
  validUids: string[];
  invalidRows: UidInvalidRow[];
  duplicateCount: number;
}

export interface UidAudienceMergeResult {
  finalUids: string[];
  crossSourceDuplicateCount: number;
}

export const UID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const UID_CSV_TEMPLATE = "uid,remark\n10000001,活动报名用户\n10000002,VIP 用户\n";

export function parseManualUids(text: string): string[] {
  return Array.from(new Set(text.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)));
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" && !quoted) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }
  if (quoted) throw new Error("CSV 存在未闭合的引号");
  row.push(cell);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

export function parseUidCsv(text: string): UidCsvParseResult {
  const rows = parseRows(text.replace(/^\uFEFF/, ""));
  if (!rows.length) throw new Error("CSV 文件为空");
  const headers = rows[0].map((value) => value.trim().toLowerCase());
  const uidIndex = headers.indexOf("uid");
  if (uidIndex < 0) throw new Error("CSV 必须包含 uid 列");
  const dataRows = rows.slice(1).filter((values) => values.some((value) => value.trim()));
  if (!dataRows.length) throw new Error("CSV 中没有可导入 UID");
  if (dataRows.length > 100_000) throw new Error("CSV 数据不能超过 100,000 行");
  const seen = new Set<string>();
  const validUids: string[] = [];
  const invalidRows: UidInvalidRow[] = [];
  let duplicateCount = 0;
  dataRows.forEach((values, index) => {
    const uid = (values[uidIndex] || "").trim();
    if (!uid) invalidRows.push({ row: index + 2, uid, reason: "UID 不能为空" });
    else if (!UID_PATTERN.test(uid)) invalidRows.push({ row: index + 2, uid, reason: "UID 格式错误" });
    else if (seen.has(uid)) duplicateCount += 1;
    else {
      seen.add(uid);
      validUids.push(uid);
    }
  });
  return { totalRows: dataRows.length, validUids, invalidRows, duplicateCount };
}

export function mergeUidAudience(
  manualUids: string[],
  csvValidUids: string[],
  csvConfirmed: boolean,
): UidAudienceMergeResult {
  const finalUids = [...manualUids];
  const seen = new Set(manualUids);
  let crossSourceDuplicateCount = 0;
  if (csvConfirmed) {
    csvValidUids.forEach((uid) => {
      if (seen.has(uid)) crossSourceDuplicateCount += 1;
      else {
        seen.add(uid);
        finalUids.push(uid);
      }
    });
  }
  return { finalUids, crossSourceDuplicateCount };
}

export function maskUid(uid: string): string {
  return uid.length <= 4 ? "***" : `${uid.slice(0, 2)}***${uid.slice(-2)}`;
}

export function createUidErrorCsv(rows: UidInvalidRow[]): string {
  return ["row,uid,reason", ...rows.map((item) =>
    `${item.row},${maskUid(item.uid)},${item.reason}`,
  )].join("\n");
}
```

The implementation above preserves manual order, appends only confirmed CSV UID values, counts cross-source duplicates, and never exposes full invalid UID values in the error export.

- [ ] **Step 4: Run parser tests and verify GREEN**

Run: `npm run test:run -- src/pages/tasks/uidAudience.test.ts --maxWorkers=1`

Expected: 1 file passed, 4 tests passed.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/pages/tasks/uidAudience.ts src/pages/tasks/uidAudience.test.ts
git commit -m "feat: add UID audience CSV parser"
```

---

### Task 2: UID CSV 导入组件

**Files:**
- Create: `src/pages/tasks/UidAudienceImporter.tsx`
- Create: `src/pages/tasks/UidAudienceImporter.test.tsx`
- Modify: `src/styles/global.css:652-710`

**Interfaces:**
- Consumes: all exports from `uidAudience.ts` defined in Task 1.
- Produces: `UidAudienceImporter({ value, onChange, disabled? })`.
- Produces: `UidAudienceValue` with `manualText`, `csvFileName`, `csvTotalRows`, `csvValidUids`, `csvInvalidRows`, `duplicateCount`, `csvConfirmed`, and derived `finalUids`.

- [ ] **Step 1: Write the failing component interaction test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import UidAudienceImporter, { createEmptyUidAudienceValue } from "./UidAudienceImporter";

function Harness() {
  const [value, setValue] = useState(createEmptyUidAudienceValue());
  return <UidAudienceImporter value={value} onChange={setValue} />;
}

it("merges manual UIDs with confirmed valid CSV rows", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.type(screen.getByLabelText("手动输入 UID"), "100001\n100002");
  const file = new File(
    ["uid,remark\n100002,duplicate\n100003,valid\nbad uid,invalid"],
    "audience.csv",
    { type: "text/csv" },
  );
  await user.upload(screen.getByLabelText("上传 UID CSV"), file);
  expect(await screen.findByText("待确认")).toBeVisible();
  expect(screen.getByText("1 条无效 UID 将被排除")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "确认排除无效 UID" }));
  expect(screen.getByText("最终目标用户")).toBeVisible();
  expect(screen.getByText("3")).toBeVisible();
});
```

Add these explicit cases to the same test file:

```tsx
it("keeps manual input when the CSV is deleted", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.type(screen.getByLabelText("手动输入 UID"), "100001");
  await user.upload(screen.getByLabelText("上传 UID CSV"), new File(["uid\n100002"], "a.csv"));
  await user.click(await screen.findByRole("button", { name: "确认导入有效 UID" }));
  await user.click(screen.getByRole("button", { name: "删除 CSV" }));
  expect(screen.getByLabelText("手动输入 UID")).toHaveValue("100001");
  expect(screen.getByText("1")).toBeVisible();
});

it("shows a parse error without replacing the previous confirmed file", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.upload(screen.getByLabelText("上传 UID CSV"), new File(["uid\n100002"], "good.csv"));
  await user.click(await screen.findByRole("button", { name: "确认导入有效 UID" }));
  await user.upload(screen.getByLabelText("上传 UID CSV"), new File(["user_id\n100003"], "bad.csv"));
  expect(await screen.findByText("CSV 必须包含 uid 列")).toBeVisible();
  expect(screen.getByText("good.csv")).toBeVisible();
});
```

- [ ] **Step 2: Run component tests and verify RED**

Run: `npm run test:run -- src/pages/tasks/UidAudienceImporter.test.tsx --maxWorkers=1`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the controlled component**

Implement the controlled state contract and file handler as follows; render it with Arco `Alert`, `Button`, `Card`, `Input`, `Statistic`, `Table` and `Tag` plus a native file input:

```tsx
export interface UidAudienceValue {
  manualText: string;
  csvFileName?: string;
  csvTotalRows: number;
  csvValidUids: string[];
  csvInvalidRows: UidInvalidRow[];
  duplicateCount: number;
  csvConfirmed: boolean;
}

export const createEmptyUidAudienceValue = (manualText = ""): UidAudienceValue => ({
  manualText,
  csvTotalRows: 0,
  csvValidUids: [],
  csvInvalidRows: [],
  duplicateCount: 0,
  csvConfirmed: false,
});

async function handleFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    setError("请选择 CSV 文件");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    setError("CSV 文件不能超过 10 MB");
    return;
  }
  try {
    const result = parseUidCsv(await file.text());
    setError(undefined);
    onChange({
      ...value,
      csvFileName: file.name,
      csvTotalRows: result.totalRows,
      csvValidUids: result.validUids,
      csvInvalidRows: result.invalidRows,
      duplicateCount: result.duplicateCount,
      csvConfirmed: false,
    });
  } catch (reason) {
    setError(reason instanceof Error ? reason.message : "CSV 解析失败");
  }
}

return <Card className="uid-audience-importer" title="指定 UID">
  <Input.TextArea
    aria-label="手动输入 UID"
    value={value.manualText}
    onChange={(manualText) => onChange({ ...value, manualText })}
    placeholder="每行一个 UID"
  />
  <Button onClick={() => downloadCsv("uid-import-template.csv", UID_CSV_TEMPLATE)}>
    下载 CSV 模板
  </Button>
  <label className="uid-upload-zone" onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    }}>
    <input aria-label="上传 UID CSV" type="file" accept=".csv,text/csv" hidden
      onChange={(event) => event.target.files?.[0] && void handleFile(event.target.files[0])} />
    点击或拖拽 CSV 到这里
  </label>
  {value.csvFileName && <>
    <Tag>{value.csvConfirmed ? "已确认" : "待确认"}</Tag>
    <div className="uid-import-stats">
      <Statistic title="文件总行数" value={value.csvTotalRows} />
      <Statistic title="有效 UID" value={value.csvValidUids.length} />
      <Statistic title="重复 UID" value={value.duplicateCount} />
      <Statistic title="无效 UID" value={value.csvInvalidRows.length} />
    </div>
    {value.csvInvalidRows.length > 0 && <Alert type="warning"
      content={`${value.csvInvalidRows.length} 条无效 UID 将被排除`} />}
    {value.csvInvalidRows.length > 0 && <Table className="uid-import-errors"
      rowKey="row" pagination={false}
      data={value.csvInvalidRows.map((item) => ({ ...item, uid: maskUid(item.uid) }))}
      columns={[
        { title: "行号", dataIndex: "row" },
        { title: "UID", dataIndex: "uid" },
        { title: "原因", dataIndex: "reason" },
      ]} />}
    <div className="uid-import-actions">
      <Button type="primary" onClick={() => onChange({ ...value, csvConfirmed: true })}>
        {value.csvInvalidRows.length ? "确认排除无效 UID" : "确认导入有效 UID"}
      </Button>
      <Button onClick={() => downloadCsv("uid-errors.csv", createUidErrorCsv(value.csvInvalidRows))}
        disabled={!value.csvInvalidRows.length}>下载错误明细</Button>
      <Button status="danger" onClick={() => onChange(createEmptyUidAudienceValue(value.manualText))}>
        删除 CSV
      </Button>
    </div>
  </>}
</Card>;
```

The rendered component must include these stable accessible names:

```text
手动输入 UID
上传 UID CSV
下载 CSV 模板
确认导入有效 UID
确认排除无效 UID
下载错误明细
删除 CSV
```

Downloads use a small `downloadCsv(fileName, content)` helper that creates a UTF-8 BOM `Blob`, creates an object URL, clicks a temporary anchor, then revokes the URL.

- [ ] **Step 4: Add scoped styles**

Add only these exact scoped rules without touching global button or card selectors:

```css
.uid-audience-importer { margin-bottom: 20px; }
.uid-upload-zone { display: grid; place-items: center; min-height: 112px; border: 1px dashed #98a2b3; border-radius: 10px; cursor: pointer; }
.uid-import-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 16px 0; }
.uid-import-errors { margin-top: 16px; }
.uid-import-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
@media (max-width: 768px) { .uid-import-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
```

- [ ] **Step 5: Run component tests and verify GREEN**

Run: `npm run test:run -- src/pages/tasks/UidAudienceImporter.test.tsx src/pages/tasks/uidAudience.test.ts --maxWorkers=1`

Expected: 2 files passed and all UID import tests passed.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/pages/tasks/UidAudienceImporter.tsx src/pages/tasks/UidAudienceImporter.test.tsx src/styles/global.css
git commit -m "feat: add UID CSV audience importer"
```

---

### Task 3: 接入消息任务、草稿和提交门禁

**Files:**
- Modify: `src/domain/types.ts:49-79`
- Modify: `src/store/prototypeStore.ts:606-635`
- Modify: `src/pages/tasks/CreateTaskPage.tsx:91-260,280-360,820-957`
- Create: `src/pages/tasks/CreateTaskPage.uid-audience.test.tsx`

**Interfaces:**
- Consumes: `UidAudienceImporter`, `UidAudienceValue`, `createEmptyUidAudienceValue`, `mergeUidAudience`, `maskUid`.
- Produces: optional `MessageTask.uidAudience` snapshot persisted by `saveTaskDraft` and `submitTask`.

- [ ] **Step 1: Write a failing page-level test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateTaskPage from "./CreateTaskPage";

it("uses confirmed manual and CSV UIDs as the specified audience", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);
  await user.type(screen.getByPlaceholderText("例如：夏季交易赛召回"), "指定 UID 通知");
  await user.click(screen.getByRole("button", { name: "下一步" }));
  await user.click(screen.getByText("指定用户"));
  await user.clear(screen.getByLabelText("手动输入 UID"));
  await user.type(screen.getByLabelText("手动输入 UID"), "100001\n100002");
  await user.upload(
    screen.getByLabelText("上传 UID CSV"),
    new File(["uid\n100002\n100003"], "users.csv", { type: "text/csv" }),
  );
  await user.click(await screen.findByRole("button", { name: "确认导入有效 UID" }));
  expect(screen.getByText("3")).toBeVisible();
  expect(screen.getByText("UID 10***01")).toBeVisible();
});
```

Add a second test that uploads a valid CSV but does not confirm it, advances to the final step, clicks submit, and expects `请先确认 UID CSV 导入结果` while no task is submitted.

- [ ] **Step 2: Run the page test and verify RED**

Run: `npm run test:run -- src/pages/tasks/CreateTaskPage.uid-audience.test.tsx --maxWorkers=1 --testTimeout=15000`

Expected: FAIL because the specified-user section does not render the importer.

- [ ] **Step 3: Add the persisted snapshot type**

```ts
export interface UidAudienceSnapshot {
  manualUids: string[];
  csvFileName?: string;
  csvTotalRows: number;
  csvValidUids: string[];
  csvInvalidCount: number;
  duplicateCount: number;
  csvConfirmed: boolean;
  finalUids: string[];
}

export interface MessageTask {
  uidAudience?: UidAudienceSnapshot;
}
```

Add `"uidAudience"` to the optional `TaskSubmission` pick so the existing spread in `saveTaskDraft` and `submitTask` persists it without a new store branch.

- [ ] **Step 4: Connect controlled UID state to CreateTaskPage**

Initialize from `copiedTask?.uidAudience` or `createEmptyUidAudienceValue("100001\n100002\n100003")`. When `audienceType === "uid"`, derive:

```ts
const uidAudience = mergeUidAudience(
  parseManualUids(uidAudienceValue.manualText),
  uidAudienceValue.csvValidUids,
  uidAudienceValue.csvConfirmed,
);

const audience = {
  label: "指定 UID 名单",
  count: uidAudience.finalUids.length,
  samples: uidAudience.finalUids.slice(0, 3).map((uid) => `UID ${maskUid(uid)}`),
};
```

Replace the hard-coded UID textarea with `UidAudienceImporter`. Keep other audience types unchanged. Include `uidAudience` in `submission()` only for manual UID tasks.

- [ ] **Step 5: Add submit and navigation guards**

When the current step is the target-user step and `audienceType === "uid"`:

```ts
if (!uidAudience.finalUids.length) {
  Message.warning("请至少输入或导入一个有效 UID");
  return;
}
if (uidAudienceValue.csvFileName && !uidAudienceValue.csvConfirmed) {
  Message.warning("请先确认 UID CSV 导入结果");
  return;
}
```

Repeat the same guard in `submit()` so direct or restored navigation cannot bypass it.

- [ ] **Step 6: Run page and regression tests**

Run: `npm run test:run -- src/pages/tasks/CreateTaskPage.uid-audience.test.tsx src/pages/tasks/CreateTaskPage.v2.test.tsx src/pages/tasks/CreateTaskPage.completion.test.tsx --maxWorkers=1 --testTimeout=15000`

Expected: 3 files passed and all tests passed.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/domain/types.ts src/store/prototypeStore.ts src/pages/tasks/CreateTaskPage.tsx src/pages/tasks/CreateTaskPage.uid-audience.test.tsx
git commit -m "feat: integrate UID CSV audience into tasks"
```

---

### Task 4: PRD 同步与完整验证

**Files:**
- Modify: `docs/prd/message-center/02-消息任务.md`
- Modify: `docs/prd/message-center/05-用户与受众.md`

**Interfaces:**
- Consumes: final UI labels, validation rules and snapshot fields from Tasks 1–3.
- Produces: module PRD aligned with the implemented prototype.

- [ ] **Step 1: Update the task PRD**

Add this exact requirement to the target-user and validation sections and add the field row to the task table:

```md
- 指定 UID 支持手动输入与 CSV 导入，两种来源合并去重；存在未确认 CSV 时禁止提交审核。

| `uid_audience_snapshot` | object | 否 | 指定 UID 的确认快照，包含文件名、有效数、无效数、重复数和最终 UID 数量 |
```

- [ ] **Step 2: Update the audience PRD**

Add this exact subsection to the audience PRD:

```md
### 指定 UID CSV 导入

- 文件必须为 UTF-8 `.csv`，包含必填 `uid` 列，可包含 `remark` 列。
- 单文件最大 10 MB、最多 100,000 个数据行。
- UID 按字符串处理并匹配 `^[A-Za-z0-9_-]{1,64}$`。
- 手动 UID 与 CSV UID 合并去重；页面展示有效、重复、无效和最终数量。
- 无效 UID 被排除，操作者必须确认排除结果后才能提交任务。
- 前端只执行格式校验；正式环境由用户服务校验用户存在性和可触达状态。
```

- [ ] **Step 3: Run documentation checks**

Run: `rg -n "CSV|100,000|10 MB|确认排除|合并去重|用户服务" docs/prd/message-center/02-消息任务.md docs/prd/message-center/05-用户与受众.md`

Expected: every required term appears in its owning module.

- [ ] **Step 4: Run full automated verification**

Run: `npm run test:run -- --maxWorkers=1 --testTimeout=15000 --reporter=dot`

Expected: all test files and tests pass with exit code 0.

Run: `npm run build`

Expected: TypeScript and Vite build complete with exit code 0.

Run: `git diff --check`

Expected: exit code 0 with no whitespace errors.

- [ ] **Step 5: Verify the local page**

Open `http://127.0.0.1:5174/tasks/create`, enter the target-user step, select “指定用户”, upload a CSV containing valid, duplicate and invalid UIDs, confirm exclusion, and verify the final count and masked samples. Delete the CSV and verify manual UIDs remain. Confirm no console errors.

- [ ] **Step 6: Commit Task 4**

```bash
git add docs/prd/message-center/02-消息任务.md docs/prd/message-center/05-用户与受众.md
git commit -m "docs: specify UID CSV audience import"
```
