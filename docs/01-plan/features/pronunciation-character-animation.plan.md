# Plan: 발음 캐릭터 애니메이션 시스템

> Feature: `pronunciation-character-animation`
> Created: 2026-03-20
> Status: Plan
> 선행 리서치: LIPSYNC_PLAN.md, pronunciation-image-v2.plan.md

---

## 1. 문제 정의

### 현재 상태

| 구성요소 | 상태 | 한계 |
|----------|------|------|
| MouthVisualizer (정면 SVG) | ✅ 구현됨 | 단순 도형 수준, 캐릭터 없음, 아이들에게 추상적 |
| MouthCrossSection (단면도) | ✅ 구현됨 | 해부학적 다이어그램 — 초등학생이 이해하기 어려움 |
| 발음 참조 이미지 (18장 SVG) | ✅ 생성됨 | 정적 이미지, 동작 과정을 보여주지 못함 |
| pronunciationGuide.ts (21개 음소) | ✅ 데이터 완비 | 텍스트+이미지 기반, 애니메이션 없음 |
| 립싱크 영상 (VEED Fabric) | ❌ 미생성 | AI 생성 영상은 품질 불안정 + 일관성 없음 |
| visemeMap.ts (44→15 viseme) | ✅ 매핑 완비 | 코드에서 활용하지만 시각적 캐릭터 없음 |

### 핵심 문제

1. **캐릭터 부재**: 입모양 SVG는 "얼굴 없는 입"으로, 아이들이 공감하거나 따라하기 어려움
2. **정적 표현**: 발음은 **동작 과정**(혀가 이동, 입이 벌어짐)인데 정적 이미지로는 전달 불가
3. **AI 영상 한계**: VEED/MultiTalk 테스트 결과 품질 불안정, 캐릭터 일관성 유지 불가
4. **단면도 난해**: MouthCrossSection은 교육학적으로 정확하나 아이 눈높이가 아님

### 사용자 요청

> "애니메이션으로 발음 동영상이 없는 단어들을 제대로 배우게 하고 싶다. 각 애니메이션은 일관된 캐릭터가 유지되어야 한다."

---

## 2. 목표

### 최종 목표
**일관된 캐릭터(Foxy 마스코트)가 정확한 입모양·혀 위치를 보여주는 코드 기반 애니메이션**을 만들어, 발음 영상 없이도 아이들이 직관적으로 발음법을 익히게 한다.

### 성공 기준

| 기준 | 측정 방법 |
|------|----------|
| 15개 viseme 카테고리 전체 애니메이션 커버 | visemeMap.ts 매핑 기준 100% |
| 단일 캐릭터 일관성 | 모든 음소에서 동일한 Foxy 캐릭터 사용 |
| 이중모음/블렌드 순차 전환 | phoneme sequence → viseme transition 자동 생성 |
| 한국 학생 어려운 음소(7개 very_hard) 차별화된 가이드 | pronunciationGuide 난이도별 특수 처리 |
| 기존 SVG 폴백 유지 | 애니메이션 로드 실패 시 현재 시스템 그대로 작동 |

---

## 3. 리서치: 효과적인 발음 애니메이션 기법

### 3.1 교육학적 근거

#### McGurk Effect (맥거크 효과)
- 시각 정보(입모양)가 청각 인식을 **보강하거나 변경**하는 현상
- 입모양 애니메이션을 소리와 동기화하면 음소 인식 정확도 15-25% 향상 (연구 기반)
- **핵심**: 정확한 viseme 타이밍이 부정확한 것보다 차라리 없는 게 나음

#### Speech Blubs 방식 (또래 모방 학습)
- 아이들은 추상적 다이어그램보다 **캐릭터/사람의 얼굴**에서 더 잘 배움
- 캐릭터가 "나와 비슷하다"고 느끼면 모방 학습 효과 극대화
- **적용**: Foxy 캐릭터가 발음하는 모습 → 아이가 따라하는 구조

#### "Mirror + Model" 패턴 (Rachel's English)
- 1단계: 캐릭터가 정확한 입모양을 보여줌 (Model)
- 2단계: "거울을 보면서 따라해봐!" 안내 (Mirror)
- 3단계: Say & Check 스텝에서 STT로 확인
- **적용**: sound_focus, blend_tap 스텝에 Model 단계 삽입

