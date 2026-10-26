import { expect, it } from 'vitest';
import { pageOffsets } from '../src/renderer/pages';
it('bounds layout work without losing text, emoji or line endings', () => {
  for (const text of ['', '短文', ('中文😀\r\n').repeat(50000), '長'.repeat(200000), 'a'.repeat(11999) + '😀尾']) {
    const offsets = pageOffsets(text);
    const pages = offsets.slice(0, -1).map((start, i) => text.slice(start, offsets[i + 1]));
    expect(pages.join('')).toBe(text);
    expect(pages.every(page => page.length <= 12000)).toBe(true);
    expect(pages.every(page => !/[\uD800-\uDBFF]$/.test(page))).toBe(true);
  }
});
