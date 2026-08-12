const fs = require('fs');
const path = require('path');
const { DIST_DIR, ROOT, STATIC_DIR } = require('./asset-lib');

const metaDir = path.join(STATIC_DIR, 'meta');
if (!fs.existsSync(DIST_DIR)) throw new Error('dist/ does not exist; run the static build first.');
if (!fs.existsSync(metaDir)) throw new Error('static/meta/ does not exist; run assets:build first.');

for (const entry of fs.readdirSync(metaDir, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  fs.copyFileSync(path.join(metaDir, entry.name), path.join(DIST_DIR, entry.name));
  console.log(`Published /${entry.name}`);
}

console.log(`Root metadata assets published from ${path.relative(ROOT, metaDir)}.`);
