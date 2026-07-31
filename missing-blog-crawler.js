const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class MissingBlogCrawler {
    constructor() {
        this.outputDir = path.join(__dirname, 'screenshots');
        this.screenshotDelay = 500;
        this.scrollDelay = 300;
        this.screenshotCount = 0;
        this.browser = null;
        this.page = null;

        this.missingBlogs = [
            'exterior-house-colors-2026', 'pottery-barn-furniture-trends-2026',
            'ashley-furniture-trends-2026', 'veo-3-real-estate-listing-videos',
            'interior-ai-alternatives', 'black-interior-doors-ideas-visualize',
            'faux-olive-trees-interior-design', 'best-wayfair-furniture-2026',
            'best-amazon-furniture-2026', 'how-much-time-ai-saves-architects',
            'metal-interior-design-ideas', 'ai-interior-design-shop-the-look-where-to-buy',
            'anatomy-of-a-photorealistic-interior-render', 'ai-interior-design-lighting-prompts',
            'ai-workflow-for-interior-designers', 'how-to-furnish-an-apartment-on-a-budget',
            'sell-furniture-internationally-localized-product-pages', 'funhaus-interior-design-2026',
            'artlist-ai-real-estate', 'average-furniture-prices-2026',
            'statement-ceiling-ideas-2026', 'best-ai-space-planning-tools-architects',
            'how-much-does-it-cost-to-furnish-a-one-bedroom-apartment', 'neo-deco-interior-design-2026',
            'how-small-studios-win-clients-with-ai', 'what-is-architectural-rendering',
            'best-ai-architectural-rendering-tools', 'ikea-furniture-trends-2026',
            'best-roomgpt-alternatives-2026', 'kondela-ai-furniture-visualization',
            'what-is-bim', 'will-sofa-fit-through-door-calculator',
            'reimaginehome-alternatives', 'two-slovaks-built-ai-interior-design-tool-us',
            'living-room-cost-by-style-2026', 'best-ai-sketchup-plugins-2026',
            'airbnb-design-ideas-stand-out', 'ai-tools-for-architecture-studios-2026',
            'top-interior-design-studios-england', 'best-ai-wall-color-tools-2026',
            'ai-interior-design-data-study-2026', 'higgsfield-real-estate-walkthrough-videos',
            'midjourney-interior-design-prompts', 'ai-interior-design-app',
            'master-bedroom-design-ideas-2026', 'housora-ai-partners-yit-herrys-vi-group-slovakia',
            'room-lighting-guide-questions-answered', 'ai-interior-design-api-available-housora',
            'pet-friendly-interior-design-dogs-cats-guide', 'awkward-room-layout-l-shaped-narrow-dark-solutions',
            'dark-moody-interior-design-ideas-guide-2026', 'interior-designer-answers-chatgpt-questions',
            'biophilic-interior-design-guide', 'real-estate-photography-ai-virtual-staging',
            'ai-home-design-house-flippers-visualize-renovation', 'ai-garden-furniture-design-outdoor-patio',
            'entryway-ideas-design-styles-ai', 'interior-design-ideas',
            'home-designer-2026-save-1000-dollars', 'room-designer-ai-tool-2026',
            'nursery-design-ideas-ai-baby-room', 'redesign-rental-apartment-ai-no-renovation',
            'airbnb-interior-design-rental-staging'
        ];
    }

    async init() {
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
            await this.page.screenshot({ path: filepath, fullPage: false });
            this.screenshotCount++;
            console.log(`📸 ${this.screenshotCount}: ${filename}`);
            return filepath;
        } catch (error) {
            return null;
        }
    }

    async scrollAndScreenshot(url) {
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

                    await this.page.screenshot({ path: filepath, fullPage: false });
                    this.screenshotCount++;
                    console.log(`📸 ${this.screenshotCount}: ${filename}`);
                } catch (e) {}
            }

            await this.page.evaluate(() => window.scrollTo(0, 0));
        } catch (e) {}
    }

    async processBlog(slug) {
        const url = `https://www.housora.pages.dev/blog/${slug}`;
        console.log(`\n📝 Blog: ${slug}`);

        try {
            await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await this.sleep(2000);
            await this.takeScreenshot(url, '_initial');
            await this.scrollAndScreenshot(url);
        } catch (error) {
            console.error(`❌ Error: ${error.message.substring(0, 80)}`);
        }
    }

    async run() {
        console.log('🚀 Missing Blog Pages Crawler');
        console.log(`📁 Output: ${this.outputDir}`);
        console.log(`📄 Blog pages to visit: ${this.missingBlogs.length}`);
        console.log('');

        await this.init();

        for (const slug of this.missingBlogs) {
            await this.processBlog(slug);
        }

        console.log('\n✅ All missing blog pages visited!');
        console.log(`📸 Total screenshots: ${this.screenshotCount}`);

        await this.browser.close();
    }
}

async function main() {
    const crawler = new MissingBlogCrawler();
    await crawler.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MissingBlogCrawler;
