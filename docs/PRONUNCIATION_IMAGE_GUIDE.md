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
- 일관된 아트 스타일: 귀엽고 둥근 "어린이 캐릭터" 벡터 기반 교육용 일러스트 (실사 X, 깔끔한 플랫 디자인)
- 밝고 깨끗한 톤: 솔리드 파스텔 컬러 배경(예: 파스텔 블루, 핑크, 옐로우)
- 음성학(Speech Therapy) 기반 직관성: 
  * 혀의 내부 위치가 중요한 발음(/r/, /l/, 모음 턱 높이)은 반드시 측면 단면도(Sagittal Cross-section view)로 혀의 모양을 시각화.
  * 입술과 이빨이 외부에서 보이는 발음(/f/, /v/, /θ/)은 정면 뷰(Front view)로 시각화하되, 시각적 은유(토끼 이빨, 뱀 등)를 포함.
- 보이스/무성음 구분: 성대 진동은 목 쪽에 '지그재그 진동선(〰️)', 무성음은 입술 앞에 '바람 부는 기호(💨)' 적용
- 직관적인 텍스트 레이블: 비교되는 음소의 알파벳 라벨(예: 'f', 'v', 'r', 'l')을 눈에 띄게 큰 폰트로 반드시 포함.
- 512×512px 웹용 스퀘어

