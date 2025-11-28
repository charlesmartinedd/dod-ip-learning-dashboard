/**
 * IP Learning Resources Data Analysis Script
 * Analyzes 102 resources and generates comprehensive metrics for executive dashboard
 */

const fs = require('fs');
const path = require('path');

// Load data
const dataPath = path.join(__dirname, '..', 'Dashboard', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`📊 Analyzing ${data.length} IP Learning Resources...\n`);

// ========================================
// 1. BASIC METRICS
// ========================================

const metrics = {
  totalResources: data.length,
  newIn2025: 0,
  videoCount: 0,
  documentCount: 0,
  webinarCount: 0,
  trainingCount: 0,
  websiteCount: 0,
  missingDates: 0,
  missingDescriptions: 0,
};

// Calculate basic metrics
data.forEach(item => {
  // Date analysis
  const dateStr = item['Date Published'];
  if (!dateStr || dateStr === '') {
    metrics.missingDates++;
  } else {
    // Parse DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[2]);
      if (year === 2025) metrics.newIn2025++;
    }
  }

  // Missing descriptions
  if (!item['Description'] || item['Description'] === '') {
    metrics.missingDescriptions++;
  }

  // Type analysis
  const type = (item['Type'] || '').toLowerCase();
  const webinar = (item['Webinar'] || '').toLowerCase();
  const videoLength = item['Video Length'];

  if (type.includes('video') || webinar.includes('video') || (videoLength && videoLength !== 'N/A')) {
    metrics.videoCount++;
  }
  if (type.includes('document') || type.includes('pdf')) {
    metrics.documentCount++;
  }
  if (type.includes('webinar') || webinar.includes('webinar')) {
    metrics.webinarCount++;
  }
  if (type.includes('training') || type.includes('asynchronous')) {
    metrics.trainingCount++;
  }
  if (type.includes('website') || type.includes('web')) {
    metrics.websiteCount++;
  }
});

metrics.percentNew = Math.round((metrics.newIn2025 / metrics.totalResources) * 100);
metrics.percentVideo = Math.round((metrics.videoCount / metrics.totalResources) * 100);

// ========================================
// 2. AUDIENCE ANALYSIS
// ========================================

const audiences = {
  'Program Managers': 0,
  'Contracting Officers': 0,
  'Engineers': 0,
  'Legal/IP Attorneys': 0,
  'Small Business': 0,
  'Logisticians': 0,
  'Acquisition Workforce': 0,
};

data.forEach(item => {
  const audience = (item['Audience'] || '').toLowerCase();

  if (audience.includes('program manager')) audiences['Program Managers']++;
  if (audience.includes('contracting')) audiences['Contracting Officers']++;
  if (audience.includes('engineer')) audiences['Engineers']++;
  if (audience.includes('attorney') || audience.includes('legal') || audience.includes('ip ')) audiences['Legal/IP Attorneys']++;
  if (audience.includes('small business')) audiences['Small Business']++;
  if (audience.includes('logistic')) audiences['Logisticians']++;
  if (audience.includes('acquisition workforce') || audience.includes('acquisition professional')) audiences['Acquisition Workforce']++;
});

// ========================================
// 3. TOPIC/KNOWLEDGE LEVEL ANALYSIS
// ========================================

const topics = {
  'Fundamentals/Basics': 0,
  'IP Strategy': 0,
  'Data Rights': 0,
  'SBIR/STTR': 0,
  'MOSA': 0,
  'Product Support': 0,
  'AI/Emerging Tech': 0,
  'Contracting/FAR': 0,
  'Policy/Guidance': 0,
};

