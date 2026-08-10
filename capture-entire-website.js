const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.SITE_URL || 'http://127.0.0.1:8082';
const ROOT = path.join(__dirname, 'website-screenshots-complete');
const SAMPLE = path.join(__dirname, 'inspiration', "Capture d'écran 2026-07-19 231335.png");

const groups = [
  ['01-core', ['/', '/create', '/design', '/workspace', '/app', '/app/home', '/reference-style', '/pricing', '/subscription']],
  ['02-ai-tools', ['/interior-design', '/layout-boost', '/exterior-design', '/garden-design', '/floor-restyle', '/wall-texture', '/video-walkthrough', '/floorplan-to-3d', '/photo-to-render', '/ai-stairs-design', '/ai-doors-design', '/ai-windows-design', '/ai-kitchen-design', '/ai-bathroom-design']],
  ['03-account', ['/sign-in', '/sign-up', '/delete-account', '/projects', '/inspirations', '/referral']],
  ['04-discover', ['/examples', '/faq', '/contact', '/ai-interior-design-prompts', '/furniture-fit-calculator', '/answers']],
  ['05-blog', ['/blog', '/blog/exterior-colour-palettes', '/blog/planning-a-room-redesign', '/blog/photo-to-video-room-tour', '/blog/architecture-prompt-basics', '/blog/choosing-furniture-with-confidence', '/blog/garden-design-brief', '/blog/room-walkthrough-storytelling', '/blog/comparing-ai-design-tools', '/blog/black-doors-without-regret']],
  ['06-compare', ['/compare/housora-vs-reimaginehome', '/compare/housora-vs-homedesigns', '/compare/housora-vs-mnml', '/compare/housora-vs-homestyler', '/compare/housora-vs-planner5d']],
  ['07-business-developers', ['/enterprise', '/partnerships', '/case-studies', '/affiliates', '/api', '/cli', '/mcp']],
  ['08-legal', ['/privacy', '/terms', '/refund-policy', '/cookies']],
];

const viewports = [
  ['desktop', { width: 1440, height: 1000 }],
  ['tablet', { width: 834, height: 1112 }],
  ['mobile', { width: 390, height: 844 }],
];

const report = { baseUrl: BASE, generatedAt: new Date().toISOString(), pages: [], states: [], failures: [] };
const safe = p => p === '/' ? 'home' : p.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '');
const mkdir = p => fs.mkdirSync(p, { recursive: true });
const pause = ms => new Promise(r => setTimeout(r, ms));
const CONSENT_SCRIPT = `localStorage.setItem('housora-consent-v1', JSON.stringify({necessary:true,preferences:false,analytics:false,marketing:false,version:1,timestamp:Date.now()}));`;

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    document.querySelectorAll('img').forEach(img => { if (img.loading === 'lazy') img.loading = 'eager'; });
  });
  await page.waitForTimeout(500);
}

async function shot(page, file, fullPage = true) {
  mkdir(path.dirname(file));
  await page.screenshot({ path: file, fullPage, animations: 'disabled' });
}

async function visit(page, route) {
  const response = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await settle(page);
  return response ? response.status() : 0;
}

async function capturePages(browser) {
  for (const [viewportName, viewport] of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: 'light' });
    await context.addInitScript(CONSENT_SCRIPT);
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    for (const [group, routes] of groups) {
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        const file = path.join(ROOT, viewportName, group, `${String(i + 1).padStart(2, '0')}-${safe(route)}.png`);
        try {
          const status = await visit(page, route);
          await shot(page, file);
          const size = fs.statSync(file).size;
          report.pages.push({ viewport: viewportName, group, route, status, file: path.relative(ROOT, file), bytes: size });
          console.log(`[page] ${viewportName} ${status} ${route}`);
        } catch (error) {
          report.failures.push({ viewport: viewportName, route, error: error.message });
          console.log(`[FAIL] ${viewportName} ${route}: ${error.message}`);
        }
      }
    }
    await context.close();
  }
}

async function stateCapture(page, viewportName, order, slug, note, fullPage = false) {
  const file = path.join(ROOT, viewportName, '00-flows', `${String(order).padStart(2, '0')}-${slug}.png`);
  await shot(page, file, fullPage);
  report.states.push({ viewport: viewportName, slug, note, file: path.relative(ROOT, file) });
  console.log(`[flow] ${viewportName} ${slug}`);
}

