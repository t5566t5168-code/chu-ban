// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
it('uses the browser picker even when the reader element is exposed as window.reader', async () => {
  document.documentElement.innerHTML = readFileSync('index.html', 'utf8');
  const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) { this.dispatchEvent(new Event('cancel')); });
  await import('../src/renderer/main');
  (document.querySelector('[data-open]') as HTMLButtonElement).click();
  await Promise.resolve(); await Promise.resolve();
  expect(click).toHaveBeenCalledOnce();
  expect(document.getElementById('status')!.textContent).toBe('');
  expect(document.querySelector('input[type=file]')).toBeNull();
  click.mockRestore();
});
