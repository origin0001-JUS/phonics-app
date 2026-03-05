# Phonics 300 앱 업그레이드 — 교재 분석 기반 데이터
# 이 문서는 origin0001-JUS/phonics-app의 코드 구조에 맞춰 작성됨
# Antigravity IDE에서 직접 활용 가능

---

## 📊 현재 앱 분석 결과 (코드 기반)

**아키텍처:** Next.js 16 + TypeScript + Tailwind + Zustand + Dexie.js
**커리큘럼:** 24유닛, ~300단어, 3레벨(Prep/CoreA/CoreB)
**레슨 플로우:** Sound Focus → Blend & Tap → Decode Words → Say & Check → Micro-Reader → Exit Ticket → Results
**데이터 구조:** `WordData { id, word, phonemes[], meaning, imagePath, audioPath }`

### 현재 24유닛 구성
| 유닛 | 레벨 | 주제 | 단어 수 |
|------|------|------|--------|
| 1-5 | CoreA | 단모음 (a, e, i, o, u) | 각 15개 |
| 6 | CoreA | Review 1-5 | (리뷰) |
| 7-10 | CoreA | 장모음 Magic e (a_e, i_e, o_e, u_e) | 각 15개 |
| 11 | CoreA | ee/ea 이중모음 | 15개 |
| 12 | CoreA | Review 7-11 | (리뷰) |
| 13-17 | CoreB | 자음군/다이그래프 (bl/cl/fl, br/cr/dr, gr/pr/tr, sk/sn/sp/st, sh/ch) | 각 15개 |
| 18 | CoreB | Review 13-17 | (리뷰) |
| 19-23 | CoreB | 심화 (th/wh, ar/or, er/ir/ur, 이중모음, Silent e Mix) | 각 15개 |
| 24 | CoreB | Final Review | (리뷰) |

---

## 1. 🎯 교과서 어휘 vs 앱 단어 교차 분석

### 앱에 이미 있는 교과서 핵심 단어 (약 85개)

앱의 300단어 중 교과서 3~4학년에도 등장하는 단어:
```
// 3학년 교과서 단어 중 앱에 이미 있는 것
cat, hat, cap, bag, map, bat        // Unit 1 (Short a)
bed, red, pen, net, ten, leg        // Unit 2 (Short e)
big, pig, sit, six, kid, pin        // Unit 3 (Short i)
dog, hot, box, fox, top, log        // Unit 4 (Short o)
bug, cup, sun, run, fun, bus, cut, nut  // Unit 5 (Short u)
cake, bake, lake, make, name, game, face, race  // Unit 7 (Long a)
bike, like, time, kite, ride, five, nine, line  // Unit 8 (Long i)
bone, home, nose, rose, note, phone  // Unit 9 (Long o)
cute, cube, tune, huge, rule, flute  // Unit 10 (Long u)
bee, see, tree, sea, tea, read, dream  // Unit 11 (ee/ea)
blue, clock, flag                    // Unit 13 (bl/cl/fl)
green, train, truck, grass          // Unit 15 (gr/pr/tr)
snow, star, stop, swim              // Unit 16 (sk/sn/sp/st)
ship, shoe, she, sheep              // Unit 17 (sh/ch)
this, that, thin, three, whale, what, when, where, white  // Unit 19 (th/wh)
car, park, dark, farm, corn, fork   // Unit 20 (ar/or)
girl, bird, nurse, fur, burn, turn  // Unit 21 (er/ir/ur)
boy, toy, cow, town, brown, cloud   // Unit 22 (Diphthongs)
```

### ⚠️ 앱에 없는 교과서 핵심 단어 (추가 필요, 약 80개)

이 단어들은 교과서에서 자주 나오지만 현재 앱 300단어에 포함되지 않은 것들이다.
추가 방식: 기존 유닛의 words 배열에 추가하거나, 별도 "교과서 보너스 단어" 모드 생성