### 3.2 애니메이션 기술 옵션 비교

#### 옵션 A: Lottie (Bodymovin) 애니메이션 — ⭐ 추천

| 항목 | 내용 |
|------|------|
| **기술** | After Effects → Lottie JSON → `lottie-react` 렌더링 |
| **장점** | 벡터 기반 무한 스케일, 작은 파일(50-100KB/애니), 프레임 정밀 제어, iOS/Android 완벽 지원 |
| **캐릭터 일관성** | ✅ 하나의 AE 프로젝트에서 모든 애니메이션 생성 → 100% 일관 |
| **인터랙티브** | 특정 프레임으로 점프, 재생속도 조절, 세그먼트 재생 가능 |
| **비용** | After Effects 구독 또는 무료 대안(Haiku Animator, Cavalry) |
| **생성 방법** | AI 지원 가능: After Effects + Bodymovin 플러그인 |
| **적합도** | ★★★★★ — 파닉스 앱에 최적 |

#### 옵션 B: SVG + Framer Motion (현재 방식 확장)

| 항목 | 내용 |
|------|------|
| **기술** | SVG path morphing + CSS animation via Framer Motion |
| **장점** | 추가 라이브러리 불필요, 현재 코드 기반 확장, 번들 크기 최소 |
| **캐릭터 일관성** | ⚠️ SVG 파츠(눈, 코, 입, 혀) 조합으로 캐릭터 구성 — 구현 복잡도 높음 |
| **인터랙티브** | Framer Motion variants로 상태 전환 가능 |
| **비용** | 무료 (이미 의존성 설치됨) |
| **한계** | 캐릭터 디테일 표현 한계, 복잡한 혀 동작 path 데이터 수작업 필요 |
| **적합도** | ★★★★☆ — 빠른 구현 가능, 디테일 한계 |

#### 옵션 C: Rive (구 Flare)

| 항목 | 내용 |
|------|------|
| **기술** | Rive 에디터 → .riv 파일 → `@rive-app/react-canvas` |
| **장점** | State Machine 내장 (viseme 상태 전환에 이상적), 인터랙티브 설계 특화 |
| **캐릭터 일관성** | ✅ 하나의 Rive 파일 내에서 모든 상태 관리 |
| **인터랙티브** | State Machine inputs으로 viseme 실시간 전환 |
| **비용** | 무료 플랜 (파일 3개) 또는 $15/월 |
| **한계** | 새 도구 학습 필요, Rive 에디터에서 캐릭터 제작 필요 |
| **적합도** | ★★★★☆ — State Machine이 viseme 전환에 이상적이나 학습 비용 |

#### 옵션 D: Spine 2D

| 항목 | 내용 |
|------|------|
| **기술** | Spine 에디터 → JSON/Atlas → spine-ts 런타임 |
| **장점** | 게임급 본 애니메이션, 메쉬 변형으로 입안/혀 자연스러운 표현 |
| **캐릭터 일관성** | ✅ 스켈레톤 기반 — 하나의 캐릭터 리그에서 모든 포즈 |
| **한계** | 라이선스 $69+, 웹 런타임 무거움, 과도한 복잡도 |
| **적합도** | ★★☆☆☆ — 오버엔지니어링 |

### 3.3 최종 기술 선택: 하이브리드 (B + A)

```
┌─────────────────────────────────────────────────────────┐
│                    추천 전략                              │
│                                                          │
│  Phase 1: SVG + Framer Motion 캐릭터 시스템 (즉시 구현)  │
│    → 기존 viseme 데이터 활용, Foxy 캐릭터 SVG 파츠 제작  │
│    → 15개 viseme 전환 애니메이션                          │
│    → 추가 의존성 ZERO                                    │
│                                                          │
│  Phase 2: Lottie 고품질 애니메이션 (중기 교체)            │
│    → very_hard 음소 7개 우선 Lottie 제작                 │
│    → 혀 위치, 공기 흐름 등 세밀한 표현                    │
│    → Phase 1 컴포넌트와 동일 인터페이스 유지              │
│                                                          │
│  ※ Phase 1만으로도 현재 SVG 대비 대폭 개선               │
└─────────────────────────────────────────────────────────┘
```

