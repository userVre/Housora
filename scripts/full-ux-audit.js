const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'audit-output', 'full-ux');
const ORIGIN = (process.env.SITE_URL || 'https://housora.pages.dev').replace(/\/$/, '');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist', 'route-manifest.json'), 'utf8'));
const routes = manifest.routes.filter(route => route.behavior === 'page' && route.export).map(route => route.path);

fs.mkdirSync(OUTPUT, { recursive: true });

const devices = [
  { name: 'desktop', viewport: { width: 1440, height: 1000 }, isMobile: false },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true },
];

const consentScript = () => {
  const now = Date.now();
  localStorage.setItem('housora-consent-v2', JSON.stringify({
    necessary: true,
    analytics: false,
    version: 2,
    timestamp: now,
    expiresAt: now + (180 * 24 * 60 * 60 * 1000),
  }));
};

function routeName(route) {
  return route === '/' ? 'home' : route.replace(/^\//, '').replace(/[/?=&]+/g, '-');
}

async function inspectPage(page, route, device) {
  return page.evaluate(({ route, device }) => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const label = element => (element.getAttribute('aria-label') || element.textContent || element.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 140);
    const selectors = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])')];
    const interactive = selectors.filter(visible).map(element => {
      const rect = element.getBoundingClientRect();
      const tag = element.tagName.toLowerCase();
      const name = label(element);
      return {
        tag,
        name,
        href: tag === 'a' ? element.getAttribute('href') : null,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        tooSmall: rect.width < 44 || rect.height < 44,
        unnamed: !name && !element.getAttribute('aria-labelledby'),
      };
    });
    const images = [...document.images].map(image => {
      const rect = image.getBoundingClientRect();
      return {
        src: image.currentSrc || image.src,
        alt: image.getAttribute('alt'),
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
        visible: visible(image),
        placeholder: /placeholder|visual-pending|pending/i.test(image.currentSrc || image.src || ''),
      };
    });
    const fields = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter(visible).map(field => {
      const id = field.id;
      const hasLabel = Boolean(field.getAttribute('aria-label') || field.getAttribute('aria-labelledby') || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || field.closest('label'));
      return { tag: field.tagName.toLowerCase(), type: field.type || '', id, name: field.name || '', hasLabel, placeholder: field.placeholder || '' };
    });
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(heading => ({ level: Number(heading.tagName[1]), text: heading.textContent.trim().replace(/\s+/g, ' ').slice(0, 160) }));
    const headingSkips = headings.slice(1).flatMap((heading, index) => heading.level > headings[index].level + 1 ? [{ from: headings[index], to: heading }] : []);
    const overflowElements = [...document.querySelectorAll('main *, footer *, header *')].filter(visible).flatMap(element => {
      const style = getComputedStyle(element);
      if (element.scrollWidth <= element.clientWidth + 2 || ['auto', 'scroll'].includes(style.overflowX)) return [];
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.width > document.documentElement.clientWidth * 1.05) return [];
      return [{ tag: element.tagName.toLowerCase(), className: String(element.className || '').slice(0, 120), text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100), overflow: Math.round(element.scrollWidth - element.clientWidth) }];
    }).slice(0, 30);
    const sections = [...document.querySelectorAll('main > section, .create-main > section')].filter(visible).map(section => {
      const rect = section.getBoundingClientRect();
      return { className: String(section.className || ''), height: Math.round(rect.height), top: Math.round(rect.top + scrollY) };
    });
    const resources = performance.getEntriesByType('resource');
    return {
      route,
      device,
      title: document.title,
      finalPath: location.pathname + location.search,
      viewport: { width: innerWidth, height: innerHeight },
      documentSize: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      interactive,
      images,
      fields,
      headings,
      headingSkips,
      overflowElements,
      sections,
      resources: {
        count: resources.length,
        transferBytes: Math.round(resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0)),
        imageBytes: Math.round(resources.filter(entry => entry.initiatorType === 'img').reduce((sum, entry) => sum + (entry.transferSize || 0), 0)),
        scriptBytes: Math.round(resources.filter(entry => entry.initiatorType === 'script').reduce((sum, entry) => sum + (entry.transferSize || 0), 0)),
      },
    };
  }, { route, device });
}

