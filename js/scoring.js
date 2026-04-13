// ═══════════════════════════════════════════════════════════════
// scoring.js — Scoring logic, type determination, feedback data
// ═══════════════════════════════════════════════════════════════

const THRESHOLD_FIQ = 2.5;
const THRESHOLD_EMOTION_DIFF = 0;

function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function normalizeFIQ(raw) {
  return ((raw - 1) / 3) * 100;
}

function normalizeCCNES(raw) {
  return ((raw - 1) / 4) * 100;
}

function normalizeTC(raw) {
  return ((raw - 1) / 3) * 100;
}

// ── Compute FIQ Scores ──
function computeFIQ(answers) {
  const fiq = QUESTIONNAIRE_DATA.fiq;
  const sections = fiq.sections;
  const allQuestions = [];
  const homeItems = [];
  const schoolItems = [];
  const commItems = [];

  sections.forEach(sec => {
    sec.questions.forEach(q => {
      allQuestions.push(q.id);
      if (sec.id === 'home') homeItems.push(q.id);
      else if (sec.id === 'school') schoolItems.push(q.id);
      else if (sec.id === 'comm') commItems.push(q.id);
    });
  });

  const homeScores = homeItems.map(id => answers[id]).filter(v => v !== undefined);
  const schoolScores = schoolItems.map(id => answers[id]).filter(v => v !== undefined);
  const commScores = commItems.map(id => answers[id]).filter(v => v !== undefined);
  const allScores = allQuestions.map(id => answers[id]).filter(v => v !== undefined);

  return {
    home_mean: mean(homeScores),
    school_mean: mean(schoolScores),
    comm_mean: mean(commScores),
    total_mean: mean(allScores),
    radar_home: normalizeFIQ(mean(homeScores)),
    radar_school: normalizeFIQ(mean(schoolScores)),
    radar_comm: normalizeFIQ(mean(commScores))
  };
}

// ── Compute CCNES Scores ──
function computeCCNES(answers) {
  const scenarios = QUESTIONNAIRE_DATA.ccnes.scenarios;
  const strategyScores = { EE: [], EF: [], PF: [], MIN: [], DIS: [], PUN: [] };

  scenarios.forEach(scenario => {
    scenario.responses.forEach(resp => {
      const val = answers[resp.id];
      if (val !== undefined) {
        strategyScores[resp.strategy].push(val);
      }
    });
  });

  const scores = {};
  for (const [strat, vals] of Object.entries(strategyScores)) {
    scores[strat] = mean(vals);
  }

  scores.supportive = mean([scores.EE, scores.EF, scores.PF]);
  scores.suppressive = mean([scores.MIN, scores.DIS, scores.PUN]);
  scores.emotion_diff = scores.supportive - scores.suppressive;

  // Radar chart values
  scores.radar_emotion_support = normalizeCCNES(mean([scores.EE, scores.EF]));
  scores.radar_problem_solving = normalizeCCNES(scores.PF);

  return scores;
}

// ── Compute Teacher-Child Scores ──
function computeTeacherChild(answers) {
  const groups = QUESTIONNAIRE_DATA.teacherChild.groups;
  const allScores = [];
  const groupScores = [];

  groups.forEach(group => {
    const groupVals = [];
    group.items.forEach(item => {
      const val = answers[item.id];
      if (val !== undefined) {
        const maxVal = group.scale.length;
        const scored = item.reverse ? (maxVal + 1 - val) : val;
        allScores.push(scored);
        groupVals.push(scored);
      }
    });
    groupScores.push({
      id: group.id,
      title: group.title.replace(/^.*?[，？]/, '').replace('？', '').substring(0, 8),
      mean: mean(groupVals),
      radar: normalizeTC(mean(groupVals))
    });
  });

  return {
    mean: mean(allScores),
    radar: normalizeTC(mean(allScores)),
    groupScores: groupScores
  };
}

// ── Determine Parent Type ──
function determineType(fiqTotal, ccnesScores) {
  const highInvolvement = fiqTotal >= THRESHOLD_FIQ;
  const supportiveStyle = ccnesScores.emotion_diff >= THRESHOLD_EMOTION_DIFF;

  if (highInvolvement && supportiveStyle) return 'FULL_ESCORT';
  if (highInvolvement && !supportiveStyle) return 'ACADEMIC_LEAD';
  if (!highInvolvement && supportiveStyle) return 'WARM_COMPANION';
  return 'GROWTH_EXPLORER';
}

