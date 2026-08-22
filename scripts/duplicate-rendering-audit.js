const { chromium } = require('playwright');

const origin = (process.argv[2] || 'http://127.0.0.1:8081').replace(/\/$/, '');
const workspaceRoutes = new Set([
  '/app/home', '/design', '/projects', '/app/plan', '/app/usage', '/delete-account',
]);
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];
const themes = ['light'];
const keySections = {
  '/': ['.marketing-hero', '.create-tools-section', '.room-seo-section', '.faq-section'],
  '/pricing': ['.pricing-section', '.pricing-grid', '.pricing-faq-section'],
  '/examples': ['.examples-hero', '.examples-layout'],
  '/faq': ['.faq-page-section'],
  '/contact': ['.contact-page-section'],
  '/app/home': ['.workspace-home', '.workspace-creator', '.workspace-library-section', '.workspace-examples-section', '.workspace-likes-section'],
  '/design': ['.workspace-section'],
  '/projects': ['.projects-page'],
  '/app/plan': ['.workspace-plan-page', '.workspace-plan-grid'],
  '/app/usage': ['.workspace-usage-page', '.workspace-usage-summary'],
  '/delete-account': ['.legal-section'],
};

function fail(message, failures) {
  failures.push(message);
}

(async () => {
  const manifestResponse = await fetch(`${origin}/route-manifest.json`);
  if (!manifestResponse.ok) throw new Error(`Route manifest returned ${manifestResponse.status}`);
  const manifest = await manifestResponse.json();
  const routes = manifest.routes
    .filter(route => route.behavior === 'page' && route.path !== '/sign-out')
    .map(route => route.path);
  const browser = await chromium.launch({ headless: true });
  const failures = [];

  for (const viewport of viewports) {
    for (const theme of themes) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(selectedTheme => {
        localStorage.removeItem('housora-theme');
        localStorage.setItem('housora-consent-v2', JSON.stringify({
          necessary: true,
          analytics: false,
          version: 2,
          timestamp: Date.now(),
          expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
        }));
        const user = {
          id: 'duplicate_audit_user',
          firstName: 'Audit',
          emailAddresses: [{ emailAddress: 'audit@example.test' }],
          getToken: async () => null,
        };
        window.Clerk = { user, addListener() {}, openUserProfile() {} };
        window.ClerkReady = true;
        window.housoraAuthState = { status: 'ready', error: null };
        window.convexClient = {
          query: async name => name.includes('listProjects') ? [] : ({ plan: 'free', credits: 5, allowance: 5, used: 0 }),
          mutation: async () => null,
        };
      }, theme);
      await context.route('**/static/vendor/clerk-js/**', route => route.abort());
      await context.route('**/static/js/clerk-bootstrap.js', route => route.abort());
      await context.route('**/static/vendor/convex/**', route => route.abort());
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('pageerror', error => consoleErrors.push(error.message));

      for (const route of routes) {
        consoleErrors.length = 0;
        // The audit inspects deterministic page structure. Waiting for the DOM
        // avoids unrelated analytics or image requests making the test hang.
        const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await page.waitForTimeout(150);
        const state = await page.evaluate(() => {
          const visible = element => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          };
          const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
          const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
          return {
            h1: document.querySelectorAll('h1').length,
            publicHeaders: document.querySelectorAll('header.create-header').length,
            footers: document.querySelectorAll('footer.site-footer').length,
            visibleFooters: [...document.querySelectorAll('footer.site-footer')].filter(visible).length,
            workspaceShells: document.querySelectorAll('.workspace-app-shell').length,
            workspaceSidebars: document.querySelectorAll('.workspace-app-shell > .sidebar-nav').length,
            staleWorkspaceShells: document.querySelectorAll('.workspace-app-sidebar, .workspace-mobile-header, .workspace-mobile-backdrop').length,
            drawerOpen: document.querySelector('.workspace-app-shell > .sidebar-nav')?.classList.contains('open') || false,
            duplicateIds,
            initAgain: window.initHousoraPage && window.initHousoraPage(),
            theme: document.documentElement.getAttribute('data-theme'),
            themeToggles: document.querySelectorAll('.theme-toggle').length,
            simultaneousStates: [
              ['#workspaceHomeSkeletons', '#workspaceHomeEmpty'],
              ['#projectsSkeletons', '#projectsEmpty'],
              ['#projectsSkeletons', '#projectsAuthGate'],
              ['#projectsGrid', '#projectsEmpty'],
            ].filter(([left, right]) => {
              const a = document.querySelector(left);
              const b = document.querySelector(right);
              return a && b && visible(a) && visible(b);
            }),
          };
        });
        const label = `${viewport.name}/${theme} ${route}`;
        if (!response || response.status() !== 200) fail(`${label}: HTTP ${response?.status() || 0}`, failures);
        if (state.theme !== 'light') fail(`${label}: expected light theme, found ${state.theme}`, failures);
        if (state.themeToggles !== 0) fail(`${label}: found ${state.themeToggles} obsolete theme toggles`, failures);
        if (state.h1 !== 1) fail(`${label}: expected one H1, found ${state.h1}`, failures);
        if (state.duplicateIds.length) fail(`${label}: duplicate IDs ${state.duplicateIds.join(', ')}`, failures);
        if (state.initAgain !== false) fail(`${label}: initialization was not idempotent`, failures);
        if (state.theme !== theme) fail(`${label}: expected ${theme} theme, found ${state.theme}`, failures);
        if (state.simultaneousStates.length) fail(`${label}: mutually exclusive states are visible together`, failures);
        if (consoleErrors.length) fail(`${label}: console errors: ${consoleErrors.join(' | ')}`, failures);

        if (workspaceRoutes.has(route)) {
          if (state.workspaceShells !== 1 || state.workspaceSidebars !== 1 || state.publicHeaders !== 1) {
            fail(`${label}: expected one workspace wrapper/sidebar/header`, failures);
          }
          if (state.staleWorkspaceShells !== 0) fail(`${label}: stale workspace shell is present`, failures);
          if (state.visibleFooters !== 0) fail(`${label}: workspace footer is visible`, failures);
          if (viewport.name === 'mobile' && state.drawerOpen) fail(`${label}: mobile drawer starts open`, failures);
        } else {
          if (state.publicHeaders !== 1) fail(`${label}: expected one marketing header`, failures);
          if (state.footers !== 1 || state.visibleFooters !== 1) fail(`${label}: expected one visible marketing footer`, failures);
          if (state.workspaceShells || state.workspaceSidebars || state.staleWorkspaceShells) fail(`${label}: workspace shell leaked into public page`, failures);
        }

        for (const selector of keySections[route] || []) {
          const count = await page.locator(selector).count();
          if (count !== 1) fail(`${label}: expected one ${selector}, found ${count}`, failures);
        }
      }
      await context.close();
    }
  }

  await browser.close();
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log(`Duplicate-rendering audit passed for ${routes.length} routes at both viewports in light and dark mode.`);
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});

