import JSZip from 'jszip';
import type { FileError, OpenResult } from '../shared/reader';
const MAX_TEXT_BYTES = 20 * 1024 * 1024;
export class DocumentError extends Error {
  constructor(public code: FileError) { super(code); }
}
function xml(source: string): Document {
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  if (doc.querySelector('parsererror')) throw new DocumentError('invalid-document');
  return doc;
}
function resolveEntry(base: string, href: string): string {
  if (/^[a-z][a-z\d+.-]*:|^\/|\\/i.test(href)) throw new DocumentError('invalid-document');
  const path = [...base.split('/').slice(0, -1)];
  for (const part of decodeURIComponent(href.split('#')[0]).split('/')) {
    if (part === '..') { if (!path.length) throw new DocumentError('invalid-document'); path.pop(); }
    else if (part && part !== '.') path.push(part);
  }
  return path.join('/');
}
export async function readEpub(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  let expanded = 0;
  async function entry(path: string): Promise<string> {
    const file = zip.file(path);
    if (!file) throw new DocumentError('invalid-document');
    // Stop decompression once the total text budget is exceeded.
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      const stream = (file as unknown as { internalStream(type: string): {
        on(event: 'data', callback: (chunk: Uint8Array) => void): void;
        on(event: 'error', callback: (error: Error) => void): void;
        on(event: 'end', callback: () => void): void;
        pause(): void; resume(): void;
      } }).internalStream('uint8array');
      stream.on('data', chunk => {
        expanded += chunk.length;
        if (expanded > MAX_TEXT_BYTES) { stream.pause(); reject(new DocumentError('too-large')); }
        else chunks.push(chunk);
      });
      stream.on('error', reject);
      stream.on('end', () => {
        const joined = new Uint8Array(chunks.reduce((n, chunk) => n + chunk.length, 0));
        let offset = 0; for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.length; }
        try { resolve(new TextDecoder('utf-8', { fatal: true }).decode(joined)); }
        catch { reject(new DocumentError('invalid-document')); }
      });
      stream.resume();
    });
  }
  if ((await entry('mimetype')).trim() !== 'application/epub+zip') throw new DocumentError('invalid-document');
  const container = xml(await entry('META-INF/container.xml'));
  const packagePath = container.getElementsByTagNameNS('*', 'rootfile')[0]?.getAttribute('full-path');
  if (!packagePath) throw new DocumentError('invalid-document');
  const packageDoc = xml(await entry(resolveEntry('', packagePath)));
  const items = new Map([...packageDoc.getElementsByTagNameNS('*', 'item')].map(item => [item.getAttribute('id'), item]));
  const chapters: string[] = [];
  for (const ref of packageDoc.getElementsByTagNameNS('*', 'itemref')) {
    if (ref.getAttribute('linear') === 'no') continue;
    const item = items.get(ref.getAttribute('idref'));
    if (!item || item.getAttribute('media-type') !== 'application/xhtml+xml') throw new DocumentError('invalid-document');
    const path = resolveEntry(packagePath, item.getAttribute('href') || '');
    if (zip.file('META-INF/encryption.xml')) {
      const encrypted = xml(await entry('META-INF/encryption.xml'));
      if ([...encrypted.getElementsByTagNameNS('*', 'CipherReference')].some(node => node.getAttribute('URI') === path)) throw new DocumentError('protected-document');
    }
    const chapter = xml(await entry(path));
    chapter.querySelectorAll('script,style,iframe,object,svg,head').forEach(node => node.remove());
    chapter.querySelectorAll('br').forEach(node => node.replaceWith(chapter.createTextNode('\n')));
    chapter.querySelectorAll('p,div,h1,h2,h3,h4,h5,h6,li,blockquote,tr').forEach(node => node.append(chapter.createTextNode('\n\n')));
    const body = chapter.getElementsByTagNameNS('*', 'body')[0];
    chapters.push((body?.textContent || '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim());
  }
  const text = chapters.filter(Boolean).join('\n\n');
  if (!text) throw new DocumentError('no-text');
  return text;
}
async function readPdf(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const loading = pdfjs.getDocument({ data: bytes, useSystemFonts: true,
    cMapUrl: new URL('pdf-assets/cmaps/', document.baseURI).href, cMapPacked: true,
    standardFontDataUrl: new URL('pdf-assets/standard_fonts/', document.baseURI).href });
  try {
    const pdf = await loading.promise;
    if (pdf.numPages > 1000) throw new DocumentError('too-large');
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('').trim();
      pages.push(text ? `— 第 ${pageNumber} 頁 —\n\n${text}` : `— 第 ${pageNumber} 頁：沒有可擷取的文字 —`);
      page.cleanup();
    }
    if (pages.every(page => page.endsWith('沒有可擷取的文字 —'))) throw new DocumentError('no-text');
    return pages.join('\n\n');
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') throw new DocumentError('protected-document');
    throw error;
  } finally { await loading.destroy(); }
}
export async function parseDocument(result: Extract<OpenResult, { status: 'binary' }>): Promise<OpenResult> {
  try {
    const extension = result.fileName.split('.').pop()?.toLowerCase();
    const text = extension === 'pdf' ? await readPdf(result.bytes) : await readEpub(result.bytes);
    return { status: 'success', fileName: result.fileName, text };
  } catch (error) {
    return { status: 'error', code: error instanceof DocumentError ? error.code : 'invalid-document' };
  }
}
