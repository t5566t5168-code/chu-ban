import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  plugins: [{
    name: 'development-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")
        .replace("connect-src 'none'", "connect-src 'self' ws://localhost:* ws://127.0.0.1:*");
    }
  }]
});
