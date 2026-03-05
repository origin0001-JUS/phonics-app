# 파닉스 교재 교수법 & 테크닉 벤치마크 보고서
# Smart Phonics 1~5 + Fast Phonics 교수법 분석
# → 앱의 학습 플로우(UX)와 게임 설계에 직접 반영하기 위한 자료

---

## 핵심 발견: 교재들이 공유하는 3대 교수 원칙

### 원칙 1. Onset-Rime 방식 (글자별 분해 아님!)

**가장 중요한 발견.** Smart Phonics와 Fast Phonics 모두 단어를 개별 글자(c-a-t)로 쪼개지 않고,
**Rime(끝소리 덩어리)을 먼저 가르치고 → Onset(첫소리)을 붙이는 방식**을 사용한다.

```
[교재가 가르치는 방식 - Onset & Rime]

Step 1: 모음+자음 = Rime(끝소리 덩어리)를 먼저 만든다
   a + m → "am"    (이것이 하나의 소리 단위)

Step 2: Onset(첫소리) + Rime = 단어를 만든다
   d + "am" → dam
   h + "am" → ham
   j + "am" → jam
   r + "am" → ram

[일반적으로 생각하는 방식 - Letter-by-Letter]  ← 교재들은 이 방식을 쓰지 않음!
   d - a - m → dam  (글자를 하나씩 합치기)
```

**왜 이 방식이 더 효과적인가:**
- 아이가 "-am"이라는 덩어리를 한번 익히면, 앞에 글자만 바꿔서 4~8개 단어를 한번에 읽을 수 있음
- 개별 글자를 합치는 것보다 인지 부하가 적음 (3단계 → 2단계로 줄어듦)
- Word Family(-at, -an, -am, -ap 등)가 자연스럽게 형성됨

**앱 적용:**
- BlendSlider 게임을 Onset+Rime 방식으로 재설계
- 현재: C | A | T (3칸 슬라이더) → 변경: C | AT (2칸 슬라이더, rime 덩어리)
- 같은 rime으로 onset만 바꾸는 "Word Family Builder" 게임 추가 가능

---

### 원칙 2. 5단계 점진적 상승 (Sound → Rime → Word → Sentence → Story)

Fast Phonics가 가장 명확하게 보여주는 구조이며, Smart Phonics도 동일한 흐름을 따른다.

```
[Fast Phonics 5-Step Flow]

STEP 1: Learn the Sounds (소리 배우기)
  → 알파벳/음소를 이미지와 연결 (A = apple 사진)
  → "Listen and repeat" (듣고 따라하기)
  
STEP 2: Practice the Sounds (소리 연습)
  → Rime 단위로 듣기 연습 (-am, -at, -ap, -ag)
  → 같은 소리 이미지 그룹핑 (ham/jam/ram 그림 중 골라 묶기)
  → 챈트/노래로 리듬감 있게 반복
  
STEP 3: Practice the Words (단어 연습)
  → Onset + Rime 조합 연습 (d + ag = ? → bag)  
  → 라이밍 워드 찾기 (cap의 라임 = map? rag? → map)
  → 이미지 보고 단어 완성하기 (그림 + c__ → cap)
  
STEP 4: Practice the Sentences (문장 연습)
  → 배운 단어를 문장에 넣기 ("This is a ___." → bag)
  → 문장 읽고 그림 매칭 ("This is my cap." ←→ 모자 이미지)
  → Read and Write (읽고 쓰기)
  
STEP 5: Read (스토리 읽기)
  → 배운 단어들로만 구성된 디코더블 스토리 (만화/그림책 형태)
  → 예: "Where Is My Cat?" (cat, bat, map, man, sad 등 Unit 단어만 사용)
  → "Look, listen, and read" (보고, 듣고, 읽기)
```

```
[Smart Phonics의 대응 구조]

A. Listen and repeat    = STEP 1 (소리 도입)
B. Listen and chant     = STEP 2 (리듬 반복)
C. Look and trace       = 쓰기 연습 (SP만의 추가 단계)
D. Trace and write      = 쓰기 심화
Learn More              = STEP 3 (어휘 확장)
Practice                = STEP 3~4 (단어/문장 연습)
Challenge/Test          = 종합 평가
```

**앱 적용:**
- 현재 앱의 유닛 구조를 이 5단계에 맞춰 재정렬
- 각 유닛이 "소리 → 단어 → 문장 → 스토리" 순서를 반드시 따르도록 설계

---

### 원칙 3. 대비(Contrast)를 통한 학습

