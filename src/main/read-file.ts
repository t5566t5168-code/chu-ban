import { open } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import type { OpenResult } from '../shared/reader';

export function decodeText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export async function readTextFile(filePath: string): Promise<OpenResult> {
  if (extname(filePath).toLowerCase() !== '.txt') return { status: 'error', code: 'unsupported-extension' };
  let file;
  try {
    file = await open(filePath, 'r');
    if (!(await file.stat()).isFile()) return { status: 'error', code: 'read-failed' };
    const bytes = await file.readFile();
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