```typescript
// ─── 교과서에서 추출했으나 앱에 없는 단어 (curriculum.ts 포맷) ───

// 3학년 필수 — 기존 유닛에 추가 가능
w("book", "book", ["b", "ʊ", "k"], "책"),          // Unit 4에 추가 또는 별도
w("desk", "desk", ["d", "ɛ", "s", "k"], "책상"),    // Unit 2에 추가
w("pen", "pen", ["p", "ɛ", "n"], "펜"),             // 이미 있음
w("eraser", "eraser", ["ɪ", "r", "eɪ", "z", "ər"], "지우개"),  // 다음절 — L3+ 
w("chair", "chair", ["tʃ", "ɛ", "r"], "의자"),      // Unit 17에 추가 (ch)
w("door", "door", ["d", "ɔːr"], "문"),              // Unit 20에 추가 (or)
w("milk", "milk", ["m", "ɪ", "l", "k"], "우유"),    // Unit 3에 추가
w("bread", "bread", ["b", "r", "ɛ", "d"], "빵"),    // Unit 14에 추가 (br)
w("rice", "rice", ["r", "aɪ", "s"], "밥"),           // Unit 8에 추가 (i_e 패턴)
w("juice", "juice", ["dʒ", "uː", "s"], "주스"),     // Unit 10에 추가
w("water", "water", ["w", "ɔː", "t", "ər"], "물"),   // 다음절
w("fish", "fish", ["f", "ɪ", "ʃ"], "물고기"),        // Unit 17에 추가 (sh)
w("bird", "bird", ["b", "ɜːr", "d"], "새"),          // 이미 있음 (Unit 21)
w("horse", "horse", ["h", "ɔːr", "s"], "말"),        // Unit 20에 추가 (or)
w("mom", "mom", ["m", "ɒ", "m"], "엄마"),           // Unit 4에 추가
w("dad", "dad", ["d", "æ", "d"], "아빠"),           // Unit 1에 추가
w("swim", "swim", ["s", "w", "ɪ", "m"], "수영하다"), // 이미 있음 (Unit 16)
w("jump", "jump", ["dʒ", "ʌ", "m", "p"], "뛰다"),   // Unit 5에 추가
w("sing", "sing", ["s", "ɪ", "ŋ"], "노래하다"),     // Unit 17에 추가 (ng)
w("cook", "cook", ["k", "ʊ", "k"], "요리하다"),     // 별도 oo 유닛에 적합

// 4학년 필수 — 기존 유닛에 추가 가능
w("happy", "happy", ["h", "æ", "p", "iː"], "행복한"),  // 다음절
w("sad", "sad", ["s", "æ", "d"], "슬픈"),            // Unit 1에 추가
w("hot", "hot", ["h", "ɒ", "t"], "뜨거운"),          // 이미 있음 (Unit 4)
w("cold", "cold", ["k", "oʊ", "l", "d"], "추운"),    // Unit 9에 추가
w("shoe", "shoe", ["ʃ", "uː"], "신발"),             // 이미 있음 (Unit 17)
w("hat", "hat", ["h", "æ", "t"], "모자"),            // 이미 있음 (Unit 1)
w("dress", "dress", ["d", "r", "ɛ", "s"], "드레스"), // 이미 있음 (Unit 14)
w("shirt", "shirt", ["ʃ", "ɜːr", "t"], "셔츠"),     // Unit 21에 추가 (ir)
```

### 교과서 커버리지 달성 현황

| 항목 | 현재 | 교재 추가 후 목표 |
|------|------|----------------|
| 3학년 핵심 어휘 120개 중 앱 포함 | ~65개 (54%) | ~100개 (83%) |
| 4학년 핵심 어휘 150개 중 앱 포함 | ~55개 (37%) | ~95개 (63%) |
| 미포함 사유 (다음절 단어) | - | eraser, water, happy 등은 현재 CVC 중심 앱 범위 초과 |

**결론:** 단음절 단어 위주로 약 30~40개를 기존 유닛에 추가하면 교과서 커버리지가 크게 올라간다. 다음절 단어는 V2에서 별도 유닛으로 추가.