data.forEach(item => {
  const title = (item['Title'] || '').toLowerCase();
  const desc = (item['Description'] || '').toLowerCase();
  const knowledgeLevel = (item['Knowledge Level'] || '').toLowerCase();
  const combined = `${title} ${desc} ${knowledgeLevel}`;

  if (combined.includes('basic') || combined.includes('fundamental') || combined.includes('foundation') || combined.includes('intro')) {
    topics['Fundamentals/Basics']++;
  }
  if (combined.includes('ip strategy') || combined.includes('intellectual property strategy')) {
    topics['IP Strategy']++;
  }
  if (combined.includes('data rights') || combined.includes('technical data')) {
    topics['Data Rights']++;
  }
  if (combined.includes('sbir') || combined.includes('sttr') || combined.includes('small business innovation')) {
    topics['SBIR/STTR']++;
  }
  if (combined.includes('mosa') || combined.includes('modular open systems')) {
    topics['MOSA']++;
  }
  if (combined.includes('product support') || combined.includes('sustainment') || combined.includes('lifecycle')) {
    topics['Product Support']++;
  }
  if (combined.includes('artificial intelligence') || combined.includes(' ai ') || combined.includes('emerging tech')) {
    topics['AI/Emerging Tech']++;
  }
  if (combined.includes('far ') || combined.includes('dfars') || combined.includes('contract') || combined.includes('rfp')) {
    topics['Contracting/FAR']++;
  }
  if (combined.includes('policy') || combined.includes('guidance') || combined.includes('dodi') || combined.includes('guidebook')) {
    topics['Policy/Guidance']++;
  }
});

// ========================================
// 4. COVERAGE HEATMAP MATRIX
// ========================================

// Audience × Topic Coverage Matrix
const coverageMatrix = {};
const audienceList = Object.keys(audiences);
const topicList = Object.keys(topics);

// Initialize matrix
audienceList.forEach(aud => {
  coverageMatrix[aud] = {};
  topicList.forEach(top => {
    coverageMatrix[aud][top] = 0;
  });
});

// Populate matrix
data.forEach(item => {
  const audience = (item['Audience'] || '').toLowerCase();
  const title = (item['Title'] || '').toLowerCase();
  const desc = (item['Description'] || '').toLowerCase();
  const knowledgeLevel = (item['Knowledge Level'] || '').toLowerCase();
  const combined = `${title} ${desc} ${knowledgeLevel}`;

  // Determine audience matches
  const audienceMatches = [];
  if (audience.includes('program manager')) audienceMatches.push('Program Managers');
  if (audience.includes('contracting')) audienceMatches.push('Contracting Officers');
  if (audience.includes('engineer')) audienceMatches.push('Engineers');
  if (audience.includes('attorney') || audience.includes('legal') || audience.includes('ip ')) audienceMatches.push('Legal/IP Attorneys');
  if (audience.includes('small business')) audienceMatches.push('Small Business');
  if (audience.includes('logistic')) audienceMatches.push('Logisticians');
  if (audience.includes('acquisition workforce') || audience.includes('acquisition professional')) audienceMatches.push('Acquisition Workforce');

  // Determine topic matches
  const topicMatches = [];
  if (combined.includes('basic') || combined.includes('fundamental') || combined.includes('foundation') || combined.includes('intro')) {
    topicMatches.push('Fundamentals/Basics');
  }
  if (combined.includes('ip strategy') || combined.includes('intellectual property strategy')) {
    topicMatches.push('IP Strategy');
  }
  if (combined.includes('data rights') || combined.includes('technical data')) {
    topicMatches.push('Data Rights');
  }
  if (combined.includes('sbir') || combined.includes('sttr') || combined.includes('small business innovation')) {
    topicMatches.push('SBIR/STTR');
  }
  if (combined.includes('mosa') || combined.includes('modular open systems')) {
    topicMatches.push('MOSA');
  }
  if (combined.includes('product support') || combined.includes('sustainment') || combined.includes('lifecycle')) {
    topicMatches.push('Product Support');
  }
  if (combined.includes('artificial intelligence') || combined.includes(' ai ') || combined.includes('emerging tech')) {
    topicMatches.push('AI/Emerging Tech');
  }
  if (combined.includes('far ') || combined.includes('dfars') || combined.includes('contract') || combined.includes('rfp')) {
    topicMatches.push('Contracting/FAR');
  }
  if (combined.includes('policy') || combined.includes('guidance') || combined.includes('dodi') || combined.includes('guidebook')) {
    topicMatches.push('Policy/Guidance');
  }

  // Update matrix
  audienceMatches.forEach(aud => {
    topicMatches.forEach(top => {
      if (coverageMatrix[aud] && coverageMatrix[aud][top] !== undefined) {
        coverageMatrix[aud][top]++;
      }
    });
  });
});

