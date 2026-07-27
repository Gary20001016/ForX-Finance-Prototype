# Event Template Event Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让事件消息模板从事件目录选择并永久绑定系统事件，自动继承前台展示位置、风险等级和可用变量，同时补齐所有者团队展示，并限制事件通知规则只能使用同一事件的已发布模板。

**Architecture:** 在 `MessageTemplate` 中新增不可变 `eventId`，由 store 统一校验和派生事件模板的分类、主题、风险及变量。编辑器只负责选择事件并展示锁定结果，列表和详情展示绑定事件与所有者团队，事件规则页按事件过滤模板。历史事件模板通过模板编码迁移到既有事件目录，避免旧数据失效。

**Tech Stack:** React 18、TypeScript、Arco Design React、Zustand、Vitest、Testing Library

## Global Constraints

- 仅事件消息模板使用 `eventId`；人工消息模板逻辑不变。
- 事件模板创建后不可更换绑定事件，前端禁用且 store 强制保留原值。
- 分类、二级主题、风险等级、模板变量全部继承事件目录，不允许模板层覆盖。
- 所有者团队为事件模板必填字段。
- 事件通知规则只能选择与规则事件一致、状态为“已发布”的事件模板。
- 所有文件修改使用 `apply_patch`。

---

## Task 1: 建立事件绑定领域模型与数据迁移

**Files:**

- Modify: `src/domain/types.ts`
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/mocks/data.ts`
- Test: `src/store/prototypeStore.test.ts`

- [x] **Step 1: 为 `MessageTemplate` 增加事件绑定字段**

```ts
export interface MessageTemplate {
  // existing fields
  eventId?: string;
}
```

- [x] **Step 2: 先写失败测试，覆盖事件变量、历史模板迁移和不可变绑定**

```ts
it("binds seeded event templates to the event directory", () => {
  const state = usePrototypeStore.getState();
  expect(state.templates.find((item) => item.code === "deposit_credited")?.eventId)
    .toBe("deposit.credited");
});

it("keeps an event template binding immutable when updating", () => {
  const store = usePrototypeStore.getState();
  const template = store.templates.find((item) => item.code === "deposit_credited")!;
  store.updateTemplate(template.id, { eventId: "order.filled" });
  expect(usePrototypeStore.getState().templates.find((item) => item.id === template.id)?.eventId)
    .toBe("deposit.credited");
});
```

- [x] **Step 3: 运行 store 测试并确认因字段/迁移缺失而失败**

Run:

```bash
npx vitest run src/store/prototypeStore.test.ts
```

Expected: FAIL，事件模板没有 `eventId` 或更新后绑定被覆盖。

- [x] **Step 4: 用事件目录变量替换通用变量**

在 `prototypeStore.ts` 中导入并使用：

```ts
import { getEventVariableNames } from "../domain/eventVariables";

variables: getEventVariableNames(id),
```

- [x] **Step 5: 给现有事件模板补齐绑定与所有者团队**

```ts
const eventTemplateBindings: Record<string, { eventId: string; owner: string }> = {
  deposit_credited: { eventId: "deposit.credited", owner: "资产运营" },
  withdraw_success: { eventId: "withdrawal.succeeded", owner: "资产运营" },
  order_filled: { eventId: "order.filled", owner: "交易运营" },
  liquidation_warning: { eventId: "liquidation.warning", owner: "合约风控" },
};
```

历史数据迁移和 mock 数据使用同一映射。

- [x] **Step 6: 在 store 中落实创建、更新约束**

事件模板保存时：

```ts
const event = get().events.find((item) => item.id === input.eventId);
if (!event) throw new Error("请选择有效的系统事件");
if (!input.owner?.trim()) throw new Error("请选择所有者团队");
```

并强制派生：

```ts
category: event.defaultCategory,
topic: event.defaultTopic,
risk: event.defaultRisk,
variables: [...event.variables],
```

事件模板更新时始终保留：

```ts
eventId: existing.eventId,
```

- [x] **Step 7: 重新运行 store 测试**

Run:

```bash
npx vitest run src/store/prototypeStore.test.ts
```

Expected: PASS。

---

## Task 2: 改造事件模板编辑器

**Files:**

- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Test: `src/pages/templates/TemplateEditorDrawer.single-language.test.tsx`

- [x] **Step 1: 先写事件模板编辑器失败测试**

覆盖：

```ts
it("selects an event from the event directory and locks inherited metadata", async () => {
  // 打开事件模板编辑器
  // 选择 deposit.credited
  // 断言一级分类、二级主题、风险等级自动带出且不可编辑
});