---

## 2. 📖 microReading 업그레이드 — 교과서 Target Sentences 반영

현재 앱의 microReading은 단순 디코더블 문장이다. 교과서 주요 표현을 반영하면 "공교육 연계" 마케팅 포인트가 된다.

### 교과서 표현 반영 microReading 제안 (curriculum.ts 직접 교체용)

```typescript
// ─── Unit 1 (Short a) — 3학년 L1 "Hello, ABC!" + L2 "What's This?" 반영 ───
microReading: [
  "A cat.",                        // 기존 유지 (디코더블)
  "A fat cat sat on a mat.",       // 기존 유지 (디코더블)
  "The cat has a bag and a map.",  // 업그레이드: 교과서 어휘 bag, map 활용
],

// ─── Unit 2 (Short e) — 3학년 L3 "Sit Down, Please" 반영 ───
microReading: [
  "A red bed.",                    // 기존 유지
  "A hen and ten eggs.",           // 업그레이드: 교과서 숫자 ten 활용
  "The men set the net by the den.", // 디코더블 확장
],

// ─── Unit 3 (Short i) — 3학년 L5 "I Like Pizza" 반영 ───
microReading: [
  "A big pig.",                    // 기존 유지
  "Six kids sit and dig.",         // 업그레이드: 교과서 어휘 six 활용
  "I like the big pig!",          // 업그레이드: 교과서 "I like ~" 패턴 반영
],

// ─── Unit 4 (Short o) — 3학년 L7 "Is It a Dog?" 반영 ───
microReading: [
  "A hot dog.",                    // 기존 유지
  "Is it a dog? No, it is a fox.", // 업그레이드: 교과서 "Is it a ~?" 패턴
  "The dog got on top of the box.", // 디코더블 확장
],

// ─── Unit 5 (Short u) — 3학년 L9 "Can You Swim?" 반영 ───
microReading: [
  "A bug in a cup.",               // 기존 유지
  "Can the bug run in the sun?",   // 업그레이드: 교과서 "Can you ~?" 패턴
  "The pup had fun on the rug.",   // 디코더블 확장
],

// ─── Unit 7 (Long a) — 4학년 L1 "My Name Is Sally" 반영 ───
microReading: [
  "I bake a cake.",                // 기존 유지
  "My name is Kate.",              // 업그레이드: 교과서 "My name is ~" 패턴
  "Kate came late to the lake.",   // 디코더블 확장 + name 활용
],

// ─── Unit 8 (Long i) — 4학년 L4 "Let's Play Soccer" 반영 ───
microReading: [
  "I ride my bike.",               // 기존 유지
  "I like to ride and fly a kite.", // 업그레이드: 교과서 "I like ~" 심화
  "Five kites in a line!",         // 디코더블 확장
],

// ─── Unit 9 (Long o) — 4학년 L7 "Where Is My Shoe?" 반영 ───
microReading: [
  "A bone at home.",               // 기존 유지
  "Where is the rose?",            // 업그레이드: 교과서 "Where is ~?" 패턴
  "The phone is by the stone.",    // 디코더블 확장
],

// ─── Unit 19 (th/wh) — 4학년 L6 "What Time Is It?" 반영 ───
microReading: [
  "What is this?",                 // 업그레이드: 교과서 "What is this?" 직접 반영
  "Three white whales!",           // 기존 유지
  "When is the whale?",            // 업그레이드: 교과서 when/where 활용
],

// ─── Unit 20 (ar/or) — 4학년 L8 "It's Sunday!" 반영 ───
microReading: [
  "A car in the park.",            // 기존 유지
  "The farm is not far.",          // 기존 유지
  "It is dark. The stars are born.", // 디코더블 확장
],
```

---

## 3. 🎮 Blend & Tap 게임 업그레이드 — Onset-Rime 교수법 반영

### 현재 문제점