// ========================================
// 5. GAP ANALYSIS
// ========================================

const gaps = [];

// Gap 1: Missing metadata
if (metrics.missingDates > 0) {
  gaps.push({
    type: 'metadata',
    severity: 'medium',
    description: `${metrics.missingDates} resources lack publication dates`,
    count: metrics.missingDates,
    recommendation: 'Update metadata for all resources to enable accurate currency tracking'
  });
}

if (metrics.missingDescriptions > 0) {
  gaps.push({
    type: 'metadata',
    severity: 'low',
    description: `${metrics.missingDescriptions} resources missing descriptions`,
    count: metrics.missingDescriptions,
    recommendation: 'Add comprehensive descriptions to improve discoverability and usability'
  });
}

// Gap 2: Advanced vs Basic content ratio
const basicCount = topics['Fundamentals/Basics'];
const advancedThreshold = basicCount * 0.3;
const advancedCount = data.filter(i => {
  const combined = `${i['Title']} ${i['Description']} ${i['Knowledge Level']}`.toLowerCase();
  return combined.includes('advanced') || combined.includes('expert') || combined.includes('complex');
}).length;

if (advancedCount < advancedThreshold) {
  gaps.push({
    type: 'content',
    severity: 'high',
    description: `Limited advanced content (${advancedCount} items) compared to basic (${basicCount} items)`,
    count: Math.floor(advancedThreshold - advancedCount),
    recommendation: 'Develop advanced-level materials for experienced practitioners'
  });
}

// Gap 3: Interactive/hands-on content
const interactiveCount = data.filter(i => {
  const combined = `${i['Title']} ${i['Description']} ${i['Type']}`.toLowerCase();
  return combined.includes('workshop') || combined.includes('exercise') || combined.includes('capstone') || combined.includes('hands-on');
}).length;

if (interactiveCount < 5) {
  gaps.push({
    type: 'format',
    severity: 'medium',
    description: `Only ${interactiveCount} interactive/hands-on resources available`,
    count: 5 - interactiveCount,
    recommendation: 'Create more workshops, exercises, and practical application opportunities'
  });
}

// Gap 4: Currency - resources from 2024-2025
const recentResources = data.filter(i => {
  const dateStr = i['Date Published'];
  if (!dateStr) return false;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const year = parseInt(parts[2]);
    return year >= 2024;
  }
  return false;
}).length;

const currencyPercent = Math.round((recentResources / metrics.totalResources) * 100);
if (currencyPercent < 50) {
  gaps.push({
    type: 'currency',
    severity: 'medium',
    description: `Only ${currencyPercent}% of resources are from 2024-2025`,
    count: metrics.totalResources - recentResources,
    recommendation: 'Update or refresh older content to reflect current policies and practices'
  });
}

// Gap 5: Audience-specific gaps (low coverage areas in matrix)
audienceList.forEach(aud => {
  const totalForAudience = Object.values(coverageMatrix[aud]).reduce((sum, val) => sum + val, 0);
  if (totalForAudience < 10) {
    gaps.push({
      type: 'audience',
      severity: 'high',
      description: `Limited resources for ${aud} (${totalForAudience} resources)`,
      count: 10 - totalForAudience,
      recommendation: `Develop targeted content for ${aud} role-specific needs`
    });
  }
});

