import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(process.env.BROWSER_MODULE_DIR ? path.join(process.env.BROWSER_MODULE_DIR, 'package.json') : import.meta.url);
const { chromium } = require('playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = '/discount-tax-calculator/';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.mjs': 'application/javascript', '.js': 'application/javascript', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (!pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
  const relative = pathname.slice(prefix.length) || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
  try { const bytes = await readFile(file); response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(bytes); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = process.env.BASE_URL || `http://127.0.0.1:${server.address().port}${prefix}`;
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('#connection-status').textContent.includes('オフラインでも'));
  assert.equal(await page.locator('#result-gross').textContent(), '8,000');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No overflow at ${width}px`);
    await page.locator('#price').fill('999999999');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Max input no overflow at ${width}px`);
    await page.locator('#price').fill('10000');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const undersized = await page.locator('button:visible').evaluateAll(buttons => buttons.filter(button => button.getBoundingClientRect().height < 44).map(button => button.textContent));
  assert.deepEqual(undersized, [], 'All visible buttons have 44px height');
  await page.locator('[data-basis="excluded"]').click();
  assert.equal(await page.locator('#result-gross').textContent(), '8,800');
  await page.locator('#truncate').check();
  assert.equal(await page.locator('#result-gross').textContent(), '8,000');
  assert.equal(await page.locator('#result-net').textContent(), '7,273');
  await page.locator('[data-mode="tax"]').click();
  await page.locator('#truncate').uncheck();
  await page.locator('#price').fill('1080');
  await page.locator('[data-tax="8"]').click();
  assert.equal(await page.locator('#result-net').textContent(), '1,000');
  assert.equal(await page.locator('#result-tax').textContent(), '80');
  await page.locator('#price').fill('-1');
  assert.equal(await page.locator('#result-gross').textContent(), '—');
  assert.equal(await page.locator('#price').getAttribute('aria-invalid'), 'true');
  await page.locator('#reset-button').click();
  assert.equal(await page.locator('#price').inputValue(), '');
  await page.locator('#install-button').click();
  // In headless browsers the fallback dialog is used unless a native install prompt is available.
  if (await page.locator('#install-dialog').isVisible()) await page.locator('.dialog-done').click();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), true);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  assert.equal(await page.locator('#result-gross').textContent(), '8,000');
  await page.locator('#price').fill('10800');
  await page.locator('[data-tax="8"]').click();
  assert.equal(await page.locator('#result-gross').textContent(), '8,640');
  await page.locator('#truncate').check();
  assert.equal(await page.locator('#result-gross').textContent(), '8,000');
  assert.equal(await page.locator('#result-tax').textContent(), '593');
  assert.deepEqual(errors, []);
  console.log('PASS: real subpath, 320/390/1280px no overflow, max amounts, 44px buttons, discount/tax modes, validation, clear, install UI, cached offline reload and calculation, no page errors.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