**선택 이유**:
1. Phase 1은 **추가 비용 0원**, 현재 기술 스택(Framer Motion) 그대로 활용
2. Foxy 캐릭터는 이미 앱 전체에 사용 중 → 일관성 자연스럽게 확보
3. Lottie는 나중에 very_hard 음소만 선택적으로 고품질 교체 가능
4. Rive는 State Machine이 매력적이나 1인 개발 환경에서 학습 비용 대비 이점 부족

---

## 4. 캐릭터 디자인 사양

### 4.1 Foxy 캐릭터 발음 뷰 사양

```
┌────────────────────────────────────┐
│          Foxy 발음 캐릭터            │
│                                      │
│         ╭─────────────╮              │
│        │   🦊 귀 (접힘)  │            │
│         ╰──┬───────┬──╯              │
│           │ 큰 눈  │                │
│           │ ● ●  │  ← 눈이 아래를   │
│           │      │     바라봄       │
│           │  ▽  │  ← 코            │
│           │      │                  │
│     ┌─────┴──────┴─────┐            │
│     │                    │            │
│     │  ★ 입+혀 영역 ★   │ ← 핵심!    │
│     │  (확대된 비율)     │            │
│     │                    │            │
│     └────────────────────┘            │
│                                      │
│  디자인 원칙:                        │
│  • 얼굴 대비 입 영역 비율 40%+       │
│  • 입안이 보이는 클로즈업 구도        │
│  • 혀(빨간), 치아(하얀), 입술(주황)  │
│  • 눈은 항상 학습자를 바라봄          │
│  • 배경: 투명 또는 앱 테마 색상       │
└────────────────────────────────────┘
```

### 4.2 캐릭터 SVG 파츠 구조

```
FoxyCharacter (부모 SVG viewBox="0 0 200 280")
├── ears (정적) — 여우 귀, 위치 고정
├── head_outline (정적) — 둥근 얼굴 윤곽
├── eyes (반정적) — 기본 위치 + 깜빡임 애니메이션
│   ├── left_eye
│   └── right_eye
├── nose (정적) — 작은 삼각형 코
├── whiskers (정적) — 수염
│
├── mouth_group (동적 — viseme별 변환) ★ 핵심
│   ├── upper_lip (path morphing)
│   ├── lower_lip (path morphing)
│   ├── jaw_group (translateY로 벌어짐)
│   │   ├── lower_teeth (하얀 사각형 배열)
│   │   └── tongue (path morphing + translateX/Y) ★ 가장 중요
│   ├── upper_teeth (고정 위치, 가시성 토글)
│   └── mouth_interior (빨간/분홍 배경)
│
├── throat_indicator (조건부) — voiced 음소일 때 진동 아이콘
└── airflow_arrows (조건부) — 공기 흐름 화살표 (fricative용)
```

### 4.3 일관성 보장 전략

| 요소 | 고정 vs 가변 | 설명 |
|------|-------------|------|
| 얼굴 윤곽/귀/눈/코/수염 | **고정** | 모든 애니메이션에서 100% 동일 |
| 눈 표정 | **반고정** | 깜빡임만, 위치 불변 |
| 입술 형태 | **가변** | 15개 viseme에 따라 path 변화 |
| 혀 위치/형태 | **가변** | viseme별 path + 위치 변화 |
| 턱 벌림 정도 | **가변** | jawDrop 값에 따라 translateY |
| 치아 노출 | **가변** | viseme별 visibility toggle |
| 목 진동 표시 | **조건부** | voiced 음소일 때만 표시 |
| 공기 흐름 화살표 | **조건부** | fricative 음소일 때만 표시 |

---

## 5. 15개 Viseme 애니메이션 세부 사양

### 5.1 Viseme별 입모양 파라미터

