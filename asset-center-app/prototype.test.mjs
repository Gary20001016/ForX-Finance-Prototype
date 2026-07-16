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

async function openDeposit(page) {
  await page.locator('#open-deposit').click();
  await route(page, 'deposit');
}

async function chooseNetwork(page, network) {
  await page.locator('#deposit-network').click();
  await page.locator(`[data-network="${network}"]`).click();
}

test('offers wallet deposit on EVM and Solana but address-only deposit on TRON', async () => {
  await withPage(async page => {
    await openDeposit(page);
    assert.equal(await page.locator('[data-deposit-method="wallet"]').count(), 1);
    await chooseNetwork(page, 'TRON');
    assert.equal(await page.locator('[data-deposit-method="wallet"]').count(), 0);
    assert.match(await page.locator('#screen-root').textContent(), /TRON 暂不支持钱包直接充值/);
    await chooseNetwork(page, 'Solana');
    assert.equal(await page.locator('[data-deposit-method="wallet"]').count(), 1);
  });
});

test('reconnects a stale wallet without login copy and blocks a mismatched account', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await page.locator('[data-deposit-method="wallet"]').click();
    await page.locator('#wallet-deposit-amount').fill('500');
    await page.locator('#simulate-reconnect').click();
    assert.match(await page.locator('#sheet-root').textContent(), /恢复钱包连接/);
    assert.doesNotMatch(await page.locator('#sheet-root').textContent(), /重新登录|SIWE|验证身份/);
    await page.locator('#reconnect-wallet').click();
    assert.equal(await page.locator('#sheet-root').isHidden(), true);
    await page.locator('#simulate-mismatch').click();
    assert.match(await page.locator('#sheet-root').textContent(), /钱包地址不一致/);
    await page.locator('[data-sheet-close]').click();
    assert.equal(await page.locator('#launch-wallet').isDisabled(), true);
    await page.locator('#restore-wallet-address').click();
    assert.equal(await page.locator('#launch-wallet').isEnabled(), true);
  });
});

test('shows four honest deposit stages and credits the funding balance once', async () => {
  await withPage(async page => {
    const before = Number(await page.locator('[data-funding-balance="USDC"]').getAttribute('data-value'));
    await openDeposit(page);
    await page.locator('[data-start-demo-deposit]').click();
    await route(page, 'deposit-progress');
    assert.match(await page.locator('[data-current-status]').textContent(), /等待链上转账/);
    await page.locator('[data-advance-deposit]').click();
    assert.match(await page.locator('[data-current-status]').textContent(), /正在等待网络确认/);
    assert.match(await page.locator('[data-status-description]').textContent(), /已检测到链上转账/);
    assert.doesNotMatch(await page.locator('[data-current-status]').textContent(), /已到账/);
    assert.match(await page.locator('[data-confirmations]').textContent(), /18 \/ 32/);
    await page.locator('[data-advance-deposit]').click();
    assert.match(await page.locator('[data-current-status]').textContent(), /正在入账/);
    await page.locator('[data-advance-deposit]').click();
    assert.match(await page.locator('[data-current-status]').textContent(), /充值已到账/);
    await page.locator('[data-advance-deposit]').click();
    await route(page, 'assets');
    const after = Number(await page.locator('[data-funding-balance="USDC"]').getAttribute('data-value'));
    assert.equal(after - before, 500);
    assert.equal(await page.locator('[data-record-type="deposit"]').count(), 1);
  });
});

test('deposit progress exposes minimum, congestion, mismatch, and failure scenarios', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await page.locator('[data-start-demo-deposit]').click();
    await page.locator('#deposit-scenario').selectOption('below-minimum');
    assert.match(await page.locator('[data-deposit-exception]').textContent(), /低于 10 USDC/);
    await page.locator('#deposit-scenario').selectOption('congestion');
    assert.match(await page.locator('[data-deposit-exception]').textContent(), /无需重复充值/);
    await page.locator('#deposit-scenario').selectOption('mismatch');
    assert.match(await page.locator('[data-deposit-exception]').textContent(), /币种或网络不匹配/);
    await page.locator('#deposit-scenario').selectOption('failed');
    assert.match(await page.locator('[data-deposit-exception]').textContent(), /链上交易失败/);
  });
});

async function setSession(page, mode) {
  await page.locator('#session-mode').selectOption(mode);
}

async function openWithdrawal(page) {
  await page.locator('#open-withdraw').click();
  await route(page, 'withdraw');
}

