# Asset Row and Bottom Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify collapsed funding asset rows and keep the asset-home bottom navigation fixed while its content scrolls independently.

**Architecture:** Keep the prototype's existing single-file renderer. Give the asset home a two-row grid shell containing a dedicated `.home-scroll` viewport and a static bottom-navigation sibling; move secondary asset facts from the collapsed row into the existing disclosure panel.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node test runner, Playwright.

## Global Constraints

- Collapsed rows show only token mark, token symbol, token balance, fiat estimate, and disclosure chevron.
- English name, reference price, 24-hour change, and exact allocation share appear only after expansion.
- Bottom navigation remains bottom-aligned at every scroll position and never overlays the last activity row.
- Preserve 320px and 390px mobile support, keyboard semantics, `aria-expanded`, and current state behavior.

---

### Task 1: Specify the collapsed and expanded asset information hierarchy

**Files:**
- Modify: `asset-center-app/prototype.test.mjs`
- Modify: `asset-center-app/index.html`

**Interfaces:**
- Consumes: `assetRow(token)`, `assetDetail(token)`, `TOKEN_META`, `assetShare(token)`.
- Produces: collapsed `[data-asset-row]` text hierarchy and expanded `[data-asset-detail]` secondary facts.

- [ ] **Step 1: Write the failing asset-row test**

```js
test('collapsed asset rows keep only balance essentials and disclose secondary facts', async () => {
  await withPage(async page => {
    const row = page.locator('#interactive-phone [data-asset-row="USDT"]');
    const collapsed = await row.textContent();
    assert.match(collapsed, /USDT/);
    assert.match(collapsed, /18,240\.00/);
    assert.match(collapsed, /≈ \$18,238\.18/);
    assert.doesNotMatch(collapsed, /Tether USD|\$0\.9999|\+0\.02%|73\.9%/);
    await row.click();
    assert.match(await page.locator('#interactive-phone [data-asset-detail]').textContent(), /Tether USD.*参考价格.*24h 涨跌.*资产占比.*可用余额.*最近变动.*支持网络/s);
  });
});
```

- [ ] **Step 2: Run the new test and confirm RED**

Run:

```bash
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test --test-name-pattern='collapsed asset rows' asset-center-app/prototype.test.mjs
```

Expected: FAIL because the collapsed row still contains English name, price, change, and share.

- [ ] **Step 3: Implement the minimal asset-row hierarchy**

Change `assetRow(token)` so its collapsed markup is:

```js
return `<div class="asset-item"><button class="asset-row" type="button" data-asset="${token}" data-asset-row="${token}" aria-expanded="${expanded}">${tokenMark(token)}<span class="asset-copy"><b>${token}</b></span><span class="asset-amount"><b data-funding-balance="${token}" data-value="${value}">${format(value)}</b><small>≈ $${format(value*meta.price)}</small></span><span class="row-chevron ${expanded?'is-open':''}">${icon('chevron')}</span></button>${expanded?assetDetail(token):''}</div>`;
```

Change `assetDetail(token)` to:

```js
function assetDetail(token){
  const value=state.funding[token], meta=TOKEN_META[token], recent=allRecords().find(item=>item.token===token);
  return `<div class="asset-detail" data-asset-detail><div class="asset-detail-head"><b>${token} 资产明细</b><span>${meta.name}</span></div><div class="asset-detail-grid"><div><small>参考价格</small><b>$${format(meta.price,4)}</b></div><div><small>24h 涨跌</small><b class="positive">+${format(meta.change24h)}%</b></div><div><small>资产占比</small><b>${assetShare(token).replace(token+' 占 ','')}</b></div><div><small>可用余额</small><b>${format(value)} ${token}</b></div><div class="asset-detail-wide"><small>最近变动</small><b>${recent?recent.time.slice(5,16):'暂无'}</b></div></div><div class="network-pills-label">支持网络</div><div class="network-pills">${CONFIG.networks.map(network=>`<span>${network}</span>`).join('')}</div></div>`;
}
```

Remove the obsolete `.asset-share` rules and add:

