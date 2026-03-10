# 발음 시각화 업그레이드 가이드
# 여우 SVG → 사람 입모양(실사풍 일러스트) + 혀 위치 단면도

---

## 현재 문제점

VisemeAvatar.tsx의 여우(Foxy) 캐릭터:
- 입 모양 4가지(idle/open/wide/round)만 **랜덤** 순환
- 실제 phoneme과 매핑 안 됨
- 혀 위치 전혀 안 보임
- 교육적 가치 거의 0

---

## 업그레이드 설계: "듀얼 뷰" 시스템

### 화면 구성

```
┌─────────────────────────────┐
│                             │
│   ┌───────┐   ┌───────┐    │
│   │ 정면  │   │ 단면  │    │
│   │ 입모양│   │ 혀위치│    │
│   │ (lips)│   │(tongue│    │
│   │       │   │ cross)│    │
│   └───────┘   └───────┘    │
│                             │
│      /æ/ → "cat"           │
│   "입을 크게 벌리고         │
│    혀를 낮추세요"           │
│                             │
└─────────────────────────────┘
```

**정면 뷰:** 입술·이빨이 보이는 실사풍 일러스트 (AI 생성)
**단면 뷰:** 입 옆면을 잘라본 그림 — 혀 위치, 공기 흐름 표시 (SVG)
**텍스트 안내:** 한국어로 간단한 발음 팁

---

## Step 1: Phoneme → Viseme 매핑 (44개 → 15개)

영어 44개 음소를 시각적으로 구분 가능한 15개 입 모양(viseme)으로 그룹핑.
앱에서 사용하는 phoneme이 어떤 viseme에 해당하는지 매핑하면 된다.

