// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { mountReader } from '../src/renderer/reader';
import type { OpenResult } from '../src/shared/reader';

const html = readFileSync('index.html', 'utf8');
beforeEach(() => { document.documentElement.innerHTML = html; });
const element = (id: string) => document.getElementById(id)!;
const success: OpenResult = { status: 'success', fileName: '小說.txt', text: '中文\nHello <img src=x onerror=alert(1)>' };
it('shows text safely and resets scroll only on successful replacement', async () => {
  const openTextFile = vi.fn<() => Promise<OpenResult>>().mockResolvedValue(success);
  const app = mountReader(document, { openTextFile });
  await app.openFile();
  expect(element('reading-content').textContent).toBe(success.text);
  expect(element('reading-content').children).toHaveLength(0);
  expect(element('welcome').hidden).toBe(true);
  element('viewport').scrollTop = 500;
  for (const result of [{ status: 'cancelled' }, { status: 'error', code: 'invalid-utf8' }] as OpenResult[]) {
    openTextFile.mockResolvedValueOnce(result);
    await app.openFile();
    expect(element('filename').textContent).toBe(success.fileName);
    expect(element('reading-content').textContent).toBe(success.text);
    expect(element('viewport').scrollTop).toBe(500);
  }
  await app.openFile();
  expect(element('viewport').scrollTop).toBe(0);
});
it.each(['', ' \r\n\t'])('replaces old document with an empty-file message for %j', async text => {
  const openTextFile = vi.fn<() => Promise<OpenResult>>().mockResolvedValueOnce(success).mockResolvedValueOnce({ status: 'success', fileName: 'empty.txt', text });
  const app = mountReader(document, { openTextFile });
  await app.openFile(); await app.openFile();
  expect(element('empty').hidden).toBe(false);
  expect(element('reading-content').hidden).toBe(true);
  expect(element('filename').textContent).toBe('empty.txt');
});
it('prevents duplicate requests and restores buttons after transport failure', async () => {
  let reject!: (reason: Error) => void;
  const openTextFile = vi.fn(() => new Promise<OpenResult>((_resolve, fail) => { reject = fail; }));
  const app = mountReader(document, { openTextFile });
  const pending = app.openFile();
  expect([...document.querySelectorAll<HTMLButtonElement>('[data-open]')].every(button => button.disabled)).toBe(true);
  await app.openFile();
  expect(openTextFile).toHaveBeenCalledTimes(1);
  reject(new Error('private path'));
  await pending;
  expect(element('status').textContent).toContain('無法讀取檔案');
  expect(element('status').textContent).not.toContain('private path');
  expect(element('welcome').hidden).toBe(false);
  expect([...document.querySelectorAll<HTMLButtonElement>('[data-open]')].every(button => !button.disabled)).toBe(true);
});
it('keeps the welcome view after cancellation', async () => {
  await mountReader(document, { openTextFile: async () => ({ status: 'cancelled' }) }).openFile();
  expect(element('welcome').hidden).toBe(false);
  expect(element('reader').hidden).toBe(true);
});
it('renders a bounded page and supports navigating and replacing a large book', async () => {
  const text = '甲'.repeat(12000) + '乙'.repeat(12000) + '末頁';
  const openTextFile = vi.fn<() => Promise<OpenResult>>().mockResolvedValueOnce({ status: 'success', fileName: 'large.txt', text }).mockResolvedValueOnce(success);
  const app = mountReader(document, { openTextFile }); await app.openFile();
  expect(element('reading-content').textContent).toBe('甲'.repeat(12000));
  (element('next-page') as HTMLButtonElement).click();
  expect(element('reading-content').textContent).toBe('乙'.repeat(12000));
  (element('page-number') as HTMLInputElement).value = '3';
  element('page-jump').dispatchEvent(new Event('submit', { cancelable: true }));
  expect(element('reading-content').textContent).toBe('末頁');
  expect((element('next-page') as HTMLButtonElement).disabled).toBe(true);
  await app.openFile(); expect(element('page-navigation').hidden).toBe(true);
  expect(element('reading-content').textContent).toBe(success.text);
});
