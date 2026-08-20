const { chromium } = require('playwright');

const target = process.argv[2] || 'https://codex-audit.housora.pages.dev/sign-in?redirect=%2Fapp%2Fhome';

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    timeout: 60_000,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const clerkResponses = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'failed' });
  });
  page.on('response', (response) => {
    if (/clerk|accounts\.dev/.test(response.url())) {
      clerkResponses.push({ status: response.status(), url: response.url() });
    }
  });

  await page.goto(target, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForTimeout(3_000);
  const state = await page.evaluate(() => ({
    auth: window.housoraAuthState || null,
    clerkType: typeof window.Clerk,
    clerkLoaded: Boolean(window.Clerk?.loaded),
    origin: location.origin,
  }));

  console.log(JSON.stringify({ state, consoleErrors, failedRequests, clerkResponses }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
