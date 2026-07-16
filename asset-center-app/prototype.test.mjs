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

