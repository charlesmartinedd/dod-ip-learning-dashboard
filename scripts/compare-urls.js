const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// File paths
const SOURCE_XLSX = path.join(__dirname, '..', '..', 'Documents', 'Obsidian Vault', '01_Projects', 'Intellectual Property', 'Learning Resources Spreadsheet.xlsx');
const DASHBOARD_HTML = path.join(__dirname, '..', 'index.html');
const OUTPUT_DIR = path.join(__dirname, '..', 'validation-output');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  URL Comparison Tool');
console.log('  Comparing source spreadsheet vs dashboard');
console.log('═══════════════════════════════════════════════════════════════\n');

// Step 1: Read source Excel
console.log('📊 Reading source spreadsheet...');
console.log(`   Path: ${SOURCE_XLSX}`);

if (!fs.existsSync(SOURCE_XLSX)) {
  console.error('❌ Source file not found!');
  process.exit(1);
}

const workbook = XLSX.readFile(SOURCE_XLSX);
const sheetName = workbook.SheetNames[0];
console.log(`   Sheet: ${sheetName}`);

const sourceData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
console.log(`   Found ${sourceData.length} rows\n`);

// Show column names
if (sourceData.length > 0) {
  console.log('   Columns found:', Object.keys(sourceData[0]).join(', '));
  console.log('');
}

// Step 2: Extract RESOURCES from index.html
console.log('📄 Reading dashboard index.html...');
const htmlContent = fs.readFileSync(DASHBOARD_HTML, 'utf-8');

// Extract RESOURCES array using regex
const resourcesMatch = htmlContent.match(/const RESOURCES = (\[[\s\S]*?\]);/);
if (!resourcesMatch) {
  console.error('❌ Could not find RESOURCES array in index.html');
  process.exit(1);
}

let dashboardResources;
try {
  dashboardResources = eval(resourcesMatch[1]);
  console.log(`   Found ${dashboardResources.length} resources in dashboard\n`);
} catch (e) {
  console.error('❌ Could not parse RESOURCES array:', e.message);
  process.exit(1);
}

// Step 3: Compare URLs
console.log('🔍 Comparing URLs...\n');

const results = [];
let matches = 0;
let mismatches = 0;
let notFound = 0;

// Try to find URL column in source data
const urlColumnNames = ['url', 'URL', 'Url', 'Link', 'link', 'Website', 'website', 'Resource URL', 'Resource Link', 'Currently Located'];
const titleColumnNames = ['title', 'Title', 'Name', 'name', 'Resource', 'resource', 'Resource Name', 'Resource Title'];

let urlColumn = null;
let titleColumn = null;

if (sourceData.length > 0) {
  const columns = Object.keys(sourceData[0]);
  urlColumn = columns.find(c => urlColumnNames.includes(c) || c.toLowerCase().includes('url') || c.toLowerCase().includes('link'));
  titleColumn = columns.find(c => titleColumnNames.includes(c) || c.toLowerCase().includes('title') || c.toLowerCase().includes('name'));

  console.log(`   URL column: ${urlColumn || 'NOT FOUND'}`);
  console.log(`   Title column: ${titleColumn || 'NOT FOUND'}\n`);
}

if (!urlColumn) {
  console.log('⚠️  Could not identify URL column. Showing all columns:\n');
  if (sourceData.length > 0) {
    console.log('First row data:');
    Object.entries(sourceData[0]).forEach(([key, value]) => {
      console.log(`   ${key}: ${String(value).substring(0, 80)}...`);
    });
  }
  process.exit(1);
}

// Create lookup map from dashboard by title (normalized)
const dashboardByTitle = new Map();
dashboardResources.forEach(r => {
  const normalizedTitle = r.title.toLowerCase().trim();
  dashboardByTitle.set(normalizedTitle, r);
});

