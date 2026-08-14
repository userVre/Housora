const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const { siteOrigin } = require('./test-config');

const origin = siteOrigin();
const routes = ['/', '/create', '/design', '/pricing', '/sign-in'];
const failures = [];

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    for (const route of routes) {
      const context = await browser.newContext();
      await context.addInitScript(() => {
        const now = Date.now();
        localStorage.setItem('housora-consent-v2', JSON.stringify({
          necessary: true,
          analytics: false,
          version: 2,
          timestamp: now,
          expiresAt: now + (180 * 24 * 60 * 60 * 1000),
        }));
      });
      const page = await context.newPage();
      const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (!response || response.status() >= 400) {
        failures.push(`${route}: HTTP ${response?.status() || 0}`);
        await context.close();
        continue;
      }
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const severe = result.violations.filter(violation => ['critical', 'serious'].includes(violation.impact));
      for (const violation of severe) {
        failures.push(`${route}: ${violation.id} (${violation.impact}, ${violation.nodes.length} node(s))`);
      }
      console.log(`${route}: ${result.violations.length} total violation rule(s), ${severe.length} serious/critical.`);
      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error('\nAccessibility smoke failures:');
    failures.forEach(failure => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log('\nAccessibility smoke passed with no serious or critical WCAG A/AA violations.');
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