```typescript
// data/visemeMap.ts

export type VisemeId = 
    | 'rest'          // 0: 입 다문 상태
    | 'bilabial'      // 1: 두 입술 닫힘 (p, b, m)
    | 'labiodental'   // 2: 아랫입술+윗니 (f, v)
    | 'dental'        // 3: 혀끝이 윗니 사이 (th: θ, ð)
    | 'alveolar_stop' // 4: 혀끝이 잇몸 (t, d, n, l)
    | 'alveolar_fric' // 5: 혀끝 잇몸 마찰 (s, z)
    | 'postalveolar'  // 6: 혀 앞부분 올림 (sh, ch, j, zh)
    | 'velar'         // 7: 혀 뒷부분 올림 (k, g, ng)
    | 'glottal'       // 8: 목구멍 (h)
    | 'open_front'    // 9: 크게 벌림 (æ: cat, a)
    | 'mid_front'     // 10: 중간 벌림 (ɛ: bed, e)
    | 'close_front'   // 11: 좁게 벌림+입꼬리 (iː: bee, ɪ: bit)
    | 'open_back'     // 12: 크게 벌림+둥글게 (ɒ: hot, ɑː: car)
    | 'close_back'    // 13: 좁게+둥글게 (uː: blue, ʊ: book)
    | 'mid_central'   // 14: 중간 (ʌ: cup, ə: about)
    ;

// phoneme → viseme 매핑
export const phonemeToViseme: Record<string, VisemeId> = {
    // ─── 자음 ───
    'p': 'bilabial',       'b': 'bilabial',       'm': 'bilabial',
    'f': 'labiodental',    'v': 'labiodental',
    'θ': 'dental',         'ð': 'dental',         'th': 'dental',
    't': 'alveolar_stop',  'd': 'alveolar_stop',  'n': 'alveolar_stop',  'l': 'alveolar_stop',
    's': 'alveolar_fric',  'z': 'alveolar_fric',
    'ʃ': 'postalveolar',   'ʒ': 'postalveolar',   'tʃ': 'postalveolar',  'dʒ': 'postalveolar',
    'sh': 'postalveolar',  'ch': 'postalveolar',
    'k': 'velar',          'g': 'velar',           'ŋ': 'velar',          'ng': 'velar',
    'h': 'glottal',        'w': 'close_back',      'r': 'postalveolar',
    'j': 'close_front',    'y': 'close_front',

    // ─── 단모음 ───
    'æ': 'open_front',     'a': 'open_front',      // cat, bat
    'ɛ': 'mid_front',      'e': 'mid_front',       // bed, pet
    'ɪ': 'close_front',    'i': 'close_front',     // bit, sit
    'ɒ': 'open_back',      'o': 'open_back',       // hot, dog
    'ʌ': 'mid_central',    'u': 'mid_central',     // cup, but
    'ʊ': 'close_back',                              // book, put

    // ─── 장모음 ───
    'iː': 'close_front',                            // bee, see
    'eɪ': 'mid_front',                              // cake, day
    'aɪ': 'open_front',                             // bike, my
    'oʊ': 'close_back',                             // home, go
    'uː': 'close_back',                             // blue, moon
    'juː': 'close_front',                           // cute, use
    'ɔɪ': 'open_back',                              // boy, coin
    'aʊ': 'open_front',                             // cow, out

    // ─── R-통제 ───
    'ɑːr': 'open_back',                             // car, star
    'ɔːr': 'open_back',                             // for, corn
    'ɜːr': 'mid_central',                           // bird, her
};

// 한국어 발음 안내
export const visemeGuide: Record<VisemeId, { 
    lipDesc: string;      // 입술 설명
    tongueDesc: string;   // 혀 설명
    tipKo: string;        // 한국어 팁
}> = {
    'rest':           { lipDesc: '입 다문 상태', tongueDesc: '혀 편안히', tipKo: '편하게 입을 다물어요' },
    'bilabial':       { lipDesc: '두 입술을 붙였다 뗌', tongueDesc: '혀는 가만히', tipKo: '입술을 꽉 붙였다 "빠" 하고 떼요' },
    'labiodental':    { lipDesc: '윗니가 아랫입술에 닿음', tongueDesc: '혀는 가만히', tipKo: '윗니를 아랫입술에 살짝 대요' },
    'dental':         { lipDesc: '입을 살짝 벌림', tongueDesc: '혀끝이 윗니 사이로 나옴', tipKo: '혀를 윗니 사이로 살짝 내밀어요' },
    'alveolar_stop':  { lipDesc: '입을 살짝 벌림', tongueDesc: '혀끝이 윗잇몸에 닿음', tipKo: '혀끝을 윗잇몸에 톡 대요' },
    'alveolar_fric':  { lipDesc: '이빨 살짝 보이게', tongueDesc: '혀끝이 윗잇몸 가까이', tipKo: '이빨 사이로 "쓰" 바람을 내요' },
    'postalveolar':   { lipDesc: '입술을 앞으로 약간 모음', tongueDesc: '혀 앞부분을 올림', tipKo: '입술을 동그랗게 하고 "쉬" 해요' },
    'velar':          { lipDesc: '입을 벌림', tongueDesc: '혀 뒷부분이 올라감', tipKo: '혀 뒤쪽을 올려서 "크" 해요' },
    'glottal':        { lipDesc: '입을 벌림', tongueDesc: '혀는 가만히, 목에서 소리', tipKo: '입을 벌리고 "하" 숨을 내쉬어요' },
    'open_front':     { lipDesc: '입을 크게 벌림', tongueDesc: '혀를 낮추고 앞에', tipKo: '입을 크~게 벌려요! "애"' },
    'mid_front':      { lipDesc: '입을 중간 정도 벌림', tongueDesc: '혀가 중간 높이', tipKo: '입을 반쯤 벌려요. "에"' },
    'close_front':    { lipDesc: '입꼬리를 옆으로 당김', tongueDesc: '혀를 높이 올리고 앞에', tipKo: '웃는 입 모양! "이"' },
    'open_back':      { lipDesc: '입을 크게 벌리고 둥글게', tongueDesc: '혀를 낮추고 뒤에', tipKo: '입을 동그랗게 크게! "아"' },
    'close_back':     { lipDesc: '입을 둥글게 오므림', tongueDesc: '혀를 뒤로 올림', tipKo: '입을 쭈~욱 모아요! "우"' },
    'mid_central':    { lipDesc: '입을 살짝 벌림 (자연스럽게)', tongueDesc: '혀가 중간 위치', tipKo: '편하게 "어" 해요' },
};
```

---

## Step 2: 이미지 에셋 준비 — AI 생성 추천

### 필요한 이미지 세트

**정면 뷰 (15장):** 15개 viseme별 입모양 정면 사진/일러스트
**단면 뷰 (15장):** 15개 viseme별 혀 위치 단면도

총 30장 = 한 세트. AI로 생성하면 일관된 스타일 유지 가능.

### AI 이미지 생성 프롬프트 (Midjourney/DALL-E)

#### 정면 뷰 프롬프트

