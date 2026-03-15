# 립싱크 영상 제작 파이프라인 가이드 (최종 확정판)
# Google Flow AI 생성 + Claude 자동 분할 방식

---

## 확정된 워크플로우

```
[Step 1]                    [Step 2]                [Step 3]
Google Flow AI에서       →  Claude에게 영상 +    →  public/assets/video/
8개 단어씩 영상 생성         단어 목록 전달           에 저장 → Antigravity 연동
(직접 생성, 12회)            자동 분할 (92개)
```

---

## 영상 스펙

| 항목 | 값 |
|------|-----|
| 총 영상 수 | **92개** |
| 해상도 | 1280×720 (HD) |
| 파일당 크기 | 87~201KB (평균 136KB) |
| 총 용량 | **12.5MB** |
| 생성 비용 | **$0** (Google Flow AI 무료) |
| Sound Focus 전용 영상 | 없음 (대표 단어로 대체) |

---

## 92개 단어 전체 목록 (12회 생성분)

### 생성 1회차 (8_1): 8개
```
cat, man, map, hat, bed, hen, net, red
```

### 생성 2회차 (8_2): 7개
```
sit, pin, big, dog, hot, fox, hop
```

### 생성 3회차 (8_3): 8개
```
bug, cup, sun, run, cake, name, lake, face
```

### 생성 4회차 (8_4): 8개
```
bike, kite, nine, ride, bone, nose, home, phone
```

### 생성 5회차 (8_5): 8개
```
cube, cute, tune, flute, bee, tree, sea, food
```

### 생성 6회차 (8_6): 9개
```
read, black, clap, flag, blue, ship, shop, chin, chop
```

### 생성 7회차 (8_7): 5개
```
thin, this, whale, when, pig
```

### 생성 8회차 (8_8): 8개
```
sled, brush, crab, drum, frog, swim, snap, step
```

### 생성 9회차 (8_9): 7개
```
snow, chip, whip, ring, sing, bank, pink
```

### 생성 10회차 (8_10): 8개
```
meat, seed, boat, coat, bowl, rain, train, play
```

### 생성 11회차 (8_11): 8개
```
gray, boy, coin, cow, house, car, star, corn
```

### 생성 12회차 (8_12): 8개
```
fork, bird, girl, nurse, burn, book, moon, spoon
```

---

## Step 1: Google Flow AI에서 영상 생성 (직접 수행)

