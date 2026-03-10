# V2-8: 홈 화면 이중 언어 오디오 시퀀서 — Design Document

> Design Document | Feature: v2-8 | Created: 2026-03-09
> Plan Reference: `docs/01-plan/features/v2-8-bilingual-audio.plan.md`

---

## 1. 설계 범위 (Design Scope)

### 1.1 수정 파일
| 파일 | 변경 유형 | 변경 범위 |
|------|-----------|-----------|
| `src/app/page.tsx` | **수정** | useAudioSequencer 훅 추가, 마이크 버튼 onClick 교체, 말풍선 UI, Foxy 애니메이션 클래스 |

### 1.2 수정 금지 파일
`src/lib/audio.ts`, `src/lib/store.ts`, `src/lib/db.ts`, `src/lib/srs.ts`, `src/lib/lessonService.ts`, `src/app/lesson/`, `src/app/units/`, `src/app/onboarding/` — 일체 변경 없음

---

## 2. 타입 정의

```typescript
// page.tsx 상단에 co-locate
type FoxyState = 'idle' | 'talking_en' | 'talking_ko';

interface AudioStep {
  src: string;              // mp3 경로
  fallbackText?: string;    // SpeechSynthesis fallback 텍스트
  fallbackLang?: string;    // fallback 언어 코드
  foxyState: FoxyState;     // 이 오디오 재생 중의 Foxy 상태
  bubbleText: string;       // 말풍선 표시 텍스트
}
```

---

## 3. useAudioSequencer 훅 설계

### 3.1 인터페이스

```typescript
function useAudioSequencer(steps: AudioStep[]): {
  play: () => void;
  stop: () => void;
  foxyState: FoxyState;
  currentBubbleText: string;
  isPlaying: boolean;
}
```

### 3.2 내부 구현 명세

```
┌─────────────────────────────────────────────────────────────┐
│  useAudioSequencer 내부 흐름                                  │
│                                                             │
│  useRef:                                                    │
│    audioRefs: HTMLAudioElement[]  (프리로드된 오디오 인스턴스)   │
│    currentIndex: number          (현재 재생 중인 step 인덱스)  │
│    timeoutRef: NodeJS.Timeout    (gap 타이머)                │
│                                                             │
│  useState:                                                  │
│    foxyState: FoxyState          (idle | talking_en | _ko)   │
│    currentBubbleText: string     (말풍선 텍스트)               │
│    isPlaying: boolean                                       │
│                                                             │
│  play():                                                    │
│    1. stop() 호출 (이전 시퀀스 정리)                           │
│    2. isPlaying = true                                      │
│    3. playStep(0) 호출                                       │
│                                                             │
│  playStep(index):                                           │
│    1. foxyState = steps[index].foxyState                    │
│    2. currentBubbleText = steps[index].bubbleText            │
│    3. audio = audioRefs[index]                              │
│    4. audio.currentTime = 0                                 │
│    5. audio.play()                                          │
│       → 성공: audio.onended = () => {                       │
│           if (index + 1 < steps.length)                     │
│             timeoutRef = setTimeout(                         │
│               () => playStep(index + 1), 300)               │
│           else                                              │
│             finish()                                        │
│         }                                                   │
│       → 실패: fallback(steps[index]) → 다음 step or finish  │
│                                                             │
│  fallback(step):                                            │
│    SpeechSynthesis로 step.fallbackText 재생                  │
│    utterance.onend → 다음 step or finish                     │
│                                                             │
│  stop():                                                    │
│    1. 모든 audioRefs를 pause() + currentTime = 0            │
│    2. clearTimeout(timeoutRef)                              │
│    3. speechSynthesis.cancel()                              │
│    4. foxyState = 'idle'                                    │
│    5. currentBubbleText = ''                                │
│    6. isPlaying = false                                     │
│                                                             │
│  finish():                                                  │
│    foxyState = 'idle', currentBubbleText = '', isPlaying = f │
│                                                             │
│  useEffect (mount):                                         │
│    steps.forEach에서 new Audio(src)로 프리로드                │
│    audio.preload = 'auto'; audio.load()                     │
│    audioRefs에 저장                                          │
│                                                             │
│  useEffect (cleanup):                                       │
│    stop() 호출하여 리소스 정리                                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 오디오 시퀀스 데이터

```typescript
const GREETING_SEQUENCE: AudioStep[] = [
  {
    src: '/assets/audio/hi_im_foxy.mp3',
    fallbackText: "Hi! I'm Foxy!",
    fallbackLang: 'en-US',
    foxyState: 'talking_en',
    bubbleText: "Hi! I'm Foxy! 🦊",
  },
  {
    src: '/assets/audio/foxy_hello_ko.mp3',
    fallbackText: '안녕! 나는 폭시야! 같이 파닉스를 배워보자!',
    fallbackLang: 'ko-KR',
    foxyState: 'talking_ko',
    bubbleText: '안녕! 같이 파닉스를 배워보자!',
  },
];
```

### 3.4 Fallback 전략

```
mp3 파일 재생 시도
  ├── 성공 → onended → 다음 step
  └── 실패 (404/load error)
       └── SpeechSynthesis fallback
            ├── fallbackLang = 'en-US' 또는 'ko-KR'
            ├── rate = 0.85 (아이 친화적 느린 속도)
            └── utterance.onend → 다음 step
