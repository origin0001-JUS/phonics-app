# Design: 발음 캐릭터 애니메이션 시스템

> Feature: `pronunciation-character-animation`
> Created: 2026-03-20
> Status: Design
> Plan: `docs/01-plan/features/pronunciation-character-animation.plan.md`

---

## 1. 설계 개요

### 1.1 핵심 결정사항

| 결정 | 선택 | 근거 |
|------|------|------|
| 캐릭터 유형 | **사람 (한국 초등학생)** | 사용자 요청 — 아이들이 "나와 비슷한" 캐릭터에서 모방 학습 효과 극대화 |
| 렌더링 기술 | **SVG + Framer Motion** | 추가 의존성 0, 기존 스택 활용, 번들 사이즈 최소 |
| 기존 이미지 | **전체 대체** | 18장 정적 SVG/PNG → 캐릭터 애니메이션으로 100% 교체 |
| 비디오 폴백 | **유지** | lip-sync 비디오 존재 시 비디오 우선, 없으면 캐릭터 |

### 1.2 변경 범위

```
변경 파일                              변경 유형    설명
──────────────────────────────────────────────────────────────────
src/app/lesson/[unitId]/
  HumanMouthCharacter.tsx              ★ 신규     사람 캐릭터 SVG 컴포넌트 (이미 생성됨)
  MouthVisualizer.tsx                  ★ 수정     캐릭터 통합, 정적 이미지 제거 (이미 수정됨)
  MouthCrossSection.tsx                  유지     사이드뷰 토글용 그대로 유지
  LessonClient.tsx                       유지     MouthVisualizer 인터페이스 불변 → 변경 불필요

src/data/
  visemeMap.ts                           유지     44→15 viseme 매핑 그대로 사용
  pronunciationGuide.ts                  유지     텍스트 가이드 데이터 그대로 사용

public/assets/images/pronunciation/
  *.svg, *.png (18장)                  ▲ 미사용   코드에서 참조 제거됨, 파일은 보존
```

---

## 2. 컴포넌트 상세 설계

### 2.1 HumanMouthCharacter — 핵심 컴포넌트

#### Props 인터페이스

```typescript
interface HumanMouthCharacterProps {
    viseme: VisemeId;           // 15개 viseme 중 하나
    isSpeaking?: boolean;       // 발음 중 펄스 애니메이션
    compact?: boolean;          // true: 28×28, false: 48×48
    isVoiced?: boolean;         // 유성음 → 목 진동 표시
    showAirflow?: boolean;      // 마찰음 → 공기 흐름 화살표
}
```

#### SVG 구조 (viewBox: 0 0 200 240)

```
[Layer 순서 — 아래에서 위로]
──────────────────────────
1. 머리카락 뒤쪽 (ellipse, 고정)
2. 앞머리 (path, 고정)
3. 얼굴 윤곽 (ellipse, 고정)
4. 귀 (ellipse ×4, 고정)
5. 눈썹 (path ×2, 고정)
6. 눈 (ellipse 그룹 ×2, 깜빡임 animate)
7. 코 (ellipse + circle ×2, 고정)
8. 볼 홍조 (ellipse ×2, 고정)
─── 아래부터 가변 영역 ───
9. 턱 그룹 <motion.g y={jawDrop}> ★
   ├ 입 안쪽 (motion.ellipse, 크기 변화)
   ├ 혀 (motion.path, 위치/형태 변화)
   ├ dental 혀 돌출 (조건부)
   ├ 아래 치아 (조건부)
   └ 아래 입술 (motion.path)
10. 윗 치아 (조건부, 고정 위치)
11. 윗 입술 (motion.path, 고정 위치에서 형태만 변화)
12. labiodental 특수 치아 (조건부)
13. 공기 흐름 화살표 (조건부)
14. 목 진동 파동 (조건부)
15. Speaking 펄스 링 (조건부)
```

#### 캐릭터 디자인 사양

