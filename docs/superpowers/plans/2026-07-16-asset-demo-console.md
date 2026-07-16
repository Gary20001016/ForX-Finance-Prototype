# Asset Demo Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every prototype-only state control out of the ForX phone UI into a contextual desktop demo console without changing asset workflows.

**Architecture:** Keep the existing single-file state machine and document-level event delegation. Add a sibling `#demo-console` beside the phone, render it from the same `state` in `render()`, and reuse existing control selectors so state transitions remain single-sourced. Product renderers stop emitting prototype controls.

**Tech Stack:** Standalone HTML, CSS, vanilla JavaScript, Node.js test runner, Playwright, Google `design.md` lint.

## Global Constraints

- The phone must not contain prototype-only copy or state controls.
- Keep “填入示例地址” inside the phone because the approved scope is B rather than C.
- The console is visible on desktop and hidden at widths of 800px or less.
- Do not add remote assets, libraries, or network requests.
- Preserve balance, terminal-state, MFA, wallet-session, and accessibility behavior.

---

### Task 1: Lock the product/demo boundary with tests

**Files:**
- Modify: `asset-center-app/prototype.test.mjs`
- Test: `asset-center-app/prototype.test.mjs`

**Interfaces:**
- Consumes: `#interactive-phone`, `#demo-console`, `window.assetPrototype.getState()`.
- Produces: regression expectations for console placement, contextual controls, and mobile hiding.

- [ ] **Step 1: Write failing placement tests**

```js
test('prototype-only controls live outside the phone', async () => {
  await withPage(async page => {
    await openDeposit(page);
    assert.equal(await page.locator('#interactive-phone [data-start-demo-deposit]').count(), 0);
    assert.equal(await page.locator('#demo-console [data-start-demo-deposit]').count(), 1);
  });
});

test('mobile product view hides the demo console', async () => {
  await withPage(async page => {
    assert.equal(await page.locator('#demo-console').isVisible(), false);
  }, { width:390, height:844 });
});
```

- [ ] **Step 2: Write the failing phone-copy test**

```js
assert.doesNotMatch(
  await page.locator('#interactive-phone').textContent(),
  /模拟收到|模拟钱包|推进演示状态|完成演示处理/
);
```

- [ ] **Step 3: Run the focused tests and verify RED**

```bash
NODE_PATH=/Users/gary/.npm/_npx/e41f203b7505f1fb/node_modules node --test --test-name-pattern="prototype-only controls|mobile product view|phone never" asset-center-app/prototype.test.mjs
```

Expected: FAIL because the console does not exist and phone renderers still emit simulation controls.

### Task 2: Add the external contextual console shell

**Files:**
- Modify: `asset-center-app/index.html:16-25`
- Modify: `asset-center-app/index.html:558-580`
- Modify: `asset-center-app/index.html:634-640`
- Modify: `asset-center-app/index.html:1082`
- Test: `asset-center-app/prototype.test.mjs`

**Interfaces:**
- Consumes: global `state` and the existing `render()` lifecycle.
- Produces: `demoConsoleHtml(): string`, `demoConsoleActions(): string`, and `#demo-console-root`.

- [ ] **Step 1: Add the console sibling and DOM reference**

```html
<aside class="demo-console" id="demo-console" aria-label="原型演示控制台">
  <div id="demo-console-root"></div>
</aside>
```

```js
const demoConsoleRoot = document.querySelector('#demo-console-root');
```

- [ ] **Step 2: Implement route-aware rendering**

```js
function demoConsoleHtml(){
  const title = ({
    deposit:'充值入口',
    'deposit-progress':'充值处理',
    'withdraw-progress':'提现处理',
    'transfer-review':'划转确认',
    'transfer-result':'划转处理'
  })[state.route] || '当前页面';
  return `<header class="demo-console-header"><small>原型工具</small><h2>演示控制台</h2><p>${title}</p></header>${demoConsoleActions()}`;
}

function render(){
  root.dataset.route=state.route;
  root.innerHTML=screenHtml();
  demoConsoleRoot.innerHTML=demoConsoleHtml();
}
```

- [ ] **Step 3: Add responsive layout rules**

```css
.prototype-shell { grid-template-columns:minmax(220px,290px) 390px minmax(240px,290px); gap:32px; }
.demo-console { align-self:center; min-height:300px; border:1px solid var(--line); border-radius:20px; background:rgba(9,14,11,.92); }
@media (max-width:1080px) { .prototype-meta { display:none; } .prototype-shell { grid-template-columns:390px minmax(240px,290px); } }
@media (max-width:800px) { .demo-console { display:none; } .prototype-shell { grid-template-columns:1fr; } }
```

### Task 3: Move deposit and wallet simulation controls

