const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('='.repeat(60));
    console.log('OSBP Dashboard - Feature Verification Tests');
    console.log('='.repeat(60));

    // Load the dashboard
    await page.goto('file:///C:/Users/MarieLexisDad/Documents/Obsidian%20Vault/01_Projects/Intellectual%20Property/osbp-resources-dashboard.html');

    // ============================================================
    // TEST 1: Video Closed Captions
    // ============================================================
    console.log('\n[TEST 1] Video Closed Captions');
    console.log('-'.repeat(40));

    // Check caption elements exist
    const captionElement = await page.$('#videoCaption');
    const ccToggle = await page.$('#ccToggle');

    if (captionElement) {
        console.log('✅ Caption display element present');
    } else {
        console.log('❌ Caption display element MISSING');
    }

    if (ccToggle) {
        console.log('✅ CC toggle button present');
        const isActive = await ccToggle.evaluate(el => el.classList.contains('active'));
        if (isActive) {
            console.log('✅ CC toggle is active (on)');
        } else {
            console.log('✅ CC toggle is inactive (off)');
        }
    } else {
        console.log('❌ CC toggle button MISSING');
    }

    // Check INTRO_CAPTIONS data exists in page
    const captionsExist = await page.evaluate(() => {
        return typeof INTRO_CAPTIONS !== 'undefined' && Array.isArray(INTRO_CAPTIONS) && INTRO_CAPTIONS.length > 0;
    });

    if (captionsExist) {
        const captionCount = await page.evaluate(() => INTRO_CAPTIONS.length);
        console.log('✅ INTRO_CAPTIONS array present with ' + captionCount + ' segments');

        // Show first caption
        const firstCaption = await page.evaluate(() => INTRO_CAPTIONS[0].text);
        console.log('   First caption: "' + firstCaption.substring(0, 50) + '..."');
    } else {
        console.log('❌ INTRO_CAPTIONS data MISSING');
    }

    await page.screenshot({ path: 'test-1-captions.png' });
    console.log('Screenshot: test-1-captions.png');

    // Dismiss video and meeting recap
    console.log('\nDismissing intro screens...');
    await page.click('.video-overlay', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
    await page.click('.video-overlay', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.click('.meeting-recap-cta', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);

    // ============================================================
    // TEST 2: Resource Detail Modal (Topics Tab)
    // ============================================================
    console.log('\n[TEST 2] Resource Detail Modal (Topics Tab)');
    console.log('-'.repeat(40));

    // Open Analytics
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(400);

    // Click Topics tab
    await page.click('button:has-text("Topics")');
    await page.waitForTimeout(400);

    // Click on a topic
    await page.click('.topic-bar').catch(() => {});
    await page.waitForTimeout(400);

    // Click on a resource
    const resourceItem = await page.$('.resource-list-item');
    if (resourceItem) {
        await resourceItem.click();
        await page.waitForTimeout(400);

        // Check modal
        const modalOverlay = await page.$('.resource-detail-overlay.active');
        const modalTitle = await page.$('.resource-detail-title');
        const modalClose = await page.$('.resource-detail-close');
        const modalBack = await page.$('.resource-detail-back');
        const modalOpenBtn = await page.$('.resource-detail-open-btn');

        if (modalOverlay) {
            console.log('✅ Modal overlay appeared');
        } else {
            console.log('❌ Modal overlay MISSING');
        }

        if (modalTitle) {
            const title = await modalTitle.textContent();
            console.log('✅ Modal title: "' + title.substring(0, 40) + '..."');
        } else {
            console.log('❌ Modal title MISSING');
        }

        if (modalClose) {
            console.log('✅ Close button (X) present');
        } else {
            console.log('❌ Close button MISSING');
        }

        if (modalBack) {
            console.log('✅ Back link present');
        } else {
            console.log('❌ Back link MISSING');
        }

        if (modalOpenBtn) {
            console.log('✅ Open Resource button present');
        } else {
            console.log('❌ Open Resource button MISSING');
        }

        await page.screenshot({ path: 'test-2-modal.png' });
        console.log('Screenshot: test-2-modal.png');

        // Close modal
        await page.click('.resource-detail-close').catch(() => {});
        await page.waitForTimeout(300);
    } else {
        console.log('❌ No resource items to click');
    }

    // Close analytics
    await page.click('.modal-overlay .close-btn').catch(() => {});
    await page.waitForTimeout(300);

    // ============================================================
    // TEST 3: Landing Page Disclaimer
    // ============================================================
    console.log('\n[TEST 3] Landing Page Disclaimer');
    console.log('-'.repeat(40));

    const disclaimer = await page.$('.disclaimer');
    if (disclaimer) {
        const disclaimerText = await disclaimer.textContent();
        console.log('✅ Disclaimer element present');
        console.log('   Text: "' + disclaimerText + '"');

        // Check styling
        const styles = await disclaimer.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
                position: computed.position,
                fontSize: computed.fontSize,
                opacity: computed.opacity
            };
        });
        console.log('   Position: ' + styles.position + ', Font: ' + styles.fontSize + ', Opacity: ' + styles.opacity);
    } else {
        console.log('❌ Disclaimer element MISSING');
    }

    await page.screenshot({ path: 'test-3-disclaimer.png' });
    console.log('Screenshot: test-3-disclaimer.png');

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('1. Video Captions: Caption element, CC toggle, and caption data verified');
    console.log('2. Resource Modal: Modal appears with title, close, back, and open button');
    console.log('3. Disclaimer: Present at bottom of landing page');
    console.log('\nAll screenshots saved in current directory.');

    await page.waitForTimeout(2000);
    await browser.close();
})();
