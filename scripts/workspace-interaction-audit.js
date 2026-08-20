const { chromium } = require('playwright');

const origin = process.argv[2] || 'https://housora.pages.dev';

async function snapshot(page) {
  return page.evaluate(() => ({
    url: location.href,
    scrollY,
    bodyClass: document.body.className,
    activeTabs: [...document.querySelectorAll('.tab-item.tab-active, .tab-item.active')].map(el => el.textContent.trim()),
    visibleEditorPanels: [...document.querySelectorAll('.workspace-main, .workspace-side-panel')]
      .filter(el => getComputedStyle(el).display !== 'none').length,
  }));
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    localStorage.setItem('housora-consent-v2', JSON.stringify({
      necessary: true, analytics: false, version: 2,
      timestamp: Date.now(), expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
    }));
    const user = {
      id: 'audit_user', fullName: 'Audit User', firstName: 'Audit', imageUrl: '',
      primaryEmailAddress: { emailAddress: 'audit@example.test' }, getToken: async () => null,
    };
    window.Clerk = { loaded: true, user, addListener() {}, signOut: async () => {} };
    window.ClerkReady = true;
    window.housoraAuthState = { status: 'ready', error: null };
  });
  const page = await context.newPage();
  await page.route('**/static/vendor/clerk-js/**', route => route.abort());
  await page.route('**/static/js/clerk-bootstrap.js', route => route.abort());
  const results = {};

  await page.goto(origin + '/app/home', { waitUntil: 'networkidle' });
  const topCta = page.getByRole('button', { name: 'START FREE DESIGN' });
  const beforeTop = await snapshot(page);
  await topCta.click();
  await page.waitForTimeout(250);
  results.appHomeTopCta = { before: beforeTop, after: await snapshot(page) };
  results.appHomePrimaryLinks = await page.locator('a').evaluateAll(els => els
    .filter(el => /NEW DESIGN|CREATE YOUR FIRST DESIGN/.test(el.textContent))
    .map(el => ({ text: el.textContent.trim(), href: el.getAttribute('href') })));
  results.appHomeCards = await page.locator('.app-home-card').evaluateAll(els => els.map(el => ({
    text: el.textContent.trim().replace(/\s+/g, ' '), href: el.getAttribute('href'),
  })));

  await page.goto(origin + '/design', { waitUntil: 'networkidle' });
  results.designEmpty = {
    uploadHref: await page.getByRole('link', { name: 'UPLOAD ROOM PHOTO' }).getAttribute('href'),
    bodyClass: await page.locator('body').getAttribute('class'),
  };
  await page.locator('body').evaluate(el => el.classList.remove('workspace-empty'));
  results.designControls = await page.locator('.workspace-shell button, .workspace-shell [role="button"], .workspace-shell .show-more, .workspace-shell .quality-arrow')
    .evaluateAll(els => els.map(el => ({
      text: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' '),
      tag: el.tagName, role: el.getAttribute('role'), tabindex: el.getAttribute('tabindex'),
    })));
  for (const label of ['Edit design', 'Download design', 'Share design']) {
    const control = page.locator(`[aria-label="${label}"]`);
    const before = await snapshot(page);
    if (await control.count()) await control.evaluate(el => el.click());
    await page.waitForTimeout(100);
    results[`design${label.replaceAll(' ', '')}`] = { count: await control.count(), before, after: await snapshot(page) };
  }
  const uploadFurniture = page.locator('.upload-furniture-btn');
  results.designUploadFurnitureExists = await uploadFurniture.count();
  if (await uploadFurniture.count()) {
    const before = await snapshot(page);
    await uploadFurniture.evaluate(el => el.click());
    await page.waitForTimeout(100);
    results.designUploadFurniture = { before, after: await snapshot(page) };
  }
  const tabs = page.locator('.tab-item');
  results.designTabs = [];
  for (let i = 0; i < await tabs.count(); i++) {
    const tab = tabs.nth(i);
    const name = (await tab.textContent()).trim();
    await tab.evaluate(el => el.click());
    await page.waitForTimeout(80);
    results.designTabs.push({ name, state: await snapshot(page) });
  }
  results.designPseudoControls = await page.locator('.show-more, .quality-arrow').evaluateAll(els => els.map(el => ({
    text: el.textContent.trim(), tag: el.tagName, role: el.getAttribute('role'), tabindex: el.getAttribute('tabindex'),
  })));
  results.designCustomPalette = await page.locator('.palette-option').filter({ hasText: 'Custom' }).evaluate(el => ({
    tag: el.tagName, role: el.getAttribute('role'), controls: el.querySelectorAll('input[type="color"], button').length,
  }));

  await page.goto(origin + '/reference-style', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'GENERATE MY DESIGN' }).click();
  await page.waitForTimeout(100);
  results.referenceEmptySubmit = {
    errors: await page.locator('.reference-field-error').allTextContents(),
    invalidZones: await page.locator('[aria-invalid="true"]').count(),
    focusedId: await page.evaluate(() => document.activeElement?.id || ''),
  };

  for (const route of ['/app/usage', '/app/plan']) {
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    results[route] = await page.evaluate(() => ({
      stylesheets: [...document.styleSheets].map(sheet => sheet.href || 'inline'),
      links: [...document.querySelectorAll('link[rel="stylesheet"]')].map(el => el.href),
      bodyFont: getComputedStyle(document.body).fontFamily,
      bodyMargin: getComputedStyle(document.body).margin,
      firstNodes: [...document.body.children].slice(0, 8).map(el => ({ tag: el.tagName, cls: el.className, id: el.id })),
      duplicateHeaders: document.querySelectorAll('header, .site-header, .app-header').length,
      duplicateMenus: document.querySelectorAll('.mobile-menu, .mobile-sidebar, .workspace-sidebar').length,
    }));
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
