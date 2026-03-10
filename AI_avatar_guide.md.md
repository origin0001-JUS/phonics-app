# AI 아바타 립싱크 제작 가이드 (v2 반영 수정판)
# phonics-app 현재 상태 기반 — 2026.03.10 업데이트

---

## 현재 앱 상태 확인 결과

코드 확인 결과 **이전 제안의 대부분이 이미 구현 완료**된 상태:

| 항목 | 상태 |
|------|:---:|
| VisemeAvatar (여우) | ✅ 삭제됨 |
| MouthVisualizer (듀얼 뷰) | ✅ 구현됨 (SVG 플레이스홀더 상태) |
| MouthCrossSection (단면도) | ✅ 구현됨 |
| visemeMap.ts (15개 viseme 매핑) | ✅ 구현됨 |
| usePhonemeSequence 훅 | ✅ 구현됨 |
| WordData에 onset/rime/textbookTags | ✅ 추가됨 |
| L3/L4 커리큘럼 (unit_25~37, 13유닛) | ✅ 구현됨 |
| MagicEStep, WordFamilyBuilder, StoryReaderStep | ✅ 구현됨 |
| AudioVisualizer (오디오 시각화) | ✅ 구현됨 |
| sentenceFrames, sightWords, decodableReaders | ✅ 구현됨 |
| TTS 오디오 432개 | ✅ 생성됨 |
| 단어 이미지 235개 | ✅ 생성됨 |
| 교사 페이지 (/teacher) | ✅ 구현됨 |

**남은 작업: MouthVisualizer의 SVG 플레이스홀더를 AI 립싱크 영상으로 업그레이드**

---

## 현재 레슨 플로우 (v2 업데이트 반영)

```
1. Sound Focus        — 소리 도입
2. Blend & Tap        — 블렌딩
3. Magic E            — Magic e 전용 (L2 유닛만) ← NEW
4. Decode Words       — 뜻 매칭
5. Word Family        — 워드 패밀리 빌더 ← NEW
6. Say & Check        — 따라하기
7. Micro-Reader       — 문장 읽기
8. Story Reader       — 디코더블 스토리 ← NEW
9. Exit Ticket        — 퀴즈
10. Results           — 결과
```

---

## 적용 범위 (핵심 3개 스텝)

| 스텝 | 아바타 영상 | 나머지 처리 |
|------|:---:|---|
| **Sound Focus** | ✅ 영상 | - |
| Blend & Tap | ✅ 영상 (대표 단어) | 기존 MouthVisualizer SVG |
| Magic E | ❌ | CVC→CVCe 비교가 목적, 아바타 불필요 |
| Decode Words | ❌ | 오디오만 |
| Word Family | ❌ | Onset 조합이 목적, 아바타 불필요 |
| **Say & Check** | ✅ 영상 (대표 단어) | 기존 MouthVisualizer SVG |
| Micro-Reader | ❌ | 오디오만 |
| Story Reader | ❌ | 오디오만 |
| Exit Ticket | ❌ | 오디오만 |

---

## 유닛별 대표 단어 목록 (전 37유닛)

### L1~L2 (Unit 1~24, 기존)

```
Unit 01 Short a:     cat, man, map, hat         (4개)
Unit 02 Short e:     bed, hen, net, red         (4개)
Unit 03 Short i:     pig, sit, pin, big         (4개)
Unit 04 Short o:     dog, hot, fox, hop         (4개)
Unit 05 Short u:     bug, cup, sun, run         (4개)
Unit 07 Long a_e:    cake, name, lake, face     (4개)
Unit 08 Long i_e:    bike, kite, nine, ride     (4개)
Unit 09 Long o_e:    bone, nose, home, phone    (4개)
Unit 10 Long u_e:    cube, cute, tune, flute    (4개)
Unit 11 ee/ea:       bee, tree, sea, read       (4개)
Unit 13 bl/cl/fl:    black, clap, flag, blue    (4개)
Unit 17 sh/ch:       ship, shop, chin, chop     (4개)
Unit 19 th/wh:       thin, this, whale, when    (4개)
```
리뷰 유닛(06, 12, 18, 24): 영상 불필요

### L3: 자음군·이중자음 (Unit 25~30) ← NEW

