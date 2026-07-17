# Withdrawal Operation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `地址类型` and `网络拥堵` facts from withdrawal entry while preserving the processing estimate and all financial calculations.

**Architecture:** Modify the existing `withdrawalScreen()` template only. Keep `.withdraw-operations` as a full-width single-fact container for `预计处理`, so no new component or state is introduced.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node test runner, Playwright.

## Global Constraints

- The withdrawal-entry screen must not contain the labels `地址类型` or `网络拥堵`.
- Address-family validation remains in `.address-risk`.
- `预计处理`, gross debit, network fee, received amount, and remaining daily limit remain visible.
- Withdrawal validation and submission behavior remain unchanged.

---

### Task 1: Remove duplicate withdrawal operation facts

**Files:**
- Modify: `asset-center-app/prototype.test.mjs`
- Modify: `asset-center-app/index.html`

**Interfaces:**
- Consumes: `withdrawalScreen()`, `.withdraw-operations`, and the existing withdrawal detail regression test.
- Produces: a one-fact operation summary containing only `预计处理`.

- [ ] **Step 1: Change the existing test to the approved information contract**

In `withdrawal separates debit fee receipt limit and risk`, replace the label list and add summary assertions:

```js
for (const label of ['本次扣除', '网络费', '预计到账', '今日剩余额度', '预计处理']) {
  assert.match(await page.locator('#screen-root').textContent(), new RegExp(label));
}
const operations = page.locator('#interactive-phone .withdraw-operations');
assert.equal(await operations.locator(':scope > div').count(), 1);
assert.doesNotMatch(await operations.textContent(), /地址类型|网络拥堵/);
assert.match(await operations.textContent(), /预计处理/);
```

- [ ] **Step 2: Run the focused test and confirm RED**

```bash
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test --test-name-pattern='withdrawal separates debit' asset-center-app/prototype.test.mjs
```

Expected: FAIL because `.withdraw-operations` currently contains three facts and both removed labels.

- [ ] **Step 3: Remove the two template blocks**

Change the operation summary inside `withdrawalScreen()` to:

```html
<div class="withdraw-operations"><div><small>预计处理</small><b>${NETWORKS[d.network].eta}</b></div></div>
```

- [ ] **Step 4: Run focused verification and confirm GREEN**

Run the command from Step 2.

Expected: 1 test passes and 0 tests fail.

- [ ] **Step 5: Capture and inspect the withdrawal screen**

Capture the 390×844 withdrawal-entry screen. Confirm the single `预计处理` row spans the available width and that address validation and fee calculations remain visible without an empty grid cell.

- [ ] **Step 6: Run full verification and commit**

```bash
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test asset-center-app/prototype.test.mjs
NODE_PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules node --test transfer-app/prototype.test.mjs
git diff --check
git add asset-center-app/index.html asset-center-app/prototype.test.mjs
git commit -m "refactor: simplify withdrawal operation summary"
```

Expected: asset 64/64 and transfer 29/29 pass with no whitespace errors.
