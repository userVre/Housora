const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.SITE_URL || 'http://127.0.0.1:8082';
const coverage = require('./website-screenshots-complete/coverage.json');
const routes = [...new Set(coverage.pages.map(p => p.route))];
const viewports = { desktop: { width: 1440, height: 1000 }, tablet: { width: 834, height: 1112 }, mobile: { width: 390, height: 844 } };
const report = { baseUrl: BASE, generatedAt: new Date().toISOString(), pages: [], interactions: [], brokenInternalLinks: [] };

const consent = `localStorage.setItem('housora-consent-v1', JSON.stringify({necessary:true,preferences:false,analytics:false,marketing:false,version:1,timestamp:Date.now()}));`;

async function pageAudit(browser, viewportName, viewport, route) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(consent);
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', r => failedRequests.push({ url: r.url(), error: r.failure()?.errorText }));
  const response = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(800);
  const dom = await page.evaluate(() => {
    const visible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const interactive = [...document.querySelectorAll('a[href],button,input,select,textarea,[role=button]')].filter(visible);
    const brokenImages = [...document.images].filter(img => visible(img) && (!img.complete || img.naturalWidth === 0)).map(img => ({ src: img.getAttribute('src'), alt: img.alt }));
    const smallTargets = interactive.map(el => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 60), width: Math.round(r.width), height: Math.round(r.height) };
    }).filter(x => x.width > 0 && x.height > 0 && (x.width < 44 || x.height < 44));
    const unnamed = interactive.filter(el => !(el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim()).map(el => el.outerHTML.slice(0, 160));
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(h => ({ level: +h.tagName.slice(1), text: h.innerText.trim().slice(0, 100) }));
    const placeholderText = /coming soon|not currently offer|model context protocol integration/i.test(document.body.innerText);
    const toastText = [...document.querySelectorAll('body *')].find(el => visible(el) && /Authentication is not configured/.test(el.textContent || ''))?.textContent.trim() || '';
    return {
      title: document.title,
      viewportWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      brokenImages,
      smallTargets: smallTargets.slice(0, 40),
      unnamed: unnamed.slice(0, 20),
      duplicateIds,
      headings,
      h1Count: headings.filter(h => h.level === 1).length,
      placeholderText,
      authToast: toastText,
      textLength: document.body.innerText.trim().length,
      lang: document.documentElement.lang,
    };
  });
  report.pages.push({ viewport: viewportName, route, status: response?.status() || 0, consoleErrors, failedRequests, ...dom });
  await context.close();
}

async function interaction(browser, viewportName, viewport, name, route, action) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(consent);
  const page = await context.newPage();
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  let result;
  try { result = await action(page); }
  catch (error) { result = { pass: false, error: error.message }; }
  report.interactions.push({ viewport: viewportName, name, route, ...result });
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    for (const [viewportName, viewport] of Object.entries(viewports)) {
      for (const route of routes) {
        await pageAudit(browser, viewportName, viewport, route);
        console.log(`[audit] ${viewportName} ${route}`);
      }
    }
    for (const [viewportName, viewport] of Object.entries(viewports)) {
      await interaction(browser, viewportName, viewport, 'navigation drawer', '/', async page => {
        const toggle = page.locator('#sidebar-toggle');
        await toggle.click();
        return { pass: await page.locator('#sidebar').isVisible(), bodyScrollLocked: await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden') };
      });
      await interaction(browser, viewportName, viewport, 'pricing billing toggle', '/pricing', async page => {
        await page.locator('#yearlyBtn').click();
        return { pass: await page.locator('#yearlyBtn').getAttribute('aria-pressed') === 'true', caption: await page.locator('#billing-caption').innerText(), firstPrice: await page.locator('.price-amount').first().innerText().catch(() => '') };
      });
      await interaction(browser, viewportName, viewport, 'FAQ accordion', '/faq', async page => {
        const q = page.locator('.faq-question').first();
        await q.click();
        const answer = page.locator('.faq-answer').first();
        return { pass: await answer.isVisible(), ariaExpanded: await q.getAttribute('aria-expanded') };
      });
      await interaction(browser, viewportName, viewport, 'sign-in empty email', '/sign-in', async page => {
        await page.locator('.auth-email-btn').click();
        await page.waitForTimeout(200);
        return { pass: false, note: 'Button click completed', activeUrl: page.url(), visibleErrors: await page.locator('[role=alert],.error,.auth-error').allInnerTexts().catch(() => []) };
      });
      await interaction(browser, viewportName, viewport, 'create image upload', '/create', async page => {
        const selector = viewportName === 'mobile' ? '#heroFileInputMobile' : '#heroFileInput';
        await page.locator(selector).setInputFiles("inspiration/Capture d'écran 2026-07-19 231335.png");
        await page.waitForTimeout(400);
        return { pass: await page.locator(viewportName === 'mobile' ? '#heroPreviewMobile' : '#heroPreview').isVisible().catch(() => false), authToast: await page.locator('text=Authentication is not configured').count() > 0 };
      });
    }
  } finally { await browser.close(); }
  fs.writeFileSync('website-screenshots-complete/ux-audit-data.json', JSON.stringify(report, null, 2));
  const summary = {
    pages: report.pages.length,
    pagesWithAuthToast: report.pages.filter(p => p.authToast).length,
    pagesWithBrokenImages: report.pages.filter(p => p.brokenImages.length).length,
    brokenImageCount: report.pages.reduce((n,p) => n + p.brokenImages.length, 0),
    pagesWithOverflow: report.pages.filter(p => p.horizontalOverflow > 0).length,
    placeholderPages: report.pages.filter(p => p.placeholderText).length,
    pagesWithConsoleErrors: report.pages.filter(p => p.consoleErrors.length).length,
    pagesWithUnnamedControls: report.pages.filter(p => p.unnamed.length).length,
    pagesWithDuplicateIds: report.pages.filter(p => p.duplicateIds.length).length,
    pagesWithoutOneH1: report.pages.filter(p => p.h1Count !== 1).length,
    interactions: report.interactions,
  };
  console.log(JSON.stringify(summary, null, 2));
})();
