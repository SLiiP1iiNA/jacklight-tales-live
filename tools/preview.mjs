// Local-only preview. No publishing commands or external dependencies.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mediaOrigin = 'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev';
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
http.createServer(async (req,res) => {
  try {
    const requestUrl = new URL(req.url, 'http://127.0.0.1');
    if (requestUrl.pathname.startsWith('/preview-media/')) {
      // Relay only this site's public audio host for local playback. Production
      // URLs stay unchanged on disk; never disable browser origin checks.
      const upstreamUrl = new URL(requestUrl.pathname.slice('/preview-media'.length) + requestUrl.search, mediaOrigin);
      if (upstreamUrl.origin !== mediaOrigin || !upstreamUrl.pathname.endsWith('.mp3')) {
        res.writeHead(403).end(); return;
      }
      const headers = req.headers.range ? {Range:req.headers.range} : {};
      const upstream = await fetch(upstreamUrl, {method:req.method==='HEAD'?'HEAD':'GET',headers,signal:AbortSignal.timeout(30000)});
      const body = req.method==='HEAD' ? null : Buffer.from(await upstream.arrayBuffer());
      const responseHeaders = {'Content-Type':upstream.headers.get('content-type') || 'audio/mpeg','Cache-Control':'no-cache'};
      for (const name of ['content-range','accept-ranges','content-length']) {
        if (upstream.headers.has(name)) responseHeaders[name] = upstream.headers.get(name);
      }
      res.writeHead(upstream.status,responseHeaders).end(body); return;
    }
    const pathname = decodeURIComponent(requestUrl.pathname);
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end('Not found'); return; }
    const type = types[path.extname(file)] || 'application/octet-stream';
    let body = fs.readFileSync(file);
    if (['.html','.js','.json'].includes(path.extname(file))) {
      body = Buffer.from(body.toString().replaceAll(mediaOrigin, '/preview-media'));
    }
    if (path.extname(file) === '.html') {
      // Keep local test visits out of production analytics.
      body = Buffer.from(body.toString().replace(/<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js"[^>]*><\/script>/g, ''));
    }
    res.writeHead(200, {'Content-Type':type,'Content-Length':body.length,'Cache-Control':'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(400).end('Bad request'); }
}).listen(8765, '127.0.0.1', () => console.log('Local test: http://127.0.0.1:8765'));
