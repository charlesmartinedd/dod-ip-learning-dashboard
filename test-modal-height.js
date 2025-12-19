const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('='.repeat(60));
    console.log('Testing Resource Detail Modal Height Fix');
    console.log('='.repeat(60));

    // Load the dashboard
    await page.goto('file:///C:/Users/MarieLexisDad/Documents/Obsidian%20Vault/01_Projects/Intellectual%20Property/osbp-resources-dashboard.html');

    // Dismiss intro screens
    console.log('Dismissing intro screens...');
    await page.click('.video-overlay', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
    await page.click('.video-overlay', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.click('.meeting-recap-cta', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);

    // Open Analytics
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(400);

    // Click Topics tab
    await page.click('button:has-text("Topics")');
    await page.waitForTimeout(400);

    // Click on a topic
    await page.click('.topic-bar').catch(() => {});
    await page.waitForTimeout(400);

    // Click on a resource with longer content
    const resourceItems = await page.$$('.resource-list-item');
    if (resourceItems.length > 1) {
        await resourceItems[1].click(); // Try second item which may have longer content
    } else if (resourceItems.length > 0) {
        await resourceItems[0].click();
    }
    await page.waitForTimeout(500);

    // Check modal max-height
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
        console.log('  max-height: ' + styles.maxHeight);
        console.log('  actual height: ' + styles.height + 'px');
        console.log('  scroll height: ' + styles.scrollHeight + 'px');

        if (styles.maxHeight.includes('90vh')) {
            console.log('\n✅ Modal max-height is correctly set to 90vh');
        } else {
            console.log('\n❌ Modal max-height is NOT 90vh: ' + styles.maxHeight);
        }

        // Check if content fits without scrolling
        if (styles.height >= styles.scrollHeight - 5) {
            console.log('✅ Content fits without scrolling');
        } else {
            console.log('⚠️  Content requires scrolling (height: ' + styles.height + ', scrollHeight: ' + styles.scrollHeight + ')');
        }

        // Check back link is visible
        const backLink = await page.$('.resource-detail-back');
        if (backLink) {
            const isVisible = await backLink.isVisible();
            if (isVisible) {
                console.log('✅ Back link is visible');
            } else {
                console.log('❌ Back link is NOT visible');
            }
        }

        await page.screenshot({ path: 'test-modal-height.png' });
        console.log('\nScreenshot: test-modal-height.png');
    } else {
        console.log('❌ Modal not found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Test complete');
    console.log('='.repeat(60));

    await page.waitForTimeout(2000);
    await browser.close();
})();
