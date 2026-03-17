# Plan: 발음 참조 이미지 V2 (리서치 기반 재설계)

> Feature: `pronunciation-image-v2`
> Created: 2026-03-17
> Status: Plan

---

## 1. 문제 정의

### 현재 이미지의 문제점

Imagen 4.0으로 생성된 17장의 발음 이미지가 다음과 같은 문제를 가지고 있음:

| 문제 | 상세 | 해당 이미지 |
|------|------|------------|
| **혀 위치가 보이지 않음** | 정면도만으로는 R/L, S/SH 등의 혀 위치 차이를 전달할 수 없음 | r_sound, l_sound, sh_sound |
| **비교 이미지가 불명확** | 좌우 분할이 무엇을 보여주려는지 직관적이지 않음 | vowel_ae, vowel_e, z_sound |
| **프롬프트 아티팩트** | "512xE", "512x512" 등 불필요한 텍스트가 이미지에 삽입됨 | r_sound, f_sound, vowel_ay |
| **아이 친화적이지 않음** | 사실적 입술 일러스트가 아이들에게 낯설고 추상적 | 전체 |
| **성대 진동 표현 부재** | voiced/voiceless 구분이 시각적으로 약함 | th_voiced, v_sound, b_p_compare |

---

## 2. 리서치 결과 요약

### 교육자료에서 효과적인 3가지 시각적 접근법

```
┌─────────────────┬───────────────────┬──────────────────────┐
│  정면도 (Front)  │ 시상단면도 (Sagittal) │  듀얼 뷰 (Dual)    │
│                 │                   │                      │
│  👄 입술/치아    │  🫁 혀 위치/기류  │  👄+🫁 양쪽 동시    │
│  ────────────   │  ────────────     │  ────────────        │
│ ✅ TH, F/P, 모음│ ✅ R/L, S/SH     │ ✅ 복잡한 자음       │
│ ❌ 혀 위치 불가  │ ❌ 입술 모양 불가  │ ⚠️ 디자인 복잡      │
└─────────────────┴───────────────────┴──────────────────────┘
```

### 핵심 발견

1. **시상단면도(Sagittal cross-section)가 필수적인 소리**: R/L, S/SH, CH — 혀 위치가 정면에서 보이지 않기 때문
2. **정면도만으로 충분한 소리**: TH(혀 돌출), F/P(이/입술), 모음(턱 벌림/입술 모양)
3. **성대 진동 표현**: 입 모양이 아닌 별도의 시각 메타포로 표현 (목에 손 + 진동선, 스위치 ON/OFF)
4. **아이 친화적 핵심**: 해부학적 정확성보다 **과장된 단순한 형태**가 효과적
5. **비교 레이아웃**: 두 소리를 나란히 보여줄 때 **동일한 시점(viewpoint)**에서 **하나의 차이점만** 강조

### 우수 참고자료 출처

| 출처 | 특징 | 적용할 점 |
|------|------|----------|
| **Rachel's English** | 실사 사진 + 시상단면도 병행 | 듀얼 뷰 접근법 |
| **Mommy Speech Therapy** | 아이용 단순 입모양 카드 | 카드형 레이아웃, 밝은 색상 |
| **Adventures in Speech Pathology** | 정면+측면 큐카드 | 큐카드 형식 |
| **Iowa Phonetics (Univ.)** | 애니메이션 시상단면도 | 교과서적 정확한 혀 위치 |
| **Donald Potter Facial Diagrams** | 클래식 교육용 정면도 | 단순화된 정면 입 일러스트 |

---

## 3. 새로운 이미지 설계 전략

### 3.1 뷰 타입 매핑

각 이미지에 가장 효과적인 시점을 배정:

