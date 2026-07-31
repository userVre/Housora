const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

class GenerateFlowCrawler {
    constructor(options = {}) {
        this.outputDir = options.outputDir || path.join(__dirname, 'screenshots');
        this.screenshotDelay = options.screenshotDelay || 500;
        this.screenshotCount = 0;
        this.sampleImage = this.findSampleImage();
        this.browser = null;
        this.page = null;
        
        // Pages that need the full generate flow
        this.targetPages = [
            { url: 'https://www.housora.pages.dev/interior-design', name: 'interior_design' },
            { url: 'https://www.housora.pages.dev/layout-boost', name: 'layout_boost' },
            { url: 'https://www.housora.pages.dev/floor-restyle', name: 'floor_restyle' },
            { url: 'https://www.housora.pages.dev/wall-texture', name: 'wall_texture' },
            { url: 'https://www.housora.pages.dev/garden-design', name: 'garden_design' },
            { url: 'https://www.housora.pages.dev/exterior-design', name: 'exterior_design' },
            { url: 'https://www.housora.pages.dev/floorplan-to-3d', name: 'floorplan_to_3d' },
            { url: 'https://www.housora.pages.dev/photo-to-render', name: 'photo_to_render' },
            { url: 'https://www.housora.pages.dev/video-walkthrough', name: 'video_walkthrough' },
            { url: 'https://www.housora.pages.dev/ai-kitchen-design', name: 'ai_kitchen_design' },
            { url: 'https://www.housora.pages.dev/ai-bathroom-design', name: 'ai_bathroom_design' },
            { url: 'https://www.housora.pages.dev/ai-stairs-design', name: 'ai_stairs_design' },
            { url: 'https://www.housora.pages.dev/ai-doors-design', name: 'ai_doors_design' },
            { url: 'https://www.housora.pages.dev/ai-windows-design', name: 'ai_windows_design' },
            { url: 'https://www.housora.pages.dev/create', name: 'create' },
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

    async handleUploadAndGenerate(pageInfo) {
        console.log(`\n🌐 Processing: ${pageInfo.name}`);
        console.log(`📍 URL: ${pageInfo.url}`);

        try {
            // Navigate to page
            await this.page.goto(pageInfo.url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            await this.sleep(2000);

            // Take initial screenshot
            await this.takeScreenshot(pageInfo.url, '_initial');

            // Find and upload image
            const fileInput = await this.page.$('input[type="file"]');
            if (fileInput) {
                console.log(`📤 Uploading image...`);
                await fileInput.setInputFiles(this.sampleImage);
                await this.sleep(3000);
                await this.takeScreenshot(pageInfo.url, '_after_upload');

                // Look for style/option buttons and click first available
                console.log(`🎨 Looking for style options...`);
                const styleButtons = await this.page.$$('button');
                for (const btn of styleButtons) {
                    try {
                        const text = await btn.textContent();
                        const isVisible = await btn.isVisible();
                        if (isVisible && text && (
                            text.includes('Spaciousness') || 
                            text.includes('Airy') || 
                            text.includes('Modern') ||
                            text.includes('Minimalist') ||
                            text.includes('Functionality') ||
                            text.includes('Balanced')
                        )) {
                            console.log(`🖱️ Selecting style: ${text.trim()}`);
                            await btn.click();
                            await this.sleep(1000);
                            break;
                        }
                    } catch (e) {}
                }

                // Take screenshot after style selection
                await this.takeScreenshot(pageInfo.url, '_style_selected');

                // Find and click generate button
                console.log(`🔍 Looking for generate button...`);
                const allButtons = await this.page.$$('button');
                for (const btn of allButtons) {
                    try {
                        const text = await btn.textContent();
                        const isVisible = await btn.isVisible();
                        if (isVisible && text && (
                            text.includes('Generate') || 
                            text.includes('Boost') || 
                            text.includes('Apply') ||
                            text.includes('Analyze') ||
                            text.includes('Transform') ||
                            text.includes('Redesign')
                        )) {
                            console.log(`🖱️ Clicking generate: ${text.trim()}`);
                            await btn.click();
                            
                            // Wait for AI generation (longer wait)
                            console.log(`⏳ Waiting for AI generation...`);
                            await this.sleep(15000);
                            
                            await this.takeScreenshot(pageInfo.url, '_after_generate');
                            break;
                        }
                    } catch (e) {}
                }

                // Scroll down to see results
                await this.page.evaluate(() => window.scrollBy(0, 500));
                await this.sleep(2000);
                await this.takeScreenshot(pageInfo.url, '_results_scroll');

            } else {
                console.log(`⚠️ No file input found on this page`);
            }

        } catch (error) {
            console.error(`❌ Error processing ${pageInfo.name}: ${error.message.substring(0, 100)}`);
        }
    }

    async run() {
        console.log('🚀 Starting Generate Flow Crawler...');
        console.log(`📁 Output: ${this.outputDir}`);
        console.log(`🖼️ Sample image: ${this.sampleImage ? 'Found' : 'Will create'}`);
        console.log(`📄 Pages to process: ${this.targetPages.length}`);
        console.log('');

        await this.init();

        for (const pageInfo of this.targetPages) {
            await this.handleUploadAndGenerate(pageInfo);
        }

        console.log('\n✅ All pages processed!');
        console.log(`📸 Total screenshots taken: ${this.screenshotCount}`);

        await this.browser.close();
    }
}

async function main() {
    const crawler = new GenerateFlowCrawler();
    await crawler.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = GenerateFlowCrawler;
