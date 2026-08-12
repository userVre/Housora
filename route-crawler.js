const fs = require('fs');
const http = require('http');
const path = require('path');
const { siteOrigin } = require('./scripts/test-config');

const ROOT = __dirname;
const LOCAL_ORIGIN = siteOrigin();
const DIST_DIR = path.resolve(process.env.DIST_DIR || path.join(ROOT, 'dist'));
const UNKNOWN_PATH = '/__housora_route_crawler_missing__';
const UNKNOWN_BLOG = '/blog/__housora_missing_article__';

function request(origin, requestPath, followRedirects = false, redirectChain = []) {
  return new Promise((resolve, reject) => {
    const url = new URL(requestPath, origin);
    const req = http.get(url, response => {
      const status = response.statusCode || 0;
      const location = response.headers.location;
      if (status >= 300 && status < 400 && location) {
        response.resume();
        const next = new URL(location, url);
        const nextPath = next.pathname + next.search + next.hash;
        const redirect = { status, from: url.pathname + url.search, to: nextPath };
        if (!followRedirects) {
          resolve({ status, body: '', location: nextPath, finalUrl: url.href, redirects: [...redirectChain, redirect] });
          return;
        }
        if (redirectChain.length >= 8) {
          reject(new Error(`Too many redirects from ${requestPath}`));
          return;
        }
        if (next.origin !== new URL(origin).origin) {
          reject(new Error(`Cross-origin redirect from ${url.href} to ${next.href}`));
          return;
        }
        request(origin, nextPath, true, [...redirectChain, redirect]).then(result => {
          // Browsers retain the original fragment when Location has none.
          if (!next.hash && url.hash && result.finalUrl) {
            const final = new URL(result.finalUrl);
            final.hash = url.hash;
            result.finalUrl = final.href;
          }
          resolve(result);
        }, reject);
        return;
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        status,
        body: Buffer.concat(chunks).toString('utf8'),
        finalUrl: url.href,
        redirects: redirectChain,
        contentType: response.headers['content-type'] || ''
      }));
    });
    req.setTimeout(15000, () => req.destroy(new Error(`Timed out fetching ${url.href}`)));
    req.on('error', reject);
  });
}

function parseRedirects() {
  const file = path.join(DIST_DIR, '_redirects');
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
  const redirects = new Map();
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const [from, to, statusText] = line.split(/\s+/);
    redirects.set(from, { target: to, status: Number(statusText) });
  }
  return redirects;
}

function staticFileFor(pathname) {
  if (pathname === '/') return path.join(DIST_DIR, 'index.html');
  const direct = path.join(DIST_DIR, pathname.replace(/^\//, ''));
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  const html = direct + '.html';
  if (fs.existsSync(html) && fs.statSync(html).isFile()) return html;
  return null;
}

function contentType(file) {
  const extension = path.extname(file).toLowerCase();
  return ({
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
    '.woff': 'font/woff', '.woff2': 'font/woff2'
  })[extension] || 'application/octet-stream';
}

function startStaticServer(redirects) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://static.test');
      const redirect = redirects.get(url.pathname);
      if (redirect) {
        const separator = redirect.target.includes('?') ? '&' : '?';
        const location = redirect.target + (url.search ? separator + url.search.slice(1) : '');
        res.writeHead(redirect.status, { Location: location });
        res.end();
        return;
      }
      const file = staticFileFor(url.pathname);
      if (file && path.resolve(file).startsWith(DIST_DIR + path.sep)) {
        res.writeHead(200, { 'Content-Type': contentType(file) });
        fs.createReadStream(file).pipe(res);
        return;
      }
      const notFound = path.join(DIST_DIR, '404.html');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      if (fs.existsSync(notFound)) fs.createReadStream(notFound).pipe(res);
      else res.end('Not found');
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

function htmlAttributes(html) {
  const values = [];
  const regex = /\b(href|src)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html))) values.push({ attribute: match[1].toLowerCase(), value: decodeHtml(match[2]) });
  return values;
}

function decodeHtml(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');
}