## 참조용 시드(기본) 이미지
- **정면 뷰 시드 이미지:** `c:\Users\origi\.gemini\antigravity\brain\b09a9bf9-3f07-40a2-bac0-258f7e54e1c0\base_style_seed_front_v2_1773738734323.png`
- **측면 단면도 시드 이미지:** `c:\Users\origi\.gemini\antigravity\brain\b09a9bf9-3f07-40a2-bac0-258f7e54e1c0\base_style_seed_sagittal_v2_1773751139509.png`
> **Claude 봇 지시사항**: 이 이미지들을 Gemini/Vertex API의 참조 자료(base image / image-to-image base)로 주입하여, 생성되는 17장의 이미지들이 이 시드 이미지의 질감, 색감, 선 굵기 등과 완벽한 통일감을 이루는 "베리에이션"으로 나오도록 스크립트를 작성하세요.
```

---

## 이미지 목록 (17장)

모든 프롬프트 공통 필수 접두어: **"Vector educational illustration for kids, clean flat design, pastel background. MUST INCLUDE clear, bold alphabet text labels (e.g., 'f', 'v', 'r') directly in the image."**

### 🔴 Very Hard (7장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 1 | `th_voiceless.webp` | /θ/ (thin) 정면 | Front view of a child's mouth blowing a small bubble. Tongue tip is clearly sticking gently between the upper and lower teeth. A gust of wind symbol (💨) coming from the mouth. Text label: 'th' |
| 2 | `th_voiced.webp` | /ð/ (this) 정면 + 성대 진동 | Front view of a child's mouth. Tongue tip sticking gently between the upper and lower teeth. A vibrating bee icon or vibration lines (〰️) explicitly glowing at the throat area. Text label: 'th' |
| 3 | `r_sound.webp` | /r/ vs /l/ 측면 내부도 | Split comparison: Sagittal side-profile cross-sections of a human head. LEFT: Lips rounded, tongue bunched and curled back (not touching the roof). RIGHT: Tongue tip pressing sharply up against the bumpy alveolar ridge behind the top teeth. Text labels: LEFT 'r', RIGHT 'l' |
| 4 | `l_sound.webp` | /l/ 측면 내부도 | Sagittal side-profile cross-section of a human head. Tongue tip pressing sharply up against the bumpy alveolar ridge (roof of the mouth just behind top teeth). Arrow highlighting the tongue-to-ridge contact. Text label: 'l' |
| 5 | `f_sound.webp` | /f/ vs /p/ 비교 | Split comparison front view. LEFT: Child resting top teeth gently on bottom lip (like cute bunny teeth), with wind blowing out. RIGHT: Both lips pressed tightly together. Text labels: LEFT 'f', RIGHT 'p' |
| 6 | `v_sound.webp` | /v/ vs /b/ 비교 | Split comparison front view. LEFT: Child resting top teeth on bottom lip (bunny teeth) + heavy vibration lines at throat. RIGHT: Both lips pressed tightly together + heavy vibration lines at throat. Text labels: LEFT 'v', RIGHT 'b' |
| 7 | `z_sound.webp` | /z/ vs /s/ 뱀소리 비교 | Split comparison front view. LEFT: Teeth closed together, throat vibrating with zigzag lines. RIGHT: Teeth closed together, wind coming out, a small hissing snake icon, NO vibration. Text labels: LEFT 'z', RIGHT 's' |

### 🟠 Hard (5장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 8 | `vowel_ae.webp` | /æ/ vs /ɛ/ 턱 높이 비교 | Split comparison: Sagittal side-profile cross-sections. LEFT: Jaw dropped wide open (2-finger height). RIGHT: Jaw dropped only moderately (1-finger height). Provide a visual measuring block holding the jaws open to contrast the height. Text labels: LEFT 'a', RIGHT 'e' |
| 9 | `vowel_e.webp` | /ɛ/ vs /ɪ/ 정면 비교 | Split comparison front view. LEFT: A slight, relaxed, almost flat horizontal grin (jaw barely open). RIGHT: Jaw dropped open downwards (chin pointing lower). Text labels: LEFT 'i', RIGHT 'e' |
| 10 | `vowel_i.webp` | /ɪ/ 정면 (살짝 웃는 모양) | Front view. Child's mouth forming a slight, relaxed, lazy horizontal grin. Lips barely parted. Text label: 'i' |
| 11 | `vowel_o.webp` | /ɒ/ 정면 (둥근 O) | Front view. Child's mouth opened wide in a tall, surprised oval 'O' shape. Very exaggerated open mouth. Text label: 'o' |
| 12 | `vowel_u.webp` | /ʌ/ 정면 (편안하게) | Front view. Completely relaxed, deadpan, neutral mouth shape barely open. Minimal effort. Text label: 'u' |

### 🟡 Moderate (3장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 13 | `sh_sound.webp` | /ʃ/ vs /s/ 나팔모양 입술 | Split comparison front view. LEFT: Lips pushed far forward into a tight round trumpet/kiss shape ("shh"). RIGHT: Lips pulled flat back into a tense smile showing clenched teeth. Text labels: LEFT 'sh', RIGHT 's' |
| 14 | `ch_sound.webp` | /tʃ/ 정면 + 터짐 | Front view. Lips pushed forward in a round trumpet shape, but with an explosive bursting star graphic (💥) indicating a sudden stop and release of air. Text label: 'ch' |
| 15 | `vowel_ay.webp` | /eɪ/ 이중모음 이동 | Sequential wide image showing a mouth transitioning. First mouth: medium open drop. Arrow pointing to -> Second mouth: wide pulling horizontal smile. Indicates active jaw and lip movement. Text label: 'a_e' |

### 🟢 Easy (2장)

| # | 파일명 | 설명 | 프롬프트 |
|---|--------|------|---------|
| 16 | `vowel_ee.webp` | /iː/ vs /ɪ/ 팽팽한 미소 | Split comparison front view. LEFT: Exaggerated, tight, extremely wide stretched smile revealing teeth ("cheese!"). RIGHT: Soft, lazy, slightly open neutral grin. Text labels: LEFT 'ee', RIGHT 'i' |
| 17 | `b_p_compare.webp` | /b/ vs /p/ 진동 차이 | Split comparison front view. Both sides having lips locked tightly together. LEFT: Glowing zig-zag vibration icon on the throat. RIGHT: No throat vibration, but a bursting puff of wind symbol on the lips. Text labels: LEFT 'b', RIGHT 'p' |

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
