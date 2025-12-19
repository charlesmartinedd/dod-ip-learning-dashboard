const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('Testing Resource Detail Modal Height Fix (from repo index.html)');
    console.log('='.repeat(60));

    // Load from REPO index.html
    await page.goto('file:///C:/Users/MarieLexisDad/dod-ip-learning-dashboard/index.html');

    // Dismiss intro screens
    console.log('Dismissing intro screens...');
    await page.click('.video-overlay', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
    await page.click('.video-overlay', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.click('.meeting-recap-cta', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);

    // Open Analytics > Topics
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Topics")');
    await page.waitForTimeout(400);
    await page.click('.topic-bar').catch(() => {});
    await page.waitForTimeout(400);

    // Click resource
    const resourceItems = await page.$$('.resource-list-item');
    if (resourceItems.length > 1) {
        await resourceItems[1].click();
    } else if (resourceItems.length > 0) {
        await resourceItems[0].click();
    }
    await page.waitForTimeout(500);

    // Check modal
    const modal = await page.$('.resource-detail-modal');
    if (modal) {
        const styles = await modal.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
                maxHeight: computed.maxHeight,
                height: el.offsetHeight,
                scrollHeight: el.scrollHeight
            };
        });

        console.log('\nModal Dimensions:');
        console.log('  max-height (computed): ' + styles.maxHeight);
        console.log('  actual height: ' + styles.height + 'px');
        console.log('  scroll height: ' + styles.scrollHeight + 'px');

        // 90vh on a 720px viewport = 648px, on 810px = 729px
        // Check if it's roughly 90% of viewport
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        const expectedMaxHeight = viewportHeight * 0.9;
        const actualMaxHeight = parseInt(styles.maxHeight);
        
        console.log('  viewport height: ' + viewportHeight + 'px');
        console.log('  expected 90vh: ~' + Math.round(expectedMaxHeight) + 'px');

        if (Math.abs(actualMaxHeight - expectedMaxHeight) < 10) {
            console.log('\n✅ Modal max-height is correctly ~90vh');
        } else {
            console.log('\n⚠️  Modal max-height: ' + actualMaxHeight + 'px (expected ~' + Math.round(expectedMaxHeight) + 'px)');
        }

        await page.screenshot({ path: 'test-modal-height-repo.png' });
        console.log('\nScreenshot: test-modal-height-repo.png');
    }

    console.log('\nTest complete');
    await page.waitForTimeout(2000);
    await browser.close();
})();
