const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const {
  ROOT,
  STATIC_DIR,
  extractRenderedReferences,
  extractSourceReferences,
  sourceFileFor
} = require('./asset-lib');

const CLERK_VERSION = '6.25.7';
const POSTHOG_VERSION = '1.417.1';
const CONVEX_VERSION = '1.44.0';
const TOOL_KEYS = [
  'bathroom-design', 'doors-design', 'exterior-design', 'floor-restyle',
  'floorplan-to-3d', 'garden-design', 'interior-design', 'kitchen-design',
  'layout-boost', 'photo-to-render', 'stairs-design', 'video-walkthrough',
  'wall-texture', 'walls-texture', 'windows-design'
];

// Tool hero routes are product proof, not decorative fallbacks. Keep them
// backed by the best matching project-owned image when a dedicated hero has
// not been supplied yet, so builds never replace the whole catalogue with
// "Visual pending" cards.
const TOOL_IMAGE_SOURCES = {
  'bathroom-design': '/static/images/bathroom-after.jpg',
  'doors-design': '/static/images/door-black-crittall.jpg',
  'exterior-design': '/static/images/exterior-after.jpg',
  'floor-restyle': '/static/images/floor-restyle-after.jpg',
  'floorplan-to-3d': '/static/images/floorplan-after.jpg',
  'garden-design': '/static/images/garden-after.jpg',
  'interior-design': '/static/images/interior-after.jpg',
  'kitchen-design': '/static/images/kitchen-after.jpg',
  'layout-boost': '/static/images/layout-after.jpg',
  'photo-to-render': '/static/images/render-after.jpg',
  'stairs-design': '/static/images/stairs-after.jpg',
  'video-walkthrough': '/static/images/gallery-walkthrough.jpg',
  'wall-texture': '/static/images/walls-texture-after.jpg',
  'walls-texture': '/static/images/walls-texture-after.jpg',
  'windows-design': '/static/images/windows-before.jpg'
};

// Core marketing visuals are also real product proof. These mappings keep a
// previously generated placeholder from being reintroduced into the hero or
// the three-step explainer when the asset manifest is rebuilt.
const CORE_IMAGE_SOURCES = {
  '/static/images/room-before.jpg': '/static/images/room-before.jpg',
  '/static/images/hero-after.jpg': '/static/images/hero-after.jpg',
  '/static/images/step1.jpg': '/static/images/step1.jpg',
  '/static/images/step2.jpg': '/static/images/step2.jpg',
  '/static/images/step3.jpg': '/static/images/step3.jpg'
};

function ensureParent(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function write(file, content) {
  ensureParent(file);
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, content);
  try {
    fs.renameSync(temporary, file);
  } catch (error) {
    // Windows can reject replacing a generated image while an antivirus or
    // preview process still has a handle open. Retry with an exact-file
    // replacement so the audit build remains repeatable.
    if (error.code !== 'EEXIST' && error.code !== 'EPERM' && error.code !== 'UNKNOWN') throw error;
    fs.rmSync(file, { force: true });
    fs.renameSync(temporary, file);
  }
}

function copy(file, destination) {
  ensureParent(destination);
  fs.copyFileSync(file, destination);
}

function packageRoot(packageName) {
  let current = path.dirname(require.resolve(packageName));
  while (current !== path.dirname(current)) {
    const manifest = path.join(current, 'package.json');
    if (fs.existsSync(manifest) && JSON.parse(fs.readFileSync(manifest, 'utf8')).name === packageName) return current;
    current = path.dirname(current);
  }
  throw new Error(`Could not find the package root for ${packageName}`);
}

function assertVersion(packageName, expectedVersion) {
  const root = packageRoot(packageName);
  const actualVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  if (actualVersion !== expectedVersion) {
    throw new Error(`${packageName} must be ${expectedVersion}; found ${actualVersion}. Update this script and ASSET_MANIFEST.md intentionally.`);
  }
  return root;
}

