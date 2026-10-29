// 零依赖静态开发服务器（默认端口 8889，避免与常见 8080 的 MCP 服务冲突）
// 用法：npm start            或用 PORT 覆盖：PORT=9000 npm start
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { createModelStore } = require('./project-model-store');

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

function createServer({ root = ROOT, modelRoot = path.join(root, 'assets', 'imported-models') } = {}) {
  const store = createModelStore(modelRoot);
  const json = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  return http.createServer(async (req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname);
  } catch {
    res.writeHead(400).end('Bad Request');
    return;
  }

  if (pathname === '/api/project-models' || pathname.startsWith('/api/project-models/')) {
    try {
      if (req.method === 'GET') {
        if (pathname === '/api/project-models') json(res, 200, { models: await store.list() });
        else json(res, 200, await store.read(pathname.slice('/api/project-models/'.length)));
        return;
      }
      if (req.method !== 'POST' || pathname !== '/api/project-models') {
        json(res, 405, { error: '不支持此操作' }); return;
      }
      // A local project writer is available only to this app on loopback.
      // No CORS permission is granted to unrelated websites or LAN clients.
      const address = req.socket.remoteAddress || '';
      const local = address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
      const host = req.headers.host || '';
      if (!local || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host) ||
        (req.headers.origin && req.headers.origin !== 'http://' + host)) {
        json(res, 403, { error: '只能从本机项目页面保存模型' }); return;
      }
      if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
        json(res, 415, { error: '请使用 JSON 保存模型' }); return;
      }
      const chunks = [];
      let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 128 * 1024 * 1024) {
          json(res, 413, { error: '模型数据超过 128 MB，暂时无法保存' }); return;
        }
        chunks.push(chunk);
      }
      let input;
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { json(res, 400, { error: '保存数据不是有效的 JSON' }); return; }
      const model = await store.save(input);
      json(res, input.id ? 200 : 201, { model });
    } catch (err) {
      if (!err.status) console.error('[models]', err);
      json(res, err.status || 500, { error: err.status ? err.message : '保存或读取失败，请检查项目目录是否可写' });
    }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end('Method Not Allowed'); return;
  }

  // 防目录穿越：解析后必须仍在 ROOT 之内
  let target = path.resolve(root, '.' + pathname);
  if (target !== root && !target.startsWith(root + path.sep)) {
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
}

if (require.main === module) {
const server = createServer();
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
}

module.exports = { createServer };