**모든 교재가 공통으로 사용하는 핵심 테크닉.** 새로운 개념을 가르칠 때 반드시 이전 개념과 직접 비교시킨다.

```
[SP3의 "Read and Compare" 테크닉]

Magic e를 가르칠 때:
  bat  ←→  bake    (단모음 vs 장모음)
  cap  ←→  cape
  kit  ←→  kite
  hop  ←→  hope
  
→ 같은 페이지 하단에 두 단어를 나란히 배치
→ 아이가 "e가 붙으면 소리가 바뀐다"를 시각적으로 즉시 인지
```

```
[SP2의 Word Family 대비]

같은 유닛 안에서 두 개의 rime을 대비:
  Unit 1: -am (dam, ham, jam, ram) vs -ap (cap, lap, map, nap)
  
→ 연습 문제에서 "am인가 ap인가?" 선택하게 함
→ 이미지 보고 올바른 rime을 골라 단어 완성
```

**앱 적용:**
- MinimalPairDiscrimination 게임에 이 대비 원리를 적극 반영
- Magic e 학습 시 반드시 CVC→CVCe 비교 화면을 포함
- 같은 유닛에서 2개의 word family를 대비시키는 구조 유지

---

## 교재별 상세 교수법 분석

### Smart Phonics 1 (알파벳 소리) — 레슨 플로우

**한 유닛의 전체 구조 (6페이지, 약 20~30분):**

| 순서 | 활동명 | 교수법 | 앱 게임 매핑 |
|------|--------|--------|------------|
| 1 | A. Listen and repeat | 글자 + 대표 이미지 1개 + 음성 | 듣고 고르기 (패턴1) |
| 2 | B. Listen and chant | 리듬에 맞춰 "A, A, apple!" 반복 | 챈트 TTS + 리듬 탭 |
| 3 | C. Look and trace | 획순 번호가 표시된 대소문자 따라쓰기 | (앱 미구현 - 향후) |
| 4 | D. Trace and write | 이미지 옆에 글자 쓰기 | (앱 미구현 - 향후) |
| 5 | Learn More: Listen & repeat | 글자당 3개 단어로 확장 (apple, alligator, ant) | 스피드 매칭 (패턴6) |
| 6 | Practice A: Look and color | 올바른 초성 이미지만 색칠 | 듣고 고르기 변형 |
| 7 | Practice B: Listen and circle | 소리 듣고 해당 글자 고르기 | 최소쌍 변별 (패턴2) |

**핵심 테크닉:**
- **"1글자 = 1대표단어 = 1이미지" 고정**: A는 항상 apple과 짝지어짐 → 앵커 효과
- **점진적 확장**: 1개 → 3개 → 디스트랙터 포함 선택
- **다감각**: 듣기(Listen) → 보기(Look) → 쓰기(Trace) → 챈트(Chant)

---

### Smart Phonics 2 (단모음 CVC) — 레슨 플로우

**한 유닛의 전체 구조 (8페이지, 약 25~35분):**

| 순서 | 활동명 | 교수법 | 앱 게임 매핑 |
|------|--------|--------|------------|
| 1 | A. Listen and repeat (Step 1) | Rime 만들기: a+m → am | 블렌딩 슬라이더 (패턴3) |
| 2 | A. Listen and repeat (Step 2) | Onset+Rime: am → d-am, h-am, j-am, r-am | 블렌딩 슬라이더 (패턴3) |
| 3 | B. Listen and chant | "-am" 패밀리 챈트 | 챈트 TTS |
| 4 | Learn (C/D) | 두 번째 word family: a+p → ap → c-ap, l-ap... | 블렌딩 슬라이더 (패턴3) |
| 5 | Practice A: Read and color | 단어 읽고 올바른 이미지에 색칠 (3개 중 1개) | 스피드 매칭 (패턴6) |
| 6 | Practice B: Circle and write | 이미지 보고 rime 선택(-am/-ap) → 단어 완성 | 타일 드래그 철자 (패턴4) |

**핵심 테크닉:**
- **Onset-Rime 2단계 블렌딩**: rime 먼저 → onset 추가 (c-a-t가 아님!)
- **같은 유닛 2개 word family 대비**: -am vs -ap를 한 유닛에서 함께 배움
- **"Circle and write"**: 이미지→rime 선택→단어 쓰기 (3단계 통합 활동)

