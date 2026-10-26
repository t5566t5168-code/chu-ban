// Bound layout work even for books with millions of characters or no line breaks.
export function pageOffsets(text: string, size = 12000): number[] {
  const offsets = [0];
  while (offsets[offsets.length - 1] + size < text.length) {
    const start = offsets[offsets.length - 1];
    let end = start + size;
    const newline = text.lastIndexOf('\n', end - 1);
    if (newline > start + size / 2) end = newline + 1;
    const previous = text.charCodeAt(end - 1);
    if (previous >= 0xd800 && previous <= 0xdbff) end--;
    if (text[end - 1] === '\r' && text[end] === '\n') end--;
    offsets.push(end);
  }
  offsets.push(text.length);
  return offsets;
}
