const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class MissingPagesCrawler {
    constructor() {
        this.outputDir = path.join(__dirname, 'screenshots');
        this.screenshotDelay = 500;
        this.scrollDelay = 300;
        this.screenshotCount = 0;
        this.sampleImage = this.findSampleImage();
        this.browser = null;
        this.page = null;

        // ALL missing pages from sitemap
        this.missingPages = [
            // Tool pages (upload + generate)
            { url: 'https://www.housora.pages.dev/ai-bathroom-design', type: 'tool' },
            { url: 'https://www.housora.pages.dev/ai-doors-design', type: 'tool' },
            { url: 'https://www.housora.pages.dev/ai-kitchen-design', type: 'tool' },
            { url: 'https://www.housora.pages.dev/ai-stairs-design', type: 'tool' },
            { url: 'https://www.housora.pages.dev/ai-windows-design', type: 'tool' },
            { url: 'https://www.housora.pages.dev/exterior-design', type: 'tool' },
            { url: 'https://www.housora.pages.dev/floor-restyle', type: 'tool' },
            { url: 'https://www.housora.pages.dev/floorplan-to-3d', type: 'tool' },
            { url: 'https://www.housora.pages.dev/garden-design', type: 'tool' },
            { url: 'https://www.housora.pages.dev/interior-design', type: 'tool' },
            { url: 'https://www.housora.pages.dev/layout-boost', type: 'tool' },
            { url: 'https://www.housora.pages.dev/photo-to-render', type: 'tool' },
            { url: 'https://www.housora.pages.dev/video-walkthrough', type: 'tool' },
            { url: 'https://www.housora.pages.dev/wall-texture', type: 'tool' },

            // Info pages (scroll only)
            { url: 'https://www.housora.pages.dev/ai-interior-design-prompts', type: 'info' },
            { url: 'https://www.housora.pages.dev/embed-ai-interior-design', type: 'info' },
            { url: 'https://www.housora.pages.dev/furniture-fit-calculator', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-style-quiz', type: 'info' },
            { url: 'https://www.housora.pages.dev/refer', type: 'info' },
            { url: 'https://www.housora.pages.dev/refund-policy', type: 'info' },

            // Compare pages
            { url: 'https://www.housora.pages.dev/compare/housora-vs-homedesigns-ai', type: 'info' },
            { url: 'https://www.housora.pages.dev/compare/housora-vs-homestyler', type: 'info' },
            { url: 'https://www.housora.pages.dev/compare/housora-vs-mnml-ai', type: 'info' },
            { url: 'https://www.housora.pages.dev/compare/housora-vs-planner-5d', type: 'info' },
            { url: 'https://www.housora.pages.dev/compare/housora-vs-reimaginehome', type: 'info' },

            // Interior design examples
            { url: 'https://www.housora.pages.dev/interior-design-examples', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/scandinavian', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/modern', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/minimalist', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/industrial', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/mid-century-modern', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/bohemian', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/coastal', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/farmhouse', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/japandi', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/traditional', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/transitional', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/art-deco', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/maximalist', type: 'info' },
            { url: 'https://www.housora.pages.dev/interior-design-examples/luxury', type: 'info' },

            // Case studies
            { url: 'https://www.housora.pages.dev/case-studies', type: 'info' },
            { url: 'https://www.housora.pages.dev/case-studies/cresco-real-estate', type: 'info' },
            { url: 'https://www.housora.pages.dev/case-studies/westieri', type: 'info' },
            { url: 'https://www.housora.pages.dev/case-studies/jtre', type: 'info' },
            { url: 'https://www.housora.pages.dev/case-studies/kondela', type: 'info' },
            { url: 'https://www.housora.pages.dev/case-studies/penta-hospitals', type: 'info' },
            { url: 'https://www.housora.pages.dev/case-studies/vigroup', type: 'info' },
            { url: 'https://www.housora.pages.dev/case-studies/herrys', type: 'info' },
            { url: 'https://www.housora.pages.dev/case-studies/yit-slovakia', type: 'info' },

            // Answers pages
            { url: 'https://www.housora.pages.dev/answers/japandi-vs-scandinavian-interior-design', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/what-size-dining-table-do-i-need', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/what-furniture-fits-a-small-balcony', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/will-my-fridge-fit-through-the-door', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/will-my-washing-machine-fit', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/will-my-wardrobe-fit-through-the-door', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/pet-friendly-interior-design', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-to-measure-a-room-for-furniture', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/arrange-furniture-small-living-room', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-does-ai-interior-design-work', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/can-ai-design-a-kitchen', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/is-ai-interior-design-worth-it', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/can-ai-measure-a-room-from-a-photo', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/can-ai-turn-a-floor-plan-into-a-3d-model', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/does-ai-interior-design-keep-my-real-room', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/can-ai-design-my-house-exterior', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/can-you-buy-the-furniture-in-ai-room-design', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/can-ai-design-my-garden-or-backyard', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/best-ai-for-interior-design', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/are-accent-walls-still-in-style', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/best-furniture-for-open-floor-plan', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/what-is-ai-virtual-staging', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/what-color-goes-with-dark-wood-floors', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/modern-vs-contemporary-interior-design', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/what-is-the-60-30-10-rule-in-interior-design', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/can-chatgpt-design-a-room', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-much-does-ai-interior-design-cost', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/can-ai-design-a-room-from-a-photo', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-accurate-is-ai-interior-design', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-to-know-if-furniture-will-fit', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/cost-to-furnish-a-one-bedroom-apartment', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/will-ai-replace-interior-designers', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/what-colors-go-with-a-grey-sofa', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/what-size-sofa-for-my-living-room', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-to-mix-wood-tones', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-much-to-furnish-a-living-room', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/will-my-couch-fit-through-the-door', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/what-goes-with-a-brown-leather-sofa', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/see-furniture-in-my-room-before-buying', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/redesign-a-rental-without-permanent-changes', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-to-find-my-interior-design-style', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-high-to-hang-art-above-a-sofa', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-big-should-a-coffee-table-be', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-to-make-a-small-room-look-bigger', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/what-size-rug-do-i-need', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/should-curtains-touch-the-floor', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-to-choose-paint-color-without-regret', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/what-color-sofa-works-with-grey-walls', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-far-should-my-sofa-be-from-the-tv', type: 'info' },
            { url: 'https://www.housora.pages.dev/answers/how-do-i-make-ikea-furniture-look-expensive', type: 'info' },
        ];
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

    async processToolPage(pageInfo) {
        console.log(`\n🔧 TOOL: ${pageInfo.url}`);

        try {
            await this.page.goto(pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await this.sleep(2000);
            await this.takeScreenshot(pageInfo.url, '_initial');

            // Upload image
            const fileInput = await this.page.$('input[type="file"]');
            if (fileInput) {
                console.log(`📤 Uploading image...`);
                await fileInput.setInputFiles(this.sampleImage);
                await this.sleep(3000);
                await this.takeScreenshot(pageInfo.url, '_after_upload');

                // Click style option
                const buttons = await this.page.$$('button');
                for (const btn of buttons) {
                    try {
                        const text = await btn.textContent();
                        const isVisible = await btn.isVisible();
                        if (isVisible && text && (
                            text.includes('Spaciousness') || text.includes('Airy') ||
                            text.includes('Modern') || text.includes('Minimalist') ||
                            text.includes('Functionality') || text.includes('Balanced')
                        )) {
                            console.log(`🎨 Selecting: ${text.trim()}`);
                            await btn.click();
                            await this.sleep(1000);
                            break;
                        }
                    } catch (e) {}
                }

                await this.takeScreenshot(pageInfo.url, '_style_selected');

                // Click generate
                const allButtons = await this.page.$$('button');
                for (const btn of allButtons) {
                    try {
                        const text = await btn.textContent();
                        const isVisible = await btn.isVisible();
                        if (isVisible && text && (
                            text.includes('Generate') || text.includes('Boost') ||
                            text.includes('Apply') || text.includes('Analyze') ||
                            text.includes('Transform') || text.includes('Redesign')
                        )) {
                            console.log(`🚀 Generating: ${text.trim()}`);
                            await btn.click();
                            await this.sleep(15000);
                            await this.takeScreenshot(pageInfo.url, '_after_generate');
                            break;
                        }
                    } catch (e) {}
                }

                await this.scrollAndScreenshot(pageInfo.url);
            }
        } catch (error) {
            console.error(`❌ Error: ${error.message.substring(0, 80)}`);
        }
    }

    async processInfoPage(pageInfo) {
        console.log(`\n📄 INFO: ${pageInfo.url}`);

        try {
            await this.page.goto(pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await this.sleep(2000);
            await this.takeScreenshot(pageInfo.url, '_initial');
            await this.scrollAndScreenshot(pageInfo.url);
        } catch (error) {
            console.error(`❌ Error: ${error.message.substring(0, 80)}`);
        }
    }

    async run() {
        console.log('🚀 Missing Pages Crawler');
        console.log(`📁 Output: ${this.outputDir}`);
        console.log(`📄 Pages to visit: ${this.missingPages.length}`);
        console.log(`🖼️ Sample image: ${this.sampleImage ? 'Found' : 'Will create'}`);
        console.log('');

        await this.init();

        for (const pageInfo of this.missingPages) {
            if (pageInfo.type === 'tool') {
                await this.processToolPage(pageInfo);
            } else {
                await this.processInfoPage(pageInfo);
            }
        }

        console.log('\n✅ All missing pages visited!');
        console.log(`📸 Total screenshots: ${this.screenshotCount}`);

        await this.browser.close();
    }
}

async function main() {
    const crawler = new MissingPagesCrawler();
    await crawler.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MissingPagesCrawler;
