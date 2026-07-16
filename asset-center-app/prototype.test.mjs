import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const htmlPath = new URL('./index.html', import.meta.url);
let browser;

test.before(async () => {
  const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({
    headless: true,
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {})
  });
});

test.after(async () => browser?.close());

async function withPage(run, viewport = { width: 1280, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  try {
    await page.goto(htmlPath.href);
    await run(page);
  } finally {
    await context.close();
  }
}

async function route(page, expected) {
  await page.waitForFunction(value => document.querySelector('#screen-root')?.dataset.route === value, expected);
}

test('standalone shell exposes approved scope and no remote dependencies', async () => {
  const html = await readFile(htmlPath, 'utf8');
  for (const text of [
    '资金账户', '合约账户', 'USDT', 'USDC', 'Ethereum', 'Arbitrum',
    'Polygon', 'Base', 'Optimism', 'Solana', 'TRON', '页面拆解', '异常状态'
  ]) {
    assert.match(html, new RegExp(text));
  }
  assert.doesNotMatch(html, /<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i);
  assert.doesNotMatch(html, /资产网络|服务正常|CAPITAL NETWORK|Available|On hold/);
});

test('switches between funding and contract account metrics', async () => {
  await withPage(async page => {
    assert.equal(await page.locator('[data-account-tab="funding"]').getAttribute('aria-selected'), 'true');
    assert.match(await page.locator('#screen-root').textContent(), /总资产估值/);
    assert.match(await page.locator('#screen-root').textContent(), /18,240\.00/);
    await page.locator('[data-account-tab="contract"]').click();
    assert.equal(await page.locator('[data-account-tab="contract"]').getAttribute('aria-selected'), 'true');
    assert.match(await page.locator('#screen-root').textContent(), /账户权益/);
    assert.match(await page.locator('#screen-root').textContent(), /可用保证金/);
    assert.match(await page.locator('#screen-root').textContent(), /保证金率/);
  });
});

test('uses the approved minimal top navigation and working home actions', async () => {
  await withPage(async page => {
    assert.equal(await page.locator('[data-page-title]').count(), 0);
    assert.equal(await page.getByText('服务正常', { exact: true }).count(), 0);
    assert.equal(await page.getByText('资产网络', { exact: true }).count(), 0);
    await page.locator('#open-deposit').click();
    await route(page, 'deposit');
    await page.locator('[data-back]').click();
    await route(page, 'assets');
    await page.locator('#open-value-history').click();
    await route(page, 'value-history');
  });
});

test('keeps the approved home usable at 320 and 390 pixel widths', async () => {
  for (const viewport of [{ width: 320, height: 760 }, { width: 390, height: 844 }]) {
    await withPage(async page => {
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert.ok(dimensions.width <= dimensions.viewport);
      assert.equal(await page.locator('#open-deposit').isVisible(), true);
      assert.equal(await page.locator('[data-bottom-nav="assets"]').getAttribute('aria-current'), 'page');
    }, viewport);
  }
});
