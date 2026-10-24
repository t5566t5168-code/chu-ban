// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { mountTranslation } from '../src/renderer/translation';
beforeEach(() => { document.documentElement.innerHTML = readFileSync('index.html', 'utf8'); });
afterEach(() => vi.unstubAllGlobals());
const button = (id: string) => document.getElementById(id) as HTMLButtonElement;
const result = () => document.getElementById('translation-result')!.textContent;
const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
function mock(translate = vi.fn().mockResolvedValue('真正的譯文')) {
  const instance = { translate, destroy: vi.fn() };
  const create = vi.fn().mockResolvedValue(instance);
  vi.stubGlobal('Translator', { create });
  return { instance, create };
}
it('explains unsupported browsers without offering a fake translation', () => {
  vi.stubGlobal('Translator', undefined);
  mountTranslation(document);
  expect(button('translate-run').disabled).toBe(true);
  expect(result()).toContain('桌面 Chrome');
});
it('translates the captured text with explicit language codes and releases the model', async () => {
  const { instance, create } = mock();
  mountTranslation(document);
  button('translation-example').click(); button('translate-run').click();
  expect(create).toHaveBeenCalledWith(expect.objectContaining({ sourceLanguage: 'en', targetLanguage: 'zh-Hant' }));
  await settle();
  expect(instance.translate).toHaveBeenCalledWith(expect.stringContaining('Reading'));
  expect(result()).toBe('真正的譯文');
  expect(instance.destroy).toHaveBeenCalledOnce();
});
it('ignores stale translation after replacing the document', async () => {
  let resolve!: (value: string) => void;
  mock(vi.fn().mockImplementation(() => new Promise<string>(r => { resolve = r; })));
  const app = mountTranslation(document);
  button('translation-example').click(); button('translate-run').click(); await settle();
  app.reset(); resolve('stale'); await settle();
  expect(result()).not.toContain('stale');
  expect((document.getElementById('translation-source') as HTMLTextAreaElement).value).toBe('');
  expect(document.getElementById('translation-panel')!.hidden).toBe(true);
});
it('ignores download progress and destroys late-created models after source changes', async () => {
  const { instance, create } = mock();
  let resolve!: (value: typeof instance) => void;
  create.mockImplementation(() => new Promise(r => { resolve = r; }));
  mountTranslation(document); button('translation-example').click(); button('translate-run').click();
  let progress!: (event: { loaded: number }) => void;
  create.mock.calls[0][0].monitor({ addEventListener: (_: string, fn: typeof progress) => { progress = fn; } });
  progress({ loaded: 0.5 }); expect(result()).toContain('50%');
  document.getElementById('translation-source')!.dispatchEvent(new Event('input'));
  progress({ loaded: 0.8 }); resolve(instance); await settle();
  expect(result()).not.toContain('80%'); expect(instance.translate).not.toHaveBeenCalled();
  expect(instance.destroy).toHaveBeenCalledOnce();
});
it('shows failures and allows retry', async () => {
  const { create } = mock(); create.mockRejectedValueOnce(new DOMException('unsupported', 'NotSupportedError'));
  mountTranslation(document); button('translation-example').click(); button('translate-run').click(); await settle();
  expect(result()).toContain('這組語言'); expect(button('translate-run').disabled).toBe(false);
  button('translate-run').click(); await settle(); expect(result()).toBe('真正的譯文');
});
it('avoids model requests for empty, oversized or same-language input', () => {
  const { create } = mock(); mountTranslation(document); button('translate-run').click();
  const source = document.getElementById('translation-source') as HTMLTextAreaElement;
  source.value = 'a'.repeat(2001); button('translate-run').click(); expect(result()).toContain('2,000');
  source.value = '文字'; (document.getElementById('translation-language') as HTMLSelectElement).value = 'zh-Hans';
  // Use an available target option for the same-language case.
  (document.getElementById('translation-source-language') as HTMLSelectElement).value = 'en';
  (document.getElementById('translation-language') as HTMLSelectElement).value = 'en';
  button('translate-run').click(); expect(result()).toContain('無須翻譯'); expect(create).not.toHaveBeenCalled();
});
