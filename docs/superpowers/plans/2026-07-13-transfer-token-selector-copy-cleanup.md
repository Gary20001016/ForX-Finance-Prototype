# App 划转代币选择与文案清理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除划转页无意义英文与历史入口，并加入贯穿完整划转流程的 USDC/USDT 代币下拉选择。

**Architecture:** 继续使用 `transfer-app/index.html` 单文件原型，以 `state.token` 和按代币分组的余额对象驱动所有文案、校验、核对和回执。使用现有 Node + Playwright 文件增加行为回归，不引入外部资源或新运行依赖。

**Tech Stack:** HTML5、CSS、原生 JavaScript、Node.js test runner、Playwright Chromium。

## Global Constraints

- 账户类型只有资金账户和合约账户。
- 代币仅支持 USDC、USDT，默认 USDC。
- USDC 初始余额为资金账户 20、合约账户 0；USDT 初始余额为资金账户 50、合约账户 0。
- 两种代币最低划转 10，手续费 0，最多六位小数。
- 删除划转历史入口，不增加历史页面。
- 删除纯装饰英文，保留 USDC、USDT、ForX 等必要名称。
- 不增加外部网络请求与第三方前端依赖。

---

### Task 1: 锁定文案和代币选择行为

**Files:**
- Modify: `transfer-app/prototype.test.mjs`
- Test: `transfer-app/prototype.test.mjs`

**Interfaces:**
- Consumes: `window.transferPrototype` 和现有页面 DOM。
- Produces: 对文案删除、下拉选项、代币切换与独立余额的可执行验收条件。

- [ ] **Step 1: 写入失败测试**

新增断言：HTML 不包含 `Capital route`、`INTERACTIVE PROTOTYPE`、`SCREEN BREAKDOWN`、`ERROR STATES` 或划转记录按钮；`#token-trigger` 可打开 `#token-menu`，菜单只有 USDC/USDT；选择 USDT 后金额单位、余额、最低金额文案变为 USDT，输入被清空。

- [ ] **Step 2: 运行目标测试并确认失败**

```bash
NODE_PATH=/Users/gary/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/gary/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern='removes decorative English|switches between USDC and USDT' transfer-app/prototype.test.mjs
```

Expected: FAIL，因为旧页面仍有装饰英文、历史按钮和固定 USDC。

- [ ] **Step 3: 暂不修改生产代码，提交测试红灯证据后进入 Task 2**

测试文件与生产实现一起在 Task 2 绿灯后提交，避免提交不可运行状态。

### Task 2: 实现代币下拉与全流程同步

**Files:**
- Modify: `transfer-app/index.html`
- Modify: `transfer-app/prototype.test.mjs`

**Interfaces:**
- Consumes: `state.token: 'USDC' | 'USDT'`、`state.balances[token][account]`。
- Produces: `selectToken(token)`、`renderTokenSelector()`，以及使用当前代币的 `formatAmount(value)` 和 `validateAmount(raw)`。

- [ ] **Step 1: 替换状态结构**

将初始状态改为：

```js
{
  token: 'USDC',
  balances: {
    USDC: { fund: 20, contract: 0 },
    USDT: { fund: 50, contract: 0 }
  }
}
```

所有余额访问统一通过 `currentBalances()` 返回 `state.balances[state.token]`。

- [ ] **Step 2: 增加可访问的下拉控件**

新增 `#token-trigger`、`#token-menu` 与两个 `[data-token]` 选项；使用 `aria-haspopup="listbox"`、`aria-expanded` 和 `role="option"`。实现点击触发、选择、点击外部关闭、Escape 关闭与焦点返回。

- [ ] **Step 3: 同步当前代币到业务流程**

`formatAmount`、余额渲染、最低金额提示、校验错误、核对弹层、手续费、处理操作和成功回执全部读取 `state.token`。待处理操作保存 `token`，成功时只修改 `state.balances[operation.token]`。

- [ ] **Step 4: 实现代币切换重置规则**

`selectToken(token)` 校验 token 后更新 `state.token`，清空金额和待处理操作，关闭菜单并重新渲染。`resetPrototype()` 恢复整个初始状态。

- [ ] **Step 5: 清理界面**

删除顶栏历史按钮和 `.history-icon`；删除 `Capital route` 眉题；将展示页英文 kicker 删除或换为“交互原型”“页面拆解”“异常状态”。顶栏标题通过三列网格或绝对居中保持居中。

- [ ] **Step 6: 运行目标测试并确认通过**

运行 Task 1 命令。Expected: 两项测试 PASS。

- [ ] **Step 7: 提交功能**

```bash
git add transfer-app/index.html transfer-app/prototype.test.mjs
git commit -m "feat: add transfer token selector"
```

### Task 3: 完整流程、视觉与回归验收

**Files:**
- Modify: `transfer-app/prototype.test.mjs`
- Modify: `transfer-app/index.html`（仅在验收发现缺陷时）

**Interfaces:**
- Consumes: Task 2 的代币状态与选择控件。
- Produces: 可证明 USDT 完整划转、代币余额隔离、Reset 恢复和响应式无回归的测试结果。

- [ ] **Step 1: 写入 USDT 完整流程失败测试**

测试选择 USDT、输入 10、完成核对和划转，断言回执与余额均为 USDT；返回编辑页切换 USDC 后断言 USDC 仍为 20/0。

- [ ] **Step 2: 写入 Reset 与菜单键盘测试**

测试 Reset 恢复 USDC 和两种代币初始余额；测试 Escape 关闭菜单并把焦点返回 `#token-trigger`。

- [ ] **Step 3: 运行新增测试并修复直至绿灯**

```bash
NODE_PATH=/Users/gary/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/gary/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern='completes a USDT transfer|resets token balances|closes the token menu' transfer-app/prototype.test.mjs
```

Expected: PASS。

- [ ] **Step 4: 运行完整回归**

```bash
NODE_PATH=/Users/gary/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/gary/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test transfer-app/prototype.test.mjs
```

Expected: 所有测试 PASS，0 fail。

- [ ] **Step 5: 做 390×844 和 320×760 视觉检查**

确认代币菜单不溢出、标题居中、历史入口已消失、页面无横向滚动、静态画廊文案和单位正确。

- [ ] **Step 6: 评审、提交验收修复并推送**

```bash
git diff --check
git status -sb
git push origin main
```

Expected: 本地 `main` 与 `origin/main` 同步，`.DS_Store` 仍未跟踪且未推送。
