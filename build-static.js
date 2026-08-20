const http = require('http');
const fs = require('fs');
const path = require('path');
const { siteOrigin } = require('./scripts/test-config');

const BASE_URL = siteOrigin();
const DIST_DIR = path.join(__dirname, 'dist');
const STATIC_SRC = path.join(__dirname, 'static');

function loadBuildEnv() {
  // Cloudflare Pages build variables take precedence over local .env values.
  const result = { ...process.env };
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return result;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?(.*?)["']?\s*$/);
    if (match && !line.trim().startsWith('#') && !Object.prototype.hasOwnProperty.call(result, match[1])) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

const BUILD_ENV = loadBuildEnv();

function requiredPublicSiteUrl() {
  const value = String(BUILD_ENV.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  if (!value) throw new Error('PUBLIC_SITE_URL is required for a production static build (for example, https://housora.app).');
  let parsed;
  try { parsed = new URL(value); } catch (_) { throw new Error('PUBLIC_SITE_URL must be a valid absolute URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('PUBLIC_SITE_URL must be an absolute http(s) origin without credentials, query, or hash.');
  }
  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new Error('PUBLIC_SITE_URL must use HTTPS outside localhost.');
  }
  return value;
}

const PUBLIC_SITE_URL = requiredPublicSiteUrl();

function validateProductionClerkKey() {
  const clerkKey = String(
    BUILD_ENV.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
      || BUILD_ENV.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      || BUILD_ENV.CLERK_PUBLISHABLE_KEY
      || ''
  ).trim();
  const isLocal = ['localhost', '127.0.0.1'].includes(new URL(PUBLIC_SITE_URL).hostname);

  if (!clerkKey) {
    throw new Error('A Clerk publishable key is required before building the site.');
  }
  if (!/^pk_(?:test|live)_/.test(clerkKey)) {
    throw new Error('The Clerk publishable key must use the pk_test_ or pk_live_ format.');
  }
  if (!isLocal && clerkKey.startsWith('pk_test_')) {
    throw new Error('Refusing a production build with a pk_test_ Clerk key. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your pk_live_ key before publishing.');
  }
  return clerkKey;
}

const CLERK_PUBLISHABLE_KEY = validateProductionClerkKey();

function clerkFrontendDomain(publishableKey) {
  try {
    const encoded = publishableKey.replace(/^pk_(?:test|live)_/, '');
    return Buffer.from(encoded, 'base64url').toString('utf8').replace(/\$$/, '');
  } catch (_) {
    return '';
  }
}

function fetchPage(urlPath, options = {}, redirectChain = []) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + urlPath;
    http.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const nextUrl = new URL(res.headers.location, url);
        const redirect = { status: res.statusCode, from: urlPath, to: nextUrl.pathname + nextUrl.search + nextUrl.hash };
        if (!options.followRedirects) {
          resolve({ status: res.statusCode, body: '', finalPath: urlPath, location: redirect.to, redirects: [...redirectChain, redirect] });
          return;
        }
        if (redirectChain.length >= 5) {
          reject(new Error(`Too many redirects while fetching ${urlPath}`));
          return;
        }
        const buildOrigin = new URL(BASE_URL);
        if (nextUrl.origin !== buildOrigin.origin) {
          reject(new Error(`Refusing cross-origin build redirect to ${nextUrl.origin}`));
          return;
        }
        fetchPage(nextUrl.pathname + nextUrl.search, options, [...redirectChain, redirect]).then(resolve, reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, finalPath: urlPath, redirects: redirectChain }));
    }).on('error', reject).setTimeout(15000, function() {
      this.destroy(new Error(`Timed out while fetching ${urlPath}`));
    });
  });
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    // These folders were imported while comparing the old reference site.
    // They are intentionally excluded from the public Housora bundle; every
    // published page now points at Housora's own static image set.
    if (src.endsWith(path.join('static', 'images')) && entry.isDirectory() && ['reference-slides', 'reference-tools'].includes(entry.name)) {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function sanitizeLegacyMarkup(html) {
  const imageMap = {
    'tool-01.webp': 'wall-after.jpg', 'tool-02.webp': 'gallery-exposed-brick.jpg',
    'tool-03.webp': 'gallery-wood-paneling.jpg', 'tool-04.webp': 'gallery-stone.jpg',
    'tool-05.webp': 'floor-restyle-after.jpg', 'tool-06.webp': 'gallery-oak-herringbone.jpg',
    'tool-07.webp': 'gallery-polished-concrete.jpg', 'tool-08.webp': 'gallery-oak-chevron.jpg',
    'tool-09.webp': 'kitchen-after.jpg', 'tool-10.webp': 'gallery-sage-shaker.jpg',
    'tool-11.webp': 'gallery-modern-oak.jpg', 'tool-12.webp': 'gallery-handleless.jpg',
    'tool-13.webp': 'bathroom-after.jpg', 'tool-14.webp': 'gallery-modern-spa.jpg',
    'tool-15.webp': 'gallery-white-marble.jpg', 'tool-16.webp': 'gallery-modern-spa.jpg',
    'tool-17.webp': 'stairs-after.jpg', 'tool-18.webp': 'gallery-glass-railing.jpg',
    'tool-19.webp': 'gallery-floating.jpg', 'tool-20.webp': 'gallery-modern-oak.jpg',
    'tool-21.webp': 'doors-after.jpg', 'tool-22.webp': 'gallery-wood-frame.jpg',
    'tool-23.webp': 'gallery-modern-flush.jpg', 'tool-24.webp': 'gallery-pivot.jpg',
    'tool-25.webp': 'windows-before.jpg', 'tool-26.webp': 'gallery-black-frame.jpg',
    'tool-27.webp': 'gallery-crittall.jpg', 'tool-28.webp': 'gallery-french-glass.jpg',
    'tool-29.webp': 'exterior-after.jpg', 'tool-30.webp': 'gallery-colonial.jpg',
    'tool-31.webp': 'gallery-modern.jpg', 'tool-32.webp': 'gallery-barn.jpg',
    'tool-33.webp': 'garden-after.jpg', 'tool-34.webp': 'gallery-tropical.jpg',
    'tool-35.webp': 'gallery-cottage.jpg', 'tool-36.webp': 'gallery-natural.jpg'
  };
  Object.entries(imageMap).forEach(([oldName, newName]) => {
    html = html.replaceAll('/static/images/reference-tools/' + oldName, '/static/images/' + newName);
  });
  const slideMap = {
    'slide11-800w.webp': 'room-before.jpg', 'slide12-800w.webp': 'interior-after.jpg',
    'slide13-800w.webp': 'room-after.jpg', 'slide1-800w.webp': 'hero-after.jpg',
    'slide3-800w.webp': 'style-scandi.jpg', 'slide7-800w.webp': 'room-bedroom.jpg',
    'slide8-800w.webp': 'room-bedroom.jpg', 'slide6-800w.webp': 'gallery-cottage.jpg',
    'slide2-800w.webp': 'kitchen-after.jpg', 'slide4-800w.webp': 'room-dining.jpg',
    'slide9-800w.webp': 'gallery-modern.jpg'
  };
  Object.entries(slideMap).forEach(([oldName, newName]) => {
    html = html.replaceAll('/static/images/reference-slides/' + oldName, '/static/images/' + newName);
  });
  // Prevent stale server markup from promising retailer catalogs Housora has
  // not connected yet.
  html = html.replaceAll('Furniture from<span class="sr-only"> IKEA, Amazon, Wayfair &amp; more</span>', 'A clear direction for your space');
  html = html.replaceAll('Furniture from IKEA, Wayfair, Amazon and more.', 'Design inspiration tailored to your space.');
  const clerkKey = CLERK_PUBLISHABLE_KEY;
  const convexUrl = String(BUILD_ENV.EXPO_PUBLIC_CONVEX_URL || BUILD_ENV.NEXT_PUBLIC_CONVEX_URL || '').trim().replace(/\/+$/, '');
  const configuredPostHogKey = String(BUILD_ENV.VITE_POSTHOG_KEY || '').trim();
  // Static HTML may contain only PostHog's public phc_ project key. Never
  // fall back to POSTHOG_API_KEY, which may be a private personal API key.
  const posthogKey = configuredPostHogKey.startsWith('phc_') ? configuredPostHogKey : '';
  const configuredPostHogHost = String(BUILD_ENV.VITE_POSTHOG_HOST || BUILD_ENV.POSTHOG_HOST || '').trim().replace(/\/$/, '');
  let posthogHost = '';
  try {
    const parsedPostHogHost = new URL(configuredPostHogHost);
    if (parsedPostHogHost.protocol === 'https:' && !parsedPostHogHost.username && !parsedPostHogHost.password) {
      posthogHost = parsedPostHogHost.origin;
    }
  } catch (_) {}
  if (clerkKey) {
    html = html.replace(/(<meta name="clerk-publishable-key"\s+content=")[^"]*(")/g, `$1${clerkKey}$2`);
    html = html.replace(/(data-clerk-publishable-key=")[^"]*(")/g, `$1${clerkKey}$2`);
    html = html.replace(/(var clerkPubKey = ')[^']*(')/g, `$1${clerkKey}$2`);
    // The vendored Clerk browser bundle reads its key from the script tag
    // before clerk-bootstrap.js runs. Older local Ktor responses may not
    // include this attribute, so add it during static generation as well.
    html = html.replace(
      /(<script\b[^>]*src="\/static\/vendor\/clerk-js\/clerk\.browser\.js"[^>]*)(>)/g,
      (match, prefix, close) => prefix.includes('data-clerk-publishable-key')
        ? match
        : `${prefix} data-clerk-publishable-key="${clerkKey}"${close}`
    );
    // Keep the Clerk browser SDK on the official CDN. Rewriting it to the
    // frontend API domain makes the SDK fail to load on Cloudflare Pages.
  }
  if (convexUrl) {
    html = html.replace(/(<meta name="convex-url" content=")[^"]*(")/g, `$1${convexUrl}$2`);
    html = html.replace(/(window\.CONVEX_URL = ')[^']*(')/g, `$1${convexUrl}$2`);
    html = html.replace(/(var convexUrl = ')[^']*(')/g, `$1${convexUrl}$2`);
  }
  if (posthogKey) {
    html = html.replace(/(window\.HousoraPostHog\s*=\s*\{\s*key:\s*')[^']*(')/s, `$1${posthogKey.replace(/'/g, "\\'")}$2`);
  }
  if (posthogHost) {
    html = html.replace(/(window\.HousoraPostHog\s*=\s*\{[\s\S]*?host:\s*')[^']*(')/s, `$1${posthogHost.replace(/'/g, "\\'")}$2`);
  }
  // Protect the already-running local server's older HTML until it is
  // restarted with the Kotlin source change. This keeps the Pages bundle
  // free of the Clerk ready-event recursion immediately.
  html = html.replaceAll(
    'async function initializeClerk(Clerk) {',
    'async function initializeClerk(Clerk) { if (window.ClerkReady) return;'
  );
  return html;
}

// Some local Ktor responses contain UTF-8 text that has been decoded through a
// Windows-1252/Latin-1 hop. Repair only strings that clearly contain mojibake
// markers so published pages keep their accents, punctuation, and symbols.
function repairMojibake(text) {
  const cp1252 = {
    0x20ac: 0x80, 0x201a: 0x82, 0x192: 0x83, 0x201e: 0x84,
    0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x2c6: 0x88,
    0x2030: 0x89, 0x160: 0x8a, 0x2039: 0x8b, 0x152: 0x8c,
    0x17d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93,
    0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x2dc: 0x98, 0x2122: 0x99, 0x161: 0x9a, 0x203a: 0x9b,
    0x153: 0x9c, 0x17e: 0x9e, 0x178: 0x9f
  };
  const score = value => (value.match(/[\u00c3\u00c2\u00e2\u00f0\u00ef\ufffd]/g) || []).length;
  const decode = value => Buffer.from([...value].map(character => cp1252[character.charCodeAt(0)] ?? character.charCodeAt(0))).toString('utf8');
  let repaired = text;
  for (let attempt = 0; attempt < 4; attempt++) {
    const candidate = decode(repaired);
    if (score(candidate) >= score(repaired)) break;
    repaired = candidate;
  }
  return repaired;
}

async function build() {
  console.log('=== Housora Static Site Builder ===\n');

  const manifestResponse = await fetchPage('/route-manifest.json');
  if (manifestResponse.status !== 200) {
    throw new Error(`Could not load canonical route manifest (HTTP ${manifestResponse.status}).`);
  }
  const manifest = JSON.parse(manifestResponse.body);
  if (manifest.version !== 1 || !Array.isArray(manifest.routes)) {
    throw new Error('Canonical route manifest has an unsupported shape.');
  }
  const routes = manifest.routes;
  const duplicatePaths = routes.filter((route, index) => routes.findIndex(candidate => candidate.path === route.path) !== index);
  if (duplicatePaths.length) throw new Error(`Duplicate manifest routes: ${duplicatePaths.map(route => route.path).join(', ')}`);
  const exportRoutes = routes.filter(route => route.export);
  const pageRoutes = exportRoutes.filter(route => route.behavior === 'page');
  const assetRoutes = exportRoutes.filter(route => route.behavior === 'asset');
  const redirectRoutes = routes.filter(route => route.behavior === 'redirect');

  // Clean dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Copy static assets
  console.log('Copying static assets...');
  copyDirSync(STATIC_SRC, path.join(DIST_DIR, 'static'));
  console.log('  static/ copied.');
  // Root metadata assets are referenced directly by HTML and must exist before
  // the parity crawler runs (the publish step also copies these for deploys).
  const rootMeta = ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'og-image.png', 'site.webmanifest'];
  rootMeta.forEach(name => fs.copyFileSync(path.join(STATIC_SRC, 'meta', name), path.join(DIST_DIR, name)));
  console.log('  root metadata copied.');

  // Copy Cloudflare Pages Functions
  const functionsSrc = path.join(__dirname, 'functions');
  if (fs.existsSync(functionsSrc)) {
    copyDirSync(functionsSrc, path.join(DIST_DIR, 'functions'));
    console.log('  functions/ copied.');
  }
  console.log('');

  // Fetch only canonical rendered pages. Redirect aliases must never become
  // duplicate 200 HTML files.
  console.log(`Fetching ${pageRoutes.length} canonical pages from ${BASE_URL}...\n`);
  let success = 0;
  let failed = 0;

  for (const routeDefinition of pageRoutes) {
    const route = routeDefinition.path;
    try {
      const { status, body } = await fetchPage(route);
      if (status !== 200) {
        console.log(`  SKIP ${route} (HTTP ${status})`);
        failed++;
        continue;
      }

      // Save as HTML file
      let filePath;
      if (route === '/') {
        filePath = path.join(DIST_DIR, 'index.html');
      } else {
        filePath = path.join(DIST_DIR, route + '.html');
      }

      ensureDir(filePath);
      const publicBody = repairMojibake(sanitizeLegacyMarkup(body.replaceAll(BASE_URL, PUBLIC_SITE_URL)));
      fs.writeFileSync(filePath, publicBody, 'utf-8');
      console.log(`  OK   ${route} -> ${path.relative(DIST_DIR, filePath)}`);
      success++;
    } catch (err) {
      console.log(`  FAIL ${route} (${err.message})`);
      failed++;
    }
  }

  for (const routeDefinition of assetRoutes) {
    try {
      const { status, body, redirects } = await fetchPage(routeDefinition.path);
      if (status !== 200 || redirects.length) {
        throw new Error(`Expected direct HTTP 200, got ${status}${redirects.length ? ' after redirect' : ''}`);
      }
      const filePath = path.join(DIST_DIR, routeDefinition.path.replace(/^\//, ''));
      ensureDir(filePath);
      fs.writeFileSync(filePath, repairMojibake(body.replaceAll(BASE_URL, PUBLIC_SITE_URL)), 'utf-8');
      console.log(`  OK   ${routeDefinition.path} -> ${path.relative(DIST_DIR, filePath)}`);
      success++;
    } catch (err) {
      console.log(`  FAIL ${routeDefinition.path} (${err.message})`);
      failed++;
    }
  }

  const unknown = await fetchPage('/__housora_route_verification_missing__');
  if (unknown.status !== 404) {
    throw new Error(`Unknown Ktor route returned HTTP ${unknown.status}; expected 404.`);
  }
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), repairMojibake(sanitizeLegacyMarkup(unknown.body)), 'utf-8');
  console.log('  OK   unknown route -> 404.html');

  const redirects = redirectRoutes.map(route => `${route.path} ${route.target} 301`);
  fs.writeFileSync(path.join(DIST_DIR, '_redirects'), redirects.join('\n') + '\n', 'utf-8');
  fs.writeFileSync(path.join(DIST_DIR, 'route-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`\n  _redirects created for ${redirectRoutes.length} aliases; route-manifest.json copied.`);

  console.log(`\n=== Done! ${success} pages built, ${failed} failed ===`);
  console.log(`\nUpload the "dist/" folder to Cloudflare Pages.`);
  console.log(`\nNOTE: Cloudflare Pages Functions are included for image generation and Whop checkout. Uploads use Convex Storage.`);
  console.log('Configure the required Pages secrets/bindings before using those features in production. Clerk auth and Convex work client-side.\n');

  if (failed > 0) {
    throw new Error(`Static build failed for ${failed} page${failed === 1 ? '' : 's'}.`);
  }
}

build().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
