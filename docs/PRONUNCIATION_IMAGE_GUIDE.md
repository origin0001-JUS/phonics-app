# 발음 참조 이미지 생성 가이드 (Antigravity/Gemini용)

> 이 문서를 Antigravity에게 전달하면 17장의 발음 참조 이미지를 생성할 수 있습니다.

---

## 개요

- **목적**: MouthVisualizer에서 음소별 "눈으로 구별하는 법" 참조 이미지 제공
- **대상**: 한국 초등 1~4학년
- **총 17장** (비교 이미지는 1장에 2개 음소 포함)
- **저장 위치**: `public/assets/images/pronunciation/`
- **파일 형식**: `.webp` (512×512px)
- **스타일**: 아이 친화적 교육 일러스트, 밝은 파스텔 톤, 흰 배경

---

## 스타일 가이드

```
- 일관된 아트 스타일: 귀엽고 둥근 "어린이 캐릭터" 입/얼굴 일러스트 (실사 X, 깔끔한 플랫 디자인 벡터 아트 O)
- 밝고 깨끗한 톤: 솔리드 파스텔 컬러 배경(예: 파스텔 블루, 핑크, 옐로우)
- 직관적인 시각적 기호: 텍스트는 절대 포함하지 않음(Absolutely NO text, NO letters, NO words).
- 보이스/무성음 구분: 성대 진동은 목에 '지그재그 진동선(〰️)', 무성음은 '바람 부는 기호(💨)' 등으로 시각화
- 비교 이미지: 좌우 대칭 분할 레이아웃으로 차이를 극명하게 보여줌
- 512×512px 웹용 스퀘어
```

---

## 이미지 목록 (17장)

모든 프롬프트에 공통 필수 접두어: **"Vector illustration of a cute child's mouth, clean flat design, pastel background. Absolutely NO TEXT, NO LETTERS, NO WORDS anywhere in the image. Pure visual symbols only."**

### 🔴 Very Hard (7장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 1 | `th_voiceless.webp` | /θ/ (thin) 정면 | Vector illustration of a child's mouth (front view). Tongue tip clearly visible between upper and lower teeth. A small visual gust of wind symbol (💨) near the mouth. Clean flat design, pastel background, NO TEXT. |
| 2 | `th_voiced.webp` | /ð/ (this) 정면 + 성대 진동 | Vector illustration of a child's mouth (front view). Tongue tip clearly visible between upper and lower teeth. A vibration wave symbol (〰️) near the throat. Clean flat design, pastel background, NO TEXT. |
| 3 | `r_sound.webp` | /r/ vs /l/ 비교 | Split comparison illustration of a child's mouth side by side. LEFT side: Lips rounded, tongue curled back pointing inward. RIGHT side: Lips flat, tongue tip pushing up against the roof of the mouth. Visual contrast, clean flat design, pastel background, NO TEXT. |
| 4 | `l_sound.webp` | /l/ 정면 (혀끝 잇몸) | Vector illustration of a child's mouth (front view). Tongue tip raised and pushing against the upper gum ridge. Clean flat design, pastel background, NO TEXT. |
| 5 | `f_sound.webp` | /f/ vs /p/ 비교 | Split comparison illustration. LEFT: Upper teeth resting lightly on lower lip with a gentle wind symbol. RIGHT: Both lips pressed tightly together then popping open. Clean flat design, pastel background, NO TEXT. |
| 6 | `v_sound.webp` | /v/ vs /b/ 비교 | Split comparison illustration. LEFT: Upper teeth on lower lip, plus a glowing vibration (〰️) wave at the throat. RIGHT: Both lips pressed tightly together, plus a glowing vibration wave at the throat. Clean flat design, pastel background, NO TEXT. |
| 7 | `z_sound.webp` | /z/ vs /s/ 비교 | Split comparison illustration (front view). LEFT: Teeth almost closed, glowing vibration wave at throat (z). RIGHT: Teeth almost closed, slight wind symbol at the mouth, NO throat vibration (s). Clean flat design, pastel background, NO TEXT. |

### 🟠 Hard (5장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 8 | `vowel_ae.webp` | /æ/ vs /ɛ/ 턱 높이 비교 | Split comparison (side profile of a child). LEFT: Jaw dropped wide open. RIGHT: Jaw dropped only moderately. A visual measuring arrow indicating the different jaw heights. Clean flat design, pastel background, NO TEXT. |
| 9 | `vowel_e.webp` | /ɛ/ vs /ɪ/ 비교 | Split comparison (front view). LEFT: Slight smile shape, jaw barely open (like a grin). RIGHT: Jaw dropped down more openly. Clean flat design, pastel background, NO TEXT. |
| 10 | `vowel_i.webp` | /ɪ/ 정면 (살짝 웃는 모양) | Vector illustration of a child's mouth (front view). Mouth forms a slight, relaxed smile shape, corners pulled slightly back, barely open. Clean flat design, pastel background, NO TEXT. |
| 11 | `vowel_o.webp` | /ɒ/ 정면 (둥근 O) | Vector illustration of a child's mouth (front view). Mouth opened wide in a large, surprised circular 'O' shape. Clean flat design, pastel background, NO TEXT. |
| 12 | `vowel_u.webp` | /ʌ/ 정면 (편안하게) | Vector illustration of a child's mouth (front view). Mouth totally relaxed, barely open, lazy position. Clean flat design, pastel background, NO TEXT. |

