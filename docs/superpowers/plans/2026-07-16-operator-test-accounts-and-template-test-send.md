# 操作者测试账号与模板测试发送实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Follow red-green-refactor for every behavior change.

**Goal:** 让操作者在系统配置中维护最多 4 个个人测试 UID，并在模板编辑抽屉中自动向本人全部测试账号发送当前未保存内容。

**Architecture:** `PrototypeState`持久化操作者测试账号，数据层统一执行所有权、重复和上限校验，并在测试发送时根据`operatorId`自动解析接收人。系统配置和模板编辑分别使用独立的`TestAccountPanel`与`TemplateTestSendModal`组件，共享状态仓库但不直接互相依赖。

**Tech Stack:** React 18、TypeScript、Arco Design React、Vitest、Testing Library、Vite。

## Global Constraints

- 当前操作者固定为`admin-01 / Gary Ma`。
- 每名操作者最多 4 个测试 UID。
- 测试发送方法不接受 UID 列表，接收人必须由`operatorId`自动解析。
- 已发布模板不提供测试发送。
- 测试发送不写入正式任务或发送记录。

---

### Task 1: 测试账号领域模型和数据层约束

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/mocks/data.ts`
- Modify: `src/store/prototypeStore.ts`
- Test: `src/store/prototypeStore.test.ts`

**Interfaces:**
- Produces: `OperatorTestAccount`。
- Produces: `getOperatorTestAccounts(operatorId)`。
- Produces: `addOperatorTestAccount(input)`、`updateOperatorTestAccount(id, operatorId, changes)`、`removeOperatorTestAccount(id, operatorId)`。
- Produces: `sendTemplateTest(input)`，返回账号数、渠道数、发送条数与接收 UID；输入不包含 UID 列表。

- [ ] **Step 1: 编写账号上限、重复、所有权和自动解析接收人的失败测试**

在`prototypeStore.test.ts`新增四个行为：同一操作者可添加 4 个账号；第 5 个被拒绝；重复 UID 被拒绝；其他操作者不能修改或删除；`sendTemplateTest`只返回指定操作者已绑定的 UID，并按账号数乘渠道数计算总量。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- src/store/prototypeStore.test.ts --run`

Expected: FAIL，原因是测试账号类型和仓库方法尚不存在。

- [ ] **Step 3: 实现模型、种子数据、持久化和仓库方法**

新增`OperatorTestAccount`字段：`id/operatorId/uid/remark/verified/createdAt/updatedAt`。为`admin-01`提供两个默认测试账号。写入方法对 UID 去空格、校验同操作者唯一性和 4 个上限；更新和删除校验所有权。`sendTemplateTest`校验账号存在、渠道、内容和变量值，并自动读取本人账号。

- [ ] **Step 4: 运行数据层测试确认通过**

Run: `npm test -- src/store/prototypeStore.test.ts --run`

Expected: PASS。

---

### Task 2: 系统配置测试账号 Tab

**Files:**
- Create: `src/pages/settings/TestAccountPanel.tsx`
- Modify: `src/pages/settings/SettingsPage.tsx`
- Test: `src/pages/settings/SettingsPage.test-accounts.test.tsx`

**Interfaces:**
- Consumes: Task 1 的测试账号查询和写入方法。
- Produces: `/settings?tab=test-accounts`对应的“测试账号”Tab。

- [ ] **Step 1: 编写配置 Tab 的失败测试**

测试进入带查询参数的设置页时直接展示“测试账号”，显示当前数量和最多 4 个；点击新增可填写 UID 与备注并保存。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- src/pages/settings/SettingsPage.test-accounts.test.tsx --run`

Expected: FAIL，页面尚无测试账号 Tab。

- [ ] **Step 3: 实现独立配置面板并接入查询参数**

`TestAccountPanel`展示本人账号、验证状态、备注和时间，支持新增、编辑备注和删除；达到 4 个时禁用新增。`SettingsPage`读取`tab`查询参数作为初始 Tab，并新增`test-accounts`页签。

- [ ] **Step 4: 运行配置页面测试确认通过**

Run: `npm test -- src/pages/settings/SettingsPage.test-accounts.test.tsx --run`

Expected: PASS。

---

### Task 3: 模板测试发送弹窗

**Files:**
- Create: `src/pages/templates/TemplateTestSendModal.tsx`
- Modify: `src/pages/templates/TemplateEditorDrawer.tsx`
- Test: `src/pages/templates/TemplateEditorDrawer.test-send.test.tsx`

**Interfaces:**
- Consumes: 当前`content`、表单渠道、模板变量和`sendTemplateTest`。
- Produces: 编辑抽屉底部“测试发送”与自动接收人弹窗。

- [ ] **Step 1: 编写自动接收人和发送结果的失败测试**

测试新建模板抽屉显示“测试发送”；打开后展示本人全部测试账号且没有 UID 输入框；填写变量后发送，页面显示账号数、渠道数和发送条数。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- src/pages/templates/TemplateEditorDrawer.test-send.test.tsx --run`

Expected: FAIL，测试发送弹窗尚不存在。

- [ ] **Step 3: 实现测试发送弹窗和抽屉入口**

弹窗只读展示本人全部测试账号，默认选中模板当前渠道，根据变量列表生成输入项。无账号时展示跳转系统配置按钮。发送成功保留弹窗并显示汇总结果。编辑抽屉底部在“保存草稿”前增加入口，锁定详情分支不渲染入口。

- [ ] **Step 4: 运行模板测试发送测试确认通过**

Run: `npm test -- src/pages/templates/TemplateEditorDrawer.test-send.test.tsx --run`

Expected: PASS。

---

### Task 4: PRD、全量验证与提交

**Files:**
- Modify: `docs/prd/message-center/03-消息模板与多语言.md`
- Modify: `docs/prd/message-center/09-系统配置与审计.md`

- [ ] **Step 1: 同步 PRD**

模板文档写明测试发送使用当前未保存内容、本人全部测试账号、当前渠道和变量样例；配置文档写明操作者隔离、每人最多 4 个和自动选择规则。

- [ ] **Step 2: 运行相关测试与构建**

Run: `npm test -- src/store/prototypeStore.test.ts src/pages/settings/SettingsPage.test-accounts.test.tsx src/pages/templates/TemplateEditorDrawer.test-send.test.tsx --run && npm run build && git diff --check`

Expected: 所有相关测试通过，TypeScript/Vite 构建成功，差异检查无输出。

- [ ] **Step 3: 提交实现**

```bash
git add src docs/prd/message-center
git commit -m "feat: add operator template test sends"
```
