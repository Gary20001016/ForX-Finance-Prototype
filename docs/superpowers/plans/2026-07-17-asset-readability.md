# Asset Readability Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the asset center's visual density, raise the mobile type floor, and display every address-class value in full.

**Architecture:** Keep the standalone single-file prototype and existing state machine. Introduce reusable full-address markup and readability CSS primitives, then update current renderers without removing operational data. Playwright tests verify computed typography, two-column density, complete address values, responsive wrapping, and existing workflows.

**Tech Stack:** Standalone HTML, CSS, vanilla JavaScript, Node.js test runner, Playwright, Google `design.md` lint.

## Global Constraints

- Required mobile text must not use 6–8px type.
- Full addresses wrap vertically; they never use ellipsis or horizontal scrolling.
- Keep confirmation, fee, minimum, risk, timeline, and audit data.
- Transaction hashes are outside the full-address requirement.
- Preserve 390×844 and 320px layouts without horizontal overflow.
- Do not add dependencies or remote assets.

---

### Task 1: Add readability and full-address regression tests

**Files:**
- Modify: `asset-center-app/prototype.test.mjs`

**Interfaces:**
- Consumes: existing `openDeposit()`, `openWithdrawal()`, `fillWithdrawal()`, and DOM selectors.
- Produces: requirements for `[data-full-address]` and the 2×2 operation grid.

- [ ] **Step 1: Add a failing type-floor test**

```js
test('required mobile copy respects the readability floor', async () => {
  await withPage(async page => {
    await openDeposit(page);
    for (const selector of [
      '.field-label',
      '.operation-grid small',
      '.operation-grid b',
      '.address-column>p',
      '.recent-deposit small'
    ]) {
      const size = await page.locator(`#interactive-phone ${selector}`).first()
        .evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize));
      assert.ok(size >= 9, `${selector}: ${size}px`);
    }
  }, { width:390, height:844 });
});
```

- [ ] **Step 2: Add a failing density test**

```js
test('network facts use a readable two-column layout', async () => {
  await withPage(async page => {
    await openDeposit(page);
    const columns = await page.locator('.operation-grid')
      .evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length);
    assert.equal(columns, 2);
  });
});
```

- [ ] **Step 3: Add a failing address-integrity helper and tests**

```js
async function expectFullAddresses(page) {
  const nodes = await page.locator('#interactive-phone [data-full-address]').all();
  assert.ok(nodes.length > 0);
  for (const node of nodes) {
    const text = (await node.textContent()).trim();
    assert.equal(text, await node.getAttribute('data-address'));
    assert.doesNotMatch(text, /\.\.\.|…/);
    assert.equal(await node.evaluate(el => getComputedStyle(el).overflowWrap), 'anywhere');
  }
}