```
Unit 25 l-blends:    black, clap, flag, sled    (4개)
Unit 26 r-blends:    brush, crab, drum, frog    (4개)
Unit 27 s-blends:    swim, snap, step, snow     (4개)
Unit 28 ch/sh:       chip, ship, chop, shop     (4개)
Unit 29 th/wh:       thin, this, whale, whip    (4개)
Unit 30 ng/nk:       ring, sing, bank, pink     (4개)
```

### L4: 이중모음·R통제모음 (Unit 31~37) ← NEW

```
Unit 31 ea/ee:       bee, tree, meat, seed      (4개)
Unit 32 oa/ow:       boat, coat, snow, bowl     (4개)
Unit 33 ai/ay:       rain, train, play, gray    (4개)
Unit 34 Diphthongs:  boy, coin, cow, house      (4개)
Unit 35 ar/or:       car, star, corn, fork      (4개)
Unit 36 er/ir/ur:    bird, girl, nurse, burn    (4개)
Unit 37 oo:          book, moon, spoon, food    (4개)
```

### Sound Focus 전용 (개별 소리 소개)

```
sound_01: "The sound ah, as in cat"         (/æ/)
sound_02: "The sound eh, as in bed"         (/ɛ/)
sound_03: "The sound ih, as in sit"         (/ɪ/)
sound_04: "The sound oh, as in hot"         (/ɒ/)
sound_05: "The sound uh, as in cup"         (/ʌ/)
sound_06: "The sound ay, as in cake"        (/eɪ/)
sound_07: "The sound eye, as in bike"       (/aɪ/)
sound_08: "The sound oh, as in bone"        (/oʊ/)
sound_09: "The sound sh, as in ship"        (/ʃ/)
sound_10: "The sound th, as in thin"        (/θ/)
sound_11: "The sound ch, as in chip"        (/tʃ/)
sound_12: "L blends: bl, cl, fl"            (L3)
sound_13: "R blends: br, cr, dr"            (L3)
sound_14: "The sound ee, as in bee"         (/iː/) (L4)
sound_15: "R controlled: ar, as in car"     (/ɑːr/) (L4)
```

### 총 영상 수

```
L1~L2 대표 단어:  13유닛 × 4개 = 52개
L3 대표 단어:      6유닛 × 4개 = 24개
L4 대표 단어:      7유닛 × 4개 = 28개
Sound Focus 소리:              = 15개
L3/L4 중 L1~L2와 겹치는 단어:  ≈ -10개
────────────────────
총 약 109개 영상
```

---

## 비용 계산

```
영상 109개 × 평균 2초 = 218초
MultiTalk: 218초 × $0.02 = $4.36
보정 15개 (VEED Fabric): 30초 × $0.08 = $2.40
────────────────────
총 약 $7 (≈ 9,500원) — 1회성
```

---

## 사전 준비

### 1. 기준 이미지 (나노바나나프로)

한국 초등학생 아이 얼굴 1장. 이전에 생성한 것이 있으면 재사용.

```
프롬프트:
A cute Korean elementary school girl (age 8-9) with short black hair, 
round cheeks, and bright eyes. Looking directly at camera with a gentle 
natural smile. Mouth naturally closed (neutral expression).
Clean white background. Studio lighting. Head and shoulders shot.
Realistic illustration style. 512x512px or higher.
```

### 2. fal.ai 계정 + API 키

```
1. https://fal.ai 가입 (GitHub/Google 로그인)
2. Dashboard → API Keys → Create new key
3. export FAL_KEY="your-key"
```

### 3. 기준 이미지를 URL로 업로드

```python
import fal_client
url = fal_client.upload_file("avatar.png")
print(url)  # https://fal.media/files/...
```

---

## 배치 생성 스크립트

