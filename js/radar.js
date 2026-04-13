// ═══════════════════════════════════════════════════════════════
// radar.js — Chart.js radar chart rendering (Time-perspective style)
// ═══════════════════════════════════════════════════════════════

let radarInstance = null;
let shareRadarInstance = null;
let tcRadarInstance = null;

function renderRadarChart(canvasId, radarData, typeColor, includeTeacherChild, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Destroy existing instance if same canvas
  if (canvasId === 'radarChart' && radarInstance) {
    radarInstance.destroy();
    radarInstance = null;
  }
  if ((canvasId === 'share-radar' || canvasId === 'share-radar-canvas') && shareRadarInstance) {
    shareRadarInstance.destroy();
    shareRadarInstance = null;
  }

  const isMobile = window.innerWidth < 600;
  const darkMode = options.darkMode || false;
  const labels = ['居家学习', '学校参与', '家园沟通', '情绪支持', '解决引导'];
  const data = [
    radarData.radar_home || 0,
    radarData.radar_school || 0,
    radarData.radar_comm || 0,
    radarData.radar_emotion_support || 0,
    radarData.radar_problem_solving || 0
  ];

  // Convert hex to rgba for background
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  const datasets = [
    {
      label: '您的得分',
      data: data,
      backgroundColor: darkMode ? 'rgba(255,255,255,0.15)' : hexToRgba(typeColor, 0.2),
      borderColor: darkMode ? 'rgba(255,255,255,0.85)' : typeColor,
      borderWidth: 2,
      pointBackgroundColor: darkMode ? '#ffffff' : typeColor,
      pointBorderColor: darkMode ? 'rgba(255,255,255,0.5)' : '#ffffff',
      pointBorderWidth: 2,
      pointRadius: isMobile ? 4 : 5,
      pointHoverRadius: isMobile ? 6 : 7,
    }
  ];

  const chart = new Chart(ctx, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            font: { size: darkMode ? (isMobile ? 10 : 11) : (isMobile ? 9 : 10) },
            color: darkMode ? 'rgba(255,255,255,0.4)' : '#9CA3AF',
            backdropColor: 'transparent'
          },
          grid: {
            color: darkMode ? 'rgba(255,255,255,0.12)' : '#e5e7eb',
            circular: true,
            lineWidth: 1
          },
          pointLabels: {
            font: { size: darkMode ? (isMobile ? 12 : 14) : (isMobile ? 11 : 12), weight: '500' },
            color: darkMode ? 'rgba(255,255,255,0.9)' : '#4b5563'
          },
          angleLines: {
            color: darkMode ? 'rgba(255,255,255,0.12)' : '#e5e7eb',
            lineWidth: 1
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(30,30,30,0.85)',
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              if (context.parsed.r === null) return '';
              return context.dataset.label + ': ' + context.parsed.r.toFixed(1);
            }
          }
        }
      }
    }
  });

  if (canvasId === 'radarChart') radarInstance = chart;
  if (canvasId === 'share-radar' || canvasId === 'share-radar-canvas') shareRadarInstance = chart;

  return chart;
}

// ── Teacher-Child Radar Chart ──
function renderTCRadarChart(canvasId, groupScores) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (tcRadarInstance) {
    tcRadarInstance.destroy();
    tcRadarInstance = null;
  }

  const isMobile = window.innerWidth < 600;
  const tcLabels = ['沟通频率', '信息分享\n舒适度', '教师响应', '文化契合', '教师品质', '公平感知'];
  const tcData = groupScores.map(g => g.radar || 0);

  const chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: tcLabels,
      datasets: [{
        label: '家园关系',
        data: tcData,
        backgroundColor: 'rgba(148,163,184,0.15)',
        borderColor: '#94A3B8',
        borderWidth: 2,
        pointBackgroundColor: '#64748B',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: isMobile ? 3 : 4,
        pointHoverRadius: isMobile ? 5 : 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            font: { size: isMobile ? 8 : 10 },
            color: '#9CA3AF',
            backdropColor: 'transparent'
          },
          grid: {
            color: '#e5e7eb',
            circular: true,
            lineWidth: 1
          },
          pointLabels: {
            font: { size: isMobile ? 9 : 11, weight: '400' },
            color: '#6b7280'
          },
          angleLines: {
            color: '#e5e7eb',
            lineWidth: 1
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30,30,30,0.85)',
          titleFont: { size: 11 },
          bodyFont: { size: 11 },
          padding: 8,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return '得分: ' + context.parsed.r.toFixed(1);
            }
          }
        }
      }
    }
  });

  tcRadarInstance = chart;
  return chart;
}
