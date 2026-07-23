# 已发布人工模板演示数据实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. The user explicitly requested implementation without automated tests; verification is limited to build and diff checks.

**Goal:** 在人工消息模板页面增加一条可直接验证已发布锁定效果的完整人工模板数据。

**Architecture:** 模板和对应翻译批次作为稳定种子数据加入 `src/mocks/data.ts`。持久化迁移按 ID 合并已保存状态与最新种子数据，保留本地修改并追加缺失的演示对象。

**Tech Stack:** TypeScript、React 原型状态仓库、localStorage、Vite。

## Global Constraints

- 固定模板 ID 为 `TPL-1007`，翻译批次 ID 为 `MT-260716-007`。
- 模板必须为 `manual + 已发布 + 全部审核通过`。
- 已保存的同 ID 本地对象优先，缺失的新种子对象自动追加。
- 合并必须按 ID 去重。
- 按用户要求不新增、不运行自动化测试。

---

### Task 1: 新增已发布人工模板和翻译结果

**Files:**
- Modify: `src/mocks/data.ts`

**Interfaces:**
- Produces: `templates` 中的 `TPL-1007`。
- Produces: `translationBatches` 中的 `MT-260716-007`。

- [ ] **Step 1: 新增完整模板对象**

模板使用编码 `vip_benefit_update`、版本 `v5`、渠道站内信和 Push，并包含中文站内信、Push、跳转地址、模板变量和所有者信息。

- [ ] **Step 2: 新增完整已审核翻译批次**

批次包含中文源文案以及 `en-US` 子任务；子任务状态为 `已通过`，同时保留 `machineOutput`、`humanDraft`、`approvedOutput`、审核人和审核时间。

---

### Task 2: 让旧本地状态自动补齐新种子数据

**Files:**
- Modify: `src/store/prototypeStore.ts`

**Interfaces:**
- Consumes: `createSeed()` 返回的最新模板和翻译批次。
- Produces: 按 ID 去重的模板与翻译批次候选集合。

- [ ] **Step 1: 合并模板种子数据**

先映射已保存模板并合并同 ID 最新字段，再追加本地不存在的最新种子模板，之后沿用现有适用场景归一化逻辑。

- [ ] **Step 2: 合并翻译批次种子数据**

保留已保存批次，并追加本地不存在的最新种子批次，再交给 `normalizeTranslationBatches` 处理。

---

### Task 3: 静态验证与提交

**Files:**
- Modify: `src/mocks/data.ts`
- Modify: `src/store/prototypeStore.ts`

- [ ] **Step 1: 运行静态验证**

Run: `npm run build && git diff --check`

Expected: TypeScript 与 Vite 构建成功，`git diff --check` 无输出。

- [ ] **Step 2: 提交实现**

```bash
git add src/mocks/data.ts src/store/prototypeStore.ts
git commit -m "feat: add approved manual template fixture"
```