async function fillWithdrawal(page, address = '0x1234567890abcdef1234567890abcdef12345678', amount = '250') {
  await page.locator('#withdraw-address').fill(address);
  await page.locator('#withdraw-amount').fill(amount);
  await page.locator('#review-withdrawal').click();
  await route(page, 'withdraw-review');
}

test('wallet-login withdrawal does not request MFA and completes once', async () => {
  await withPage(async page => {
    const before = Number(await page.locator('[data-funding-balance="USDT"]').getAttribute('data-value'));
    await setSession(page, 'wallet');
    await openWithdrawal(page);
    await fillWithdrawal(page);
    await page.locator('#submit-withdrawal').click();
    await route(page, 'withdraw-status');
    assert.doesNotMatch(await page.locator('#screen-root').textContent(), /MFA 验证/);
    for (let i = 0; i < 4; i += 1) await page.locator('[data-advance-withdrawal]').click();
    await route(page, 'assets');
    const after = Number(await page.locator('[data-funding-balance="USDT"]').getAttribute('data-value'));
    assert.equal(Math.round((before - after) * 100) / 100, 250.8);
    assert.equal(await page.locator('[data-record-type="withdrawal"]').count(), 1);
  });
});

test('email withdrawal binds MFA, preserves its draft, then verifies the code', async () => {
  await withPage(async page => {
    await setSession(page, 'email-unbound');
    await openWithdrawal(page);
    await fillWithdrawal(page);
    await page.locator('#submit-withdrawal').click();
    await route(page, 'mfa-setup');
    assert.match(await page.locator('#screen-root').textContent(), /绑定 MFA/);
    await page.locator('#mfa-secret-confirmed').check();
    await page.locator('#mfa-code').fill('123456');
    await page.locator('#confirm-mfa-setup').click();
    await route(page, 'withdraw-review');
    assert.match(await page.locator('#screen-root').textContent(), /250\.00 USDT/);
    await page.locator('#submit-withdrawal').click();
    await route(page, 'mfa-verify');
    await page.locator('#mfa-verify-code').fill('123456');
    await page.locator('#confirm-mfa-verify').click();
    await route(page, 'withdraw-status');
  });
});

test('validates withdrawal address family and calculates fee and received amount', async () => {
  await withPage(async page => {
    await openWithdrawal(page);
    await page.locator('#withdraw-address').fill('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE');
    await page.locator('#withdraw-amount').fill('250');
    assert.match(await page.locator('#withdraw-error').textContent(), /Ethereum 地址应以 0x 开头/);
    assert.equal(await page.locator('#review-withdrawal').isDisabled(), true);
    await page.locator('#withdraw-address').fill('0x1234567890abcdef1234567890abcdef12345678');
    assert.equal(await page.locator('#review-withdrawal').isEnabled(), true);
    assert.match(await page.locator('[data-withdraw-received]').textContent(), /249\.20 USDT/);
  });
});