### 1-1. 사전 준비
- Google Flow AI (https://aitestkitchen.withgoogle.com/tools/video-fx) 접속
- 기준 이미지 1장 (한국 초등학생 아이 얼굴, 이전에 생성한 것 사용)

### 1-2. 생성 방법
1. 기준 이미지를 업로드
2. 프롬프트에 단어 목록 입력 (예: "Pronounce these words clearly: cat, man, map, hat, bed, hen, net, red")
3. 8초 영상 생성
4. 다운로드

### 1-3. 프롬프트 템플릿

```
Pronounce these words clearly and slowly, one at a time: 
[단어1], [단어2], [단어3], [단어4], [단어5], [단어6], [단어7], [단어8]
```

### 1-4. 생성 시 주의사항
- 단어 사이에 **충분한 간격**이 있어야 자동 분할이 정확함
- **8개 이하**로 유지 (8초 안에 너무 많으면 빠르게 발음됨)
- 5개 이하일 때는 더 천천히 발음되어 교육용으로 더 좋음
- 발음이 잘못 생성되면 해당 회차만 다시 생성

### 1-5. 파일명 규칙
다운로드한 파일명: `8_1.mp4`, `8_2.mp4`, ... `8_12.mp4`

---

## Step 2: Claude에게 분할 요청

### 2-1. 영상 파일 업로드
생성한 MP4 파일들을 Claude 대화에 업로드.
한번에 여러 개 올려도 됨.

### 2-2. 단어 목록과 함께 분할 요청

Claude에게 아래와 같이 요청:

```
이 영상들을 단어별로 분할해줘.

8_1: cat, man, map, hat, bed, hen, net, red
8_2: sit, pin, big, dog, hot, fox, hop
...
```

### 2-3. 결과물
- Claude가 무음 감지(silence detection)로 단어 경계를 자동 파악
- 단어별 개별 MP4 파일로 분할 (예: cat.mp4, man.mp4, ...)
- ZIP으로 묶어서 다운로드 가능

---

## Step 3: 앱에 배치 + Antigravity 연동

### 3-1. 파일 배치
```
phonics-app/
└── public/assets/video/
    ├── cat.mp4
    ├── man.mp4
    ├── map.mp4
    ├── ... (92개)
    └── whale.mp4
```

### 3-2. Antigravity 프롬프트

```
기존 MouthVisualizer에 AI 립싱크 영상 재생 기능을 추가해줘.
첨부한 MD 파일의 코드를 참고해서:

1. src/data/representativeWords.ts 신규 생성
   — 유닛별 대표 단어 목록 (unit_01~37 전체)
   — hasLipSyncVideo(), getLipSyncVideoPath() 함수
   — Sound Focus 전용 영상은 없음. 대신 해당 유닛의 첫 번째 대표 단어 영상을 재사용

2. MouthVisualizer.tsx 수정
   — 현재 FrontViewPlaceholder 위에 비디오 레이어 추가
   — getLipSyncVideoPath(currentWord)로 영상이 있는지 확인
   — 있으면 <video autoPlay playsInline> 재생, 없으면 기존 SVG 유지
   — 기존 MouthCrossSection(단면도)은 영상 옆에 그대로 유지

3. LessonClient.tsx 수정
   — sound_focus 스텝: 해당 유닛의 첫 번째 대표 단어 영상을 재생
   — blend_tap 스텝에 MouthVisualizer 삽입 (대표 단어만 영상, 나머지 SVG)
   — say_check 스텝은 이미 MouthVisualizer 사용 중이므로 자동 적용됨
   — 그 외 스텝(magic_e, decode_words, word_family, micro_reader, 
     story_reader, exit_ticket)에는 아바타 추가하지 마

영상 파일은 public/assets/video/에 92개 MP4가 이미 들어있어.
영상 없는 단어는 기존 SVG로 정상 동작하도록 폴백 로직을 반드시 넣어줘.
```

### 3-3. representativeWords.ts 코드 (Antigravity에 함께 전달)

```typescript
/** 유닛별 립싱크 영상이 있는 대표 단어 */
export const representativeWords: Record<string, string[]> = {
    // L1~L2 (Unit 01~24)
    'unit_01': ['cat', 'man', 'map', 'hat'],
    'unit_02': ['bed', 'hen', 'net', 'red'],
    'unit_03': ['pig', 'sit', 'pin', 'big'],
    'unit_04': ['dog', 'hot', 'fox', 'hop'],
    'unit_05': ['bug', 'cup', 'sun', 'run'],
    'unit_07': ['cake', 'name', 'lake', 'face'],
    'unit_08': ['bike', 'kite', 'nine', 'ride'],
    'unit_09': ['bone', 'nose', 'home', 'phone'],
    'unit_10': ['cube', 'cute', 'tune', 'flute'],
    'unit_11': ['bee', 'tree', 'sea', 'read'],
    'unit_13': ['black', 'clap', 'flag', 'blue'],
    'unit_17': ['ship', 'shop', 'chin', 'chop'],
    'unit_19': ['thin', 'this', 'whale', 'when'],
    // L3 자음군·이중자음 (Unit 25~30)
    'unit_25': ['black', 'clap', 'flag', 'sled'],
    'unit_26': ['brush', 'crab', 'drum', 'frog'],
    'unit_27': ['swim', 'snap', 'step', 'snow'],
    'unit_28': ['chip', 'ship', 'chop', 'shop'],
    'unit_29': ['thin', 'this', 'whale', 'whip'],
    'unit_30': ['ring', 'sing', 'bank', 'pink'],
    // L4 이중모음·R통제모음 (Unit 31~37)
    'unit_31': ['bee', 'tree', 'meat', 'seed'],
    'unit_32': ['boat', 'coat', 'snow', 'bowl'],
    'unit_33': ['rain', 'train', 'play', 'gray'],
    'unit_34': ['boy', 'coin', 'cow', 'house'],
    'unit_35': ['car', 'star', 'corn', 'fork'],
    'unit_36': ['bird', 'girl', 'nurse', 'burn'],
    'unit_37': ['book', 'moon', 'spoon', 'food'],
};

const allVideoWords = new Set(
    Object.values(representativeWords).flat()
);

/** 이 단어에 립싱크 영상이 있는지 확인 */
export function hasLipSyncVideo(word: string): boolean {
    return allVideoWords.has(word.toLowerCase());
}

/** 영상 경로 반환 (없으면 null) */
export function getLipSyncVideoPath(word: string): string | null {
    if (hasLipSyncVideo(word)) {
        return `/assets/video/${word.toLowerCase()}.mp4`;
    }
    return null;
}

/** Sound Focus용: 유닛의 첫 번째 대표 단어 영상 경로 */
export function getSoundFocusVideoPath(unitId: string): string | null {
    const words = representativeWords[unitId];
    if (words && words.length > 0) {
        return `/assets/video/${words[0].toLowerCase()}.mp4`;
    }
    return null;
}
```

---

## 적용 구간 요약

```
┌─────────────────────────────────────────────┐
│         아이가 레슨을 시작하면...              │
│                                             │
│  Sound Focus:  🎬 유닛 첫 대표 단어 영상      │
│       ↓                                     │
│  Blend & Tap:  대표 단어 → 🎬 영상           │
│                나머지   → 🖼️ 기존 SVG        │
│       ↓                                     │
│  Magic E:      기존 유지 (영상 없음)          │
│       ↓                                     │
│  Decode Words: 🔊 오디오만                    │
│       ↓                                     │
│  Word Family:  기존 유지 (영상 없음)          │
│       ↓                                     │
│  Say & Check:  대표 단어 → 🎬 영상           │
│                나머지   → 🖼️ 기존 SVG        │
│       ↓                                     │
│  나머지 스텝:  🔊 오디오만                    │
└─────────────────────────────────────────────┘
```

---

## 비용 총 정리

| 항목 | 비용 |
|------|------|
| Google Flow AI 영상 12회 생성 | $0 |
| Claude 자동 분할 | $0 |
| Antigravity 코드 통합 | $0 |
| **총합** | **$0** |

---

## 향후 단어 추가 시

새 단어를 추가하고 싶으면:

1. Google Flow AI에서 새 단어 8개짜리 영상 생성
2. Claude에게 "이 영상 분할해줘. 단어: [목록]" 요청
3. 분할된 MP4를 `public/assets/video/`에 추가
4. `representativeWords.ts`에 해당 유닛 단어 추가
