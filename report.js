/**
 * Executive Report JavaScript
 * Populates two-page PDF-ready report
 */

let reportData = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadReportData();
        populatePage1();
        populatePage2();
        renderCoverageChart();
        console.log('✅ Executive report generated');
    } catch (error) {
        console.error('❌ Report generation failed:', error);
    }
});

async function loadReportData() {
    const response = await fetch('data_analysis.json');
    reportData = await response.json();
}

function populatePage1() {
    const { metrics, qualityScores, summary } = reportData;

    // Hero metrics
    document.getElementById('totalRes').textContent = metrics.totalResources;
    document.getElementById('newRes').textContent = metrics.newIn2025;
    document.getElementById('vidRes').textContent = metrics.videoCount;
    document.getElementById('qualRes').textContent = `${qualityScores.overall}/100`;

    // Quality scores
    document.getElementById('overallScore').textContent = qualityScores.overall;
    document.getElementById('compScore').textContent = qualityScores.completeness;
    document.getElementById('currScore').textContent = qualityScores.currency;
    document.getElementById('divScore').textContent = qualityScores.variety;
    document.getElementById('covScore').textContent = qualityScores.coverage;

    // Strengths
    const strengthsList = document.getElementById('strengthsList');
    strengthsList.innerHTML = summary.strengths.map(strength => `
        <div class="strength-item">
            <div class="strength-text">✅ ${strength}</div>
        </div>
    `).join('');

    // Date
    const date = new Date(reportData.generatedAt);
    document.getElementById('reportDate').textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function populatePage2() {
    const { gaps, summary, metrics, audiences, topics } = reportData;

    // Gaps
    const gapsList = document.getElementById('gapsList');
    gapsList.innerHTML = gaps.map(gap => {
        const severityClass = gap.severity.toLowerCase();
        const emoji = { high: '🔴', medium: '🟡', low: '🟢' }[severityClass];

        return `
            <div class="gap-item ${severityClass}">
                <div class="gap-header">
                    <span class="gap-severity">${emoji} ${gap.severity} Priority</span>
                </div>
                <div class="gap-desc">${gap.description}</div>
            </div>
        `;
    }).join('');

    // Recommendations (derived from opportunities)
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = summary.opportunities.map((opp, idx) => `
        <div class="recommendation">
            <div class="rec-title">Recommendation ${idx + 1}</div>
            <div class="rec-desc">${opp}</div>
        </div>
    `).join('');

    // Executive summary counts
    document.getElementById('totalCount').textContent = metrics.totalResources;
    document.getElementById('audienceCount').textContent = Object.keys(audiences).length;
    document.getElementById('topicCount').textContent = Object.keys(topics).length;
    document.getElementById('newCount').textContent = metrics.newIn2025;

    // Generated date
    const date = new Date(reportData.generatedAt);
    document.getElementById('genDate').textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderCoverageChart() {
    const canvas = document.getElementById('coverageChart');
    const ctx = canvas.getContext('2d');

    // Prepare data for compact heatmap
    const audiences = Object.keys(reportData.audiences);
    const topics = Object.keys(reportData.topics);
    const matrixData = [];

    audiences.forEach(audience => {
        topics.forEach(topic => {
            const value = reportData.coverageMatrix[audience][topic];
            matrixData.push({ x: topic, y: audience, v: value });
        });
    });

    const maxValue = Math.max(...matrixData.map(d => d.v));

    new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: 'Resources',
                data: matrixData,
                backgroundColor: function(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    const alpha = value / maxValue;
                    if (value === 0) return 'rgba(240, 240, 240, 0.5)';
                    if (value <= 5) return `rgba(0, 113, 188, ${0.3 + alpha * 0.2})`;
                    if (value <= 15) return `rgba(0, 113, 188, ${0.5 + alpha * 0.3})`;
                    return `rgba(0, 33, 71, ${0.7 + alpha * 0.3})`;
                },
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                width: ({ chart }) => (chart.chartArea || {}).width / topics.length - 2,
                height: ({ chart }) => (chart.chartArea || {}).height / audiences.length - 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (ctx) => ctx[0].raw.y,
                        label: (ctx) => `${ctx.raw.x}: ${ctx.raw.v} resources`
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    labels: topics,
                    ticks: {
                        font: { size: 8, weight: '600' },
                        color: '#002147',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { display: false }
                },
                y: {
                    type: 'category',
                    labels: audiences,
                    ticks: {
                        font: { size: 8, weight: '600' },
                        color: '#002147'
                    },
                    grid: { display: false }
                }
            }
        }
    });
}
