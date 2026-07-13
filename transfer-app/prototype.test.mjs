import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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