| Viseme | jawDrop (px) | lipGap (px) | lipShape | tongue 위치 | teeth 노출 | 예시 음소 |
|--------|-------------|-------------|----------|------------|-----------|----------|
| rest | 0 | 0 | closed | 바닥 | 없음 | (대기) |
| bilabial | 0→4→0 | -2→0→-2 | pressed→pop | 바닥 | 순간 노출 | p, b, m |
| labiodental | 2 | 3 | upper-bite | 바닥 | ✅ 윗니가 아랫입술 위 | f, v |
| dental | 4 | 5 | slightly open | ★ 치아 사이 돌출 | ✅ 양쪽 | θ, ð |
| alveolar_stop | 3 | 4 | neutral open | 잇몸 능선 접촉 | 약간 | t, d, n, l |
| alveolar_fric | 2 | 2 | narrow slit | 잇몸 근처 | ✅ | s, z |
| postalveolar | 5 | 8 | rounded push | 잇몸 뒤 | ✅ | ʃ, tʃ |
| velar | 6 | 10 | open round | ★ 뒤쪽 올림 | 약간 | k, g, ŋ |
| glottal | 8 | 14 | wide open | 편안한 바닥 | ✅ | h |
| open_front | 12 | 18 | ★ 가장 크게 | 앞쪽 낮음 | ✅ | æ |
| mid_front | 7 | 10 | half open | 앞쪽 중간 | 약간 | ɛ, eɪ |
| close_front | 1 | 3 | ★ grin(넓게 당김) | 앞쪽 높음 | ✅ 웃는 치아 | ɪ, iː |
| open_back | 10 | 16 | ★ 둥근 O | 뒤쪽 낮음 | 약간 | ɒ, ɔɪ |
| close_back | 3 | 5 | ★ 오므린 O | 뒤쪽 높음 | 없음 | ʊ, uː, oʊ |
| mid_central | 5 | 8 | relaxed | 중앙 편안 | 약간 | ʌ, ə |

### 5.2 특수 애니메이션 (very_hard 음소)

#### /θ/ (th voiceless) — 난이도: very_hard
```
애니메이션 시퀀스 (1.2초):
0.0s  rest → dental 전환 시작
0.2s  혀가 앞으로 이동, 치아 사이로 돌출
0.4s  ★ 혀끝 강조 (빨간색 밝게, 살짝 확대)
0.5s  공기 흐름 화살표 표시 (혀 위로 나가는 점선)
0.8s  "쓰~" 텍스트 말풍선
1.0s  유지 → rest 복귀

시각적 강조:
- 혀끝에 노란 동그라미 하이라이트 (핵심 포인트)
- "혀가 보여야 해요!" 캡션
- 비교 모드: /s/와 나란히 → "s는 혀가 안에!"
```

#### /r/ vs /l/ — 난이도: very_hard
```
애니메이션 시퀀스 (비교 모드, 2초):

왼쪽 (Foxy: /r/):                  오른쪽 (Foxy: /l/):
0.0s  rest                          rest
0.3s  혀 뒤로 말림 (curl back)      혀끝이 잇몸 접촉 (tip up)
0.5s  ★ 혀끝 하이라이트             ★ 혀끝 하이라이트
0.6s  "혀가 아무데도 안 닿아요!"    "혀끝이 잇몸에 딱!"
1.0s  유지                          유지
1.5s  rest                          rest

시각적 강조:
- 혀끝에 X표(r: 접촉 없음) vs O표(l: 접촉)
- 사이드뷰 토글 버튼 → MouthCrossSection 연동
```

#### /f/ vs /v/ — 난이도: very_hard
```
애니메이션 시퀀스 (1초):
0.0s  rest → labiodental 전환
0.2s  윗니가 아랫입술 위에 올라감
0.3s  ★ 접촉 포인트 하이라이트 (노란 점)
0.4s  공기 흐름 화살표 (치아+입술 사이)
0.5s  /v/일 때: 목 진동 아이콘 ON (파동 이펙트)
0.8s  유지 → rest 복귀

비교 모드 (/f/ vs /p/):
- f: "윗니가 입술 위!" (labiodental)
- p: "입술끼리 닿아요!" (bilabial)
- 핵심 차이 화살표로 표시
```