현재 `BlendTapStep`은 phonemes 배열을 개별 타일로 표시한다:
```
cat → [k] [æ] [t]  (3개 타일을 순서대로 탭)
```

교재 분석 결과, **Smart Phonics와 Fast Phonics 모두 Onset-Rime 방식**을 사용한다:
```
cat → [k] + [at]  (2단계: onset → rime)
```

### 제안: BlendTapStep에 Onset-Rime 모드 추가

```typescript
// ─── curriculum.ts의 WordData에 rime 정보 추가 ───
export interface WordData {
    id: string;
    word: string;
    phonemes: string[];
    meaning: string;
    imagePath: string;
    audioPath: string;
    onset?: string;    // NEW: 첫소리 ("k" for cat)
    rime?: string;     // NEW: 끝소리 덩어리 ("at" for cat)
    wordFamily?: string; // NEW: word family 그룹 ("-at")
}

// ─── 예시: Unit 1에 onset/rime 추가 ───
w("cat", "cat", ["k", "æ", "t"], "고양이", "c", "at", "-at"),
w("bat", "bat", ["b", "æ", "t"], "박쥐", "b", "at", "-at"),
w("hat", "hat", ["h", "æ", "t"], "모자", "h", "at", "-at"),
w("mat", "mat", ["m", "æ", "t"], "매트", "m", "at", "-at"),
w("rat", "rat", ["r", "æ", "t"], "쥐", "r", "at", "-at"),
w("sat", "sat", ["s", "æ", "t"], "앉았다", "s", "at", "-at"),
w("fan", "fan", ["f", "æ", "n"], "부채", "f", "an", "-an"),
w("van", "van", ["v", "æ", "n"], "밴", "v", "an", "-an"),
w("can", "can", ["k", "æ", "n"], "캔", "c", "an", "-an"),
w("man", "man", ["m", "æ", "n"], "남자", "m", "an", "-an"),
w("map", "map", ["m", "æ", "p"], "지도", "m", "ap", "-ap"),
w("cap", "cap", ["k", "æ", "p"], "모자", "c", "ap", "-ap"),
w("tap", "tap", ["t", "æ", "p"], "수도꼭지", "t", "ap", "-ap"),
w("nap", "nap", ["n", "æ", "p"], "낮잠", "n", "ap", "-ap"),
w("bag", "bag", ["b", "æ", "g"], "가방", "b", "ag", "-ag"),
```

### BlendTapStep 수정 가이드

```typescript
// LessonClient.tsx의 BlendTapStep에서:
// 기존: phonemes 배열을 개별 탭
// 변경: onset + rime 2단계 탭

// Step 1: rime 덩어리 표시 (예: "at")
// Step 2: onset 선택지 제시 (예: c, b, h, m 중 택1)
// Step 3: onset + rime = word 완성 애니메이션

// onset/rime이 없는 단어는 기존 phoneme 모드로 폴백
const hasOnsetRime = word.onset && word.rime;
if (hasOnsetRime) {
  // Onset-Rime 모드
  // 타일 2개: [onset] + [rime]
} else {
  // 기존 Phoneme 모드
  // 타일 n개: [p1] [p2] [p3] ...
}
```

---

## 4. 🔊 Minimal Pairs 데이터 — 새 게임 스텝 또는 Sound Focus 강화용

현재 `SoundFocusStep`은 단순히 소리를 듣고 넘어간다. 교재 분석 결과, 소리 **대비(Contrast)**가 파닉스 학습의 핵심이다.

### Sound Focus에 Minimal Pair 퀴즈 추가 제안