| # | 파일명 | 소리 | **최적 뷰** | 이유 |
|---|--------|------|------------|------|
| 1 | th_voiceless.webp | /θ/ | **정면도** | 혀끝이 이빨 사이로 보임 |
| 2 | th_voiced.webp | /ð/ | **정면도 + 목 진동 아이콘** | 입 모양은 동일, 진동만 다름 |
| 3 | r_sound.webp | /r/ vs /l/ | **시상단면도 비교** | 혀 위치 차이가 핵심 (정면 불가) |
| 4 | l_sound.webp | /l/ | **시상단면도** | 혀끝→잇몸릉 접촉 (정면 불가) |
| 5 | f_sound.webp | /f/ vs /p/ | **정면도 비교** | 이빨/입술 차이 (외부에서 보임) |
| 6 | v_sound.webp | /v/ vs /b/ | **정면도 비교 + 목 진동** | f/p와 동일 구조 + 둘 다 유성음 |
| 7 | z_sound.webp | /z/ vs /s/ | **정면도 비교 + 목 진동** | 입 모양 동일, 진동 차이 |
| 8 | vowel_ae.webp | /æ/ vs /ɛ/ | **정면도 비교** | 턱 벌림 차이 (외부에서 보임) |
| 9 | vowel_e.webp | /ɛ/ vs /ɪ/ | **정면도 비교** | 턱 벌림 차이 |
| 10 | vowel_i.webp | /ɪ/ | **정면도** | 입술 모양 (외부에서 보임) |
| 11 | vowel_o.webp | /ɒ/ | **정면도** | 둥근 O 모양 (외부에서 보임) |
| 12 | vowel_u.webp | /ʌ/ | **정면도** | 편안한 입 (외부에서 보임) |
| 13 | sh_sound.webp | /ʃ/ vs /s/ | **정면도 + 시상단면도 소형** | 입술 모양(정면) + 혀 위치(단면) |
| 14 | ch_sound.webp | /tʃ/ | **정면도 + 파열 기호** | 입술 돌출 + 파열음 |
| 15 | vowel_ay.webp | /eɪ/ | **연속 정면도 2프레임** | 이중모음 변화 |
| 16 | vowel_ee.webp | /iː/ vs /ɪ/ | **정면도 비교** | 미소 강도 차이 |
| 17 | b_p_compare.webp | /b/ vs /p/ | **정면도 + 목 ON/OFF 아이콘** | 입 모양 동일, 진동 차이 |

### 3.2 통일 스타일 가이드 (V2)

```
아트 스타일:
  - 카툰 스타일 어린이 캐릭터 얼굴/입 (8-10세 아이)
  - 완전한 얼굴 하반부 (코끝~턱) — 입만 덩그러니 X
  - 단순한 선과 면 (해부학적 디테일 최소화)
  - 밝고 균일한 파스텔 컬러 배경 (단색)

색상 코딩 (일관성):
  - 혀: 핫핑크 (#FF6B9D) — 혀 위치를 즉시 식별
  - 이빨: 순백 (#FFFFFF)
  - 입술: 연분홍 (#FFB4B4)
  - 기류 화살표: 하늘색 (#87CEEB) 또는 연회색
  - 진동선: 주황색 (#FF8C42) 파형
  - 진동 없음: 회색 점선

시상단면도 전용 스타일:
  - 머리 윤곽은 연한 베이지 실루엣
  - 구강 내부는 약간 어두운 배경
  - 혀는 핫핑크로 두드러지게
  - 기류 방향 화살표 필수
  - 치아/잇몸릉/연구개 위치 간략 표시

텍스트 라벨:
  - 각 소리의 알파벳 라벨 필수 (큰 볼드체)
  - 라벨 위치: 이미지 하단 또는 해당 영역 바로 아래
  - 폰트: 둥근 산세리프 (아이 친화적)
  - 배경에 프롬프트 아티팩트 텍스트 절대 금지

비교 이미지 레이아웃:
  - 정확히 반으로 분할 (수직선)
  - 동일한 시점/스케일/배경색
  - 차이점만 다르게 (하나의 변수만 변경)
  - 각 쪽에 명확한 라벨 (예: "R" | "L")
```

### 3.3 참고 이미지 수집 전략

Imagen 4.0에 **참고 이미지를 직접 전달할 수 없으므로**, 대안 전략:

**접근법: 초정밀 프롬프트 엔지니어링**

```
1. 각 이미지별로 교육 자료에서 검증된 시각적 요소를 분석
2. 해부학적으로 정확한 위치 설명을 프롬프트에 상세히 기술
3. "참고 스타일" 키워드 추가 (예: "speech therapy cue card style")
4. Imagen 4.0 대신 Gemini 2.5 Flash Image를 사용 (텍스트 이해력이 더 높아 복잡한 프롬프트 해석 가능)
5. 실패 시 fal.ai의 flux-pro 모델을 대안으로 사용
```

