const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STATIC_DIR = path.join(ROOT, 'static');
const DIST_DIR = path.join(ROOT, 'dist');
const ASSET_EXTENSION = '(?:avif|css|gif|ico|jpe?g|json|js|png|svg|webmanifest|webp|woff2?)';
const ROOT_ASSETS = new Set([
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.png',
  '/site.webmanifest'
]);

function walk(directory, predicate = () => true) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath, predicate));
    else if (predicate(fullPath)) files.push(fullPath);
  }
  return files;
}

function lineNumber(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

function sourceFiles() {
  const kotlin = walk(path.join(ROOT, 'src', 'main', 'kotlin'), file => file.endsWith('.kt'));
  const browser = walk(STATIC_DIR, file => /\.(?:css|js)$/i.test(file));
  return [...kotlin, ...browser].sort();
}

function extractSourceReferences() {
  const records = [];
  const expression = new RegExp(`/static/[A-Za-z0-9_./$\\{\\}-]+\\.${ASSET_EXTENSION}|/(?:og-image\\.png|favicon\\.(?:ico|svg)|apple-touch-icon\\.png|icon-(?:192|512)\\.png|site\\.webmanifest)`, 'gi');
  for (const file of sourceFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(expression)) {
      records.push({
        path: match[0],
        concrete: !match[0].includes('${'),
        origin: path.relative(ROOT, file).replaceAll(path.sep, '/'),
        line: lineNumber(text, match.index)
      });
    }
  }
  return records;
}

function extractRenderedReferences() {
  const htmlFiles = walk(DIST_DIR, file => file.endsWith('.html')).sort();
  const records = [];
  const attribute = /\b(?:content|href|poster|src)\s*=\s*["']([^"']+)["']/gi;
  const publicPath = new RegExp(`/static/[A-Za-z0-9_./-]+\\.${ASSET_EXTENSION}|/(?:og-image\\.png|favicon\\.(?:ico|svg)|apple-touch-icon\\.png|icon-(?:192|512)\\.png|site\\.webmanifest)`, 'i');
  for (const file of htmlFiles) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(attribute)) {
      const asset = match[1].match(publicPath);
      if (!asset) continue;
      records.push({
        path: asset[0].split(/[?#]/, 1)[0],
        origin: path.relative(ROOT, file).replaceAll(path.sep, '/'),
        line: lineNumber(text, match.index)
      });
    }
  }
  return records;
}

function uniqueRecords(records) {
  const grouped = new Map();
  for (const record of records) {
    if (!grouped.has(record.path)) grouped.set(record.path, []);
    grouped.get(record.path).push({ origin: record.origin, line: record.line });
  }
  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([publicPath, origins]) => ({ path: publicPath, origins }));
}

function sourceFileFor(publicPath) {
  if (publicPath.startsWith('/static/')) return path.join(ROOT, publicPath.slice(1));
  if (ROOT_ASSETS.has(publicPath)) return path.join(STATIC_DIR, 'meta', publicPath.slice(1));
  return null;
}

function distFileFor(publicPath) {
  return path.join(DIST_DIR, publicPath.replace(/^\//, ''));
}

function isPresent(file) {
  return Boolean(file && fs.existsSync(file) && fs.statSync(file).isFile() && fs.statSync(file).size > 0);
}

module.exports = {
  ASSET_EXTENSION,
  DIST_DIR,
  ROOT,
  ROOT_ASSETS,
  STATIC_DIR,
  distFileFor,
  extractRenderedReferences,
  extractSourceReferences,
  isPresent,
  sourceFileFor,
  uniqueRecords,
  walk
};