test('saving an address uses wallet signature or email MFA without submitting a withdrawal', async () => {
  await withPage(async page => {
    await setSession(page, 'wallet');
    await openWithdrawal(page);
    await page.locator('#open-address-book').click();
    await page.locator('#add-address').click();
    await page.locator('#address-label').fill('常用钱包');
    await page.locator('#address-value').fill('0x1234567890abcdef1234567890abcdef12345678');
    await page.locator('#save-address').click();
    assert.match(await page.locator('#sheet-root').textContent(), /签名仅用于保存地址/);
    await page.locator('#confirm-signature').click();
    assert.match(await page.locator('#screen-root').textContent(), /常用钱包/);
    assert.equal(await page.locator('[data-record-type="withdrawal"]').count(), 0);
    await page.locator('[data-back]').click();
    await page.locator('[data-back]').click();
    await setSession(page, 'email-bound');
    await openWithdrawal(page);
    await page.locator('#open-address-book').click();
    await page.locator('#add-address').click();
    await page.locator('#address-label').fill('邮箱用户地址');
    await page.locator('#address-value').fill('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
    await page.locator('#save-address').click();
    assert.match(await page.locator('#sheet-root').textContent(), /MFA 验证/);
    await page.locator('#address-mfa-code').fill('123456');
    await page.locator('#confirm-address-mfa').click();
    assert.match(await page.locator('#screen-root').textContent(), /邮箱用户地址/);
  });
});

test('internal transfer moves balances once without changing total assets', async () => {
  await withPage(async page => {
    const before = await page.evaluate(() => {
      const state = window.assetPrototype.getState();
      return { funding: state.funding.USDT, contract: state.contract.USDT, total: state.funding.USDT + state.contract.USDT };
    });
    await page.locator('#open-transfer').click();
    await route(page, 'transfer');
    await page.locator('#transfer-amount').fill('2000');
    await page.locator('#review-transfer').click();
    await route(page, 'transfer-review');
    assert.match(await page.locator('#screen-root').textContent(), /手续费.*0 USDT/s);
    await page.locator('#confirm-transfer').click();
    await route(page, 'transfer-status');
    await page.locator('[data-complete-transfer]').click();
    assert.match(await page.locator('[data-transfer-receipt]').textContent(), /划转完成/);
    await page.locator('[data-transfer-done]').click();
    await route(page, 'assets');
    const after = await page.evaluate(() => {
      const state = window.assetPrototype.getState();
      return { funding: state.funding.USDT, contract: state.contract.USDT, total: state.funding.USDT + state.contract.USDT };
    });
    assert.equal(before.funding - after.funding, 2000);
    assert.equal(after.contract - before.contract, 2000);
    assert.equal(after.total, before.total);
    assert.equal(await page.locator('[data-record-type="transfer"]').count(), 1);
  });
});

test('transfer validates minimum and balance, reverses route, and supports retry', async () => {
  await withPage(async page => {
    await page.locator('#open-transfer').click();
    await page.locator('#transfer-amount').fill('5');
    assert.match(await page.locator('#transfer-error').textContent(), /最低划转 10 USDT/);
    await page.locator('#transfer-amount').fill('999999');
    assert.match(await page.locator('#transfer-error').textContent(), /可用余额不足/);
    await page.locator('#swap-transfer-route').click();
    assert.match(await page.locator('[data-transfer-source]').textContent(), /合约账户/);
    await page.locator('[data-transfer-percentage="1"]').click();
    assert.equal(await page.locator('#transfer-amount').inputValue(), '2000');
    await page.locator('#review-transfer').click();
    await page.locator('#simulate-transfer-failure').click();
    await route(page, 'transfer-status');
    assert.match(await page.locator('#screen-root').textContent(), /划转失败/);
    await page.locator('#retry-transfer').click();
    await route(page, 'transfer-review');
    assert.equal(await page.locator('#transfer-amount-review').textContent(), '2,000.00 USDT');
  });
});

test('filters unified deposit, withdrawal, and transfer records and opens details', async () => {
  await withPage(async page => {
    await page.locator('#open-records').click();
    await route(page, 'records');
    assert.match(await page.locator('[data-record-summary]').textContent(), /资金净流入.*\+2,250\.00/s);
    assert.match(await page.locator('[data-record-summary]').textContent(), /账户划转不计入外部资金流/);
    assert.ok(await page.locator('[data-record-type="deposit"]').count() >= 1);
    assert.ok(await page.locator('[data-record-type="withdrawal"]').count() >= 1);
    assert.ok(await page.locator('[data-record-type="transfer"]').count() >= 1);
    await page.locator('[data-record-filter="deposit"]').click();
    assert.equal(await page.locator('[data-record-type="withdrawal"]:visible').count(), 0);
    await page.locator('[data-record-type="deposit"]:visible').first().click();
    await route(page, 'record-detail');
    assert.match(await page.locator('#screen-root').textContent(), /交易哈希/);
    assert.match(await page.locator('#screen-root').textContent(), /网络确认/);
  });
});

test('account value views distinguish external flow, returns, and internal transfers', async () => {
  await withPage(async page => {
    await page.locator('#open-value-history').click();
    await route(page, 'value-history');
    assert.match(await page.locator('[data-value-breakdown]').textContent(), /内部账户划转.*\$0\.00/s);
    assert.match(await page.locator('[data-return-source]').textContent(), /交易及其他收益.*\+\$182\.36/s);
    assert.doesNotMatch(await page.locator('[data-return-source]').textContent(), /划转/);
    await page.locator('[data-value-account="funding"]').click();
    assert.match(await page.locator('[data-value-breakdown]').textContent(), /账户划转流出.*-\$2,000\.00/s);
    assert.doesNotMatch(await page.locator('[data-return-source]').textContent(), /划转/);
    await page.locator('[data-value-range="7d"]').click();
    assert.equal(await page.locator('[data-value-chart]').getAttribute('data-range'), '7d');
    assert.equal(await page.locator('[data-value-marker="deposit"]').count(), 1);
    assert.equal(await page.locator('[data-value-marker="withdrawal"]').count(), 1);
  });
});

test('page and error galleries cover the complete approved prototype', async () => {
  await withPage(async page => {
    for (const label of ['资产主页','地址充值','钱包充值','网络确认','提现','地址簿','账户划转','资金记录','账户价值']) {
      assert.equal(await page.locator('#page-gallery .gallery-copy h3').getByText(label, { exact: true }).count(), 1, label);
    }
    for (const label of ['低于最小金额','钱包地址不一致','MFA 验证失败','网络不匹配','提现失败']) {
      assert.equal(await page.locator('#error-gallery .gallery-copy h3').getByText(label, { exact: true }).count(), 1, label);
    }
  });
});

test('Escape closes a sheet and restores focus to its trigger', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await page.locator('#deposit-network').focus();
    await page.locator('#deposit-network').click();
    assert.equal(await page.locator('#sheet-root').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#sheet-root').isHidden(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'deposit-network');
  });
});

