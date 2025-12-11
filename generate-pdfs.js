/**
 * PDF Generation Script for OSBP IP Learning Resources Dashboard
 * Generates professional single-page analytics reports for each tab
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Load resources data
const resources = JSON.parse(fs.readFileSync(path.join(__dirname, 'resources_data.json'), 'utf-8'));

// Logo path
const logoPath = 'C:/Users/MarieLexisDad/Downloads/OSBP Seal - High Resolution.png';

// Colors
const COLORS = {
    navy: '#1e3a5f',
    accent: '#2563eb',
    slate: '#64748b',
    lightGray: '#f1f5f9',
    black: '#000000',
    white: '#ffffff'
};

// Create reports directory
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
}

// Helper: Add header to page
function addHeader(doc, title) {
    // Add logo (small, top right)
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width - 90, 30, { width: 50 });
    }

    // Title
    doc.fillColor(COLORS.navy)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('DoD IP Learning Resources', 50, 40);

    // Subtitle
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor(COLORS.slate)
       .text(`Analytics Report: ${title}`, 50, 65);

    // Date
    doc.fontSize(10)
       .text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, 50, 85);

    // Header line
    doc.strokeColor(COLORS.navy)
       .lineWidth(2)
       .moveTo(50, 110)
       .lineTo(doc.page.width - 50, 110)
       .stroke();

    doc.y = 130;
}

// Helper: Add footer
function addFooter(doc) {
    const bottom = doc.page.height - 40;
    doc.fontSize(8)
       .fillColor(COLORS.slate)
       .text('Page 1 of 1', 50, bottom, { continued: true })
       .text('Office of Small Business Programs', { align: 'right' });
}

// Helper: Section header
function sectionHeader(doc, text) {
    doc.moveDown(0.5);
    doc.fillColor(COLORS.navy)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(text);
    doc.moveDown(0.3);
}

// Helper: Draw table
function drawTable(doc, headers, rows, options = {}) {
    const startX = options.x || 50;
    const startY = doc.y;
    const colWidths = options.colWidths || headers.map(() => (doc.page.width - 100) / headers.length);
    const rowHeight = options.rowHeight || 22;

    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.white);

    // Header row
    let x = startX;
    doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(COLORS.navy);
    headers.forEach((header, i) => {
        doc.fillColor(COLORS.white).text(header, x + 4, startY + 6, { width: colWidths[i] - 8 });
        x += colWidths[i];
    });

    // Data rows
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.black);
    rows.forEach((row, rowIndex) => {
        const y = startY + rowHeight * (rowIndex + 1);
        x = startX;

        // Alternating row background
        if (rowIndex % 2 === 0) {
            doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(COLORS.lightGray);
        }

        row.forEach((cell, i) => {
            doc.fillColor(COLORS.black).text(String(cell), x + 4, y + 6, { width: colWidths[i] - 8 });
            x += colWidths[i];
        });
    });

    doc.y = startY + rowHeight * (rows.length + 1) + 10;
}

// Calculate analytics data
function calculateAnalytics() {
    const typeCounts = {};
    const yearCounts = {};
    const audienceCounts = {};
    const topicCounts = {};
    const orgCounts = {};
    let datedCount = 0;

    resources.forEach(r => {
        typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;

        if (r.date) {
            const year = r.date.split('-')[0];
            yearCounts[year] = (yearCounts[year] || 0) + 1;
            datedCount++;
        }

        const org = r.organization || 'Unknown';
        orgCounts[org] = (orgCounts[org] || 0) + 1;

        const audienceStr = r.audience || '';
        ['Program Managers', 'Contracting', 'Engineers', 'Logisticians', 'Attorneys', 'Small Business'].forEach(role => {
            if (audienceStr.toLowerCase().includes(role.toLowerCase())) {
                audienceCounts[role] = (audienceCounts[role] || 0) + 1;
            }
        });

        const text = ((r.title || '') + ' ' + (r.description || '')).toLowerCase();
        const topics = {
            'IP Strategy': ['ip strategy', 'intellectual property strategy'],
            'Data Rights': ['data rights', 'technical data'],
            'MOSA': ['mosa', 'modular open systems'],
            'Contracting/FAR': ['far', 'dfars', 'contract'],
            'Licensing': ['license', 'licensing'],
            'Valuation': ['valuation', 'value'],
            'SBIR/STTR': ['sbir', 'sttr']
        };
        Object.entries(topics).forEach(([topic, keywords]) => {
            if (keywords.some(kw => text.includes(kw))) {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            }
        });
    });

    return { typeCounts, yearCounts, audienceCounts, topicCounts, orgCounts, datedCount, total: resources.length };
}

const analytics = calculateAnalytics();

// ========== GENERATE PDFs (all single page) ==========

// 1. Overview PDF
function generateOverviewPDF() {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, autoFirstPage: false });
    doc.addPage();
    doc.pipe(fs.createWriteStream(path.join(reportsDir, 'analytics-overview.pdf')));

    addHeader(doc, 'Overview');

    sectionHeader(doc, 'Summary Metrics');
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.black);
    doc.text(`Total Resources: ${analytics.total}`);
    doc.text(`Resource Types: ${Object.keys(analytics.typeCounts).length}`);
    doc.text(`Resources with Dates: ${analytics.datedCount} (${Math.round(analytics.datedCount / analytics.total * 100)}%)`);
    doc.moveDown(0.5);

    sectionHeader(doc, 'Resources by Type');
    const typeRows = Object.entries(analytics.typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => [type, count, Math.round(count / analytics.total * 100) + '%']);
    drawTable(doc, ['Type', 'Count', 'Percentage'], typeRows, { colWidths: [200, 100, 100] });

    sectionHeader(doc, 'Content Freshness');
    const freshness = { 'Current (2024-2025)': 0, 'Recent (2022-2023)': 0, 'Older (pre-2022)': 0, 'Undated': 0 };
    resources.forEach(r => {
        if (!r.date) { freshness['Undated']++; return; }
        const year = parseInt(r.date.split('-')[0]);
        if (year >= 2024) freshness['Current (2024-2025)']++;
        else if (year >= 2022) freshness['Recent (2022-2023)']++;
        else freshness['Older (pre-2022)']++;
    });
    const freshRows = Object.entries(freshness).map(([cat, count]) => [cat, count, Math.round(count / analytics.total * 100) + '%']);
    drawTable(doc, ['Category', 'Count', 'Percentage'], freshRows, { colWidths: [200, 100, 100] });

    addFooter(doc);
    doc.end();
    console.log('Generated: analytics-overview.pdf');
}

// 2. By Type PDF
function generateByTypePDF() {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, autoFirstPage: false });
    doc.addPage();
    doc.pipe(fs.createWriteStream(path.join(reportsDir, 'analytics-by-type.pdf')));

    addHeader(doc, 'By Type');

    sectionHeader(doc, 'Resource Type Breakdown');
    const typeRows = Object.entries(analytics.typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => [type, count, Math.round(count / analytics.total * 100) + '%']);
    drawTable(doc, ['Type', 'Count', 'Percentage'], typeRows, { colWidths: [200, 150, 150] });

    sectionHeader(doc, 'Type Definitions');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.black);
    const typeDescs = [
        ['Training', 'Online courses, credentials, and workshops'],
        ['Video', 'Educational videos explaining IP concepts'],
        ['Document', 'PDFs, guides, templates, and references'],
        ['Website', 'Online portals, FAQs, and interactive resources'],
        ['Webinar', 'Recorded presentations and virtual sessions']
    ];
    typeDescs.forEach(([type, desc]) => {
        doc.font('Helvetica-Bold').text(type + ': ', { continued: true });
        doc.font('Helvetica').text(desc);
    });

    addFooter(doc);
    doc.end();
    console.log('Generated: analytics-by-type.pdf');
}

// 3. Timeline PDF
function generateTimelinePDF() {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, autoFirstPage: false });
    doc.addPage();
    doc.pipe(fs.createWriteStream(path.join(reportsDir, 'analytics-timeline.pdf')));

    addHeader(doc, 'Timeline');

    sectionHeader(doc, 'Resources by Year');
    const yearRows = Object.entries(analytics.yearCounts)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([year, count]) => [year, count, Math.round(count / analytics.datedCount * 100) + '%']);
    drawTable(doc, ['Year', 'Count', '% of Dated'], yearRows, { colWidths: [150, 150, 150] });

    doc.moveDown();
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.black);
    doc.text(`${analytics.datedCount} of ${analytics.total} resources (${Math.round(analytics.datedCount / analytics.total * 100)}%) have publication dates.`);

    addFooter(doc);
    doc.end();
    console.log('Generated: analytics-timeline.pdf');
}

// 4. Audience PDF
function generateAudiencePDF() {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, autoFirstPage: false });
    doc.addPage();
    doc.pipe(fs.createWriteStream(path.join(reportsDir, 'analytics-audience.pdf')));

    addHeader(doc, 'Audience');

    sectionHeader(doc, 'Target Audience Coverage');
    const audienceRows = Object.entries(analytics.audienceCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([role, count]) => [role, count, Math.round(count / analytics.total * 100) + '%']);
    drawTable(doc, ['Role', 'Resources', 'Coverage'], audienceRows, { colWidths: [200, 100, 100] });

    doc.moveDown();
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.black);
    doc.text('Note: Resources may target multiple audiences. Percentages indicate what portion of total resources address each role.');

    addFooter(doc);
    doc.end();
    console.log('Generated: analytics-audience.pdf');
}

// 5. Quality PDF
function generateQualityPDF() {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, autoFirstPage: false });
    doc.addPage();
    doc.pipe(fs.createWriteStream(path.join(reportsDir, 'analytics-quality.pdf')));

    addHeader(doc, 'Quality');

    sectionHeader(doc, 'Quality Assessment');
    const completeness = Math.round((resources.filter(r => r.description && r.date && r.url).length / analytics.total) * 100);
    const currency = Math.round(((analytics.yearCounts['2024'] || 0) + (analytics.yearCounts['2025'] || 0)) / analytics.total * 100);
    const diversity = Math.round(Object.keys(analytics.typeCounts).length / 5 * 100);

    const qualityRows = [
        ['Completeness', completeness + '%', 'Resources with full metadata'],
        ['Currency', currency + '%', 'Resources from 2024-2025'],
        ['Type Diversity', diversity + '%', 'Variety of resource formats'],
        ['Overall Score', Math.round((completeness + currency + diversity) / 3) + '%', 'Average of all metrics']
    ];
    drawTable(doc, ['Metric', 'Score', 'Description'], qualityRows, { colWidths: [150, 100, 250] });

    addFooter(doc);
    doc.end();
    console.log('Generated: analytics-quality.pdf');
}

// 6. Topics PDF
function generateTopicsPDF() {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, autoFirstPage: false });
    doc.addPage();
    doc.pipe(fs.createWriteStream(path.join(reportsDir, 'analytics-topics.pdf')));

    addHeader(doc, 'Topics');

    sectionHeader(doc, 'Topic Coverage');
    const topicRows = Object.entries(analytics.topicCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([topic, count]) => [topic, count, Math.round(count / analytics.total * 100) + '%']);
    drawTable(doc, ['Topic', 'Resources', 'Coverage'], topicRows, { colWidths: [200, 100, 100] });

    doc.moveDown();
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.black);
    doc.text('Topics are identified by keyword analysis of resource titles and descriptions.');

    addFooter(doc);
    doc.end();
    console.log('Generated: analytics-topics.pdf');
}

// 7. Organization PDF
function generateOrganizationPDF() {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, autoFirstPage: false });
    doc.addPage();
    doc.pipe(fs.createWriteStream(path.join(reportsDir, 'analytics-organization.pdf')));

    addHeader(doc, 'Organization');

    sectionHeader(doc, 'Resources by Source');
    const orgRows = Object.entries(analytics.orgCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([org, count]) => [org, count, Math.round(count / analytics.total * 100) + '%']);
    drawTable(doc, ['Organization', 'Resources', 'Share'], orgRows, { colWidths: [250, 100, 100] });

    doc.moveDown();
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.black);
    doc.text(`Content is sourced from ${Object.keys(analytics.orgCounts).length} different organizations.`);

    addFooter(doc);
    doc.end();
    console.log('Generated: analytics-organization.pdf');
}

// 8. Cross-Tab PDF
function generateCrossTabPDF() {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, layout: 'landscape', autoFirstPage: false });
    doc.addPage();
    doc.pipe(fs.createWriteStream(path.join(reportsDir, 'analytics-cross-tab.pdf')));

    addHeader(doc, 'Cross-Tab');

    // Build cross-tab matrix
    const types = Object.keys(analytics.typeCounts).sort();
    const years = Object.keys(analytics.yearCounts).filter(y => y !== 'No Date').sort();

    const matrix = {};
    types.forEach(t => {
        matrix[t] = {};
        years.forEach(y => { matrix[t][y] = 0; });
    });

    resources.forEach(r => {
        if (r.date) {
            const year = r.date.split('-')[0];
            if (matrix[r.type] && matrix[r.type][year] !== undefined) {
                matrix[r.type][year]++;
            }
        }
    });

    sectionHeader(doc, 'Resource Count by Type and Year');
    const headers = ['Type', ...years];
    const rows = types.map(type => [type, ...years.map(y => matrix[type][y] || 0)]);
    const colWidth = (doc.page.width - 100) / headers.length;
    drawTable(doc, headers, rows, { colWidths: headers.map(() => colWidth) });

    addFooter(doc);
    doc.end();
    console.log('Generated: analytics-cross-tab.pdf');
}

// Generate all PDFs
console.log('Generating PDFs...');
generateOverviewPDF();
generateByTypePDF();
generateTimelinePDF();
generateAudiencePDF();
generateQualityPDF();
generateTopicsPDF();
generateOrganizationPDF();
generateCrossTabPDF();
console.log('All PDFs generated in reports/ folder');
