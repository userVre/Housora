const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const origin = process.argv[2] || 'https://housora.pages.dev';
const out = path.join(process.cwd(), 'audit-output', 'workspace');
fs.mkdirSync(out, { recursive: true });

const routes = ['/app/home', '/design', '/projects', '/reference-style', '/app/usage', '/app/plan'];
const devices = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, timeout: 60_000 });
  const report = [];
  for (const device of devices) {
    const context = await browser.newContext({ viewport: { width: device.width, height: device.height } });
    await context.addInitScript(() => {
      localStorage.setItem('housora-consent-v2', JSON.stringify({
        necessary: true,
        analytics: false,
        version: 2,
        timestamp: Date.now(),
        expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
      }));
      const user = {
        id: 'audit_user',
        fullName: 'Audit User',
        firstName: 'Audit',
        primaryEmailAddress: { emailAddress: 'audit@example.test' },
        imageUrl: '',
        getToken: async () => null,
      };
      window.Clerk = { loaded: true, user, addListener() {}, signOut: async () => {} };
      window.ClerkReady = true;
      window.housoraAuthState = { status: 'ready', error: null };
    });
    const page = await context.newPage();
    await page.route('**/static/vendor/clerk-js/**', route => route.abort());
    await page.route('**/static/js/clerk-bootstrap.js', route => route.abort());
    for (const route of routes) {
      const errors = [];
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(origin + route, { waitUntil: 'networkidle', timeout: 90_000 });
      await page.waitForTimeout(800);
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(400, innerHeight * 0.75)) {
          scrollTo(0, y);
          await new Promise(resolve => setTimeout(resolve, 120));
        }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(500);
      const safe = route.replace(/^\//, '').replaceAll('/', '-') || 'home';
      await page.screenshot({ path: path.join(out, `${device.name}-${safe}.png`), fullPage: true });
      const data = await page.evaluate(() => {
        const interactive = [...document.querySelectorAll('a,button,input,select,textarea,[role="button"],[role="radio"]')].map(el => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            name: (el.getAttribute('aria-label') || el.innerText || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 120),
            href: el.getAttribute('href') || '',
            disabled: Boolean(el.disabled),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        });
        const images = [...document.images].map(img => ({ src: img.getAttribute('src') || '', alt: img.alt, ok: img.complete && img.naturalWidth > 0 }));
        return {
          title: document.title,
          finalPath: location.pathname,
          width: document.documentElement.scrollWidth,
          viewport: innerWidth,
          interactive,
          images,
          h1: [...document.querySelectorAll('h1')].map(el => el.textContent.trim()),
          visibleSignIn: [...document.querySelectorAll('a')].some(el => el.offsetParent && /^sign in$/i.test(el.textContent.trim())),
          inertLabels: [...document.querySelectorAll('.show-more,.quality-arrow')].filter(el => el.offsetParent).map(el => el.textContent.trim()),
        };
      });
      report.push({ route, device: device.name, status: response?.status() || 0, errors, ...data });
    }
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  const summary = report.map(item => ({
    route: item.route,
    device: item.device,
    status: item.status,
    finalPath: item.finalPath,
    overflow: item.width > item.viewport,
    brokenImages: item.images.filter(image => !image.ok && image.src).length,
    consoleErrors: item.errors.length,
    visibleSignIn: item.visibleSignIn,
    inertLabels: item.inertLabels,
  }));
  console.log(JSON.stringify(summary, null, 2));
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
