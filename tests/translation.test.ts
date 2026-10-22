// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { mountTranslation, demoSource } from '../src/renderer/translation';
beforeEach(() => { document.documentElement.innerHTML = readFileSync('index.html', 'utf8'); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });
const button = (id: string) => document.getElementById(id) as HTMLButtonElement;
it('captures only reading selection and resets private text on document replacement', () => {
  const app = mountTranslation(document);
  const content = document.getElementById('reading-content')!;
  content.textContent = 'Hello world';
  const range = document.createRange(); range.selectNodeContents(content);
  document.getSelection()!.addRange(range); document.dispatchEvent(new Event('selectionchange'));
  expect((document.getElementById('translation-source') as HTMLTextAreaElement).value).toBe('Hello world');
  expect(document.getElementById('translation-panel')!.hidden).toBe(false);
  app.reset();
  expect((document.getElementById('translation-source') as HTMLTextAreaElement).value).toBe('');
  expect(document.getElementById('translation-panel')!.hidden).toBe(true);
});
it('labels preset translations and does not invent translations of arbitrary text', () => {
  mountTranslation(document);
  button('translation-example').click();
  expect((document.getElementById('translation-source') as HTMLTextAreaElement).value).toBe(demoSource);
  button('translate-run').click(); vi.runAllTimers();
  expect(document.getElementById('translation-result')!.textContent).toContain('示範譯文（預設資料）');
  const source = document.getElementById('translation-source') as HTMLTextAreaElement;
  source.value = 'arbitrary content'; source.dispatchEvent(new Event('input'));
  button('translate-run').click(); vi.runAllTimers();
  expect(document.getElementById('translation-result')!.textContent).toContain('未執行真實翻譯');
});
it('cancels pending output when the source or document changes', () => {
  const app = mountTranslation(document); button('translation-example').click(); button('translate-run').click(); app.reset(); vi.runAllTimers();
  expect(document.getElementById('translation-result')!.textContent).not.toContain('示範譯文');
  expect(button('translate-run').disabled).toBe(false);
});
