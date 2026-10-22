// @vitest-environment jsdom
import { expect, it } from 'vitest';
import JSZip from 'jszip';
import { readEpub, parseDocument } from '../src/renderer/documents';
import { readBrowserFile } from '../src/renderer/browser-api';

async function epub(second = true) {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip');
  zip.file('META-INF/container.xml', '<container><rootfiles><rootfile full-path="BOOK/book.opf"/></rootfiles></container>');
  zip.file('BOOK/book.opf', '<package><manifest><item id="b" href="part/b.xhtml" media-type="application/xhtml+xml"/><item id="a" href="part/a.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="a"/><itemref idref="b"/></spine></package>');
  zip.file('BOOK/part/a.xhtml', '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>hidden</title></head><body><h1>第一章</h1><p>Hello<br/>世界</p><script>alert(1)</script><img src="https://example.com/tracker"/></body></html>');
  if (second) zip.file('BOOK/part/b.xhtml', '<html><body><p>第二章</p></body></html>');
  return zip.generateAsync({ type: 'uint8array' });
}
it('reads EPUB in spine order and discards executable markup', async () => {
  const text = await readEpub(await epub());
  expect(text.indexOf('第一章')).toBeLessThan(text.indexOf('第二章'));
  expect(text).toContain('Hello\n世界');
  expect(text).not.toMatch(/script|alert|https|hidden/);
});
it('does not silently accept a missing EPUB chapter', async () => {
  expect(await parseDocument({ status: 'binary', fileName: 'bad.epub', bytes: await epub(false) })).toEqual({ status: 'error', code: 'invalid-document' });
});
it('rejects a corrupt archive without replacing the current document', async () => {
  expect(await parseDocument({ status: 'binary', fileName: 'bad.epub', bytes: new Uint8Array([1, 2]) })).toEqual({ status: 'error', code: 'invalid-document' });
});
it('browser reader validates extension, encoding and file size', async () => {
  const file = (name: string, data: number[], size = data.length) => ({ name, size, arrayBuffer: async () => Uint8Array.from(data).buffer } as File);
  expect(await readBrowserFile(file('bad.docx', []))).toEqual({ status: 'error', code: 'unsupported-extension' });
  expect(await readBrowserFile(file('bad.txt', [255]))).toEqual({ status: 'error', code: 'invalid-utf8' });
  expect(await readBrowserFile(file('huge.pdf', [], 51 * 1024 * 1024))).toEqual({ status: 'error', code: 'too-large' });
  expect((await readBrowserFile(file('book.PDF', [37, 80, 68, 70]))).status).toBe('binary');
});