```python
# scripts/generate-lipsync.py

import fal_client
import urllib.request
import time
from pathlib import Path

OUTPUT_DIR = Path("public/assets/video")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

AVATAR_URL = "YOUR_AVATAR_IMAGE_URL"

# ─── 전체 대표 단어 (L1~L4) ───
REPRESENTATIVE_WORDS = {
    # L1~L2
    "unit_01": ["cat", "man", "map", "hat"],
    "unit_02": ["bed", "hen", "net", "red"],
    "unit_03": ["pig", "sit", "pin", "big"],
    "unit_04": ["dog", "hot", "fox", "hop"],
    "unit_05": ["bug", "cup", "sun", "run"],
    "unit_07": ["cake", "name", "lake", "face"],
    "unit_08": ["bike", "kite", "nine", "ride"],
    "unit_09": ["bone", "nose", "home", "phone"],
    "unit_10": ["cube", "cute", "tune", "flute"],
    "unit_11": ["bee", "tree", "sea", "read"],
    "unit_13": ["black", "clap", "flag", "blue"],
    "unit_17": ["ship", "shop", "chin", "chop"],
    "unit_19": ["thin", "this", "whale", "when"],
    # L3 자음군·이중자음
    "unit_25": ["black", "clap", "flag", "sled"],
    "unit_26": ["brush", "crab", "drum", "frog"],
    "unit_27": ["swim", "snap", "step", "snow"],
    "unit_28": ["chip", "ship", "chop", "shop"],
    "unit_29": ["thin", "this", "whale", "whip"],
    "unit_30": ["ring", "sing", "bank", "pink"],
    # L4 이중모음·R통제모음
    "unit_31": ["bee", "tree", "meat", "seed"],
    "unit_32": ["boat", "coat", "snow", "bowl"],
    "unit_33": ["rain", "train", "play", "gray"],
    "unit_34": ["boy", "coin", "cow", "house"],
    "unit_35": ["car", "star", "corn", "fork"],
    "unit_36": ["bird", "girl", "nurse", "burn"],
    "unit_37": ["book", "moon", "spoon", "food"],
}

SOUND_FOCUS = [
    ("sound_01", "The sound ah, as in cat"),
    ("sound_02", "The sound eh, as in bed"),
    ("sound_03", "The sound ih, as in sit"),
    ("sound_04", "The sound oh, as in hot"),
    ("sound_05", "The sound uh, as in cup"),
    ("sound_06", "The sound ay, as in cake"),
    ("sound_07", "The sound eye, as in bike"),
    ("sound_08", "The sound oh, as in bone"),
    ("sound_09", "The sound sh, as in ship"),
    ("sound_10", "The sound th, as in thin"),
    ("sound_11", "The sound ch, as in chip"),
    ("sound_12", "L blends: bl, cl, fl"),
    ("sound_13", "R blends: br, cr, dr"),
    ("sound_14", "The sound ee, as in bee"),
    ("sound_15", "R controlled: ar, as in car"),
]


def generate(text: str, filename: str):
    out = OUTPUT_DIR / f"{filename}.mp4"
    if out.exists():
        print(f"  ⏭️  {filename} (exists)")
        return
    try:
        result = fal_client.subscribe(
            "fal-ai/ai-avatar/single-text",
            arguments={
                "image_url": AVATAR_URL,
                "text": text,
                "language": "en",
            },
        )
        video_url = result["video"]["url"]
        urllib.request.urlretrieve(video_url, str(out))
        kb = out.stat().st_size / 1024
        print(f"  ✅ {filename}.mp4 ({kb:.0f}KB)")
    except Exception as e:
        print(f"  ❌ {filename}: {e}")
    time.sleep(1)


if __name__ == "__main__":
    # 중복 제거
    all_words = set()
    for words in REPRESENTATIVE_WORDS.values():
        all_words.update(words)
    
    total = len(all_words) + len(SOUND_FOCUS)
    print(f"🎬 립싱크 영상 생성 ({total}개, 중복 제거 후)")
    print(f"   출력: {OUTPUT_DIR}/\n")

    # 1) 단어 영상
    print(f"📌 단어 영상 ({len(all_words)}개)")
    for word in sorted(all_words):
        generate(word, word.lower())

    # 2) Sound Focus 영상
    print(f"\n📌 Sound Focus ({len(SOUND_FOCUS)}개)")
    for filename, text in SOUND_FOCUS:
        generate(text, filename)

    files = list(OUTPUT_DIR.glob("*.mp4"))
    total_mb = sum(f.stat().st_size for f in files) / (1024 * 1024)
    print(f"\n✅ 완료! {len(files)}개 영상, 총 {total_mb:.1f}MB")
```

### 실행