| 파츠 | 색상 | 비고 |
|------|------|------|
| 머리카락 | `#1a1a2e` (짙은 남색) | 한국 학생 느낌, 가르마 디테일 `#2d2d4e` |
| 피부 | `#fce4c8` → `#fdebd4` | 따뜻한 살색, 그라데이션 |
| 귀 안쪽 | `#f5c9a0` | |
| 눈동자 | `#2d1810` (짙은 갈색) | 하이라이트 `white` |
| 코 | `#f0ba8c` | 콧구멍 `#e8a878` (반투명) |
| 볼 | `#fca5a5` (35% 투명) | 분홍 홍조 |
| 입술 | `#e88c8c` stroke `#d47070` | 윗입술 strokeWidth 2.5, 아랫입술 2 |
| 혀 | `#e85d75` stroke `#c04060` | |
| 치아 | `white` stroke `#e5e7eb` | |
| 입 안쪽 | `#dc2626` ~ `#7f1d1d` | jawDrop 클수록 어두운 빨강 |

#### 일관성 보장 메커니즘

```
고정 파츠 (100% 동일):    가변 파츠 (viseme별):
  머리카락 ─────────────── 윗입술 path
  얼굴 윤곽 ─────────────── 아랫입술 path
  귀 ──────────────────── jawDrop (0-24px)
  눈썹 ────────────────── 혀 path + 위치
  눈 (깜빡임만) ──────── 치아 visibility
  코 ──────────────────── 입 안쪽 크기/색상
  볼 홍조 ───────────────
```

### 2.2 MouthState 데이터 구조

```typescript
interface MouthState {
    upperLip: string;           // SVG quadratic bezier path
    lowerLip: string;           // SVG quadratic bezier path
    jawDrop: number;            // 0-24 px (translateY)
    tongueShape: string;        // SVG path
    tongueVisible: boolean;     // true = 혀가 치아 밖으로 (dental)
    showUpperTeeth: boolean;    //
    showLowerTeeth: boolean;    //
    lipWidth: number;           // 0.7-1.3 (입 안쪽 ellipse rx 배율)
    interiorColor: string;      // hex — 입 벌림 클수록 어두움
}
```

### 2.3 15개 Viseme 상태 매핑

| Viseme | jawDrop | lipWidth | 치아 | 혀 돌출 | 특수 효과 | 대표 음소 |
|--------|---------|----------|------|---------|----------|----------|
| rest | 0 | 1.0 | — | — | — | (대기) |
| bilabial | 0 | 0.85 | — | — | — | p, b, m |
| labiodental | 3 | 1.0 | 윗니 ✓ | — | 윗니↔아랫입술 오버레이 | f, v |
| dental | 6 | 1.0 | 양쪽 ✓ | ★ 돌출 | airflow 화살표 | θ, ð |
| alveolar_stop | 5 | 1.0 | 윗니 ✓ | — | — | t, d, n, l |
| alveolar_fric | 3 | 0.9 | 양쪽 ✓ | — | airflow 화살표 | s, z |
| postalveolar | 8 | 0.85 | 윗니 ✓ | — | — | ʃ, tʃ |
| velar | 14 | 1.05 | 윗니 ✓ | — | — | k, g, ŋ |
| glottal | 18 | 1.1 | 윗니 ✓ | — | airflow 화살표 | h |
| open_front | 24 | 1.15 | 양쪽 ✓ | — | — | æ (가장 크게) |
| mid_front | 12 | 1.05 | 윗니 ✓ | — | — | ɛ, eɪ |
| close_front | 3 | 1.3 | 윗니 ✓ | — | — | ɪ, iː (넓게 웃기) |
| open_back | 20 | 0.9 | 윗니 ✓ | — | — | ɒ (둥근 O) |
| close_back | 4 | 0.7 | — | — | — | uː, oʊ (오므리기) |
| mid_central | 9 | 1.0 | 윗니 ✓ | — | — | ʌ, ə (편안) |

### 2.4 조건부 시각 효과

#### 공기 흐름 (Airflow)

```
적용 음소: f, v, θ, ð, s, z, ʃ, ʒ, h, th
표현: 입 위로 올라가는 파란 점선 화살표
애니메이션: opacity [0 → 0.7 → 0.3 → 0.7] 1.5초 반복
조건: showAirflow prop + 해당 viseme일 때만 렌더
```

#### 목 진동 (Voicing)

