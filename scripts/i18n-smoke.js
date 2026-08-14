const { chromium } = require('playwright');
const { siteOrigin } = require('./test-config');

const languages = ['en', 'de', 'fr', 'ja', 'zh', 'es', 'ar', 'nl', 'ko', 'pt'];
const routes = ['/', '/pricing', '/faq', '/blog', '/interior-design'];
const consent = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  version: 2,
  timestamp: Date.now(),
  expiresAt: Date.now() + 15_552_000_000,
};

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const failures = [];
  try {
    for (const language of languages) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(({ language, consent }) => {
        localStorage.setItem('housora-lang', language);
        localStorage.setItem('housora-consent-v2', JSON.stringify(consent));
      }, { language, consent });
      const page = await context.newPage();
      const missing = [];
      page.on('console', message => {
        if (/missing translation/i.test(message.text())) missing.push(message.text());
      });
      for (const route of routes) {
        const response = await page.goto(siteOrigin() + route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(250);
        const state = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          title: document.title,
        }));
        if (response?.status() !== 200 || state.lang !== language || state.dir !== (language === 'ar' ? 'rtl' : 'ltr') || state.overflow > 0) {
          failures.push({ language, route, status: response?.status(), ...state });
        }
      }
      if (missing.length) failures.push({ language, missing: [...new Set(missing)] });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`Localization smoke passed: ${languages.length} languages × ${routes.length} representative routes, including RTL and mobile overflow.`);
  }
})();