```bash
pip install fal-client
export FAL_KEY="your-key"
python scripts/generate-lipsync.py
# 약 50분 소요 (자동, 지켜볼 필요 없음)
```

---

## 앱 통합: 기존 MouthVisualizer에 비디오 기능 추가

현재 MouthVisualizer.tsx에는 `FrontViewPlaceholder`(SVG)가 들어있다.
이것을 **영상이 있으면 비디오 재생, 없으면 기존 SVG 유지**하는 방식으로 확장.

### 데이터 파일: `src/data/representativeWords.ts` (신규 생성)

```typescript
/** 유닛별 립싱크 영상이 있는 대표 단어 */
export const representativeWords: Record<string, string[]> = {
    // L1~L2
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
    // L3 자음군·이중자음
    'unit_25': ['black', 'clap', 'flag', 'sled'],
    'unit_26': ['brush', 'crab', 'drum', 'frog'],
    'unit_27': ['swim', 'snap', 'step', 'snow'],
    'unit_28': ['chip', 'ship', 'chop', 'shop'],
    'unit_29': ['thin', 'this', 'whale', 'whip'],
    'unit_30': ['ring', 'sing', 'bank', 'pink'],
    // L4 이중모음·R통제모음
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

export function hasLipSyncVideo(word: string): boolean {
    return allVideoWords.has(word.toLowerCase());
}

export function getLipSyncVideoPath(word: string): string | null {
    if (hasLipSyncVideo(word)) {
        return `/assets/video/${word.toLowerCase()}.mp4`;
    }
    return null;
}

export function getSoundFocusVideoPath(unitId: string): string | null {
    const map: Record<string, string> = {
        'unit_01': '/assets/video/sound_01.mp4',
        'unit_02': '/assets/video/sound_02.mp4',
        'unit_03': '/assets/video/sound_03.mp4',
        'unit_04': '/assets/video/sound_04.mp4',
        'unit_05': '/assets/video/sound_05.mp4',
        'unit_07': '/assets/video/sound_06.mp4',
        'unit_08': '/assets/video/sound_07.mp4',
        'unit_09': '/assets/video/sound_08.mp4',
        'unit_10': '/assets/video/sound_08.mp4',
        'unit_11': '/assets/video/sound_14.mp4',
        'unit_13': '/assets/video/sound_12.mp4',
        'unit_17': '/assets/video/sound_09.mp4',
        'unit_19': '/assets/video/sound_10.mp4',
        'unit_25': '/assets/video/sound_12.mp4',
        'unit_26': '/assets/video/sound_13.mp4',
        'unit_27': '/assets/video/sound_12.mp4',
        'unit_28': '/assets/video/sound_11.mp4',
        'unit_29': '/assets/video/sound_10.mp4',
        'unit_30': '/assets/video/sound_11.mp4',
        'unit_31': '/assets/video/sound_14.mp4',
        'unit_32': '/assets/video/sound_08.mp4',
        'unit_33': '/assets/video/sound_06.mp4',
        'unit_34': '/assets/video/sound_07.mp4',
        'unit_35': '/assets/video/sound_15.mp4',
        'unit_36': '/assets/video/sound_15.mp4',
        'unit_37': '/assets/video/sound_14.mp4',
    };
    return map[unitId] || null;
}
```

### MouthVisualizer.tsx 수정 방향

기존 `FrontViewPlaceholder`를 유지하되, **영상이 있는 단어일 때 비디오로 교체**:

```typescript
// MouthVisualizer.tsx 내부 — FrontViewPlaceholder 위에 비디오 레이어 추가

import { getLipSyncVideoPath } from '@/data/representativeWords';

// MouthVisualizerProps에 추가:
interface MouthVisualizerProps {
    currentPhoneme?: string;
    currentWord?: string;
    isSpeaking?: boolean;
    compact?: boolean;
}

// 컴포넌트 내부에서:
const videoPath = currentWord ? getLipSyncVideoPath(currentWord) : null;

// 렌더링:
{videoPath && isSpeaking ? (
    <video
        src={videoPath}
        autoPlay
        playsInline
        className="w-full h-full object-cover rounded-2xl"
        onEnded={() => { /* 재생 완료 처리 */ }}
    />
) : (
    <FrontViewPlaceholder viseme={viseme} isSpeaking={isSpeaking} />
)}
```

