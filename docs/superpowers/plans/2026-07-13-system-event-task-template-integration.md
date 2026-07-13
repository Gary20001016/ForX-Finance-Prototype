# 系统事件、消息任务与消息模板整合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将系统事件、事件触发任务和已发布消息模板连接成可配置、可审批、可测试和可追踪的完整前端流程。

**Architecture:** 系统事件只保存事件定义和变量结构；`MessageTask` 通过 `triggerType` 区分人工发送与事件触发，并由 `eventConfig` 保存事件策略；模板通过 `templateId + templateVersion` 被任务引用。前端状态仓库负责兼容种子数据、校验映射、审批状态迁移和测试事件生成发送记录。

**Tech Stack:** React 18、TypeScript 5.9、Vite 7、Arco Design React、React Router 7、Vitest、Testing Library。

## Global Constraints

- 只开发前端和本地状态模拟，不连接真实事件总线、外部机翻或 APNs/FCM。
- 正式渠道仅包含 Web 站内信和 App Push。
- 系统事件任务只能选择已发布且全部目标语言人工审核通过的模板。
- 人工发送任务不强制绑定系统事件，并保留模板和临时消息两种内容来源。
- 除“发送中”和“已完成”外，任务均可再次编辑；编辑会撤回旧审批。
- 事件任务审批通过后状态为“已启用”，人工任务审批通过后状态为“待发送”。
- 当前工作区包含用户已有的未提交修改；实施期间只做分文件差异检查，不创建生产代码提交，避免把既有修改混入新提交。

---

### Task 1: 扩展领域模型与事件策略校验

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/store/prototypeStore.ts`
- Test: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Produces: `TaskTriggerType`、`EventVariableMapping`、`EventTriggerConfig`。
- Produces: `validateEventTaskConfig(config, event, template)`。
- Produces: `testSystemEvent(eventId): EventTestResult`。

- [ ] **Step 1: 写失败测试——事件任务字段与审批状态**

```ts
it('stores event trigger configuration and enables the task after approval', () => {
  const task=submitTask({
    name:'提现成功通知规则',triggerType:'event',category:'资产通知',nature:'强事务',risk:'关键',
    template:'withdraw_success v12',templateId:'TPL-1001',templateVersion:'v12',
    channels:['站内信','Push'],audience:'事件主体用户',audienceCount:1,schedule:'事件到达时',creator:'Gary Ma',team:'资金平台',
    eventConfig:{eventId:'withdrawal.succeeded',eventVersion:'1.0.0',conditionExpression:'',dedupeKey:'{{ event_id }}:{{ user_id }}',eventTtlSeconds:300,maxRetries:3,retryBackoffSeconds:30,variableMappings:[{eventField:'user_nickname',templateVariable:'user_nickname',required:true}]},
  });
  const approval=getPrototypeState().approvals.find((item)=>item.taskId===task.id)!;
  reviewApproval(approval.id,{decision:'approve',reviewer:'Reviewer 02',opinion:'通过'});
  expect(getPrototypeState().tasks.find((item)=>item.id===task.id)?.status).toBe('已启用');
});
```

- [ ] **Step 2: 运行测试并确认因类型或状态逻辑缺失而失败**

Run: `npx vitest run src/store/prototypeStore.test.ts --maxWorkers=1 --reporter=verbose`

Expected: FAIL，提示 `triggerType` / `eventConfig` 不存在或审批后状态仍为“待发送”。

- [ ] **Step 3: 增加领域类型**

```ts
export type TaskTriggerType='manual'|'event';
export interface EventVariableMapping { eventField:string; templateVariable:string; required:boolean; }
export interface EventTriggerConfig {
  eventId:string;
  eventVersion:string;
  conditionExpression:string;
  variableMappings:EventVariableMapping[];
  dedupeKey:string;
  eventTtlSeconds:number;
  maxRetries:number;
  retryBackoffSeconds:number;
}
```

向 `MessageTask` 增加 `triggerType`、`templateId`、`templateVersion`、`eventConfig`；向 `ApprovalItem` 增加 `triggerType` 和 `eventConfig`。从 `SystemEventDefinition` 移除直接模板绑定字段，并增加可选的 `description`。

- [ ] **Step 4: 实现仓库状态迁移和校验**

```ts
export const validateEventTaskConfig=(config,event,template)=>{
  if(!event)return {valid:false,reason:'系统事件不存在'};
  if(!template||template.status!=='已发布'||template.translationReadiness!=='全部审核通过')return {valid:false,reason:'模板尚未发布'};
  if(!config.dedupeKey.trim())return {valid:false,reason:'去重键不能为空'};
  const mapped=new Set(config.variableMappings.map((item)=>item.templateVariable));
  const missing=(template.variables||[]).filter((item)=>!mapped.has(item));
  return missing.length?{valid:false,reason:`缺少变量映射：${missing.join('、')}`}:{valid:true};
};
```

审批通过时根据 `task.triggerType` 设置“已启用”或“待发送”。保存或重新提交既有任务时继续撤回旧审批。

- [ ] **Step 5: 运行仓库测试并确认通过**

Run: `npx vitest run src/store/prototypeStore.test.ts --maxWorkers=1 --reporter=verbose`

Expected: PASS。

- [ ] **Step 6: 检查本任务差异**

```bash
git diff --check -- src/domain/types.ts src/store/prototypeStore.ts src/store/prototypeStore.test.ts
```

---

### Task 2: 迁移种子数据并实现测试事件解析

**Files:**
- Modify: `src/store/prototypeStore.ts`
- Modify: `src/mocks/data.ts`
- Test: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Consumes: `EventTriggerConfig`、`validateEventTaskConfig`。
- Produces: `EventTestResult={ok:boolean;reason?:string;deliveryId?:string;taskId?:string}`。

- [ ] **Step 1: 写失败测试——测试事件必须经过已启用任务**

```ts
it('generates a delivery through an enabled event task', () => {
  const result=testSystemEvent('liquidation.warning');
  expect(result.ok).toBe(true);
  expect(result.taskId).toBeTruthy();
  expect(getPrototypeState().deliveries[0].eventCode).toBe('liquidation.warning');
});