```
-- 기본 프롬프트 (스타일 고정) --
Educational illustration of a human mouth and lower face, 
front view, realistic illustration style, clean white background,
soft lighting, showing teeth and lips clearly,
designed for children's phonics education app,
warm friendly tone, not scary, high detail on lip and teeth position.
No full face, just mouth area from nose to chin.

-- viseme별 변형 --
bilabial (p/b/m): "lips pressed firmly together, closed mouth"
labiodental (f/v): "upper teeth touching lower lip gently"
dental (th): "tongue tip visible between upper and lower teeth"
alveolar_stop (t/d): "mouth slightly open, tongue tip touching upper gum ridge"
open_front (æ): "mouth wide open, tongue low and flat, jaw dropped"
close_front (i): "lips spread in smile position, small mouth opening"
close_back (u): "lips rounded and pushed forward, small circular opening"
open_back (ɒ): "mouth open wide and rounded"
```

#### 단면 뷰 프롬프트

```
-- 기본 프롬프트 --
Medical illustration style cross-section diagram of human mouth,
sagittal view (side cut), showing: upper palate, lower jaw, 
tongue position highlighted in pink/red, teeth, lips, 
nasal cavity lightly shown, airflow direction with small arrows,
clean vector style, white background, 
labeled for children's education (simple, not scary).

-- viseme별 변형 --
dental (th): "tongue tip protruding between upper and lower front teeth, 
airflow arrow going over tongue"
alveolar_stop (t/d): "tongue tip pressed against alveolar ridge (gum ridge behind upper teeth)"
velar (k/g): "back of tongue raised to touch soft palate (velum)"
open_front (æ): "tongue low and forward, jaw wide open, large mouth cavity"
```

### 대안: SVG로 직접 그리기 (비용 $0)

AI 생성이 어려우면, 단면도는 SVG로 충분히 표현 가능하다.
아래는 Antigravity에게 던질 수 있는 SVG 코드 예시:

```typescript
// 단면도 SVG 컴포넌트 예시
function MouthCrossSection({ viseme }: { viseme: VisemeId }) {
    // 입천장, 잇몸, 이빨은 고정
    // 혀 위치(path)와 입 벌림(하악 위치)만 viseme에 따라 변경
    
    const tonguePositions: Record<VisemeId, string> = {
        'rest':           'M 40,70 Q 60,65 80,70 Q 90,75 95,80',
        'bilabial':       'M 40,70 Q 60,65 80,70 Q 90,75 95,80',
        'dental':         'M 40,70 Q 55,60 70,55 L 30,50',  // 혀끝이 이빨 사이로
        'alveolar_stop':  'M 40,70 Q 55,55 65,45 Q 75,65 95,80',  // 혀끝이 잇몸에
        'velar':          'M 40,75 Q 50,75 60,75 Q 75,50 90,45',  // 혀 뒤가 올라감
        'open_front':     'M 40,85 Q 60,80 80,85 Q 90,87 95,90',  // 혀가 낮게
        'close_front':    'M 40,55 Q 55,48 70,50 Q 80,55 95,65',  // 혀가 높게 앞으로
        'close_back':     'M 40,70 Q 55,70 65,65 Q 80,50 95,55',  // 혀가 높게 뒤로
        // ... 나머지 viseme
    };
    
    const jawDrop: Record<VisemeId, number> = {
        'rest': 0, 'bilabial': 0, 'dental': 5,
        'alveolar_stop': 8, 'open_front': 25, 'mid_front': 15,
        'close_front': 5, 'open_back': 22, 'close_back': 5,
        'mid_central': 12, 'velar': 15, 'glottal': 18,
        'labiodental': 3, 'alveolar_fric': 5, 'postalveolar': 8,
    };

    return (
        <svg viewBox="0 0 120 120" className="w-full h-full">
            {/* 윗입술 + 코 */}
            <path d="M 10,45 Q 15,42 25,43 L 30,45" fill="#f4a4a0" stroke="#d48080" />
            
            {/* 입천장 (고정) */}
            <path d="M 30,45 Q 50,30 80,33 Q 95,35 100,40" 
                  fill="none" stroke="#d48080" strokeWidth="2" />
            
            {/* 윗니 (고정) */}
            <rect x="28" y="43" width="8" height="10" rx="1" fill="white" stroke="#ccc" />
            
            {/* 아랫턱 (jawDrop에 따라 이동) */}
            <g transform={`translate(0, ${jawDrop[viseme]})`}>
                {/* 아랫니 */}
                <rect x="28" y="60" width="8" height="8" rx="1" fill="white" stroke="#ccc" />
                {/* 아랫입술 */}
                <path d="M 10,70 Q 20,72 30,68" fill="#f4a4a0" stroke="#d48080" />
            </g>
            
            {/* 혀 (viseme에 따라 변경) */}
            <path d={tonguePositions[viseme] || tonguePositions['rest']} 
                  fill="#e85d75" stroke="#c04060" strokeWidth="1.5"
                  className="transition-all duration-300 ease-in-out" />
            
            {/* 공기 흐름 화살표 (선택적) */}
            {viseme === 'dental' && (
                <path d="M 35,50 L 15,48" fill="none" stroke="#4dabf7" 
                      strokeWidth="1" markerEnd="url(#arrow)" strokeDasharray="3,2" />
            )}
        </svg>
    );
}
```