```
적용 음소: b, d, g, v, ð, z, ʒ, dʒ, m, n, ŋ, l, r, w, j + 모든 모음
표현: 턱 아래 보라색 파동 path ×2 (물결)
애니메이션: y [-1 ↔ 1] 0.3초 반복 (위아래 진동)
조건: isVoiced prop + isSpeaking일 때만 렌더
```

#### 혀 치아 돌출 (Dental)

```
적용: viseme === 'dental' (θ, ð)
표현: 윗입술-아랫입술 사이로 분홍 타원 돌출
애니메이션: cy 174 → 169 (위로 올라옴), opacity 0→1
spring delay 0.1s (입이 벌어진 후 혀가 나옴)
```

---

## 3. 통합 설계

### 3.1 MouthVisualizer 내부 흐름

```
MouthVisualizer(props)
│
├── videoPath 존재? ──Yes──→ <video> 재생 (기존 립싱크 비디오)
│                              └── onError → videoError=true → 아래로 폴백
│
└── No ──→ ★ <HumanMouthCharacter
               viseme={phonemeToViseme[currentPhoneme]}
               isSpeaking={isSpeaking}
               compact={compact}
               isVoiced={isVoicedPhoneme(currentPhoneme)}
               showAirflow={isAirflowPhoneme(currentPhoneme)}
           />

[제거된 것]
  × PHONEME_TO_PRONUNCIATION_IMAGE 매핑 (39개 엔트리)
  × getPronunciationImageForPhoneme() 함수
  × <img src={pronunciationImg}> 렌더링
  × FrontViewPlaceholder 내부 컴포넌트
  × PronunciationRefPanel 내 <img> (텍스트 가이드는 유지)
```

### 3.2 레슨 스텝별 적용 (변경 없음!)

LessonClient.tsx는 수정 불필요 — MouthVisualizer의 props 인터페이스가 동일하므로.

| 스텝 | 위치 (줄) | props | 변경 |
|------|----------|-------|------|
| **SoundFocusStep** | L642 | `currentPhoneme={unit.targetSound}`, `videoPath`, `isSpeaking` | 없음 |
| **BlendTapStep** | L859 | `currentWord`, `currentPhoneme={unit.targetSound}`, `isSpeaking` | 없음 |
| **SayCheckStep** | L1139 | `currentPhoneme`, `currentWord`, `wordPhonemes`, `isSpeaking` | 없음 |

### 3.3 기존 정적 이미지 제거 범위

```
[코드에서 제거]
  MouthVisualizer.tsx:
    - PHONEME_TO_PRONUNCIATION_IMAGE (L10-39) → 삭제 완료
    - getPronunciationImageForPhoneme() (L41-55) → 삭제 완료
    - FrontViewPlaceholder 컴포넌트 (L96-169) → 삭제 완료
    - pronunciationImg 변수 및 <img> 렌더링 → 삭제 완료
    - PronunciationRefPanel 내 <img> → 삭제 완료 (텍스트 가이드 유지)

[파일 시스템 — 보존]
  public/assets/images/pronunciation/ (18장)
    → 코드에서 더 이상 참조하지 않지만 삭제하지 않음
    → 향후 비교 모드나 다른 용도로 재활용 가능성
```

---

## 4. 애니메이션 사양

### 4.1 Framer Motion 전환 설정

```typescript
const springConfig = {
    type: "spring",
    stiffness: 280,     // 빠른 반응
    damping: 22,        // 적절한 바운스 감쇠
    duration: 0.2       // 최대 지속 시간
};
```

**적용 대상:**
- 윗입술 path morphing (`animate={{ d: mouth.upperLip }}`)
- 아랫입술 path morphing
- 턱 그룹 y 이동 (`animate={{ y: mouth.jawDrop }}`)
- 혀 path morphing
- 입 안쪽 ellipse rx/ry 변환

### 4.2 눈 깜빡임 (SVG animate)

```xml
<animate attributeName="ry"
    values="0;0;0;12;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0"
    dur="4s" repeatCount="indefinite" />
```

- 4초 주기, 20프레임 중 4번째에서 순간 닫힘
- `isSpeaking=false`일 때만 (발음 중에는 눈 뜨고 있음)