**앱 적용 구체안:**
```
// 현재 BlendSlider: 3칸 분리
[c] [a] [t] → 밀어서 합치기

// 교재 방식 반영한 BlendSlider: 2단계
[Step 1] [a] + [t] → [at]  (rime 먼저)
[Step 2] [c] + [at] → [cat]  (onset 추가)

// Word Family Builder (신규 게임 아이디어)
rime: [-at] 고정
onset 선택: [b] [c] [h] [m] [r] [s] → 터치하면 bat, cat, hat, mat, rat, sat
```

---

### Smart Phonics 3 (장모음 Magic e) — 레슨 플로우

**한 유닛의 전체 구조 (8페이지, 약 25~35분):**

| 순서 | 활동명 | 교수법 | 앱 게임 매핑 |
|------|--------|--------|------------|
| 1 | A. Listen and repeat (Step 1) | CVC→CVCe 변환: a+k → a+k+e (ake) | 블렌딩 슬라이더 + e 추가 애니메이션 |
| 2 | A. Listen and repeat (Step 2) | Onset+Rime: ake → b-ake, c-ake, l-ake, r-ake | 블렌딩 슬라이더 (패턴3) |
| 3 | **Read and Compare** | CVC vs CVCe 직접 대비: bat↔bake | 최소쌍 변별 (패턴2) |
| 4 | Learn (C/D) | 두 번째 word family: -ape, -ave | 블렌딩 슬라이더 (패턴3) |
| 5 | Practice | 단어 읽기 + 이미지 매칭 + 단어 쓰기 | 스피드 매칭 + 타일 드래그 |

**핵심 테크닉 — "Read and Compare":**

이것이 Magic e 학습의 가장 중요한 순간이다. 교재는 매 유닛 첫 페이지 하단에 항상 CVC↔CVCe 비교를 넣는다:

```
[SP3 페이지 하단 "Read and Compare" 섹션]

🏏 bat     🍰 bake
🧢 cap     🦸 cape  
🪁 kit     🪁 kite
🐇 hop     🤞 hope

→ 두 단어를 나란히 보여주고, 소리 차이를 듣게 함
→ "e가 붙으면 모음 소리가 이름(long vowel)으로 바뀐다"를 체감
```

**앱 적용 구체안:**
```
// Magic e 전용 게임 모드 (신규)
화면에 CVC 단어 표시: "cap"
아래에 silent e 버튼: [e]
아이가 e를 드래그해서 단어 끝에 붙이면:
  "cap" + e → "cape" 
  소리가 /æ/에서 /eɪ/로 변하는 것을 TTS로 재생
  이미지도 모자→망토로 변환

// Read and Compare 퀴즈
"bat"과 "bake" 소리를 듣고, 올바른 이미지를 선택
→ 이 퀴즈가 MinimalPairDiscrimination 게임의 핵심 데이터셋
```

---

### Smart Phonics 4 (자음군/이중자음) — 레슨 플로우

**한 유닛의 전체 구조 (8페이지, 약 25~35분):**

| 순서 | 활동명 | 교수법 | 앱 게임 매핑 |
|------|--------|--------|------------|
| 1 | A. Listen and repeat (Step 1) | 자음+자음 = 블렌드 시각화: b+l → bl | 블렌딩 슬라이더 (패턴3) |
| 2 | A. Listen and repeat (Step 2) | 블렌드 → 단어: bl → black, blue, blanket | 블렌딩 슬라이더 (패턴3) |
| 3 | B. Listen and chant | 블렌드 챈트 | 챈트 TTS |
| 4 | Learn More (C/D) | 같은 유닛 내 관련 블렌드 3개: bl, cl, fl | 워드 패밀리 분류 (패턴5) |
| 5 | Practice | 블렌드별 단어 분류 + 듣고 쓰기 | 워드 패밀리 분류 (패턴5) |

**핵심 테크닉 — "블렌드 합성 시각화":**

```
[SP4 Step 1: 블렌드 형성 과정을 시각적으로 보여줌]

  [b] + [l] → [bl]     (두 타일이 합쳐지는 애니메이션)
  [c] + [l] → [cl]
  [f] + [l] → [fl]

[SP4 Learn More: 블렌드별 단어 확장]

  bl → black, blade, blimp, blue   (블렌드 부분을 진한 색으로 강조)
  cl → clock, clam, clap, cliff
  fl → flag, flame, flap, flute
  
  → "bl"은 파란색, 나머지 글자는 검정 (컬러코딩)
```