it("only exposes variables declared by the selected event", async () => {
  // 选择 deposit.credited
  // 可搜索 network，不可搜索 symbol
});

it("does not allow changing the bound event when editing", () => {
  // 编辑既有事件模板时系统事件选择框 disabled
});
```

- [x] **Step 2: 运行测试并确认失败**

Run:

```bash
npx vitest run src/pages/templates/TemplateEditorDrawer.single-language.test.tsx
```

Expected: FAIL，当前没有系统事件选择器且变量未按事件过滤。

- [x] **Step 3: 增加系统事件必选项**

```tsx
<Form.Item
  label="系统事件"
  field="eventId"
  required
  rules={[{ required: true, message: "请选择系统事件" }]}
>
  <Select
    disabled={Boolean(template)}
    options={store.events.map((event) => ({
      value: event.id,
      label: `${event.name} · ${event.id}`,
    }))}
    onChange={handleEventChange}
  />
</Form.Item>
```

- [x] **Step 4: 事件变化时自动填充并锁定展示字段**

```ts
const handleEventChange = (eventId: string) => {
  const event = store.events.find((item) => item.id === eventId);
  if (!event) return;
  setSelectedEventId(eventId);
  form.setFieldsValue({
    eventId,
    category: event.defaultCategory,
    topic: event.defaultTopic,
    risk: event.defaultRisk,
  });
};
```

事件模板的分类、主题、风险控件统一 `disabled`。

- [x] **Step 5: 变量面板按事件目录过滤**

```ts
const selectedEvent = store.events.find((event) => event.id === selectedEventId);
const availableTemplateVariables =
  entryScope === "manual"
    ? store.templateVariables
    : getEventTemplateVariables(selectedEvent?.variables ?? []);
```

- [x] **Step 6: 所有者团队必填并扩充受控选项**

```ts
const ownerTeamOptions = [
  "消息运营",
  "资产运营",
  "交易运营",
  "合约风控",
  "增长运营",
  "安全中心",
  "资金平台",
];
```

- [x] **Step 7: 保存时提交 `eventId`，删除名称推断展示位置**

```ts
eventId: entryScope === "event" ? values.eventId : undefined,
```

事件模板不再根据模板名称推断分类、主题或风险。

- [x] **Step 8: 重新运行编辑器测试**

Run:

```bash
npx vitest run src/pages/templates/TemplateEditorDrawer.single-language.test.tsx
```

Expected: PASS。

---

## Task 3: 在事件模板列表与详情展示绑定信息

**Files:**

- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/pages/templates/TemplateReadOnlyDetails.tsx`
- Test: `src/pages/templates/TemplateListPage.scope.test.tsx`
- Test: `src/pages/templates/TemplateReadOnlyDetails.test.tsx`

- [x] **Step 1: 先写失败测试**

列表断言：

```ts
expect(screen.getByText("系统事件")).toBeInTheDocument();
expect(screen.getByText("所有者团队")).toBeInTheDocument();
expect(screen.getByText("deposit.credited")).toBeInTheDocument();
expect(screen.getByText("资产运营")).toBeInTheDocument();
```

详情断言：

```ts
expect(screen.getByText("充值到账")).toBeInTheDocument();
expect(screen.getByText("deposit.credited")).toBeInTheDocument();
expect(screen.getByText("资产运营")).toBeInTheDocument();
```

- [x] **Step 2: 运行测试并确认失败**

Run:

```bash
npx vitest run src/pages/templates/TemplateListPage.scope.test.tsx src/pages/templates/TemplateReadOnlyDetails.test.tsx
```

Expected: FAIL，列表和只读详情没有完整事件绑定信息。

