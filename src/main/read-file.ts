import { open } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { MAX_FILE_BYTES, supportedExtensions, type OpenResult } from '../shared/reader';

export function decodeText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export async function readTextFile(filePath: string): Promise<OpenResult> {
  const extension = extname(filePath).slice(1).toLowerCase();
  if (!supportedExtensions.includes(extension)) return { status: 'error', code: 'unsupported-extension' };
  let file;
  try {
    file = await open(filePath, 'r');
    const stat = await file.stat();
    if (!stat.isFile()) return { status: 'error', code: 'read-failed' };
    if (stat.size > MAX_FILE_BYTES) return { status: 'error', code: 'too-large' };
    const bytes = await file.readFile();
    if (bytes.length > MAX_FILE_BYTES) return { status: 'error', code: 'too-large' };
    if (extension !== 'txt') return { status: 'binary', fileName: basename(filePath), bytes: new Uint8Array(bytes) };
    let text: string;
    try { text = decodeText(bytes); }
    catch { return { status: 'error', code: 'invalid-utf8' }; }
    return { status: 'success', fileName: basename(filePath), text };
  } catch {
    return { status: 'error', code: 'read-failed' };
  } finally {
    await file?.close().catch(() => undefined);
  }
}
