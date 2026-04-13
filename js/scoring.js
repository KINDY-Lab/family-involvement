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
  }
};

// ── Character Image Paths (JPG) ──
const CHARACTER_IMAGES = {
  FULL_ESCORT: 'assets/characters/全情护航者.jpg',
  ACADEMIC_LEAD: 'assets/characters/学业主导者.jpg',
  WARM_COMPANION: 'assets/characters/温暖陪伴者.jpg',
  GROWTH_EXPLORER: 'assets/characters/成长探索者.jpg'
};

// ── Suggestions Pool + Random Draw ──
const SUGGESTIONS_POOL = {

  FULL_ESCORT: [
    "今天试试这个：做一件事之前，先问孩子<b>「你想怎么做？」</b>——哪怕结果不完美，自己决定的事孩子会更投入。",
    "给孩子设置一个<b>「独立时间」</b>，每天 15-30 分钟让他/她自己玩、自己解决问题，你不介入。这是培养抗挫力最温和的方式。",
    "下次孩子遇到困难，忍住「我来帮你」，改说<b>「你觉得可以怎么办？」</b>——答案不重要，思考过程才是目标。",
    "试着减少一项你目前为孩子安排的课外活动，把那段时间<b>还给孩子自由支配</b>，观察他/她会做什么。",
    "每周和孩子做一次<b>「小小复盘」</b>：这周你自己解决了什么事情？感觉怎么样？——帮孩子建立自我效能感。",
    "当孩子完成一件事，把「你真棒」换成<b>「你是怎么做到的？」</b>——引导孩子归因于自身努力，而非天赋或外部评价。",
    "尝试让孩子参与一个<b>家庭小决策</b>（比如周末去哪玩），哪怕是小事，也能培养主人翁意识。",
    "记录孩子这个月<b>「自己搞定的事」清单</b>，月底一起回顾——这个仪式感会让孩子对独立充满自豪。",
  ],

  ACADEMIC_LEAD: [
    "今晚睡前试试这个：关掉所有「学了什么」的话题，只问孩子<b>「今天有什么让你开心或难过的事」</b>——然后只听，不评价。",
    "当孩子哭或发脾气，先说一句<b>「我看到你很[伤心/生气/委屈]」</b>，停顿 3 秒，再讨论解决方案。这 3 秒对孩子的情绪发展价值巨大。",
    "这周选一个孩子感兴趣但「没有学习价值」的活动陪他/她做——<b>纯粹的快乐也是成长的养分</b>。",
    "试着在孩子情绪爆发时<b>蹲下来，和孩子视线平齐</b>，只说「我在这里」——不分析，不解决，就是陪着。",
    "找一本情绪主题绘本（如《菲菲生气了》），睡前一起读，问孩子<b>「你有没有这样的感觉过？」</b>——让情绪话题变得日常。",
    "这个月记录一次：孩子表达情绪时，你的第一反应是什么？是转移、讲道理还是共情？<b>觉察是改变的起点。</b>",
    "孩子说「我不想去幼儿园」时，比起解释为什么要去，先问一句<b>「是什么让你不想去？」</b>——答案可能出乎你意料。",
    "设定一个<b>「无目标时间」</b>——每周一次，和孩子一起做一件没有任何教育目的的事：涂色、捏泥、发呆都行。",
  ],

  WARM_COMPANION: [
    "这周试试一个小结构：每天晚饭后 10 分钟<b>「数字游戏时间」</b>——数豆子、玩扑克牌数数都算，把学习藏进游戏里。",
    "下次去幼儿园接孩子时，多停留 5 分钟，和老师随口聊一句<b>「孩子最近有什么新变化」</b>——沟通不需要正式，点滴了解就够。",
    "在家设置一个小小的<b>「学习角」</b>：一张矮桌、几本书、一些画笔——不是为了让孩子学习，而是让学习有仪式感的空间。",
    "参加下一次幼儿园<b>开放日或亲子活动</b>，让孩子看到你出现在他/她的校园里——这个画面对孩子的归属感影响极大。",
    "每周和孩子一起读一本绘本，读完问<b>「你最喜欢哪一页？为什么？」</b>——简单的对话就是认知和语言的双重练习。",
    "给孩子建一个<b>「成长本」</b>：每周贴一张他/她的画或写一句他/她说过的话——这个习惯本身就在强化孩子的学习动机。",
    "试着联系一位孩子班上的家长，安排一次孩子的 <b>playdate</b>——社交网络对孩子和你都有益。",
    "在家里建立一个小惯例：每天早晨说一件<b>「今天我期待的事」</b>，晚上说一件「今天我学到的事」——把学习变成家庭文化。",
  ],

  GROWTH_EXPLORER: [
    "从今晚开始，睡前问孩子一个问题：<b>「今天有什么让你开心的事？」</b>——就这一个问题，每天坚持，一个月后你会看到变化。",
    "当孩子有情绪时，先蹲下来，平视孩子，说<b>「我在这里」</b>——这个动作本身，比任何道理都更有安抚力量。",
    "这周选一件小事<b>让孩子自己决定</b>（比如今晚吃什么水果、穿哪件睡衣）——参与感从小事开始建立。",
    "找一本亲子情绪绘本，比如<b>《我的感觉》系列</b>，睡前一起看——把引导融入日常，比专门「教育」轻松得多。",
    "试试这个仪式：每周日晚上问孩子<b>「这周你最勇敢的事是什么？」</b>——帮孩子发现自己的力量。",
    "如果时间是最大的障碍，就从<b>「高质量的 15 分钟」</b>开始：放下手机，全神贯注地陪孩子做任何他/她想做的事。",
    "联系孩子的班主任，发一条简单的消息：<b>「孩子最近在家有点 X，请问在学校有没有类似情况？」</b>——迈出沟通第一步。",
    "给自己一个承诺：这个月参加幼儿园的<b>一次家长活动</b>。不需要做什么，出现本身就是对孩子最有力的支持。",
  ],
};

// 随机抽取 n 条建议（默认3条）
function getRandomSuggestions(type, n = 3) {
  const pool = [...SUGGESTIONS_POOL[type]];
  const result = [];
  while (result.length < n && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}