### 4.3 Speaking 인디케이터

```
파란 펄스 링: cx=100 cy=130 r=68→76, opacity 0.4→0
주기: 0.8초 무한 반복
조건: isSpeaking === true
```

### 4.4 컨테이너 스케일 효과

```
캐릭터 전체: scale [1 → 1.02 → 1], 0.8초 주기 (isSpeaking)
MouthVisualizer 래퍼: scale [1 → 1.03 → 1], 0.6초 주기 (isSpeaking + no video)
```

---

## 5. 데이터 흐름

### 5.1 음소 → 캐릭터 애니메이션 파이프라인

```
사용자 인터랙션 (탭/재생)
  │
  ▼
LessonClient.tsx
  ├── currentPhoneme = "θ"
  ├── isSpeaking = true
  │
  ▼
MouthVisualizer.tsx
  ├── viseme = phonemeToViseme["θ"] → "dental"
  ├── isVoiced = isVoicedPhoneme("θ") → false
  ├── showAirflow = isAirflowPhoneme("θ") → true
  │
  ▼
HumanMouthCharacter.tsx
  ├── mouth = MOUTH_STATES["dental"]
  │     jawDrop: 6
  │     tongueVisible: true  ★
  │     showUpperTeeth: true
  │     showLowerTeeth: true
  │
  ▼
SVG 렌더링
  ├── 턱 그룹 y=6 (살짝 벌림)
  ├── 혀 돌출 ellipse 표시 (치아 사이)
  ├── 양쪽 치아 노출
  ├── 공기 흐름 화살표 애니메이션
  └── 목 진동 없음 (voiceless)
```

### 5.2 Voiced/Airflow 판별 로직

```typescript
// HumanMouthCharacter.tsx에서 export

const VOICED_PHONEMES = new Set([
    // 유성 자음
    'b', 'd', 'g', 'v', 'ð', 'z', 'ʒ', 'dʒ',
    'm', 'n', 'ŋ', 'l', 'r', 'w', 'j',
    // 모든 모음 (유성)
    'æ', 'ɛ', 'ɪ', 'ɒ', 'ʌ', 'ʊ',
    'iː', 'eɪ', 'aɪ', 'oʊ', 'uː', 'juː',
    'ɔɪ', 'aʊ', 'ɑːr', 'ɔːr', 'ɜːr', 'ə',
]);

const AIRFLOW_PHONEMES = new Set([
    'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'h', 'th',
]);
```

---

## 6. 성능 고려사항

### 6.1 SVG 최적화

| 항목 | 조치 |
|------|------|
| path 복잡도 | 모든 path를 Q (quadratic bezier) 단일 커브로 제한 |
| 리렌더 방지 | 고정 파츠는 static JSX (motion 없음) |
| 조건부 렌더 | 치아/혀 돌출/공기흐름은 조건부로만 DOM에 추가 |
| animate 속성 | CSS animate (깜빡임)은 GPU 가속, Framer Motion은 spring 기반 |

### 6.2 번들 사이즈 영향

```
제거:
  - PHONEME_TO_PRONUNCIATION_IMAGE 매핑 (~1.5KB gzipped)
  - FrontViewPlaceholder 컴포넌트 (~1KB gzipped)
  - pronunciationImg 로직

추가:
  - HumanMouthCharacter.tsx (~3KB gzipped)
  - MOUTH_STATES 데이터 (~2KB gzipped)
  - isVoicedPhoneme/isAirflowPhoneme (~0.3KB gzipped)

순증가: ~3KB gzipped (매우 경미)
정적 이미지 18장(~200KB) 로드 불필요 → 실질적 네트워크 절감
```

### 6.3 모바일 터치 타겟

```
compact=false: 48×48 (192px CSS)  ✓ 44px+ 충족
compact=true:  28×28 (112px CSS)  ✓ 44px+ 충족
viewBox 200×240 → 실제 입 영역은 중앙 60×40 = 터치에 충분
```

---

## 7. 테스트 계획

### 7.1 빌드 검증

```bash
npm run build    # TypeScript 타입 체크 + Next.js 빌드 패스
```

### 7.2 시각 검증 (수동)

