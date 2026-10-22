import { expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { decodeTxt } from '../src/shared/decode-txt';
import { readBrowserFile } from '../src/renderer/browser-api';
it('prefers UTF-8 and preserves line breaks', () => {
  expect(decodeTxt(Buffer.from('\uFEFF中文\r\nHello 😀'))).toEqual({ text: '中文\r\nHello 😀', encoding: 'UTF-8' });
});
it('supports GBK in the browser file path', async () => {
  const bytes = Uint8Array.from([0xd6, 0xd0, 0xce, 0xc4, 13, 10, 65]);
  const file = { name: 'sample.txt', size: bytes.length, arrayBuffer: async () => bytes.buffer } as File;
  expect(await readBrowserFile(file)).toEqual({ status: 'success', fileName: 'sample.txt', text: '中文\r\nA', encoding: 'GB18030 / GBK' });
});
it.each([[255], [255,254,65,0], [0], [239,187,191,255]])('rejects corrupt or unsupported input %j', (...bytes) => {
  expect(() => decodeTxt(Uint8Array.from(bytes))).toThrow();
});
const original = process.env.QUIET_READER_TEST_BOOK;
it.skipIf(!original || !existsSync(original))('reads the entire user book without replacement characters', () => {
  const decoded = decodeTxt(readFileSync(original!));
  expect(decoded.encoding).toBe('GB18030 / GBK');
  expect(decoded.text).not.toContain('\uFFFD');
  expect(decoded.text).toBe(new TextDecoder('utf-8', { fatal: true }).decode(readFileSync('converted/凡人修仙传.UTF-8.txt')));
});
