import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeText, readTextFile } from '../src/main/read-file';

let directory: string;
beforeAll(async () => { directory = await mkdtemp(join(tmpdir(), 'quiet-reader-')); });
afterAll(async () => { await rm(directory, { recursive: true, force: true }); });
describe('strict UTF-8 decoding', () => {
  it.each(['中文 English，標點！😀\n第二行', '空格  \t\r\n換行', '', ' \n\t'])('preserves original text %j', text => {
    expect(decodeText(Buffer.from(text))).toBe(text);
  });
  it('accepts and removes a UTF-8 BOM', () => {
    expect(decodeText(Buffer.from('\uFEFF中文'))).toBe('中文');
    expect(decodeText(Buffer.from('\uFEFF'))).toBe('');
  });
  it.each([[0xff], [0xc0, 0xaf], [0xe4, 0xb8], [0xed, 0xa0, 0x80]])('rejects invalid sequences %j', (...bytes) => {
    expect(() => decodeText(Uint8Array.from(bytes))).toThrow();
  });
});
describe('file validation', () => {
  it('accepts uppercase extension and exposes basename only', async () => {
    const path = join(directory, '小說.TXT');
    await writeFile(path, '\uFEFF第一章\r\nHello 😀');
    expect(await readTextFile(path)).toEqual({ status: 'success', fileName: '小說.TXT', text: '第一章\r\nHello 😀' });
  });
  it('rejects unsupported extension before reading', async () => {
    expect(await readTextFile(join(directory, 'book.docx'))).toEqual({ status: 'error', code: 'unsupported-extension' });
  });
  it('classifies missing files and directories as read failures', async () => {
    expect(await readTextFile(join(directory, 'missing.txt'))).toEqual({ status: 'error', code: 'read-failed' });
    const path = join(directory, 'folder.txt');
    await mkdir(path);
    expect(await readTextFile(path)).toEqual({ status: 'error', code: 'read-failed' });
  });
  it('classifies invalid UTF-8 without replacement characters', async () => {
    const path = join(directory, 'bad.txt');
    await writeFile(path, Buffer.from([0xff, 0xfe]));
    expect(await readTextFile(path)).toEqual({ status: 'error', code: 'invalid-utf8' });
  });
  it.each(['pdf', 'epub'])('passes %s bytes to the renderer without decoding', async extension => {
    const path = join(directory, `book.${extension}`);
    await writeFile(path, Uint8Array.from([0, 255, 128, 1]));
    expect(await readTextFile(path)).toEqual({ status: 'binary', fileName: `book.${extension}`, bytes: Uint8Array.from([0, 255, 128, 1]) });
  });
});
