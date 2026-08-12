const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifest = require('../package.json');
const lock = require('../package-lock.json');

function versionOf(packageName, suffix = packageName) {
  return lock.packages[`node_modules/${suffix}`]?.version || 'not installed';
}

const report = {
  classification: {
    production: Object.keys(manifest.dependencies || {}),
    buildAndTestOnly: Object.keys(manifest.devDependencies || {}),
  },
  advisoryTraces: [
    {
      packages: `@clerk/clerk-js@${versionOf('@clerk/clerk-js')} -> @solana/wallet-adapter-react -> react-native@${versionOf('react-native')} -> metro@${versionOf('metro')} -> image-size@${versionOf('image-size')}`,
      usage: 'Build-only: scripts/build-assets.js copies Clerk\'s prebuilt browser distribution; Housora does not import React Native or Metro.',
      disposition: 'Excluded from production installs/audits by classifying Clerk as a devDependency. Keep the supported Clerk 6 line; do not apply npm\'s suggested major downgrade.',
    },
    {
      packages: `posthog-js@${versionOf('posthog-js')} -> dompurify@${versionOf('dompurify')}`,
      usage: 'Build-only: scripts/build-assets.js copies PostHog\'s prebuilt classic browser distribution.',
      disposition: 'DOMPurify 3.4.12 is the current patched release resolved by the pinned PostHog build input; the entire chain is dev-only.',
    },
    {
      packages: `@clerk/clerk-js@${versionOf('@clerk/clerk-js')} -> @solana/web3.js -> jayson -> uuid@${versionOf('uuid')}`,
      usage: 'Peer-installed wallet support below Clerk; no Housora source imports uuid or the Solana adapters.',
      disposition: 'Deferred in the development tree: GHSA-w5hq-g745-h8pq affects uuid before 11.1.1. Overriding jayson\'s uuid across a major boundary is not supported by its declared range; production is not exposed.',
    },
  ],
  directUsage: {
    convex: 'Convex backend and deployment tooling',
    'posthog-node': 'Cloudflare Functions runtime import',
    '@clerk/clerk-js': 'browser-vendor build input',
    'posthog-js': 'browser-vendor build input',
    playwright: 'route, interaction, screenshot, and accessibility audits',
    sharp: 'asset build pipeline',
    vitest: 'unit-test runner',
    'convex-test': 'Convex unit-test harness',
    '@edge-runtime/vm': 'Vitest edge-runtime environment',
    '@axe-core/playwright': 'accessibility smoke audit',
  },
  deferredUpgrades: [
    {
      package: '@clerk/clerk-js',
      risk: 'The supported Clerk 6 line still declares Solana wallet adapters whose auto-installed peer tree contains the React Native/Metro and uuid advisory paths.',
      nextStep: 'Upgrade the pinned browser SDK and ASSET_MANIFEST together in a product-asset change; do not accept npm audit fix --force changing Clerk across a major line.',
    },
    {
      package: 'posthog-node / Node.js',
      risk: `posthog-node ${versionOf('posthog-node')} declares Node ^20.20.0 or >=22.22.0, while this verification environment is ${process.version}.`,
      nextStep: 'Raise and verify the deployment Node runtime before taking a newer PostHog Node SDK.',
    },
    {
      package: 'Gradle / Kotlin / Ktor',
      risk: 'Ktor 2.x build plugins still call Convention, ConfigureUtil, JavaPluginConvention, and ApplicationPluginConvention APIs scheduled for removal in Gradle 9.',
      nextStep: 'Keep Gradle 8.5 until a Ktor 3/Kotlin 2 migration has JVM tests and route-crawl compatibility coverage; the Gradle 8.14/Ktor 2 patch trial did not complete the build gate reliably.',
    },
  ],
  notes: [
    'No direct dependency is unused; each has a concrete source or package-script consumer.',
    'Run npm run audit:npm for the full development graph and npm run audit:npm:production for deployable dependencies.',
  ],
};

console.log(JSON.stringify(report, null, 2));