#### /æ/ vs /ɛ/ — 난이도: hard (한국 학생 가장 흔한 혼동)
```
애니메이션 시퀀스 (비교 모드):

왼쪽 (Foxy: /æ/ cat):              오른쪽 (Foxy: /ɛ/ bed):
0.0s  rest                          rest
0.3s  턱 크게 벌림 (12px)           턱 약간 벌림 (7px)
0.4s  ★ 손가락 2개 표시             ★ 손가락 1개 표시
0.5s  "손가락 2개가 들어가요!"       "손가락 1개만!"
0.8s  입꼬리 살짝 옆으로            입꼬리 그대로
1.2s  유지 → rest                   유지 → rest

시각적 강조:
- 턱 아래 수직 눈금자 (높이 차이 명확화)
- "I makes you grin, E moves your chin!" 니모닉
```

### 5.3 이중모음(Diphthong) 전환 애니메이션

이중모음은 **시작 위치 → 끝 위치** 자연 전환이 핵심:

| 이중모음 | 시작 viseme | 끝 viseme | 전환 시간 | 특수 효과 |
|---------|------------|----------|----------|----------|
| /eɪ/ (cake) | mid_front | close_front | 400ms | 입이 좁아지는 화살표 |
| /aɪ/ (bike) | open_front | close_front | 500ms | 크게→작게 화살표 |
| /oʊ/ (bone) | open_back | close_back | 400ms | 둥근→더 둥근 화살표 |
| /aʊ/ (cow) | open_front | close_back | 500ms | 넓게→오므리기 화살표 |
| /ɔɪ/ (boy) | open_back | close_front | 500ms | 둥근→넓게 화살표 |

---

## 6. 컴포넌트 아키텍처

### 6.1 새 컴포넌트 구조

```
src/app/lesson/[unitId]/
├── FoxyPronunciation.tsx        ★ 새 파일: 메인 캐릭터 컴포넌트
│   ├── FoxyFace (정적 파츠)
│   ├── FoxyMouth (동적 viseme 애니메이션)
│   ├── TongueAnimation (혀 path morphing)
│   ├── VoicingIndicator (유성/무성 표시)
│   └── AirflowArrows (공기 흐름)
│
├── PronunciationCompare.tsx     ★ 새 파일: 비교 모드 (2캐릭터 나란히)
│   ├── FoxyPronunciation × 2
│   └── ComparisonLabels
│
├── PronunciationSequence.tsx    ★ 새 파일: 단어 음소 순차 애니메이션
│   ├── FoxyPronunciation (자동 전환)
│   ├── PhonemeTimeline (하단 진행 바)
│   └── 현재 음소 하이라이트
│
├── MouthVisualizer.tsx          기존 파일 수정: FoxyPronunciation 통합
├── MouthCrossSection.tsx        기존 유지: 사이드뷰 토글로 활용
└── LessonClient.tsx             기존 파일 수정: 새 컴포넌트 삽입
```

### 6.2 데이터 구조

```typescript
// src/data/foxyVisemeData.ts (새 파일)

interface FoxyVisemeState {
  // 입술
  upperLipPath: string;       // SVG path
  lowerLipPath: string;       // SVG path
  lipWidth: number;           // 0-100 (좁게~넓게)

  // 턱
  jawDrop: number;            // 0-25px

  // 혀
  tonguePath: string;         // SVG path
  tongueX: number;            // 수평 위치 (앞~뒤)
  tongueY: number;            // 수직 위치 (높~낮)
  tongueVisible: boolean;     // dental처럼 밖으로 돌출?

  // 치아
  upperTeethVisible: boolean;
  lowerTeethVisible: boolean;

  // 입 내부
  mouthInteriorColor: string; // 어두운 빨강(기본) ~ 밝은 분홍

  // 특수 효과
  airflowDirection?: 'up' | 'forward' | 'sides';
  voicingActive?: boolean;
  highlightPoint?: { x: number; y: number; label: string };
}

// 15개 viseme별 상태 정의
const FOXY_VISEME_STATES: Record<VisemeId, FoxyVisemeState> = { ... };

// 음소별 애니메이션 시퀀스 (특수 효과 포함)
interface PhonemeAnimation {
  phoneme: string;
  visemeSequence: VisemeId[];     // 이중모음: 2개, 단모음: 1개
  duration: number;               // ms
  specialEffects: SpecialEffect[];
  caption?: string;               // 한국어 팁
  highlightTiming?: number[];     // 하이라이트 시작 시간 (ms)
}
```