```

---

## 4. Foxy 애니메이션 상태 설계

### 4.1 상태 전이 다이어그램

```
          [탭]                    [onEnded+300ms]              [onEnded]
  idle ──────→ talking_en ──────────────→ talking_ko ──────────────→ idle
    ↑                                                                │
    └────────────────────── [stop() 또는 재탭] ──────────────────────┘
```

### 4.2 시각적 표현 (CSS 기반)

| 상태 | 마스코트 컨테이너 | 마이크 버튼 | 추가 효과 |
|------|------------------|------------|-----------|
| `idle` | 기본 (변경 없음) | `border-[#d8f4ff]`, `text-sky-500` | 없음 |
| `talking_en` | `animate-pulse` + `ring-4 ring-sky-300` | `bg-[#a3da61]`, `text-white` | 말풍선 표시 |
| `talking_ko` | `animate-pulse` + `ring-4 ring-amber-300` | `bg-[#fcd34d]`, `text-amber-800` | 말풍선 표시 |

### 4.3 마스코트 컨테이너 변경 (line 97)

**Before:**
```tsx
<div className="w-36 h-36 bg-white/40 rounded-full flex items-center justify-center relative mb-2">
```

**After:**
```tsx
<div className={`w-36 h-36 bg-white/40 rounded-full flex items-center justify-center relative mb-2 transition-all duration-300 ${
  foxyState !== 'idle'
    ? `animate-pulse ${foxyState === 'talking_en' ? 'ring-4 ring-sky-300' : 'ring-4 ring-amber-300'}`
    : ''
}`}>
```

### 4.4 마이크 버튼 변경 (line 106-116)

**Before:**
```tsx
<button
  onClick={() => {
    if (typeof window !== "undefined") {
      const audio = new Audio('/assets/audio/hi_im_foxy.mp3');
      audio.play().catch(() => {});
    }
  }}
  className="absolute -bottom-2 right-4 w-14 h-14 bg-white rounded-full ..."
>
  <Mic className="w-7 h-7 text-sky-500" />
</button>
```

**After:**
```tsx
<button
  onClick={play}
  className={`absolute -bottom-2 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_6px_0_#d1d5db] active:shadow-[0_0px_0_#d1d5db] active:translate-y-[6px] transition-all border-4 z-20 ${
    foxyState === 'talking_en'
      ? 'bg-[#a3da61] border-[#8bc34a]'
      : foxyState === 'talking_ko'
      ? 'bg-[#fcd34d] border-[#d97706]'
      : 'bg-white border-[#d8f4ff]'
  }`}
>
  <Mic className={`w-7 h-7 ${
    foxyState !== 'idle' ? 'text-white animate-bounce' : 'text-sky-500'
  }`} />
</button>
```

---

## 5. 말풍선 UI 설계

### 5.1 위치 및 구조

```
         ┌─────────────────────────┐
         │  Hi! I'm Foxy! 🦊       │  ← 말풍선 (마스코트 위)
         └──────────┬──────────────┘
                    ▼
              ┌──────────┐
              │  🦊 Foxy │  ← 마스코트 이미지
              └──────────┘
```

### 5.2 JSX 구조

```tsx
{/* Speech Bubble - 마스코트 위에 삽입 (Signboard와 Mascot 사이) */}
{currentBubbleText && (
  <div className="animate-fade-in bg-white border-4 border-[#fcd34d] rounded-2xl px-5 py-3 mb-2 relative shadow-lg max-w-[250px]">
    <p className="text-sm font-bold text-slate-700 text-center">
      {currentBubbleText}
    </p>
    {/* 말풍선 꼬리 (아래 삼각형) */}
    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#fcd34d]" />
  </div>
)}
```

### 5.3 fade-in 애니메이션

`globals.css`에 추가하지 않고, **Tailwind arbitrary animation**으로 인라인 처리:

```tsx
// animate-fade-in을 Tailwind 클래스로 대체:
className="animate-[fadeIn_0.3s_ease-in-out]"

// 또는 style 속성 사용:
style={{ animation: 'fadeIn 0.3s ease-in-out' }}
```