async function captureFlows(browser) {
  for (const [viewportName, viewport] of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: 'light' });
    await context.addInitScript(CONSENT_SCRIPT);
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    let n = 1;
    try {
      await visit(page, '/');
      await page.locator('#cookiebot-panel').evaluate(el => { el.style.display = 'flex'; el.style.visibility = 'visible'; }).catch(() => {});
      await stateCapture(page, viewportName, n++, 'cookie-consent', 'First-visit cookie consent choices');
      await page.locator('#cookiebot-panel').evaluate(el => { el.style.display = 'none'; }).catch(() => {});
      const menu = page.locator('#sidebar-toggle');
      if (await menu.isVisible().catch(() => false)) {
        await menu.click(); await pause(300);
        await stateCapture(page, viewportName, n++, 'navigation-open', 'Responsive navigation/sidebar opened');
      }

      await visit(page, '/create');
      const createInput = page.locator(viewportName === 'mobile' ? '#heroFileInputMobile' : '#heroFileInput');
      if (await createInput.count() && fs.existsSync(SAMPLE)) {
        await createInput.setInputFiles(SAMPLE); await pause(700);
        await stateCapture(page, viewportName, n++, 'create-upload-preview', 'Create flow after selecting a room image');
      }
      await page.locator('#first-design').scrollIntoViewIfNeeded().catch(() => {});
      await stateCapture(page, viewportName, n++, 'create-configurator-start', 'Room configurator: upload, room, style, budget');
      const demoInput = page.locator('#demoPhotoInput');
      if (await demoInput.count() && fs.existsSync(SAMPLE)) {
        await demoInput.setInputFiles(SAMPLE); await pause(500);
        await page.locator('[data-room="bedroom"]').first().click().catch(() => {});
        await page.locator('[data-style="scandinavian"]').first().click().catch(() => {});
        await page.locator('#budgetSlider').evaluate(el => { el.value = '12000'; el.dispatchEvent(new Event('input', { bubbles: true })); }).catch(() => {});
        await stateCapture(page, viewportName, n++, 'create-configurator-complete', 'Configurator with photo and design choices selected');
      }

      await visit(page, '/workspace');
      await page.locator('[data-room="bedroom"]').first().click().catch(() => {});
      await page.locator('[data-style="modern"]').first().click().catch(() => {});
      await page.locator('[data-palette="warm"]').first().click().catch(() => {});
      await page.locator('#workspaceBudget').evaluate(el => { el.value = '15000'; el.dispatchEvent(new Event('input', { bubbles: true })); }).catch(() => {});
      await stateCapture(page, viewportName, n++, 'workspace-selections', 'Workspace after room, style, palette, and budget selection', true);

      await visit(page, '/reference-style');
      const inputs = page.locator('input[type=file]');
      for (let i = 0; i < await inputs.count(); i++) await inputs.nth(i).setInputFiles(SAMPLE).catch(() => {});
      await pause(500);
      await stateCapture(page, viewportName, n++, 'reference-images-selected', 'Reference style flow after image selection', true);

      await visit(page, '/pricing');
      await page.locator('#yearlyBtn').click().catch(() => {}); await pause(300);
      await stateCapture(page, viewportName, n++, 'pricing-yearly', 'Pricing switched to yearly billing', true);

      await visit(page, '/faq');
      const faq = page.locator('.faq-question').first();
      if (await faq.count()) { await faq.click(); await pause(250); }
      await stateCapture(page, viewportName, n++, 'faq-expanded', 'FAQ with an answer expanded');

      await visit(page, '/sign-in');
      const email = page.locator('input[type=email]');
      if (await email.count()) await email.fill('visitor@example.com');
      await stateCapture(page, viewportName, n++, 'sign-in-email-entered', 'Sign-in flow before external authentication');
    } catch (error) {
      report.failures.push({ viewport: viewportName, flow: true, error: error.message });
    }
    await context.close();
  }
}

function writeIndex() {
  fs.writeFileSync(path.join(ROOT, 'coverage.json'), JSON.stringify(report, null, 2));
  const rows = report.pages.map(p => `<tr><td>${p.viewport}</td><td>${p.group}</td><td>${p.route}</td><td>${p.status}</td><td><a href="${p.file}"><img loading="lazy" src="${p.file}"></a></td></tr>`).join('\n');
  const states = report.states.map(s => `<article><h3>${s.viewport}: ${s.note}</h3><a href="${s.file}"><img loading="lazy" src="${s.file}"></a></article>`).join('\n');
  const html = `<!doctype html><meta charset="utf-8"><title>Housora complete screenshot archive</title><style>body{font:14px system-ui;margin:24px;background:#f5f5f3;color:#222}h1{margin-bottom:4px}.summary{margin-bottom:24px}table{border-collapse:collapse;width:100%;background:white}th,td{padding:8px;border:1px solid #ddd;text-align:left;vertical-align:top}img{width:220px;max-height:260px;object-fit:cover;object-position:top;border:1px solid #ccc}article{display:inline-block;width:280px;vertical-align:top;margin:8px;padding:12px;background:white}article img{width:100%}</style><h1>Housora — complete website screenshots</h1><p class="summary">${report.pages.length} page captures + ${report.states.length} flow-state captures across desktop, tablet, and mobile. Generated ${report.generatedAt}.</p><h2>Interactive flow states</h2>${states}<h2>Every page</h2><table><thead><tr><th>Viewport</th><th>Group</th><th>Route</th><th>HTTP</th><th>Screenshot</th></tr></thead><tbody>${rows}</tbody></table>`;
  fs.writeFileSync(path.join(ROOT, 'index.html'), html);
  fs.writeFileSync(path.join(ROOT, 'README.md'), `# Housora complete screenshot archive\n\nGenerated: ${report.generatedAt}\n\n- Page captures: ${report.pages.length}\n- Flow-state captures: ${report.states.length}\n- Failures: ${report.failures.length}\n- Viewports: desktop 1440x1000, tablet 834x1112, mobile 390x844\n\nOpen index.html for the ordered visual catalogue. See coverage.json for the machine-readable audit.\n`);
}

(async () => {
  mkdir(ROOT);
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { await capturePages(browser); await captureFlows(browser); }
  finally { await browser.close(); writeIndex(); }
  console.log(`Done: ${report.pages.length} pages, ${report.states.length} states, ${report.failures.length} failures`);
  if (report.failures.length) process.exitCode = 2;
})();