- [x] **Step 3: 事件模板列表增加两列**

仅 `scope=event` 展示：

```tsx
{
  title: "系统事件",
  render: (_, template) => {
    const event = store.events.find((item) => item.id === template.eventId);
    return (
      <>
        <div>{event?.name || "未绑定事件"}</div>
        <Typography.Text type="secondary">{template.eventId || "—"}</Typography.Text>
      </>
    );
  },
},
{
  title: "所有者团队",
  dataIndex: "owner",
  render: (owner) => owner || "—",
},
```

- [x] **Step 4: 只读详情增加系统事件和所有者团队**

组件接收事件目录：

```ts
events?: SystemEventDefinition[];
```

根据 `template.eventId` 展示事件名称和事件编码，事件模板详情保留所有者团队，人工模板不展示。

- [x] **Step 5: 重新运行列表与详情测试**

Run:

```bash
npx vitest run src/pages/templates/TemplateListPage.scope.test.tsx src/pages/templates/TemplateReadOnlyDetails.test.tsx
```

Expected: PASS。

---

## Task 4: 限制事件规则只能选择同事件模板

**Files:**

- Modify: `src/pages/automation/AutomationRuleListPage.tsx`
- Test: `src/pages/automation/AutomationRuleListPage.test.tsx`

- [x] **Step 1: 先改写失败测试**

```ts
it("only lists published templates bound to the selected event", async () => {
  // 选择 deposit.credited
  // 展开模板选择器
  // 显示充值到账模板，不显示提现成功模板
});

it("clears the selected template after changing the event", async () => {
  // 先选择事件和模板，再切换事件
  // 模板值清空
});
```

同步修正旧测试中的匹配关系：

```text
deposit.credited -> TPL-1008
order.filled -> TPL-1009
```

- [x] **Step 2: 运行测试并确认失败**

Run:

```bash
npx vitest run src/pages/automation/AutomationRuleListPage.test.tsx
```

Expected: FAIL，当前模板选择器仍展示所有事件模板。

- [x] **Step 3: 根据当前事件过滤模板**

```ts
const compatibleEventTemplates = eventTemplates.filter(
  (template) => template.eventId === conditionEventId,
);
```

没有选择事件时禁用模板选择器：

```tsx
disabled={!conditionEventId}
```

- [x] **Step 4: 切换事件时清除模板**

```ts
setConditionEventId(eventId);
setFormTemplateId(undefined);
form.setFieldValue("templateId", undefined);
```

- [x] **Step 5: 提交时防止不匹配模板**

```ts
if (!template || template.eventId !== values.eventId) {
  Message.error("请选择与系统事件匹配的已发布模板");
  return;
}
```

- [x] **Step 6: 重新运行事件规则测试**

Run:

```bash
npx vitest run src/pages/automation/AutomationRuleListPage.test.tsx
```

Expected: PASS。

---

## Task 5: 回归验证与交付

**Files:**

- Verify: `src/**`

- [x] **Step 1: 运行相关测试集合**

Run:

```bash
npx vitest run \
  src/store/prototypeStore.test.ts \
  src/pages/templates/TemplateEditorDrawer.single-language.test.tsx \
  src/pages/templates/TemplateListPage.scope.test.tsx \
  src/pages/templates/TemplateReadOnlyDetails.test.tsx \
  src/pages/automation/AutomationRuleListPage.test.tsx
```

Expected: PASS。

- [x] **Step 2: 运行完整测试**

Run:

```bash
npm test -- --run
```

Expected: PASS。

- [x] **Step 3: 执行生产构建**

Run:

```bash
npm run build
```

Expected: PASS，无 TypeScript 编译错误。

- [x] **Step 4: 检查差异完整性**

Run:

```bash
git diff --check
git status --short
git diff -- src/domain/types.ts src/store/prototypeStore.ts src/mocks/data.ts src/pages/templates src/pages/automation
```

Expected: 无空白错误，只包含本功能相关改动。

- [x] **Step 5: 更新本计划复选框并总结交付内容**

不自动推送 GitHub 或部署服务器，等待用户明确指令。