### 6.3 레슨 스텝별 적용 계획

| 스텝 | 현재 | 변경 후 | 비고 |
|------|------|---------|------|
| **sound_focus** | 오디오만 재생 | FoxyPronunciation + PronunciationCompare | 음소 소개 시 캐릭터가 발음 시연 |
| **blend_tap** | 음소 타일 탭 | 탭 시 FoxyPronunciation 표시 | 각 음소 탭할 때 입모양 표시 |
| **say_check** | MouthVisualizer (기존) | FoxyPronunciation으로 교체 | STT 전에 "이렇게 해봐!" 가이드 |
| **decode_words** | 텍스트 중심 | PronunciationSequence 작게 표시 | 단어 전체 발음 흐름 미리보기 |
| **micro_reader** | 문장 읽기 | 변경 없음 | 문장 단위에서는 불필요 |
| **exit_ticket** | 퀴즈 | 변경 없음 | |

---

## 7. 구현 계획

### Phase 1: Foxy SVG 캐릭터 파츠 제작 (Antigravity 협업)

**담당**: Antigravity (캐릭터 디자인) + Claude Code (SVG 최적화)

**작업**:
1. Foxy 발음 뷰 기본 얼굴 SVG 제작 (정면, 약간 아래를 보는 각도)
2. 입 영역을 **별도 레이어**로 분리 (파츠 교체 가능하게)
3. 15개 viseme별 입+혀 SVG path 데이터 추출
4. 특수 효과 에셋: 공기 흐름 화살표, 진동 아이콘, 손가락 카운트 아이콘

**산출물**:
- `public/assets/images/foxy/foxy-face-base.svg` (정적 파츠)
- `src/data/foxyVisemeData.ts` (15개 viseme state 데이터)

**소요**: 3-4시간

### Phase 2: FoxyPronunciation 코어 컴포넌트 구현

**담당**: Claude Code

**작업**:
1. `FoxyPronunciation.tsx` — SVG 파츠 조합 + Framer Motion 전환
2. `foxyVisemeData.ts` — 15개 viseme state 데이터
3. `useVisemeTransition` 훅 — phoneme → viseme → 애니메이션 상태 관리
4. MouthVisualizer.tsx 통합 (FoxyPronunciation 우선, 기존 SVG 폴백)

**산출물**:
- 새 컴포넌트 3개 + 데이터 파일 1개
- 기존 MouthVisualizer 호환 유지

**소요**: 4-5시간

### Phase 3: 특수 음소 애니메이션 + 비교 모드

**담당**: Claude Code

**작업**:
1. `PronunciationCompare.tsx` — very_hard 7개 음소 비교 애니메이션
2. `PronunciationSequence.tsx` — 단어 음소 순차 전환 (이중모음 포함)
3. pronunciationGuide.ts 데이터와 연동 (난이도별 특수 처리)
4. 한국어 캡션/팁 표시 시스템

**산출물**:
- 비교 모드 컴포넌트
- 7개 very_hard 음소 전용 애니메이션 시퀀스
- 5개 이중모음 전환 애니메이션

**소요**: 3-4시간

### Phase 4: LessonClient 통합 + QA

**담당**: Claude Code + Antigravity (QA)

**작업**:
1. LessonClient.tsx의 sound_focus, blend_tap, say_check 스텝에 삽입
2. 반응형 크기 조정 (모바일 44px+ 터치 타겟 유지)
3. 성능 최적화 (SVG 파츠 메모이제이션, 불필요한 리렌더 방지)
4. 빌드 검증 + 브라우저 테스트

**산출물**:
- LessonClient.tsx 수정
- 전체 빌드 패스 확인

**소요**: 2-3시간

### Phase 5 (중기): Lottie 고품질 교체

**담당**: Antigravity (AE 작업) + Claude Code (통합)

**작업**:
1. After Effects에서 Foxy 캐릭터 리그 제작
2. very_hard 7개 음소 Lottie 애니메이션 제작
3. `lottie-react` 설치 + FoxyPronunciation에 Lottie 레이어 추가
4. SVG 폴백 유지