async function interactionChecks(browser) {
  const checks = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(consentScript);
  const page = await context.newPage();
  async function check(route, name, action) {
    try {
      await page.goto(ORIGIN + route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(300);
      const result = await action(page);
      checks.push({ route, name, ok: Boolean(result), result });
    } catch (error) {
      checks.push({ route, name, ok: false, error: error.message });
    }
  }
  await check('/', 'AI Tools dropdown opens', async p => {
    const trigger = p.locator('#ai-tools-btn');
    if (!await trigger.count()) return 'missing trigger';
    await trigger.click();
    return await trigger.getAttribute('aria-expanded') === 'true' && await p.locator('#ai-tools-dropdown').isVisible();
  });
  await check('/', 'Language menu opens', async p => {
    const trigger = p.locator('.lang-selector-btn').first();
    if (!await trigger.count()) return 'missing trigger';
    await trigger.click();
    return await p.locator('.lang-dropdown, .language-dropdown').first().isVisible().catch(() => false);
  });
  await check('/', 'Site stays light-only without a theme control', async p => {
    const theme = await p.locator('html').getAttribute('data-theme');
    const toggles = await p.locator('.theme-toggle').count();
    return theme === 'light' && toggles === 0;
  });
  await check('/pricing', 'Billing toggle changes state', async p => {
    const yearly = p.locator('#yearlyBtn');
    const monthly = p.locator('#monthlyBtn');
    if (!await yearly.count() || !await monthly.count()) return 'missing controls';
    await yearly.click();
    const yearlyActive = await yearly.evaluate(element => element.classList.contains('active') || element.getAttribute('aria-pressed') === 'true');
    await monthly.click();
    const monthlyActive = await monthly.evaluate(element => element.classList.contains('active') || element.getAttribute('aria-pressed') === 'true');
    return yearlyActive && monthlyActive;
  });
  await check('/faq', 'FAQ accordion opens', async p => {
    const trigger = p.locator('.faq-question').first();
    if (!await trigger.count()) return 'missing trigger';
    await trigger.click();
    const expanded = await trigger.getAttribute('aria-expanded');
    const answerVisible = await p.locator('.faq-answer').first().isVisible().catch(() => false);
    return expanded === 'true' || answerVisible;
  });
  await check('/sign-in', 'Empty email submission shows recovery guidance', async p => {
    const submit = p.locator('#clerk-email-btn');
    if (!await submit.count()) return false;
    await submit.click();
    await p.waitForTimeout(250);
    const error = p.locator('[role="alert"], .auth-error, .field-error');
    return await error.count() > 0 && await error.first().isVisible();
  });
  await check('/app/home', 'Protected workspace sends signed-out users to sign in', async p => {
    return new URL(p.url()).pathname === '/sign-in' && await p.locator('#clerk-email-input').isVisible();
  });
  await context.close();
  return checks;
}

async function recordJourney(browser) {
  const videoDir = path.join(OUTPUT, 'video');
  fs.mkdirSync(videoDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } },
  });
  await context.addInitScript(consentScript);
  const page = await context.newPage();
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.locator('#ai-tools-btn').click().catch(() => {});
  await page.waitForTimeout(700);
  await page.goto(ORIGIN + '/examples', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.goto(ORIGIN + '/pricing', { waitUntil: 'networkidle' });
  await page.locator('#yearlyBtn').click().catch(() => {});
  await page.waitForTimeout(700);
  await page.goto(ORIGIN + '/interior-design', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.goto(ORIGIN + '/design', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = { origin: ORIGIN, generatedAt: new Date().toISOString(), routes: [], interactions: [], summary: {} };
  try {
    for (const device of devices) {
      const screenshotDir = path.join(OUTPUT, device.name);
      fs.mkdirSync(screenshotDir, { recursive: true });
      const context = await browser.newContext({ viewport: device.viewport, isMobile: device.isMobile, deviceScaleFactor: 1 });
      await context.addInitScript(consentScript);
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      const requestFailures = [];
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('requestfailed', request => requestFailures.push({ url: request.url(), error: request.failure()?.errorText || 'failed' }));
      for (const route of routes) {
        consoleErrors.length = 0;
        pageErrors.length = 0;
        requestFailures.length = 0;
        const response = await page.goto(ORIGIN + route, { waitUntil: 'networkidle', timeout: 45_000 }).catch(() => null);
        await page.waitForTimeout(250);
        await page.evaluate(async () => {
          const step = Math.max(320, Math.floor(window.innerHeight * 0.8));
          for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise(resolve => setTimeout(resolve, 35));
          }
          window.scrollTo(0, 0);
        });
        await page.evaluate(async () => {
          const images = Array.from(document.images).filter(image => image.src);
          await Promise.race([
            Promise.all(images.map(image => image.complete
              ? Promise.resolve()
              : new Promise(resolve => {
                  image.addEventListener('load', resolve, { once: true });
                  image.addEventListener('error', resolve, { once: true });
                }))),
            new Promise(resolve => setTimeout(resolve, 5000)),
          ]);
        });
        await page.waitForTimeout(250);
        const result = await inspectPage(page, route, device.name);
        result.httpStatus = response?.status() || 0;
        result.consoleErrors = [...new Set(consoleErrors)];
        result.pageErrors = [...new Set(pageErrors)];
        result.requestFailures = requestFailures.filter(item => !/ERR_ABORTED/i.test(item.error));
        report.routes.push(result);
        await page.screenshot({ path: path.join(screenshotDir, `${routeName(route)}.png`), fullPage: true });
        process.stdout.write(`AUDIT ${device.name} ${route}\n`);
      }
      await context.close();
    }
    report.interactions = await interactionChecks(browser);
    await recordJourney(browser);
  } finally {
    await browser.close();
  }
  report.summary = {
    routeChecks: report.routes.length,
    httpFailures: report.routes.filter(item => item.httpStatus >= 400 || item.httpStatus === 0).length,
    consoleErrorPages: report.routes.filter(item => item.consoleErrors.length || item.pageErrors.length).length,
    requestFailurePages: report.routes.filter(item => item.requestFailures.length).length,
    horizontalOverflowPages: report.routes.filter(item => item.horizontalOverflow).length,
    brokenImages: report.routes.reduce((sum, item) => sum + item.images.filter(image => image.visible && image.naturalWidth === 0).length, 0),
    placeholderImages: report.routes.reduce((sum, item) => sum + item.images.filter(image => image.placeholder).length, 0),
    unlabeledFields: report.routes.reduce((sum, item) => sum + item.fields.filter(field => !field.hasLabel).length, 0),
    unnamedControls: report.routes.reduce((sum, item) => sum + item.interactive.filter(control => control.unnamed).length, 0),
    smallControls: report.routes.reduce((sum, item) => sum + item.interactive.filter(control => control.tooSmall).length, 0),
    headingSkips: report.routes.reduce((sum, item) => sum + item.headingSkips.length, 0),
    failedInteractions: report.interactions.filter(check => !check.ok).length,
  };
  fs.writeFileSync(path.join(OUTPUT, 'report.json'), JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify(report.summary, null, 2)}\n`);
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
