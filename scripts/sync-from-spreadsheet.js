const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// File paths
const SOURCE_XLSX = path.join(__dirname, '..', '..', 'Documents', 'Obsidian Vault', '01_Projects', 'Intellectual Property', 'Learning Resources Spreadsheet.xlsx');
const DASHBOARD_HTML = path.join(__dirname, '..', 'index.html');
const OUTPUT_DIR = path.join(__dirname, '..', 'validation-output');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Sync Dashboard from Source Spreadsheet');
console.log('═══════════════════════════════════════════════════════════════\n');

// Step 1: Read source Excel
console.log('📊 Reading source spreadsheet...');
console.log(`   Path: ${SOURCE_XLSX}\n`);

const workbook = XLSX.readFile(SOURCE_XLSX);
const sheetName = workbook.SheetNames[0];
const sourceData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`   Found ${sourceData.length} rows\n`);

// Column mapping
const COLUMN_MAP = {
  title: 'Title',
  url: 'Currently Located',
  description: 'Description',
  organization: 'Originating Organization',
  type: 'Type',
  audience: 'Audience',
  date: 'Date Published',
  videoLength: 'Video Length'
};

// Type normalization
const TYPE_MAP = {
  'Asynchronous Training': 'Training',
  'Video': 'Video',
  'Webpage': 'Website',
  'Website': 'Website',
  'Document': 'Document',
  'Webinar': 'Webinar',
  'PDF': 'Document',
  'Other': 'Other',
  'Podcast': 'Other'
};

// Process each row
const resources = [];
const needsReview = [];

sourceData.forEach((row, index) => {
  const rawTitle = row[COLUMN_MAP.title] || '';
  const rawUrl = row[COLUMN_MAP.url] || '';
  const rawDescription = row[COLUMN_MAP.description] || '';
  const rawOrg = row[COLUMN_MAP.organization] || '';
  const rawType = row[COLUMN_MAP.type] || '';
  const rawAudience = row[COLUMN_MAP.audience] || '';
  const rawDate = row[COLUMN_MAP.date];
  const rawVideoLength = row[COLUMN_MAP.videoLength] || '';

  // Skip empty rows or header-like rows
  if (!rawTitle || rawTitle.toLowerCase().includes('this page on the')) {
    return;
  }

  // Clean title (remove notes in parentheses at end if they're meta notes)
  let title = rawTitle.trim();
  // Remove common meta notes but keep meaningful ones like "(15 min)"
  title = title.replace(/\s*\(does not play on govt computer\)\s*/gi, '');
  title = title.replace(/\s*\(courses below\)\s*/gi, '');

  // Process URL
  let url = rawUrl.trim();
  let urlNote = '';

  // Check if URL is actually a note
  if (!url.startsWith('http') && !url.startsWith('www.')) {
    if (url.toLowerCase().includes('within dau') ||
        url.toLowerCase().includes('accessible after') ||
        url.toLowerCase().includes('not searchable')) {
      urlNote = url;
      url = ''; // Will need manual lookup
      needsReview.push({ index: index + 1, title, note: urlNote });
    }
  }

  // Fix URL format
  if (url.startsWith('www.')) {
    url = 'https://' + url;
  }

  // Process type
  let type = TYPE_MAP[rawType] || rawType || 'Other';
  if (type.includes('Training')) type = 'Training';

  // Process date (Excel serial number to ISO date)
  let date = null;
  if (rawDate) {
    if (typeof rawDate === 'number') {
      // Excel serial date
      const excelEpoch = new Date(1899, 11, 30);
      const dateObj = new Date(excelEpoch.getTime() + rawDate * 86400000);
      date = dateObj.toISOString().split('T')[0];
    } else if (typeof rawDate === 'string' && rawDate.match(/\d{4}-\d{2}-\d{2}/)) {
      date = rawDate;
    }
  }

  // Process video length
  let videoLength = null;
  if (rawVideoLength && rawVideoLength !== 'N/A') {
    videoLength = rawVideoLength.trim();
    // Normalize format
    if (!videoLength.includes('min') && !videoLength.includes('hr')) {
      videoLength = videoLength + ' min';
    }
  }

  // Create summary from description (first sentence or first 100 chars)
  let summary = rawDescription.trim();
  const firstSentence = summary.match(/^[^.!?]+[.!?]/);
  if (firstSentence && firstSentence[0].length < 150) {
    summary = firstSentence[0];
  } else if (summary.length > 100) {
    summary = summary.substring(0, 100).trim() + '...';
  }

  const resource = {
    id: resources.length + 1,
    title: title,
    summary: summary,
    description: rawDescription.trim(),
    type: type,
    organization: rawOrg.trim().replace('Credential', '').trim() || 'DAU',
    audience: rawAudience.trim(),
    date: date,
    url: url,
    videoLength: videoLength
  };

  resources.push(resource);
});

console.log(`✅ Processed ${resources.length} resources\n`);

// Show items needing review
if (needsReview.length > 0) {
  console.log('⚠️  Items needing URL lookup:');
  needsReview.forEach(item => {
    console.log(`   [${item.index}] ${item.title}`);
    console.log(`       Note: ${item.note}\n`);
  });
}

// Step 2: Generate JavaScript array
const resourcesJson = JSON.stringify(resources, null, 2);

// Save as JSON for reference
const jsonPath = path.join(OUTPUT_DIR, 'resources_from_spreadsheet.json');
fs.writeFileSync(jsonPath, resourcesJson);
console.log(`📄 JSON saved to: ${jsonPath}\n`);

// Step 3: Update index.html
console.log('📝 Updating index.html...');

let htmlContent = fs.readFileSync(DASHBOARD_HTML, 'utf-8');

// Find and replace RESOURCES array
const resourcesRegex = /const RESOURCES = \[[\s\S]*?\];/;
const newResourcesBlock = `const RESOURCES = ${resourcesJson};`;

if (resourcesRegex.test(htmlContent)) {
  htmlContent = htmlContent.replace(resourcesRegex, newResourcesBlock);
  fs.writeFileSync(DASHBOARD_HTML, htmlContent);
  console.log('✅ index.html updated successfully!\n');
} else {
  console.log('❌ Could not find RESOURCES array in index.html\n');
}

// Summary
console.log('═══════════════════════════════════════════════════════════════');
console.log('  SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  Total resources: ${resources.length}`);
console.log(`  With valid URLs: ${resources.filter(r => r.url).length}`);
console.log(`  Missing URLs: ${resources.filter(r => !r.url).length}`);
console.log(`  With dates: ${resources.filter(r => r.date).length}`);

// Count by type
const typeCounts = {};
resources.forEach(r => {
  typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
});
console.log('\n  By Type:');
Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`    ${type}: ${count}`);
});

console.log('\n✅ Sync complete!');
