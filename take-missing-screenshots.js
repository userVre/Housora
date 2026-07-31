const { chromium } = require('playwright');
const path = require('path');

async function takeMissingScreenshots() {
    const baseUrl = 'http://localhost:8081';
    const outputDir = path.join(__dirname, 'mywebsitescreenshoots');
    
    const missingPages = [
        'compare/housora-vs-homestyler',
        'compare/housora-vs-mnml-ai',
        'compare/housora-vs-planner-5d',
        'contact',
        'faq',
        'privacy',
        'terms',
        'cookies',
        'refund-policy',
        'enterprise',
        'creations',
        'answers',
        'llms.txt',
        'interior-design-examples'
    ];

    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    for (const pagePath of missingPages) {
        const url = `${baseUrl}/${pagePath}`;
        const filename = pagePath.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        
        console.log(`\n🌐 Visiting: ${url}`);
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(1000);
            
            // Take initial screenshot
            await page.screenshot({
                path: path.join(outputDir, `${filename}_initial.png`),
                fullPage: false
            });
            console.log(`📸 Screenshot: ${filename}_initial.png`);
            
            // Scroll and take more screenshots
            const pageHeight = await page.evaluate(() => document.body.scrollHeight);
            const viewportHeight = await page.evaluate(() => window.innerHeight);
            
            let scrollCount = 1;
            for (let position = 0; position < pageHeight; position += viewportHeight) {
                await page.evaluate((pos) => window.scrollTo(0, pos), position);
                await page.waitForTimeout(300);
                
                if (scrollCount > 0) {
                    await page.screenshot({
                        path: path.join(outputDir, `${filename}_scroll_${scrollCount}.png`),
                        fullPage: false
                    });
                    console.log(`📸 Screenshot: ${filename}_scroll_${scrollCount}.png`);
                }
                scrollCount++;
                
                if (scrollCount > 10) break; // Limit scrolls
            }
            
            // Scroll back to top
            await page.evaluate(() => window.scrollTo(0, 0));
            
        } catch (error) {
            console.error(`❌ Error visiting ${url}: ${error.message}`);
        }
    }

    await browser.close();
    console.log('\n✅ Done!');
}

takeMissingScreenshots().catch(console.error);