**앱 적용 구체안:**
```
// Blend Builder 게임 (L3용 신규)
화면에 개별 자음 타일 2개: [s] [t]
아이가 두 타일을 합치면 → [st] 블렌드 생성 (애니메이션)
그 다음 [st] + [op] → "stop" 완성

// 컬러코딩 원칙
블렌드/다이그래프 = 파란색 (또는 앱 포인트 컬러)
나머지 글자 = 기본 색상
→ 아이가 "어디가 특별한 소리인지" 시각적으로 즉시 인식
```

---

### Fast Phonics — 5-Step 레슨 플로우 (가장 체계적)

**한 유닛의 전체 구조 (8페이지, 약 30~40분):**

| Step | 활동명 | 교수법 상세 | 앱 게임 매핑 |
|------|--------|-----------|------------|
| 1 | Learn the Sounds | 실사 이미지 + 글자 + 음성 (모든 알파벳 한눈에 개관) | 듣고 고르기 (패턴1) |
| 2 | Practice the Sounds | A) 라임 듣고 체크 (an/at/am/ag 중 선택) B) 같은 소리 이미지 묶기 | 최소쌍 변별 (패턴2) |
| 3 | Practice the Words | A) Onset+Rime 조합으로 단어 만들기 (d+ag=? b+ad=?) B) 라이밍 워드 찾기 (cap↔map) | 타일 드래그 철자 (패턴4) + 워드패밀리 분류 (패턴5) |
| 4 | Practice the Sentences | A) 문장 빈칸에 단어 넣기 ("This is a ___") B) 문장 읽고 그림 매칭 C) Read and Write | 문장 빈칸 (패턴7) |
| 5 | Read | 배운 단어로만 구성된 만화 형식 디코더블 스토리 | 미니 스토리 모드 (향후 추가) |

**핵심 테크닉 — Step 3 "Onset+Rime 조합 선택":**

```
[Fast Phonics Step 3A: Listen, circle, and write]

이미지: 🎒 (bag 그림)
선택지:  [d] [ag]    또는    [b] [ad]

→ 아이가 올바른 onset과 rime 조합을 선택: [b] + [ag] = bag
→ 그 다음 빈칸에 단어를 쓰기: b_a_g

이 활동이 앱의 타일 드래그 게임에 가장 직접적으로 매핑됨!
```

**핵심 테크닉 — Step 3B "라이밍 워드 찾기":**

```
[Fast Phonics Step 3B: Listen and write. Then color the rhyming word.]

듣고 쓴 단어: cap
선택지: [map] [rag]
→ "cap과 라임이 같은 것은?" → map (둘 다 -ap)

이 활동은 Word Family 인식을 강화하는 핵심 테크닉!
```

**핵심 테크닉 — Step 5 "디코더블 스토리":**

```
[Fast Phonics Unit 1 Story: "Where Is My Cat?"]

만화 형식으로 구성된 짧은 스토리:
- "Dad can't find his cat. He is sad."
- "He looks at a map."  
- "Hello. Do you see my cat?"
- "Hi. Is that your cat?"
- "No, that is a bat."

→ 모든 단어가 Unit 1에서 배운 short a 패턴 (-at, -ad, -am, -ap, -ag)
→ 만화 그림으로 맥락 제공
→ "Look, listen, and read" (다감각 통합)
```

---

## 교재 간 교수법 비교 종합표

| 교수 요소 | Smart Phonics | Fast Phonics | 앱 반영 우선순위 |
|----------|--------------|-------------|--------------|
| 블렌딩 방식 | Onset-Rime (2단계) | Onset-Rime (2단계) | ★★★★★ 필수 반영 |
| 레슨 흐름 | A→B→C→D→Practice | Step 1→2→3→4→5 | ★★★★★ 필수 반영 |
| 대비 학습 | Read and Compare (CVC↔CVCe) | Rime 선택 (am vs ap) | ★★★★★ 필수 반영 |
| 이미지 스타일 | 카툰 일러스트 | 실사 사진 | ★★★ 앱은 일러스트 채택 |
| 챈트/노래 | 모든 유닛에 챈트 포함 | Step 2에 Sing along | ★★★ TTS 챈트로 대체 |
| 쓰기 연습 | Look and trace (획순 표시) | Read and write | ★★ 향후 추가 |
| 스토리 리딩 | Challenge 섹션 | Step 5 (만화 형식) | ★★★★ V2에서 추가 |
| 컬러코딩 | 포커스 패턴을 색상 강조 | Rime을 색상 강조 | ★★★★★ 필수 반영 |
| Word Family | 유닛당 2개 패밀리 대비 | 유닛당 6개 패턴 | ★★★★★ 필수 반영 |
| Sight Words | 권말 별도 섹션 | 없음 (패턴 중심) | ★★★ 별도 모듈로 |