```typescript
// ─── 유닛별 minimal pair 데이터 ───
export const minimalPairsByUnit: Record<string, {sound1: string; sound2: string; pairs: [string, string][]}[]> = {
  
  // Unit 1 (Short a) vs Unit 2 (Short e)
  "unit_01": [
    { sound1: "/æ/ (a)", sound2: "/ɛ/ (e)", 
      pairs: [["bat", "bet"], ["hat", "het"], ["pan", "pen"], ["man", "men"]] }
  ],
  
  // Unit 2 (Short e) vs Unit 3 (Short i)
  "unit_02": [
    { sound1: "/ɛ/ (e)", sound2: "/ɪ/ (i)",
      pairs: [["bed", "bid"], ["pet", "pit"], ["net", "nit"], ["pen", "pin"]] }
  ],
  
  // Unit 3 (Short i) vs Unit 4 (Short o)
  "unit_03": [
    { sound1: "/ɪ/ (i)", sound2: "/ɒ/ (o)",
      pairs: [["dig", "dog"], ["big", "bog"], ["hip", "hop"], ["hit", "hot"]] }
  ],
  
  // Unit 4 (Short o) vs Unit 5 (Short u)
  "unit_04": [
    { sound1: "/ɒ/ (o)", sound2: "/ʌ/ (u)",
      pairs: [["hot", "hut"], ["cop", "cup"], ["pot", "put"], ["dog", "dug"]] }
  ],
  
  // Unit 7 (Long a) — CVC vs CVCe 대비 (교재의 "Read and Compare" 테크닉)
  "unit_07": [
    { sound1: "short a", sound2: "long a (a_e)",
      pairs: [["cap", "cape"], ["tap", "tape"], ["hat", "hate"], ["mat", "mate"], ["can", "cane"]] }
  ],
  
  // Unit 8 (Long i) — CVC vs CVCe 대비
  "unit_08": [
    { sound1: "short i", sound2: "long i (i_e)",
      pairs: [["bit", "bite"], ["hid", "hide"], ["kit", "kite"], ["pin", "pine"], ["dim", "dime"]] }
  ],
  
  // Unit 9 (Long o) — CVC vs CVCe 대비
  "unit_09": [
    { sound1: "short o", sound2: "long o (o_e)",
      pairs: [["hop", "hope"], ["not", "note"], ["rod", "rode"], ["cop", "cope"], ["rob", "robe"]] }
  ],
  
  // Unit 10 (Long u) — CVC vs CVCe 대비
  "unit_10": [
    { sound1: "short u", sound2: "long u (u_e)",
      pairs: [["cub", "cube"], ["tub", "tube"], ["cut", "cute"], ["hug", "huge"]] }
  ],
  
  // Unit 17 (sh/ch) — 다이그래프 대비
  "unit_17": [
    { sound1: "ch", sound2: "sh",
      pairs: [["chip", "ship"], ["chop", "shop"], ["chin", "shin"], ["cheap", "sheep"]] }
  ],
  
  // Unit 19 (th/wh) — 대비
  "unit_19": [
    { sound1: "th (θ)", sound2: "s",
      pairs: [["think", "sink"], ["thick", "sick"], ["thin", "sin"]] }
  ],
};
```

---

## 5. 📐 Word Family 그룹핑 — 유닛 내 패턴 대비 구조

교재에서 한 유닛에 2개 word family를 대비시키는 것이 핵심 테크닉이다.
현재 앱의 유닛은 이미 여러 word family를 포함하고 있지만, **명시적 그룹핑**이 없다.