// ── Parent Type Metadata ──
const PARENT_TYPES = {
  FULL_ESCORT: {
    code: 'FULL_ESCORT',
    name: '全情护航者',
    enName: 'Dedicated Guide',
    color: '#F59E0B',
    colorLight: '#FEF3C7',
    subtitle: '全方位投入 · 情感支持型家长',
    oneLineDesc: '您以充分的参与和温暖的情感支持，为孩子构建了安全而丰富的成长环境。',
    description: '您以充分的参与和温暖的情感支持，为孩子构建了一个安全而丰富的成长环境。无论是在家陪伴学习、积极参与学校活动，还是在孩子遇到情绪波动时给予倾听和引导，您都做到了高度的投入。研究表明，这种全面的<span class="highlight">家庭参与方式</span>，对孩子的<span class="highlight">学业表现</span>、<span class="highlight">社交能力</span>和<span class="highlight">情感健全发展</span>都有显著的正向影响。',
    traits: [
      '积极参与孩子的学习与校园生活，提供丰富的学习资源',
      '善于倾听和回应孩子的情绪，帮助孩子建立情绪词汇',
      '与幼儿园老师保持良好沟通，是家园合作的积极推动者',
      '在家营造了温暖而有结构的学习氛围'
    ],
    suggestions: [
      '在充分投入的同时，可以适当给孩子留出一些<span class="highlight">"自主解决问题"</span>的空间，这有助于培养孩子的<span class="highlight">独立性</span>和<span class="highlight">抗挫力</span>',
      '定期和孩子聊聊"什么事情让您自己觉得很厉害"，强化孩子的<span class="highlight">内在驱动力</span>，而非仅依赖外部支持'
    ]
  },
  ACADEMIC_LEAD: {
    code: 'ACADEMIC_LEAD',
    name: '学业主导者',
    enName: 'Academic Leader',
    color: '#3B82F6',
    colorLight: '#DBEAFE',
    subtitle: '重学习参与 · 结构规划型家长',
    oneLineDesc: '您对孩子的教育倾注了大量精力，认真负责地规划着学习成长之路。',
    description: '您对孩子的教育倾注了大量的时间和精力——无论是辅导学习、参与学校活动，还是和老师保持沟通，您都做得认真负责。面对孩子的情绪，您有时倾向于转移注意力或以"要坚强"来回应，这是很多专注于解决问题的家长的自然反应。<span class="highlight">情绪引导</span>和<span class="highlight">认知引导</span>同样重要，适当增加<span class="highlight">情感回应</span>，孩子的<span class="highlight">心理韧性</span>会更强。',
    traits: [
      '高度重视孩子的学习发展，积极营造有利于学业的家庭环境',
      '认真参与学校活动和家园沟通，是老师信赖的家长',
      '擅长规划、有结构地支持孩子',
      '对孩子抱有真诚的期望和关注'
    ],
    suggestions: [
      '当孩子表达负面情绪时，可以先用一句话<span class="highlight">"确认"感受</span>，例如"我看到您很失望"，然后再讨论解决方案——这个小小的停顿，对孩子的<span class="highlight">情绪发展</span>意义很大',
      '可以在每天睡前设置5分钟的<span class="highlight">"情绪聊天时间"</span>，问问孩子"今天有什么让您开心或难过的事"，不急着给建议，只是<span class="highlight">倾听</span>'
    ]
  },
  WARM_COMPANION: {
    code: 'WARM_COMPANION',
    name: '温暖陪伴者',
    enName: 'Warm Companion',
    color: '#EC4899',
    colorLight: '#FCE7F3',
    subtitle: '重情感陪伴 · 温暖接纳型家长',
    oneLineDesc: '您对孩子的内心世界高度敏感，善于回应孩子的情绪，创造了温暖有安全感的家庭氛围。',
    description: '您对孩子的内心世界高度敏感，善于回应孩子的情绪，为孩子创造了一个温暖而有安全感的家庭氛围。孩子在您身边感到被接纳和理解。研究显示，<span class="highlight">情感安全感</span>是孩子探索世界的基础。在情感联结已经非常稳固的基础上，适当增加一些<span class="highlight">结构性的学习参与</span>，将让孩子在<span class="highlight">情感</span>和<span class="highlight">认知</span>两个维度都得到充分的滋养。',
    traits: [
      '情感细腻，善于捕捉并回应孩子的情绪需求',
      '为孩子创造了温暖、接纳的家庭氛围',
      '孩子愿意向您倾诉，亲子关系质量高',
      '重视孩子的感受胜过对结果的评判'
    ],
    suggestions: [
      '可以尝试每周安排一次<span class="highlight">"家庭学习小时光"</span>——哪怕只是一起读一本绘本或玩一个数字游戏，这种<span class="highlight">结构性的互动</span>会让孩子受益',
      '参加1-2次幼儿园的家长开放日或亲子活动，让孩子看到您对他/她校园生活的关注，这会大大增强孩子的<span class="highlight">归属感</span>'
    ]
  },
  GROWTH_EXPLORER: {
    code: 'GROWTH_EXPLORER',
    name: '成长探索者',
    enName: 'Growth Explorer',
    color: '#22C55E',
    colorLight: '#DCFCE7',
    subtitle: '持续探索成长 · 自我觉察型家长',
    oneLineDesc: '您和孩子都在各自的成长旅程中同行，自我觉察是所有改变中最重要的第一步。',
    description: '您和孩子都在各自的成长旅程中同行。在家庭参与和情绪引导两个方面，您都有很多值得探索的空间。这一类型的家长往往面临较多的生活压力，或正在经历职业、家庭角色的转型期。愿意填写这份问卷，本身就是<span class="highlight">自我觉察</span>的开始——而自我觉察，正是所有改变中<span class="highlight">最重要的第一步</span>。',
    traits: [
      '有意识地反思自己的教育方式，具备<span class="highlight">成长型思维</span>',
      '对孩子抱有真诚的爱与期望',
      '愿意接受新的育儿理念和方法',
      '您的孩子，正在一位真诚的家长身边慢慢成长'
    ],
    suggestions: [
      '从一个最小的行动开始：每天睡前问孩子"今天有什么让您开心的事"，这5分钟的<span class="highlight">连接</span>会产生意想不到的效果',
      '当孩子有情绪时，先蹲下来，平视孩子，说一声<span class="highlight">"我在这里"</span>——这个动作本身，就已经是很有力量的<span class="highlight">情感支持</span>了',
      '可以参考一些情绪引导类的亲子绘本（如《菲菲生气了》《我的感觉》系列），和孩子一起阅读，把引导融入日常'
    ]
  }
};

