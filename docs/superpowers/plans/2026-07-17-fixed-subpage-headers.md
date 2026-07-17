# Fixed Subpage Headers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every secondary screen's system-status and page-title rows fixed while its body scrolls independently.

**Architecture:** Add one shared `fixedSubpageShell(markup)` renderer that restructures all `.subpage` markup into a non-scrolling `.subpage-fixed-header` and a `.subpage-scroll` body. Make `screenHtml()` pass every route through that renderer so interactive screens and frozen gallery previews share the same structure.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node test runner, Playwright.

## Global Constraints

- Fix only the page-level status and title rows; internal content headings remain scrollable.
- `.subpage-scroll` is the only vertical scroller on secondary screens.
- Header space is reserved by layout and never overlays body content.
- Preserve all existing routes, interactions, full-address behavior, and 320px/390px support.
- Preserve the asset home's existing fixed top header and bottom navigation.

---

### Task 1: Introduce the shared fixed secondary-screen shell

**Files:**
- Modify: `asset-center-app/prototype.test.mjs`
- Modify: `asset-center-app/index.html`
- Modify: `asset-center-app/DESIGN.md`

**Interfaces:**
- Consumes: `screenHtml(route)`, every `.app-screen.subpage`, `.status-bar`, and `.subpage-header`.
- Produces: `fixedSubpageShell(markup)`, `.subpage-fixed-header`, and `.subpage-scroll`.

- [ ] **Step 1: Write the failing route-matrix test**

```js
test('secondary page headers stay fixed while their content scrolls', async () => {
  const secondaryRoutes = [
    'deposit', 'deposit-progress', 'withdraw', 'withdraw-review',
    'mfa-setup', 'mfa-verify', 'address-book', 'add-address',
    'withdraw-status', 'transfer', 'transfer-review', 'transfer-status',
    'records', 'record-detail', 'value-history', 'asset-operation'
  ];

  await withPage(async page => {
    for (const routeName of secondaryRoutes) {
      if (routeName === 'deposit-progress') {
        await page.evaluate(() => window.assetPrototype.reset());
        await page.locator('#open-deposit').click();
        await page.locator('#demo-console [data-start-demo-deposit]').evaluate(node => node.click());
      } else if (routeName === 'withdraw-status') {
        await page.evaluate(() => window.assetPrototype.reset());
        await openWithdrawal(page);
        await fillWithdrawal(page, undefined, '100');
        await page.locator('#submit-withdrawal').click();
      } else {
        await page.evaluate(value => window.assetPrototype.navigate(value), routeName);
      }
      await route(page, routeName);

      const screen = page.locator('#interactive-phone .app-screen.subpage');
      const fixedHeader = screen.locator(':scope > .subpage-fixed-header');
      const scroller = screen.locator(':scope > .subpage-scroll');
      assert.equal(await fixedHeader.count(), 1, `${routeName} has one fixed header`);
      assert.equal(await scroller.count(), 1, `${routeName} has one content scroller`);
      assert.equal(await scroller.locator('.status-bar,.subpage-header').count(), 0, `${routeName} keeps its page header outside the scroller`);

      const status = fixedHeader.locator('.status-bar');
      const title = fixedHeader.locator('.subpage-header');
      const beforeStatus = await status.boundingBox();
      const beforeTitle = await title.boundingBox();
      assert.ok(beforeStatus && beforeTitle, `${routeName} header is visible`);
      await scroller.evaluate(node => node.scrollTo(0, node.scrollHeight));
      const afterStatus = await status.boundingBox();
      const afterTitle = await title.boundingBox();
      assert.ok(afterStatus && afterTitle, `${routeName} header remains visible`);
      assert.equal(Math.round(afterStatus.y), Math.round(beforeStatus.y), `${routeName} status row does not move`);
      assert.equal(Math.round(afterTitle.y), Math.round(beforeTitle.y), `${routeName} title row does not move`);
      assert.equal(await screen.evaluate(node => node.scrollTop), 0, `${routeName} shell itself does not scroll`);
    }
  }, { width:390, height:844 });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

```bash
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test --test-name-pattern='secondary page headers stay fixed' asset-center-app/prototype.test.mjs
```

Expected: FAIL because secondary routes do not contain `.subpage-fixed-header` or `.subpage-scroll`.

- [ ] **Step 3: Add the shared renderer and two-row CSS shell**

Add the shared transformer:

```js
function fixedSubpageShell(markup){
  const template=document.createElement('template');
  template.innerHTML=markup.trim();
  const screen=template.content.firstElementChild;
  if(!screen?.classList.contains('subpage')) return markup;
  const status=screen.querySelector(':scope > .status-bar');
  const header=screen.querySelector(':scope > .subpage-header');
  if(!status||!header) return markup;
  const bodyNodes=[...screen.childNodes].filter(node=>node!==status&&node!==header);
  const fixedHeader=document.createElement('div');
  fixedHeader.className='subpage-fixed-header';
  fixedHeader.append(status,header);
  const scroller=document.createElement('div');
  scroller.className='subpage-scroll';
  scroller.append(...bodyNodes);
  screen.replaceChildren(fixedHeader,scroller);
  return screen.outerHTML;
}
```

Change `screenHtml()` from early returns to a single `markup` variable and finish with:

```js
return fixedSubpageShell(markup);
```

Update the secondary-screen CSS to:

```css
.subpage { min-height:0; padding-bottom:0; display:grid; grid-template-rows:auto minmax(0,1fr); overflow:hidden; }
.subpage-fixed-header { min-height:0; position:relative; z-index:6; background:var(--bg); }
.subpage-scroll { min-height:0; padding-bottom:30px; overflow-y:auto; overscroll-behavior-y:contain; scrollbar-width:none; }
.subpage-scroll::-webkit-scrollbar { display:none; }
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

```bash
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test --test-name-pattern='secondary page headers stay fixed' asset-center-app/prototype.test.mjs
```

Expected: the route-matrix test passes.

- [ ] **Step 5: Record the shared layout rule**

Add these rules to `asset-center-app/DESIGN.md`:

```markdown
- Every secondary product screen uses a fixed two-row shell: `.subpage-fixed-header` contains the status and page-title controls, while `.subpage-scroll` is the only element that owns vertical content scrolling.
- Don't move tabs, form labels, section headings, or other content-level controls into the fixed secondary-screen header.
```

- [ ] **Step 6: Run full verification**

```bash
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test transfer-app/prototype.test.mjs asset-center-app/prototype.test.mjs
npx --yes @google/design.md lint asset-center-app/DESIGN.md
git diff --check
```

Expected: every test passes, design lint reports no errors or warnings, and the diff check is clean.