test('email address save binds MFA and returns to the preserved address draft', async () => {
  await withPage(async page => {
    await setSession(page, 'email-unbound');
    await openWithdrawal(page);
    await page.locator('#open-address-book').click();
    await page.locator('#add-address').click();
    await page.locator('#address-label').fill('待验证地址');
    await page.locator('#address-value').fill('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
    await page.locator('#save-address').click();
    await route(page, 'mfa-setup');
    await page.locator('#mfa-secret-confirmed').check();
    await page.locator('#mfa-code').fill('123456');
    await page.locator('#confirm-mfa-setup').click();
    await route(page, 'add-address');
    assert.equal(await page.locator('#address-label').inputValue(), '待验证地址');
    await page.locator('#save-address').click();
    assert.match(await page.locator('#sheet-root').textContent(), /MFA 验证/);
  });
});

test('withdrawal details include rejected and failed demonstration states', async () => {
  await withPage(async page => {
    await setSession(page, 'wallet');
    await openWithdrawal(page);
    await fillWithdrawal(page);
    await page.locator('#submit-withdrawal').click();
    await page.locator('#withdrawal-scenario').selectOption('rejected');
    assert.match(await page.locator('[data-withdrawal-exception]').textContent(), /提现已被拒绝/);
    await page.locator('#withdrawal-scenario').selectOption('failed');
    assert.match(await page.locator('[data-withdrawal-exception]').textContent(), /链上发送失败/);
  });
});

test('reset restores balances, session, routes, and prototype records', async () => {
  await withPage(async page => {
    await setSession(page, 'email-bound');
    await page.locator('#open-transfer').click();
    await page.locator('#reset-prototype').click();
    await route(page, 'assets');
    const snapshot = await page.evaluate(() => window.assetPrototype.getState());
    assert.equal(snapshot.session.type, 'wallet');
    assert.equal(snapshot.funding.USDT, 18240);
    assert.equal(snapshot.records.length, 0);
    assert.equal(await page.locator('#session-mode').inputValue(), 'wallet');
  });
});

test('standalone prototype performs no network requests and logs no errors', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', request => { if (!request.url().startsWith('file:')) requests.push(request.url()); });
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(htmlPath.href);
  for (const target of ['deposit','withdraw','transfer','records','value-history']) {
    await page.evaluate(routeName => window.assetPrototype.navigate(routeName), target);
  }
  assert.deepEqual(requests, []);
  assert.deepEqual(errors, []);
  await context.close();
});

test('advanced record filters combine asset, network, status, and time', async () => {
  await withPage(async page => {
    await page.locator('#open-records').click();
    await page.locator('#open-record-filters').click();
    await page.locator('#record-asset-filter').selectOption('USDC');
    await page.locator('#record-network-filter').selectOption('Base');
    await page.locator('#record-status-filter').selectOption('failed');
    await page.locator('#record-time-filter').selectOption('month');
    await page.locator('#apply-record-filters').click();
    assert.equal(await page.locator('[data-record-type]:visible').count(), 1);
    assert.match(await page.locator('[data-record-type]:visible').textContent(), /提现 · USDC/);
    assert.match(await page.locator('[data-record-type]:visible').textContent(), /Base/);
  });
});

test('bottom sheet traps keyboard focus between its first and last controls', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await page.locator('#deposit-network').click();
    const first = page.locator('#sheet-root button').first();
    const last = page.locator('#sheet-root button').last();
    await first.focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await last.evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await first.evaluate(node => node === document.activeElement), true);
  });
});

test('notification shortcut explains prototype-only account events', async () => {
  await withPage(async page => {
    await page.getByRole('button', { name: '通知' }).click();
    assert.match(await page.locator('#sheet-root').textContent(), /充值已到账/);
    assert.match(await page.locator('#sheet-root').textContent(), /原型通知/);
  });
});
