# 学前儿童家庭教育环境与情绪引导方式调查问卷
## 产品需求文档（PRD）v1.0

**项目负责人**：香港中文大学（深圳）人文社科学院  
**文档用途**：供 Claude Code 开发使用  
**参考项目风格**：https://qingyonghu.github.io/Time_perspective/

---

## 目录
1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [用户旅程与页面流程](#3-用户旅程与页面流程)
4. [问卷结构详解](#4-问卷结构详解)
5. [评分与计算逻辑](#5-评分与计算逻辑)
6. [家长类型系统](#6-家长类型系统)
7. [雷达图规格](#7-雷达图规格)
8. [结果页反馈文案](#8-结果页反馈文案)
9. [SVG 角色资源规格](#9-svg-角色资源规格)
10. [数据存储方案（腾讯云 CloudBase）](#10-数据存储方案)
11. [数据字段规范](#11-数据字段规范)
12. [UI 设计规范](#12-ui-设计规范)
13. [开发注意事项](#13-开发注意事项)

---

## 1. 项目概述

### 1.1 项目背景
学术研究问卷，调查学前儿童（3-6岁）家庭的教育参与情况及情绪引导方式。问卷填写完毕后，系统自动根据得分将家长分为4种类型并提供个性化反馈，兼顾科研数据采集与家长教育赋能两个目标。

### 1.2 核心功能
- **多步骤问卷**：5个步骤，包含进度条，移动端适配
- **自动类型判定**：基于FIQ与CCNES得分，4种家长类型
- **可视化结果**：雷达图 + 可爱角色图 + 个性化文字反馈
- **数据后台**：每份回答自动写入腾讯云 CloudBase，研究者可导出 CSV
- **社交分享**：结果页可生成分享图/链接，助于推广与数据采集

### 1.3 目标用户
学前儿童（3-6岁）的家长，主要通过微信等社交媒体渠道获取链接填写。

---

## 2. 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                   前端（静态网页）                         │
│         GitHub Pages 托管                                 │
│    HTML5 + CSS3 + Vanilla JavaScript（或 Vue 3）          │
│    Chart.js（雷达图）+ 内联 SVG（角色图）                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS API 调用
                     ▼
┌─────────────────────────────────────────────────────────┐
│               数据层（腾讯云 CloudBase）                   │
│         云数据库：存储每份问卷原始数据                      │
│         云函数（可选）：服务端二次校验                      │
│         免费套餐足够学术问卷体量                            │
└─────────────────────────────────────────────────────────┘
```

### 2.1 前端技术选型
- **框架**：推荐 Vanilla JS（零依赖，GitHub Pages 直接可用）；或 Vue 3 CDN 版本
- **图表库**：Chart.js（CDN 引入，雷达图）
- **字体**：思源黑体 / 系统中文字体
- **样式**：CSS Variables 管理主题色，移动端优先（max-width: 600px）

### 2.2 GitHub 仓库结构
```
repo/
├── index.html          # 主入口，所有步骤在单页面 SPA 中切换
├── css/
│   └── style.css
├── js/
│   ├── main.js         # 问卷逻辑、步骤切换
│   ├── scoring.js      # 评分计算、类型判定
│   ├── radar.js        # 雷达图渲染（Chart.js）
│   └── db.js           # 腾讯云 CloudBase SDK 调用
├── assets/
│   └── characters/     # 4个 SVG 角色文件（或直接内联）
└── README.md
```

---

## 3. 用户旅程与页面流程

```
[欢迎页 / 知情同意] → [Step 1 人口学] → [Step 2 家庭参与 FIQ]
→ [Step 3 家园关系] → [Step 4 情绪引导 CCNES] → [结果页]
```

### 3.1 欢迎页
- 项目简介（2-3句话）
- 预计填写时间：约 15-20 分钟
- 知情同意声明（研究用途、匿名处理、自愿参与）
- **[我已了解，开始填写]** 按钮
- 顶部展示机构 Logo（参考 Time Perspective 项目风格）

### 3.2 Step 1：背景信息（模块A）
- 约 10 道背景题
- 题型：单选、下拉选择
- 进度条：20%

### 3.3 Step 2：家庭参与（模块B 第一部分，FIQ）
- 35 道 Likert 量表题（1=从不 / 2=有时 / 3=经常 / 4=总是）
- 建议分 3 小节展示（居家学习 / 学校参与 / 家园沟通），每节有小标题
- 进度条：40%

### 3.4 Step 3：家园关系（模块B 第二部分）
- 师幼关系感知量表
- 进度条：60%
- **注意**：此模块数据仅作研究变量，不参与类型判定，但会显示在雷达图的"家园关系"参考线上

### 3.5 Step 4：情绪引导方式（模块C，CCNES）
- 12 个情境，每个情境 6 种回应，家长对每种回应评分（1-5分）
- 情境以"情境卡片"形式呈现，描述孩子的具体状况
- 每个情境 6 个滑条 / 单排 5 级选择
- 进度条：80%

### 3.6 结果页
- 进度条：100% → 短暂加载动画（1-2秒）→ 结果展示
- 展示内容（从上到下）：
  1. **大标题**："你是 [类型名]！"
  2. **角色插图**（对应类型的 SVG 角色，带名字标签）
  3. **雷达图**（5+1 维度）
  4. **类型描述**（2-3段文字）
  5. **你的特质**（3-4 条）
  6. **成长建议**（2-3 条）
  7. **分享按钮**（"分享给朋友" + 微信分享图）

### 3.7 进度保存
- 使用 `localStorage` 暂存当前进度，防止意外刷新丢失
- 不跨设备同步（学术问卷无需此功能）

---

## 4. 问卷结构详解

### 4.1 模块A：人口学背景（约10题）
> 仅用于分组分析，不参与类型计算

| # | 题目 | 题型 |
|---|------|------|
| A1 | 您是孩子的 | 单选：父亲 / 母亲 / 祖父母 / 其他主要照料者 |
| A2 | 孩子年龄 | 下拉：3岁 / 4岁 / 5岁 / 6岁 |
| A3 | 孩子性别 | 单选：男 / 女 |
| A4 | 孩子是否独生子女 | 单选：是 / 否 |
| A5 | 您的最高学历 | 单选：初中及以下 / 高中或中专 / 大专 / 本科 / 硕士及以上 |
| A6 | 您目前的工作状况 | 单选：全职工作 / 兼职工作 / 全职在家 / 其他 |
| A7 | 家庭月收入（选填） | 下拉：5档 |
| A8 | 孩子就读幼儿园类型 | 单选：公立 / 私立 / 国际 |
| A9 | 工作日平均每天与孩子互动时间 | 单选：1小时以内 / 1-2小时 / 2-4小时 / 4小时以上 |
| A10 | 您对自家教育方式的总体评价 | 5级：很不满意→很满意 |

### 4.2 模块B 第一部分：家庭参与量表（FIQ，35题）

**作答说明**：请根据实际情况评分（1=从不，2=有时，3=经常，4=总是）

**维度一：居家学习（题 B1-B8）**
- B1. 我会陪孩子练习数数或简单数学
- B2. 我会陪孩子练习认字或阅读
- B3. 我会和孩子一起做创意手工或绘画
- B4. 我会给孩子讲故事或读绘本
- B5. 我为孩子提供适合学习的书籍或玩具
- B6. 家里有专门供孩子学习/阅读的空间
- B7. 我会和孩子讨论他/她在幼儿园的学习内容
- B8. 我会根据孩子的兴趣为他/她安排课外活动

**维度二：学校参与（题 B9-B19）**
- B9. 我会参加幼儿园的家长会
- B10. 我会参加幼儿园的亲子活动或运动会
- B11. 我曾在幼儿园担任过志愿者
- B12. 我了解幼儿园的课程和教学计划
- B13. 我会参加幼儿园组织的家长工作坊或讲座
- B14. 我关注幼儿园发的通知或公众号
- B15. 我和孩子聊他/她在幼儿园的朋友和活动
- B16. 我会帮助孩子准备幼儿园要求的材料或作业
- B17. 我知道孩子班级里的其他小朋友的名字
- B18. 我对孩子的幼儿园生活感到满意
- B19. 我认为家长参与学校活动对孩子有帮助

**维度三：家园沟通（题 B20-B35）**
- B20. 我会主动和孩子的老师交流孩子的情况
- B21. 老师会主动向我反馈孩子在校的表现
- B22. 我会就孩子的学习进展和老师沟通
- B23. 我会就孩子的情绪或行为问题和老师沟通
- B24. 我对老师的教育方式感到认可
- B25. 我和老师之间沟通顺畅
- B26. 老师了解我孩子的个性和需求
- B27. 我会检查孩子的书包或联系册
- B28. 我会回复老师发送的消息
- B29. 我会参加家长个别面谈
- B30. 我觉得老师重视我的意见
- B31. 我会就孩子的特殊需求向老师说明
- B32. 我会感谢老师对孩子的付出
- B33. 当孩子出现问题时，我会及时和老师沟通
- B34. 我认为家园沟通对孩子成长很重要
- B35. 总体来说，我和幼儿园之间的关系是良好的

### 4.3 模块B 第二部分：师幼关系感知

**作答说明**：以下描述的是班级教师与您孩子之间的关系，请评分（1=完全不符合，5=非常符合）

（此处插入师幼关系感知量表完整题目，约8-12题）

> **开发说明**：此模块结果存入数据库字段 `teacher_child_score`，仅在雷达图中以"家园关系"维度呈现，不参与家长类型判定。

### 4.4 模块C：情绪引导方式（CCNES，12情境×6评分）

**作答说明**：以下描述了孩子可能遭遇的一些情况，每种情况下列出了6种可能的家长回应。请根据您**实际上**会有多大可能做出这种回应，从1（几乎不会）到5（几乎总是）评分。

**情境列表**：

| 情境编号 | 情境描述 |
|---------|---------|
| C1 | 孩子生病，不能出去和朋友玩，感到难过和沮丧 |
| C2 | 孩子心爱的玩具车摔坏了，很伤心 |
| C3 | 孩子把在幼儿园得到的奖品弄丢了，很沮丧 |
| C4 | 孩子非常害怕打针，在医院哭闹 |
| C5 | 孩子不愿意独自去朋友家玩，感到不安 |
| C6 | 孩子在班级活动中出了差错，感到难堪 |
| C7 | 孩子在表演前非常紧张 |
| C8 | 孩子收到了一份不喜欢的生日礼物，面露失望 |
| C9 | 孩子看了恐怖节目，晚上睡不着 |
| C10 | 孩子被其他小朋友排斥，不让他/她加入游戏 |
| C11 | 孩子因为哭泣被其他小朋友取笑 |
| C12 | 孩子比较害羞，在见到陌生人时感到不安 |

**策略代码对照表**（每情境6个选项对应的策略）：

| 情境 | 选项(1) | 选项(2) | 选项(3) | 选项(4) | 选项(5) | 选项(6) |
|-----|---------|---------|---------|---------|---------|---------|
| C1  | PUN     | DIS     | PF      | MIN     | EE      | EF      |
| C2  | DIS     | EF      | MIN     | PF      | EE      | PUN     |
| C3  | DIS     | MIN     | PF      | EF      | EE      | PUN     |
| C4  | PUN     | EE      | MIN     | DIS     | EF      | PF      |
| C5  | EF      | PF      | MIN     | PUN     | DIS     | EE      |
| C6  | EF      | MIN     | DIS     | PUN     | EE      | PF      |
| C7  | PF      | EF      | DIS     | MIN     | PUN     | EE      |
| C8  | EE      | PF      | DIS     | MIN     | PUN     | EF      |
| C9  | EE      | DIS     | MIN     | PF      | PUN     | EF      |
| C10 | DIS     | PUN     | EE      | EF      | PF      | MIN     |
| C11 | MIN     | DIS     | PUN     | PF      | EF      | EE      |
| C12 | PF      | EE      | EF      | DIS     | PUN     | MIN     |

**策略说明**：
- **EE**（鼓励表达）：鼓励孩子说出、表达自己的情绪
- **EF**（情绪聚焦/安慰转移）：提供安慰、转移注意力
- **PF**（问题解决）：帮助分析情况、寻找解决方案
- **MIN**（淡化反应）：淡化或忽视孩子的情绪
- **DIS**（父母困扰）：家长自身感到困扰或焦虑
- **PUN**（惩罚反应）：批评或惩罚孩子的情绪反应

---

## 5. 评分与计算逻辑

### 5.1 FIQ 得分计算

```javascript
// 各维度均分（raw_mean，范围 1-4）
const fiq_home = mean(B1..B8);        // 居家学习
const fiq_school = mean(B9..B19);     // 学校参与
const fiq_comm = mean(B20..B35);      // 家园沟通
const fiq_total = mean(B1..B35);      // FIQ 总均分（用于类型判定轴1）

// 归一化到 0-100（用于雷达图显示）
function normalize_fiq(raw) {
  return (raw - 1) / 3 * 100;
}
```

### 5.2 CCNES 得分计算

```javascript
// 收集每道题的原始评分（1-5）
// 根据策略对照表，提取各策略的所有评分

function compute_ccnes_scores(responses) {
  // responses: { C1_1: score, C1_2: score, ..., C12_6: score }
  
  const strategy_map = {
    EE: [], EF: [], PF: [], MIN: [], DIS: [], PUN: []
  };
  
  // 将每个选项评分归入对应策略
  const mapping = [
    { C1:  ['PUN','DIS','PF','MIN','EE','EF'] },
    { C2:  ['DIS','EF','MIN','PF','EE','PUN'] },
    { C3:  ['DIS','MIN','PF','EF','EE','PUN'] },
    { C4:  ['PUN','EE','MIN','DIS','EF','PF'] },
    { C5:  ['EF','PF','MIN','PUN','DIS','EE'] },
    { C6:  ['EF','MIN','DIS','PUN','EE','PF'] },
    { C7:  ['PF','EF','DIS','MIN','PUN','EE'] },
    { C8:  ['EE','PF','DIS','MIN','PUN','EF'] },
    { C9:  ['EE','DIS','MIN','PF','PUN','EF'] },
    { C10: ['DIS','PUN','EE','EF','PF','MIN'] },
    { C11: ['MIN','DIS','PUN','PF','EF','EE'] },
    { C12: ['PF','EE','EF','DIS','PUN','MIN'] },
  ];
  
  mapping.forEach((item, sitIdx) => {
    const sitNum = sitIdx + 1;
    const strategies = Object.values(item)[0];
    strategies.forEach((strategy, optIdx) => {
      const key = `C${sitNum}_${optIdx + 1}`;
      strategy_map[strategy].push(responses[key]);
    });
  });
  
  // 各策略均分（范围 1-5）
  const scores = {};
  for (const [strat, vals] of Object.entries(strategy_map)) {
    scores[strat] = mean(vals);
  }
  
  // 支持性策略均分 vs 压制性策略均分
  scores.supportive = mean([scores.EE, scores.EF, scores.PF]);
  scores.suppressive = mean([scores.MIN, scores.DIS, scores.PUN]);
  
  return scores;
}

// 归一化到 0-100（用于雷达图）
function normalize_ccnes(raw) {
  return (raw - 1) / 4 * 100;
}
```

### 5.3 师幼关系感知得分

```javascript
const teacher_child_score = mean(师幼关系量表所有题目);
// 归一化后用于雷达图"家园关系"维度
```

### 5.4 类型判定逻辑

#### 分类轴

| 轴 | 指标 | 阈值 |
|----|------|------|
| 轴1：家庭参与程度 | `fiq_total` | 阈值 θ₁（见下） |
| 轴2：情绪引导风格 | `ccnes.supportive - ccnes.suppressive` | 阈值 θ₂ = 0 |

#### 阈值设置

> **重要说明**：当前使用**估算阈值**，待收集足够样本（建议 N ≥ 50）后，以样本中位数替换，无需修改判定逻辑，只需更新常量值。

```javascript
// 当前估算阈值（基于量表中点值）
const THRESHOLD_FIQ = 2.5;        // FIQ均分中点（量表范围1-4）
const THRESHOLD_EMOTION_DIFF = 0; // 支持性得分 - 压制性得分的分界线

// 数据收集后更新为：
// const THRESHOLD_FIQ = median(所有参与者的 fiq_total);
// const THRESHOLD_EMOTION_DIFF = median(所有参与者的 emotion_diff);
```

#### 类型判定

```javascript
function determine_type(fiq_total, ccnes_scores) {
  const high_involvement = fiq_total >= THRESHOLD_FIQ;
  const emotion_diff = ccnes_scores.supportive - ccnes_scores.suppressive;
  const supportive_style = emotion_diff >= THRESHOLD_EMOTION_DIFF;
  
  if (high_involvement && supportive_style)  return 'FULL_ESCORT';   // 全情护航者
  if (high_involvement && !supportive_style) return 'ACADEMIC_LEAD'; // 学业主导者
  if (!high_involvement && supportive_style) return 'WARM_COMPANION'; // 温暖陪伴者
  return 'GROWTH_EXPLORER'; // 成长探索者
}
```

---

## 6. 家长类型系统

### 6.1 四种类型概览

| 类型代码 | 中文名 | 英文标识 | 颜色 | 参与度 | 情绪风格 |
|---------|--------|----------|------|--------|---------|
| FULL_ESCORT | 全情护航者 | Dedicated Guide | 暖金 #F59E0B | 高 | 支持型 |
| ACADEMIC_LEAD | 学业主导者 | Academic Leader | 蓝色 #3B82F6 | 高 | 偏压制型 |
| WARM_COMPANION | 温暖陪伴者 | Warm Companion | 粉色 #EC4899 | 低 | 支持型 |
| GROWTH_EXPLORER | 成长探索者 | Growth Explorer | 绿色 #22C55E | 低 | 偏压制型 |

### 6.2 四种类型详细描述

#### 全情护航者（FULL_ESCORT）
- **核心特征**：对孩子的学习和情感均高度投入，是最全面的参与型家长
- **优势**：创造丰富的学习环境、善于倾听情绪、与学校保持良好沟通
- **潜在挑战**：高投入可能导致孩子自主空间不足
- **颜色**：暖金，开臂欢迎姿态，传递温暖与积极

#### 学业主导者（ACADEMIC_LEAD）
- **核心特征**：高度参与孩子教育，但面对情绪倾向于淡化或转移
- **优势**：认真负责、有结构、重视学业发展
- **潜在挑战**：情绪支持不足，孩子可能不擅长表达感受
- **颜色**：专业蓝，戴眼镜持书，传递认真与规划感

#### 温暖陪伴者（WARM_COMPANION）
- **核心特征**：情感支持强，但结构性学习参与相对有限
- **优势**：高共情、创造安全感、孩子愿意倾诉
- **潜在挑战**：学习环境支持和学校参与可加强
- **颜色**：温柔粉，手捂心口，传递情感联结

#### 成长探索者（GROWTH_EXPLORER）
- **核心特征**：两个维度均在发展中，但有自我觉察和成长意愿
- **优势**：开放心态、自我觉察是改变的起点
- **潜在挑战**：参与度和情绪支持均有提升空间
- **颜色**：生机绿，持植物探索，传递成长与潜力

---

## 7. 雷达图规格

### 7.1 维度定义

| 维度 | 来源 | 计算方式 | 显示名称 |
|------|------|---------|---------|
| 居家学习投入 | FIQ B1-B8 | `normalize_fiq(mean(B1..B8))` | 居家学习 |
| 学校参与度 | FIQ B9-B19 | `normalize_fiq(mean(B9..B19))` | 学校参与 |
| 家园沟通质量 | FIQ B20-B35 | `normalize_fiq(mean(B20..B35))` | 家园沟通 |
| 情绪接纳与鼓励 | CCNES EE+EF | `normalize_ccnes(mean(EE,EF))` | 情绪支持 |
| 问题解决引导 | CCNES PF | `normalize_ccnes(PF)` | 解决引导 |
| 家园关系（参考） | 师幼关系量表 | `normalize(teacher_child_score)` | 家园关系* |

> \* 家园关系维度以**虚线**或**不同颜色**区分，并在图下方注明"此项为家长对师幼关系的感知，仅供参考"

### 7.2 Chart.js 雷达图配置参考

```javascript
const radarConfig = {
  type: 'radar',
  data: {
    labels: ['居家学习', '学校参与', '家园沟通', '情绪支持', '解决引导'],
    datasets: [
      {
        label: '你的得分',
        data: [score1, score2, score3, score4, score5], // 0-100
        backgroundColor: 'rgba(主色, 0.2)',
        borderColor: '主色',
        borderWidth: 2,
        pointBackgroundColor: '主色',
      },
      {
        label: '家园关系（参考）',
        data: [null, null, teacher_score, null, null], // 仅在第3轴显示，或单独展示
        borderDash: [5, 5],
        borderColor: '#94A3B8',
        pointBackgroundColor: '#94A3B8',
      }
    ]
  },
  options: {
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 25 },
        grid: { color: 'rgba(0,0,0,0.1)' }
      }
    },
    plugins: {
      legend: { display: false }
    }
  }
};
```

> **主色**按类型替换：全情护航者 `#F59E0B`，学业主导者 `#3B82F6`，温暖陪伴者 `#EC4899`，成长探索者 `#22C55E`

---

## 8. 结果页反馈文案

> **原则**：不批评，只建设性引导；专业有深度；让家长感到被看见、被尊重

### 8.1 全情护航者

**标题**：你是孩子成长路上的「全情护航者」！

**类型描述**：
> 你以充分的参与和温暖的情感支持，为孩子构建了一个安全而丰富的成长环境。无论是在家陪伴学习、积极参与学校活动，还是在孩子遇到情绪波动时给予倾听和引导，你都做到了高度的投入。研究表明，这种全面的家庭参与方式，对孩子的学业表现、社交能力和情感健全发展都有显著的正向影响。

**你的特质**：
- 积极参与孩子的学习与校园生活，提供丰富的学习资源
- 善于倾听和回应孩子的情绪，帮助孩子建立情绪词汇
- 与幼儿园老师保持良好沟通，是家园合作的积极推动者
- 在家营造了温暖而有结构的学习氛围

**成长建议**：
- 在充分投入的同时，可以适当给孩子留出一些"自主解决问题"的空间，这有助于培养孩子的独立性和抗挫力
- 定期和孩子聊聊"什么事情让你自己觉得很厉害"，强化孩子的内在驱动力，而非仅依赖外部支持

---

### 8.2 学业主导者

**标题**：你是孩子成长路上的「学业主导者」！

**类型描述**：
> 你对孩子的教育倾注了大量的时间和精力——无论是辅导学习、参与学校活动，还是和老师保持沟通，你都做得认真负责。面对孩子的情绪，你有时倾向于转移注意力或以"要坚强"来回应，这是很多专注于解决问题的家长的自然反应。情绪引导和认知引导同样重要，适当增加情感回应，孩子的心理韧性会更强。

**你的特质**：
- 高度重视孩子的学习发展，积极营造有利于学业的家庭环境
- 认真参与学校活动和家园沟通，是老师信赖的家长
- 擅长规划、有结构地支持孩子
- 对孩子抱有真诚的期望和关注

**成长建议**：
- 当孩子表达负面情绪时，可以先用一句话"确认"感受，例如"我看到你很失望"，然后再讨论解决方案——这个小小的停顿，对孩子的情绪发展意义很大
- 可以在每天睡前设置5分钟的"情绪聊天时间"，问问孩子"今天有什么让你开心或难过的事"，不急着给建议，只是倾听

---

### 8.3 温暖陪伴者

**标题**：你是孩子成长路上的「温暖陪伴者」！

**类型描述**：
> 你对孩子的内心世界高度敏感，善于回应孩子的情绪，为孩子创造了一个温暖而有安全感的家庭氛围。孩子在你身边感到被接纳和理解。研究显示，情感安全感是孩子探索世界的基础。在情感联结已经非常稳固的基础上，适当增加一些结构性的学习参与，将让孩子在情感和认知两个维度都得到充分的滋养。

**你的特质**：
- 情感细腻，善于捕捉并回应孩子的情绪需求
- 为孩子创造了温暖、接纳的家庭氛围
- 孩子愿意向你倾诉，亲子关系质量高
- 重视孩子的感受胜过对结果的评判

**成长建议**：
- 可以尝试每周安排一次"家庭学习小时光"——哪怕只是一起读一本绘本或玩一个数字游戏，这种结构性的互动会让孩子受益
- 参加1-2次幼儿园的家长开放日或亲子活动，让孩子看到你对他/她校园生活的关注，这会大大增强孩子的归属感

---

### 8.4 成长探索者

**标题**：你是孩子成长路上的「成长探索者」！

**类型描述**：
> 你和孩子都在各自的成长旅程中同行。在家庭参与和情绪引导两个方面，你都有很多值得探索的空间。这一类型的家长往往面临较多的生活压力，或正在经历职业、家庭角色的转型期。愿意填写这份问卷，本身就是自我觉察的开始——而自我觉察，正是所有改变中最重要的第一步。

**你的特质**：
- 有意识地反思自己的教育方式，具备成长型思维
- 对孩子抱有真诚的爱与期望
- 愿意接受新的育儿理念和方法
- 你的孩子，正在一位真诚的家长身边慢慢成长

**成长建议**：
- 从一个最小的行动开始：每天睡前问孩子"今天有什么让你开心的事"，这5分钟的连接会产生意想不到的效果
- 当孩子有情绪时，先蹲下来，平视孩子，说一声"我在这里"——这个动作本身，就已经是很有力量的情感支持了
- 可以参考一些情绪引导类的亲子绘本（如《菲菲生气了》《我的感觉》系列），和孩子一起阅读，把引导融入日常

---

## 9. SVG 角色资源规格

### 9.1 角色设计说明

四个 SVG 角色已设计完毕，采用 chibi 卡通风格，纯 SVG 路径绘制（无外部图片依赖）。

| 角色 | 主色 | 特征 | 装饰元素 |
|------|------|------|---------|
| 全情护航者 | #F59E0B 暖金 | 发髻，双臂张开 | 浮动星星，胸前星形 |
| 学业主导者 | #3B82F6 蓝色 | 深色整齐发，圆框眼镜 | 手持书本，书本装饰 |
| 温暖陪伴者 | #EC4899 粉色 | 波浪卷发，手捂心口 | 浮动爱心，胸前心形 |
| 成长探索者 | #22C55E 绿色 | 凌乱发型+呆毛，手持植物 | 闪光点，小芽装饰 |

### 9.2 使用方式

**方式一：内联 SVG（推荐）**

将完整 SVG 代码直接嵌入 HTML，结果页根据类型动态显示对应角色：

```html
<div id="character-display">
  <!-- 根据 type 动态插入对应 SVG 代码 -->
</div>
```

```javascript
const CHARACTER_SVG = {
  FULL_ESCORT: `<svg ...>...</svg>`,
  ACADEMIC_LEAD: `<svg ...>...</svg>`,
  WARM_COMPANION: `<svg ...>...</svg>`,
  GROWTH_EXPLORER: `<svg ...>...</svg>`,
};

document.getElementById('character-display').innerHTML = 
  CHARACTER_SVG[determined_type];
```

**方式二：单独 SVG 文件**

将4个角色保存为 `assets/characters/` 下的独立文件，通过 `<img>` 或 `<object>` 引入。

### 9.3 结果页角色展示规格

- 角色 SVG 显示尺寸：宽度 160px，高度自适应
- 角色下方显示类型名称标签（14px，对应主色，字重600）
- 进入结果页时播放简单弹入动画（`transform: scale(0) → scale(1)`，duration 0.5s）

---

## 10. 数据存储方案

### 10.1 腾讯云 CloudBase 配置

**步骤**：
1. 注册腾讯云账号，开通 CloudBase（云开发）
2. 创建环境，选择**按量付费**（免费额度足够）
3. 在云数据库中创建集合：`questionnaire_responses`
4. 开启**匿名登录**权限（问卷无需用户注册）
5. 在前端引入 CloudBase SDK：

```html
<script src="https://imgcache.qq.com/qcloud/tcbjs/{version}/tcb.js"></script>
```

在写入数据之前要先加一行登录：

async function saveResponse(responseData) {
  try {
    // ⬇️ 新增这一步：匿名登录（自动获取写入权限）
    await app.auth().anonymousAuthProvider().signIn();
    
    await db.collection('questionnaire_responses').add({
      ...responseData,
      submitted_at: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('保存失败', err);
    return false;
  }
}

这行 signIn() 是幂等的——已经登录了就直接跳过，不会重复登录，所以每次提交前调用完全没问题。



### 10.2 SDK 初始化与数据写入

```javascript
// db.js

const app = tcb.init({
  env: "kindylab-1gf3c18x96831580"
});
const db = app.database();

async function saveResponse(responseData) {
  try {
    await db.collection('questionnaire_responses').add({
      ...responseData,
      submitted_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
    });
    console.log('数据保存成功');
    return true;
  } catch (err) {
    console.error('数据保存失败', err);
    // 可选：本地备份到 localStorage
    localStorage.setItem('backup_' + Date.now(), JSON.stringify(responseData));
    return false;
  }
}
```

### 10.3 数据导出

研究者登录 CloudBase 控制台 → 数据库 → `questionnaire_responses` → 导出 CSV/JSON。

---

## 11. 数据字段规范

每份问卷提交的数据结构：

```json
{
  "session_id": "uuid",
  "submitted_at": "2024-01-01T00:00:00Z",
  
  // 模块A：人口学
  "demo_role": "母亲",
  "demo_child_age": 4,
  "demo_child_gender": "男",
  "demo_only_child": true,
  "demo_education": "本科",
  "demo_employment": "全职工作",
  "demo_income": "10000-20000",
  "demo_kindergarten_type": "私立",
  "demo_daily_interaction": "1-2小时",
  "demo_satisfaction": 4,
  
  // 模块B FIQ：原始评分（1-4）
  "fiq_b1": 3, "fiq_b2": 4, ..., "fiq_b35": 3,
  
  // 模块B 计算得分
  "fiq_home_mean": 3.25,
  "fiq_school_mean": 2.8,
  "fiq_comm_mean": 3.1,
  "fiq_total_mean": 3.05,
  
  // 模块B 第二部分：师幼关系感知
  "teacher_child_raw": { "tc1": 4, "tc2": 3, ... },
  "teacher_child_mean": 3.5,
  
  // 模块C CCNES：原始评分（1-5）
  "ccnes_c1_1": 2, "ccnes_c1_2": 4, ..., "ccnes_c12_6": 3,
  
  // 模块C 计算得分（各策略均分）
  "ccnes_EE": 3.8,
  "ccnes_EF": 3.5,
  "ccnes_PF": 3.6,
  "ccnes_MIN": 2.1,
  "ccnes_DIS": 1.8,
  "ccnes_PUN": 1.5,
  "ccnes_supportive": 3.63,
  "ccnes_suppressive": 1.80,
  "ccnes_emotion_diff": 1.83,
  
  // 类型判定结果
  "parent_type": "FULL_ESCORT",
  
  // 雷达图得分（0-100）
  "radar_home": 75.0,
  "radar_school": 60.0,
  "radar_comm": 70.0,
  "radar_emotion_support": 80.0,
  "radar_problem_solving": 76.7,
  "radar_teacher_child": 62.5
}
```

---

## 12. UI 设计规范

### 12.1 视觉风格
- 参考 Time Perspective 问卷（https://qingyonghu.github.io/Time_perspective/）的版式
- 清洁、现代、学术感；非正式但专业
- 主体背景：白色或极浅灰（#FAFAFA）
- 字体：系统中文字体栈（PingFang SC > Hiragino Sans GB > Microsoft YaHei > sans-serif）

### 12.2 颜色系统

```css
:root {
  /* 港中文深圳品牌色 */
  --color-primary: #4E2A84;      /* 主紫色（问卷主色调） */
  --color-primary-light: #7B4FBF; /* 浅紫，按钮hover */
  --color-gold: #C9A227;          /* 金色，强调/标题装饰 */
  --color-gold-light: #F0D080;    /* 浅金，背景点缀 */

  /* 四种类型颜色保持不变（角色SVG已固定） */
  --color-amber: #F59E0B;   /* 全情护航者 */
  --color-blue: #3B82F6;    /* 学业主导者 */
  --color-pink: #EC4899;    /* 温暖陪伴者 */
  --color-green: #22C55E;   /* 成长探索者 */

  /* 通用 */
  --color-text: #1F2937;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
  --color-bg: #FFFFFF;
  --border-radius: 12px;
}
```

### 12.3 进度条规格

```css
.progress-bar {
  width: 100%;
  height: 6px;
  background: #E5E7EB;
  border-radius: 3px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.4s ease;
}
```


**同步修改以下 UI 元素**：

| 元素 | 原来 | 改为 |
|------|------|------|
| 进度条填充色 | `--color-primary`（紫蓝） | `--color-primary`（深紫）✓ 自动生效 |
| 欢迎页标题/Logo区域 | 无特别规定 | 顶部加一条 4px 金色横线 `border-top: 4px solid var(--color-gold)` |
| 下一步/提交按钮 | 紫蓝 | 深紫背景 + 白字；hover 时浅紫 |
| 结果页"你是XX家长"大标题 | 无 | 用金色 `var(--color-gold)` 显示 |
| 页脚机构署名 | 无 | 深紫色小字 |

---

### 12.4 Likert 量表题 UI

- 题目文字：16px，行高1.7
- 选项：横排 4 或 5 个按钮，宽度均分
- 选中状态：主色背景，白色文字
- 未选中：边框线，悬停变浅色背景
- 移动端：按钮不小于 44px 高度（触控友好）

### 12.5 CCNES 情境卡片 UI

```
┌──────────────────────────────────────────┐
│  情境 1 / 12                              │
│                                          │
│  【情境描述】孩子生病，不能出去和朋友玩，    │
│  感到难过和沮丧。                          │
│                                          │
│  回应1：[1][2][3][4][5]  几乎不会→几乎总是  │
│  回应2：[1][2][3][4][5]                   │
│  ...                                     │
│  回应6：[1][2][3][4][5]                   │
└──────────────────────────────────────────┘
```

- 情境卡片有轻微阴影或边框，视觉区分
- 6个回应的文字来源于原始问卷（直接填入真实选项文字）
- 每情境所有6选项均须评分后才能进入下一题，否则提示"请完成本情境的全部评分"

---

## 13. 开发注意事项

### 13.1 必须实现的功能
- [x] 5步骤页面切换（SPA，无整页刷新）
- [x] 每步骤"上一步"/"下一步"按钮
- [x] 进度条实时更新
- [x] 必填校验（每步提交前检查是否所有题目已作答）
- [x] localStorage 暂存（防刷新丢失）
- [x] 腾讯云写入（含失败重试/本地备份）
- [x] 雷达图渲染（Chart.js）
- [x] 类型角色 SVG 展示
- [x] 结果页分享按钮

### 13.2 移动端适配要求
- 最大宽度 600px，超过则居中显示
- 触控按钮最小尺寸 44×44px
- 雷达图在小屏幕下尺寸自适应（建议 min-width: 280px）
- 无需横屏适配

### 13.3 数据安全与隐私
- 不采集姓名、手机号等可识别个人信息
- 腾讯云匿名登录，数据与具体用户身份无关联
- 知情同意页须明确说明数据仅用于科研分析

### 13.4 阈值更新流程

收集足够样本后（建议 N ≥ 50），按如下步骤更新类型判定阈值：

1. 从 CloudBase 导出所有数据 CSV
2. 计算 `fiq_total_mean` 列的中位数 → 替换 `THRESHOLD_FIQ`
3. 计算 `ccnes_emotion_diff` 列的中位数 → 替换 `THRESHOLD_EMOTION_DIFF`
4. 重新部署前端即可，无需修改判定逻辑

### 13.5 分享功能

**方案：用 `html2canvas` 截图结果卡片，生成 PNG 下载**

无需后端，纯前端实现，适合 GitHub Pages 静态部署。

### 引入库

```html
<!-- 在 index.html 底部引入 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

### 结果页新增"分享卡片"区块

在结果页 HTML 中，专门做一个用于截图的卡片（可以和正文分开，截图区域单独设计得更精美）：

```html
<!-- 截图目标区域，id固定 -->
<div id="share-card" style="
  width: 375px;
  padding: 32px 24px;
  background: white;
  border-radius: 20px;
  border-top: 6px solid var(--type-color);
  font-family: 'PingFang SC', sans-serif;
  text-align: center;
">
  <!-- 机构名（金色小字） -->
  <p style="font-size:11px; color:#C9A227; margin:0 0 16px;">
    香港中文大学（深圳）人文社科学院KINDY Lab
  </p>

  <!-- 角色SVG（内联，缩小到160px） -->
  <div id="share-character" style="margin: 0 auto 12px;"></div>

  <!-- 类型名称 -->
  <h2 style="font-size:22px; font-weight:700; color:#1F2937; margin:0 0 4px;">
    我是「全情护航者」
  </h2>
  <p style="font-size:13px; color:#6B7280; margin:0 0 20px;">
    全方位投入 · 情感支持型家长
  </p>

  <!-- 雷达图（canvas，固定尺寸） -->
  <canvas id="share-radar" width="280" height="220"></canvas>

  <!-- 一句话核心描述 -->
  <p style="font-size:13px; color:#374151; line-height:1.7; margin:16px 0;">
    你以充分的参与和温暖的情感支持，<br>为孩子构建了安全而丰富的成长环境。
  </p>

  <!-- 底部水印 -->
  <p style="font-size:10px; color:#9CA3AF; margin:16px 0 0;">
    扫码参与测评 · 了解你的家长类型
  </p>
</div>

<!-- 下载按钮（不在截图区域内） -->
<button onclick="downloadShareCard()" style="
  margin-top: 16px;
  padding: 12px 32px;
  background: #4E2A84;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
">
  保存并分享结果图
</button>
```

### 截图与下载逻辑

```javascript
// scoring.js 或 main.js 中添加

async function downloadShareCard() {
  const card = document.getElementById('share-card');
  
  // 临时设为可见（如果平时隐藏的话）
  card.style.display = 'block';
  
  const canvas = await html2canvas(card, {
    scale: 2,          // 2倍分辨率，适合手机屏幕
    useCORS: true,
    backgroundColor: '#ffffff',
    width: 375,
  });
  
  // 触发下载
  const link = document.createElement('a');
  link.download = '我的家长类型_港中大深圳.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
```

### 分享卡片视觉效果

```
┌──────────────────────────────┐  ← 顶部6px彩色线（类型主色）
│  香港中文大学（深圳）家庭教育研究  │  ← 金色小字
│                              │
│        [角色SVG图]            │
│     「全情护航者」             │  ← 大标题
│    全方位投入 · 情感支持       │  ← 副标题（灰色）
│                              │
│      [雷达图 280×220]         │
│                              │
│  你以充分的参与和温暖的情感支持  │  ← 一句话描述
│  为孩子构建了安全丰富的成长环境  │
│                              │
│     扫码参与测评 · 了解家长类型  │  ← 灰色小字水印
└──────────────────────────────┘
```

---

*文档版本：v1.0 | 最后更新：2026年4月*
