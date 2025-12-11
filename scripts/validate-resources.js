const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const ExcelJS = require('exceljs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// All 66 resources
const ALL_RESOURCES = [
  {"id":1,"title":"Foundational IP Credential CACQ 008A","url":"https://www.dau.edu/credentials/cacq-008a"},
  {"id":2,"title":"ACQ 0710 Foundations of Data","url":"https://www.dau.edu/courses/acq-0710"},
  {"id":3,"title":"ACQ 0720 IP and Data Rights","url":"https://www.dau.edu/courses/acq-0720"},
  {"id":4,"title":"ACQ 0730 Create/Update an RFP","url":"https://www.dau.edu/courses/acq-0730"},
  {"id":5,"title":"ACQ 0740 IP Strategy Fundamentals","url":"https://www.dau.edu/courses/acq-0740"},
  {"id":6,"title":"ACQ 0750 Data Acquisition","url":"https://www.dau.edu/courses/acq-0750"},
  {"id":7,"title":"ACQ 0760 Data Rights Marking","url":"https://www.dau.edu/courses/acq-0760"},
  {"id":8,"title":"CLE 019 MOSA Course","url":"https://www.dau.edu/courses/cle-019"},
  {"id":9,"title":"CLM 002 IP Valuation","url":"https://www.dau.edu/courses/clm-002"},
  {"id":10,"title":"CACQ 008 Capstone Exercise","url":"https://www.dau.edu/credentials/cacq-008a"},
  {"id":11,"title":"Acquisition Knowledge Matrix","url":"https://www.dau.edu/acquisition-knowledge-matrix"},
  {"id":12,"title":"IP and Data Rights FAQs","url":"https://www.dau.edu/cop/IPDR/resources/intellectual-property-and-data-rights"},
  {"id":13,"title":"IP Cadre Introduction","url":"https://www.dau.edu/cop/IPDR/resources/intellectual-property-ip-cadre"},
  {"id":14,"title":"IP Resource Card","url":"https://www.dau.edu/cop/IPDR/resources"},
  {"id":15,"title":"IP & Data Rights Issues Video","url":"https://media.dau.edu/media/ip-data-rights"},
  {"id":16,"title":"WSM 022 IP Rights Workshop","url":"https://icatalog.dau.edu/onlinecatalog/courses.aspx"},
  {"id":17,"title":"IP and Data Rights Overview","url":"https://media.dau.edu/media/ip-overview"},
  {"id":18,"title":"5-Phase IP Strategy Process","url":"https://media.dau.edu/media/5-phase"},
  {"id":19,"title":"Data Rights Determination Guide","url":"https://www.dau.edu/cop/IPDR/resources/data-rights"},
  {"id":20,"title":"DFARS Data Rights Clauses","url":"https://www.dau.edu/cop/IPDR/resources/dfars"},
  {"id":21,"title":"IP Strategy Template","url":"https://www.dau.edu/cop/IPDR/resources/template"},
  {"id":22,"title":"SBIR/STTR Data Rights Video","url":"https://media.dau.edu/media/sbir"},
  {"id":23,"title":"TDP Requirements Guide","url":"https://www.dau.edu/cop/IPDR/resources/tdp"},
  {"id":24,"title":"Data Rights Negotiations Webinar","url":"https://www.dau.edu/webinars/ip-negotiations"},
  {"id":25,"title":"MOSA and IP Integration Guide","url":"https://www.dau.edu/cop/IPDR/resources/mosa"},
  {"id":26,"title":"IP Assertions Analysis Video","url":"https://media.dau.edu/media/assertions"},
  {"id":27,"title":"Software IP Considerations","url":"https://www.dau.edu/cop/IPDR/resources/software"},
  {"id":28,"title":"Sustainment Data Rights Webinar","url":"https://www.dau.edu/webinars/sustainment"},
  {"id":29,"title":"IP Policy Update 2024","url":"https://media.dau.edu/media/policy-2024"},
  {"id":30,"title":"Small Business IP Guide","url":"https://www.dau.edu/cop/IPDR/resources/small-business"},
  {"id":31,"title":"IP Valuation Methods Webinar","url":"https://www.dau.edu/webinars/valuation"},
  {"id":32,"title":"DODI 5010.44 Implementation","url":"https://www.dau.edu/cop/IPDR/resources/5010-44"},
  {"id":33,"title":"Patent Rights Video","url":"https://media.dau.edu/media/patent"},
  {"id":34,"title":"Trade Secrets Guide","url":"https://www.dau.edu/cop/IPDR/resources/trade-secrets"},
  {"id":35,"title":"IP Risk Assessment Framework","url":"https://www.dau.edu/cop/IPDR/resources/risk"},
  {"id":36,"title":"AI and IP Challenges Webinar","url":"https://www.dau.edu/webinars/ai-ip"},
  {"id":37,"title":"Data Rights Marking Reference","url":"https://www.dau.edu/cop/IPDR/resources/marking"},
  {"id":38,"title":"Open Source Software IP Guide","url":"https://www.dau.edu/cop/IPDR/resources/oss"},
  {"id":39,"title":"International IP Video","url":"https://media.dau.edu/media/international"},
  {"id":40,"title":"Depot Maintenance IP Guide","url":"https://www.dau.edu/cop/IPDR/resources/depot"},
  {"id":41,"title":"IP Strategy Review Checklist","url":"https://www.dau.edu/cop/IPDR/resources/checklist"},
  {"id":42,"title":"Competitive Prototyping Webinar","url":"https://www.dau.edu/webinars/prototyping"},
  {"id":43,"title":"Government Purpose Rights Video","url":"https://media.dau.edu/media/gpr"},
  {"id":44,"title":"Defense Innovation Marketplace","url":"https://defenseinnovationmarketplace.dtic.mil"},
  {"id":45,"title":"Copyrights Guide","url":"https://www.dau.edu/cop/IPDR/resources/copyrights"},
  {"id":46,"title":"IP Cadre Support Portal","url":"https://www.dau.edu/cop/IPDR/ip-cadre-support"},
  {"id":47,"title":"OTA Data Rights Guide","url":"https://www.dau.edu/cop/IPDR/resources/ota"},
  {"id":48,"title":"IP Disputes Webinar","url":"https://www.dau.edu/webinars/disputes"},
  {"id":49,"title":"Reverse Engineering Guide","url":"https://www.dau.edu/cop/IPDR/resources/reverse"},
  {"id":50,"title":"Commercial Item IP Video","url":"https://media.dau.edu/media/commercial"},
  {"id":51,"title":"IP Knowledge Portal","url":"https://www.dau.edu/cop/IPDR"},
  {"id":52,"title":"Privity and Data Rights Guide","url":"https://www.dau.edu/cop/IPDR/resources/privity"},
  {"id":53,"title":"SBIR/STTR Best Practices Webinar","url":"https://www.dau.edu/webinars/sbir-sttr"},
  {"id":54,"title":"License Negotiation Video","url":"https://media.dau.edu/media/license"},
  {"id":55,"title":"DoD IP Policy Website","url":"https://www.acq.osd.mil/ip"},
  {"id":56,"title":"Deferred Ordering Guide","url":"https://www.dau.edu/cop/IPDR/resources/deferred"},
  {"id":57,"title":"Agile IP Webinar","url":"https://www.dau.edu/webinars/agile"},
  {"id":58,"title":"Mixed Funding Data Rights Video","url":"https://media.dau.edu/media/mixed"},
  {"id":59,"title":"IP Case Studies","url":"https://www.dau.edu/cop/IPDR/resources/cases"},
  {"id":60,"title":"TDP Validation Video","url":"https://media.dau.edu/media/tdp"},
  {"id":61,"title":"Emerging Tech IP Webinar","url":"https://www.dau.edu/webinars/emerging"},
  {"id":62,"title":"IP Strategy Workshop","url":"https://www.dau.edu/cop/IPDR/workshops"},
  {"id":63,"title":"DFARS 252.227 Analysis","url":"https://www.dau.edu/cop/IPDR/resources/dfars-252-227"},
  {"id":64,"title":"IP Training Roadmap","url":"https://www.dau.edu/cop/IPDR/training-roadmap"},
  {"id":65,"title":"Bid/Proposal IP Guide","url":"https://www.dau.edu/cop/IPDR/resources/bid"},
  {"id":66,"title":"STTR Program Podcast","url":"https://www.dau.edu/podcasts/sttr"}
];

const OUTPUT_DIR = path.join(__dirname, '..', 'validation-output');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Login detection keywords
const LOGIN_INDICATORS = [
  'sign in', 'log in', 'login', 'signin',
  'username', 'password', 'authenticate',
  'dau home', 'atrrs', 'cac required',
  'access denied', 'unauthorized'
];

async function checkWaybackMachine(url) {
  try {
    const waybackUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
    const response = await axios.get(waybackUrl, { timeout: 10000 });
    if (response.data?.archived_snapshots?.closest) {
      const snapshot = response.data.archived_snapshots.closest;
      return {
        available: true,
        url: snapshot.url,
        timestamp: snapshot.timestamp
      };
    }
    return { available: false };
  } catch (err) {
    console.log(`  Wayback check failed: ${err.message}`);
    return { available: false, error: err.message };
  }
}

function detectLogin(pageContent, pageUrl) {
  const lowerContent = pageContent.toLowerCase();
  const lowerUrl = pageUrl.toLowerCase();

  // Check URL for login paths
  if (lowerUrl.includes('/login') || lowerUrl.includes('/signin') || lowerUrl.includes('/sso')) {
    return true;
  }

  // Check page content for login indicators
  for (const indicator of LOGIN_INDICATORS) {
    if (lowerContent.includes(indicator)) {
      // Check for password field specifically
      if (lowerContent.includes('type="password"') || lowerContent.includes("type='password'")) {
        return true;
      }
    }
  }

  return false;
}

async function validateResource(browser, resource) {
  console.log(`\n[${resource.id}] Validating: ${resource.title}`);
  console.log(`    URL: ${resource.url}`);

  const result = {
    id: resource.id,
    title: resource.title,
    url: resource.url,
    status: 'Unknown',
    httpCode: null,
    pageTitle: null,
    screenshotPath: null,
    loginDetected: false,
    archiveUrl: null,
    notes: ''
  };

  const page = await browser.newPage();

  try {
    // Stealth settings to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Hide webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      window.chrome = { runtime: {} };
    });

    await page.setViewport({ width: 1280, height: 800 });

    // Navigate with response tracking
    const response = await page.goto(resource.url, {
      waitUntil: 'networkidle2',
      timeout: 45000
    });

    // Wait extra time for Cloudflare challenge to complete
    await new Promise(resolve => setTimeout(resolve, 5000));

    result.httpCode = response ? response.status() : 0;
    const finalUrl = page.url();

    console.log(`    HTTP: ${result.httpCode} | Final URL: ${finalUrl}`);

    // Get page title
    result.pageTitle = await page.title();
    console.log(`    Title: ${result.pageTitle}`);

    // Get page content for login detection
    const pageContent = await page.content();
    result.loginDetected = detectLogin(pageContent, finalUrl);

    // Determine status
    if (result.httpCode === 404) {
      result.status = '404 Not Found';
      result.notes = '❌ Page not found';

      // Check Wayback Machine
      console.log(`    Checking Wayback Machine...`);
      const wayback = await checkWaybackMachine(resource.url);
      if (wayback.available) {
        result.archiveUrl = wayback.url;
        const archiveDate = wayback.timestamp ?
          `${wayback.timestamp.slice(0,4)}-${wayback.timestamp.slice(4,6)}-${wayback.timestamp.slice(6,8)}` :
          'Unknown date';
        result.notes = `⚠️ ARCHIVED VERSION - Original link broken. Last archived: ${archiveDate}`;
        console.log(`    Found archive: ${archiveDate}`);
      } else {
        result.notes = '❌ Page not found, no archive available. Consider removing or finding replacement.';
      }
    } else if (result.httpCode === 403) {
      // Check if it's Cloudflare protection
      if (result.pageTitle && result.pageTitle.includes('Just a moment')) {
        result.status = 'Cloudflare Protected';
        result.notes = '🛡️ Bot protection active - likely works in real browser. Verify manually.';
      } else {
        result.status = '403 Forbidden';
        result.notes = '🔒 Access forbidden';
      }
    } else if (result.httpCode === 401) {
      result.status = '401 Unauthorized';
      result.loginDetected = true;
      result.notes = '🔐 Authentication required';
    } else if (result.httpCode >= 200 && result.httpCode < 300) {
      if (result.loginDetected) {
        result.status = 'Requires Login';
        result.notes = '🔐 Requires DAU account login';
      } else {
        result.status = 'Active';
        result.notes = '✅ Page loads correctly';
      }
    } else if (result.httpCode >= 300 && result.httpCode < 400) {
      result.status = 'Redirect';
      result.notes = `↪️ Redirected to: ${finalUrl}`;
    } else {
      result.status = 'Error';
      result.notes = `⚠️ Unexpected HTTP code: ${result.httpCode}`;
    }

    // Take screenshot
    const screenshotFilename = `${String(resource.id).padStart(2, '0')}-${resource.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.jpg`;
    result.screenshotPath = path.join(SCREENSHOTS_DIR, screenshotFilename);

    await page.screenshot({
      path: result.screenshotPath,
      type: 'jpeg',
      quality: 80,
      fullPage: false
    });
    console.log(`    Screenshot: ${screenshotFilename}`);

  } catch (err) {
    console.log(`    ERROR: ${err.message}`);

    if (err.message.includes('timeout')) {
      result.status = 'Timeout';
      result.notes = '⏱️ Page timed out after 30s';
    } else if (err.message.includes('net::ERR_CERT')) {
      result.status = 'SSL Error';
      result.notes = '🔒 SSL certificate error';
    } else {
      result.status = 'Error';
      result.notes = `❌ ${err.message}`;
    }

    // Try to take screenshot anyway
    try {
      const screenshotFilename = `${String(resource.id).padStart(2, '0')}-error.jpg`;
      result.screenshotPath = path.join(SCREENSHOTS_DIR, screenshotFilename);
      await page.screenshot({ path: result.screenshotPath, type: 'jpeg', quality: 80 });
    } catch (screenshotErr) {
      console.log(`    Could not capture screenshot: ${screenshotErr.message}`);
    }
  } finally {
    await page.close();
  }

  console.log(`    Status: ${result.status}`);
  return result;
}

