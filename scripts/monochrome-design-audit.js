const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const origin = (process.env.SITE_URL || 'http://localhost:8082').replace(/\/$/, '');
const output = path.join(process.cwd(), 'audit-output', 'monochrome-design');
const routes = ['/', '/pricing', '/examples', '/interior-design', '/sign-in', '/contact', '/faq', '/blog'];
const devices = [
  { name: 'desktop', viewport: { width: 1440, height: 1000 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
];
const themes = ['light'];

fs.mkdirSync(output, { recursive: true });

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

function nameFor(route) {
  return route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
}

async function inspect(page) {
  return page.evaluate(() => {
    const visible = element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const rgb = value => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? match.slice(1, 4).map(Number) : null;
    };
    const saturated = value => {
      const channels = rgb(value);
      return channels && Math.max(...channels) - Math.min(...channels) > 22;
    };
    const coloredChrome = [...document.querySelectorAll('header *, main button, main input, main textarea, main select, main a, footer *')]
      .filter(visible)
      .filter(element => {
        const style = getComputedStyle(element);
        return saturated(style.color) || saturated(style.backgroundColor) || saturated(style.borderColor);
      })
      .slice(0, 20)
      .map(element => ({
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 100),
        text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
        color: getComputedStyle(element).color,
        background: getComputedStyle(element).backgroundColor,
      }));
    const images = [...document.images].filter(image => image.getAttribute('src'));
    const header = document.querySelector('.create-header, header');
    return {
      title: document.title,
      path: location.pathname,
      h1: document.querySelector('h1')?.textContent.trim() || '',
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      brokenImages: images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.currentSrc || image.src),
      coloredChrome,
      headerBackground: header ? getComputedStyle(header).backgroundColor : null,
      theme: document.documentElement.getAttribute('data-theme'),
      themeToggles: document.querySelectorAll('.theme-toggle').length,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const report = [];
  try {
    for (const device of devices) {
      const context = await browser.newContext({ viewport: device.viewport });
      await context.addInitScript(consentScript);
      const page = await context.newPage();
      for (const theme of themes) {
        for (const route of routes) {
          const errors = [];
          page.removeAllListeners('console');
          page.removeAllListeners('pageerror');
          page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
          page.on('pageerror', error => errors.push(error.message));
          const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => null);
          await page.evaluate(selected => {
            localStorage.setItem('theme', selected);
            document.documentElement.setAttribute('data-theme', selected);
          }, theme);
          await page.waitForTimeout(700);
          await page.evaluate(() => scrollTo(0, Math.min(document.documentElement.scrollHeight, innerHeight * 1.5)));
          await page.waitForTimeout(120);
          const scrolledHeaderBackground = await page.locator('.create-header, header').first().evaluate(element => getComputedStyle(element).backgroundColor).catch(() => null);
          await page.evaluate(() => scrollTo(0, 0));
          await page.waitForTimeout(80);
          const data = await inspect(page).catch(error => ({ inspectionError: error.message }));
          const entry = {
            route,
            device: device.name,
            theme,
            status: response?.status() || 0,
            scrolledHeaderBackground,
            consoleErrors: [...new Set(errors)],
            ...data,
          };
          report.push(entry);
          await page.screenshot({
            path: path.join(output, `${device.name}-${theme}-${nameFor(route)}.png`),
            fullPage: true,
          });
          process.stdout.write(`DESIGN ${device.name} ${theme} ${route}\n`);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  const failures = report.filter(item => item.status !== 200 || item.theme !== 'light' || item.themeToggles || item.overflow || item.brokenImages?.length || item.consoleErrors?.length || item.inspectionError);
  const colored = report.filter(item => item.coloredChrome?.length);
  console.log(JSON.stringify({ checks: report.length, failures, colored }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
