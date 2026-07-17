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
      const navBox = await page.locator('#screen-root .bottom-nav').boundingBox();
      assert.ok(navBox && navBox.y + navBox.height <= viewport.height, `${viewport.width}×${viewport.height} bottom navigation is in the viewport`);
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
    await page.locator('[data-return-assets]').click();
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
    for (let i = 0; i < 3; i += 1) await page.locator('[data-advance-withdrawal]').click();
    await page.locator('[data-return-assets]').click();
    await route(page, 'assets');
    const after = Number(await page.locator('[data-funding-balance="USDT"]').getAttribute('data-value'));
    assert.equal(Math.round((before - after) * 100) / 100, 250);
    assert.equal(await page.locator('[data-record-type="withdrawal"]').count(), 1);
    const withdrawal = await page.evaluate(() => window.assetPrototype.getState().records.find(record => record.type === 'withdrawal'));
    assert.equal(withdrawal.amount, 250);
    assert.equal(withdrawal.fee, 0.8);
  });
});

test('terminal deposit exceptions never credit funding and show an honest amount', async () => {
  for (const scenario of ['below-minimum', 'mismatch', 'failed']) {
    await withPage(async page => {
      const before = await page.evaluate(() => window.assetPrototype.getState().funding.USDC);
      await openDeposit(page);
      await page.locator('[data-start-demo-deposit]').click();
      await page.locator('#deposit-scenario').selectOption(scenario);
      if (scenario === 'below-minimum') {
        assert.equal(await page.locator('[data-deposit-amount]').getAttribute('data-value'), '5');
      }
      assert.equal(await page.locator('#interactive-phone [data-advance-deposit]').count(), 0);
      assert.equal(await page.locator('#demo-console [data-advance-deposit]').isDisabled(), true);
      await page.locator('[data-return-deposit]').click();
      const after = await page.evaluate(() => window.assetPrototype.getState().funding.USDC);
      assert.equal(after, before, scenario);
      assert.equal(await page.evaluate(() => window.assetPrototype.getState().records.filter(record => record.type === 'deposit').length), 0);
    });
  }
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

test('every configured network supplies a valid fictional withdrawal address', async () => {
  await withPage(async page => {
    await openWithdrawal(page);
    for (const network of ['Ethereum','Arbitrum','Polygon','Base','Optimism','Solana','TRON']) {
      await page.locator('#withdraw-network').click();
      await page.locator(`[data-withdraw-network="${network}"]`).click();
      await page.locator('#paste-demo-address').click();
      await page.locator('#withdraw-amount').fill('250');
      assert.equal(await page.locator('#review-withdrawal').isEnabled(), true, network);
    }
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
    const contractAvailable = await page.evaluate(() => {
      const state = window.assetPrototype.getState();
      return Math.round((state.contract.USDT + state.contract.USDC + state.contractMeta.unrealizedPnl - state.contractMeta.usedMargin) * 100) / 100;
    });
    assert.equal(Number(await page.locator('#transfer-amount').inputValue()), contractAvailable);
    await page.locator('#review-transfer').click();
    await page.locator('#simulate-transfer-failure').click();
    await route(page, 'transfer-status');
    assert.match(await page.locator('#screen-root').textContent(), /划转失败/);
    await page.locator('#retry-transfer').click();
    await route(page, 'transfer-review');
    assert.equal(await page.locator('#transfer-amount-review').textContent(), '1,354.61 USDT');
  });
});

test('filters unified deposit, withdrawal, and transfer records and opens details', async () => {
  await withPage(async page => {
    await page.locator('#open-records').click();
    await route(page, 'records');
    assert.match(await page.locator('[data-record-summary]').textContent(), /净流入.*\+500\.00/s);
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
    assert.equal(await page.locator('[data-value-marker="withdrawal"]').count(), 0);
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

test('record time filters exclude records outside the selected window', async () => {
  await withPage(async page => {
    await page.locator('#open-records').click();
    assert.equal(await page.locator('[data-record-id="sample-deposit-old"]').count(), 1);
    await page.locator('#open-record-filters').click();
    await page.locator('#record-time-filter').selectOption('month');
    await page.locator('#apply-record-filters').click();
    assert.equal(await page.locator('[data-record-id="sample-deposit-old"]').count(), 0);
  });
});

test('account totals and value history follow balance mutations and time ranges', async () => {
  await withPage(async page => {
    const initialFunding = Number(await page.locator('[data-funding-total]').getAttribute('data-value'));
    await openDeposit(page);
    await page.locator('[data-start-demo-deposit]').click();
    for (let i = 0; i < 3; i += 1) await page.locator('[data-advance-deposit]').click();
    await page.locator('[data-return-assets]').click();
    const updatedFunding = Number(await page.locator('[data-funding-total]').getAttribute('data-value'));
    assert.equal(updatedFunding - initialFunding, 500);

    await page.locator('#open-value-history').click();
    const state = await page.evaluate(() => window.assetPrototype.getState());
    const expectedAll = state.funding.USDT + state.funding.USDC + state.contract.USDT + state.contract.USDC + state.contractMeta.unrealizedPnl;
    assert.equal(Number(await page.locator('[data-current-value]').getAttribute('data-value')), expectedAll);
    const path30d = await page.locator('[data-value-line]').getAttribute('d');
    const change30d = await page.locator('[data-value-change]').textContent();
    await page.locator('[data-value-range="7d"]').click();
    assert.notEqual(await page.locator('[data-value-line]').getAttribute('d'), path30d);
    assert.notEqual(await page.locator('[data-value-change]').textContent(), change30d);
  });
});

test('each account value change reconciles exactly to its displayed sources', async () => {
  await withPage(async page => {
    await page.locator('#open-value-history').click();
    for (const account of ['all', 'funding', 'contract']) {
      await page.locator(`[data-value-account="${account}"]`).click();
      const headlineAttribute = await page.locator('[data-value-change]').getAttribute('data-value');
      assert.notEqual(headlineAttribute, null, account);
      const headline = Number(headlineAttribute);
      const sources = await page.locator('[data-source-value]').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('data-source-value'))));
      assert.equal(sources.length, 3, account);
      assert.equal(Math.round(sources.reduce((sum, value) => sum + value, 0) * 100), Math.round(headline * 100), account);
    }
  });
});

test('contract transfer-out respects available margin and updates risk metrics', async () => {
  await withPage(async page => {
    await page.locator('[data-account-tab="contract"]').click();
    await page.locator('#open-transfer-out').click();
    await page.locator('#transfer-max').click();
    const state = await page.evaluate(() => window.assetPrototype.getState());
    const allowed = Math.round((state.contract.USDT + state.contractMeta.unrealizedPnl - state.contractMeta.usedMargin) * 100) / 100;
    assert.equal(Number(await page.locator('#transfer-amount').inputValue()), allowed);
    await page.locator('#review-transfer').click();
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-complete-transfer]').click();
    await page.locator('[data-transfer-done]').click();
    await page.locator('[data-account-tab="contract"]').click();
    const after = await page.evaluate(() => window.assetPrototype.getState());
    assert.ok(Math.round((after.contract.USDT + after.contractMeta.unrealizedPnl) * 100) >= Math.round(after.contractMeta.usedMargin * 100));
    assert.match(await page.locator('[data-risk-status]').textContent(), /偏高/);
    const expectedPnlRate = after.contractMeta.unrealizedPnl / (after.contract.USDT + after.contract.USDC) * 100;
    assert.equal(Number(await page.locator('[data-pnl-rate]').getAttribute('data-value')), expectedPnlRate);
  });
});

test('credited deposits lock exception scenarios and cannot be rewritten as failures', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await page.locator('[data-start-demo-deposit]').click();
    for (let i = 0; i < 3; i += 1) await page.locator('[data-advance-deposit]').click();
    assert.equal(await page.locator('#deposit-scenario').isDisabled(), true);
    const credited = await page.evaluate(() => window.assetPrototype.getState().deposit);
    assert.equal(credited.credited, true);
    assert.equal(credited.scenario, 'normal');
    assert.equal(credited.stage, 'complete');
  });
});

