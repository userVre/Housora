const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

class WebsiteCrawler {
    constructor(baseUrl, options = {}) {
        this.baseUrl = this.normalizeUrl(baseUrl);
        this.outputDir = options.outputDir || path.join(__dirname, 'screenshots');
        this.screenshotDelay = options.screenshotDelay || 500;
        this.scrollDelay = options.scrollDelay || 300;
        this.visitedUrls = new Set();
        this.visitedPages = new Map();
        this.screenshotCount = 0;
        this.baseDomain = new URL(baseUrl).hostname;
        this.browser = null;
        this.page = null;
        this.visitedFile = path.join(this.outputDir, '_visited_urls.json');
        this.sampleImage = this.findSampleImage();
    }

    normalizeUrl(url) {
        try {
            const urlObj = new URL(url);
            // Remove fragment (#), trailing slash, and normalize
            urlObj.hash = '';
            let normalized = urlObj.toString();
            // Remove trailing slash
            if (normalized.endsWith('/')) {
                normalized = normalized.slice(0, -1);
            }
            return normalized;
        } catch (e) {
            return url;
        }
    }

    findSampleImage() {
        const downloadsPath = path.join(require('os').homedir(), 'Downloads');
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'];
        
        try {
            const files = fs.readdirSync(downloadsPath);
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (imageExtensions.includes(ext)) {
                    return path.join(downloadsPath, file);
                }
            }
        } catch (e) {}
        