---

## 4. 개선된 프롬프트 (17장)

### 공통 프리픽스 V2

```
"Children's educational speech therapy cue card illustration. Clean cartoon style with a cute child character face (lower half: nose tip to chin). Solid pastel color background. Bright, cheerful, simple lines. NO watermark, NO extra text besides labels."
```

### Very Hard (7장)

#### 1. th_voiceless.webp — /θ/ (thin)
```
뷰: 정면도
프롬프트: [PREFIX] Front view of a child's lower face. Mouth slightly open. The tongue tip is clearly poking out between the upper and lower teeth — this is the key feature, make it very visible. A light blue breeze/wind arrow flowing out from the tongue. Large bold letter label "th" at the bottom center. Pastel mint green background.
핵심 요소: 혀끝 돌출 (과장), 바람 화살표, th 라벨
```

#### 2. th_voiced.webp — /ð/ (this)
```
뷰: 정면도 + 목 진동 표시
프롬프트: [PREFIX] Front view of a child's lower face. Mouth slightly open. The tongue tip is clearly poking out between the upper and lower teeth (same as voiceless th). At the throat area, show orange zigzag vibration waves (〰️) indicating vocal cord vibration. Large bold label "th" at the bottom with a small vibration icon. Pastel lavender background.
핵심 요소: 혀끝 돌출 + 목 진동선(주황), 배경색으로 voiceless와 구분
```

#### 3. r_sound.webp — /r/ vs /l/ 비교
```
뷰: 시상단면도 비교 (좌우 분할)
프롬프트: [PREFIX] Split comparison with a vertical dividing line. BOTH sides show a sagittal cross-section (side cutaway view) of a child's head showing the inside of the mouth.

LEFT "R": The tongue is curled backward (retroflex), tongue tip pointing up and back, NOT touching anything. Lips are slightly rounded. Hot pink tongue color. Blue airflow arrow going over the curled tongue and out the mouth.

RIGHT "L": The tongue tip is raised and firmly pressing against the alveolar ridge (the bumpy area just behind the upper front teeth). The sides of the tongue are lowered allowing air to flow around. Hot pink tongue color. Blue airflow arrows going around the sides of the tongue.

Large bold labels "R" on the left and "L" on the right at the bottom. Pastel yellow background.
핵심 요소: 시상단면도, 혀 위치 차이(R=뒤로 말림, L=잇몸릉 접촉), 기류 방향
```

#### 4. l_sound.webp — /l/ 단독
```
뷰: 시상단면도
프롬프트: [PREFIX] Sagittal cross-section (side cutaway view) of a child's head showing the inside of the mouth. The tongue tip (hot pink) is raised and pressing firmly against the alveolar ridge (the bumpy gum area just behind the upper front teeth). The sides of the tongue are lowered. Blue airflow arrows show air flowing around BOTH sides of the tongue. The mouth is slightly open. Large bold label "L" at the bottom. Pastel sky blue background.
핵심 요소: 시상단면도, 혀끝→잇몸릉 접촉, 양측 기류
```

#### 5. f_sound.webp — /f/ vs /p/ 비교
```
뷰: 정면도 비교
프롬프트: [PREFIX] Split comparison with a vertical line. Both sides show front view of a child's lower face.

LEFT "F": Upper front teeth resting gently on the lower lip. A light blue breeze arrow flowing out between the teeth and lip. The key visual: teeth biting the lip.

RIGHT "P": Both lips pressed tightly together (no teeth visible on lips). A small blue "puff" burst symbol in front of the closed lips showing a sudden release of air.

Large bold labels "F" on the left and "P" on the right. Pastel peach background.
핵심 요소: F=이빨이 아랫입술 위, P=양 입술 닫힘, 기류 차이(연속 vs 파열)
```

