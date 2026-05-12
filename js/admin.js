// ═══════════════════════════════════════════════════════════════
// admin.js — Management dashboard logic
// ═══════════════════════════════════════════════════════════════

const TCB_ENV = 'kindylab-1gf3c18x96831580';
const ADMIN_PWD_HASH = '04f3fcda36e0275c60f9a04b462de8ed6f29552875c36928917ab87d126ba9a1';

let adminApp = null;
let adminDb = null;
let adminLoggedIn = false;
let allRecords = [];
let currentDetailRecords = [];
let currentKindergarten = '';

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
  document.getElementById('recordView') && (document.getElementById('recordView').style.display = 'none');
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
  document.getElementById('recordView') && (document.getElementById('recordView').style.display = 'none');
  document.getElementById('detailView').style.display = 'block';
  document.getElementById('detailTitle').textContent = kindergarten;
  currentKindergarten = kindergarten;

  history.pushState(null, '', '#detail=' + encodeURIComponent(kindergarten));

  const records = allRecords
    .filter(r => r.demo_kindergarten === kindergarten)
    .sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
  currentDetailRecords = records;

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
      <td><button class="btn-view" onclick="showRecord(${i})">查看详情</button></td>
    </tr>`;
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── CSV Export ──
const CSV_COLUMNS = [
  // Basic
  { h: '序号', f: (_, i) => i + 1 },
  { h: '提交时间', f: r => r.submitted_at || '' },
  // Demographics
  { h: '孩子姓名', f: r => r.demo_child_name || '' },
  { h: '幼儿园', f: r => r.demo_kindergarten || '' },
  { h: '班级', f: r => r.demo_class || '' },
  { h: '身份', f: r => r.demo_role || '' },
  { h: '孩子性别', f: r => r.demo_child_gender || '' },
  { h: '孩子数量', f: r => r.demo_num_children || '' },
  { h: '孩子排行', f: r => r.demo_child_order || '' },
  { h: '主要照顾者', f: r => r.demo_caregiver || '' },
  { h: '最高学历', f: r => r.demo_education || '' },
  { h: '出生年月', f: r => r.demo_birthdate || '' },
  { h: '工作类别', f: r => r.demo_job || '' },
  { h: '加班频率', f: r => r.demo_overtime || '' },
  { h: '社会阶梯', f: r => r.demo_social_ladder || '' },
  // FIQ computed
  { h: 'FIQ居家均分', f: r => r.fiq_home_mean || '' },
  { h: 'FIQ学校均分', f: r => r.fiq_school_mean || '' },
  { h: 'FIQ沟通均分', f: r => r.fiq_comm_mean || '' },
  { h: 'FIQ总分均分', f: r => r.fiq_total_mean || '' },
  // Teacher-child
  { h: '师幼关系均分', f: r => r.teacher_child_mean || '' },
  // CCNES computed
  { h: 'EE_情感表达', f: r => r.ccnes_EE || '' },
  { h: 'EF_情感抚慰', f: r => r.ccnes_EF || '' },
  { h: 'PF_问题解决', f: r => r.ccnes_PF || '' },
  { h: 'MIN_轻视惩罚', f: r => r.ccnes_MIN || '' },
  { h: 'DIS_痛苦表达', f: r => r.ccnes_DIS || '' },
  { h: 'PUN_惩罚', f: r => r.ccnes_PUN || '' },
  { h: '支持性得分', f: r => r.ccnes_supportive || '' },
  { h: '压制性得分', f: r => r.ccnes_suppressive || '' },
  { h: '情感差异分', f: r => r.ccnes_emotion_diff || '' },
  // Type & radar
  { h: '家长类型', f: r => r.parent_type || '' },
  { h: '雷达_居家', f: r => r.radar_home || '' },
  { h: '雷达_学校', f: r => r.radar_school || '' },
  { h: '雷达_沟通', f: r => r.radar_comm || '' },
  { h: '雷达_情感', f: r => r.radar_emotion_support || '' },
  { h: '雷达_问题解决', f: r => r.radar_problem_solving || '' },
  { h: '雷达_师幼', f: r => r.radar_teacher_child || '' },
];

function csvVal(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return '"' + s.replace(/"/g, '""') + '"';
}

function exportCSV(kindergarten) {
  const records = allRecords
    .filter(r => r.demo_kindergarten === kindergarten)
    .sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));

  if (records.length === 0) {
    alert('没有可导出的记录');
    return;
  }

  const BOM = '﻿';
  const header = CSV_COLUMNS.map(c => c.h).join(',') + '\n';
  const rows = records.map((r, i) =>
    CSV_COLUMNS.map(c => csvVal(c.f(r, i))).join(',')
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

// ── Record Detail View ──
function showRecord(index) {
  const r = currentDetailRecords[index];
  if (!r) return;

  document.getElementById('detailView').style.display = 'none';
  document.getElementById('recordView').style.display = 'block';
  document.getElementById('recordTitle').textContent = (r.demo_child_name || '未知') + ' 的问卷';

  document.getElementById('recordContent').innerHTML = buildRecordHTML(r);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.pushState(null, '', '#record=' + index);
}

function backToDetail() {
  document.getElementById('recordView').style.display = 'none';
  showDetail(currentKindergarten);
}

function buildRecordHTML(r) {
  let html = '';

  // Basic info
  html += recordCard('基本信息', [
    ['孩子姓名', r.demo_child_name],
    ['幼儿园', r.demo_kindergarten],
    ['班级', r.demo_class],
    ['提交时间', r.submitted_at ? new Date(r.submitted_at).toLocaleString('zh-CN') : ''],
    ['家长类型', r.parent_type || '-'],
  ]);

  // Scoring summary
  html += recordCard('评分结果', [
    ['FIQ 居家均分', r.fiq_home_mean],
    ['FIQ 学校均分', r.fiq_school_mean],
    ['FIQ 沟通均分', r.fiq_comm_mean],
    ['FIQ 总分均分', r.fiq_total_mean],
    ['师幼关系均分', r.teacher_child_mean],
    ['EE 情感表达', r.ccnes_EE],
    ['EF 情感抚慰', r.ccnes_EF],
    ['PF 问题解决', r.ccnes_PF],
    ['MIN 轻视惩罚', r.ccnes_MIN],
    ['DIS 痛苦表达', r.ccnes_DIS],
    ['PUN 惩罚', r.ccnes_PUN],
    ['支持性得分', r.ccnes_supportive],
    ['压制性得分', r.ccnes_suppressive],
    ['情感差异分', r.ccnes_emotion_diff],
  ]);

  // Demographics (skip name/kindergarten/class already shown)
  const demoPairs = [];
  QUESTIONNAIRE_DATA.demographics.forEach(q => {
    if (['demo_child_name', 'demo_kindergarten', 'demo_class'].includes(q.id)) return;
    demoPairs.push([q.text, r[q.id] || '-']);
  });
  html += recordCard('背景信息', demoPairs);

  // FIQ
  const fiqLabels = QUESTIONNAIRE_DATA.fiq.scaleLabels;
  QUESTIONNAIRE_DATA.fiq.sections.forEach(sec => {
    const pairs = sec.questions.map(q => {
      const v = r[q.id];
      return [q.text, v ? v + ' · ' + fiqLabels[v - 1] : '-'];
    });
    html += recordCard('家庭参与 — ' + sec.title, pairs);
  });

  // Teacher-child
  QUESTIONNAIRE_DATA.teacherChild.groups.forEach(g => {
    const pairs = g.items.map(item => {
      const v = r.teacher_child_raw ? r.teacher_child_raw[item.id] : undefined;
      return [item.text, v ? v + ' · ' + g.scale[v - 1] : '-'];
    });
    html += recordCard(g.title, pairs);
  });

  // CCNES
  const ccnesLabels = QUESTIONNAIRE_DATA.ccnes.scaleLabels;
  QUESTIONNAIRE_DATA.ccnes.scenarios.forEach((sc, idx) => {
    const pairs = [['情境描述', sc.description]];
    sc.responses.forEach(resp => {
      const v = r['ccnes_' + resp.id];
      pairs.push([resp.text, v ? v + ' · ' + ccnesLabels[v - 1] : '-']);
    });
    html += recordCard('情境 ' + (idx + 1), pairs);
  });

  return html;
}

function recordCard(title, pairs) {
  let html = '<div class="record-card"><div class="record-section-title">' + escapeHtml(title) + '</div>';
  pairs.forEach(([q, a]) => {
    html += '<div class="record-pair"><div class="record-q">' + escapeHtml(String(q)) + '</div>'
      + '<div class="record-a">' + escapeHtml(String(a != null ? a : '-')) + '</div></div>';
  });
  return html + '</div>';
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
  if (location.hash.startsWith('#record=')) {
    const idx = parseInt(location.hash.replace('#record=', ''));
    if (adminLoggedIn && currentDetailRecords[idx]) showRecord(idx);
  } else if (location.hash.startsWith('#detail=')) {
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