function hasAnchor(html, fragment) {
  const decoded = decodeURIComponent(fragment);
  const escaped = decoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b(?:id|name)\\s*=\\s*["']${escaped}["']`, 'i').test(html);
}

function isFocusableAnchor(html, fragment) {
  const decoded = decodeURIComponent(fragment);
  const tags = html.match(/<[^>]+>/g) || [];
  return tags.some(tag => {
    const id = tag.match(/\b(?:id|name)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (id !== decoded) return false;
    return /\btabindex\s*=\s*["']-?\d+["']/i.test(tag) || /^<(?:a|button|input|select|textarea)\b/i.test(tag);
  });
}

function expectedStatus(route) {
  if (route.behavior === 'page' || route.behavior === 'asset') return 200;
  if (route.behavior === 'redirect') return 301;
  return 404;
}

function outputPath(route) {
  if (route.path === '/') return path.join(DIST_DIR, 'index.html');
  if (route.behavior === 'asset') return path.join(DIST_DIR, route.path.replace(/^\//, ''));
  return path.join(DIST_DIR, route.path.replace(/^\//, '') + '.html');
}

async function verifyRouteTable(label, origin, manifest, failures) {
  let checks = 0;
  for (const route of manifest.routes) {
    const response = await request(origin, route.path);
    const expected = expectedStatus(route);
    checks++;
    if (response.status !== expected) {
      failures.push(`${label} ${route.path}: expected HTTP ${expected}, got ${response.status}`);
      continue;
    }
    if (route.behavior === 'redirect') {
      const destination = new URL(response.location, origin);
      if (destination.pathname !== route.target) {
        failures.push(`${label} ${route.path}: expected redirect to ${route.target}, got ${response.location}`);
      }
    }
  }
  return checks;
}

async function verifyLinksAndAssets(label, origin, manifest, failures) {
  const pages = manifest.routes.filter(route => route.behavior === 'page');
  const htmlByPath = new Map();
  const linkChecks = new Set();
  const assetChecks = new Set();
  for (const pageRoute of pages) {
    const response = await request(origin, pageRoute.path, true);
    if (response.status !== 200) continue;
    htmlByPath.set(pageRoute.path, response.body);
    for (const item of htmlAttributes(response.body)) {
      if (!item.value || item.value === '#' || /^(?:mailto:|tel:|javascript:|data:)/i.test(item.value)) continue;
      let resolved;
      try { resolved = new URL(item.value, new URL(pageRoute.path, origin)); } catch (_) { continue; }
      if (resolved.origin !== new URL(origin).origin) continue;
      if (item.attribute === 'src' || /\.(?:css|js|png|jpe?g|webp|gif|svg|woff2?)(?:$|\?)/i.test(resolved.pathname)) {
        assetChecks.add(resolved.pathname + resolved.search);
      } else {
        linkChecks.add(resolved.pathname + resolved.search + resolved.hash);
      }
    }
  }

  for (const target of linkChecks) {
    const response = await request(origin, target, true);
    if (response.status !== 200) {
      failures.push(`${label} internal link ${target}: ended at HTTP ${response.status}`);
      continue;
    }
    const final = new URL(response.finalUrl);
    if (final.hash) {
      const finalPath = final.pathname;
      const html = htmlByPath.get(finalPath) || response.body;
      if (!hasAnchor(html, final.hash.slice(1))) {
        failures.push(`${label} fragment ${target}: #${final.hash.slice(1)} does not exist on ${finalPath}`);
      }
      if (['editor', 'first-design', 'designStudio'].includes(decodeURIComponent(final.hash.slice(1))) &&
          !isFocusableAnchor(html, final.hash.slice(1))) {
        failures.push(`${label} primary fragment ${target}: destination is not focusable`);
      }
    }
  }
  for (const target of assetChecks) {
    const response = await request(origin, target, true);
    if (response.status !== 200) failures.push(`${label} asset ${target}: HTTP ${response.status}`);
  }
  return { links: linkChecks.size, assets: assetChecks.size };
}

function walkFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

async function verifyCssAssets(staticOrigin, failures) {
  const checks = new Set();
  const staticRoot = path.join(DIST_DIR, 'static');
  for (const file of walkFiles(staticRoot).filter(file => file.endsWith('.css'))) {
    const publicPath = '/' + path.relative(DIST_DIR, file).split(path.sep).join('/');
    const css = fs.readFileSync(file, 'utf8');
    const regex = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
    let match;
    while ((match = regex.exec(css))) {
      if (/^(?:data:|https?:|\/\/)/i.test(match[1])) continue;
      checks.add(new URL(match[1], new URL(publicPath, staticOrigin)).pathname);
    }
  }
  for (const target of checks) {
    const response = await request(staticOrigin, target, true);
    if (response.status !== 200) failures.push(`static CSS asset ${target}: HTTP ${response.status}`);
  }
  return checks.size;
}

async function main() {
  const failures = [];
  const manifestResponse = await request(LOCAL_ORIGIN, '/route-manifest.json');
  if (manifestResponse.status !== 200) throw new Error(`Manifest endpoint returned HTTP ${manifestResponse.status}`);
  const manifest = JSON.parse(manifestResponse.body);
  const exportedManifest = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'route-manifest.json'), 'utf8'));
  if (JSON.stringify(exportedManifest) !== JSON.stringify(manifest)) failures.push('Exported route manifest differs from Ktor manifest');
  if (manifest.projectRoute !== '/design?project={id}') failures.push(`Unexpected project restoration contract: ${manifest.projectRoute}`);

  const redirects = parseRedirects();
  const { server, origin: staticOrigin } = await startStaticServer(redirects);
  try {
    const localChecks = await verifyRouteTable('local', LOCAL_ORIGIN, manifest, failures);
    const staticChecks = await verifyRouteTable('static', staticOrigin, manifest, failures);

    for (const route of manifest.routes) {
      const file = outputPath(route);
      if (route.export && !fs.existsSync(file)) failures.push(`static export missing ${route.path}: ${path.relative(ROOT, file)}`);
      if (!route.export && route.behavior !== 'asset' && fs.existsSync(file)) failures.push(`non-page route exported duplicate HTML: ${route.path}`);
      if (route.behavior === 'redirect') {
        const emitted = redirects.get(route.path);
        if (!emitted || emitted.status !== 301 || emitted.target !== route.target) {
          failures.push(`_redirects mismatch for ${route.path}`);
        }
      }
    }

    for (const [label, origin] of [['local', LOCAL_ORIGIN], ['static', staticOrigin]]) {
      for (const missing of [UNKNOWN_PATH, UNKNOWN_BLOG]) {
        const response = await request(origin, missing, true);
        if (response.status !== 404) failures.push(`${label} ${missing}: expected HTTP 404, got ${response.status}`);
      }
    }

    const queryRedirect = await request(LOCAL_ORIGIN, '/subscription?source=route-crawler');
    if (queryRedirect.status !== 301 || queryRedirect.location !== '/pricing?source=route-crawler') {
      failures.push(`local redirect did not preserve query string: ${queryRedirect.status} ${queryRedirect.location || ''}`);
    }
    const project = await request(LOCAL_ORIGIN, '/design?project=qa_project-1');
    if (project.status !== 200 || !/data-project-id=["']qa_project-1["']/.test(project.body)) {
      failures.push('Project restoration URL did not render its validated project id on /design');
    }
    if (!isFocusableAnchor(project.body, 'editor') || !/editor\.focus\(\{ preventScroll: true \}\)/.test(project.body)) {
      failures.push('Canonical /design editor is not focusable for fragment and legacy CTA arrivals');
    }

    const localCoverage = await verifyLinksAndAssets('local', LOCAL_ORIGIN, manifest, failures);
    const staticCoverage = await verifyLinksAndAssets('static', staticOrigin, manifest, failures);
    const cssAssets = await verifyCssAssets(staticOrigin, failures);

    const summary = {
      declaredRoutes: manifest.routes.length,
      localRouteChecks: localChecks,
      staticRouteChecks: staticChecks,
      redirects: redirects.size,
      localLinks: localCoverage.links,
      staticLinks: staticCoverage.links,
      localAssets: localCoverage.assets,
      staticAssets: staticCoverage.assets,
      cssAssets,
      failures: failures.length
    };
    console.log(JSON.stringify(summary, null, 2));
    if (failures.length) {
      console.error('\nRoute verification failures:');
      failures.forEach(failure => console.error(`- ${failure}`));
      process.exitCode = 1;
    } else {
      console.log('\nRoute verification passed: Ktor and static route semantics are in parity.');
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(`Route verification failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
