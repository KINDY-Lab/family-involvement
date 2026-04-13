# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Academic questionnaire SPA for CUHK-Shenzhen KINDY Lab. Surveys preschool parents about family education involvement and emotional guidance, then classifies them into 4 parent types with a radar chart and personalized feedback. Hosted on GitHub Pages.

## Development

```bash
# Serve locally
python3 -m http.server 8080
# Open http://localhost:8080/
```

No build step — static HTML/CSS/JS served directly.

## Architecture

**Stack:** Vanilla JS + CSS Variables + CDN libraries (Chart.js 4.4.0, html2canvas 1.4.1, Tencent CloudBase SDK 1.12.1)

**Critical JS loading order** (in `index.html`):
```
data.js → scoring.js → radar.js → db.js → main.js
```
Files communicate via global variables (`QUESTIONNAIRE_DATA`, `PARENT_TYPES`, `CHARACTER_IMAGES`, `SUGGESTIONS_POOL`, `answers`, `currentStep`).

## Key Modules

| File | Role |
|------|------|
| `js/data.js` | Question text, structure (`QUESTIONNAIRE_DATA`), step definitions (`STEPS`) |
| `js/scoring.js` | FIQ/CCNES/teacher-child scoring, type determination (`determineType()`), parent type metadata (`PARENT_TYPES`), character image paths (`CHARACTER_IMAGES`), suggestion pool (`SUGGESTIONS_POOL` + `getRandomSuggestions()`) |
| `js/radar.js` | Chart.js radar chart wrappers (`renderRadarChart()`, `renderTCRadarChart()`) |
| `js/db.js` | CloudBase SDK integration, response serialization (`saveResponse()`, `buildResponseData()`) |
| `js/main.js` | SPA orchestration: step navigation, question rendering, validation with unanswered-highlight, localStorage persistence, results display, share card |

## Assets

- **Character images:** `assets/characters/{全情护航者,学业主导者,温暖陪伴者,成长探索者}.jpg` — mapped in `CHARACTER_IMAGES` in `scoring.js`
- **Logo:** `assets/logo/Kindy_lab.webp`, `assets/logo/cuhksz-hss-logo.png`
- **QR code:** `assets/qrcode.png`

## Scoring Pipeline

`submitQuestionnaire()` calls in sequence:
1. `computeFIQ(answers)` → section means (home 8 items, school 11 items, comm 17 items), normalized 0-100
2. `computeCCNES(answers)` → 6 strategy means (EE/EF/PF/MIN/DIS/PUN), supportive vs suppressive composite
3. `computeTeacherChild(answers)` → mean of 25 items (6 reverse-coded) + per-group breakdown for teacher-child radar. **Does NOT affect type**
4. `determineType()` → 2×2 matrix: `fiq_total >= 2.5` × `emotion_diff >= 0` → 4 types

## Results Page

Two radar charts: main (5 axes: home/school/comm/emotion/problem-solving) and teacher-child (6 sub-dimensions). Suggestions drawn from `SUGGESTIONS_POOL` via `getRandomSuggestions(type, 3)`. Share card is a deep-purple gradient card rendered with html2canvas for download.

## Type Thresholds

Constants in `scoring.js`: `THRESHOLD_FIQ = 2.5`, `THRESHOLD_EMOTION_DIFF = 0`. Per PRD, replace with sample medians after N≥50 responses — no logic changes needed.

## Data Storage

Primary: Tencent CloudBase (`kindylab-1gf3c18x96831580`, collection `questionnaire_responses`). Fallback: localStorage. CloudBase env ID is in `js/db.js`.

## Common Modifications

- **Add/edit questions:** Modify `QUESTIONNAIRE_DATA` in `js/data.js`, update validator in `js/main.js`, add field to `buildResponseData()` in `js/db.js`
- **Change scoring:** Update functions in `js/scoring.js`, adjust normalization if scale changes
- **Change types:** Edit `PARENT_TYPES`, `CHARACTER_IMAGES`, `SUGGESTIONS_POOL`, and `determineType()` in `js/scoring.js`
- **Update threshold constants:** Change `THRESHOLD_FIQ` and `THRESHOLD_EMOTION_DIFF` in `js/scoring.js`
- **Update suggestions:** Edit `SUGGESTIONS_POOL` arrays in `js/scoring.js` (8 per type, random 3 shown)
- **Change character images:** Replace JPG files in `assets/characters/` and update `CHARACTER_IMAGES` paths in `scoring.js`