---

## Step 3: 컴포넌트 구현

### 새 컴포넌트: MouthVisualizer

기존 VisemeAvatar.tsx를 대체하는 새 컴포넌트.

```typescript
// components/MouthVisualizer.tsx

'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { phonemeToViseme, visemeGuide, type VisemeId } from '@/data/visemeMap';

interface MouthVisualizerProps {
    // 현재 발음 중인 phoneme (없으면 rest)
    currentPhoneme?: string;
    // 현재 단어 전체 (표시용)
    currentWord?: string;
    // 말하는 중인지
    isSpeaking?: boolean;
    // 컴팩트 모드 (작게 표시)
    compact?: boolean;
}

export default function MouthVisualizer({ 
    currentPhoneme, currentWord, isSpeaking, compact 
}: MouthVisualizerProps) {
    
    const viseme: VisemeId = currentPhoneme 
        ? (phonemeToViseme[currentPhoneme] || 'rest') 
        : 'rest';
    
    const guide = visemeGuide[viseme];
    const size = compact ? 'w-20 h-20' : 'w-32 h-32';

    return (
        <div className="flex flex-col items-center gap-3">
            {/* 듀얼 뷰 */}
            <div className="flex gap-4 items-center">
                {/* 정면 뷰: 입모양 이미지 */}
                <motion.div 
                    className={`${size} rounded-2xl overflow-hidden border-3 border-white shadow-lg bg-white`}
                    animate={{ scale: isSpeaking ? [1, 1.02, 1] : 1 }}
                    transition={{ repeat: isSpeaking ? Infinity : 0, duration: 0.5 }}
                >
                    {/* AI 생성 이미지 또는 SVG */}
                    <img 
                        src={`/assets/mouth/front_${viseme}.png`}
                        alt={guide.lipDesc}
                        className="w-full h-full object-cover"
                    />
                </motion.div>

                {/* 단면 뷰: 혀 위치 SVG */}
                <motion.div 
                    className={`${size} rounded-2xl overflow-hidden border-3 border-white shadow-lg bg-slate-50`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <MouthCrossSection viseme={viseme} />
                </motion.div>
            </div>

            {/* Phoneme 표시 */}
            {currentPhoneme && (
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 font-black text-lg px-3 py-1 rounded-full">
                        /{currentPhoneme}/
                    </span>
                    {currentWord && (
                        <span className="text-slate-500 font-bold text-sm">
                            in "{currentWord}"
                        </span>
                    )}
                </div>
            )}

            {/* 한국어 발음 팁 */}
            <AnimatePresence mode="wait">
                <motion.p 
                    key={viseme}
                    className="text-sm font-bold text-slate-600 text-center bg-amber-50 px-4 py-2 rounded-xl border-2 border-amber-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    💡 {guide.tipKo}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
```

### 기존 코드에서 교체

```typescript
// Say & Check 스텝에서 VisemeAvatar → MouthVisualizer 교체

// Before:
<VisemeAvatar isSpeaking={isSpeaking} />

// After:
<MouthVisualizer 
    currentPhoneme={currentPhoneme}  // 현재 발음 중인 phoneme
    currentWord={word.word}
    isSpeaking={isSpeaking}
/>
```

### phoneme 순차 재생 로직

단어를 발음할 때 phoneme을 순차적으로 보여주려면:

