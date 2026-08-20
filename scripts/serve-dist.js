const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve('dist');
const port = Number(process.env.HOUSORA_DIST_PORT || 8090);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const candidates = [relative, `${relative}.html`, path.join(relative, 'index.html')];
  const target = candidates.map(candidate => path.resolve(root, candidate)).find(candidate => candidate.startsWith(root + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!target) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'content-type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`Housora dist at http://127.0.0.1:${port}`));
