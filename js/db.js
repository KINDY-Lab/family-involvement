// ═══════════════════════════════════════════════════════════════
// db.js — Tencent CloudBase integration (new SDK @cloudbase/js-sdk)
// ═══════════════════════════════════════════════════════════════

const TCB_ENV = 'kindylab-1gf3c18x96831580';
let tcbApp = null;
let tcbDb = null;
let isLoggedIn = false;

function initDB() {
  try {
    if (typeof cloudbase !== 'undefined') {
      tcbApp = cloudbase.init({ env: TCB_ENV });
      console.log('[DB] CloudBase initialized ✓, env:', TCB_ENV);
    } else {
      console.error('[DB] ❌ CloudBase SDK not loaded! cloudbase is undefined.');
    }
  } catch (e) {
    console.error('[DB] ❌ CloudBase init failed:', e.message || e);
  }
}

async function ensureLogin() {
  if (isLoggedIn && tcbDb) return true;

  if (!tcbApp) {
    console.error('[DB] ensureLogin: tcbApp is null — cannot proceed');
    return false;
  }

  try {
    console.log('[DB] Auth: calling app.auth().signInAnonymously()...');
    const auth = tcbApp.auth();
    const result = await auth.signInAnonymously();

    // New SDK may return { data, error } or throw
    if (result && result.error) {
      console.error('[DB] ❌ signInAnonymously returned error:', result.error);
      return false;
    }

    console.log('[DB] Auth: anonymous login succeeded ✓');

    // Get database reference AFTER successful auth
    console.log('[DB] Calling tcbApp.database()...');
    tcbDb = tcbApp.database();
    isLoggedIn = true;
    console.log('[DB] Database reference obtained ✓');
    return true;

  } catch (e) {
    console.error('[DB] ❌ ensureLogin FAILED');
    console.error('[DB]   message:', e.message || e);
    console.error('[DB]   code:   ', e.code || '(none)');
    console.error('[DB]   string: ', String(e));
    console.error('[DB] → 请检查 CloudBase 控制台:');
    console.error('    1) 身份认证 → 登录方式 → 匿名登录 → 是否开启');
    console.error('    2) 环境配置 → 安全配置 → 安全域名 → 是否添加了当前域名');
  }

  return false;
}

async function saveResponse(responseData) {
  const data = {
    ...responseData,
    submitted_at: new Date().toISOString(),
    user_agent: navigator.userAgent,
    session_id: generateUUID()
  };

  // Sanitize: CloudBase rejects undefined values
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) data[key] = null;
  });
  if (data.teacher_child_raw && typeof data.teacher_child_raw === 'object') {
    Object.keys(data.teacher_child_raw).forEach(key => {
      if (data.teacher_child_raw[key] === undefined) data.teacher_child_raw[key] = null;
    });
  }

  console.log('[DB] saveResponse called, fields:', Object.keys(data).length,
    ', size:', JSON.stringify(data).length, 'bytes');

  // Try CloudBase first
  try {
    if (!tcbApp) {
      console.error('[DB] ❌ tcbApp is null — CloudBase SDK never initialized. Skipping cloud save.');
    } else {
      console.log('[DB] Step 1: ensureLogin...');
      const loggedIn = await ensureLogin();
      console.log('[DB] Step 1 result: loggedIn =', loggedIn, ', tcbDb =', !!tcbDb);

      if (loggedIn && tcbDb) {
        console.log('[DB] Step 2: collection.add() — writing to questionnaire_responses...');
        const result = await tcbDb.collection('questionnaire_responses').add(data);
        console.log('[DB] ✅ CloudBase save succeeded!', JSON.stringify(result));
        return true;
      } else {
        console.warn('[DB] ⚠️ Login/DB failed — falling back to localStorage');
      }
    }
  } catch (err) {
    console.error('[DB] ❌ CloudBase save FAILED');
    console.error('[DB]   message:', err.message || err);
    console.error('[DB]   code:   ', err.code || '(none)');
    console.error('[DB]   string: ', String(err));

    if (err.message) {
      if (err.message.includes('not exist') || err.message.includes('not found')) {
        console.error('[DB] → 请在 CloudBase 控制台创建集合 "questionnaire_responses"');
      }
      if (err.message.includes('permission') || err.message.includes('PermissionDenied') || err.message.includes('denied')) {
        console.error('[DB] → 请设置集合权限为自定义规则: {"read":true,"write":true}');
      }
    }
  }

  // Fallback: localStorage
  try {
    const key = 'backup_' + Date.now();
    localStorage.setItem(key, JSON.stringify(data));
    console.log('[DB] ⚠️ Data backed up to localStorage:', key);
    return true;
  } catch (e) {
    console.error('[DB] ❌ localStorage backup also failed:', e);
  }

  return false;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Build the full response data object for submission