#### 6. v_sound.webp — /v/ vs /b/ 비교
```
뷰: 정면도 비교 + 둘 다 목 진동 표시
프롬프트: [PREFIX] Split comparison with a vertical line. Both sides show front view of a child's lower face. Both have orange vibration waves at the throat (both are voiced).

LEFT "V": Upper front teeth resting on the lower lip (same mouth shape as F). Vibration waves at throat.

RIGHT "B": Both lips pressed tightly together (same mouth shape as P). Vibration waves at throat.

Both have the SAME throat vibration but DIFFERENT mouth shapes. Large bold labels "V" on the left and "B" on the right. Pastel coral background.
핵심 요소: V=F와 같은 입모양+진동, B=P와 같은 입모양+진동
```

#### 7. z_sound.webp — /z/ vs /s/ 비교
```
뷰: 정면도 비교 + 진동 ON/OFF
프롬프트: [PREFIX] Split comparison with a vertical line. Both sides show front view of a child's lower face with IDENTICAL mouth positions (teeth close together, narrow gap, slight smile shape).

LEFT "Z": Orange vibration waves at the throat (voiced). A small sound wave icon.

RIGHT "S": NO vibration at the throat (show a gray "X" or "off" symbol at the throat). A light blue wind arrow at the mouth only.

The mouth shape is EXACTLY the same on both sides — the only difference is throat vibration. Large bold labels "Z" on the left and "S" on the right. Pastel light green background.
핵심 요소: 입 모양 완전 동일, 목 진동 유무만 다름 (핵심 교훈)
```

### Hard (5장)

#### 8. vowel_ae.webp — /æ/ (cat) vs /ɛ/ (bed) 비교
```
뷰: 정면도 비교 (턱 벌림 강조)
프롬프트: [PREFIX] Split comparison with a vertical line. Both sides show front view of a child's lower face.

LEFT "A" (as in cat): Mouth opened VERY wide, jaw dropped far down. Tongue flat and low. Big opening.

RIGHT "E" (as in bed): Mouth opened only MODERATELY, jaw dropped about halfway. Smaller opening than the left.

Add a small double-headed arrow on each side showing jaw height — the left arrow is much longer than the right arrow, visually showing the difference. Large bold labels "A" and "E". Pastel warm yellow background.
핵심 요소: 턱 벌림 높이 차이 (화살표로 시각화)
```

#### 9. vowel_e.webp — /ɛ/ (bed) vs /ɪ/ (sit) 비교
```
뷰: 정면도 비교
프롬프트: [PREFIX] Split comparison. Both sides show front view.

LEFT "I" (as in sit): Mouth barely open, relaxed small smile, corners slightly back.

RIGHT "E" (as in bed): Mouth more open than left, jaw dropped more noticeably.

Height comparison arrows on each side. Large bold labels "I" and "E". Pastel light pink background.
핵심 요소: I는 거의 안 벌림, E는 좀 더 벌림
```

#### 10. vowel_i.webp — /ɪ/ (sit)
```
뷰: 정면도
프롬프트: [PREFIX] Front view. Child's mouth in a relaxed, gentle smile. Corners of lips pulled slightly back. Mouth barely open — just a small gap between lips. Very relaxed, natural position. Large bold label "I" at the bottom. Pastel lavender background.
```

#### 11. vowel_o.webp — /ɒ/ (hot)
```
뷰: 정면도
프롬프트: [PREFIX] Front view. Child's mouth opened wide in a big, perfectly round circle "O" shape. Lips pushed forward and rounded. Jaw dropped. The mouth opening looks like a perfect circle. Large bold label "O" at the bottom. Pastel sky blue background.
```

#### 12. vowel_u.webp — /ʌ/ (cup)
```
뷰: 정면도
프롬프트: [PREFIX] Front view. Child's mouth in a totally relaxed, lazy position. Barely open. No tension in lips. Like the mouth when not speaking at all — neutral and loose. Large bold label "U" at the bottom. Pastel cream background.
```

### Moderate (3장)

#### 13. sh_sound.webp — /ʃ/ vs /s/ 비교
```
뷰: 정면도 비교 (+ 소형 시상단면도 인셋)
프롬프트: [PREFIX] Split comparison.

LEFT "SH": Child's lips pushed forward and rounded (like making a kiss shape). A "shhh" quiet finger gesture icon nearby. Lips form a round opening.

RIGHT "S": Child's lips pulled back flat, like a tense smile. Teeth visible through the gap. A thin blue airflow arrow coming straight out.

The key difference is lip shape: SH = rounded/protruded, S = flat/spread. Large bold labels "SH" and "S". Pastel mint background.
핵심 요소: 입술 모양 차이 — SH=둥글게 내밀기, S=납작하게 당기기
```

