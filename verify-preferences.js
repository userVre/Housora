const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    localStorage.setItem('housora-consent-v1', '{"necessary":true}');
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8082/', { waitUntil: 'domcontentloaded' });

  const touchTargets = await page.evaluate(() => {
    const size = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };
    return { theme: size('.theme-toggle'), language: size('.lang-selector-btn') };
  });
  assert.ok(touchTargets.theme.width >= 44 && touchTargets.theme.height >= 44);
  assert.ok(touchTargets.language.height >= 44);

  await page.click('.theme-toggle');
  assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
  assert.equal(await page.evaluate(() => localStorage.getItem('housora-theme')), 'dark');
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
  await page.click('.theme-toggle');
  assert.equal(await page.getAttribute('html', 'data-theme'), 'light');

  await page.click('.lang-selector-btn');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('.lang-option[data-lang="es"]')
  ]);
  assert.equal(await page.getAttribute('html', 'lang'), 'es');
  assert.equal(await page.getAttribute('html', 'dir'), 'ltr');
  assert.match(await page.locator('.marketing-intro h2').innerText(), /Rediseña/);
  assert.match(await page.title(), /Rediseña/);

  await page.click('.lang-selector-btn');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('.lang-option[data-lang="ar"]')
  ]);
  assert.equal(await page.getAttribute('html', 'lang'), 'ar');
  assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
  assert.match(await page.locator('.marketing-intro h2').innerText(), /أعد تصميم/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `RTL page overflows horizontally by ${overflow}px`);

  await page.evaluate(() => window.HousoraI18n.setTheme('dark'));
  await page.goto('http://127.0.0.1:8082/interior-design', { waitUntil: 'domcontentloaded' });
  const toolColors = await page.evaluate(() => ({
    hero: getComputedStyle(document.querySelector('.hero-mobile-banner')).backgroundColor,
    canvas: getComputedStyle(document.querySelector('.id-configure-right')).backgroundColor,
    title: getComputedStyle(document.querySelector('.hero-mobile-title')).color,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  assert.equal(toolColors.hero, 'rgb(17, 17, 19)');
  assert.equal(toolColors.canvas, 'rgb(28, 28, 32)');
  assert.equal(toolColors.title, 'rgb(244, 244, 245)');
  assert.ok(toolColors.overflow <= 1);

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await desktopContext.addInitScript(() => {
    localStorage.setItem('housora-consent-v1', '{"necessary":true}');
    localStorage.setItem('housora-theme', 'dark');
    localStorage.setItem('housora-lang', 'en');
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://127.0.0.1:8082/interior-design', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForTimeout(400);
  const desktop = await desktopPage.evaluate(() => {
    const header = document.querySelector('.create-header');
    const rect = header.getBoundingClientRect();
    return {
      header: { top: rect.top, width: rect.width, height: rect.height, display: getComputedStyle(header).display },
      logoVisible: !!document.querySelector('.create-logo')?.getClientRects().length,
      themeVisible: !!document.querySelector('.theme-toggle')?.getClientRects().length,
      languageVisible: !!document.querySelector('.lang-selector-btn')?.getClientRects().length,
      mediaFallback: document.querySelector('.hero-split-layout')?.classList.contains('hero-media-unavailable'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  assert.equal(desktop.header.display, 'flex');
  assert.ok(desktop.header.width >= 1400 && desktop.header.height >= 56);
  assert.ok(desktop.logoVisible && desktop.themeVisible && desktop.languageVisible);
  assert.ok(desktop.mediaFallback);
  assert.ok(desktop.overflow <= 1);
  await desktopContext.close();

  console.log(JSON.stringify({ touchTargets, language: 'ar', theme: 'dark', toolColors, desktop }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