// ── Character SVG Data (extracted from combined SVG) ──
// Each character extracted from parent_type_characters.svg with translated coordinates
const CHARACTER_SVGS = {
  FULL_ESCORT: `<svg viewBox="0 0 170 285" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="140" height="255" rx="14" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5"/>
    <path d="M41 73 Q40 45 56 38 Q70 32 84 38 Q100 45 99 73" fill="#7C4A1C"/>
    <circle cx="70" cy="78" r="30" fill="#F5C4A7"/>
    <circle cx="70" cy="47" r="10" fill="#7C4A1C"/>
    <circle cx="64" cy="52" r="7" fill="#7C4A1C"/>
    <circle cx="76" cy="52" r="7" fill="#7C4A1C"/>
    <ellipse cx="53" cy="84" rx="7" ry="4" fill="#F8A0B8" opacity="0.55"/>
    <ellipse cx="87" cy="84" rx="7" ry="4" fill="#F8A0B8" opacity="0.55"/>
    <ellipse cx="62" cy="76" rx="4.5" ry="5" fill="#2D1010"/>
    <ellipse cx="78" cy="76" rx="4.5" ry="5" fill="#2D1010"/>
    <circle cx="63.5" cy="74" r="1.6" fill="white"/>
    <circle cx="79.5" cy="74" r="1.6" fill="white"/>
    <path d="M57 68 Q62 65 67 67" stroke="#7C4A1C" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M73 67 Q78 65 83 68" stroke="#7C4A1C" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M61 88 Q70 97 79 88" stroke="#D07070" stroke-width="2" fill="#F4C0B0" stroke-linecap="round"/>
    <rect x="64" y="106" width="12" height="10" rx="3" fill="#F5C4A7"/>
    <rect x="44" y="113" width="52" height="62" rx="15" fill="#F59E0B"/>
    <path d="M64 113 L70 125 L76 113" fill="#FFFBEB" opacity="0.5"/>
    <path d="M47 130 Q28 125 13 123" stroke="#F59E0B" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M93 130 Q112 125 127 123" stroke="#F59E0B" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="11" cy="122" r="8" fill="#F5C4A7"/>
    <circle cx="129" cy="122" r="8" fill="#F5C4A7"/>
    <path d="M70 135 L72 140 L78 140 L73 143 L75 148 L70 146 L65 148 L67 143 L62 140 L68 140 Z" fill="#FFFBEB" opacity="0.8"/>
    <path d="M22 59 L23.2 63 L27.5 63 L24 66 L25.2 70 L22 68 L18.8 70 L20 66 L16.5 63 L20.8 63 Z" fill="#FBBF24" opacity="0.65"/>
    <circle cx="116" cy="53" r="3" fill="#F59E0B" opacity="0.5"/>
    <circle cx="122" cy="60" r="2" fill="#FBBF24" opacity="0.4"/>
    <text x="70" y="198" fill="#92400E" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="14" font-weight="600" text-anchor="middle">全情护航者</text>
    <text x="70" y="213" fill="#B45309" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="11" text-anchor="middle">全方位投入</text>
    <rect x="38" y="223" width="64" height="17" rx="8.5" fill="#F59E0B" opacity="0.18"/>
    <text x="70" y="235" fill="#92400E" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="11" text-anchor="middle">护航型家长</text>
  </svg>`,

  ACADEMIC_LEAD: `<svg viewBox="0 0 170 285" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="140" height="255" rx="14" fill="#DBEAFE" stroke="#3B82F6" stroke-width="1.5"/>
    <path d="M42 75 Q41 49 56 42 Q70 36 84 42 Q99 49 98 75" fill="#1A1A2E"/>
    <circle cx="70" cy="78" r="30" fill="#F0C090"/>
    <rect x="54" y="73" width="13" height="11" rx="4" fill="none" stroke="#2D2D2D" stroke-width="1.8"/>
    <rect x="70" y="73" width="13" height="11" rx="4" fill="none" stroke="#2D2D2D" stroke-width="1.8"/>
    <line x1="67" y1="78.5" x2="70" y2="78.5" stroke="#2D2D2D" stroke-width="1.5"/>
    <line x1="52" y1="78.5" x2="54" y2="78.5" stroke="#2D2D2D" stroke-width="1.5"/>
    <line x1="83" y1="78.5" x2="86" y2="78.5" stroke="#2D2D2D" stroke-width="1.5"/>
    <ellipse cx="60.5" cy="78.5" rx="3.8" ry="3.8" fill="#1A1A2E"/>
    <ellipse cx="76.5" cy="78.5" rx="3.8" ry="3.8" fill="#1A1A2E"/>
    <circle cx="61.8" cy="76.8" r="1.2" fill="white"/>
    <circle cx="77.8" cy="76.8" r="1.2" fill="white"/>
    <path d="M55 68 Q60.5 66 66 68" stroke="#1A1A2E" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M72 68 Q77.5 66 83 68" stroke="#1A1A2E" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M63 90 Q70 96 77 90" stroke="#B07060" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="55" cy="86" rx="5.5" ry="3" fill="#F4A0A0" opacity="0.3"/>
    <ellipse cx="85" cy="86" rx="5.5" ry="3" fill="#F4A0A0" opacity="0.3"/>
    <rect x="64" y="106" width="12" height="10" rx="3" fill="#F0C090"/>
    <rect x="44" y="113" width="52" height="62" rx="15" fill="#3B82F6"/>
    <path d="M64 113 L70 122 L76 113" fill="#1D4ED8"/>
    <path d="M47 133 Q42 145 35 148" stroke="#3B82F6" stroke-width="10" fill="none" stroke-linecap="round"/>
    <rect x="22" y="144" width="19" height="24" rx="3" fill="#1D4ED8"/>
    <rect x="24" y="146" width="15" height="20" rx="2" fill="#EFF6FF"/>
    <line x1="27" y1="151" x2="36" y2="151" stroke="#93C5FD" stroke-width="1.2"/>
    <line x1="27" y1="155" x2="36" y2="155" stroke="#93C5FD" stroke-width="1.2"/>
    <line x1="27" y1="159" x2="33" y2="159" stroke="#93C5FD" stroke-width="1.2"/>
    <path d="M93 133 Q103 141 105 151" stroke="#3B82F6" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="105" cy="153" r="8" fill="#F0C090"/>
    <rect x="117" y="47" width="13" height="17" rx="2" fill="#93C5FD" opacity="0.5"/>
    <rect x="119" y="49" width="9" height="13" rx="1" fill="#EFF6FF" opacity="0.8"/>
    <line x1="121" y1="53" x2="126" y2="53" stroke="#3B82F6" stroke-width="1" opacity="0.6"/>
    <line x1="121" y1="57" x2="126" y2="57" stroke="#3B82F6" stroke-width="1" opacity="0.6"/>
    <text x="70" y="198" fill="#1E40AF" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="14" font-weight="600" text-anchor="middle">学业主导者</text>
    <text x="70" y="213" fill="#1D4ED8" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="11" text-anchor="middle">重学习参与</text>
    <rect x="38" y="223" width="64" height="17" rx="8.5" fill="#3B82F6" opacity="0.18"/>
    <text x="70" y="235" fill="#1E40AF" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="11" text-anchor="middle">主导型家长</text>
  </svg>`,

  WARM_COMPANION: `<svg viewBox="0 0 170 285" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="140" height="255" rx="14" fill="#FCE7F3" stroke="#EC4899" stroke-width="1.5"/>
    <path d="M42 75 Q41 48 56 41 Q71 35 85 41 Q99 48 98 75" fill="#C07040"/>
    <path d="M42 75 Q39 93 42 106" fill="#C07040"/>
    <path d="M98 75 Q101 93 98 106" fill="#C07040"/>
    <circle cx="70" cy="78" r="30" fill="#FAD0A8"/>
    <ellipse cx="54" cy="85" rx="8" ry="4.5" fill="#F8A0B8" opacity="0.6"/>
    <ellipse cx="86" cy="85" rx="8" ry="4.5" fill="#F8A0B8" opacity="0.6"/>
    <ellipse cx="61" cy="75" rx="5" ry="5.5" fill="#2D1010"/>
    <ellipse cx="79" cy="75" rx="5" ry="5.5" fill="#2D1010"/>
    <circle cx="62.5" cy="73" r="1.8" fill="white"/>
    <circle cx="80.5" cy="73" r="1.8" fill="white"/>
    <path d="M56 67 Q61 64 66 66" stroke="#C07040" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M74 66 Q79 64 84 67" stroke="#C07040" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M59 89 Q70 99 81 89" stroke="#D07080" stroke-width="2" fill="#F4B0C0" stroke-linecap="round"/>
    <rect x="64" y="106" width="12" height="10" rx="3" fill="#FAD0A8"/>
    <rect x="44" y="113" width="52" height="62" rx="15" fill="#EC4899"/>
    <path d="M57 113 Q61 119 65 113 Q69 119 73 113 Q77 119 81 113" stroke="#FBCFE8" stroke-width="1.5" fill="none"/>
    <path d="M47 133 Q34 128 25 130" stroke="#EC4899" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="23" cy="129" r="8" fill="#FAD0A8"/>
    <path d="M93 133 Q89 140 80 144" stroke="#EC4899" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="79" cy="145" r="8" fill="#FAD0A8"/>
    <path d="M70 138 C65 134 61 130 63 126 C65 122 68 123 70 126 C72 123 75 122 77 126 C79 130 76 134 70 138Z" fill="#FBCFE8" opacity="0.8"/>
    <path d="M111 58 C108 55 106 52 108 50 C110 48 111 49.5 112 51 C113 49.5 114 48 116 50 C118 52 116 55 111 58Z" fill="#EC4899" opacity="0.5"/>
    <path d="M33 57 C30 54 28 51 30 49 C32 47 33 48.5 34 50 C35 48.5 36 47 38 49 C40 51 38 54 33 57Z" fill="#F472B6" opacity="0.45"/>
    <text x="70" y="198" fill="#9D174D" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="14" font-weight="600" text-anchor="middle">温暖陪伴者</text>
    <text x="70" y="213" fill="#BE185D" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="11" text-anchor="middle">重情感陪伴</text>
    <rect x="38" y="223" width="64" height="17" rx="8.5" fill="#EC4899" opacity="0.18"/>
    <text x="70" y="235" fill="#9D174D" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="11" text-anchor="middle">陪伴型家长</text>
  </svg>`,

  GROWTH_EXPLORER: `<svg viewBox="0 0 170 285" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="140" height="255" rx="14" fill="#DCFCE7" stroke="#22C55E" stroke-width="1.5"/>
    <path d="M42 75 Q41 49 56 42 Q71 36 85 42 Q99 49 98 75" fill="#3D4A28"/>
    <path d="M70 36 Q74 29 79 33" stroke="#3D4A28" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M66 38 Q61 31 64 35" stroke="#3D4A28" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="70" cy="78" r="30" fill="#F5D5B0"/>
    <ellipse cx="54" cy="85" rx="6.5" ry="3.5" fill="#F4A0A0" opacity="0.35"/>
    <ellipse cx="86" cy="85" rx="6.5" ry="3.5" fill="#F4A0A0" opacity="0.35"/>
    <ellipse cx="62" cy="76" rx="4.5" ry="5" fill="#2A3520"/>
    <ellipse cx="78" cy="76" rx="5" ry="5.5" fill="#2A3520"/>
    <circle cx="63.5" cy="74" r="1.6" fill="white"/>
    <circle cx="79.5" cy="74" r="1.8" fill="white"/>
    <path d="M57 68 Q62 66 67 68" stroke="#3D4A28" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M72 65.5 Q78 63 84 66" stroke="#3D4A28" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M63 88 Q70 95 77 88" stroke="#8B6040" stroke-width="2" fill="#F0D0A0" stroke-linecap="round"/>
    <rect x="64" y="106" width="12" height="10" rx="3" fill="#F5D5B0"/>
    <rect x="44" y="113" width="52" height="62" rx="15" fill="#22C55E"/>
    <rect x="58" y="135" width="16" height="12" rx="3" fill="#16A34A"/>
    <path d="M47 133 Q37 128 24 127" stroke="#22C55E" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M15 127 L14 137 Q14 140 18 140 L38 140 Q42 140 42 137 L41 127 Z" fill="#A0652A"/>
    <ellipse cx="28" cy="127" rx="14" ry="5" fill="#7B4518"/>
    <line x1="28" y1="123" x2="28" y2="117" stroke="#16A34A" stroke-width="2"/>
    <path d="M28 121 Q22 116 18 117" stroke="#16A34A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M28 119 Q34 114 38 115" stroke="#22C55E" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="18" cy="117" rx="6" ry="3.5" fill="#22C55E" transform="rotate(-20,18,117)"/>
    <ellipse cx="37" cy="115" rx="6" ry="3.5" fill="#16A34A" transform="rotate(20,37,115)"/>
    <path d="M93 133 Q105 125 114 122" stroke="#22C55E" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="116" cy="121" r="8" fill="#F5D5B0"/>
    <circle cx="126" cy="53" r="3" fill="#22C55E" opacity="0.55"/>
    <circle cx="133" cy="60" r="2" fill="#4ADE80" opacity="0.45"/>
    <circle cx="124" cy="63" r="1.8" fill="#16A34A" opacity="0.5"/>
    <line x1="85" y1="50" x2="85" y2="42" stroke="#22C55E" stroke-width="1.5" opacity="0.55"/>
    <ellipse cx="81" cy="40" rx="5" ry="3" fill="#22C55E" opacity="0.5" transform="rotate(-15,81,40)"/>
    <ellipse cx="90" cy="39" rx="5" ry="3" fill="#4ADE80" opacity="0.45" transform="rotate(15,90,39)"/>
    <text x="70" y="198" fill="#14532D" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="14" font-weight="600" text-anchor="middle">成长探索者</text>
    <text x="70" y="213" fill="#15803D" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="11" text-anchor="middle">持续探索成长</text>
    <rect x="38" y="223" width="64" height="17" rx="8.5" fill="#22C55E" opacity="0.18"/>
    <text x="70" y="235" fill="#14532D" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="11" text-anchor="middle">探索型家长</text>
  </svg>`
};