// Gap 6: Emerging topics coverage
const emergingTopics = ['AI/Emerging Tech', 'MOSA'];
emergingTopics.forEach(topic => {
  if (topics[topic] < 5) {
    gaps.push({
      type: 'topic',
      severity: 'high',
      description: `Insufficient ${topic} coverage (${topics[topic]} resources)`,
      count: 5 - topics[topic],
      recommendation: `Expand ${topic} content library to address growing DoD priorities`
    });
  }
});

// ========================================
// 6. QUALITY SCORES
// ========================================

const qualityScores = {
  completeness: 0,
  currency: 0,
  diversity: 0,
  coverage: 0,
  overall: 0,
};

// Completeness (metadata quality)
const itemsWithFullMetadata = data.filter(i =>
  i['Title'] && i['Description'] && i['Date Published'] && i['Audience'] && i['Type']
).length;
qualityScores.completeness = Math.round((itemsWithFullMetadata / metrics.totalResources) * 100);

// Currency (recent content)
qualityScores.currency = currencyPercent;

// Diversity (format variety)
const formatCount = [
  metrics.videoCount > 0 ? 1 : 0,
  metrics.documentCount > 0 ? 1 : 0,
  metrics.webinarCount > 0 ? 1 : 0,
  metrics.trainingCount > 0 ? 1 : 0,
  metrics.websiteCount > 0 ? 1 : 0,
].reduce((sum, val) => sum + val, 0);
qualityScores.diversity = Math.round((formatCount / 5) * 100);

// Coverage (audience reach)
const audiencesWithGoodCoverage = audienceList.filter(aud => audiences[aud] >= 10).length;
qualityScores.coverage = Math.round((audiencesWithGoodCoverage / audienceList.length) * 100);

// Overall quality score (weighted average)
qualityScores.overall = Math.round(
  (qualityScores.completeness * 0.25) +
  (qualityScores.currency * 0.30) +
  (qualityScores.diversity * 0.20) +
  (qualityScores.coverage * 0.25)
);

// ========================================
// 7. EXPORT RESULTS
// ========================================

const analysis = {
  generatedAt: new Date().toISOString(),
  metrics,
  audiences,
  topics,
  coverageMatrix,
  gaps,
  qualityScores,
  summary: {
    strengths: [
      `Strong foundational content library (${basicCount} basic resources)`,
      `Good video content representation (${metrics.percentVideo}%)`,
      `Comprehensive DAU credential program coverage`,
      `Active 2025 content development (${metrics.newIn2025} new resources)`,
    ],
    opportunities: [
      `Expand advanced-level content for experienced practitioners`,
      `Increase interactive/hands-on learning opportunities`,
      `Develop more AI and MOSA-focused materials`,
      `Strengthen coverage for underserved audiences`,
      `Update older content to reflect current policies`,
    ]
  }
};

// Write to file
const outputPath = path.join(__dirname, 'data_analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

console.log('✅ Analysis Complete!\n');
console.log(`📋 Total Resources: ${metrics.totalResources}`);
console.log(`🆕 New in 2025: ${metrics.newIn2025} (${metrics.percentNew}%)`);
console.log(`🎥 Video Content: ${metrics.videoCount} (${metrics.percentVideo}%)`);
console.log(`📚 Documents: ${metrics.documentCount}`);
console.log(`🎤 Webinars: ${metrics.webinarCount}`);
console.log(`\n🎯 Quality Score: ${qualityScores.overall}/100`);
console.log(`   - Completeness: ${qualityScores.completeness}/100`);
console.log(`   - Currency: ${qualityScores.currency}/100`);
console.log(`   - Diversity: ${qualityScores.diversity}/100`);
console.log(`   - Coverage: ${qualityScores.coverage}/100`);
console.log(`\n⚠️  Identified Gaps: ${gaps.length}`);
gaps.forEach((gap, idx) => {
  console.log(`   ${idx + 1}. [${gap.severity.toUpperCase()}] ${gap.description}`);
});
console.log(`\n💾 Analysis saved to: ${outputPath}`);
