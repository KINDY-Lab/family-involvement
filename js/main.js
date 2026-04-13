// ═══════════════════════════════════════════════════════════════
// main.js — Step management, UI rendering, localStorage, navigation
// ═══════════════════════════════════════════════════════════════

let currentStep = 0; // 0=welcome, 1-4=steps, 5=results
const answers = {};
const STORAGE_KEY = 'family_involvement_progress';

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initDB();
  restoreProgress();
  showStep(currentStep);
  renderStep1();
  renderStep2();
  renderStep3();
  renderStep4();
});

// ── Step Navigation ──
function showStep(stepIdx) {
  currentStep = stepIdx;
  // Hide all sections
  document.querySelectorAll('.step-section, .welcome-section, .result-section, .loading-overlay').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });

  if (stepIdx === 0) {
    const el = document.getElementById('welcome');
    el.style.display = 'block';
    el.classList.add('active');
  } else if (stepIdx >= 1 && stepIdx <= 4) {
    const el = document.getElementById('step' + stepIdx);
    el.style.display = 'block';
    el.classList.add('active');
  } else if (stepIdx === 5) {
    // Results handled separately
  }

  // Progress bar: visible only during steps 1-4
  const progressWrap = document.getElementById('progressWrap');
  if (progressWrap) {
    progressWrap.style.display = (stepIdx >= 1 && stepIdx <= 4) ? 'block' : 'none';
  }

  updateProgressBar();
  saveProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar() {
  const step = STEPS[currentStep] || STEPS[0];
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  const pct = step.progress + '%';
  fill.style.width = pct;
  text.textContent = step.label + ' · ' + pct;
}

function nextStep() {
  // Validate current step
  if (currentStep >= 1 && currentStep <= 4) {
    const result = validateStep(currentStep);
    if (result !== true) {
      highlightUnanswered(result);
      return;
    }
    clearValidation();
  }
  if (currentStep < 4) {
    showStep(currentStep + 1);
  } else if (currentStep === 4) {
    submitQuestionnaire();
  }
}

function prevStep() {
  if (currentStep > 1) {
    clearValidation();
    showStep(currentStep - 1);
  }
}

function startQuestionnaire() {
  showStep(1);
}

// ── Validation ──
function validateStep(step) {
  if (step === 1) return validateStep1();
  if (step === 2) return validateStep2();
  if (step === 3) return validateStep3();
  if (step === 4) return validateStep4();
  return true;
}

function validateStep1() {
  const demos = QUESTIONNAIRE_DATA.demographics;
  for (const q of demos) {
    if (q.required) {
      if (q.type === 'checkbox') {
        const selected = document.querySelectorAll(`input[name="${q.id}"]:checked`);
        if (selected.length === 0) return [q.id];
      } else if (q.type === 'text') {
        if (!answers[q.id] || answers[q.id].trim() === '') return [q.id];
      } else if (q.type === 'slider') {
        if (answers[q.id] === undefined) return [q.id];
      } else {
        if (answers[q.id] === undefined) return [q.id];
      }
    }
  }
  return true;
}

function validateStep2() {
  const fiq = QUESTIONNAIRE_DATA.fiq;
  const allQ = [];
  fiq.sections.forEach(s => s.questions.forEach(q => allQ.push(q)));
  const unanswered = allQ.filter(q => answers[q.id] === undefined);
  return unanswered.length === 0 ? true : unanswered.map(q => q.id);
}

function validateStep3() {
  const tc = QUESTIONNAIRE_DATA.teacherChild;
  const unanswered = [];
  for (const g of tc.groups) {
    for (const item of g.items) {
      if (answers[item.id] === undefined) unanswered.push(item.id);
    }
  }
  return unanswered.length === 0 ? true : unanswered;
}

function validateStep4() {
  const scenarios = QUESTIONNAIRE_DATA.ccnes.scenarios;
  const unanswered = [];
  for (const sc of scenarios) {
    for (const r of sc.responses) {
      if (answers[r.id] === undefined) unanswered.push(r.id);
    }
  }
  return unanswered.length === 0 ? true : unanswered;
}

