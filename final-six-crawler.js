const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE = 'https://www.housora.pages.dev';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const VISITED_FILE = path.join(SCREENSHOT_DIR, '_visited_urls.json');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
let visited = new Set();
if (fs.existsSync(VISITED_FILE)) {
    try { visited = new Set(JSON.parse(fs.readFileSync(VISITED_FILE, 'utf8'))); } catch {}
}

function sanitize(str) {
    return str.replace(/https?:\/\//, '').replace(/[#?].*/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 150);
}

function normalizeUrl(url) {
    try {
        const u = new URL(url);
        return u.origin + u.pathname.replace(/\/+$/, '') + u.hash;
    } catch { return url; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scrollFullPage(page) {
    const height = await page.evaluate(() => document.body.scrollHeight);
    let current = 0;
    while (current < height) {
        current += 1000;
        await page.evaluate((y) => window.scrollTo(0, y), current);
        await sleep(500);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
}

async function takePageScreenshots(page, url, name) {
    const normalized = normalizeUrl(url);
    if (visited.has(normalized)) return 0;
    let count = 0;
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(2500);
        const finalUrl = normalizeUrl(page.url());
        if (visited.has(finalUrl)) return 0;

        const mainSs = path.join(SCREENSHOT_DIR, `${sanitize(name)}_main.png`);
        await page.screenshot({ path: mainSs, fullPage: true });
        count++;
        console.log(`  [+] ${name}`);

        await scrollFullPage(page);
        const scrollSs = path.join(SCREENSHOT_DIR, `${sanitize(name)}_scroll.png`);
        if (!fs.existsSync(scrollSs)) {
            await page.screenshot({ path: scrollSs, fullPage: false });
            count++;
        }

        visited.add(finalUrl);
        visited.add(normalized);
        fs.writeFileSync(VISITED_FILE, JSON.stringify([...visited], null, 0));
    } catch (e) {
        console.log(`  [!] Failed ${name}: ${e.message.substring(0, 80)}`);
    }
    return count;
}

async function run() {
    const missing = [
        { url: `${SITE}/blog/feature-wall-ideas-2026`, name: 'blog_feature_wall_ideas_2026' },
        { url: `${SITE}/blog/ai-exterior-design-visualize-home-before-renovating`, name: 'blog_ai_exterior_design_visualize_home_before_renovating' },
        { url: `${SITE}/blog/home-ai-features-daily-life`, name: 'home_ai_features_daily_life' },
        { url: `${SITE}/blog/claude-code-mcp-architects-interior-designers`, name: 'claude_code_mcp_architects_interior_designers' },
        { url: `${SITE}/blog/wayfair-furniture-trends-2026`, name: 'wayfair_furniture_trends_2026' },
        { url: `${SITE}/blog/best-ai-garden-design-tools-free`, name: 'best_ai_garden_design_tools_free' }
    ];

    console.log(`\n=== FINAL 6 MISSING BLOGS (${missing.length}) ===\n`);

    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.setDefaultTimeout(25000);

    let totalNew = 0;
    for (const item of missing) {
        totalNew += await takePageScreenshots(page, item.url, item.name);
    }

    console.log(`\n=== DONE. New screenshots: ${totalNew} ===`);
    console.log(`Total screenshots: ${fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).length}`);
    await browser.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
