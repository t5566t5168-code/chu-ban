/** Prefer UTF-8; older simplified-Chinese novels commonly use GBK/GB18030. */
export function decodeTxt(bytes: Uint8Array): { text: string; encoding: string } {
  // Do not misinterpret UTF-16 BOMs or binary NULs as a legacy text encoding.
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff) || bytes.includes(0)) throw new Error('Unsupported text encoding');
  try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), encoding: 'UTF-8' }; }
  catch {
    // A declared UTF-8 BOM must not silently fall back after corruption.
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) throw new Error('Invalid UTF-8');
    return { text: new TextDecoder('gb18030', { fatal: true }).decode(bytes), encoding: 'GB18030 / GBK' };
  }
}
