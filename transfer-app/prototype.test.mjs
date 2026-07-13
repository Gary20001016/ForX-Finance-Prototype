import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
let browser;

test.before(async () => {
  const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const launchOptions = existsSync(chromePath) ? { executablePath: chromePath } : {};
  browser = await chromium.launch({ headless: true, ...launchOptions });
});

test.after(async () => {
  await browser?.close();
});

const htmlPath = new URL('./index.html', import.meta.url);

test('standalone prototype uses the approved account model and format', async () => {
  const html = await readFile(htmlPath, 'utf8');

  for (const required of [
    '资金账户',
    '合约账户',
    'USDC',
    'USDT',
    '交互原型',
    '页面拆解',
    '异常状态'
  ]) {
    assert.match(html, new RegExp(required));
  }

  for (const forbidden of [
    '现货',
    '合约 V2',
    '主账户',
    '资产选择',
    '账户选择',
    'Capital route',
    'INTERACTIVE PROTOTYPE',
    'SCREEN BREAKDOWN',
    'ERROR STATES',
    '划转记录',
    'history-icon'
  ]) {
    assert.doesNotMatch(html, new RegExp(forbidden));
  }

  assert.doesNotMatch(html, /<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i);
});

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

test('explains invalid numeric input instead of silently clearing it', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('abc');
    assert.equal(await page.locator('#amount-input').inputValue(), 'abc');
    assert.match(await page.locator('#amount-error').textContent(), /请输入有效的划转金额/);
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

test('calculates percentage shortcuts and Max from the source balance', async () => {
  await withPage(async (page) => {
    await page.locator('[data-percentage="0.25"]').click();
    assert.equal(await page.locator('#amount-input').inputValue(), '5');
    assert.match(await page.locator('#amount-error').textContent(), /最低划转 10 USDC/);
    await page.locator('[data-percentage="1"]').click();
    assert.equal(await page.locator('#amount-input').inputValue(), '20');
    assert.equal(await page.locator('[data-estimated-balance]').textContent(), '20.00 USDC');
    assert.equal(await page.locator('#review-transfer').isEnabled(), true);
  });
});

test('switches between USDC and USDT with independent balances', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('10');
    await page.locator('#token-trigger').click();
    assert.equal(await page.locator('#token-trigger').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('#token-menu [data-token]').count(), 2);
    await page.locator('#token-menu [data-token="USDT"]').click();
    assert.equal(await page.locator('#token-trigger').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('#amount-input').inputValue(), '');
    assert.equal(await page.locator('[data-current-token]').first().textContent(), 'USDT');
    assert.equal(await page.locator('[data-account-balance="fund"]').first().textContent(), '50.00 USDT');
    assert.equal(await page.locator('[data-account-balance="contract"]').first().textContent(), '0.00 USDT');
    assert.match(await page.locator('#amount-hint').textContent(), /最低划转 10 USDT/);
  });
});

test('reselecting the current token preserves the entered amount', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('10');
    await page.locator('#token-trigger').click();
    await page.locator('#token-menu [data-token="USDC"]').click();
    assert.equal(await page.locator('#amount-input').inputValue(), '10');
    assert.equal(await page.locator('#review-transfer').isEnabled(), true);
  });
});

test('synchronizes static galleries with the selected token', async () => {
  await withPage(async (page) => {
    await page.locator('#token-trigger').click();
    await page.locator('#token-menu [data-token="USDT"]').click();
    const galleryCopy = await page.locator('#gallery-grid .gallery-phone').allTextContents();
    const errorCopy = await page.locator('#error-gallery-grid .gallery-phone').allTextContents();
    assert.equal(galleryCopy.every((copy) => copy.includes('USDT') && !copy.includes('USDC')), true);
    assert.equal(errorCopy.every((copy) => copy.includes('USDT') && !copy.includes('USDC')), true);
  });
});

test('closes the token menu with Escape and restores focus', async () => {
  await withPage(async (page) => {
    await page.locator('#token-trigger').click();
    assert.equal(await page.locator('#token-menu').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#token-menu').isHidden(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'token-trigger');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('#token-menu').isVisible(), true);
    await page.waitForFunction(() => document.activeElement?.dataset.token === 'USDC');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#token-menu').isVisible(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.token), 'USDT');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#token-menu').isHidden(), true);
    await page.locator('#token-trigger').focus();
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.locator('#token-menu').isVisible(), true);
    await page.waitForFunction(() => document.activeElement?.dataset.token === 'USDC');
  });
});

