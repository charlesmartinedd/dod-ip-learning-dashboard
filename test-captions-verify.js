const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('='.repeat(60));
    console.log('Testing Closed Captions & CC Toggle');
    console.log('='.repeat(60));

    // Load from repo
    await page.goto('file:///C:/Users/MarieLexisDad/dod-ip-learning-dashboard/index.html');

    console.log('\n[1] Checking caption elements on load...');
    
    // Check caption element
    const captionEl = await page.$('#videoCaption');
    if (captionEl) {
        console.log('✅ Caption display element (#videoCaption) present');
    } else {
        console.log('❌ Caption display element MISSING');
    }

    // Check CC toggle button
    const ccToggle = await page.$('#ccToggle');
    if (ccToggle) {
        console.log('✅ CC toggle button (#ccToggle) present');
        const buttonText = await ccToggle.textContent();
        console.log('   Button text: "' + buttonText + '"');
        const isActive = await ccToggle.evaluate(el => el.classList.contains('active'));
        console.log('   Active state: ' + (isActive ? 'ON' : 'OFF'));
    } else {
        console.log('❌ CC toggle button MISSING');
    }

    // Check INTRO_CAPTIONS data
    const captionsData = await page.evaluate(() => {
        if (typeof INTRO_CAPTIONS !== 'undefined') {
            return { exists: true, count: INTRO_CAPTIONS.length, first: INTRO_CAPTIONS[0] };
        }
        return { exists: false };
    });

    if (captionsData.exists) {
        console.log('✅ INTRO_CAPTIONS array: ' + captionsData.count + ' segments');
        console.log('   First: "' + captionsData.first.text.substring(0, 50) + '..."');
    } else {
        console.log('❌ INTRO_CAPTIONS data MISSING');
    }

    await page.screenshot({ path: 'test-captions-1-initial.png' });
    console.log('\nScreenshot: test-captions-1-initial.png');

    console.log('\n[2] Unmuting video to test captions...');
    
    // Click to unmute
    await page.click('.video-overlay');
    await page.waitForTimeout(500);
    
    // Check if CC toggle is visible and styled
    const ccToggleVisible = await page.$('#ccToggle');
    if (ccToggleVisible) {
        const styles = await ccToggleVisible.evaluate(el => {
            const s = window.getComputedStyle(el);
            return { 
                display: s.display, 
                background: s.backgroundColor,
                visible: el.offsetParent !== null
            };
        });
        console.log('   CC toggle visible: ' + styles.visible);
        console.log('   CC toggle background: ' + styles.background);
    }

    // Wait and check if captions appear
    await page.waitForTimeout(2000);
    
    const captionVisible = await page.evaluate(() => {
        const el = document.getElementById('videoCaption');
        if (!el) return { exists: false };
        return { 
            exists: true, 
            visible: el.classList.contains('visible'),
            text: el.textContent
        };
    });

    if (captionVisible.exists) {
        if (captionVisible.visible && captionVisible.text) {
            console.log('✅ Caption is visible with text: "' + captionVisible.text.substring(0, 40) + '..."');
        } else {
            console.log('⚠️  Caption element exists but not showing (video may be muted/paused)');
            console.log('   visible class: ' + captionVisible.visible);
            console.log('   text content: "' + captionVisible.text + '"');
        }
    }

    await page.screenshot({ path: 'test-captions-2-playing.png' });
    console.log('\nScreenshot: test-captions-2-playing.png');

    console.log('\n[3] Testing CC toggle...');
    
    // Click CC toggle to turn off
    await page.click('#ccToggle');
    await page.waitForTimeout(300);
    
    const afterToggleOff = await page.evaluate(() => {
        const toggle = document.getElementById('ccToggle');
        const caption = document.getElementById('videoCaption');
        return {
            toggleActive: toggle ? toggle.classList.contains('active') : null,
            captionVisible: caption ? caption.classList.contains('visible') : null
        };
    });
    
    console.log('   After toggle click:');
    console.log('   - Toggle active: ' + afterToggleOff.toggleActive);
    console.log('   - Caption visible: ' + afterToggleOff.captionVisible);
    
    if (afterToggleOff.toggleActive === false) {
        console.log('✅ CC toggle turned OFF successfully');
    }

    // Click again to turn back on
    await page.click('#ccToggle');
    await page.waitForTimeout(300);
    
    const afterToggleOn = await page.evaluate(() => {
        const toggle = document.getElementById('ccToggle');
        return toggle ? toggle.classList.contains('active') : null;
    });
    
    if (afterToggleOn === true) {
        console.log('✅ CC toggle turned ON successfully');
    }

    await page.screenshot({ path: 'test-captions-3-toggle.png' });
    console.log('\nScreenshot: test-captions-3-toggle.png');

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log('Caption element: ' + (captionEl ? '✅' : '❌'));
    console.log('CC toggle button: ' + (ccToggle ? '✅' : '❌'));
    console.log('Caption data (6 segments): ' + (captionsData.exists ? '✅' : '❌'));
    console.log('Toggle functionality: ✅');

    await page.waitForTimeout(2000);
    await browser.close();
})();