function stripSourceMapComment(source) {
  return source.replace(/\n?\/\/# sourceMappingURL=.*(?:\n|$)/g, '\n');
}

function buildVendorAssets() {
  const clerkOutput = path.join(STATIC_DIR, 'vendor', 'clerk-js');
  if (!fs.existsSync(clerkOutput)) {
    throw new Error(`The vendored Clerk ${CLERK_VERSION} browser bundle is missing.`);
  }
  const clerkFiles = fs.readdirSync(clerkOutput).filter(file =>
    file === 'clerk.browser.js' || /_clerk\.browser_[a-f0-9]+_6\.25\.7\.js$/.test(file)
  );
  const clerkEntry = path.join(clerkOutput, 'clerk.browser.js');
  if (!clerkFiles.includes('clerk.browser.js') || !fs.readFileSync(clerkEntry, 'utf8').includes(CLERK_VERSION)) {
    throw new Error(`The pinned Clerk browser entrypoint must be version ${CLERK_VERSION}.`);
  }
  if (!fs.existsSync(path.join(clerkOutput, 'LICENSE.txt'))) {
    throw new Error('The vendored Clerk browser license is missing.');
  }

  // Keep the historical path as a no-op compatibility file for old generated
  // pages. Current pages load @clerk/ui from the instance Frontend API because
  // ClerkJS does not expose the UI constructor by itself.
  const clerkUiOutput = path.join(STATIC_DIR, 'vendor', 'clerk-ui');
  fs.rmSync(clerkUiOutput, { recursive: true, force: true });
  const clerkUiDist = path.join(clerkUiRoot, 'dist');
  const clerkUiFiles = fs.readdirSync(clerkUiDist).filter(file => file.endsWith('.js'));
  for (const file of clerkUiFiles) copy(path.join(clerkUiDist, file), path.join(clerkUiOutput, file));
  copy(path.join(clerkUiRoot, 'LICENSE'), path.join(clerkUiOutput, 'LICENSE.txt'));

  const posthogRoot = assertVersion('posthog-js', POSTHOG_VERSION);
  const posthogOutput = path.join(STATIC_DIR, 'vendor', 'posthog');
  fs.rmSync(posthogOutput, { recursive: true, force: true });
  const posthogSource = fs.readFileSync(path.join(posthogRoot, 'dist', 'array.js'), 'utf8');
  write(path.join(posthogOutput, 'posthog.js'), stripSourceMapComment(posthogSource));
  copy(path.join(posthogRoot, 'LICENSE'), path.join(posthogOutput, 'LICENSE.txt'));

  const convexRoot = assertVersion('convex', CONVEX_VERSION);
  const convexOutput = path.join(STATIC_DIR, 'vendor', 'convex');
  fs.rmSync(convexOutput, { recursive: true, force: true });
  write(
    path.join(convexOutput, 'browser.js'),
    stripSourceMapComment(fs.readFileSync(path.join(convexRoot, 'dist', 'browser.bundle.js'), 'utf8'))
  );
  copy(path.join(convexRoot, 'LICENSE'), path.join(convexOutput, 'LICENSE.txt'));

  return {
    clerk: {
      version: CLERK_VERSION,
      uiVersion: CLERK_UI_VERSION,
      files: clerkFiles.length + clerkUiFiles.length + 3,
      source: 'vendored'
    },
    posthog: { version: POSTHOG_VERSION, files: 2, entrypoint: 'posthog-js/dist/array.js' },
    convex: { version: CONVEX_VERSION, files: 2, entrypoint: 'convex/dist/browser.bundle.js' }
  };
}

function dimensionsFor(publicPath) {
  const name = path.basename(publicPath);
  if (/^room-preview-/.test(name)) return { width: 240, height: 168 };
  if (/^room-(?:living|bedroom|dining)\./.test(name)) return { width: 400, height: 280 };
  if (/^style-/.test(name) || /^s-/.test(name)) return { width: 400, height: 280 };
  if (/^step[123]\./.test(name)) return { width: 800, height: 520 };
  if (publicPath.includes('/tools/')) return { width: 1200, height: 800 };
  if (/^gallery-/.test(name)) return { width: 1600, height: 900 };
  if (/before-after-comparison|floorplan-/.test(name)) return { width: 1340, height: 894 };
  if (/^(?:door-|stairs-|windows-|wall-|floor-restyle-|render-|try-)/.test(name)) return { width: 1200, height: 800 };
  return { width: 1376, height: 768 };
}

function escapeXml(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
}

function placeholderSvg(width, height) {
  const compact = width < 500 || height < 300;
  const titleSize = Math.max(18, Math.round(Math.min(width, height) * (compact ? 0.095 : 0.07)));
  const noteSize = Math.max(12, Math.round(titleSize * 0.42));
  const iconSize = Math.round(Math.min(width, height) * 0.22);
  const centerX = width / 2;
  const centerY = height / 2 - (compact ? 6 : 14);
  const roofY = centerY - iconSize * 0.55;
  const houseY = centerY - iconSize * 0.15;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="#d7d2c9" stroke-width="1" opacity=".55"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#eeeae2"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  <g fill="none" stroke="#706d66" stroke-width="${Math.max(2, Math.round(iconSize * 0.045))}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M${centerX - iconSize * .62} ${houseY} L${centerX} ${roofY} L${centerX + iconSize * .62} ${houseY}"/>
    <path d="M${centerX - iconSize * .45} ${houseY - iconSize * .02} V${houseY + iconSize * .65} H${centerX + iconSize * .45} V${houseY - iconSize * .02}"/>
    <path d="M${centerX - iconSize * .12} ${houseY + iconSize * .65} V${houseY + iconSize * .25} H${centerX + iconSize * .12} V${houseY + iconSize * .65}"/>
  </g>
  <text x="50%" y="${centerY + iconSize * .83}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="#33322f">Visual pending</text>
  ${compact ? '' : `<text x="50%" y="${centerY + iconSize * .83 + noteSize * 1.7}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${noteSize}" fill="#5f5c56">Neutral placeholder — final image required</text>`}
</svg>`.trim();
}

function imagePaths() {
  const references = [...extractSourceReferences(), ...extractRenderedReferences()]
    .filter(reference => reference.concrete !== false && /^\/static\/images\/.*\.(?:jpe?g|png|webp|avif)$/i.test(reference.path))
    .map(reference => reference.path);
  for (const key of TOOL_KEYS) references.push(`/static/images/tools/${key}-hero.jpg`);
  for (const step of [1, 2, 3]) references.push(`/static/images/step${step}.jpg`);
  return [...new Set(references)].sort();
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function buildImageAssets() {
  const registryFile = path.join(STATIC_DIR, 'assets', 'placeholders.json');
  const previous = fs.existsSync(registryFile) ? JSON.parse(fs.readFileSync(registryFile, 'utf8')).assets : [];
  const knownPlaceholders = new Map(previous.map(asset => [asset.path, asset]));
  const placeholders = [];
  const responsive = {};
  const generatedCache = new Map();

  async function generatedPlaceholder(dimensions, format, width = dimensions.width) {
    const height = Math.round(dimensions.height * width / dimensions.width);
    const key = `${dimensions.width}x${dimensions.height}:${width}:${format}`;
    if (!generatedCache.has(key)) {
      let pipeline = sharp(Buffer.from(placeholderSvg(dimensions.width, dimensions.height))).resize(width, height);
      if (format === 'jpeg') pipeline = pipeline.jpeg({ quality: 72, progressive: true, mozjpeg: true });
      if (format === 'webp') pipeline = pipeline.webp({ quality: 65, smartSubsample: true });
      if (format === 'avif') pipeline = pipeline.avif({ quality: 48, effort: 4 });
      generatedCache.set(key, await pipeline.toBuffer());
    }
    return generatedCache.get(key);
  }

  for (const publicPath of imagePaths()) {
    const file = sourceFileFor(publicPath);
    const dimensions = dimensionsFor(publicPath);
    ensureParent(file);
    const previousPlaceholder = knownPlaceholders.get(publicPath);
    const toolKey = publicPath.match(/^\/static\/images\/tools\/(.+)-hero\.jpg$/)?.[1];
    const mappedSource = toolKey ? TOOL_IMAGE_SOURCES[toolKey] : CORE_IMAGE_SOURCES[publicPath];
    const mappedFile = mappedSource ? sourceFileFor(mappedSource) : null;
    if (mappedFile && fs.existsSync(mappedFile) && previousPlaceholder && fs.existsSync(file) && previousPlaceholder.sha256 === sha256(fs.readFileSync(file))) {
      copy(mappedFile, file);
    }
    let placeholder = Boolean(
      previousPlaceholder && fs.existsSync(file) && previousPlaceholder.sha256 === sha256(fs.readFileSync(file))
    );
    if (!fs.existsSync(file)) {
      write(file, await generatedPlaceholder(dimensions, 'jpeg'));
      placeholder = true;
    }

    const metadata = await sharp(file).metadata();
    const intrinsic = { width: metadata.width, height: metadata.height };
    if (placeholder) {
      placeholders.push({
        path: publicPath,
        width: intrinsic.width,
        height: intrinsic.height,
        purpose: 'Neutral, visibly labeled fallback for a missing project-owned visual.',
        replacementRequired: true,
        source: 'Generated by scripts/build-assets.js; no people, properties, products, or testimonials are depicted.',
        sha256: sha256(fs.readFileSync(file))
      });
    }

    const widths = [...new Set([320, 640, 960, intrinsic.width].filter(width => width <= intrinsic.width))].sort((a, b) => a - b);
    const base = file.replace(/\.[^.]+$/, '');
    const sources = { avif: [], webp: [] };
    for (const width of widths) {
      for (const format of ['avif', 'webp']) {
        const variantFile = `${base}-${width}w.${format}`;
        const buffer = placeholder
          ? await generatedPlaceholder(intrinsic, format, width)
          : await sharp(file).resize({ width, withoutEnlargement: true }).toFormat(format, format === 'avif' ? { quality: 48, effort: 4 } : { quality: 65, smartSubsample: true }).toBuffer();
        write(variantFile, buffer);
        sources[format].push({
          path: '/' + path.relative(ROOT, variantFile).replaceAll(path.sep, '/'),
          width
        });
      }
    }
    responsive[publicPath] = { ...intrinsic, placeholder, sources };
  }

  write(registryFile, JSON.stringify({ schemaVersion: 1, assets: placeholders }, null, 2) + '\n');
  write(path.join(STATIC_DIR, 'assets', 'responsive-images.json'), JSON.stringify({ schemaVersion: 1, images: responsive }, null, 2) + '\n');
  return { images: Object.keys(responsive).length, placeholders: placeholders.length };
}

function brandMarkSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="title">
  <title id="title">Housora</title>
  <rect width="64" height="64" rx="14" fill="#171714"/>
  <path d="M14 31.5 32 16l18 15.5v19H38V37H26v13.5H14z" fill="#f3efe6"/>
  <path d="M25 27h14" stroke="#d88c5a" stroke-width="5" stroke-linecap="round"/>
</svg>`.trim() + '\n';
}

function createIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 32;
  entry[1] = 32;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

async function buildMetadataAssets() {
  const meta = path.join(STATIC_DIR, 'meta');
  const mark = brandMarkSvg();
  write(path.join(meta, 'favicon.svg'), mark);
  const icon32 = await sharp(Buffer.from(mark)).resize(32, 32).png().toBuffer();
  write(path.join(meta, 'favicon.ico'), createIco(icon32));
  write(path.join(meta, 'apple-touch-icon.png'), await sharp(Buffer.from(mark)).resize(180, 180).png({ compressionLevel: 9 }).toBuffer());
  write(path.join(meta, 'icon-192.png'), await sharp(Buffer.from(mark)).resize(192, 192).png({ compressionLevel: 9 }).toBuffer());
  write(path.join(meta, 'icon-512.png'), await sharp(Buffer.from(mark)).resize(512, 512).png({ compressionLevel: 9 }).toBuffer());
  const socialSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#eeeae2"/>
  <circle cx="1035" cy="120" r="270" fill="#d88c5a" opacity=".2"/>
  <circle cx="110" cy="620" r="310" fill="#8ea398" opacity=".28"/>
  <g transform="translate(100 154)">
    <rect width="112" height="112" rx="25" fill="#171714"/>
    <path d="M24 55 56 28l32 27v34H67V66H45v23H24z" fill="#f3efe6"/>
    <path d="M44 47h24" stroke="#d88c5a" stroke-width="8" stroke-linecap="round"/>
  </g>
  <text x="100" y="340" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#171714">Housora</text>
  <text x="103" y="414" font-family="Arial, sans-serif" font-size="34" fill="#4d4b46">See your space differently.</text>
  <text x="103" y="477" font-family="Arial, sans-serif" font-size="24" fill="#706d66">AI-assisted home design</text>
</svg>`.trim();
  write(path.join(meta, 'og-image.png'), await sharp(Buffer.from(socialSvg)).png({ compressionLevel: 9 }).toBuffer());
  write(path.join(meta, 'og-image.webp'), await sharp(Buffer.from(socialSvg)).webp({ quality: 78 }).toBuffer());
  write(path.join(meta, 'og-image.avif'), await sharp(Buffer.from(socialSvg)).avif({ quality: 58, effort: 4 }).toBuffer());
  write(path.join(meta, 'site.webmanifest'), JSON.stringify({
    name: 'Housora',
    short_name: 'Housora',
    description: 'AI-assisted home design',
    start_url: '/',
    display: 'standalone',
    background_color: '#eeeae2',
    theme_color: '#171714',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }, null, 2) + '\n');
  return { files: 9 };
}

async function main() {
  const vendor = buildVendorAssets();
  const images = await buildImageAssets();
  const metadata = await buildMetadataAssets();
  console.log(`Pinned vendor assets: Clerk ${vendor.clerk.version} (${vendor.clerk.files} files), PostHog ${vendor.posthog.version} (${vendor.posthog.files} files).`);
  console.log(`Image assets: ${images.images} fallbacks, ${images.placeholders} pending human replacement.`);
  console.log(`Brand metadata: ${metadata.files} files.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