test('completes a USDT transfer without mutating USDC balances', async () => {
  await withPage(async (page) => {
    await page.locator('#token-trigger').click();
    await page.locator('#token-menu [data-token="USDT"]').click();
    await page.locator('#amount-input').fill('10');
    await page.locator('#review-transfer').click();
    assert.equal(await page.locator('[data-review-amount]').textContent(), '10.00 USDT');
    assert.equal(await page.locator('[data-review-source-after]').textContent(), '40.00 USDT');
    assert.equal(await page.locator('[data-fee-amount]').last().textContent(), '0 USDT');
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-screen="processing"]:visible').waitFor();
    assert.equal(await page.locator('[data-processing-symbol]').first().textContent(), '₮');
    await page.locator('[data-screen="success"]:visible').waitFor();
    assert.equal(await page.locator('[data-receipt-amount]').textContent(), '10.00 USDT');
    assert.equal(await page.locator('[data-success-fund-balance]').textContent(), '40.00 USDT');
    assert.equal(await page.locator('[data-success-contract-balance]').textContent(), '10.00 USDT');
    await page.locator('#transfer-again').click();
    await page.locator('#token-trigger').click();
    await page.locator('#token-menu [data-token="USDC"]').click();
    assert.equal(await page.locator('[data-account-balance="fund"]').first().textContent(), '20.00 USDC');
    assert.equal(await page.locator('[data-account-balance="contract"]').first().textContent(), '0.00 USDC');
  });
});

test('reset restores the default token and both token balances', async () => {
  await withPage(async (page) => {
    await page.locator('#token-trigger').click();
    await page.locator('#token-menu [data-token="USDT"]').click();
    await page.locator('#amount-input').fill('10');
    await page.locator('#review-transfer').click();
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-screen="success"]:visible').waitFor();
    await page.locator('#prototype-reset').click();
    assert.equal(await page.locator('[data-current-token]').first().textContent(), 'USDC');
    assert.equal(await page.locator('[data-account-balance="fund"]').first().textContent(), '20.00 USDC');
    await page.locator('#token-trigger').click();
    await page.locator('#token-menu [data-token="USDT"]').click();
    assert.equal(await page.locator('[data-account-balance="fund"]').first().textContent(), '50.00 USDT');
    assert.equal(await page.locator('[data-account-balance="contract"]').first().textContent(), '0.00 USDT');
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

test('traps focus inside review and restores it on Escape', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('10');
    await page.locator('#review-transfer').click();
    await page.locator('#review-title').waitFor();
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'review-title');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'edit-transfer');
    await page.locator('#edit-transfer').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'close-review');
    await page.locator('#close-review').focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'edit-transfer');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-layer="review"]').isHidden(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'review-transfer');
  });
});

test('moves balances exactly once after a successful transfer', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('10');
    await page.locator('#review-transfer').click();
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-screen="success"]:visible').waitFor({ timeout: 3500 });
    assert.match(await page.locator('[data-receipt-amount]').textContent(), /10\.00 USDC/);
    await page.locator('#done-transfer').click();
    assert.equal(await page.locator('[data-account-balance="fund"]').first().textContent(), '10.00 USDC');
    assert.equal(await page.locator('[data-account-balance="contract"]').first().textContent(), '10.00 USDC');
    await page.waitForTimeout(1100);
    assert.equal(await page.locator('[data-account-balance="fund"]').first().textContent(), '10.00 USDC');
  });
});

test('uses one consistent precision from review through receipt and balances', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('10.123456');
    await page.locator('#review-transfer').click();
    assert.equal(await page.locator('[data-review-amount]').textContent(), '10.123456 USDC');
    assert.equal(await page.locator('[data-review-source-after]').textContent(), '9.876544 USDC');
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-screen="success"]:visible').waitFor();
    assert.equal(await page.locator('[data-receipt-amount]').textContent(), '10.123456 USDC');
    assert.equal(await page.locator('[data-success-fund-balance]').textContent(), '9.876544 USDC');
    assert.equal(await page.locator('[data-success-contract-balance]').textContent(), '10.123456 USDC');
  });
});

test('preserves balances on failure and succeeds on retry', async () => {
  await withPage(async (page) => {
    await page.evaluate(() => window.transferPrototype.armFailure());
    await page.locator('#amount-input').fill('10');
    await page.locator('#review-transfer').click();
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-layer="failure"]:visible').waitFor({ timeout: 3500 });
    assert.equal(await page.locator('[data-account-balance="fund"]').first().textContent(), '20.00 USDC');
    assert.equal(await page.locator('[data-account-balance="contract"]').first().textContent(), '0.00 USDC');
    await page.locator('#retry-transfer').click();
    await page.locator('[data-screen="success"]:visible').waitFor({ timeout: 3500 });
    assert.equal(await page.locator('[data-success-fund-balance]').textContent(), '10.00 USDC');
    assert.equal(await page.locator('[data-success-contract-balance]').textContent(), '10.00 USDC');
  });
});

test('traps focus inside failure and returns to editing on Escape', async () => {
  await withPage(async (page) => {
    await page.evaluate(() => window.transferPrototype.armFailure());
    await page.locator('#amount-input').fill('10');
    await page.locator('#review-transfer').click();
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-layer="failure"]:visible').waitFor();
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'failure-title');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'failure-edit');
    await page.locator('#failure-edit').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'retry-transfer');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-screen="composer"]').isVisible(), true);
    assert.equal(await page.locator('#amount-input').inputValue(), '10');
    await page.waitForFunction(() => document.activeElement?.id === 'amount-input');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'amount-input');
  });
});

