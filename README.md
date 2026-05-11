# 学前儿童家庭教育环境与情绪引导方式调查问卷

香港中文大学（深圳）人文社科学院 KINDY Lab 学术研究项目。面向学龄前儿童家长，调查家庭参与度与情绪引导方式，自动生成家长类型画像并提供个性化反馈。

## 在线访问

问卷已部署至 GitHub Pages，可直接通过链接分发：

```
https://<org>.github.io/family-involvement/
```

## 问卷结构

| 步骤 | 内容 | 题量 | 量表 |
|------|------|------|------|
| 欢迎页 | 知情同意声明 | — | — |
| Step 1 | 人口统计学背景信息 | 12 题 | 选择题 / 滑块 |
| Step 2 | 家庭参与问卷 (FIQ) | 36 题 | 4 级 Likert（很少–总是） |
| Step 3 | 家园关系 (Teacher-Child) | 25 题 | 4 级 Likert（分组） |
| Step 4 | 情绪引导方式 (CCNES) | 72 题 | 5 级 Likert（12 情境 × 6 反应） |
| 结果页 | 家长类型 + 雷达图 + 建议 | — | 自动生成 |

## 家长类型分类

根据 FIQ 总分与 CCNES 情绪支持维度差值的 2×2 矩阵，将家长分为四种类型：

| 类型 | FIQ 总分 | 情绪支持倾向 | 描述 |
|------|---------|------------|------|
| 全情护航者 | ≥ 2.5 | 支持型 | 全方位投入，情感支持充分 |
| 学业主导者 | ≥ 2.5 | 非支持型 | 高度参与学习，情绪引导偏结构化 |
| 温暖陪伴者 | < 2.5 | 支持型 | 情感陪伴突出，学习参与有提升空间 |
| 成长探索者 | < 2.5 | 非支持型 | 两方面均有探索空间，自我觉察型 |

## 技术栈

- **前端**：原生 HTML / CSS / JavaScript，无构建步骤
- **图表**：Chart.js 4.4.0（雷达图）
- **截图分享**：html2canvas 1.4.1
- **数据存储**：Tencent CloudBase（匿名登录），localStorage 作降级
- **部署**：GitHub Pages（静态托管）

## 项目结构

```
├── index.html              # 主页面
├── css/
│   └── style.css           # 全局样式（CSS Variables + 响应式）
├── js/
│   ├── data.js             # 问卷题目与结构定义
│   ├── scoring.js          # 评分计算、类型判定、反馈数据
│   ├── radar.js            # Chart.js 雷达图渲染
│   ├── db.js               # CloudBase 数据库集成
│   └── main.js             # SPA 流程控制、UI 渲染、导航
├── assets/
│   ├── characters/         # 四种家长类型角色图
│   ├── logo/               # 机构与实验室 Logo
│   └── qrcode.png          # 分享二维码
├── CLAUDE.md               # 开发参考文档
└── README.md
```

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/KINDY-Lab/family-involvement.git
cd family-involvement

# 本地启动（任选一种）
python3 -m http.server 8080
# 或
npx serve .
```

浏览器访问 `http://localhost:8080` 即可。

## 修改指南

- **增删题目**：编辑 `js/data.js` 中的 `QUESTIONNAIRE_DATA`，同步更新 `js/main.js` 验证逻辑和 `js/db.js` 字段序列化
- **调整评分**：修改 `js/scoring.js` 中的计算函数，类型阈值改 `THRESHOLD_FIQ` / `THRESHOLD_EMOTION_DIFF`
- **修改类型**：编辑 `js/scoring.js` 中的 `PARENT_TYPES`、`CHARACTER_IMAGES`、`SUGGESTIONS_POOL`
- **替换角色图**：替换 `assets/characters/` 下的 JPG 文件，更新 `scoring.js` 中路径

## License

本项目仅供学术研究使用，版权归香港中文大学（深圳）KINDY Lab 所有。
