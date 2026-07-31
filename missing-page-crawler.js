const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE = 'http://localhost:8081';
const SCREENSHOT_DIR = path.join(__dirname, 'mywebsitescreenshoots');
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

async function run() {
    const missing = [
        { url: `${SITE}/sign-in`, name: 'sign-in' }
    ];

    console.log(`\n=== CRAWLING MISSING PAGE: /sign-in ===\n`);

    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.setDefaultTimeout(25000);

    for (const item of missing) {
        const normalized = normalizeUrl(item.url);
        if (visited.has(normalized)) {
            console.log(`  [=] Already visited: ${item.name}`);
            continue;
        }
        try {
            await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await sleep(2500);

            const status = await page.evaluate(() => document.title);
            console.log(`  Page title: ${status}`);

            const mainSs = path.join(SCREENSHOT_DIR, `${sanitize(item.name)}_main.png`);
            await page.screenshot({ path: mainSs, fullPage: true });
            console.log(`  [+] ${item.name}_main.png`);

            await scrollFullPage(page);
            const scrollSs = path.join(SCREENSHOT_DIR, `${sanitize(item.name)}_scroll.png`);
            await page.screenshot({ path: scrollSs, fullPage: false });
            console.log(`  [+] ${item.name}_scroll.png`);

            visited.add(normalized);
            fs.writeFileSync(VISITED_FILE, JSON.stringify([...visited], null, 0));
        } catch (e) {
            console.log(`  [!] Failed: ${e.message.substring(0, 100)}`);
        }
    }

    console.log(`\nTotal screenshots: ${fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).length}`);
    await browser.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