test('address labels are escaped and sheets expose an accessible name', async () => {
  await withPage(async page => {
    await setSession(page, 'wallet');
    await openWithdrawal(page);
    await page.locator('#open-address-book').click();
    await page.locator('#add-address').click();
    await page.locator('#address-label').fill('\"><img data-injected src=x>');
    await page.locator('#address-value').fill('0x1234567890abcdef1234567890abcdef12345678');
    await page.locator('#save-address').click();
    const dialog = page.getByRole('dialog');
    const labelledBy = await dialog.getAttribute('aria-labelledby');
    assert.ok(labelledBy);
    assert.equal(await page.locator(`#${labelledBy}`).count(), 1);
    assert.equal(await page.locator('#sheet-root [data-injected]').count(), 0);
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

test('uses one coherent SVG icon system and exchange-grade controls', async () => {
  await withPage(async page => {
    assert.ok(await page.locator('#interactive-phone [data-icon]').count() >= 18);
    assert.equal(await page.locator('#interactive-phone button').filter({ hasText: /^[⌁⌗⇅×]+$/ }).count(), 0);
    const sizes = await page.locator('#interactive-phone button:visible').evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return [box.width, box.height];
    }));
    assert.ok(sizes.every(([width, height]) => width >= 32 && height >= 32));
  });
});

test('matches the reference shell at desktop and mobile sizes', async () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 760 }, { width: 1280, height: 1000 }]) {
    await withPage(async page => {
      const phone = await page.locator('#interactive-phone').boundingBox();
      assert.ok(phone && phone.height <= viewport.height);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }, viewport);
  }
});