#### 14. ch_sound.webp — /tʃ/ (church)
```
뷰: 정면도
프롬프트: [PREFIX] Front view. Child's lips pushed forward in a rounded shape (similar to SH but more explosive). A small cartoon "pop!" burst star symbol in front of the mouth showing the explosive release. Large bold label "CH" at the bottom. Pastel orange background.
핵심 요소: 입술 돌출 + 파열 기호
```

#### 15. vowel_ay.webp — /eɪ/ 이중모음
```
뷰: 연속 2프레임 정면도
프롬프트: [PREFIX] Two child mouth illustrations side by side with a large arrow (→) between them showing a sequence/transition.

FRAME 1 (left): Mouth open medium-wide (like the "E" vowel).
FRAME 2 (right): Mouth transitioned into a wide smile shape (like the "I" vowel — lips pulled back).

The arrow shows the mouth MOVES from position 1 to position 2 during this diphthong. Large bold label "A_E" at the top. Pastel light yellow background.
핵심 요소: 두 입 모양의 전환 (화살표로 이동 방향 표시)
```

### Easy (2장)

#### 16. vowel_ee.webp — /iː/ vs /ɪ/ 비교
```
뷰: 정면도 비교
프롬프트: [PREFIX] Split comparison.

LEFT "EE" (as in see): Big, wide, TENSE smile. Lips stretched far back. Strong effort visible. Exaggerated wide grin.

RIGHT "I" (as in sit): Small, relaxed, loose smile. Much less effort. Gentle and lazy.

The difference is TENSION — left is tight/stretched, right is loose/relaxed. Large bold labels "EE" and "I". Pastel light blue background.
핵심 요소: 미소 강도/긴장감 차이
```

#### 17. b_p_compare.webp — /b/ vs /p/ 성대 진동
```
뷰: 정면도 비교 + 목 진동 ON/OFF 아이콘
프롬프트: [PREFIX] Split comparison. Both sides show EXACTLY the same mouth position: both lips pressed tightly together.

LEFT "B": A bright orange glowing circle at the throat with vibration zigzag waves — voice ON. Like a light switch turned ON.

RIGHT "P": A gray circle at the throat with an "X" or "OFF" mark — voice OFF. Only a small blue air puff at the lips.

The mouth is IDENTICAL on both sides. The ONLY difference is the throat. Large bold labels "B" and "P". Pastel purple background.
핵심 요소: 입 모양 완전 동일, 목 진동 ON/OFF만 다름
```

---

## 5. 실행 계획

### Phase 1: 프롬프트 검증 (3장 샘플)
1. 대표 이미지 3장 선 생성 (th_voiceless, r_sound, b_p_compare)
2. 모델 비교: Imagen 4.0 vs Gemini 2.5 Flash Image
3. 사용자 검수 후 방향 확정

### Phase 2: 전체 17장 재생성
1. 확정된 모델+프롬프트로 17장 일괄 생성
2. 프롬프트 아티팩트 없는지 확인
3. 스크립트 `generate-pronunciation-images.ts` 업데이트

### Phase 3: 검증
1. `pronunciationGuide.ts`의 `imagePath`와 파일명 일치 확인
2. 브라우저에서 MouthVisualizer 내 실제 표시 테스트
3. 사용자 최종 검수

### 예상 소요
- Phase 1: 샘플 3장 생성 + 검수 (~5분)
- Phase 2: 17장 생성 (~3분)
- Phase 3: 검증 (~2분)

---

## 6. 리스크

| 리스크 | 대응 |
|--------|------|
| Imagen 4.0이 시상단면도를 잘 그리지 못할 수 있음 | Gemini 2.5 Flash Image 또는 fal.ai flux-pro로 대체 |
| 텍스트 라벨이 깨지거나 아티팩트 포함 | 프롬프트에서 "512", "square" 등 숫자/크기 표현 제거, 라벨 위치 명시 |
| 비교 이미지에서 차이점이 불명확할 수 있음 | 하나의 변수만 변경하는 원칙 엄수, 색상/화살표 보조 |