**산출물**:
- 7개 Lottie JSON 파일 (각 50-100KB)
- lottie-react 의존성 추가

**소요**: 별도 일정 (Antigravity AE 작업 필요)

---

## 8. 일정 요약

| Phase | 담당 | 선행조건 | 예상 소요 |
|-------|------|---------|----------|
| 1. SVG 파츠 | Antigravity + CC | 없음 | 3-4시간 |
| 2. 코어 컴포넌트 | Claude Code | Phase 1 (부분) | 4-5시간 |
| 3. 특수 애니메이션 | Claude Code | Phase 2 | 3-4시간 |
| 4. 통합 + QA | 하이브리드 | Phase 2+3 | 2-3시간 |
| 5. Lottie 교체 | 별도 | Phase 4 완료 후 | 별도 일정 |

**Phase 1~4 총: 약 12-16시간 (2-3일)**
**추가 비용: 0원** (Phase 5 Lottie 전까지)

---

## 9. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| SVG path morphing 성능 이슈 | 낮음 | 중 | will-change 힌트, 복잡한 path 단순화 |
| 15개 viseme path 데이터 수작업 부담 | 중간 | 중 | MouthCrossSection 기존 TONGUE_PATHS 재활용 |
| Foxy 캐릭터 입 클로즈업 디자인 난이도 | 중간 | 높 | Antigravity에서 여러 시안 → 사용자 선택 |
| 이중모음 전환이 부자연스러움 | 낮음 | 중 | spring 물리 파라미터 튜닝, 중간 보간 추가 |
| 모바일 성능 (저사양 태블릿) | 낮음 | 높 | SVG 복잡도 단계별 축소, compact 모드 강화 |

---

## 10. 기존 시스템과의 관계

```
[기존 유지]                    [새로 추가]                    [중기 교체]
─────────────                ────────────                  ────────────
visemeMap.ts (매핑)    →     foxyVisemeData.ts (시각화)
pronunciationGuide.ts  →     PronunciationCompare (비교 UI)
MouthCrossSection     →      사이드뷰 토글로 유지
usePhonemeSequence    →      PronunciationSequence (시각화)
                                                          Lottie 파일
MouthVisualizer       →      FoxyPronunciation (교체)     (Phase 5)
  └ 기존 SVG           →      └ 폴백으로 남김
```

---

## 11. 교육적 효과 예상

### Before (현재)
- Sound Focus: 오디오만 → 아이가 소리만 듣고 따라함
- 입모양: 추상적 도형 → "이게 뭐지?" 반응
- 어려운 음소: 텍스트 팁만 → 한국 학생이 차이 인지 어려움

### After (구현 후)
- Sound Focus: **Foxy가 발음하는 모습** → "아, 이렇게 하는 거구나!"
- 입모양: **익숙한 캐릭터의 입** → 자연스럽게 모방
- 어려운 음소: **비교 애니메이션** → "r은 혀가 안 닿고, l은 닿는구나!"
- 이중모음: **전환 과정** → "입이 변하는 게 보여!"

---

## 참고 자료

### 프로젝트 내부
- `LIPSYNC_PLAN.md` — AI 영상 기반 계획 (본 계획과 별도 트랙)
- `pronunciation-image-v2.plan.md` — 정적 이미지 V2 계획
- `src/data/visemeMap.ts` — 기존 phoneme→viseme 매핑 (15종)
- `src/data/pronunciationGuide.ts` — 21개 음소 교육 데이터
- `src/app/lesson/[unitId]/MouthCrossSection.tsx` — 기존 TONGUE_PATHS 참조

### 교육학
- McGurk Effect 연구 (시각-청각 상호작용)
- Speech Blubs 앱 — 또래 모방 학습 방법론
- Rachel's English — Mirror + Model 패턴
- This Reading Mama — "I makes you grin, E moves your chin!" 니모닉

### 기술
- Framer Motion SVG path morphing: `animate={{ d: pathData }}`
- Lottie Web (향후): `lottie-react` npm 패키지
- Rive (검토했으나 미선택): State Machine 기반 인터랙티브 애니메이션