test('funding home exposes professional balance and asset detail', async () => {
  await withPage(async page => {
    for (const label of ['可用资产', '冻结资产', '待入账', '最后更新', '资产配置', '资金动态']) {
      assert.match(await page.locator('#screen-root').textContent(), new RegExp(label));
    }
    assert.equal(await page.locator('[data-asset-row]').count(), 2);
    await page.locator('[data-asset-row="USDT"]').click();
    assert.match(await page.locator('[data-asset-detail]').textContent(), /参考价格.*24h 涨跌.*资产占比.*可用余额.*最近变动.*支持网络/s);
    assert.ok(await page.locator('[data-activity-row]').count() >= 3);
  });
});

test('contract home derives exposure risk and transfer headroom', async () => {
  await withPage(async page => {
    await page.locator('[data-account-tab="contract"]').click();
    for (const label of ['账户权益', '未实现盈亏', '可用保证金', '占用保证金', '维持保证金', '保证金率', '持仓敞口', '可划转']) {
      assert.match(await page.locator('#screen-root').textContent(), new RegExp(label));
    }
    const state = await page.evaluate(() => window.assetPrototype.getState());
    const expected = Math.round((state.contract.USDT + state.contract.USDC + state.contractMeta.unrealizedPnl - state.contractMeta.usedMargin) * 100) / 100;
    assert.equal(Number(await page.locator('[data-contract-headroom]').getAttribute('data-value')), expected);
  });
});

test('deposit entry exposes network operational detail', async () => {
  await withPage(async page => {
    await openDeposit(page);
    for (const label of ['网络状态', '最低充值', '确认要求', '预计到账', '代币合约', '最近充值']) {
      assert.match(await page.locator('#screen-root').textContent(), new RegExp(label));
    }
    assert.ok(await page.locator('[data-recent-deposit]').count() >= 1);
    const token = (await page.evaluate(() => window.assetPrototype.getState())).depositDraft.token;
    for (const row of await page.locator('[data-recent-deposit]').all()) assert.match(await row.textContent(), new RegExp(token));
  });
});

test('deposit confirmation provides an auditable timeline', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await page.locator('[data-start-demo-deposit]').click();
    await page.locator('[data-advance-deposit]').click();
    for (const label of ['发送地址', '充值地址', '交易哈希', '首次检测', '预计完成', '区块浏览器', '确认进度']) {
      assert.match(await page.locator('#screen-root').textContent(), new RegExp(label));
    }
    assert.ok(await page.locator('[data-deposit-timeline-step]').count() >= 4);
  });
});

test('withdrawal separates debit fee receipt limit and risk', async () => {
  await withPage(async page => {
    await openWithdrawal(page);
    await page.locator('#paste-demo-address').click();
    await page.locator('#withdraw-amount').fill('250');
    for (const label of ['本次扣除', '网络费', '预计到账', '今日剩余额度', '地址类型', '网络拥堵', '预计处理']) {
      assert.match(await page.locator('#screen-root').textContent(), new RegExp(label));
    }
    assert.equal(await page.locator('[data-withdraw-gross]').textContent(), '250.00 USDT');
    assert.equal(await page.locator('[data-withdraw-net]').textContent(), '249.20 USDT');
  });
});

test('transfer receipt exposes balances risk and reference id', async () => {
  await withPage(async page => {
    await page.locator('#open-transfer').click();
    await page.locator('#transfer-amount').fill('500');
    await page.locator('#review-transfer').click();
    assert.match(await page.locator('#screen-root').textContent(), /划转前.*划转后.*风险影响/s);
    await page.locator('#confirm-transfer').click();
    await page.locator('[data-complete-transfer]').click();
    assert.match(await page.locator('#screen-root').textContent(), /参考编号.*完成时间.*查看资金记录/s);
  });
});