```typescript
// ─── 유닛별 Word Family 그룹 (Decode Words, Exit Ticket에서 활용 가능) ───
export const wordFamiliesByUnit: Record<string, {family: string; words: string[]}[]> = {
  "unit_01": [
    { family: "-at", words: ["cat", "bat", "hat", "mat", "rat", "sat"] },
    { family: "-an", words: ["fan", "van", "can", "man"] },
    { family: "-ap", words: ["map", "cap", "tap", "nap"] },
    { family: "-ag", words: ["bag"] },
  ],
  "unit_02": [
    { family: "-ed", words: ["bed", "red", "fed"] },
    { family: "-en", words: ["pen", "hen", "ten", "men", "den"] },
    { family: "-et", words: ["net", "set", "wet", "jet"] },
    { family: "-eg", words: ["leg", "peg", "beg"] },
  ],
  "unit_03": [
    { family: "-ig", words: ["big", "pig", "dig", "wig"] },
    { family: "-it", words: ["sit", "hit", "bit"] },
    { family: "-in", words: ["fin", "pin", "bin"] },
    { family: "-ip", words: ["lip", "zip", "tip"] },
  ],
  "unit_04": [
    { family: "-ot", words: ["hot", "pot", "cot", "dot", "got"] },
    { family: "-op", words: ["top", "hop", "mop"] },
    { family: "-og", words: ["dog", "log"] },
    { family: "-ox", words: ["box", "fox"] },
    { family: "-od", words: ["rod", "nod"] },
  ],
  "unit_05": [
    { family: "-ug", words: ["bug", "rug", "jug"] },
    { family: "-un", words: ["sun", "run", "fun", "bun"] },
    { family: "-ut", words: ["nut", "cut", "hut"] },
    { family: "-up", words: ["cup"] },
    { family: "-ub", words: ["tub"] },
    { family: "-ud", words: ["mud"] },
  ],
  "unit_07": [
    { family: "-ake", words: ["cake", "bake", "lake", "make", "take"] },
    { family: "-ame", words: ["name", "game", "came"] },
    { family: "-ate", words: ["gate", "late"] },
    { family: "-ape", words: ["tape", "cape"] },
    { family: "-ace", words: ["face", "race"] },
    { family: "-ave", words: ["wave"] },
  ],
  "unit_08": [
    { family: "-ike", words: ["bike", "like", "hike"] },
    { family: "-ime", words: ["time", "lime", "dime"] },
    { family: "-ite", words: ["kite", "bite"] },
    { family: "-ide", words: ["ride", "hide"] },
    { family: "-ive", words: ["five"] },
    { family: "-ine", words: ["nine", "pine", "vine", "line"] },
  ],
  "unit_09": [
    { family: "-one", words: ["bone", "cone", "phone", "stone"] },
    { family: "-ome", words: ["home"] },
    { family: "-ope", words: ["hope", "rope"] },
    { family: "-ose", words: ["nose", "rose"] },
    { family: "-ole", words: ["hole", "pole"] },
    { family: "-ote", words: ["note", "vote"] },
    { family: "-oke", words: ["joke", "woke"] },
  ],
};
```

---

## 6. 📚 교수법 테크닉 → 레슨 스텝 개선 매핑

### 현재 6-Step vs 교재 5-Step 비교

| 현재 앱 Step | 교재 대응 | 개선 포인트 |
|-------------|----------|-----------|
| 1. Sound Focus | Step 1: Learn the Sounds | ✅ 유사. **Minimal Pair 퀴즈 추가하면 교재 수준** |
| 2. Blend & Tap | Step 2: Practice the Sounds | ⚠️ **Onset-Rime 방식으로 변경 필요** (현재는 개별 phoneme 탭) |
| 3. Decode Words | Step 3: Practice the Words | ✅ 유사. **Word Family 분류 게임 추가하면 교재 수준** |
| 4. Say & Check | (교재에 없음 — 앱의 차별점) | ✅ 유지 (STT는 앱만의 장점) |
| 5. Micro-Reader | Step 4+5: Sentences + Story | ⚠️ **교과서 Target Sentences 반영 + 만화 스토리 추가(V2)** |
| 6. Exit Ticket | (교재의 Test/Challenge) | ✅ 유사 |

### 컬러코딩 시스템 (CSS 수준 적용 제안)

교재에서 공통으로 사용하는 시각적 테크닉:

```typescript
// ─── 컬러코딩 규칙 (TailwindCSS 클래스 매핑) ───
const PHONEME_COLORS = {
  vowel_short: "text-red-500",      // 단모음: 빨간 계열
  vowel_long: "text-rose-600",      // 장모음: 진한 빨간
  consonant: "text-blue-600",       // 자음: 파란 계열
  blend: "text-emerald-600",        // 블렌드/다이그래프: 초록 계열
  silent_e: "text-gray-300",        // Silent e: 회색 (흐림)
  rime: "text-amber-600",           // Rime 덩어리: 주황 계열
};

// BlendTapStep에서 phoneme 타일 색상 적용:
// [c](파랑) + [a](빨강) + [t](파랑) → "cat"
// Magic e 유닛: [c](파랑) [a](빨강) [k](파랑) [e](회색)
```

