// ═══════════════════════════════════════════════════════════════
// db.js — Tencent CloudBase integration
// ═══════════════════════════════════════════════════════════════

const TCB_ENV = 'kindylab-1gf3c18x96831580';
let tcbApp = null;
let tcbDb = null;
let isLoggedIn = false;

function initDB() {
  try {
    if (typeof tcb !== 'undefined') {
      tcbApp = tcb.init({ env: TCB_ENV });
      tcbDb = tcbApp.database();
      console.log('CloudBase initialized, env:', TCB_ENV);
    } else {
      console.warn('CloudBase SDK (tcb) not loaded');
    }
  } catch (e) {
    console.warn('CloudBase SDK not available:', e);
  }
}

async function ensureLogin() {
  if (isLoggedIn) return true;
  try {
    if (tcbApp) {
      const auth = tcbApp.auth({ persistence: 'local' });
      const loginState = await auth.getLoginState();
      if (!loginState) {
        console.log('Attempting anonymous login...');
        await auth.anonymousAuthProvider().signIn();
        console.log('Anonymous login succeeded');
      } else {
        console.log('Already logged in');
      }
      isLoggedIn = true;
      return true;
    }
  } catch (e) {
    console.error('CloudBase login failed:', e);
    console.error('请检查：1) 腾讯云CloudBase控制台是否已开启"匿名登录"；2) 环境ID是否正确:', TCB_ENV);
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

  // Try CloudBase first
  try {
    if (!tcbDb) {
      console.warn('CloudBase DB not initialized — skipping cloud save');
    } else {
      const loggedIn = await ensureLogin();
      if (loggedIn) {
        const result = await tcbDb.collection('questionnaire_responses').add(data);
        console.log('数据保存成功 (CloudBase):', result);
        return true;
      } else {
        console.warn('CloudBase login failed — falling back to localStorage');
      }
    }
  } catch (err) {
    console.error('CloudBase 保存失败:', err);
    if (err.message && err.message.includes('collection not exists')) {
      console.error('请确认数据库集合 "questionnaire_responses" 已创建');
    }
    if (err.message && err.message.includes('permission')) {
      console.error('请确认数据库集合权限已设置为"所有用户可读写"或开启匿名登录权限');
    }
  }

  // Fallback: localStorage
  try {
    const key = 'backup_' + Date.now();
    localStorage.setItem(key, JSON.stringify(data));
    console.log('数据已备份到 localStorage:', key);
    return true;
  } catch (e) {
    console.error('localStorage 备份也失败:', e);
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