        return this.createSampleImage();
    }

    createSampleImage() {
        const samplePath = path.join(this.outputDir, '_sample_room.png');
        if (!fs.existsSync(samplePath)) {
            const pngHeader = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
                0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
                0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
                0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC,
                0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
                0x44, 0xAE, 0x42, 0x60, 0x82
            ]);
            fs.writeFileSync(samplePath, pngHeader);
        }
        return samplePath;
    }

    async init() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        this.loadVisitedUrls();

        this.browser = await chromium.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        this.page = await this.context.newPage();
    }

    loadVisitedUrls() {
        try {
            if (fs.existsSync(this.visitedFile)) {
                const data = JSON.parse(fs.readFileSync(this.visitedFile, 'utf8'));
                data.forEach(url => this.visitedUrls.add(this.normalizeUrl(url)));
                console.log(`📂 Loaded ${this.visitedUrls.size} previously visited URLs`);
            }
        } catch (e) {
            console.log('📂 Starting fresh visit list');
        }
    }

    saveVisitedUrls() {
        try {
            fs.writeFileSync(this.visitedFile, JSON.stringify([...this.visitedUrls], null, 2));
        } catch (e) {}
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getSafeFilename(url, suffix = '') {
        const urlObj = new URL(url);
        let filename = urlObj.hostname + urlObj.pathname;
        filename = filename.replace(/[^a-zA-Z0-9]/g, '_');
        filename = filename.replace(/_+/g, '_');
        filename = filename.substring(0, 100);
        return `${filename}${suffix}.png`;
    }

    async takeScreenshot(url, suffix = '') {
        const filename = this.getSafeFilename(url, suffix);
        const filepath = path.join(this.outputDir, filename);

        try {
            await this.page.screenshot({
                path: filepath,
                fullPage: false
            });
            this.screenshotCount++;
            console.log(`📸 Screenshot ${this.screenshotCount}: ${filename}`);
            return filepath;
        } catch (error) {
            return null;
        }
    }

    async scrollAndScreenshot(url, pageName) {
        console.log(`🔍 Scrolling and capturing: ${url}`);

        try {
            const pageHeight = await this.page.evaluate(() => document.body.scrollHeight);
            const viewportHeight = await this.page.evaluate(() => window.innerHeight);
            const scrollPositions = [];

            for (let position = 0; position < pageHeight; position += viewportHeight) {
                scrollPositions.push(position);
            }

            for (let i = 0; i < scrollPositions.length; i++) {
                try {
                    await this.page.evaluate((pos) => window.scrollTo(0, pos), scrollPositions[i]);
                    await this.sleep(this.scrollDelay);

                    const suffix = scrollPositions.length > 1 ? `_scroll_${i + 1}` : '';
                    const filename = this.getSafeFilename(url, suffix);
                    const filepath = path.join(this.outputDir, filename);

                    await this.page.screenshot({
                        path: filepath,
                        fullPage: false
                    });
                    this.screenshotCount++;
                    console.log(`📸 Screenshot ${this.screenshotCount}: ${filename}`);
                } catch (e) {}
            }

            await this.page.evaluate(() => window.scrollTo(0, 0));
        } catch (e) {}
    }

    async getClickableElements() {
        try {
            return await this.page.evaluate(() => {
                const clickableSelectors = [
                    'a[href]',
                    'button',
                    '[role="button"]',
                    '[onclick]',
                    '.btn',
                    '.button',
                    'input[type="submit"]',
                    'input[type="button"]',
                    '[data-action]',
                    '[data-toggle]'
                ];

                const elements = [];
                const seen = new Set();

                clickableSelectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => {
                        if (!seen.has(el) && el.offsetParent !== null) {
                            seen.add(el);

                            let href = el.href || '';
                            let text = el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('title') || '';
                            let isVisible = el.offsetParent !== null;

                            if (isVisible && text.length > 100) {
                                text = text.substring(0, 100) + '...';
                            }

                            elements.push({
                                tagName: el.tagName.toLowerCase(),
                                text: text,
                                href: href,
                                selector: generateUniqueSelector(el)
                            });
                        }
                    });
                });

                function generateUniqueSelector(el) {
                    if (el.id) return `#${el.id}`;
                    if (el.name) return `${el.tagName.toLowerCase()}[name="${el.name}"]`;

                    let path = [];
                    let current = el;
                    while (current && current !== document.body) {
                        let selector = current.tagName.toLowerCase();
                        if (current.id) {
                            selector = `#${current.id}`;
                            path.unshift(selector);
                            break;
                        }
                        if (current.className && typeof current.className === 'string') {
                            const classes = current.className.split(' ').filter(c => c && !c.match(/^[0-9]/));
                            if (classes.length > 0) {
                                selector += '.' + classes.slice(0, 2).join('.');
                            }
                        }
                        path.unshift(selector);
                        current = current.parentElement;
                    }
                    return path.join(' > ');
                }

                return elements;
            });
        } catch (e) {
            return [];
        }
    }

    async getFileInputs() {
        try {
            return await this.page.evaluate(() => {
                const inputs = document.querySelectorAll('input[type="file"]');
                return Array.from(inputs).map((el, i) => ({
                    selector: el.id ? `#${el.id}` : `input[type="file"]:nth-of-type(${i + 1})`,
                    accept: el.accept || '',
                    id: el.id || `file-input-${i}`
                }));
            });
        } catch (e) {
            return [];
        }
    }

    async handleFileUpload(fileInput) {
        if (!this.sampleImage) {
            return false;
        }

        try {
            const inputHandle = await this.page.$(fileInput.selector);
            if (inputHandle) {
                console.log(`📤 Uploading sample image...`);
                await inputHandle.setInputFiles(this.sampleImage);
                await this.sleep(2000);
                return true;
            }
        } catch (e) {}
        return false;
    }

    async safeClick(elementHandle) {
        try {
            await elementHandle.scrollIntoViewIfNeeded();
            await this.sleep(200);
            await elementHandle.click({ timeout: 5000 });
            return true;
        } catch (e) {
            return false;
        }
    }

    async crawl(url, depth = 0, pageName = 'page') {
        const normalizedUrl = this.normalizeUrl(url);
        
        if (this.visitedUrls.has(normalizedUrl)) {
            return;
        }

        this.visitedUrls.add(normalizedUrl);
        this.saveVisitedUrls();
        console.log(`\n🌐 Crawling (depth ${depth}): ${normalizedUrl}`);

        try {
            await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            await this.sleep(this.screenshotDelay);

            await this.takeScreenshot(normalizedUrl, '_initial');
            await this.scrollAndScreenshot(normalizedUrl, pageName);

            this.visitedPages.set(normalizedUrl, {
                name: pageName,
                depth: depth,
                timestamp: new Date().toISOString()
            });

            // Handle file uploads
            const fileInputs = await this.getFileInputs();
            if (fileInputs.length > 0) {
                console.log(`📁 Found ${fileInputs.length} file input(s) - uploading image...`);
                for (const fileInput of fileInputs) {
                    const uploaded = await this.handleFileUpload(fileInput);
                    if (uploaded) {
                        await this.sleep(2000);
                        await this.takeScreenshot(normalizedUrl, '_after_upload');
                        
                        // Try to click submit button
                        try {
                            const submitBtn = await this.page.$('button[type="submit"], button:has-text("Generate"), button:has-text("Boost"), button:has-text("Analyze"), button:has-text("Apply")');
                            if (submitBtn) {
                                const btnText = await submitBtn.textContent();
                                console.log(`🖱️ Clicking: ${btnText}`);
                                await submitBtn.click();
                                await this.sleep(5000);
                                await this.takeScreenshot(normalizedUrl, '_after_submit');
                            }
                        } catch (e) {}
                    }
                }
            }

            // Get clickable elements
            const clickableElements = await this.getClickableElements();
            console.log(`🔗 Found ${clickableElements.length} clickable elements`);

            // Process clickable elements
            for (const element of clickableElements) {
                let targetUrl = element.href;

                // Click buttons
                if (!targetUrl && (element.tagName === 'button' || element.selector.includes('[onclick]'))) {
                    console.log(`🖱️ Clicking: ${element.text || element.selector}`);

                    try {
                        const elementHandle = await this.page.$(element.selector);
                        if (elementHandle) {
                            const clicked = await this.safeClick(elementHandle);
                            if (clicked) {
                                await this.sleep(this.screenshotDelay);

                                const clickedName = (element.text || 'click').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
                                await this.takeScreenshot(normalizedUrl, `_clicked_${clickedName}`);

                                const newUrl = this.page.url();
                                if (this.normalizeUrl(newUrl) !== normalizedUrl) {
                                    await this.crawl(newUrl, depth + 1, clickedName);

                                    try {
                                        await this.page.goBack({ timeout: 10000 });
                                        await this.sleep(this.screenshotDelay);
                                    } catch (e) {
                                        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                                        await this.sleep(this.screenshotDelay);
                                    }
                                }
                            }
                        }
                    } catch (error) {}
                }

                // Follow links
                if (targetUrl) {
                    try {
                        const absoluteUrl = this.normalizeUrl(new URL(targetUrl, url).toString());
                        const linkDomain = new URL(absoluteUrl).hostname;

                        if (linkDomain === this.baseDomain && !this.visitedUrls.has(absoluteUrl)) {
                            const linkText = element.text || 'link';
                            const linkName = linkText.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
                            await this.crawl(absoluteUrl, depth + 1, linkName);
                        }
                    } catch (error) {}
                }
            }

        } catch (error) {
            console.error(`❌ Error crawling ${normalizedUrl}: ${error.message.substring(0, 80)}`);
        }
    }

    async run() {
        console.log('🚀 Starting website crawler (NO LIMITS - RESUMABLE)...');
        console.log(`📍 Target: ${this.baseUrl}`);
        console.log(`📁 Output: ${this.outputDir}`);
        console.log(`📂 Previously visited: ${this.visitedUrls.size} URLs`);
        console.log(`🖼️ Sample image: ${this.sampleImage ? 'Found' : 'Will create'}`);
        console.log('');

        await this.init();
        await this.crawl(this.baseUrl, 0, 'homepage');

        console.log('\n✅ Crawling complete!');
        console.log(`📸 Total screenshots taken: ${this.screenshotCount}`);
        console.log(`🌐 Total URLs visited: ${this.visitedUrls.size}`);
        console.log(`📁 Screenshots saved to: ${this.outputDir}`);

        await this.browser.close();
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: node screenshot-crawler.js <URL> [options]');
        console.log('');
        console.log('Options:');
        console.log('  --output-dir <dir>    Output directory (default: ./screenshots)');
        console.log('  --delay <ms>          Delay between actions in ms (default: 500)');
        console.log('  --reset               Clear visited list and start fresh');
        console.log('  --fresh               Ignore old visited list, keep old screenshots');
        process.exit(1);
    }

    const url = args[0];
    const options = {};

    for (let i = 1; i < args.length; i += 2) {
        switch (args[i]) {
            case '--output-dir':
                options.outputDir = args[i + 1];
                break;
            case '--delay':
                options.screenshotDelay = parseInt(args[i + 1]);
                break;
            case '--reset':
                const outputFile = options.outputDir || path.join(__dirname, 'screenshots');
                const visitedFile = path.join(outputFile, '_visited_urls.json');
                if (fs.existsSync(visitedFile)) {
                    fs.unlinkSync(visitedFile);
                    console.log('🗑️ Cleared visited URLs list');
                }
                break;
            case '--fresh':
                options.fresh = true;
                break;
        }
    }

    const crawler = new WebsiteCrawler(url, options);
    
    // If --fresh, clear visited list but keep screenshots
    if (options.fresh) {
        const visitedFile = path.join(crawler.outputDir, '_visited_urls.json');
        if (fs.existsSync(visitedFile)) {
            fs.unlinkSync(visitedFile);
            console.log('🗑️ Cleared visited URLs (keeping screenshots)');
        }
    }
    
    await crawler.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WebsiteCrawler;