### 적용 구간 (LessonClient.tsx에서)

현재 MouthVisualizer는 `say_check` 스텝에서만 사용되고 있다 (line 893 부근).
추가로 `sound_focus`와 `blend_tap`에도 삽입:

```typescript
// sound_focus 스텝에 Sound Focus 전용 영상 추가
{currentStep === "sound_focus" && (
    <SoundFocusStep unit={unit} words={lessonWords} onNext={goNext}>
        {/* Sound Focus 전용 영상 */}
        {getSoundFocusVideoPath(unit.id) && (
            <video src={getSoundFocusVideoPath(unit.id)!} 
                   autoPlay playsInline className="..." />
        )}
    </SoundFocusStep>
)}

// blend_tap 스텝 — 대표 단어일 때만 영상
{currentStep === "blend_tap" && (
    <BlendTapStep words={lessonWords} onNext={goNext}>
        <MouthVisualizer 
            currentWord={currentBlendWord?.word}
            currentPhoneme={currentPhoneme}
            isSpeaking={isBlending}
        />
    </BlendTapStep>
)}
```

---

## 파일 구조

```
public/assets/video/          ← NEW (약 10MB)
├── cat.mp4
├── man.mp4
├── ... (약 95개 단어)
├── sound_01.mp4
├── sound_02.mp4
└── ... (15개 소리)

src/data/
├── representativeWords.ts    ← NEW
├── visemeMap.ts              ← 기존 (수정 불필요)
├── curriculum.ts             ← 기존 (수정 불필요)
├── l3l4Words.ts              ← 기존 (수정 불필요)
└── ...

src/app/lesson/[unitId]/
├── MouthVisualizer.tsx       ← 수정 (비디오 재생 기능 추가)
├── MouthCrossSection.tsx     ← 기존 유지
├── LessonClient.tsx          ← 수정 (sound_focus, blend_tap에 MouthVisualizer 삽입)
└── ...
```

---

## 비용·일정 총 정리

| 항목 | 비용 | 시간 |
|------|------|------|
| 기준 이미지 (나노바나나프로) | $0 | 30분 |
| fal.ai 계정 + API 키 | $0 | 5분 |
| 영상 생성 ~109개 (MultiTalk) | ~$5 | 50분 (자동) |
| 보정/재생성 ~15개 | ~$2 | 15분 |
| 앱 통합 코딩 | $0 | 1시간 |
| **총합** | **~$7 (≈ 9,500원)** | **반나절** |

모두 1회성 비용. 앱에 MP4로 탑재 후 추가 비용 없음.
앱 용량 증가: 약 10MB (현재 80MB+ 대비 합리적).

---

## Antigravity 프롬프트

```
기존 MouthVisualizer에 AI 립싱크 영상 재생 기능을 추가해줘.
첨부한 MD 파일의 코드를 참고해서:

1. src/data/representativeWords.ts 신규 생성
   — 유닛별 대표 단어 목록 (unit_01~37 전체)
   — hasLipSyncVideo(), getLipSyncVideoPath(), getSoundFocusVideoPath() 함수
   — MD 파일의 코드를 그대로 사용

2. MouthVisualizer.tsx 수정
   — 현재 FrontViewPlaceholder 위에 비디오 레이어 추가
   — getLipSyncVideoPath(currentWord)로 영상이 있는지 확인
   — 있으면 <video autoPlay playsInline> 재생, 없으면 기존 SVG 유지
   — 기존 MouthCrossSection(단면도)은 영상 옆에 그대로 유지

3. LessonClient.tsx 수정
   — sound_focus 스텝에 getSoundFocusVideoPath()로 소리 소개 영상 추가
   — blend_tap 스텝에 MouthVisualizer 삽입 (대표 단어만 영상, 나머지 SVG)
   — say_check 스텝은 이미 MouthVisualizer 사용 중이므로 자동 적용됨
   — 그 외 스텝(magic_e, decode_words, word_family, micro_reader, 
     story_reader, exit_ticket)에는 아바타 추가하지 마

영상 파일(MP4)은 public/assets/video/에 들어갈 예정인데 아직 없으니,
영상 없을 때 기존 SVG로 정상 동작하도록 폴백 로직을 반드시 넣어줘.
```
