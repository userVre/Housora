const fs = require('fs');
const path = require('path');
const {
  DIST_DIR,
  ROOT,
  STATIC_DIR,
  distFileFor,
  extractRenderedReferences,
  extractSourceReferences,
  isPresent,
  sourceFileFor,
  uniqueRecords
} = require('./asset-lib');

const reportOnly = process.argv.includes('--report-only');
const placeholderFile = path.join(STATIC_DIR, 'assets', 'placeholders.json');
const placeholderPaths = new Set(
  fs.existsSync(placeholderFile)
    ? JSON.parse(fs.readFileSync(placeholderFile, 'utf8')).assets.map(asset => asset.path)
    : []
);

const sourceRaw = extractSourceReferences();
const sourceReferences = uniqueRecords(sourceRaw.filter(reference => reference.concrete)).map(reference => {
  const file = sourceFileFor(reference.path);
  return {
    ...reference,
    file: file ? path.relative(ROOT, file).replaceAll(path.sep, '/') : null,
    present: isPresent(file),
    placeholder: placeholderPaths.has(reference.path)
  };
});
const dynamicReferences = uniqueRecords(sourceRaw.filter(reference => !reference.concrete));

const renderedRaw = extractRenderedReferences();
const renderedReferences = uniqueRecords(renderedRaw).map(reference => {
  const file = distFileFor(reference.path);
  return {
    ...reference,
    file: path.relative(ROOT, file).replaceAll(path.sep, '/'),
    present: isPresent(file),
    placeholder: placeholderPaths.has(reference.path)
  };
});

function counts(references) {
  return {
    referenced: references.length,
    present: references.filter(reference => reference.present).length,
    missing: references.filter(reference => !reference.present).length,
    placeholders: references.filter(reference => reference.placeholder).length
  };
}

const renderedStatic = renderedReferences.filter(reference => reference.path.startsWith('/static/'));
const renderedRoot = renderedReferences.filter(reference => !reference.path.startsWith('/static/'));
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: {
    source: ['src/main/kotlin/**/*.kt', 'static/**/*.css', 'static/**/*.js'],
    rendered: fs.existsSync(DIST_DIR) ? 'dist/**/*.html' : null,
    note: 'Rendered references are concrete HTML src/href/poster/content URLs. Dynamic source templates are reported separately.'
  },
  summary: {
    source: counts(sourceReferences),
    renderedStatic: counts(renderedStatic),
    renderedRoot: counts(renderedRoot),
    renderedAll: counts(renderedReferences),
    dynamicSourcePatterns: dynamicReferences.length
  },
  sourceReferences,
  dynamicReferences,
  renderedReferences
};

const reportFile = path.join(STATIC_DIR, 'assets', 'asset-report.json');
fs.mkdirSync(path.dirname(reportFile), { recursive: true });
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');

console.log(`Source assets: ${report.summary.source.referenced} referenced, ${report.summary.source.present} present, ${report.summary.source.missing} missing.`);
if (renderedReferences.length) {
  console.log(`Rendered /static assets: ${report.summary.renderedStatic.referenced} referenced, ${report.summary.renderedStatic.present} present, ${report.summary.renderedStatic.missing} missing.`);
  console.log(`Rendered root assets: ${report.summary.renderedRoot.referenced} referenced, ${report.summary.renderedRoot.present} present, ${report.summary.renderedRoot.missing} missing.`);
}
console.log(`Machine report: ${path.relative(ROOT, reportFile)}`);

const missingRendered = renderedReferences.filter(reference => !reference.present);
if (missingRendered.length) {
  console.error('\nMissing rendered assets:');
  for (const reference of missingRendered) console.error(`  ${reference.path}`);
  if (!reportOnly) process.exitCode = 1;
}
