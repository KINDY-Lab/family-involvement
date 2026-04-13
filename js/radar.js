// ═══════════════════════════════════════════════════════════════
// radar.js — Chart.js radar chart rendering
// ═══════════════════════════════════════════════════════════════

let radarInstance = null;
let shareRadarInstance = null;

function renderRadarChart(canvasId, radarData, typeColor, includeTeacherChild) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Destroy existing instance if same canvas
  if (canvasId === 'radarChart' && radarInstance) {
    radarInstance.destroy();
    radarInstance = null;
  }
  if (canvasId === 'share-radar' && shareRadarInstance) {
    shareRadarInstance.destroy();
    shareRadarInstance = null;
  }

  const isMobile = window.innerWidth < 600;
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
      label: '你的得分',
      data: data,
      backgroundColor: hexToRgba(typeColor, 0.15),
      borderColor: typeColor,
      borderWidth: 2.5,
      pointBackgroundColor: typeColor,
      pointRadius: isMobile ? 4 : 5,
      pointHoverRadius: isMobile ? 6 : 7,
    }
  ];

  // Add teacher-child as reference if available
  if (includeTeacherChild && radarData.radar_teacher_child !== undefined) {
    labels.push('家园关系*');
    datasets[0].data.push(null); // No main data for this axis
    datasets.push({
      label: '家园关系（参考）',
      data: [null, null, null, null, null, radarData.radar_teacher_child],
      borderDash: [5, 5],
      borderColor: '#94A3B8',
      backgroundColor: 'rgba(148,163,184,0.08)',
      pointBackgroundColor: '#94A3B8',
      pointRadius: isMobile ? 3 : 4,
      borderWidth: 2,
    });
  }

  const chart = new Chart(ctx, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 800, easing: 'easeInOutQuart' },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            font: { size: isMobile ? 9 : 11 },
            color: '#888',
            backdropColor: 'transparent'
          },
          grid: { color: 'rgba(0,0,0,0.08)' },
          pointLabels: {
            font: { size: isMobile ? 10 : 12, weight: '500' },
            color: '#444'
          }
        }
      },
      plugins: {
        legend: {
          display: includeTeacherChild,
          position: 'bottom',
          labels: {
            font: { size: isMobile ? 10 : 11 },
            padding: 10,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(78,42,132,0.9)',
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 6,
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
  if (canvasId === 'share-radar') shareRadarInstance = chart;

  return chart;
}
