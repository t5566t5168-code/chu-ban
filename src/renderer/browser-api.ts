import { MAX_FILE_BYTES, supportedExtensions, type ReaderAPI, type OpenResult } from '../shared/reader';
import { decodeTxt } from '../shared/decode-txt';

export async function readBrowserFile(file: File): Promise<OpenResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!supportedExtensions.includes(extension)) return { status: 'error', code: 'unsupported-extension' };
  if (file.size > MAX_FILE_BYTES) return { status: 'error', code: 'too-large' };
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (extension !== 'txt') return { status: 'binary', fileName: file.name, bytes };
    try { return { status: 'success', fileName: file.name, ...decodeTxt(bytes) }; }
    catch { return { status: 'error', code: 'invalid-utf8' }; }
  } catch { return { status: 'error', code: 'read-failed' }; }
}

export function createBrowserAPI(root: Document): ReaderAPI {
  return { openTextFile: () => new Promise(resolve => {
    const input = root.createElement('input');
    input.type = 'file'; input.accept = '.txt,.pdf,.epub'; input.hidden = true;
    root.body.append(input);
    const finish = (result: OpenResult) => { input.remove(); resolve(result); };
    input.addEventListener('cancel', () => finish({ status: 'cancelled' }), { once: true });
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) finish({ status: 'cancelled' });
      else void readBrowserFile(file).then(finish);
    }, { once: true });
    input.click();
  }) };
}
