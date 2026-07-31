const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://housora.pages.dev';
const OUTPUT_DIR = path.join(__dirname, 'mywebsitescreenshoots');

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 }; // iPhone 14

const routes = [
  '/',
  '/create',
  '/workspace',
  '/projects',
  '/pricing',
  '/subscription',
  '/enterprise',
  '/refund-policy',
  '/terms',
  '/cookies',
  '/sign-in',
  '/sign-up',
  '/sign-out',
  '/delete-account',
  '/interior-design',
  '/layout-boost',
  '/exterior-design',
  '/garden-design',
  '/floor-restyle',
  '/wall-texture',
  '/video-walkthrough',
  '/floorplan-to-3d',
  '/photo-to-render',
  '/ai-stairs-design',
  '/stairs-design',
  '/ai-doors-design',
  '/doors-design',
  '/ai-windows-design',
  '/windows-design',
  '/ai-kitchen-design',
  '/kitchen-design',
  '/ai-bathroom-design',
  '/bathroom-design',
  '/blog',
  '/blog/exterior-colour-palettes',
  '/blog/planning-a-room-redesign',
  '/blog/photo-to-video-room-tour',
  '/blog/architecture-prompt-basics',
  '/blog/choosing-furniture-with-confidence',
  '/blog/garden-design-brief',
  '/blog/room-walkthrough-storytelling',
  '/blog/comparing-ai-design-tools',
  '/blog/black-doors-without-regret',
  '/examples',
  '/interior-design-examples',
  '/faq',
  '/contact',
  '/privacy',
  '/compare/housora-vs-reimaginehome',
  '/compare/housora-vs-homedesigns',
  '/compare/housora-vs-mnml',
  '/compare/housora-vs-homestyler',
  '/compare/housora-vs-planner5d',
  '/inspirations',
  '/referral',
  '/ai-interior-design-prompts',
  '/furniture-fit-calculator',
  '/api',
  '/cli',
  '/mcp',
  '/partnerships',
  '/embed-ai-interior-design',
  '/case-studies',
  '/affiliates',
  '/answers',
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function screenshotPage(browser, route, index, total) {
  const slug = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
  const page = await browser.newPage();

  // Desktop
  const desktopDir = path.join(OUTPUT_DIR, 'desktop');
  fs.mkdirSync(desktopDir, { recursive: true });
  await page.setViewportSize(DESKTOP);
  try {
    await page.goto(BASE_URL + route, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(desktopDir, `${String(index).padStart(2, '0')}-${slug}.png`), fullPage: true });
    console.log(`  [${index}/${total}] DESKTOP ${route} -> OK`);
  } catch (e) {
    console.log(`  [${index}/${total}] DESKTOP ${route} -> FAIL (${e.message.slice(0, 60)})`);
  }

  // Mobile
  const mobileDir = path.join(OUTPUT_DIR, 'mobile');
  fs.mkdirSync(mobileDir, { recursive: true });
  await page.setViewportSize(MOBILE);
  try {
    await page.goto(BASE_URL + route, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(mobileDir, `${String(index).padStart(2, '0')}-${slug}.png`), fullPage: true });
    console.log(`  [${index}/${total}] MOBILE  ${route} -> OK`);
  } catch (e) {
    console.log(`  [${index}/${total}] MOBILE  ${route} -> FAIL (${e.message.slice(0, 60)})`);
  }

  await page.close();
}

async function main() {
  console.log('=== Screenshot Tool for housora.pages.dev ===\n');
  console.log(`Desktop: ${DESKTOP.width}x${DESKTOP.height}`);
  console.log(`Mobile:  ${MOBILE.width}x${MOBILE.height}`);
  console.log(`Pages:   ${routes.length}\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (let i = 0; i < routes.length; i++) {
    await screenshotPage(browser, routes[i], i + 1, routes.length);
  }

  await browser.close();

  const desktopCount = fs.readdirSync(path.join(OUTPUT_DIR, 'desktop')).length;
  const mobileCount = fs.readdirSync(path.join(OUTPUT_DIR, 'mobile')).length;
  console.log(`\n=== Done! ${desktopCount} desktop + ${mobileCount} mobile screenshots saved ===`);
  console.log(`Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
