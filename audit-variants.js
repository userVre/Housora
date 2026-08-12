const { chromium } = require('playwright');
const fs = require('fs');
const { siteOrigin } = require('./scripts/test-config');

const BASE = siteOrigin();

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  fs.mkdirSync('/tmp/housora-variants', { recursive: true });
  for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } })) {
    for (const route of ['/', '/pricing', '/interior-design']) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(`localStorage.setItem('housora-consent-v1','{"necessary":true}');localStorage.setItem('housora-theme','dark')`);
      const page = await context.newPage();
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `/tmp/housora-variants/${name}-${route === '/' ? 'home' : route.slice(1)}-dark.png`, fullPage: false });
      await context.close();
    }
  }
  for (const lang of ['es', 'ar']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(`localStorage.setItem('housora-consent-v1','{"necessary":true}');localStorage.setItem('housora-lang','${lang}')`);
    const page = await context.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `/tmp/housora-variants/mobile-home-${lang}.png`, fullPage: false });
    console.log(lang, await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.querySelector('h1')?.innerText })));
    await context.close();
  }
  await browser.close();
})();