**대안 (globals.css 변경 없이):** `opacity` transition으로 구현
```tsx
<div className={`transition-opacity duration-300 ${currentBubbleText ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
```

---

## 6. 프리로드 설계

### 6.1 useEffect 마운트 시

```typescript
useEffect(() => {
  // 오디오 프리로드는 useAudioSequencer 훅 내부에서 처리
  // 컴포넌트 마운트 시 자동 실행
  // checkingOnboarding이 false일 때만 (홈 화면 표시 확정 후)
}, []);
```

### 6.2 프리로드 대상
```
/assets/audio/hi_im_foxy.mp3       (영어, ~50KB 추정)
/assets/audio/foxy_hello_ko.mp3    (한국어, ~80KB 추정, 미존재 시 무시)
```

---

## 7. 안내 텍스트 변경

### 7.1 "Tap to hear me!" → 상태별 분기

| 상태 | 텍스트 | 스타일 |
|------|--------|--------|
| `idle` (초기) | `"Tap to hear me!"` | 현재와 동일 |
| `talking_en` | `"🔊 Speaking..."` | `text-sky-500 animate-pulse` |
| `talking_ko` | `"🔊 말하는 중..."` | `text-amber-500 animate-pulse` |

```tsx
<p className={`font-bold mb-4 text-sm ${
  foxyState === 'idle'
    ? 'text-slate-600 dark:text-slate-400 opacity-80'
    : foxyState === 'talking_en'
    ? 'text-sky-500 animate-pulse'
    : 'text-amber-500 animate-pulse'
}`}>
  {foxyState === 'idle' ? 'Tap to hear me!' : foxyState === 'talking_en' ? '🔊 Speaking...' : '🔊 말하는 중...'}
</p>
```

---

## 8. 전체 변경 범위 매핑 (Line-by-Line)

| 원본 줄 | 변경 내용 |
|---------|-----------|
| 1-2 | `useRef, useCallback` import 추가 |
| 8 뒤 | `FoxyState`, `AudioStep` 타입 정의 추가 |
| 8 뒤 | `GREETING_SEQUENCE` 상수 추가 |
| 8 뒤 | `useAudioSequencer` 훅 함수 정의 (~60줄) |
| 14 뒤 | `const { play, foxyState, currentBubbleText } = useAudioSequencer(GREETING_SEQUENCE);` |
| 94-95 사이 | 말풍선 UI JSX 삽입 |
| 97 | 마스코트 컨테이너에 동적 클래스 추가 |
| 106-112 | 마이크 버튼 onClick → `play`, 동적 스타일 |
| 113 | 마이크 아이콘 동적 클래스 |
| 119 | 안내 텍스트 상태별 분기 |

### 예상 줄 수 변화
- 기존: 171줄
- 추가: ~100줄 (훅 ~60줄, 타입/상수 ~15줄, UI 변경 ~25줄)
- 예상 최종: ~270줄

---

## 9. 구현 순서 (Implementation Order)

```
Step 1: 타입 & 상수 정의
  └── FoxyState, AudioStep, GREETING_SEQUENCE

Step 2: useAudioSequencer 훅 구현
  ├── useRef로 Audio 인스턴스 관리
  ├── play() / stop() / playStep() 로직
  ├── fallback (SpeechSynthesis) 로직
  └── useEffect 프리로드 + cleanup

Step 3: Home 컴포넌트 연동
  ├── 훅 호출 (play, foxyState, currentBubbleText)
  ├── 마이크 버튼 onClick 교체
  └── 마스코트 컨테이너 동적 클래스

Step 4: 말풍선 UI
  └── Signboard와 Mascot 사이에 삽입

Step 5: 안내 텍스트 상태별 분기
  └── "Tap to hear me!" → 상태 분기

Step 6: 전체 통합 테스트
  ├── mp3 존재 시: 영어 → 한국어 순차 재생
  ├── mp3 미존재 시: SpeechSynthesis fallback
  ├── 재탭 시: 리셋 후 재시작
  └── TypeScript 빌드 에러 없음
```

---

## 10. 검증 체크리스트

- [ ] `npm run build` 통과
- [ ] 마이크 탭 → 영어 mp3 재생 → 300ms → 한국어 mp3/fallback 재생
- [ ] 재생 중 마스코트 ring + pulse 애니메이션 활성
- [ ] 재생 중 마이크 버튼 색상 변화 (idle=white, en=green, ko=yellow)
- [ ] 재생 중 말풍선에 현재 텍스트 표시
- [ ] 재생 완료 후 idle 복귀 (애니메이션 제거, 말풍선 사라짐)
- [ ] 재생 중 재탭 시 리셋 + 처음부터 재시작
- [ ] 한국어 mp3 404 시 SpeechSynthesis ko-KR fallback
- [ ] `src/app/page.tsx` 외 파일 변경 없음
- [ ] 안내 텍스트가 상태별로 올바르게 표시됨

---

*Generated by PDCA Design Phase | Feature: v2-8 | 2026-03-09*
