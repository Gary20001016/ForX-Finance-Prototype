import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const htmlPath = new URL('./index.html', import.meta.url);

test('standalone prototype uses the approved account model and format', async () => {
  const html = await readFile(htmlPath, 'utf8');

  for (const required of [
    '资金账户',
    '合约账户',
    'USDC',
    'INTERACTIVE PROTOTYPE',
    'SCREEN BREAKDOWN',
    'ERROR STATES'
  ]) {
    assert.match(html, new RegExp(required));
  }

  for (const forbidden of ['现货', '合约 V2', '主账户', '资产选择', '账户选择']) {
    assert.doesNotMatch(html, new RegExp(forbidden));
  }

  assert.doesNotMatch(html, /<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i);
});

async function withPage(run, viewport = { width: 1280, height: 1000 }) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage({ viewport });
  try {
    await page.goto(htmlPath.href);
    await run(page);
  } finally {
    await browser.close();
  }
}

test('shows the minimum amount error', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('5');
    assert.match(await page.locator('#amount-error').textContent(), /最低划转 10 USDC/);
    assert.equal(await page.locator('#review-transfer').isDisabled(), true);
  });
});

test('shows the insufficient balance error', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('25');
    assert.match(await page.locator('#amount-error').textContent(), /可用余额不足/);
    assert.equal(await page.locator('#review-transfer').isDisabled(), true);
  });
});

test('swaps the fixed source and destination accounts', async () => {
  await withPage(async (page) => {
    await page.locator('#swap-route').click();
    assert.equal(await page.locator('[data-source-name]').textContent(), '合约账户');
    assert.equal(await page.locator('[data-destination-name]').textContent(), '资金账户');
    assert.equal(await page.locator('[data-available-balance]').textContent(), '0.00 USDC');
  });
});

test('opens a transfer review for a valid amount', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('10');
    assert.equal(await page.locator('#review-transfer').isEnabled(), true);
    await page.locator('#review-transfer').click();
    await page.locator('[data-layer="review"]:visible').waitFor();
    assert.match(await page.locator('[data-review-route]').textContent(), /资金账户[\s\S]*合约账户/);
    assert.match(await page.locator('[data-review-amount]').textContent(), /10\.00 USDC/);
  });
});
