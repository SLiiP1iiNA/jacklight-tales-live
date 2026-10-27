// Run with: node tools/build-styles.mjs
// Keep editable styles modular; deliver one ordered stylesheet per page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function bundle(sources, outputDir, prefix, htmlFile, linkPattern) {
  const contents = sources.map(source => {
    const from = path.dirname(source);
    const css = fs.readFileSync(path.join(root, source), 'utf8');
    const rebased = css.replace(/url\(\s*(["']?)([^)"']+)\1\s*\)/g, (match, quote, url) => {
      if (/^(?:data:|https?:|\/|#)/.test(url)) return match;
      const resolved = path.posix.normalize(path.posix.join(from, url));
      return `url("${path.posix.relative(outputDir, resolved)}")`;
    });
    return `/* Source: ${source} */\n${rebased}`;
  }).join('\n');
  const hash = createHash('sha256').update(contents).digest('hex').slice(0, 10);
  const file = `${prefix}.${hash}.css`;
  const htmlPath = path.join(root, htmlFile);
  const htmlDir = path.posix.dirname(htmlFile);
  const href = path.posix.relative(htmlDir, path.posix.join(outputDir, file));
  let html = fs.readFileSync(htmlPath, 'utf8');
  let inserted = false;
  html = html.replace(linkPattern, () => {
    if (inserted) return '';
    inserted = true;
    return `<link rel="stylesheet" href="${href}">`;
  });
  if (!inserted) throw new Error(`No stylesheet link found in ${htmlFile}`);
  fs.writeFileSync(path.join(root, outputDir, file), contents);
  fs.writeFileSync(htmlPath, html.replace(/^[ \t]+$/gm, ''));
  console.log(`${sources.length} sources -> ${href} (${Buffer.byteLength(contents)} bytes)`);
}
const main = fs.readFileSync(path.join(root, 'css/main.css'), 'utf8');
const sources = [...main.matchAll(/@import url\("(.+?)"\);/g)].map(m => path.posix.normalize('css/' + m[1].split('?')[0]));
bundle(sources, 'css', 'site.bundle', 'index.html', /<link rel="stylesheet" href="css\/(?:main\.css[^"\s]*|site\.bundle\.[^"\s]+)">/g);
const gameDir = 'games/woodland-search';
bundle(['tokens','base','desktop','tablet','phone-portrait','phone-landscape','celebration'].map(n => `${gameDir}/${n}.css`), gameDir, 'game.bundle', `${gameDir}/index.html`, /<link rel="stylesheet" href="(?:tokens|base|desktop|tablet|phone-portrait|phone-landscape|celebration|game\.bundle\.[^".]+)\.css[^"\s]*">/g);