test('reset restores the starting route and balances', async () => {
  await withPage(async (page) => {
    await page.locator('#swap-route').click();
    await page.locator('#prototype-reset').click();
    assert.equal(await page.locator('[data-source-name]').textContent(), '资金账户');
    assert.equal(await page.locator('[data-account-balance="fund"]').first().textContent(), '20.00 USDC');
    assert.equal(await page.locator('[data-account-balance="contract"]').first().textContent(), '0.00 USDC');
  });
});

test('reset during processing cancels the pending transfer', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('10');
    await page.locator('#review-transfer').click();
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-screen="processing"]:visible').waitFor();
    await page.locator('#prototype-reset').click();
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('[data-screen="composer"]').isVisible(), true);
    assert.equal(await page.locator('[data-account-balance="fund"]').first().textContent(), '20.00 USDC');
    assert.equal(await page.locator('[data-account-balance="contract"]').first().textContent(), '0.00 USDC');
  });
});

test('preserves input while temporary unavailability disables submission', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('10');
    await page.evaluate(() => window.transferPrototype.setUnavailable(true));
    assert.equal(await page.locator('#amount-input').inputValue(), '10');
    assert.equal(await page.locator('#review-transfer').isDisabled(), true);
    assert.match(await page.locator('#availability-warning').textContent(), /划转服务暂时不可用/);
    await page.evaluate(() => window.transferPrototype.setUnavailable(false));
    assert.equal(await page.locator('#availability-warning').isHidden(), true);
    assert.equal(await page.locator('#review-transfer').isEnabled(), true);
  });
});

test('stops a reviewed transfer when the service becomes unavailable', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('10');
    await page.locator('#review-transfer').click();
    await page.locator('[data-layer="review"]:visible').waitFor();
    await page.evaluate(() => window.transferPrototype.setUnavailable(true));
    assert.equal(await page.locator('[data-layer="review"]').isHidden(), true);
    assert.equal(await page.locator('[data-screen="composer"]').isVisible(), true);
    assert.equal(await page.locator('#review-transfer').isDisabled(), true);
    assert.equal(await page.locator('#amount-input').inputValue(), '10');
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('[data-account-balance="fund"]').first().textContent(), '20.00 USDC');
    assert.equal(await page.locator('[data-account-balance="contract"]').first().textContent(), '0.00 USDC');
  });
});

test('completes a reverse transfer after transfer again using Max', async () => {
  await withPage(async (page) => {
    await page.locator('#amount-input').fill('10');
    await page.locator('#review-transfer').click();
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-screen="success"]:visible').waitFor();
    await page.locator('#transfer-again').click();
    await page.locator('#swap-route').click();
    await page.locator('[data-percentage="1"]').click();
    assert.equal(await page.locator('#amount-input').inputValue(), '10');
    await page.locator('#review-transfer').click();
    assert.match(await page.locator('[data-review-route]').textContent(), /合约账户[\s\S]*资金账户/);
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-screen="success"]:visible').waitFor();
    assert.equal(await page.locator('[data-success-fund-balance]').textContent(), '20.00 USDC');
    assert.equal(await page.locator('[data-success-contract-balance]').textContent(), '0.00 USDC');
  });
});

test('renders complete static review galleries without network requests', async () => {
  const requests = [];
  await withPage(async (page) => {
    page.on('request', (request) => {
      if (!request.url().startsWith('file:')) requests.push(request.url());
    });
    await page.reload();
    assert.equal(await page.locator('#gallery-grid .gallery-card').count(), 5);
    assert.equal(await page.locator('#error-gallery-grid .error-gallery-card').count(), 5);
    assert.equal(requests.length, 0);
    assert.equal(await page.locator('[role="dialog"]').count() >= 2, true);
    assert.equal(await page.locator('[aria-live="polite"]').count() > 0, true);
  }, { width: 1440, height: 1000 });
});

test('keeps the phone usable at a 390 by 844 viewport', async () => {
  await withPage(async (page) => {
    const phone = page.locator('.phone').first();
    const box = await phone.boundingBox();
    assert.ok(box);
    assert.equal(Math.round(box.width), 390);
    assert.equal(Math.round(box.height), 844);
    assert.equal(await page.locator('#amount-input').isVisible(), true);
    assert.equal(await page.locator('#review-transfer').isVisible(), true);
  }, { width: 390, height: 844 });
});

test('keeps back unavailable and removes transfer history', async () => {
  await withPage(async (page) => {
    assert.equal(await page.locator('[aria-label^="返回"]').first().isDisabled(), true);
    assert.equal(await page.locator('[aria-label^="划转记录"]').count(), 0);
  });
});

test('does not create horizontal overflow at 320 pixels', async () => {
  await withPage(async (page) => {
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      gallerySlot: document.querySelector('.gallery-device-slot')?.getBoundingClientRect().width
    }));
    assert.equal(dimensions.document, dimensions.viewport);
    assert.ok(dimensions.gallerySlot <= 288);
  }, { width: 320, height: 760 });
});
