import { defineConfig } from 'vite';
import { cpSync, mkdirSync } from 'node:fs';
mkdirSync('public/pdf-assets', { recursive: true });
for (const folder of ['cmaps', 'standard_fonts']) cpSync(`node_modules/pdfjs-dist/${folder}`, `public/pdf-assets/${folder}`, { recursive: true });
export default defineConfig({
  base: './',
  plugins: [{
    name: 'development-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")
        .replace("connect-src 'self'", "connect-src 'self' ws://localhost:* ws://127.0.0.1:*");
    }
  }]
});