// Compare each source row
sourceData.forEach((sourceRow, index) => {
  const sourceUrl = sourceRow[urlColumn] ? String(sourceRow[urlColumn]).trim() : '';
  const sourceTitle = titleColumn && sourceRow[titleColumn] ? String(sourceRow[titleColumn]).trim() : `Row ${index + 1}`;

  if (!sourceUrl) {
    return; // Skip empty URLs
  }

  // Find matching dashboard resource by title
  const normalizedSourceTitle = sourceTitle.toLowerCase().trim();
  let dashboardResource = dashboardByTitle.get(normalizedSourceTitle);

  // If not found by exact title, try partial match
  if (!dashboardResource) {
    for (const [key, value] of dashboardByTitle) {
      if (key.includes(normalizedSourceTitle) || normalizedSourceTitle.includes(key)) {
        dashboardResource = value;
        break;
      }
    }
  }

  const result = {
    id: dashboardResource ? dashboardResource.id : '-',
    sourceTitle: sourceTitle,
    dashboardTitle: dashboardResource ? dashboardResource.title : 'NOT FOUND',
    sourceUrl: sourceUrl,
    dashboardUrl: dashboardResource ? dashboardResource.url : 'NOT FOUND',
    match: false,
    difference: ''
  };

  if (!dashboardResource) {
    result.difference = '❌ Resource not found in dashboard';
    notFound++;
  } else if (sourceUrl === dashboardResource.url) {
    result.match = true;
    result.difference = '✅ Exact match';
    matches++;
  } else {
    mismatches++;
    // Find the difference
    const diffs = findDifferences(sourceUrl, dashboardResource.url);
    result.difference = diffs;
  }

  results.push(result);

  // Log mismatches
  if (!result.match && dashboardResource) {
    console.log(`[${result.id}] ${sourceTitle}`);
    console.log(`   Source:    ${sourceUrl}`);
    console.log(`   Dashboard: ${dashboardResource.url}`);
    console.log(`   Issue:     ${result.difference}\n`);
  }
});

function findDifferences(str1, str2) {
  const diffs = [];

  // Check length
  if (str1.length !== str2.length) {
    diffs.push(`Length: ${str1.length} vs ${str2.length}`);
  }

  // Character by character comparison
  const minLen = Math.min(str1.length, str2.length);
  let firstDiffPos = -1;

  for (let i = 0; i < minLen; i++) {
    if (str1[i] !== str2[i]) {
      firstDiffPos = i;
      break;
    }
  }

  if (firstDiffPos >= 0) {
    const context = 20;
    const start = Math.max(0, firstDiffPos - context);
    const end = Math.min(str1.length, firstDiffPos + context);
    diffs.push(`First diff at pos ${firstDiffPos}: "${str1.substring(start, end)}" vs "${str2.substring(start, Math.min(str2.length, firstDiffPos + context))}"`);
  }

  // Check for common issues
  if (str1.toLowerCase() === str2.toLowerCase()) {
    diffs.push('Case difference only');
  }

  if (str1.replace(/\/$/, '') === str2.replace(/\/$/, '')) {
    diffs.push('Trailing slash difference');
  }

  if (str1.replace(/^https?:\/\//, '') === str2.replace(/^https?:\/\//, '')) {
    diffs.push('HTTP vs HTTPS difference');
  }

  return diffs.join('; ') || 'Unknown difference';
}

// Step 4: Generate report
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  ✅ Matches:      ${matches}`);
console.log(`  ❌ Mismatches:   ${mismatches}`);
console.log(`  ⚠️  Not Found:    ${notFound}`);
console.log(`  📊 Total:        ${results.length}`);

// Generate Excel report
async function generateReport() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('URL Comparison');

  ws.columns = [
    { header: 'ID', key: 'id', width: 5 },
    { header: 'Source Title', key: 'sourceTitle', width: 40 },
    { header: 'Dashboard Title', key: 'dashboardTitle', width: 40 },
    { header: 'Source URL', key: 'sourceUrl', width: 60 },
    { header: 'Dashboard URL', key: 'dashboardUrl', width: 60 },
    { header: 'Match', key: 'match', width: 10 },
    { header: 'Difference', key: 'difference', width: 50 }
  ];

  // Style header
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data
  results.forEach(r => {
    const row = ws.addRow({
      id: r.id,
      sourceTitle: r.sourceTitle,
      dashboardTitle: r.dashboardTitle,
      sourceUrl: r.sourceUrl,
      dashboardUrl: r.dashboardUrl,
      match: r.match ? 'Yes' : 'No',
      difference: r.difference
    });

    // Color code
    const matchCell = row.getCell('match');
    if (r.match) {
      matchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
    } else {
      matchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
    }
  });

  const outputPath = path.join(OUTPUT_DIR, 'URL_Comparison_Report.xlsx');
  await wb.xlsx.writeFile(outputPath);
  console.log(`\n📄 Report saved to: ${outputPath}`);
}

generateReport().catch(console.error);