it('blocks a test event without an enabled task', () => {
  const result=testSystemEvent('trial_fund.credited');
  expect(result).toEqual({ok:false,reason:'没有已启用的事件触发任务'});
});
```

- [ ] **Step 2: 运行测试并确认当前测试事件绕过任务而失败**

Run: `npx vitest run src/store/prototypeStore.test.ts --maxWorkers=1 --reporter=verbose`

Expected: FAIL，当前 `testSystemEvent` 没有返回结果且不检查任务。

- [ ] **Step 3: 迁移事件与任务种子**

把事件种子改成事件定义，不保存模板。为提现成功和强平预警种子任务补充 `triggerType:'event'`、模板 ID/版本、事件配置和完整变量映射；其余现有任务设为 `triggerType:'manual'`。

- [ ] **Step 4: 实现任务解析和发送记录生成**

`testSystemEvent` 按 `eventId` 查找状态为“已启用”的任务，执行校验，成功后使用任务名称、模板版本、渠道和事件编码生成发送记录；失败时返回中文阻断原因且不写入发送记录。

- [ ] **Step 5: 运行测试并确认通过**

Run: `npx vitest run src/store/prototypeStore.test.ts --maxWorkers=1 --reporter=verbose`

Expected: PASS。

- [ ] **Step 6: 检查本任务差异**

```bash
git diff --check -- src/store/prototypeStore.ts src/store/prototypeStore.test.ts src/mocks/data.ts
```

---

### Task 3: 在任务创建页配置系统事件触发

**Files:**
- Create: `src/pages/tasks/EventTriggerFields.tsx`
- Modify: `src/pages/tasks/CreateTaskPage.tsx`
- Modify: `src/pages/tasks/TaskSummary.tsx`
- Test: `src/pages/tasks/CreateTaskPage.event.test.tsx`

**Interfaces:**
- Consumes: `SystemEventDefinition[]`、已发布 `MessageTemplate[]`。
- Produces: 完整 `EventTriggerConfig` 和事件任务提交数据。

- [ ] **Step 1: 写失败测试——事件入口与预选**

```tsx
it('configures an event-triggered task with event policy fields', async () => {
  render(<MemoryRouter initialEntries={[{pathname:'/tasks/create',state:{eventId:'liquidation.warning'}}]}><CreateTaskPage/></MemoryRouter>);
  expect(screen.getByText('系统事件触发')).toBeVisible();
  expect(screen.getByText('合约强平预警')).toBeVisible();
  expect(screen.getByLabelText('触发条件')).toBeVisible();
  expect(screen.getByLabelText('去重键')).toBeVisible();
  expect(screen.getByText('变量映射')).toBeVisible();
});
```

- [ ] **Step 2: 运行测试并确认事件配置界面不存在**

Run: `npx vitest run src/pages/tasks/CreateTaskPage.event.test.tsx --maxWorkers=1 --reporter=verbose`

Expected: FAIL，找不到“系统事件触发”。

- [ ] **Step 3: 创建聚焦的事件配置组件**

`EventTriggerFields.tsx` 负责事件选择、事件摘要、已发布模板选择、同名变量自动映射、映射编辑、触发条件、去重键、事件 TTL、最大重试和首次退避。组件通过 `value/onChange` 输出完整 `EventTriggerConfig`，不直接写仓库。

- [ ] **Step 4: 接入创建向导**

第一步增加触发方式。人工发送沿用现有内容来源；系统事件触发显示 `EventTriggerFields` 并强制模板模式。第二步对事件任务显示固定受众“事件主体用户”；第三步隐藏定时发送并显示“事件到达时发送”。摘要页展示事件编码、模板版本、映射数量、条件、去重和重试。

- [ ] **Step 5: 增加提交门禁**

调用 `validateEventTaskConfig`；未选择事件、模板未发布、变量映射缺失或去重键为空时禁止进入下一步和提交审批。

- [ ] **Step 6: 运行创建页相关测试**

Run: `npx vitest run src/pages/tasks/CreateTaskPage.event.test.tsx src/pages/tasks/CreateTaskPage.test.tsx src/pages/tasks/CreateTaskPage.completion.test.tsx --maxWorkers=1 --reporter=verbose`

Expected: PASS。

- [ ] **Step 7: 检查本任务差异**

```bash
git diff --check -- src/pages/tasks/EventTriggerFields.tsx src/pages/tasks/CreateTaskPage.tsx src/pages/tasks/TaskSummary.tsx src/pages/tasks/CreateTaskPage.event.test.tsx
```

---

### Task 4: 补齐任务列表与审批冻结信息

**Files:**
- Modify: `src/pages/tasks/TaskListPage.tsx`
- Modify: `src/pages/approvals/ApprovalDrawer.tsx`
- Test: `src/pages/tasks/TaskListPage.test.tsx`
- Test: `src/pages/approvals/ApprovalCenter.completion.test.tsx`

**Interfaces:**
- Consumes: `MessageTask.triggerType`、`eventConfig`。
- Produces: 任务详情和审批详情中的事件策略快照。

- [ ] **Step 1: 写失败测试——列表和详情展示事件策略**

```tsx
it('shows event code for an event-triggered task', () => {
  render(<MemoryRouter><TaskListPage/></MemoryRouter>);
  expect(screen.getByText('系统事件触发')).toBeVisible();
  expect(screen.getByText('liquidation.warning')).toBeVisible();
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npx vitest run src/pages/tasks/TaskListPage.test.tsx --maxWorkers=1 --reporter=verbose`

Expected: FAIL，当前没有事件编码展示。

- [ ] **Step 3: 实现列表、详情和编辑恢复**

类型列展示触发方式；事件任务显示事件编码。详情抽屉增加事件版本、触发条件、变量映射、去重键、事件 TTL 和重试。再次编辑继续通过路由状态传递完整任务，创建页恢复 `triggerType` 和 `eventConfig`。

- [ ] **Step 4: 在审批抽屉展示冻结策略**

审批描述和版本差异中加入触发方式、事件、模板版本、条件、映射、去重和重试，确保审核人不依赖其他页面。

- [ ] **Step 5: 运行任务与审批测试**

Run: `npx vitest run src/pages/tasks/TaskListPage.test.tsx src/pages/approvals/ApprovalCenter.completion.test.tsx --maxWorkers=1 --reporter=verbose`

Expected: PASS。

- [ ] **Step 6: 检查本任务差异**

```bash
git diff --check -- src/pages/tasks/TaskListPage.tsx src/pages/tasks/TaskListPage.test.tsx src/pages/approvals/ApprovalDrawer.tsx src/pages/approvals/ApprovalCenter.completion.test.tsx
```

---

### Task 5: 重构系统事件页为任务关联入口

**Files:**
- Modify: `src/pages/events/EventListPage.tsx`
- Modify: `src/pages/events/EventListPage.v2.test.tsx`

**Interfaces:**
- Consumes: `events`、`tasks`、`testSystemEvent`。
- Produces: `/tasks/create` 路由状态 `{eventId}`。

- [ ] **Step 1: 写失败测试——关联任务与创建入口**

```tsx
it('shows related trigger tasks instead of a direct template binding', async () => {
  render(<MemoryRouter><EventListPage/></MemoryRouter>);
  expect(screen.getByText('关联触发任务')).toBeVisible();
  expect(screen.queryByText('绑定模板')).not.toBeInTheDocument();
  await userEvent.click(screen.getAllByText('详情')[0]);
  expect(screen.getByRole('button',{name:'创建触发任务'})).toBeVisible();
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npx vitest run src/pages/events/EventListPage.v2.test.tsx --maxWorkers=1 --reporter=verbose`

Expected: FAIL，当前仍显示“绑定模板”。

- [ ] **Step 3: 实现关联展示和跳转**

通过 `task.eventConfig.eventId` 计算关联任务。列表显示数量和启用数量；详情用表格展示任务、模板版本、条件、渠道和状态。“创建触发任务”跳转并预选事件。

- [ ] **Step 4: 修改注册事件表单**

删除“绑定已发布模板”，保留事件编码、名称、业务线、版本、调用方、TTL 和变量列表。

- [ ] **Step 5: 接入测试事件结果反馈**

调用 `testSystemEvent` 后，根据 `ok` 显示成功发送记录或明确阻断原因。测试成功后事件详情刷新最近测试时间。

- [ ] **Step 6: 运行事件页测试**

Run: `npx vitest run src/pages/events/EventListPage.v2.test.tsx --maxWorkers=1 --reporter=verbose`

Expected: PASS。

- [ ] **Step 7: 检查本任务差异**

```bash
git diff --check -- src/pages/events/EventListPage.tsx src/pages/events/EventListPage.v2.test.tsx
```

---

### Task 6: 在模板页展示任务使用关系

**Files:**
- Modify: `src/pages/templates/TemplateListPage.tsx`
- Modify: `src/pages/templates/TemplateListPage.completion.test.tsx`

**Interfaces:**
- Consumes: `MessageTask.templateId`、`MessageTask.triggerType`。
- Produces: 模板使用任务数量和使用详情。

- [ ] **Step 1: 写失败测试——模板不再显示单一事件编码**

```tsx
it('shows task usage instead of a direct event code binding', () => {
  render(<MemoryRouter><TemplateListPage/></MemoryRouter>);
  expect(screen.getByText('使用任务')).toBeVisible();
  expect(screen.queryByText('事件编码')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npx vitest run src/pages/templates/TemplateListPage.completion.test.tsx --maxWorkers=1 --reporter=verbose`

Expected: FAIL，当前表头仍为“事件编码”。

- [ ] **Step 3: 实现使用关系展示**

通过 `task.templateId` 计算使用数量，表格显示“人工 N · 事件 N”。编辑抽屉或多语言流程旁显示使用该模板版本的任务名称、触发方式和状态。

- [ ] **Step 4: 运行模板测试**

Run: `npx vitest run src/pages/templates/TemplateListPage.completion.test.tsx src/pages/templates/TemplateListPage.translation.test.tsx --maxWorkers=1 --reporter=verbose`

Expected: PASS。

- [ ] **Step 5: 检查本任务差异**

```bash
git diff --check -- src/pages/templates/TemplateListPage.tsx src/pages/templates/TemplateListPage.completion.test.tsx
```

---

### Task 7: 全量回归与浏览器验收

**Files:**
- Modify if needed: `README.md`
- Verify: all touched source and test files

**Interfaces:**
- Consumes: 完成后的事件任务闭环。
- Produces: 可构建、可演示的最终前端。

- [ ] **Step 1: 运行完整测试**

Run: `npm run test:run -- --maxWorkers=1 --testTimeout=15000 --reporter=dot`

Expected: 所有测试文件和测试用例通过。

- [ ] **Step 2: 运行生产构建和差异检查**

Run: `npm run build && git diff --check`

Expected: TypeScript、Vite 构建成功且无空白错误。

- [ ] **Step 3: 浏览器验收关键路径**

依次验证：

1. 从系统事件详情点击“创建触发任务”。
2. 创建页预选事件，选择已发布模板并显示变量映射。
3. 提交审批后审批抽屉展示冻结事件策略。
4. 审批通过后任务状态变为“已启用”。
5. 返回事件详情发送测试事件并在发送记录中看到事件编码和任务。
6. 模板列表显示人工任务与事件任务使用数量。
7. 人工任务与临时多语言任务仍可正常创建。

- [ ] **Step 4: 检查浏览器错误日志**

Expected: 当前应用页面无 error 级别日志。

- [ ] **Step 5: 更新运行文档并检查差异**

```bash
git diff --check -- README.md
```