function highlightUnanswered(ids) {
  clearValidation();
  if (!Array.isArray(ids) || ids.length === 0) return;

  // Highlight first unanswered card/row
  const firstId = ids[0];
  const card = document.getElementById('card_' + firstId) || document.getElementById('matrix_row_' + firstId) || document.getElementById('scenario_' + firstId.replace(/_\d+$/, ''));
  if (card) {
    card.classList.add('unanswered-highlight');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Also highlight all unanswered
  ids.forEach(id => {
    const el = document.getElementById('card_' + id) || document.getElementById('matrix_row_' + id);
    if (el) el.classList.add('unanswered-highlight');
  });

  showValidation('还有 ' + ids.length + ' 题未完成，请检查标红的项目');
}

function showValidation(msg) {
  const el = document.getElementById('validationMsg' + currentStep);
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function clearValidation() {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('validationMsg' + i);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }
  // Remove all unanswered highlights
  document.querySelectorAll('.unanswered-highlight').forEach(el => {
    el.classList.remove('unanswered-highlight');
  });
}

// ── Render Step 1: Demographics ──
function renderStep1() {
  const container = document.getElementById('step1Content');
  if (!container) return;
  container.innerHTML = '';

  QUESTIONNAIRE_DATA.demographics.forEach(q => {
    const div = document.createElement('div');
    div.className = 'demo-group';

    if (q.type === 'radio') {
      div.innerHTML = `
        <div class="demo-label">${q.text}<span class="required">*</span></div>
        <div class="demo-options" id="demo_${q.id}">
          ${q.options.map((opt, i) => {
            const isOther = opt.includes('__________');
            const optText = opt.replace('__________', '');
            const value = isOther ? 'other' : opt;
            return `<label class="demo-option" data-qid="${q.id}" data-value="${value}" onclick="selectDemoOption('${q.id}','${value}',this,'radio')">
              <input type="radio" name="${q.id}" value="${value}">
              ${optText}${isOther ? '<input type="text" class="demo-text-input" style="width:80px;margin-left:4px;padding:4px 8px;font-size:12px;display:inline" placeholder="请填写" onclick="event.stopPropagation()">' : ''}
            </label>`;
          }).join('')}
        </div>`;
    } else if (q.type === 'checkbox') {
      div.innerHTML = `
        <div class="demo-label">${q.text}<span class="required">*</span></div>
        <div class="demo-options" id="demo_${q.id}">
          ${q.options.map((opt, i) => {
            const isOther = opt.includes('__________');
            const optText = opt.replace('__________', '');
            const value = isOther ? 'other' : opt;
            return `<label class="demo-option" data-qid="${q.id}" data-value="${value}" onclick="toggleDemoCheckbox('${q.id}','${value}',this)">
              <input type="checkbox" name="${q.id}" value="${value}">
              ${optText}${isOther ? '<input type="text" class="demo-text-input" style="width:80px;margin-left:4px;padding:4px 8px;font-size:12px;display:inline" placeholder="请填写" onclick="event.stopPropagation()">' : ''}
            </label>`;
          }).join('')}
        </div>`;
    } else if (q.type === 'text') {
      div.innerHTML = `
        <div class="demo-label">${q.text}<span class="required">*</span></div>
        <input type="text" class="demo-text-input" id="demo_${q.id}" placeholder="${q.placeholder || ''}" oninput="answers['${q.id}']=this.value">`;
    } else if (q.type === 'slider') {
      div.innerHTML = `
        <div class="demo-label">${q.text}<span class="required">*</span></div>
        <div class="slider-container">
          <div class="slider-value" id="slider_val_${q.id}">5</div>
          <input type="range" class="slider-input" min="${q.min}" max="${q.max}" value="5" id="demo_${q.id}"
            oninput="answers['${q.id}']=parseInt(this.value);document.getElementById('slider_val_${q.id}').textContent=this.value">
          <div class="slider-labels">
            <span>${q.minLabel}</span>
            <span>${q.maxLabel}</span>
          </div>
        </div>`;
      answers[q.id] = 5; // default
    }

    container.appendChild(div);
  });

  // Restore answers
  restoreDemoAnswers();
}

function selectDemoOption(qid, value, el, type) {
  // Radio: deselect siblings
  const parent = el.parentElement;
  parent.querySelectorAll('.demo-option').forEach(opt => opt.classList.remove('selected'));
  el.classList.add('selected');

  // Check if "other" option
  if (value === 'other') {
    const textInput = el.querySelector('.demo-text-input');
    if (textInput) {
      textInput.focus();
      answers[qid] = textInput.value || '其他';
      textInput.oninput = () => { answers[qid] = textInput.value || '其他'; };
    }
  } else {
    answers[qid] = value;
  }
}

function toggleDemoCheckbox(qid, value, el) {
  el.classList.toggle('selected');
  const input = el.querySelector('input[type="checkbox"]');
  input.checked = !input.checked;

  // Collect all checked values
  const checked = [];
  el.parentElement.querySelectorAll('.demo-option.selected').forEach(opt => {
    const v = opt.dataset.value;
    if (v === 'other') {
      const textInput = opt.querySelector('.demo-text-input');
      checked.push(textInput ? textInput.value || '其他' : '其他');
    } else {
      checked.push(v);
    }
  });
  answers[qid] = checked;
}

function restoreDemoAnswers() {
  Object.keys(answers).forEach(key => {
    if (key.startsWith('demo_')) {
      const el = document.getElementById('demo_' + key);
      if (!el) return;
      const val = answers[key];
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.value = val;
      } else if (el.tagName === 'INPUT' && el.type === 'range') {
        el.value = val;
        const valEl = document.getElementById('slider_val_' + key);
        if (valEl) valEl.textContent = val;
      }
      // For radio/checkbox groups, restore selected state
      if (Array.isArray(val)) {
        // checkbox
        val.forEach(v => {
          const opt = el.querySelector(`[data-value="${v}"]`);
          if (opt) { opt.classList.add('selected'); opt.querySelector('input').checked = true; }
        });
      } else if (typeof val === 'string') {
        const opt = el.querySelector(`[data-value="${val}"]`);
        if (opt) { opt.classList.add('selected'); opt.querySelector('input').checked = true; }
      }
    }
  });
}

