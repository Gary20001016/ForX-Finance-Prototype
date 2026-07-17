# Fixed Asset Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the system-status row and account-navigation row fixed while only the asset-home content scrolls.

**Architecture:** Extend the existing asset-home grid from two rows to three rows: a 100px `.home-header`, a flexible `.home-scroll`, and the existing 72px bottom navigation. Move only the status and account navigation markup out of `.home-scroll`; account hero and all account content remain inside it.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node test runner, Playwright.

## Global Constraints

- `.home-header`, `.status-bar`, and `.account-nav` keep the same viewport coordinates at every `.home-scroll` position.
- `.home-scroll` remains the only vertically scrolling element on the asset home.
- The fixed top and bottom rows reserve layout space and never cover account content.
- Preserve 320px and 390px mobile support and the current account-switching behavior.

---

### Task 1: Move asset application chrome outside the content scroller

**Files:**
- Modify: `asset-center-app/prototype.test.mjs`
- Modify: `asset-center-app/index.html`
- Modify: `asset-center-app/DESIGN.md`

**Interfaces:**
- Consumes: `statusBar()`, `accountNav()`, `fundingHome()`, `contractHome()`, `bottomNav()`, and `.home-scroll`.
- Produces: `.home-header` and a three-row `.home-screen` grid.

- [ ] **Step 1: Write the failing fixed-header test**

```js
test('asset header stays fixed while home content scrolls', async () => {
  await withPage(async page => {
    const header = page.locator('#interactive-phone .home-header');
    assert.equal(await header.count(), 1);
    const status = page.locator('#interactive-phone .status-bar');
    const accounts = page.locator('#interactive-phone .account-nav');
    const scroller = page.locator('#interactive-phone .home-scroll');
    const beforeStatus = await status.boundingBox();
    const beforeAccounts = await accounts.boundingBox();
    assert.ok(beforeStatus && beforeAccounts);
    await scroller.evaluate(node => node.scrollTo(0, node.scrollHeight));
    const afterStatus = await status.boundingBox();
    const afterAccounts = await accounts.boundingBox();
    assert.ok(afterStatus && afterAccounts);
    assert.equal(Math.round(afterStatus.y), Math.round(beforeStatus.y));
    assert.equal(Math.round(afterAccounts.y), Math.round(beforeAccounts.y));
    assert.equal(await scroller.locator('.status-bar,.account-nav').count(), 0);
  }, { width:390, height:844 });
});
```

- [ ] **Step 2: Run the test and confirm RED**

```bash
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test --test-name-pattern='asset header stays fixed' asset-center-app/prototype.test.mjs
```

Expected: FAIL because `.home-header` does not exist and both top rows are children of `.home-scroll`.

- [ ] **Step 3: Implement the three-row shell**

Change the home layout CSS to:

```css
.app-screen.home-screen { display:grid; grid-template-rows:100px minmax(0,1fr) 72px; overflow:hidden; }
.home-header { min-height:0; position:relative; z-index:6; background:var(--bg); }
```

Change `assetsScreen()` to:

```js
function assetsScreen(){ return `<div class="app-screen home-screen"><div class="home-header">${statusBar()}${accountNav()}</div><div class="home-scroll">${state.account==='funding'?fundingHome():contractHome()}</div>${bottomNav()}</div>`; }
```

- [ ] **Step 4: Update the design rule**

Replace the old two-row shell rule in `asset-center-app/DESIGN.md` with:

```markdown
- The asset home uses a fixed three-row shell: `.home-header` contains the status and account controls, `.home-scroll` owns vertical content scrolling, and the bottom navigation is their non-scrolling sibling.
```

Add:

```markdown
- Don't place status, account navigation, or bottom navigation inside the element that owns vertical scrolling.
```

- [ ] **Step 5: Run focused and full verification**

```bash
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test --test-name-pattern='asset header stays fixed|bottom navigation stays fixed' asset-center-app/prototype.test.mjs
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test transfer-app/prototype.test.mjs asset-center-app/prototype.test.mjs
npx --yes @google/design.md lint asset-center-app/DESIGN.md
git diff --check
```

Expected: 2 focused tests pass, all 93 full-suite tests pass, design lint reports 0 errors and 0 warnings, and the diff check is clean.

- [ ] **Step 6: Capture visual evidence and commit**

Capture the 390×844 asset home at the top and with `.home-scroll` at its maximum scroll position. Confirm the status row remains at `y=0`, the account row remains at `y=42`, and the bottom navigation remains aligned to the device bottom.

```bash
git add asset-center-app/index.html asset-center-app/prototype.test.mjs asset-center-app/DESIGN.md
git commit -m "fix: keep asset header outside scrolling content"
```