test('address book discloses verification and duplicate risk', async () => {
  await withPage(async page => {
    await setSession(page, 'wallet');
    await openWithdrawal(page);
    await page.locator('#open-address-book').click();
    await page.locator('#add-address').click();
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    await page.locator('#address-label').fill('主钱包');
    await page.locator('#address-value').fill(address);
    await page.locator('#save-address').click();
    assert.match(await page.locator('#sheet-root').textContent(), /仅授权.*保存.*不会发起提现.*链上授权/s);
    await page.locator('#confirm-signature').click();
    assert.match(await page.locator('#screen-root').textContent(), /已验证.*钱包签名.*最后使用/s);
    await page.locator('#add-address').click();
    await page.locator('#address-label').fill('重复地址');
    await page.locator('#address-value').fill(address);
    assert.match(await page.locator('[data-address-risk]').textContent(), /地址簿中已存在/);
    assert.equal(await page.locator('#save-address').isDisabled(), true);
  });
});

test('fund records reconcile totals fees and net flow', async () => {
  await withPage(async page => {
    await page.locator('#open-records').click();
    for (const label of ['充值总额', '提现总额', '网络费用', '净流入']) {
      assert.match(await page.locator('[data-record-summary]').textContent(), new RegExp(label));
    }
    await page.locator('[data-record-id]').first().click();
    assert.ok(await page.locator('[data-record-timeline-step]').count() >= 3);
    assert.match(await page.locator('#screen-root').textContent(), /复制.*区块浏览器/s);
  });
});

test('value chart exposes axes tooltip modes and period statistics', async () => {
  await withPage(async page => {
    await page.locator('#open-value-history').click();
    for (const label of ['期初价值', '期末价值', '区间最高', '区间最低', '净入金', '剔除资金流收益']) {
      assert.match(await page.locator('#screen-root').textContent(), new RegExp(label));
    }
    assert.ok(await page.locator('[data-axis-y]').count() >= 3);
    assert.ok(await page.locator('[data-axis-x]').count() >= 3);
    await page.locator('[data-chart-mode="return"]').click();
    assert.equal(await page.locator('[data-value-chart]').getAttribute('data-mode'), 'return');
    await page.locator('[data-chart-point]').nth(3).click();
    assert.equal(await page.locator('[data-chart-tooltip]').isVisible(), true);
  });
});

test('gallery documents every screen with interaction specs', async () => {
  await withPage(async page => {
    for (const label of ['资产主页', '合约账户', '地址充值', '钱包充值', '网络确认', '提现', '地址簿', '账户划转', '资金记录', '账户价值']) {
      const card = page.locator(`[data-gallery-card="${label}"]`);
      assert.equal(await card.count(), 1, label);
      assert.match(await card.textContent(), /进入条件.*用户操作.*系统响应.*下一状态.*开发细节/s);
    }
  });
});

test('error gallery documents trigger blocking and recovery', async () => {
  await withPage(async page => {
    assert.ok(await page.locator('[data-error-spec]').count() >= 8);
    const cards = await page.locator('[data-error-spec]').all();
    for (const card of cards) {
      assert.match(await card.textContent(), /触发条件.*提示位置.*阻断范围.*恢复操作.*实现规则/s);
    }
  });
});

test('deposit contracts follow the selected token on every network', async () => {
  await withPage(async page => {
    await openDeposit(page);
    const usdcContract = await page.locator('[data-token-contract]').getAttribute('data-address');
    await page.locator('#deposit-token').click();
    await page.locator('[data-token="USDT"]').click();
    const usdtContract = await page.locator('[data-token-contract]').getAttribute('data-address');
    assert.notEqual(usdcContract, usdtContract);
  });
});

test('closing reconnect leaves wallet deposit safely disconnected', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await page.locator('[data-deposit-method="wallet"]').click();
    await page.locator('#simulate-reconnect').click();
    await page.locator('[data-sheet-close]').click();
    assert.equal(await page.locator('#launch-wallet').isDisabled(), true);
    assert.equal(await page.evaluate(() => window.assetPrototype.getState().depositDraft.walletConnected), false);
  });
});