### Magic e 전용 인터랙션 제안 (Unit 7~10, 23)

```
// 화면에 CVC 단어: "cap" [모자 이미지]
// 하단에 드래그 가능한 [e] 타일
// e를 드래그해서 단어 끝에 놓으면:
//   "cap" → "cape" (소리 + 이미지 변경 애니메이션)
//   TTS: /kæp/ → /keɪp/

// 이 인터랙션은 Sound Focus 또는 Blend & Tap에 삽입
// 교재의 "Read and Compare" 테크닉 직접 구현
```

---

## 7. 📋 Decodable Stories 확장 — Micro-Reader 강화

현재 microReading은 3문장이지만, 교재의 디코더블 스토리는 만화 형식으로 더 길다.
V2에서 확장할 때 사용할 스토리 데이터:

```typescript
// ─── curriculum.ts의 microReading 확장 버전 ───
// 현재: 3문장 (점진적 길이)
// 확장: 5~8문장 (스토리 형태)

const extendedStories: Record<string, string[]> = {
  "unit_01": [
    "A cat sat on a mat.",
    "The cat had a nap.",
    "A rat ran to the mat.",
    "The cat and the rat sat.",
    "The cat has a cap and a bag.",
    "Dad has a map.",
    "The fat cat ran to Dad!",
  ],
  "unit_02": [
    "A hen is in the den.",
    "The hen has ten eggs.",
    "A red bed is wet.",
    "The hen set the net.",
    "The men fed the hen.",
    "The hen is not sad!",
  ],
  "unit_03": [
    "A big pig can dig.",
    "The pig sat in the mud.",
    "Six kids sit and dig.",
    "A wig fell on the pig!",
    "The kid and the pig had fun.",
  ],
  "unit_07": [
    "Kate can bake a cake.",
    "She will take the cake to the lake.",
    "It is late. Kate came to the gate.",
    "Dave gave Kate a cape.",
    "Kate and Dave had a race!",
    "What a great game!",
  ],
  "unit_08": [
    "Mike has a bike.",
    "Mike can ride and hike.",
    "He hid the kite by the pine.",
    "It is time to fly the kite!",
    "Five kites in a line.",
    "Mike had the time of his life!",
  ],
};
```

---

## 8. ✅ 구현 우선순위 체크리스트

| 순위 | 작업 | 영향 범위 | 난이도 |
|------|------|---------|-------|
| 1 | microReading에 교과서 Target Sentences 반영 | curriculum.ts 수정만 | ⭐ 쉬움 |
| 2 | 교과서 핵심 단어 30~40개 기존 유닛에 추가 | curriculum.ts + TTS 생성 | ⭐⭐ 보통 |
| 3 | WordData에 onset/rime/wordFamily 필드 추가 | curriculum.ts 타입 확장 | ⭐⭐ 보통 |
| 4 | Sound Focus에 Minimal Pair 퀴즈 삽입 | LessonClient.tsx 수정 | ⭐⭐⭐ 보통 |
| 5 | Blend & Tap에 Onset-Rime 2단계 모드 추가 | LessonClient.tsx 수정 | ⭐⭐⭐ 보통 |
| 6 | 컬러코딩 시스템 (phoneme 타일 색상) | LessonClient.tsx CSS | ⭐⭐ 보통 |
| 7 | Magic e 드래그 인터랙션 (Unit 7~10) | 새 컴포넌트 | ⭐⭐⭐⭐ 어려움 |
| 8 | Decodable Stories 확장 (V2) | curriculum.ts + 새 화면 | ⭐⭐⭐⭐ 어려움 |