function buildResponseData(answers, fiqScores, ccnesScores, tcScores, parentType) {
  const data = {};

  // Demographics
  const demoFields = [
    'demo_role', 'demo_child_gender', 'demo_num_children', 'demo_child_order',
    'demo_caregiver', 'demo_education', 'demo_birthdate', 'demo_job',
    'demo_overtime', 'demo_social_ladder'
  ];
  demoFields.forEach(f => {
    data[f] = answers[f] !== undefined ? answers[f] : null;
  });

  // FIQ raw scores
  QUESTIONNAIRE_DATA.fiq.sections.forEach(sec => {
    sec.questions.forEach(q => {
      data['fiq_' + q.id.replace('fiq_', '')] = answers[q.id] || null;
    });
  });

  // FIQ computed scores
  data.fiq_home_mean = +fiqScores.home_mean.toFixed(2);
  data.fiq_school_mean = +fiqScores.school_mean.toFixed(2);
  data.fiq_comm_mean = +fiqScores.comm_mean.toFixed(2);
  data.fiq_total_mean = +fiqScores.total_mean.toFixed(2);

  // Teacher-child raw
  const tcRaw = {};
  QUESTIONNAIRE_DATA.teacherChild.groups.forEach(g => {
    g.items.forEach(item => {
      tcRaw[item.id] = answers[item.id] || null;
    });
  });
  data.teacher_child_raw = tcRaw;
  data.teacher_child_mean = +(tcScores.mean || 0).toFixed(2);

  // CCNES raw scores
  QUESTIONNAIRE_DATA.ccnes.scenarios.forEach(sc => {
    sc.responses.forEach(r => {
      data['ccnes_' + r.id] = answers[r.id] || null;
    });
  });

  // CCNES computed scores
  data.ccnes_EE = +(ccnesScores.EE || 0).toFixed(2);
  data.ccnes_EF = +(ccnesScores.EF || 0).toFixed(2);
  data.ccnes_PF = +(ccnesScores.PF || 0).toFixed(2);
  data.ccnes_MIN = +(ccnesScores.MIN || 0).toFixed(2);
  data.ccnes_DIS = +(ccnesScores.DIS || 0).toFixed(2);
  data.ccnes_PUN = +(ccnesScores.PUN || 0).toFixed(2);
  data.ccnes_supportive = +(ccnesScores.supportive || 0).toFixed(2);
  data.ccnes_suppressive = +(ccnesScores.suppressive || 0).toFixed(2);
  data.ccnes_emotion_diff = +(ccnesScores.emotion_diff || 0).toFixed(2);

  // Type
  data.parent_type = parentType;

  // Radar scores
  data.radar_home = +(fiqScores.radar_home || 0).toFixed(1);
  data.radar_school = +(fiqScores.radar_school || 0).toFixed(1);
  data.radar_comm = +(fiqScores.radar_comm || 0).toFixed(1);
  data.radar_emotion_support = +(ccnesScores.radar_emotion_support || 0).toFixed(1);
  data.radar_problem_solving = +(ccnesScores.radar_problem_solving || 0).toFixed(1);
  data.radar_teacher_child = +(tcScores.radar || 0).toFixed(1);

  return data;
}

// ═══════════════════════════════════════════════════════════════
// DEBUG: 在浏览器控制台输入 testCloudBase() 即可测试
// 不需要填问卷，直接测试每一步
// ═══════════════════════════════════════════════════════════════
window.testCloudBase = async function() {
  console.group('======= CloudBase 诊断测试 =======');

  // Step 1: SDK check
  console.log('[1/6] SDK:', typeof cloudbase !== 'undefined' ? '✅ 已加载 (@cloudbase/js-sdk)' : '❌ 未加载');
  if (typeof cloudbase === 'undefined') {
    console.error('→ cloudbase SDK 未加载！请检查 CDN URL');
    console.groupEnd();
    return;
  }

  // Step 2: Init
  let app;
  try {
    console.log('[2/6] cloudbase.init({ env: "' + TCB_ENV + '" })...');
    app = cloudbase.init({ env: TCB_ENV });
    console.log('[2/6] ✅ init 成功');
  } catch (e) {
    console.error('[2/6] ❌ init 失败:', e.message || e);
    console.groupEnd();
    return;
  }

  // Step 3+4: Get auth instance and login (call auth() only ONCE per SDK requirement)
  try {
    console.log('[3/6] 获取 auth 实例...');
    const auth = app.auth();
    console.log('[3/6] ✅ auth() 成功');

    console.log('[4/6] 尝试匿名登录...');
    const result = await auth.signInAnonymously();
    if (result && result.error) {
      console.error('[4/6] ❌ signInAnonymously 返回错误:', result.error);
      console.groupEnd();
      return;
    }
    console.log('[4/6] ✅ 匿名登录成功');
  } catch (e) {
    console.error('[4/6] ❌ 登录失败:', e.message || e);
    console.error('[4/6] → 请检查 CloudBase 控制台: 身份认证 → 匿名登录 是否开启');
    console.groupEnd();
    return;
  }

  // Step 5: Database
  let db;
  try {
    console.log('[5/6] 获取 database 引用...');
    db = app.database();
    console.log('[5/6] ✅ database() 成功');
  } catch (e) {
    console.error('[5/6] ❌ database() 失败:', e.message || e);
    console.groupEnd();
    return;
  }

  // Step 6: Write test
  try {
    console.log('[6/6] 写入测试数据到 questionnaire_responses...');
    const result = await db.collection('questionnaire_responses').add({
      _test: true,
      test_time: new Date().toISOString(),
      message: 'CloudBase connection test'
    });
    console.log('[6/6] ✅ 写入成功!', JSON.stringify(result));
    console.log('');
    console.log('🎉 全部通过！请到 CloudBase 控制台 → 数据库 → questionnaire_responses 确认有 _test=true 的记录');
  } catch (e) {
    console.error('[6/6] ❌ 写入失败:', e.message || e);
    console.error('[6/6]   code:', e.code || '(none)');
    if (e.message) {
      if (e.message.includes('not exist') || e.message.includes('not found')) {
        console.error('→ 请在 CloudBase 控制台创建集合 "questionnaire_responses"');
      }
      if (e.message.includes('permission') || e.message.includes('PermissionDenied')) {
        console.error('→ 请设置集合权限为自定义规则: {"read": true, "write": true}');
      }
    }
  }

  console.groupEnd();
};
