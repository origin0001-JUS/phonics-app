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
- 아이 입/얼굴 클로즈업 일러스트 (실사 X, 만화풍 O)
- 밝고 깨끗한 파스텔 색상
- 화살표/하이라이트로 핵심 포인트 강조
- 텍스트 레이블은 영문 + 간단 기호
- 비교 이미지: 좌우 분할 (LEFT | RIGHT)
- 연속 프레임: 2~3컷 가로 배치 (Frame 1 → Frame 2)
- 512×512px, 투명 또는 흰 배경
```

---

## 이미지 목록 (17장)

### 🔴 Very Hard (7장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 1 | `th_voiceless.webp` | /θ/ (thin) 정면 | Close-up of a child's mouth (front view) showing the TH sound /θ/. The tongue tip is clearly visible between the upper and lower front teeth. Bright, clean, educational illustration style. Soft pastel colors. Arrow or highlight pointing to the tongue tip between teeth. Text label: "th" — 512x512px, white background. |
| 2 | `th_voiced.webp` | /ð/ (this) 정면 + 성대 진동 | Same as th_voiceless but with a small vibration icon near the throat to indicate voicing. Label: "th (voiced)" |
| 3 | `r_sound.webp` | /r/ vs /l/ 비교 | Split comparison illustration showing two mouth positions side by side: LEFT: "R" sound — lips slightly rounded, tongue curled back not touching anything. RIGHT: "L" sound — lips flat, tongue tip clearly touching the ridge behind upper teeth. Labels: "R" and "L" with arrows. Educational kids style, 512x512px. |
| 4 | `l_sound.webp` | /l/ 정면 (혀끝 잇몸) | Child's mouth front view for /l/. Tongue tip clearly touching the alveolar ridge (just behind upper teeth). Mouth slightly open so the tongue position is visible. Arrow pointing to tongue tip touching the ridge. Label: "L". Kids educational style, 512x512px, white background. |
| 5 | `f_sound.webp` | /f/ vs /p/ 비교 | Split comparison illustration: LEFT: "F" sound — upper teeth resting on lower lip, air flowing out. RIGHT: "P" sound — both lips pressed together. Labels and arrows. Kids educational style, 512x512px. |
| 6 | `v_sound.webp` | /v/ vs /b/ 비교 | Split comparison illustration: LEFT: "V" sound — upper teeth on lower lip + vibration icon at throat. RIGHT: "B" sound — both lips pressed together + vibration icon at throat. Labels and arrows. Kids educational style, 512x512px. |
| 7 | `z_sound.webp` | /z/ vs /s/ 비교 | Child's mouth front view for /z/: Teeth almost closed (same as "s"), with vibration icon at throat. Split with "s" for comparison: same mouth, different throat. Labels: "z (zoo) [voice]" and "s (sun) [air]". Kids educational style, 512x512px. |

### 🟠 Hard (5장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 8 | `vowel_ae.webp` | /æ/ vs /ɛ/ 턱 높이 비교 | Split comparison illustration of jaw opening: LEFT: /æ/ (cat) — jaw dropped wide, "2 fingers" space, corners slightly pulled back. RIGHT: /ɛ/ (bed) — jaw dropped medium, "1 finger" space. Side profile view showing different jaw heights. Labels: "a (cat)" and "e (bed)". Kids educational style, 512x512px. |
| 9 | `vowel_e.webp` | /ɛ/ vs /ɪ/ 비교 | Split comparison illustration: LEFT: /ɪ/ (sit) — slight smile shape, jaw barely open (grin!). RIGHT: /ɛ/ (bed) — jaw drops down (chin moves!). Front view. Labels: "i (sit)" and "e (bed)". Mnemonic text: "I = grin, E = chin". Kids educational style, 512x512px. |
| 10 | `vowel_i.webp` | /ɪ/ 정면 (살짝 웃는 모양) | Child's mouth front view for /ɪ/ (sit). Slight smile shape with corners of lips slightly pulled back. Jaw barely open. Relaxed, not tense. Label: "i (sit)". Kids educational style, 512x512px, white background. |
| 11 | `vowel_o.webp` | /ɒ/ 정면 (둥근 O) | Child's mouth front view for /ɒ/ (hot): Mouth open in a round O shape, wider than Korean "오". Label: "o (hot)" — like a surprised "오!" but bigger. Kids educational style, 512x512px. |
| 12 | `vowel_u.webp` | /ʌ/ 정면 (편안하게) | Child's mouth front view for /ʌ/ (cup): Mouth barely open, very relaxed, like a lazy "어". Label: "u (cup)" — the most relaxed sound! Kids educational style, 512x512px. |

### 🟡 Moderate (3장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 13 | `sh_sound.webp` | /ʃ/ vs /s/ 비교 | Split comparison: LEFT: "sh" — lips rounded and pushed forward (like blowing a kiss). RIGHT: "s" — lips flat, teeth visible, like a hissing snake. Labels and arrows. Kids educational style, 512x512px. |
| 14 | `ch_sound.webp` | /tʃ/ 정면 | Child's mouth front view for /tʃ/: Lips rounded like "sh" but with a burst of air. Small "explosion" graphic to show the initial stop. Label: "ch (chin)". Kids educational style, 512x512px. |
| 15 | `vowel_ay.webp` | /eɪ/ 이중모음 연속 프레임 | Sequence showing mouth shape change for /eɪ/: Frame 1: medium open → Frame 2: smile shape. Arrow showing the glide movement. Label: "a_e (cake)" — your mouth moves! Kids educational style, 512x512px. |

### 🟢 Easy (2장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 16 | `vowel_ee.webp` | /iː/ vs /ɪ/ 비교 | Split comparison: LEFT: /iː/ (bee) — wide smile, tense lips, "cheese!". RIGHT: /ɪ/ (bit) — relaxed, shorter, loose smile. Labels: "ee (bee) 길고 팽팽!" and "i (bit) 짧고 편안". Kids educational style, 512x512px. |
| 17 | `b_p_compare.webp` | /b/ vs /p/ 성대 진동 차이 | Split comparison with throat highlight: LEFT: "b" — lips together, throat vibration icon ✓. RIGHT: "p" — lips together, throat vibration icon ✗. Same mouth shape! Different voice. Labels: "b (bug) [voice]" and "p (pig) [air]". Kids educational style, 512x512px. |

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
