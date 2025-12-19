const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Load the dashboard
    await page.goto('file:///C:/Users/MarieLexisDad/Documents/Obsidian%20Vault/01_Projects/Intellectual%20Property/osbp-resources-dashboard.html');
    
    console.log('Page loaded, dismissing intro...');
    
    // Dismiss video overlay (click twice then wait)
    await page.click('.video-overlay', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await page.click('.video-overlay', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Dismiss meeting recap
    await page.click('.meeting-recap-cta', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    console.log('Opening Analytics modal...');
    
    // Click Analytics button
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(500);
    
    // Click on Topics tab
    console.log('Clicking Topics tab...');
    await page.click('button:has-text("Topics")');
    await page.waitForTimeout(500);
    
    // Take screenshot of Topics tab
    await page.screenshot({ path: 'test-topics-tab.png' });
    console.log('Screenshot: test-topics-tab.png');
    
    // Click on a topic (e.g., "Contracting/FAR")
    console.log('Clicking on a topic...');
    await page.click('text=Contracting/FAR').catch(() => page.click('.topic-bar').catch(() => {}));
    await page.waitForTimeout(500);
    
    // Take screenshot showing resources list
    await page.screenshot({ path: 'test-topics-resources.png' });
    console.log('Screenshot: test-topics-resources.png');
    
    // Click on a resource in the list
    console.log('Clicking on a resource...');
    const resourceItem = await page.$('.resource-list-item');
    if (resourceItem) {
        await resourceItem.click();
        await page.waitForTimeout(500);
        
        // Check if modal appeared
        const modal = await page.$('.resource-detail-overlay.active');
        if (modal) {
            console.log('✅ Resource detail modal appeared!');
            await page.screenshot({ path: 'test-modal-open.png' });
            console.log('Screenshot: test-modal-open.png');
            
            // Check modal content
            const title = await page.$('.resource-detail-title');
            if (title) {
                const titleText = await title.textContent();
                console.log('Modal title:', titleText);
            }
            
            // Check for close button
            const closeBtn = await page.$('.resource-detail-close');
            if (closeBtn) {
                console.log('✅ Close button present');
            }
            
            // Check for back link
            const backLink = await page.$('.resource-detail-back');
            if (backLink) {
                console.log('✅ Back link present');
            }
            
            // Check for open resource button
            const openBtn = await page.$('.resource-detail-open-btn');
            if (openBtn) {
                console.log('✅ Open Resource button present');
            }
            
            // Test closing by clicking back
            await page.click('.resource-detail-back');
            await page.waitForTimeout(300);
            
            const modalAfterClose = await page.$('.resource-detail-overlay.active');
            if (!modalAfterClose) {
                console.log('✅ Modal closed successfully via Back link');
            }
            
        } else {
            console.log('❌ Modal did NOT appear');
            await page.screenshot({ path: 'test-modal-missing.png' });
        }
    } else {
        console.log('❌ No resource items found');
    }
    
    console.log('\nTest complete!');
    await page.waitForTimeout(2000);
    await browser.close();
})();
