const { chromium } = require('playwright');
const { siteOrigin } = require('./scripts/test-config');

(async () => {
  const baseUrl = siteOrigin();
  const browser = await chromium.launch({ headless: true });
  const checks = [['mobile-workspace', 390, 844, '/design']];
  const results = [];
  for (const [name, width, height, path] of checks) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addInitScript(`localStorage.setItem('housora-consent-v1','{"necessary":true}')`);
    const page = await context.newPage();
    await page.goto(baseUrl + path, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/tmp/' + name + '.png', fullPage: true });
    results.push(await page.evaluate(name => ({
      name,
      url: location.pathname,
      title: document.querySelector('h1')?.textContent?.trim(),
      h1Count: document.querySelectorAll('h1').length,
      overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - innerWidth,
      authBanner: Boolean(document.getElementById('housora-auth-error')),
      offenders: [...document.querySelectorAll('body *')].filter(el => {
        const r = el.getBoundingClientRect();
        return r.right > innerWidth + 1;
      }).slice(0, 12).map(el => ({ tag: el.tagName, cls: el.className, left: Math.round(el.getBoundingClientRect().left), right: Math.round(el.getBoundingClientRect().right) })),
      canvasDebug: ['.canvas-area','.analyzing-overlay','.workspace-photo-grid','.canvas-actions'].map(sel => {
        const el = document.querySelector(sel); if (!el) return null;
        const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return { sel, left: r.left, right: r.right, width: r.width, display: s.display, position: s.position };
      }),
      textSample: document.body.innerText.replace(/\s+/g, ' ').slice(0, 240),
    }), name));
    await context.close();
  }
  const redirectContext = await browser.newContext();
  const redirectPage = await redirectContext.newPage();
  await redirectPage.goto(baseUrl + '/inspirations', { waitUntil: 'domcontentloaded' });
  results.push({ name: 'placeholder-redirect', url: new URL(redirectPage.url()).pathname });
  await redirectContext.close();
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
