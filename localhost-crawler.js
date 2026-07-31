const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE = 'http://127.0.0.1:8081';
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
        return u.origin + u.pathname.replace(/\/+$/, '');
    } catch { return url; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function takeScrollingScreenshots(page, url, name) {
    const normalized = normalizeUrl(url);
    if (visited.has(normalized)) return { pages: 0, screenshots: 0 };
    let count = 0;
    try {
        const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 40000 });
        await sleep(2500);

        if (resp && resp.status() === 404) {
            console.log(`  [404] ${name}`);
            visited.add(normalized);
            fs.writeFileSync(VISITED_FILE, JSON.stringify([...visited], null, 0));
            return { pages: 0, screenshots: 0 };
        }

        const finalUrl = normalizeUrl(page.url());
        if (visited.has(finalUrl)) return { pages: 0, screenshots: 0 };

        // Click all buttons/dropdowns to reveal hidden content
        try {
            const buttons = await page.$$('button, [data-toggle], [data-dropdown], .dropdown, .accordion, details');
            for (const btn of buttons) {
                try {
                    const isVisible = await btn.isVisible();
                    if (isVisible) {
                        await btn.click().catch(() => {});
                        await sleep(300);
                    }
                } catch {}
            }
        } catch {}

        // Get page dimensions after clicks
        const { scrollHeight, viewportHeight } = await page.evaluate(() => ({
            scrollHeight: document.body.scrollHeight,
            viewportHeight: window.innerHeight
        }));

        const overlap = 150;
        const step = viewportHeight - overlap;
        const numScreenshots = Math.max(1, Math.ceil((scrollHeight - overlap) / step));

        console.log(`  [+] ${name} (${numScreenshots} screenshots, ${scrollHeight}px)`);

        for (let i = 0; i < numScreenshots; i++) {
            const scrollY = i * step;
            await page.evaluate((y) => window.scrollTo(0, y), scrollY);
            await sleep(400);
            const ssPath = path.join(SCREENSHOT_DIR, `${sanitize(name)}_${String(i + 1).padStart(2, '0')}.png`);
            await page.screenshot({ path: ssPath, fullPage: false });
            count++;
        }

        visited.add(finalUrl);
        visited.add(normalized);
        fs.writeFileSync(VISITED_FILE, JSON.stringify([...visited], null, 0));
    } catch (e) {
        console.log(`  [!] Failed ${name}: ${e.message.substring(0, 80)}`);
    }
    return { pages: 1, screenshots: count };
}

async function discoverAllLinks(page, url) {
    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await sleep(2000);

        // Click dropdowns/toggles to reveal hidden links
        try {
            const toggles = await page.$$('button, [data-toggle], [data-dropdown], .dropdown-toggle, .nav-toggle, #ai-tools-btn');
            for (const t of toggles) {
                try {
                    const isVisible = await t.isVisible();
                    if (isVisible) {
                        await t.click().catch(() => {});
                        await sleep(300);
                    }
                } catch {}
            }
        } catch {}

        const links = await page.evaluate(() => {
            return [...document.querySelectorAll('a[href]')].map(a => a.href);
        });
        return links.filter(l => l.startsWith(SITE) && !l.includes('/static/'));
    } catch { return []; }
}

async function run() {
    const knownPages = [
        '/', '/affiliate', '/ai-information', '/answers', '/api', '/b2b',
        '/bathroom-design', '/blog', '/cli',
        '/compare/housora-vs-homedesigns', '/compare/housora-vs-homestyler',
        '/compare/housora-vs-mnml', '/compare/housora-vs-planner5d',
        '/compare/housora-vs-reimaginehome', '/contact', '/cookie-policy',
        '/creations', '/design', '/doors-design', '/examples', '/enterprise',
        '/exterior-design', '/faq', '/fit-calculator', '/floor-restyle',
        '/floorplan-to-3d', '/garden-design', '/inspirations', '/interior-design',
        '/kitchen-design', '/layout-boost', '/mcp', '/partnerships',
        '/photo-to-render', '/pricing', '/privacy', '/projects',
        '/prompt-generator', '/referral', '/refund', '/sign-in',
        '/stairs-design', '/style-quiz', '/terms', '/video-walkthrough',
        '/wall-texture', '/windows-design', '/workspace'
    ];

    console.log(`\n=== LOCALHOST CRAWLER: ${knownPages.length} pages ===\n`);

    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.setDefaultTimeout(30000);

    let totalPages = 0;
    let totalScreenshots = 0;

    // Phase 1: Crawl all known pages
    console.log('--- Phase 1: All pages ---');
    for (const p of knownPages) {
        const url = SITE + p;
        const name = p === '/' ? 'home' : p.replace(/\//g, '_').substring(1);
        const result = await takeScrollingScreenshots(page, url, name);
        totalPages += result.pages;
        totalScreenshots += result.screenshots;
    }

    // Phase 2: Discover links from each page
    console.log('\n--- Phase 2: Discovering hidden links ---');
    let allLinks = new Set();
    for (const p of knownPages) {
        const links = await discoverAllLinks(page, SITE + p);
        for (const l of links) {
            const normalized = normalizeUrl(l);
            if (!visited.has(normalized)) allLinks.add(l);
        }
    }
    console.log(`Found ${allLinks.size} new links`);
    for (const link of allLinks) {
        const pathPart = new URL(link).pathname;
        const name = pathPart === '/' ? 'home' : pathPart.replace(/\//g, '_').substring(1);
        const result = await takeScrollingScreenshots(page, link, name);
        totalPages += result.pages;
        totalScreenshots += result.screenshots;
    }

    const totalFiles = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).length;
    console.log(`\n=== DONE ===`);
    console.log(`Pages crawled: ${totalPages}`);
    console.log(`Screenshots taken: ${totalScreenshots}`);
    console.log(`Total files in folder: ${totalFiles}`);

    await browser.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
