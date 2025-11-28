/**
 * DoD IP Learning Resources - Executive Dashboard
 * JavaScript visualization and data population
 * Classification: UNCLASSIFIED
 */

// Global data store
let dashboardData = null;

// Chart instances
let heatmapChart = null;
let radarChart = null;

/**
 * Initialize dashboard on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadData();
        populateHeroMetrics();
        renderCoverageHeatmap();
        renderQualityRadar();
        populateGapsList();
        populateStrengthsList();
        updateGeneratedDate();

        console.log('✅ Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Dashboard initialization failed:', error);
        showErrorMessage('Failed to load dashboard data. Please check data_analysis.json exists.');
    }
});

/**
 * Load data from data_analysis.json
 */
async function loadData() {
    try {
        const response = await fetch('data_analysis.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        dashboardData = await response.json();
        console.log('✅ Data loaded:', dashboardData);
    } catch (error) {
        console.error('❌ Failed to load data:', error);
        throw error;
    }
}

/**
 * Populate hero metrics section
 */
function populateHeroMetrics() {
    const { metrics } = dashboardData;

    // Overall quality score
    document.getElementById('overallQuality').textContent = `${dashboardData.qualityScores.overall}/100`;

    // Total resources
    document.getElementById('totalResources').textContent = metrics.totalResources;

    // New in 2025
    document.getElementById('newResources').textContent = metrics.newIn2025;
    document.getElementById('newTrend').textContent = `${metrics.percentNew}% of total`;

    // Video resources
    document.getElementById('videoCount').textContent = metrics.videoCount;
    document.getElementById('videoTrend').textContent = `${metrics.percentVideo}% of library`;

    // Document resources
    document.getElementById('documentCount').textContent = metrics.documentCount;

    console.log('✅ Hero metrics populated');
}

/**
 * Render coverage heatmap (Audience × Topic matrix)
 */
function renderCoverageHeatmap() {
    const canvas = document.getElementById('coverageHeatmap');
    const ctx = canvas.getContext('2d');

    // Prepare matrix data
    const audiences = Object.keys(dashboardData.audiences);
    const topics = Object.keys(dashboardData.topics);
    const matrixData = [];

    audiences.forEach((audience, yIndex) => {
        topics.forEach((topic, xIndex) => {
            const value = dashboardData.coverageMatrix[audience][topic];
            matrixData.push({
                x: topic,
                y: audience,
                v: value
            });
        });
    });

    // Determine max value for color scaling
    const maxValue = Math.max(...matrixData.map(d => d.v));

    // Create heatmap
    heatmapChart = new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: 'Resource Count',
                data: matrixData,
                backgroundColor: function(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    const alpha = value / maxValue;

                    // Government blue gradient: light to dark
                    if (value === 0) return 'rgba(240, 240, 240, 0.3)';
                    if (value <= 5) return `rgba(0, 113, 188, ${0.2 + alpha * 0.3})`; // Low
                    if (value <= 15) return `rgba(0, 113, 188, ${0.5 + alpha * 0.3})`; // Medium
                    return `rgba(0, 33, 71, ${0.7 + alpha * 0.3})`; // High
                },
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 2,
                width: ({ chart }) => (chart.chartArea || {}).width / topics.length - 4,
                height: ({ chart }) => (chart.chartArea || {}).height / audiences.length - 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 33, 71, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    borderColor: '#0071BC',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            const dataPoint = context[0].raw;
                            return `${dataPoint.y}`;
                        },
                        label: function(context) {
                            const dataPoint = context.raw;
                            return [
                                `Topic: ${dataPoint.x}`,
                                `Resources: ${dataPoint.v}`,
                                '',
                                getCoverageLevelText(dataPoint.v)
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    labels: topics,
                    offset: true,
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#002147',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'category',
                    labels: audiences,
                    offset: true,
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#002147'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    console.log('✅ Coverage heatmap rendered');
}

/**
 * Get coverage level text for tooltip
 */
function getCoverageLevelText(value) {
    if (value === 0) return '⚠️ No Coverage';
    if (value <= 5) return '📊 Low Coverage';
    if (value <= 15) return '📈 Medium Coverage';
    return '✅ High Coverage';
}

/**
 * Render quality radar chart
 */
function renderQualityRadar() {
    const canvas = document.getElementById('qualityRadar');
    const ctx = canvas.getContext('2d');

    const { qualityScores } = dashboardData;

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Completeness',
                'Currency',
                'Diversity',
                'Coverage'
            ],
            datasets: [{
                label: 'Quality Score',
                data: [
                    qualityScores.completeness,
                    qualityScores.currency,
                    qualityScores.diversity,
                    qualityScores.coverage
                ],
                backgroundColor: 'rgba(0, 113, 188, 0.2)',
                borderColor: '#0071BC',
                borderWidth: 3,
                pointBackgroundColor: '#002147',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#0071BC',
                pointHoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 33, 71, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    borderColor: '#0071BC',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `Score: ${context.parsed.r}/100`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 25,
                        font: {
                            size: 10
                        },
                        color: '#666',
                        backdropColor: 'rgba(255, 255, 255, 0)'
                    },
                    grid: {
                        color: 'rgba(0, 113, 188, 0.2)',
                        lineWidth: 1
                    },
                    angleLines: {
                        color: 'rgba(0, 113, 188, 0.2)',
                        lineWidth: 1
                    },
                    pointLabels: {
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        color: '#002147'
                    }
                }
            }
        }
    });

    console.log('✅ Quality radar chart rendered');
}

/**
 * Populate strategic gaps list
 */
function populateGapsList() {
    const gapsList = document.getElementById('gapList');
    const gapCount = document.getElementById('gapCount');
    const { gaps } = dashboardData;

    gapCount.textContent = gaps.length;

    gapsList.innerHTML = gaps.map(gap => {
        const severityClass = gap.severity.toLowerCase();
        const severityEmoji = {
            'HIGH': '🔴',
            'MEDIUM': '🟡',
            'LOW': '🟢'
        }[gap.severity];

        return `
            <div class="gap-item severity-${severityClass}">
                <div class="gap-header">
                    <span class="gap-severity">${severityEmoji} ${gap.severity}</span>
                    <span class="gap-count">${gap.count || ''}</span>
                </div>
                <div class="gap-description">${gap.description}</div>
            </div>
        `;
    }).join('');

    console.log('✅ Gaps list populated');
}

/**
 * Populate key strengths list
 */
function populateStrengthsList() {
    const strengthsList = document.getElementById('strengthList');
    const strengths = dashboardData.summary.strengths;

    strengthsList.innerHTML = strengths.map(strength => `
        <div class="strength-item">
            <div class="strength-icon">✅</div>
            <div class="strength-text">${strength}</div>
        </div>
    `).join('');

    console.log('✅ Strengths list populated');
}

/**
 * Update generated date
 */
function updateGeneratedDate() {
    const dateElement = document.getElementById('generatedDate');
    const generatedAt = new Date(dashboardData.generatedAt);
    const formattedDate = generatedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    dateElement.textContent = formattedDate;
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
    const container = document.querySelector('.dashboard-container');
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(220, 53, 69, 0.95);
        color: white;
        padding: 30px 50px;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    errorDiv.textContent = message;
    container.appendChild(errorDiv);
}

/**
 * Utility: Format numbers with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Window resize handler
 */
window.addEventListener('resize', () => {
    if (heatmapChart) heatmapChart.resize();
    if (radarChart) radarChart.resize();
});

console.log('📊 Dashboard script loaded');