test('deposit contract and destination addresses are complete', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await expectFullAddresses(page);
  });
});
```

- [ ] **Step 4: Run the focused tests and verify RED**

```bash
NODE_PATH=/Users/gary/.npm/_npx/e41f203b7505f1fb/node_modules node --test --test-name-pattern="readability floor|two-column|addresses are complete" asset-center-app/prototype.test.mjs
```

Expected: FAIL because font sizes are below 9px, the operation grid has four columns, and full-address markers do not exist.

### Task 2: Replace abbreviated address data and markup

**Files:**
- Modify: `asset-center-app/index.html:636-641`
- Modify: `asset-center-app/index.html:815-963`
- Modify: `asset-center-app/index.html:1062`
- Modify: `asset-center-app/index.html:1359`
- Test: `asset-center-app/prototype.test.mjs`

**Interfaces:**
- Consumes: `NETWORKS[network].address`, token contracts, withdrawal drafts, address-book entries, and record addresses.
- Produces: `fullAddress(value): string` and `[data-full-address][data-address]` markup.

- [ ] **Step 1: Add the reusable full-address renderer**

```js
function fullAddress(value){
  const safe=escapeHtml(value);
  return `<code class="full-address" data-full-address data-address="${safe}">${safe}</code>`;
}
```

- [ ] **Step 2: Replace sample addresses with complete values**

Use valid complete examples:

```js
const SAMPLE_EVM_ADDRESS='0x1234567890abcdef1234567890abcdef12345678';
const SAMPLE_SOL_ADDRESS='9xQeWvG816bUx9EPfD1N4QFvKc8iPzRzA';
const SAMPLE_SENDER_EVM='0x4C86A7f187eA458dC2cF9A19eE723D6912D912D9';
const SAMPLE_SENDER_SOL='5HdS8n9WmTjP4kq7C2vL6yR1aF3uX8bN5eQwP';
```

All sample record and deposit-state address fields use those complete constants rather than strings containing `...`.

- [ ] **Step 3: Apply full-address markup to every address surface**

Use `fullAddress()` for:

```text
token contract
deposit destination
wallet sender
deposit detail sender and destination
withdrawal review destination
address-book entry
signature confirmation
withdrawal status destination
record detail destination
```

Do not apply it to transaction hashes.

- [ ] **Step 4: Run address-focused tests**

Run the Task 1 focused command. Expected: address-integrity tests PASS while typography may remain RED until Task 3.

### Task 3: Raise typography and reduce simultaneous density

**Files:**
- Modify: `asset-center-app/index.html:64-549`
- Modify: `asset-center-app/DESIGN.md`
- Test: `asset-center-app/prototype.test.mjs`

**Interfaces:**
- Consumes: existing component class names.
- Produces: a 9px minimum required-text floor, 2×2 operation facts, vertical full-address blocks, and roomier rows.

- [ ] **Step 1: Change dense grids and address layout**

```css
.operation-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px 18px; }
.address-deposit-card { grid-template-columns:1fr; }
.full-address { display:block; width:100%; overflow-wrap:anywhere; word-break:break-word; white-space:normal; }
.detail-line.has-address { display:block; }
.detail-line.has-address>span:first-child { display:block; margin-bottom:8px; }
```

- [ ] **Step 2: Raise required type sizes**

Set required labels and values to these floors:

```css
.operation-grid small,.network-summary small,.address-meta,.timeline-step small,.record-timeline-step small { font-size:9px; }
.operation-grid b,.detail-line,.recent-deposit small,.wallet-note,.notice-box { font-size:10px; }
.asset-copy b,.record-main b,.status-heading p,.withdraw-status-card p { font-size:11px; }
.field-label,.method-tab,.calculation-row,.primary-button { font-size:12px; }
```

Keep chart axes at 8px only when no user action or transaction decision depends on them.

- [ ] **Step 3: Increase row rhythm and scrolling space**

```css
.operation-grid { padding:15px 0; }
.detail-line { padding:12px 0; line-height:1.55; }
.recent-deposit,.fund-record,.activity-row { min-height:64px; }
.progress-page,.form-page { padding-bottom:34px; }
```

- [ ] **Step 4: Document the readability rules**

Update `asset-center-app/DESIGN.md` with the 9px floor, full-address rule, 2×2 fact grids, and vertical address rows.

- [ ] **Step 5: Run focused tests**

Run the Task 1 command. Expected: PASS.

### Task 4: Verify workflows and screenshots

**Files:**
- Modify: `asset-center-app/prototype.test.mjs` only if an existing assertion encoded the old visual presentation.

**Interfaces:**
- Consumes: completed readability and address changes.
- Produces: final evidence for all three requested outcomes.

- [ ] **Step 1: Run the asset suite**

```bash
NODE_PATH=/Users/gary/.npm/_npx/e41f203b7505f1fb/node_modules node --test asset-center-app/prototype.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 2: Run the repository regression**

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

- [ ] **Step 4: Capture visual evidence**

Capture 390×844 screenshots for the asset home, address deposit, deposit detail, withdrawal review, address book, and record detail. Confirm the hierarchy is quieter, required text is readable, and every address wraps fully without horizontal overflow.

- [ ] **Step 5: Commit**

```bash
git add asset-center-app/index.html asset-center-app/prototype.test.mjs asset-center-app/DESIGN.md
git commit -m "refactor: improve asset readability and full addresses"
```