test('completed withdrawal cannot be rewritten as a failed terminal state', async () => {
  await withPage(async page => {
    await setSession(page, 'wallet');
    await openWithdrawal(page);
    await fillWithdrawal(page, undefined, '100');
    await page.locator('#submit-withdrawal').click();
    for (let index = 0; index < 3; index += 1) await page.locator('[data-advance-withdrawal]').click();
    assert.equal(await page.locator('#withdrawal-scenario').isDisabled(), true);
    await page.locator('#withdrawal-scenario').evaluate(node => {
      node.value = 'failed';
      node.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const withdrawal = await page.evaluate(() => window.assetPrototype.getState().withdrawal);
    assert.equal(withdrawal.stage, 'complete');
    assert.equal(withdrawal.scenario, 'normal');
    assert.equal(withdrawal.debited, true);
    assert.equal((await page.locator('[data-withdrawal-exception]').textContent()).trim(), '');
  });
});

test('return mode keeps headline chart and period change on one measure', async () => {
  await withPage(async page => {
    await page.locator('#open-value-history').click();
    await page.locator('[data-chart-mode="return"]').click();
    assert.equal(Number(await page.locator('[data-current-value]').getAttribute('data-value')), 182.36);
    assert.equal(Number(await page.locator('[data-value-change]').getAttribute('data-value')), 182.36);
    assert.doesNotMatch(await page.locator('#screen-root .value-header').textContent(), /2,432\.36/);
  });
});

test('pending transactions stay out of settled net inflow', async () => {
  await withPage(async page => {
    await page.locator('#open-records').click();
    assert.equal(Number(await page.locator('[data-record-net]').getAttribute('data-value')), 500);
    assert.doesNotMatch(await page.locator('[data-record-summary]').textContent(), /2,250\.00/);
    await page.locator('[data-back]').click();
    await page.locator('#open-value-history').click();
    const depositMarker = page.locator('#screen-root .chart-event-label.deposit');
    assert.match(await depositMarker.textContent(), /\+500/);
    assert.doesNotMatch(await depositMarker.textContent(), /2,000/);
    assert.equal(await page.locator('#screen-root .chart-event-label.withdrawal').count(), 0);
  });
});

test('recent deposits follow the selected token', async () => {
  await withPage(async page => {
    await openDeposit(page);
    for (const row of await page.locator('[data-recent-deposit]').all()) assert.match(await row.textContent(), /USDC/);
    await page.locator('#deposit-token').click();
    await page.locator('[data-token="USDT"]').click();
    for (const row of await page.locator('[data-recent-deposit]').all()) assert.match(await row.textContent(), /USDT/);
  });
});

test('prototype-only controls live outside the phone', async () => {
  await withPage(async page => {
    await openDeposit(page);
    assert.equal(await page.locator('#interactive-phone [data-start-demo-deposit]').count(), 0);
    assert.equal(await page.locator('#demo-console [data-start-demo-deposit]').count(), 1);
    await page.locator('[data-deposit-method="wallet"]').click();
    assert.equal(await page.locator('#interactive-phone #simulate-reconnect').count(), 0);
    assert.equal(await page.locator('#demo-console #simulate-reconnect').count(), 1);
    assert.equal(await page.locator('#demo-console #simulate-mismatch').count(), 1);
  });
});

test('deposit processing controls stay in the demo console', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await page.locator('#demo-console [data-start-demo-deposit]').click();
    assert.equal(await page.locator('#interactive-phone #deposit-scenario').count(), 0);
    assert.equal(await page.locator('#interactive-phone [data-advance-deposit]').count(), 0);
    assert.equal(await page.locator('#demo-console #deposit-scenario').count(), 1);
    assert.equal(await page.locator('#demo-console [data-advance-deposit]').count(), 1);
  });
});

test('withdrawal and transfer simulation controls stay outside the phone', async () => {
  await withPage(async page => {
    await openWithdrawal(page);
    await fillWithdrawal(page, undefined, '100');
    await page.locator('#submit-withdrawal').click();
    await route(page, 'withdraw-status');
    assert.equal(await page.locator('#interactive-phone #withdrawal-scenario').count(), 0);
    assert.equal(await page.locator('#interactive-phone [data-advance-withdrawal]').count(), 0);
    assert.equal(await page.locator('#demo-console #withdrawal-scenario').count(), 1);
    assert.equal(await page.locator('#demo-console [data-advance-withdrawal]').count(), 1);

    await page.locator('#reset-prototype').click();
    await page.locator('#open-transfer').click();
    await page.locator('#transfer-amount').fill('100');
    await page.locator('#review-transfer').click();
    assert.equal(await page.locator('#interactive-phone #simulate-transfer-failure').count(), 0);
    assert.equal(await page.locator('#demo-console #simulate-transfer-failure').count(), 1);
    await page.locator('#confirm-transfer').click();
    assert.equal(await page.locator('#interactive-phone [data-complete-transfer]').count(), 0);
    assert.equal(await page.locator('#demo-console [data-complete-transfer]').count(), 1);
  });
});

