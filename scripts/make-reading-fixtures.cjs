// Synthetic documents only; no personal files are used in browser checks.
const fs = require('node:fs');
const JSZip = require('jszip');
const dir = 'test-results/formats';
fs.mkdirSync(dir, { recursive: true });
const text = 'Reading gives us a place to go when we have to stay where we are.';
fs.writeFileSync(`${dir}/sample.txt`, `${text}\n\n中文閱讀測試。\n\n${'安靜地閱讀，讓文字陪伴每一天。\n'.repeat(80)}`);
function pdf(content) {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let output = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(output)); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const start = Buffer.byteLength(output);
  output += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return output;
}
fs.writeFileSync(`${dir}/sample.pdf`, pdf(`BT /F1 12 Tf 50 700 Td (${text}) Tj ET`));
fs.writeFileSync(`${dir}/no-text.pdf`, pdf(''));
fs.writeFileSync(`${dir}/broken.pdf`, 'broken');
fs.writeFileSync(`${dir}/empty.txt`, '');
(async () => {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip');
  zip.file('META-INF/container.xml', '<container><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>');
  zip.file('OPS/book.opf', '<package><manifest><item id="one" href="one.xhtml" media-type="application/xhtml+xml"/><item id="two" href="two.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="one"/><itemref idref="two"/></spine></package>');
  zip.file('OPS/one.xhtml', `<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>閱讀的片刻</h1><p>${text}</p><p>這是 EPUB 的第一段。</p></body></html>`);
  zip.file('OPS/two.xhtml', '<html xmlns="http://www.w3.org/1999/xhtml"><body><h2>第二段</h2><p>依照書籍的閱讀順序顯示。</p></body></html>');
  fs.writeFileSync(`${dir}/sample.epub`, await zip.generateAsync({ type: 'nodebuffer' }));
})();