### 🟡 Moderate (3장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 13 | `sh_sound.webp` | /ʃ/ vs /s/ 비교 | Split comparison (front view). LEFT: Lips pushed forward in a rounded 'shh' shape. RIGHT: Lips flat and tense like a smile, teeth visible. Clean flat design, pastel background, NO TEXT. |
| 14 | `ch_sound.webp` | /tʃ/ 정면 | Vector illustration of a child's mouth (front view). Lips pushed forward in a rounded shape, accompanied by a small visual "burst" or static popping symbol. Clean flat design, pastel background, NO TEXT. |
| 15 | `vowel_ay.webp` | /eɪ/ 이중모음 연속 프레임 | Sequential illustration with two mouths side-by-side. First mouth: Medium open shape. Second mouth: Transitioned into a wide smile shape. A visual arrow (→) linking them. Clean flat design, pastel background, NO TEXT. |

### 🟢 Easy (2장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 16 | `vowel_ee.webp` | /iː/ vs /ɪ/ 비교 | Split comparison (front view). LEFT: Big, wide, tense smile stretching far outwards. RIGHT: Relaxed, loose, smaller smile. Clean flat design, pastel background, NO TEXT. |
| 17 | `b_p_compare.webp` | /b/ vs /p/ 성대 진동 차이 | Split comparison (front view). LEFT: Both lips closed tight, vibrant glowing symbol at the throat (voiced). RIGHT: Both lips closed tight, NO throat glow, only a small wind symbol at the lips (air). Clean flat design, pastel background, NO TEXT.

---

## 추가 이미지 (선택사항, 나중에)

이중모음 /aɪ/와 /oʊ/는 현재 `pronunciationGuide.ts`에 데이터는 있지만 우선순위가 낮아 나중에 생성해도 됩니다:

| 파일명 | 프롬프트 |
|--------|---------|
| `vowel_ai.webp` | Sequence: Frame 1 wide open → Frame 2 smile/grin. Arrow. Label: "i_e (bike)". |
| `vowel_oh.webp` | Sequence: Frame 1 round O → Frame 2 smaller O. Arrow. Label: "o_e (bone)". |

---

## Antigravity 실행 가이드

### 방법 1: Gemini로 직접 생성

```
1. Gemini에게 위 프롬프트를 하나씩 전달
2. "512x512, white background, educational illustration for kids" 명시
3. 생성된 이미지를 webp로 변환 (또는 직접 webp 요청)
4. public/assets/images/pronunciation/ 에 저장
```

### 방법 2: 배치 스크립트 (미구현)

추후 필요하면 `scripts/generate-pronunciation-images.ts` 스크립트를 작성할 수 있습니다.

---

## 파일명 매핑 (검증용)

`pronunciationGuide.ts`의 `imagePath`와 정확히 일치해야 합니다:

```
/assets/images/pronunciation/th_voiceless.webp   → θ
/assets/images/pronunciation/th_voiced.webp      → ð
/assets/images/pronunciation/r_sound.webp        → r (비교: r vs l)
/assets/images/pronunciation/l_sound.webp        → l
/assets/images/pronunciation/f_sound.webp        → f (비교: f vs p)
/assets/images/pronunciation/v_sound.webp        → v (비교: v vs b)
/assets/images/pronunciation/z_sound.webp        → z (비교: z vs s)
/assets/images/pronunciation/vowel_ae.webp       → æ (비교: æ vs ɛ)
/assets/images/pronunciation/vowel_e.webp        → ɛ (비교: ɛ vs ɪ)
/assets/images/pronunciation/vowel_i.webp        → ɪ
/assets/images/pronunciation/vowel_o.webp        → ɒ
/assets/images/pronunciation/vowel_u.webp        → ʌ
/assets/images/pronunciation/sh_sound.webp       → ʃ (비교: sh vs s)
/assets/images/pronunciation/ch_sound.webp       → tʃ
/assets/images/pronunciation/vowel_ay.webp       → eɪ
/assets/images/pronunciation/vowel_ee.webp       → iː (비교: iː vs ɪ)
/assets/images/pronunciation/b_p_compare.webp    → b (비교: b vs p)
```

---

## 코드 통합 상태

- [x] `src/data/pronunciationGuide.ts` — 20개 음소 데이터 + IMAGE_GENERATION_PROMPTS
- [x] `MouthVisualizer.tsx` — 📸 발음 가이드 버튼 + PronunciationRefPanel 추가
- [x] 이미지 없어도 텍스트(visualKey + visualTip + commonMistake)만으로 작동
- [ ] 이미지 17장 생성 (이 가이드 참조)
- [ ] 이미지 추가 후 브라우저에서 실제 표시 확인
