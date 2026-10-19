// Tests the packaged application. Only the picker result is stubbed; preload,
// IPC, file validation/decoding and Chromium rendering are the production code.
const { _electron: electron, expect } = require('@playwright/test');
const { mkdir, writeFile, readFile, stat } = require('node:fs/promises');
const { resolve, basename } = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');

(async () => {
  const output = resolve('test-results');
  await mkdir(output, { recursive: true });
  const small = resolve(output, '中文.TXT');
  const empty = resolve(output, 'empty.txt');
  const invalid = resolve(output, 'invalid.txt');
  const large = resolve(output, 'large.txt');
  const longLine = resolve(output, 'long-line.txt');
  const text = '第一章：留白\r\n中文 English 😀\n<img src=x onerror=alert(1)>\n' + '午後的光落在書頁上。\n'.repeat(150);
  await writeFile(small, '\uFEFF' + text);
  await writeFile(empty, '\uFEFF \r\n\t');
  await writeFile(invalid, Buffer.from([0xff]));
  await writeFile(large, '第一章：山裡的光\n清晨，窗外的霧慢慢散去。他打開書頁，讀著那些未說完的故事。\n\n'.repeat(100000));
  await writeFile(longLine, '長'.repeat(20000));
  const report = { date: new Date().toISOString(), machine: { os: os.release(), cpu: os.cpus()[0].model, logicalCPUs: os.cpus().length, ramGB: Math.round(os.totalmem() / 2 ** 30) }, files: [], errors: [], network: [] };
  const executablePath = resolve('out/Quiet Reader-win32-x64/QuietReader.exe');
  let app;
  try {
    app = await electron.launch({ executablePath, args: [], timeout: 30000 });
    const page = await app.firstWindow();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) report.network.push(request.url()); });
    await expect(page.locator('#welcome')).toBeVisible();
    await page.screenshot({ path: resolve(output, 'welcome.png') });
    assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
    assert.deepEqual(await page.evaluate(() => Object.keys(window.reader)), ['openTextFile']);
    const prefs = await app.evaluate(({ BrowserWindow }) => {
      const p = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
      return { nodeIntegration: p.nodeIntegration, contextIsolation: p.contextIsolation, sandbox: p.sandbox };
    });
    assert.deepEqual(prefs, { nodeIntegration: false, contextIsolation: true, sandbox: true });
    // The packaged app must work without network access.
    await page.context().setOffline(true);
    async function select(path) {
      await app.evaluate(({ dialog }, filePath) => {
        dialog.showOpenDialog = async () => ({ canceled: filePath === null, filePaths: filePath ? [filePath] : [] });
      }, path);
      await page.locator('[data-open]').first().click();
      await expect(page.locator('[data-open]').first()).toBeEnabled({ timeout: 60000 });
    }
    await select(small);
    await expect(page.locator('#filename')).toHaveText(basename(small));
    assert.equal(await page.locator('#reading-content').textContent(), text);
    assert.equal(await page.locator('#reading-content img').count(), 0);
    await page.screenshot({ path: resolve(output, 'reading.png') });
    await page.locator('#viewport').evaluate(el => { el.scrollTop = 700; });
    const scroll = await page.locator('#viewport').evaluate(el => el.scrollTop);
    for (const path of [null, invalid, resolve(output, 'missing.txt'), resolve(output, 'bad.pdf')]) {
      await select(path);
      assert.equal(await page.locator('#reading-content').textContent(), text);
      assert.equal(await page.locator('#viewport').evaluate(el => el.scrollTop), scroll);
    }
    await select(empty);
    await expect(page.locator('#empty')).toBeVisible();
    assert.equal(await page.locator('#viewport').evaluate(el => el.scrollTop), 0);
    await select(longLine);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(480, 650));
    await page.locator('#viewport').evaluate(el => { if (el.scrollWidth > el.clientWidth) throw Error('Horizontal overflow'); });
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1.5));
    await page.locator('#viewport').evaluate(el => { if (el.scrollWidth > el.clientWidth) throw Error('Zoom overflow'); });
    await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; w.webContents.setZoomFactor(1); w.setSize(1120, 820); });
    for (const file of [resolve(output, 'war-and-peace.txt'), large]) {
      try { await stat(file); } catch { continue; }
      const started = performance.now();
      await select(file);
      await expect(page.locator('#filename')).toHaveText(basename(file));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const openMs = Math.round(performance.now() - started);
      const frames = await page.evaluate(async () => {
        const el = document.querySelector('#viewport');
        const durations = [];
        let last = performance.now();
        for (let index = 0; index < 120; index++) {
          el.scrollTop += 160;
          await new Promise(requestAnimationFrame);
          const now = performance.now(); durations.push(now - last); last = now;
        }
        return { maxFrameMs: Math.round(Math.max(...durations)), meanFrameMs: Math.round(durations.reduce((a, b) => a + b) / durations.length), scrollTop: el.scrollTop };
      });
      const bytes = await readFile(file);
      report.files.push({ file: basename(file), bytes: bytes.length, characters: [...bytes.toString('utf8')].length, openMs, ...frames });
      console.log(JSON.stringify(report.files.at(-1)));
    }
    await select(small);
    await expect(page.locator('#filename')).toHaveText(basename(small));
    await app.close(); app = null;
    app = await electron.launch({ executablePath, args: [] });
    const restarted = await app.firstWindow();
    await expect(restarted.locator('#welcome')).toBeVisible();
    await expect(restarted.locator('#reading-content')).toBeEmpty();
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.network, []);
    report.passed = true;
  } finally {
    await app?.close();
    await writeFile(resolve(output, 'desktop-report.json'), JSON.stringify(report, null, 2));
  }
  console.log('Packaged desktop smoke tests passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
