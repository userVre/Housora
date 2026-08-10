const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = (process.env.BUILD_ORIGIN || 'http://localhost:8081').replace(/\/$/, '');
// Use a public origin in SEO metadata when generating the Pages bundle.
// Override this at build time with PUBLIC_SITE_URL for a custom domain.
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://housora.pages.dev').replace(/\/$/, '');
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

function clerkFrontendDomain(publishableKey) {
  try {
    const encoded = publishableKey.replace(/^pk_(?:test|live)_/, '');
    return Buffer.from(encoded, 'base64url').toString('utf8').replace(/\$$/, '');
  } catch (_) {
    return '';
  }
}

// All routes from Routing.kt (GET only - POST endpoints won't work on static hosting)
const routes = [
  '/',
  '/create',
  '/pricing',
  '/subscription',
  '/workspace',
  '/interior-design',
  '/layout-boost',
  '/exterior-design',
  '/garden-design',
  '/floor-restyle',
  '/wall-texture',
  '/video-walkthrough',
  '/floorplan-to-3d',
  '/photo-to-render',
  '/ai-stairs-design',
  '/ai-doors-design',
  '/ai-windows-design',
  '/ai-kitchen-design',
  '/ai-bathroom-design',
  '/sign-in',
  '/sign-up',
  '/delete-account',
  '/blog',
  '/blog/exterior-colour-palettes',
  '/blog/planning-a-room-redesign',
  '/blog/photo-to-video-room-tour',
  '/blog/architecture-prompt-basics',
  '/blog/choosing-furniture-with-confidence',
  '/blog/garden-design-brief',
  '/blog/room-walkthrough-storytelling',
  '/blog/comparing-ai-design-tools',
  '/blog/black-doors-without-regret',
  '/examples',
  '/faq',
  '/contact',
  '/compare/housora-vs-reimaginehome',
  '/compare/housora-vs-homedesigns',
  '/compare/housora-vs-mnml',
  '/compare/housora-vs-homestyler',
  '/compare/housora-vs-planner5d',
  '/enterprise',
  '/privacy',
  '/terms',
  '/refund-policy',
  '/cookies',
  '/projects',
  '/inspirations',
  '/referral',
  '/ai-interior-design-prompts',
  '/furniture-fit-calculator',
  '/api',
  '/cli',
  '/mcp',
  '/partnerships',
  '/case-studies',
  '/affiliates',
  '/answers',
];

function fetchPage(urlPath, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + urlPath;
    http.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (redirectCount >= 5) {
          reject(new Error(`Too many redirects while fetching ${urlPath}`));
          return;
        }
        const nextUrl = new URL(res.headers.location, url);
        const buildOrigin = new URL(BASE_URL);
        if (nextUrl.origin !== buildOrigin.origin) {
          reject(new Error(`Refusing cross-origin build redirect to ${nextUrl.origin}`));
          return;
        }
        fetchPage(nextUrl.pathname + nextUrl.search, redirectCount + 1).then(resolve, reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
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
  const clerkKey = BUILD_ENV.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const convexUrl = BUILD_ENV.EXPO_PUBLIC_CONVEX_URL;
  const posthogKey = BUILD_ENV.VITE_POSTHOG_KEY || BUILD_ENV.POSTHOG_API_KEY;
  const posthogHost = BUILD_ENV.VITE_POSTHOG_HOST || BUILD_ENV.POSTHOG_HOST;
  if (clerkKey) {
    html = html.replace(/(<meta name="clerk-publishable-key"\s+content=")[^"]*(")/g, `$1${clerkKey}$2`);
    html = html.replace(/(data-clerk-publishable-key=")[^"]*(")/g, `$1${clerkKey}$2`);
    html = html.replace(/(var clerkPubKey = ')[^']*(')/g, `$1${clerkKey}$2`);
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

  // Clean dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Copy static assets
  console.log('Copying static assets...');
  copyDirSync(STATIC_SRC, path.join(DIST_DIR, 'static'));
  console.log('  static/ copied.');

  // Copy Cloudflare Pages Functions
  const functionsSrc = path.join(__dirname, 'functions');
  if (fs.existsSync(functionsSrc)) {
    copyDirSync(functionsSrc, path.join(DIST_DIR, 'functions'));
    console.log('  functions/ copied.');
  }
  console.log('');

  // Fetch and save each page
  console.log(`Fetching ${routes.length} pages from ${BASE_URL}...\n`);
  let success = 0;
  let failed = 0;

  for (const route of routes) {
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

  // Save llms.txt as plain text
  try {
    const { status, body } = await fetchPage('/llms.txt');
    if (status === 200) {
      fs.writeFileSync(path.join(DIST_DIR, 'llms.txt'), repairMojibake(body), 'utf-8');
      console.log(`  OK   /llms.txt -> llms.txt`);
      success++;
    }
  } catch (err) {}

  // Create _redirects for Cloudflare Pages (aliases)
  const redirects = [
    '/design /create.html 200',
    '/subscription /pricing.html 200',
    '/stairs-design /ai-stairs-design.html 200',
    '/doors-design /ai-doors-design.html 200',
    '/windows-design /ai-windows-design.html 200',
    '/kitchen-design /ai-kitchen-design.html 200',
    '/bathroom-design /ai-bathroom-design.html 200',
    '/sign-out /sign-in.html 200',
    '/interior-design-examples /examples.html 200',
    '/embed-ai-interior-design /partnerships.html 200',
  ];
  fs.writeFileSync(path.join(DIST_DIR, '_redirects'), redirects.join('\n'), 'utf-8');
  console.log('\n  _redirects created for route aliases.');

  console.log(`\n=== Done! ${success} pages built, ${failed} failed ===`);
  console.log(`\nUpload the "dist/" folder to Cloudflare Pages.`);
  console.log(`\nNOTE: Cloudflare Pages Functions are included for upload, image generation, and Whop checkout.`);
  console.log('Configure the required Pages secrets/bindings before using those features in production. Clerk auth and Convex work client-side.\n');

  if (failed > 0) {
    throw new Error(`Static build failed for ${failed} page${failed === 1 ? '' : 's'}.`);
  }
}

build().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