```typescript
// 단어의 phonemes를 순서대로 표시하는 훅
function usePhonemeSequence(phonemes: string[], isSpeaking: boolean) {
    const [currentIndex, setCurrentIndex] = useState(-1);
    
    useEffect(() => {
        if (!isSpeaking) {
            setCurrentIndex(-1);
            return;
        }
        
        let i = 0;
        setCurrentIndex(0);
        
        const interval = setInterval(() => {
            i++;
            if (i >= phonemes.length) {
                clearInterval(interval);
                setCurrentIndex(-1);
            } else {
                setCurrentIndex(i);
            }
        }, 400); // 0.4초 간격으로 phoneme 전환
        
        return () => clearInterval(interval);
    }, [isSpeaking, phonemes]);
    
    return currentIndex >= 0 ? phonemes[currentIndex] : undefined;
}

// 사용:
const currentPhoneme = usePhonemeSequence(word.phonemes, isSpeaking);
```

---

## Step 4: 이미지 에셋 생성 전략

### 옵션 A: AI 일러스트 생성 (추천)

**Midjourney 또는 DALL-E로 정면 뷰 15장 생성:**

1. 스타일 통일을 위해 하나의 "기준 이미지"를 먼저 생성
2. 그 스타일을 참조하여 15개 viseme별 변형 생성
3. 배경 제거 후 PNG로 저장 (512x512)

**비용:** DALL-E 무료 크레딧 또는 Midjourney $10/월 1개월

**단면도는 SVG로 직접 구현** (위 코드 참고) — 비용 $0

### 옵션 B: 무료 에셋 활용

**Sound Wall / Mouth Formation 카드:** 교육용으로 무료 배포되는 입모양 사진이 많음
- Teachers Pay Teachers에서 무료 다운로드 가능한 mouth formation cards
- 단, 상업적 라이선스 확인 필요

### 옵션 C: 직접 촬영

스마트폰으로 15개 viseme별 입모양을 촬영하여 사용
- 가장 사실적이지만, 일관된 품질 유지가 어려움

---

## Step 5: 파일 구조

```
public/assets/mouth/
├── front_rest.png
├── front_bilabial.png
├── front_labiodental.png
├── front_dental.png
├── front_alveolar_stop.png
├── front_alveolar_fric.png
├── front_postalveolar.png
├── front_velar.png
├── front_glottal.png
├── front_open_front.png
├── front_mid_front.png
├── front_close_front.png
├── front_open_back.png
├── front_close_back.png
└── front_mid_central.png

src/
├── data/visemeMap.ts          # phoneme→viseme 매핑 + 한국어 가이드
├── components/MouthVisualizer.tsx  # 듀얼 뷰 컴포넌트
└── components/MouthCrossSection.tsx  # 단면도 SVG 컴포넌트
```

---

## Step 6: 구현 우선순위

| 순위 | 작업 | 난이도 | 비용 |
|------|------|-------|------|
| 1 | `visemeMap.ts` 생성 (매핑 테이블 + 한국어 가이드) | ⭐ | $0 |
| 2 | `MouthCrossSection.tsx` SVG 단면도 컴포넌트 | ⭐⭐ | $0 |
| 3 | 정면 뷰 이미지 15장 AI 생성 | ⭐⭐ | $0~$10 |
| 4 | `MouthVisualizer.tsx` 통합 컴포넌트 | ⭐⭐ | $0 |
| 5 | phoneme 순차 재생 훅 연결 | ⭐⭐ | $0 |
| 6 | 기존 VisemeAvatar 교체 | ⭐ | $0 |

---

## Antigravity 프롬프트

```
VisemeAvatar.tsx(여우 캐릭터)를 삭제하고, 
사람 입모양 기반의 새 발음 시각화 시스템으로 교체해줘.
첨부한 MD 파일의 코드를 참고해서:

1. src/data/visemeMap.ts 생성 — 15개 viseme 정의, phoneme→viseme 매핑, 한국어 발음 팁
2. src/components/MouthCrossSection.tsx 생성 — 입 단면도 SVG (혀 위치 표시)
3. src/components/MouthVisualizer.tsx 생성 — 정면 뷰 + 단면 뷰 듀얼 화면
4. Say & Check 스텝에서 VisemeAvatar 대신 MouthVisualizer 사용
5. usePhonemeSequence 훅으로 phoneme 순차 표시

정면 뷰 이미지는 아직 없으니 일단 viseme 이름을 텍스트로 표시하는
플레이스홀더를 넣어줘. 이미지는 나중에 추가할게.
```