// ── Render Step 2: FIQ ──
function renderStep2() {
  const container = document.getElementById('step2Content');
  if (!container) return;
  container.innerHTML = '';

  const fiq = QUESTIONNAIRE_DATA.fiq;
  let qNum = 1;

  fiq.sections.forEach(sec => {
    // Section header
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <div class="section-dot" style="background:${sec.color}"></div>
      <div class="section-title">${sec.title}</div>`;
    container.appendChild(header);

    sec.questions.forEach(q => {
      const card = createLikertCard(q, qNum, fiq.scaleMin, fiq.scaleMax, fiq.scaleLabels, sec.color);
      container.appendChild(card);
      qNum++;
    });
  });

  restoreLikertAnswers();
}

function createLikertCard(q, num, min, max, labels, color) {
  const card = document.createElement('div');
  card.className = 'q-card';
  card.id = 'card_' + q.id;

  const btns = [];
  for (let v = min; v <= max; v++) {
    btns.push(`<button class="r-btn" data-q="${q.id}" data-v="${v}" onclick="selectLikert('${q.id}',${v},'${color}')">${v}</button>`);
  }

  card.innerHTML = `
    <div class="q-num">Q${num}</div>
    <div class="q-text">${q.text}</div>
    <div class="rating-row">
      <span class="rating-label">${labels[0]}</span>
      ${btns.join('')}
      <span class="rating-label">${labels[labels.length-1]}</span>
    </div>`;

  return card;
}

function selectLikert(qid, val, color) {
  answers[qid] = val;

  // Update buttons
  document.querySelectorAll(`[data-q="${qid}"]`).forEach(btn => {
    btn.classList.remove('selected');
    btn.style.background = '';
    btn.style.color = '';
  });
  const chosen = document.querySelector(`[data-q="${qid}"][data-v="${val}"]`);
  chosen.classList.add('selected');
  chosen.style.background = color;

  // Card border
  const card = document.getElementById('card_' + qid);
  if (card) {
    card.classList.add('answered');
    card.style.borderLeftColor = color;
  }

  saveProgress();
}

function restoreLikertAnswers() {
  Object.keys(answers).forEach(key => {
    if (key.startsWith('fiq_') && answers[key] !== undefined) {
      const btn = document.querySelector(`[data-q="${key}"][data-v="${answers[key]}"]`);
      if (btn) {
        btn.classList.add('selected');
        btn.style.background = '#4E2A84';
        const card = document.getElementById('card_' + key);
        if (card) card.classList.add('answered');
      }
    }
  });
}

// ── Render Step 3: Teacher-Child Relationship ──
function renderStep3() {
  const container = document.getElementById('step3Content');
  if (!container) return;
  container.innerHTML = '';

  const tc = QUESTIONNAIRE_DATA.teacherChild;
  let qNum = 1;

  // Teacher name input
  const nameGroup = document.createElement('div');
  nameGroup.className = 'demo-group';
  nameGroup.innerHTML = `
    <div class="demo-label">${tc.teacherName.text}</div>
    <input type="text" class="demo-text-input" id="${tc.teacherName.id}" placeholder="${tc.teacherName.placeholder || ''}"
      oninput="answers['${tc.teacherName.id}']=this.value">`;
  container.appendChild(nameGroup);

  tc.groups.forEach(group => {
    const gDiv = document.createElement('div');
    gDiv.className = 'matrix-group';

    let html = `<div class="matrix-title">${group.title}</div>`;

    group.items.forEach(item => {
      html += `<div class="matrix-row matrix-row-vertical" id="matrix_row_${item.id}">`;
      html += `<div class="matrix-item-text"><span class="q-num" style="display:inline">Q${qNum}</span> ${item.text}</div>`;
      html += `<div class="matrix-options matrix-options-full">`;
      group.scale.forEach((s, i) => {
        const val = i + 1;
        html += `<button class="matrix-opt matrix-opt-full" data-q="${item.id}" data-v="${val}" onclick="selectMatrix('${item.id}',${val},this)">${s}</button>`;
      });
      html += `</div></div>`;
      qNum++;
    });

    gDiv.innerHTML = html;
    container.appendChild(gDiv);
  });

  restoreMatrixAnswers();
}

function selectMatrix(qid, val, el) {
  answers[qid] = val;

  // Deselect siblings
  el.parentElement.querySelectorAll('.matrix-opt').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');

  saveProgress();
}

function restoreMatrixAnswers() {
  Object.keys(answers).forEach(key => {
    if (key.startsWith('tc_')) {
      const btn = document.querySelector(`[data-q="${key}"][data-v="${answers[key]}"]`);
      if (btn) btn.classList.add('selected');
    }
  });
}

// ── Render Step 4: CCNES ──
function renderStep4() {
  const container = document.getElementById('step4Content');
  if (!container) return;
  container.innerHTML = '';

  const ccnes = QUESTIONNAIRE_DATA.ccnes;

  // Scale legend at the top
  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;';
  ccnes.scaleLabels.forEach((label, i) => {
    legend.innerHTML += `<span style="font-size:11px;color:#6B7280;background:#f3f4f6;padding:4px 8px;border-radius:4px;">${i+1} = ${label}</span>`;
  });
  container.appendChild(legend);

  ccnes.scenarios.forEach((sc, idx) => {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.id = 'scenario_' + sc.id;

    let html = `
      <div class="scenario-header">
        <span class="scenario-badge">情境 ${idx + 1} / ${ccnes.scenarios.length}</span>
      </div>
      <div class="scenario-desc">${sc.description}</div>`;

    sc.responses.forEach((resp, rIdx) => {
      html += `<div class="response-row">`;
      html += `<div class="response-text">(${rIdx + 1}) ${resp.text}</div>`;
      html += `<div class="response-rating">`;
      for (let v = ccnes.scaleMin; v <= ccnes.scaleMax; v++) {
        html += `<button class="r-btn" data-q="${resp.id}" data-v="${v}" onclick="selectCCNES('${resp.id}',${v})">${v}</button>`;
      }
      html += `</div></div>`;
    });

    card.innerHTML = html;
    container.appendChild(card);
  });

  restoreCCNESAnswers();
}

function selectCCNES(qid, val) {
  answers[qid] = val;

  document.querySelectorAll(`[data-q="${qid}"]`).forEach(btn => {
    btn.classList.remove('selected');
    btn.style.background = '';
    btn.style.color = '';
  });
  const chosen = document.querySelector(`[data-q="${qid}"][data-v="${val}"]`);
  chosen.classList.add('selected');
  chosen.style.background = '#4E2A84';

  saveProgress();
}

function restoreCCNESAnswers() {
  Object.keys(answers).forEach(key => {
    if (key.startsWith('c') && key.includes('_')) {
      const btn = document.querySelector(`[data-q="${key}"][data-v="${answers[key]}"]`);
      if (btn) {
        btn.classList.add('selected');
        btn.style.background = '#4E2A84';
      }
    }
  });
}

// ── Submit & Results ──
async function submitQuestionnaire() {
  // Show loading
  document.querySelectorAll('.step-section').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('active');
  });
  const loading = document.getElementById('loadingOverlay');
  if (loading) { loading.style.display = 'block'; loading.classList.add('active'); }

  // Compute scores
  const fiqScores = computeFIQ(answers);
  const ccnesScores = computeCCNES(answers);
  const tcScores = computeTeacherChild(answers);
  const parentType = determineType(fiqScores.total_mean, ccnesScores);
  const typeData = PARENT_TYPES[parentType];

  // Build radar data
  const radarData = {
    radar_home: fiqScores.radar_home,
    radar_school: fiqScores.radar_school,
    radar_comm: fiqScores.radar_comm,
    radar_emotion_support: ccnesScores.radar_emotion_support,
    radar_problem_solving: ccnesScores.radar_problem_solving,
    radar_teacher_child: tcScores.radar,
    tc_group_scores: tcScores.groupScores
  };

  // Save to database
  const responseData = buildResponseData(answers, fiqScores, ccnesScores, tcScores, parentType);
  saveResponse(responseData);

  // Simulate brief loading
  await new Promise(r => setTimeout(r, 1200));

  // Hide loading, show results
  if (loading) { loading.style.display = 'none'; loading.classList.remove('active'); }

  // Render results
  renderResults(typeData, radarData);

  // Clear saved progress
  localStorage.removeItem(STORAGE_KEY);

  currentStep = 5;
  // Hide progress bar on results page
  const progressWrap = document.getElementById('progressWrap');
  if (progressWrap) progressWrap.style.display = 'none';
  updateProgressBar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderResults(typeData, radarData) {
  const results = document.getElementById('resultsSection');
  results.style.display = 'block';
  results.classList.add('active');

  // Header — use innerHTML for controlled line break
  document.getElementById('resultTypeTitle').innerHTML = `您是孩子成长路上的<br>「<span style="display:inline-block">${typeData.name}</span>」！`;
  document.getElementById('resultTypeTitle').style.color = typeData.color;
  document.getElementById('resultTypeEn').textContent = typeData.enName;

  // Character
  document.getElementById('characterDisplay').innerHTML = CHARACTER_SVGS[typeData.code];
  document.getElementById('characterName').textContent = typeData.name;
  document.getElementById('characterName').style.color = typeData.color;

  // Radar chart (main, without teacher-child)
  renderRadarChart('radarChart', radarData, typeData.color, false);

  // Teacher-child radar chart
  if (radarData.tc_group_scores) {
    setTimeout(() => {
      renderTCRadarChart('tcRadarChart', radarData.tc_group_scores);
      // Trigger animation
      const tcWrapper = document.querySelector('.chart-secondary .chart-animate');
      if (tcWrapper) tcWrapper.classList.add('visible');
    }, 400);
  }

  // Trigger main radar animation
  setTimeout(() => {
    const mainWrapper = document.querySelector('.chart-section .chart-animate');
    if (mainWrapper) mainWrapper.classList.add('visible');
  }, 100);

  // Description (innerHTML for highlights)
  document.getElementById('resultDescription').innerHTML = typeData.description;

  // Traits
  const traitsList = document.getElementById('resultTraits');
  traitsList.innerHTML = typeData.traits.map(t => `<li>${t}</li>`).join('');

  // Suggestions
  const sugList = document.getElementById('resultSuggestions');
  sugList.innerHTML = typeData.suggestions.map(s => `<li>${s}</li>`).join('');

  // Share card
  renderShareCard(typeData, radarData);
}

function renderShareCard(typeData, radarData) {
  const card = document.getElementById('share-card');
  if (!card) return;

  card.style.borderTop = `6px solid ${typeData.color}`;

  document.getElementById('shareCharacter').innerHTML = CHARACTER_SVGS[typeData.code];
  // Resize SVG for share card
  const svg = document.getElementById('shareCharacter').querySelector('svg');
  if (svg) { svg.style.width = '120px'; svg.style.height = 'auto'; }

  document.getElementById('shareTypeName').textContent = `我是「${typeData.name}」`;
  document.getElementById('shareTypeSub').textContent = typeData.subtitle;
  document.getElementById('shareDesc').textContent = typeData.oneLineDesc.replace(/你/g, '您');

  // Render share radar
  setTimeout(() => {
    renderRadarChart('share-radar', radarData, typeData.color, false);
  }, 200);
}

async function downloadShareCard() {
  const card = document.getElementById('share-card');
  if (!card || typeof html2canvas === 'undefined') {
    alert('分享功能暂不可用');
    return;
  }

  card.style.display = 'block';

  try {
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 375,
    });

    const link = document.createElement('a');
    link.download = '我的家长类型_港中大深圳.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    console.error('截图失败:', e);
    alert('生成分享图失败，请稍后重试');
  }
}

// ── localStorage Persistence ──
function saveProgress() {
  try {
    const data = { step: currentStep, answers: answers };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}

function restoreProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.answers) {
        Object.assign(answers, data.answers);
      }
      if (data.step && data.step >= 1 && data.step <= 4) {
        currentStep = data.step;
      } else {
        currentStep = 0;
      }
    }
  } catch (e) {
    // ignore
  }
}

function resetQuestionnaire() {
  Object.keys(answers).forEach(k => delete answers[k]);
  localStorage.removeItem(STORAGE_KEY);
  currentStep = 0;
  location.reload();
}
