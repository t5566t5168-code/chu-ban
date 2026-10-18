const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
http.createServer((req, res) => {
  const files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'};
  const file = files[req.url.split('?')[0]];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8'})[path.extname(file)]);
  fs.createReadStream(path.join(root, file)).pipe(res);
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));
