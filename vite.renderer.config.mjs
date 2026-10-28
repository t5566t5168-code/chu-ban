import { defineConfig } from 'vite';
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
mkdirSync('public/pdf-assets', { recursive: true });
for (const folder of ['cmaps', 'standard_fonts']) cpSync(`node_modules/pdfjs-dist/${folder}`, `public/pdf-assets/${folder}`, { recursive: true });
mkdirSync('public/translation-runtime', { recursive: true });
for (const file of readdirSync('node_modules/onnxruntime-web/dist').filter(file => /^ort-wasm.*\.(wasm|mjs)$/.test(file))) {
  cpSync(`node_modules/onnxruntime-web/dist/${file}`, `public/translation-runtime/${file}`);
}
cpSync('node_modules/@wllama/wllama/esm/wasm/wllama.wasm', 'public/translation-runtime/wllama.wasm');
export default defineConfig({
  base: './',
  worker: { format: 'es' },
  plugins: [{
    name: 'development-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")
        .replace("connect-src 'self'", "connect-src 'self' ws://localhost:* ws://127.0.0.1:*");
    }
  }]
});
