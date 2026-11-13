// Local-only preview. No publishing commands or external dependencies.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mediaOrigin = 'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev';
// This showcase exists only in responses from this local server. Public HTML,
// navigation and the GitHub Pages exclusion remain unchanged.
const christmasAssets = 'games/Christmas-Colouring-Village/assets/placeholders/';
const adventureStyles = `<style id="local-adventure-styles">
.local-adventures{max-width:1200px;margin:0 auto;padding:clamp(1.25rem,4vw,3.5rem);color:#f8f1d9}
.local-adventures__heading{max-width:46rem;margin-bottom:1.6rem}
.local-adventures__heading h2{font:900 clamp(1.9rem,4vw,3.2rem)/1.08 var(--display);letter-spacing:-.04em;color:#fff1c8;margin:.4rem 0 .8rem}
.local-adventures__heading>p:last-child{color:#cdcdbd;line-height:1.6;max-width:40rem}
.local-adventures__notice{display:inline-block;font:700 .72rem/1.4 var(--display);color:#dcc79b;border:1px solid #776948;border-radius:99px;padding:.3rem .65rem;margin-bottom:1rem}
.local-adventures__grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:1.3rem;align-items:stretch}
.local-adventure{min-width:0;overflow:hidden;border:1px solid #786945;border-radius:1.3rem;background:#10271f;display:flex;flex-direction:column;box-shadow:0 16px 40px #0003}
.local-adventure--christmas{background:linear-gradient(155deg,#183b37,#10251f);border-color:#ab8d55}
.local-adventure__picture{display:block;position:relative;overflow:hidden;height:clamp(180px,22vw,280px);background:#142a25}
.local-adventure__picture picture,.local-adventure__picture img{display:block;width:100%;height:100%}
.local-adventure__picture img{object-fit:cover}
.local-adventure__picture::after{content:'';position:absolute;inset:55% 0 0;background:linear-gradient(transparent,#10271f88);pointer-events:none}
.local-adventure__badge{position:absolute;z-index:1;top:.85rem;left:.85rem;border:1px solid #d7bd7f88;border-radius:99px;padding:.45rem .7rem;background:#10271feF;color:#ffe3a3;font:800 .7rem/1 var(--display);letter-spacing:.04em}
.local-adventure__copy{display:flex;flex-direction:column;flex:1;padding:clamp(1.15rem,2.6vw,2rem)}
.local-adventure__copy .eyebrow{color:#e5c784;margin:0 0 .65rem;font-size:.7rem}
.local-adventure h3{font:900 clamp(1.55rem,2.5vw,2.25rem)/1.1 var(--display);letter-spacing:-.035em;color:#fff1d1;margin:0 0 .9rem}
.local-adventure__description{color:#dedfcf;font:500 .95rem/1.65 var(--display);margin:0 0 1.2rem}
.local-adventure__actions{margin-top:auto;display:grid;justify-items:start;gap:.8rem}
.local-adventure__actions .story-button{min-height:48px;text-decoration:none;max-width:100%;text-align:center}
.local-adventure__actions .story-button--sun{color:#203222}
.local-adventure__actions .story-button:not(.story-button--sun){color:#ffe3a3;border:1px solid #a98d56;background:#18342a}
.local-adventure__note{color:#b7c6b5;font:600 .75rem/1.5 var(--display)}
.local-adventure a:focus-visible{outline:3px solid #fff0b7;outline-offset:4px}
#panel-content>.local-adventures{padding:clamp(.5rem,2vw,1.5rem)}
@media(max-width:720px){.local-adventures__grid{grid-template-columns:1fr}.local-adventure__picture{height:auto;aspect-ratio:1.55}.local-adventure--christmas .local-adventure__picture img{object-position:50% 42%}.local-adventure__actions,.local-adventure__actions .story-button{width:100%}.local-adventure h3{font-size:1.8rem}.local-adventures{padding:1.2rem}.local-adventures__heading h2{font-size:2rem}}
</style>`;
function adventureShowcase(titleId) {
  return `<section class="local-adventures" aria-labelledby="${titleId}">
    <div class="local-adventures__heading">
      <span class="local-adventures__notice">Local preview · Christmas is still in development</span>
      <p class="eyebrow">Wander through the games</p>
      <h2 id="${titleId}">Choose your woodland adventure.</h2>
      <p>A little Christmas colour. A familiar woodland path. Come and spend a gentle moment with Barnaby.</p>
    </div>
    <div class="local-adventures__grid">
      <article class="local-adventure local-adventure--christmas">
        <div class="local-adventure__picture">
          <picture><source media="(max-width:720px)" srcset="${christmasAssets}Christmas_Village_Background_Portrait.webp"><img src="${christmasAssets}Christmas_Village_Background.webp" width="1600" height="972" alt="Snowy market stalls and warm lantern windows on the path to the village Christmas tree" loading="lazy" decoding="async"></picture>
          <span class="local-adventure__badge">A Christmas Made by You</span>
        </div>
        <div class="local-adventure__copy">
          <p class="eyebrow">Our Christmas adventure · colour &amp; explore</p>
          <h3>Barnaby’s Christmas<br>Colouring Village</h3>
          <p class="local-adventure__description">Step into the snowy Whispering Woods. Visit Alder’s workshop and bring your own colours to a little Christmas lantern.</p>
          <div class="local-adventure__actions">
            <a class="story-button story-button--sun" href="games/Christmas-Colouring-Village/" data-game-launch>Explore the Christmas preview <span aria-hidden="true">→</span></a>
            <span class="local-adventure__note">Ages 3–8 · Local prototype for testing</span>
          </div>
        </div>
      </article>
      <article class="local-adventure">
        <div class="local-adventure__picture">
          <img src="games/woodland-search/assets/evergreen/09-the-winding-woodland-path.webp" alt="The sunlit forest path in Woodland Search" loading="lazy" decoding="async" width="1600" height="900">
          <span class="local-adventure__badge">Always here to play</span>
        </div>
        <div class="local-adventure__copy">
          <p class="eyebrow">A woodland favourite · search &amp; discover</p>
          <h3>Woodland Search</h3>
          <p class="local-adventure__description">Find Barnaby and his friends across ten cosy woodland places, with Heart Seeds, little secrets and gentle hints along the way.</p>
          <div class="local-adventure__actions">
            <a class="story-button" href="games/woodland-search/index.html" data-game-launch>Play Woodland Search <span aria-hidden="true">→</span></a>
            <span class="local-adventure__note">10 friends · 10 places · gentle hints</span>
          </div>
        </div>
      </article>
    </div>
  </section>`;
}
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
      if (file === path.join(root, 'index.html')) {
        body = Buffer.from(body.toString()
          .replace('</head>', adventureStyles + '\n</head>')
          .replace(/<section class="games-path"[\s\S]*?<\/section>/, adventureShowcase('games-path-title')));
      } else if (file === path.join(root, 'partials', 'games.html')) {
        body = Buffer.from(adventureShowcase('panel-title'));
      }
      // Keep local test visits out of production analytics.
      body = Buffer.from(body.toString().replace(/<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js"[^>]*><\/script>/g, ''));
    }
    res.writeHead(200, {'Content-Type':type,'Content-Length':body.length,'Cache-Control':'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(400).end('Bad request'); }
}).listen(8765, process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1', () => console.log('Local test: http://127.0.0.1:8765' + (process.argv.includes('--lan') ? ' (phone testing enabled on the local network)' : '')));
