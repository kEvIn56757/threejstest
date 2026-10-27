// 零依赖静态开发服务器（默认端口 8889，避免与常见 8080 的 MCP 服务冲突）
// 用法：npm start            或用 PORT 覆盖：PORT=9000 npm start
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || process.argv[2] || 8889);
const HOST = process.env.HOST || '0.0.0.0';   // 0.0.0.0 便于容器/预览环境访问

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.fbx': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname);
  } catch {
    res.writeHead(400).end('Bad Request');
    return;
  }

  // 防目录穿越：解析后必须仍在 ROOT 之内
  let target = path.resolve(ROOT, '.' + pathname);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(target, (err, stat) => {
    if (!err && stat.isDirectory()) target = path.join(target, 'index.html');

    fs.readFile(target, (err2, buf) => {
      if (err2) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: ' + pathname);
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      res.end(buf);
    });
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`[serve] 端口 ${PORT} 已被占用。换端口：PORT=8890 npm start`);
    process.exit(1);
  }
  throw e;
});

server.listen(PORT, HOST, () => {
  console.log(`[serve] http://${HOST}:${PORT}/  (开发版 index.html)`);
  console.log(`[serve] http://${HOST}:${PORT}/cam.html  (单文件版)`);
  console.log('[serve] Ctrl+C 停止');
});