**Files:**
- Modify: `asset-center-app/index.html:793-842`
- Modify: `asset-center-app/index.html:1082-1195`
- Modify: `asset-center-app/prototype.test.mjs`

**Interfaces:**
- Consumes: `state.depositDraft`, `state.deposit`, `startDeposit(source)`, `advanceDeposit()`.
- Produces: deposit-specific console actions using the existing selectors.

- [ ] **Step 1: Remove these controls from phone markup**

```text
[data-start-demo-deposit]
#simulate-reconnect
#simulate-mismatch
#deposit-scenario
[data-advance-deposit]
```

- [ ] **Step 2: Emit equivalent controls from `demoConsoleActions()`**

```js
if(state.route==='deposit' && state.depositDraft.method==='address'){
  return `<button data-start-demo-deposit type="button">收到 500 ${state.depositDraft.token}</button>`;
}
if(state.route==='deposit' && state.depositDraft.method==='wallet'){
  return '<button id="simulate-reconnect">连接失效</button><button id="simulate-mismatch">账户不一致</button>';
}
if(state.route==='deposit-progress'){
  return `${depositScenarioControl()}<button data-advance-deposit type="button">推进下一阶段</button>`;
}
```

- [ ] **Step 3: Scope Playwright prototype locators to `#demo-console`**

```js
page.locator('#demo-console #deposit-scenario')
```

- [ ] **Step 4: Run deposit tests**

```bash
NODE_PATH=/Users/gary/.npm/_npx/e41f203b7505f1fb/node_modules node --test --test-name-pattern="deposit|wallet|credited" asset-center-app/prototype.test.mjs
```

Expected: PASS.

### Task 4: Move withdrawal and transfer simulation controls

**Files:**
- Modify: `asset-center-app/index.html:921-980`
- Modify: `asset-center-app/index.html:1082-1195`
- Modify: `asset-center-app/prototype.test.mjs`

**Interfaces:**
- Consumes: `state.withdrawal`, `state.transferResult`, `advanceWithdrawal()`, and transfer completion handlers.
- Produces: contextual withdrawal and transfer console actions.

- [ ] **Step 1: Remove these controls from phone markup**

```text
#withdrawal-scenario
[data-advance-withdrawal]
#simulate-transfer-failure
[data-complete-transfer]
```

- [ ] **Step 2: Add contextual console actions**

```js
if(state.route==='withdraw-progress'){
  return `${withdrawalScenarioControl()}<button data-advance-withdrawal type="button">推进下一阶段</button>`;
}
if(state.route==='transfer-review'){
  return '<button id="simulate-transfer-failure" type="button">下一次处理失败</button>';
}
if(state.route==='transfer-result' && state.transferResult==='processing'){
  return '<button data-complete-transfer type="button">完成处理</button>';
}
```

- [ ] **Step 3: Keep terminal route exits inside the phone**

```js
const phoneAction = wd.stage==='complete'
  ? '<button class="primary-button" data-return-assets type="button">返回资产中心</button>'
  : '';
```

- [ ] **Step 4: Run withdrawal and transfer tests**

```bash
NODE_PATH=/Users/gary/.npm/_npx/e41f203b7505f1fb/node_modules node --test --test-name-pattern="withdrawal|transfer|MFA|address" asset-center-app/prototype.test.mjs
```

Expected: PASS.

### Task 5: Finish documentation and verification

**Files:**
- Modify: `asset-center-app/index.html`
- Modify: `asset-center-app/DESIGN.md`
- Modify: `asset-center-app/prototype.test.mjs`

**Interfaces:**
- Consumes: completed console and phone renderers.
- Produces: verified standalone prototype and documented component boundary.

- [ ] **Step 1: Add the console component to `DESIGN.md`**

Document its desktop-only placement, contextual behavior, and rule that no real product action may depend exclusively on it.

- [ ] **Step 2: Run the full repository regression**

```bash
NODE_PATH=/Users/gary/.npm/_npx/e41f203b7505f1fb/node_modules node --test transfer-app/prototype.test.mjs asset-center-app/prototype.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 3: Run design and diff checks**

```bash
npx --yes @google/design.md lint asset-center-app/DESIGN.md
git diff --check
```

Expected: 0 errors, 0 warnings, and no whitespace errors.

- [ ] **Step 4: Capture and inspect screenshots**

Capture a desktop deposit-progress screen showing the external console and a 390×844 mobile screen showing only the product UI. Confirm no clipping, overlap, or horizontal overflow.

- [ ] **Step 5: Commit the completed change**

```bash
git add asset-center-app/index.html asset-center-app/prototype.test.mjs asset-center-app/DESIGN.md
git commit -m "refactor: move simulation controls outside asset app"
```