test('phone never exposes prototype state copy', async () => {
  await withPage(async page => {
    await openDeposit(page);
    assert.doesNotMatch(await page.locator('#interactive-phone').textContent(), /模拟收到|模拟钱包|推进演示状态|完成演示处理/);
  });
});

test('mobile product view hides the demo console', async () => {
  await withPage(async page => {
    assert.equal(await page.locator('#demo-console').isVisible(), false);
  }, { width:390, height:844 });
});

async function expectFullAddresses(page) {
  const nodes = await page.locator('#interactive-phone [data-full-address]').all();
  assert.ok(nodes.length > 0);
  for (const node of nodes) {
    const text = (await node.textContent()).trim();
    assert.equal(text, await node.getAttribute('data-address'));
    assert.doesNotMatch(text, /\.\.\.|…/);
    assert.equal(await node.evaluate(element => getComputedStyle(element).overflowWrap), 'anywhere');
    assert.equal(await node.evaluate(element => getComputedStyle(element).whiteSpace), 'normal');
    assert.ok(await node.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize) >= 11));
  }
}

test('required mobile copy respects the readability floor', async () => {
  await withPage(async page => {
    await openDeposit(page);
    for (const selector of ['.field-label', '.operation-grid small', '.operation-grid b', '.address-column>p', '.recent-deposit small', '.deposit-selectors .selector-button small', '.prototype-badge', '.notice-box strong', '.mini-section-title span', '.recent-mark']) {
      const size = await page.locator(`#interactive-phone ${selector}`).first().evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize));
      assert.ok(size >= 11, `${selector}: ${size}px`);
    }
  }, { width:390, height:844 });
});

test('network facts use a readable two-column layout', async () => {
  await withPage(async page => {
    await openDeposit(page);
    const columns = await page.locator('#interactive-phone .operation-grid').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length);
    assert.equal(columns, 2);
  });
});

test('deposit contract and destination addresses are complete', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await expectFullAddresses(page);
  });
});

test('operational address surfaces preserve complete values', async () => {
  await withPage(async page => {
    await openDeposit(page);
    await page.locator('#demo-console [data-start-demo-deposit]').click();
    await page.locator('#demo-console [data-advance-deposit]').click();
    await expectFullAddresses(page);

    await page.locator('#reset-prototype').click();
    await openWithdrawal(page);
    await fillWithdrawal(page, '0x1234567890abcdef1234567890abcdef12345678', '100');
    await expectFullAddresses(page);
    await page.locator('#submit-withdrawal').click();
    await expectFullAddresses(page);

    await page.locator('#reset-prototype').click();
    await openWithdrawal(page);
    await page.locator('#open-address-book').click();
    await page.locator('#add-address').click();
    await page.locator('#address-label').fill('完整地址');
    await page.locator('#address-value').fill('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
    await page.locator('#save-address').click();
    assert.equal(await page.locator('#sheet-root [data-full-address]').textContent(), '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
    await page.locator('#confirm-signature').click();
    await expectFullAddresses(page);

    await page.locator('#reset-prototype').click();
    await page.locator('#open-records').click();
    await page.locator('[data-record-type="deposit"]').first().click();
    await expectFullAddresses(page);
  });
});

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
    const networkPills = page.locator('#interactive-phone [data-asset-detail] .network-pills');
    assert.equal(await networkPills.evaluate(node => getComputedStyle(node).flexWrap), 'wrap');
    assert.equal(await networkPills.evaluate(node => getComputedStyle(node).overflowX), 'visible');
  });
});

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
    const lastActivity = await page.locator('#interactive-phone [data-activity-row]').last().boundingBox();
    assert.ok(after && lastActivity);
    assert.equal(Math.round(after.y), Math.round(before.y));
    assert.ok(Math.abs((after.y + after.height) - (phoneBox.y + phoneBox.height)) <= 2);
    assert.ok(lastActivity.y + lastActivity.height <= after.y + 1);
    assert.equal(await page.locator('#interactive-phone .app-screen').evaluate(node => node.scrollTop), 0);
  }, { width:390, height:844 });
});