```css
.asset-copy { min-width:0; }
.asset-detail-grid .asset-detail-wide { grid-column:1 / -1; }
.network-pills-label { margin-top:12px; color:#68716b; font-size:11px; }
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run the command from Step 2.

Expected: 1 test passes, 0 tests fail.

- [ ] **Step 5: Commit the asset-row change**

```bash
git add asset-center-app/index.html asset-center-app/prototype.test.mjs
git commit -m "refactor: simplify funding asset rows"
```

### Task 2: Separate the scroll viewport from the bottom navigation

**Files:**
- Modify: `asset-center-app/prototype.test.mjs`
- Modify: `asset-center-app/index.html`

**Interfaces:**
- Consumes: `assetsScreen()`, `bottomNav()`, `.app-screen`, `.bottom-nav`.
- Produces: `.home-screen` fixed shell and `.home-scroll` content viewport.

- [ ] **Step 1: Write the failing navigation-stability test**

```js
test('asset bottom navigation stays fixed while home content scrolls', async () => {
  await withPage(async page => {
    const scroller = page.locator('#interactive-phone .home-scroll');
    assert.equal(await scroller.count(), 1);
    const nav = page.locator('#interactive-phone .bottom-nav');
    const phone = page.locator('#interactive-phone');
    const before = await nav.boundingBox();
    const phoneBox = await phone.boundingBox();
    assert.ok(before && phoneBox);
    await scroller.evaluate(node => node.scrollTo(0, node.scrollHeight));
    const after = await nav.boundingBox();
    assert.ok(after);
    assert.equal(Math.round(after.y), Math.round(before.y));
    assert.ok(Math.abs((after.y + after.height) - (phoneBox.y + phoneBox.height)) <= 2);
  }, { width:390, height:844 });
});
```

- [ ] **Step 2: Run the new test and confirm RED**

Run:

```bash
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test --test-name-pattern='bottom navigation stays fixed' asset-center-app/prototype.test.mjs
```

Expected: FAIL because `.home-scroll` does not exist and `.bottom-nav` currently scrolls with `.app-screen`.

- [ ] **Step 3: Implement the fixed two-row shell**

Change `assetsScreen()` to:

```js
function assetsScreen(){ return `<div class="app-screen home-screen"><div class="home-scroll">${statusBar()}${accountNav()}${state.account==='funding'?fundingHome():contractHome()}</div>${bottomNav()}</div>`; }
```

Add:

```css
.app-screen.home-screen { display:grid; grid-template-rows:minmax(0,1fr) 72px; overflow:hidden; }
.home-scroll { min-height:0; overflow-y:auto; scrollbar-width:none; }
.home-scroll::-webkit-scrollbar { display:none; }
.home-screen .bottom-nav { position:static; width:100%; }
.home-screen .home-body { padding-bottom:24px; }
```

- [ ] **Step 4: Run the focused navigation test and confirm GREEN**

Run the command from Step 2.

Expected: 1 test passes, 0 tests fail.

- [ ] **Step 5: Commit the navigation fix**

```bash
git add asset-center-app/index.html asset-center-app/prototype.test.mjs
git commit -m "fix: keep asset navigation outside scrolling content"
```

### Task 3: Document and verify the integrated result

**Files:**
- Modify: `asset-center-app/DESIGN.md`
- Verify: `asset-center-app/index.html`
- Verify: `asset-center-app/prototype.test.mjs`

**Interfaces:**
- Consumes: completed asset hierarchy and `.home-screen` layout.
- Produces: durable design rules and verified release state.

- [ ] **Step 1: Update design rules**

Add these component rules to `asset-center-app/DESIGN.md`:

```markdown
- Collapsed funding asset rows show only token identity, token balance, approximate fiat value, and disclosure; price, 24-hour change, allocation share, and the English token name belong in the expanded detail.
- The asset home uses a fixed two-row shell: `.home-scroll` owns vertical scrolling and the bottom navigation is its non-scrolling sibling.
```

Add these constraints to the Do's and Don'ts section:

```markdown
- Do keep the last asset-home activity row fully scrollable above the fixed bottom navigation.
- Don't place bottom navigation inside the element that owns vertical scrolling.
```

- [ ] **Step 2: Run the full regression suite**

```bash
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test transfer-app/prototype.test.mjs asset-center-app/prototype.test.mjs
```

Expected: all 92 tests pass with 0 failures.

- [ ] **Step 3: Run design and diff checks**

```bash
npx --yes @google/design.md lint asset-center-app/DESIGN.md
git diff --check
```

Expected: 0 design errors, 0 design warnings, and no whitespace errors.

- [ ] **Step 4: Capture and inspect mobile screenshots**

Capture the asset home at 390×844 before and after scrolling `.home-scroll` to the bottom. Confirm the row hierarchy is calm, the navigation remains bottom-aligned, and the last activity row is fully visible above it.

- [ ] **Step 5: Commit documentation and final adjustments**

```bash
git add asset-center-app/DESIGN.md asset-center-app/index.html asset-center-app/prototype.test.mjs
git commit -m "docs: record asset home hierarchy"
```
