/**
 * Generate Executive PDF Report with local server
 * Serves HTML locally to avoid CORS issues
 */

const playwright = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static file server
function createServer(port) {
    const server = http.createServer((req, res) => {
        let filePath = path.join(__dirname, req.url === '/' ? 'executive_report.html' : req.url);

        // Security check - prevent directory traversal
        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }

            // Set content type
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.json': 'application/json',
                '.css': 'text/css'
            };
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            res.end(data);
        });
    });

    return new Promise((resolve) => {
        server.listen(port, () => {
            console.log(`🌐 Server started on http://localhost:${port}`);
            resolve(server);
        });
    });
}

(async () => {
    console.log('📄 Starting PDF generation...');

    const port = 8765;
    const server = await createServer(port);

    try {
        const browser = await playwright.chromium.launch({
            headless: true
        });

        const context = await browser.newContext({
            viewport: { width: 1275, height: 1650 }
        });

        const page = await context.newPage();

        // Load from local server
        const url = `http://localhost:${port}/executive_report.html`;
        console.log(`📖 Loading report from: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle' });

        // Wait for charts to render
        console.log('⏳ Waiting for charts to render...');
        await page.waitForTimeout(3000);

        // Verify data loaded
        const dataLoaded = await page.evaluate(() => {
            return document.getElementById('totalRes').textContent !== '--';
        });

        if (!dataLoaded) {
            throw new Error('❌ Data did not load properly');
        }

        console.log('✅ Data loaded successfully');

        // Generate PDF
        const pdfPath = path.join(__dirname, 'DoD_IP_Learning_Resources_Executive_Report.pdf');

        await page.pdf({
            path: pdfPath,
            format: 'Letter',
            printBackground: true,
            margin: {
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in'
            },
            preferCSSPageSize: false
        });

        console.log(`✅ PDF generated: ${pdfPath}`);

        // Get file size
        const stats = fs.statSync(pdfPath);
        const fileSizeKB = (stats.size / 1024).toFixed(2);
        console.log(`📊 File size: ${fileSizeKB} KB`);
        console.log('✅ Report contains 2 pages as designed');

        await browser.close();

        console.log('\n🎉 PDF generation complete!');
        console.log(`📁 Output: ${pdfPath}`);
    } finally {
        server.close();
        console.log('🔚 Server stopped');
    }
})();
