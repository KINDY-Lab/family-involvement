// ═══════════════════════════════════════════════════════════════
// admin.js — Management dashboard logic
// ═══════════════════════════════════════════════════════════════

const TCB_ENV = 'kindylab-1gf3c18x96831580';
const ADMIN_PWD_HASH = '04f3fcda36e0275c60f9a04b462de8ed6f29552875c36928917ab87d126ba9a1';

let adminApp = null;
let adminDb = null;
let adminLoggedIn = false;
let allRecords = [];

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initAdminDB();
  if (sessionStorage.getItem('admin_auth') === 'true') {
    adminLoggedIn = true;
    showDashboard();
  }
  checkUrlParams();
});

function initAdminDB() {
  try {
    if (typeof cloudbase !== 'undefined') {
      adminApp = cloudbase.init({ env: TCB_ENV });
    }
  } catch (e) {
    console.error('[Admin] CloudBase init failed:', e);
  }
}

async function ensureAdminLogin() {
  if (adminDb) return true;
  if (!adminApp) return false;
  try {
    const auth = adminApp.auth();
    await auth.signInAnonymously();
    adminDb = adminApp.database();
    return true;
  } catch (e) {
    console.error('[Admin] Auth failed:', e);
    return false;
  }
}

// ── Password ──
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleLogin() {
  const pwd = document.getElementById('adminPwd').value;
  if (!pwd) return;
  const hash = await sha256(pwd);
  if (hash === ADMIN_PWD_HASH) {
    adminLoggedIn = true;
    sessionStorage.setItem('admin_auth', 'true');
    showDashboard();
    checkUrlParams();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function handleLogout() {
  adminLoggedIn = false;
  sessionStorage.removeItem('admin_auth');
  document.getElementById('loginView').style.display = 'flex';
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('detailView').style.display = 'none';
}

// ── Data Fetching ──
async function fetchAllRecords() {
  const statusEl = document.getElementById('loadStatus');
  if (statusEl) statusEl.textContent = '正在加载数据...';

  if (!await ensureAdminLogin()) {
    if (statusEl) statusEl.textContent = '数据库连接失败';
    return;
  }

  try {
    allRecords = [];
    let skip = 0;
    const limit = 100;
    while (true) {
      const result = await adminDb.collection('questionnaire_responses')
        .skip(skip)
        .limit(limit)
        .get();
      if (result.data && result.data.length > 0) {
        allRecords = allRecords.concat(result.data);
        if (result.data.length < limit) break;
        skip += limit;
      } else {
        break;
      }
    }
    if (statusEl) statusEl.textContent = '';
    return allRecords;
  } catch (e) {
    console.error('[Admin] Fetch failed:', e);
    if (statusEl) statusEl.textContent = '数据加载失败: ' + (e.message || e);
    return [];
  }
}

// ── Dashboard ──
async function showDashboard() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('detailView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'block';
  document.getElementById('dashboardTitle').textContent = '问卷管理后台';
  history.pushState(null, '', '#dashboard');

  if (allRecords.length === 0) {
    await fetchAllRecords();
  }

  renderDashboard();
}

function renderDashboard() {
  const container = document.getElementById('dashboardContent');
  container.innerHTML = '';

  // Count by kindergarten
  const counts = {};
  Object.keys(KINDERGARTENS).forEach(d => {
    KINDERGARTENS[d].forEach(k => {
      counts[d + ' ' + k] = 0;
    });
  });
  allRecords.forEach(r => {
    const kid = r.demo_kindergarten;
    if (kid && counts[kid] !== undefined) counts[kid]++;
  });

  // Summary
  const totalRecords = allRecords.length;
  const totalKids = Object.values(counts).filter(c => c > 0).length;

  const summary = document.createElement('div');
  summary.className = 'summary-bar';
  summary.innerHTML = `
    <div class="summary-stat"><span class="summary-num">${totalRecords}</span>总提交数</div>
    <div class="summary-stat"><span class="summary-num">${totalKids}</span>已有提交的幼儿园</div>
    <div class="summary-stat"><span class="summary-num">${Object.keys(counts).length}</span>合作幼儿园总数</div>
    <button class="btn-refresh" onclick="refreshData()">刷新数据</button>
  `;
  container.appendChild(summary);

  // By district
  Object.keys(KINDERGARTENS).forEach(district => {
    const section = document.createElement('div');
    section.className = 'district-section';

    let districtTotal = 0;
    let cardsHtml = '';
    KINDERGARTENS[district].forEach(school => {
      const key = district + ' ' + school;
      const count = counts[key] || 0;
      districtTotal += count;
      cardsHtml += `
        <div class="kid-card" onclick="showDetail('${key.replace(/'/g, "\\'")}')">
          <div class="kid-name">${school}</div>
          <div class="kid-count">${count} 份</div>
        </div>`;
    });

    section.innerHTML = `
      <div class="district-header">
        <span class="district-name">${district}</span>
        <span class="district-total">${districtTotal} 份</span>
      </div>
      <div class="kid-grid">${cardsHtml}</div>`;

    container.appendChild(section);
  });
}

async function refreshData() {
  allRecords = [];
  await fetchAllRecords();
  renderDashboard();
}

// ── Detail View ──
function showDetail(kindergarten) {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  document.getElementById('dashboardTitle').textContent = kindergarten;

  history.pushState(null, '', '#detail=' + encodeURIComponent(kindergarten));

  const records = allRecords
    .filter(r => r.demo_kindergarten === kindergarten)
    .sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));

  // Info bar
  const info = document.getElementById('detailInfo');
  const trackingUrl = location.origin + location.pathname + '?kid=' + encodeURIComponent(kindergarten);
  info.innerHTML = `
    <div class="detail-meta">
      <span>共 <strong>${records.length}</strong> 条记录</span>
      <button class="btn-export" onclick="exportCSV('${kindergarten.replace(/'/g, "\\'")}')">导出 CSV</button>
    </div>
    <div class="tracking-link">
      <label>追踪链接：</label>
      <input type="text" readonly value="${trackingUrl}" onclick="this.select()" class="tracking-input">
      <button class="btn-copy" onclick="copyTrackingLink('${trackingUrl.replace(/'/g, "\\'")}')">复制</button>
    </div>`;

  // Table
  const tbody = document.getElementById('detailTableBody');
  if (records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;">暂无提交记录</td></tr>';
    return;
  }

  tbody.innerHTML = records.map((r, i) => {
    const name = r.demo_child_name || '-';
    const cls = r.demo_class || '-';
    const time = r.submitted_at ? new Date(r.submitted_at).toLocaleString('zh-CN') : '-';
    return `<tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(cls)}</td>
      <td>${time}</td>
    </tr>`;
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── CSV Export ──
function exportCSV(kindergarten) {
  const records = allRecords
    .filter(r => r.demo_kindergarten === kindergarten)
    .sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));

  if (records.length === 0) {
    alert('没有可导出的记录');
    return;
  }

  const BOM = '﻿';
  const header = '序号,孩子姓名,班级,提交时间\n';
  const rows = records.map((r, i) =>
    `${i + 1},"${(r.demo_child_name || '').replace(/"/g, '""')}","${(r.demo_class || '').replace(/"/g, '""')}","${r.submitted_at || ''}"`
  ).join('\n');

  const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = kindergarten.replace(/\s+/g, '_') + '_问卷记录.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── URL Params ──
function checkUrlParams() {
  const params = new URLSearchParams(location.search);
  const kid = params.get('kid');
  if (kid && adminLoggedIn) {
    showDetail(kid);
  }
}

function copyTrackingLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert('链接已复制到剪贴板');
  }).catch(() => {
    // Fallback
    const input = document.querySelector('.tracking-input');
    if (input) { input.select(); document.execCommand('copy'); alert('链接已复制'); }
  });
}

// Handle back button
window.addEventListener('popstate', () => {
  if (location.hash.startsWith('#detail=')) {
    const kid = decodeURIComponent(location.hash.replace('#detail=', ''));
    if (adminLoggedIn) showDetail(kid);
  } else if (adminLoggedIn) {
    showDashboard();
  }
});

// Enter key for login
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('loginView').style.display !== 'none') {
    handleLogin();
  }
});