| 검증 항목 | 방법 | 기대 결과 |
|----------|------|----------|
| 15개 viseme 전환 | Sound Focus에서 각 유닛 진입 | 음소에 맞는 입모양 표시 |
| 캐릭터 일관성 | 유닛 1→24 순회 | 얼굴/머리카락 100% 동일, 입만 변화 |
| dental 혀 돌출 | Unit 19 (th) 진입 | 혀가 치아 사이로 올라옴 |
| labiodental 치아 | Unit에서 f/v 음소 | 윗니가 아랫입술 위에 오버레이 |
| close_front 웃기 | Unit 11 (ee) 진입 | 입이 넓게 당겨진 웃는 모양 |
| close_back 오므리기 | Unit 9-10 (o_e, u_e) | 입이 작고 둥글게 |
| open_front 최대 벌림 | Unit 1 (short a) | 턱 최대 벌림, 양쪽 치아 노출 |
| 공기 흐름 화살표 | Unit 19 (th), 17 (sh) | 파란 점선 화살표 |
| 목 진동 | Unit 19의 ð(voiced th) | 보라색 파동 |
| 깜빡임 | 대기 상태 4초 | 눈 한 번 깜빡임 |
| 비디오 폴백 | 비디오 파일 있는 단어 | 비디오 우선 재생, 에러 시 캐릭터 |

### 7.3 반응형 검증

| 디바이스 | compact | 기대 |
|----------|---------|------|
| 모바일 (375px) | false | 48×48 캐릭터, 스크롤 없이 표시 |
| 모바일 (375px) | true | 28×28 캐릭터, 인라인 |
| 태블릿 (768px) | false | 48×48, 여유 공간 |

---

## 8. 구현 순서

### Phase 1: 코어 (이미 완료)

- [x] `HumanMouthCharacter.tsx` 생성 — 15 viseme 사람 캐릭터
- [x] `MouthVisualizer.tsx` 수정 — 정적 이미지 제거, 캐릭터 통합
- [ ] 빌드 검증 (`npm run build`)

### Phase 2: 미세 조정

- [ ] viseme별 입모양 path 미세 조정 (실제 브라우저에서 시각 확인)
- [ ] jawDrop, lipWidth 값 교육적 정확도 향상
- [ ] dental 혀 돌출 크기/위치 최적화
- [ ] labiodental 치아 오버레이 위치 최적화

### Phase 3: 확장 (중기)

- [ ] 이중모음 전환 애니메이션 (usePhonemeSequence 활용)
- [ ] very_hard 음소 비교 모드 (두 캐릭터 나란히)
- [ ] Lottie 고품질 교체 (After Effects 작업 필요)

---

## 9. 기존 파일 영향 분석

| 파일 | 영향 | 상세 |
|------|------|------|
| `LessonClient.tsx` | **없음** | MouthVisualizer props 인터페이스 불변 |
| `visemeMap.ts` | **없음** | phonemeToViseme 그대로 사용 |
| `pronunciationGuide.ts` | **없음** | imagePath 필드 미사용 상태 (텍스트 필드만 활용) |
| `representativeWords.ts` | **없음** | getLipSyncVideoPath 그대로 사용 |
| `MouthCrossSection.tsx` | **없음** | 별도 컴포넌트로 유지 |
| `audio.ts` | **없음** | 오디오 재생 로직 무관 |
| `public/assets/images/pronunciation/` | **참조 제거** | 파일 보존, 코드 참조만 제거 |

---

## 10. Plan 대비 변경사항

| Plan 항목 | Design 결정 | 변경 이유 |
|-----------|------------|----------|
| Foxy 마스코트 캐릭터 | **사람 캐릭터** | 사용자 요청으로 변경 |
| foxyVisemeData.ts 별도 파일 | HumanMouthCharacter.tsx 내부 | 단일 파일로 충분, 파일 분리 불필요 |
| PronunciationCompare.tsx | **Phase 3으로 연기** | 코어 먼저 완성 후 비교 모드 |
| PronunciationSequence.tsx | **Phase 3으로 연기** | usePhonemeSequence 훅 이미 존재 |
| Phase 5 Lottie | **Phase 3으로 통합** | 우선순위 재조정 |