async function generateExcel(results) {
  console.log('\n📊 Generating Excel spreadsheet...');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DOD IP Resource Validator';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Resource Validation', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 5 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Link', key: 'url', width: 50 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'HTTP Code', key: 'httpCode', width: 12 },
    { header: 'Page Title', key: 'pageTitle', width: 35 },
    { header: 'Screenshot', key: 'screenshot', width: 30 },
    { header: 'Login Detected', key: 'loginDetected', width: 15 },
    { header: 'Archive Link', key: 'archiveUrl', width: 50 },
    { header: 'Notes', key: 'notes', width: 60 }
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E79' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data rows
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const rowIndex = i + 2;

    // Set row height for screenshot
    worksheet.getRow(rowIndex).height = 80;

    // Add data
    worksheet.getCell(`A${rowIndex}`).value = result.id;
    worksheet.getCell(`B${rowIndex}`).value = result.title;

    // Make URL a hyperlink
    worksheet.getCell(`C${rowIndex}`).value = {
      text: result.url,
      hyperlink: result.url
    };
    worksheet.getCell(`C${rowIndex}`).font = { color: { argb: 'FF0563C1' }, underline: true };

    worksheet.getCell(`D${rowIndex}`).value = result.status;
    worksheet.getCell(`E${rowIndex}`).value = result.httpCode;
    worksheet.getCell(`F${rowIndex}`).value = result.pageTitle;

    // Embed screenshot
    if (result.screenshotPath && fs.existsSync(result.screenshotPath)) {
      const imageId = workbook.addImage({
        filename: result.screenshotPath,
        extension: 'jpeg'
      });

      worksheet.addImage(imageId, {
        tl: { col: 6, row: rowIndex - 1 },
        ext: { width: 180, height: 100 }
      });
      worksheet.getCell(`G${rowIndex}`).value = 'See image →';
    } else {
      worksheet.getCell(`G${rowIndex}`).value = 'No screenshot';
    }

    worksheet.getCell(`H${rowIndex}`).value = result.loginDetected ? 'Yes' : 'No';

    // Archive link as hyperlink if available
    if (result.archiveUrl) {
      worksheet.getCell(`I${rowIndex}`).value = {
        text: result.archiveUrl,
        hyperlink: result.archiveUrl
      };
      worksheet.getCell(`I${rowIndex}`).font = { color: { argb: 'FF0563C1' }, underline: true };
    }

    worksheet.getCell(`J${rowIndex}`).value = result.notes;

    // Conditional formatting based on status
    const statusCell = worksheet.getCell(`D${rowIndex}`);
    if (result.status === 'Active') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
      statusCell.font = { color: { argb: 'FF006100' } };
    } else if (result.status === 'Requires Login') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
      statusCell.font = { color: { argb: 'FF9C5700' } };
    } else if (result.status === 'Cloudflare Protected') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };  // Light gray-green
      statusCell.font = { color: { argb: 'FF507050' } };
    } else if (result.status.includes('404') || result.status === 'Error') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
      statusCell.font = { color: { argb: 'FF9C0006' } };
    }

    // Align cells
    worksheet.getRow(rowIndex).alignment = { vertical: 'middle', wrapText: true };
  }

  // Save workbook
  const outputPath = path.join(OUTPUT_DIR, 'DOD_IP_Resources_Validation.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`\n✅ Excel saved to: ${outputPath}`);

  return outputPath;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  DOD IP Learning Dashboard - Resource Validator');
  console.log('  Processing all 66 resources');
  console.log('═══════════════════════════════════════════════════════════════');

  const browser = await puppeteer.launch({
    headless: false,  // Use real browser window
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',  // Hide automation
      '--disable-infobars',
      '--window-size=1280,900'
    ],
    defaultViewport: null  // Use actual window size
  });

  const results = [];

  console.log(`  Processing ${ALL_RESOURCES.length} resources...\n`);

  try {
    for (const resource of ALL_RESOURCES) {
      const result = await validateResource(browser, resource);
      results.push(result);

      // Delay between requests to be polite
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Save results JSON
    const jsonPath = path.join(OUTPUT_DIR, 'validation-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results JSON saved to: ${jsonPath}`);

    // Generate Excel
    await generateExcel(results);

  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');

  const statusCounts = {};
  results.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  console.log('\n✅ Validation complete!');
}

main().catch(console.error);