---

## 앱에 즉시 반영해야 할 교수법 변경 5가지

### 1. BlendSlider를 Onset-Rime 2단계로 변경 (최우선)

```
// Before (현재)
슬라이더: [c] [a] [t] → 3개를 한번에 합침

// After (교재 방식)
Step 1: [a] + [t] → [at]  (rime 형성, 합쳐지는 애니메이션)
Step 2: [c] + [at] → [cat]  (onset 추가, 완성)

// 화면 하단에 같은 rime 단어 목록 표시
-at family: bat, cat, hat, mat, rat, sat
→ onset만 바꾸면 새 단어가 된다는 것을 시각적으로 보여줌
```

### 2. Magic e 전용 인터랙션 추가 (L2 필수)

```
// "e 드래그해서 붙이기" 인터랙션
화면: "cap" [모자 이미지]
하단에 떠다니는 [e] 타일
아이가 e를 cap 끝에 드래그 → "cape" [망토 이미지]
TTS: /kæp/ → /keɪp/ 소리 변화 재생

// "Read and Compare" 퀴즈
두 단어 나란히 표시: "hop" 🐇 vs "hope" 🤞
음성 재생 → 올바른 단어/이미지 터치
```

### 3. 컬러코딩 시스템 도입 (모든 레벨)

```
// 컬러코딩 규칙 (교재 벤치마크 기반)
모음(Vowel): 빨간색 계열 (a, e, i, o, u)
자음(Consonant): 파란색 계열
블렌드/다이그래프: 초록색 계열 (sh, ch, th, bl, cr...)
Silent e: 회색 또는 흐릿한 처리

// 예시: "cake"
[c](파랑) [a](빨강) [k](파랑) [e](회색/흐림)
→ silent e가 소리 안 나는 것을 시각적으로 표현
```

### 4. 레슨 플로우를 5단계로 재구성

```
// 현재 앱의 유닛 구조 (4레슨)
Lesson 1: 소리 변별 → Lesson 2: 블렌딩 → Lesson 3: 철자 → Lesson 4: 의미 연결

// 교재 벤치마크 반영 후 (5단계)
Step 1: 소리 도입 (듣고 고르기 - 음소/rime 수준)
Step 2: Rime 연습 (같은 rime 이미지 묶기, 챈트)
Step 3: 단어 만들기 (Onset+Rime 블렌딩, Word Family)
Step 4: 문장 연습 (빈칸 채우기, 문장-이미지 매칭)
Step 5: 스토리 읽기 (V2에서 추가, 디코더블 리더)
```

### 5. Word Family 대비 구조 유지

```
// 같은 유닛에서 반드시 2개 이상의 word family를 대비
Unit 예시 (Short a):
  Family 1: -am (dam, ham, jam, ram)
  Family 2: -ap (cap, lap, map, nap)
  
  연습 문제: 이미지 보고 -am인지 -ap인지 선택 → 단어 완성
  
// 이렇게 대비해야 아이가 "소리의 차이"를 인지함
// 하나만 배우면 구분 능력이 생기지 않음
```

---

## 시각적 테크닉 & UX 아이디어 (교재에서 추출)

### SP1에서 배울 점: 앵커 이미지
- 모든 글자에 "대표 이미지 1개"를 고정 (A=apple, B=book, C=cat...)
- 이 이미지가 학습 내내 반복되어 "앵커" 역할
- 앱에서도 각 글자의 대표 이미지를 고정하고 일관되게 사용

### SP3에서 배울 점: Silent e의 시각적 표현  
- Silent e는 "소리가 안 나는 글자"라는 것을 시각적으로 표현해야 함
- 교재에서는 e를 작게 쓰거나, 다른 색으로 처리
- 앱에서: e를 회색/반투명으로 처리하거나, "잠자는 표정" 캐릭터로 표현

### SP4에서 배울 점: 블렌드 합성 애니메이션
- 두 글자가 "붙어서 하나의 소리가 되는" 과정을 시각화
- [b] + [l] → 두 타일이 가까워지며 → [bl] (하나의 타일로 합체)
- 앱에서: Lottie 애니메이션으로 타일 합체 효과 구현

### Fast Phonics에서 배울 점: 만화 스토리
- Step 5의 디코더블 스토리가 만화(comic strip) 형식
- 말풍선으로 대화를 넣어 아이가 "읽는 재미"를 느끼게 함
- 앱에서: V2에서 간단한 만화 패널 형식 스토리 모드 추가
