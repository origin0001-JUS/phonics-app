# Plan: Seed 이미지 기반 발음 입모양 이미지 교체

> Feature: `seed-based-mouth-images`
> Created: 2026-03-21
> Status: Plan
> 선행: pronunciation-character-animation (SVG 기반 → 폐기)

---

## 1. 문제 정의

### 현재 상태 (SVG 코드 기반)

![현재 SVG 입모양](../../test-screenshots/v5-th-fixed.png)

- 단순 도형(ellipse, path)으로 구성된 입 — **사람같지 않음**
- 살색 배경 + 빨간 타원 + 흰 사각형 치아 → **이질적**
- 피부 질감, 입술 음영, 인중 주름 등 **사실감 제로**

### 목표 (seed 이미지 기반)

![seed_final.jpeg](../../out/assets/video/seed_final.jpeg)

- **반실사 한국 소녀 일러스트** — 따뜻한 피부톤, 분홍 볼, 자연스러운 입술
- 이 캐릭터의 입모양을 **15개 viseme별로 변형**하여 생성
- 동일 캐릭터가 다른 발음을 하고 있는 것처럼 보이게 함

### 핵심 요청

> "만든 이미지가 너무 이질적이야. 발음을 내고 있는 사람같지가 않아. seed_final.jpeg를 seed 이미지로 활용해서 다시 만들어줘."

---

## 2. Seed 이미지 분석

### seed_final.jpeg 특징

| 항목 | 상세 |
|------|------|
| **스타일** | 반실사(Semi-realistic) 일러스트 |
| **인물** | 한국 초등학생 소녀 (8-9세 추정) |
| **구도** | 코~턱 클로즈업 (눈 미포함) |
| **피부** | 따뜻한 살색, 분홍 볼 홍조 |
| **입술** | 자연스러운 핑크, 살짝 미소 (입 다문 상태) |
| **머리카락** | 검은색, 양 옆으로 보임 |
| **배경** | 없음 (캐릭터만) |
| **액세서리** | 작은 귀걸이 |
| **해상도** | ~512x300px (가로형) |
| **현재 입 상태** | rest (입 다문 상태) → **이것이 rest viseme** |

### 이 seed로부터 만들어야 할 것

seed_final.jpeg = **rest 상태** (입 다문 상태)
→ 이 캐릭터가 각 발음을 내는 모습 14장을 추가 생성 (총 15장)

---

## 3. 생성해야 할 15개 Viseme 이미지

### 3.1 이미지 목록

| # | Viseme ID | 입 모양 | 프롬프트 핵심 | 해당 음소 | 난이도 |
|---|-----------|---------|-------------|----------|--------|
| 1 | rest | 입 다문 상태 | **seed 원본 그대로** | (대기) | — |
| 2 | bilabial | 입술 꽉 다물기 | 두 입술을 꽉 다문 모습, 약간 힘 줌 | p, b, m | easy |
| 3 | labiodental | 윗니가 아랫입술 위 | **윗 앞니가 아랫입술 위에 살짝 올라간** 모습 | f, v | very_hard |
| 4 | **dental** | ★ 혀가 이빨 사이 | **혀끝이 윗니와 아랫니 사이로 살짝 보이는** 모습, 입은 약간 벌림 | θ, ð | very_hard |
| 5 | alveolar_stop | 혀끝 잇몸 접촉 | 입 살짝 벌림, 혀끝이 윗잇몸에 닿은 느낌 | t, d, n, l | very_hard |
| 6 | alveolar_fric | 이빨 맞물림 | 윗니와 아랫니가 거의 맞닿음, 좁은 틈 | s, z | moderate |
| 7 | postalveolar | 입 둥글게 앞으로 | **입술을 둥글게 앞으로 내밈** ("쉬" 할 때), 입 약간 벌림 | ʃ, tʃ | moderate |
| 8 | velar | 입 크게 벌림 | 입을 크게 벌림, 혀 뒷부분 올라간 느낌 | k, g, ŋ | easy |
| 9 | glottal | 입 벌리고 숨 | 입을 크게 벌리고 숨 내쉬는 모습, "하~" | h | easy |
| 10 | **open_front** | ★ 가장 크게 벌림 | **턱을 최대한 내리고 입을 가장 크게 벌린** 모습, 치아 보임 | æ, aɪ, aʊ | hard |
| 11 | mid_front | 중간 벌림 | 입을 중간 정도 벌림, /æ/보다 작게 | ɛ, eɪ | hard |
| 12 | **close_front** | ★ 넓게 웃기 | **입꼬리를 양 옆으로 넓게 당김**, "치즈~" 하듯, 치아 살짝 보임 | ɪ, iː, juː | hard |
| 13 | open_back | 둥근 O | **입을 크고 둥글게** 벌림, 세로로 길쭉한 O 모양 | ɒ, ɔɪ, ɑːr | hard |
| 14 | **close_back** | ★ 오므린 입 | **입술을 쭈~ 모으기**, 뽀뽀 모양, 작고 둥글게 | oʊ, uː, ʊ | easy |
| 15 | mid_central | 편안한 입 | 입에 힘 빼고 자연스럽게 약간 벌림, rest보다 살짝 open | ʌ, ɜːr | hard |

### 3.2 생성 우선순위

**★ 최우선 (한국 학생에게 가장 중요한 시각 차별화):**
1. `dental` — /θ/ 혀가 이빨 사이 (한국어에 없음)
2. `labiodental` — /f/ 윗니가 아랫입술 (ㅍ와 다름)
3. `open_front` — /æ/ 가장 크게 벌림 (/ɛ/와 혼동)
4. `close_front` — /iː/ 넓게 당김 (모음 구별)
5. `close_back` — /oʊ/ 오므린 입 (모음 구별)
6. `postalveolar` — /ʃ/ 둥글게 앞으로 (ㅅ와 다름)

**일반 우선순위:**
7. `open_back`, `mid_front`, `mid_central`, `alveolar_fric`, `alveolar_stop`

**낮은 우선순위 (rest와 비슷):**
8. `bilabial`, `velar`, `glottal`

---

## 4. 이미지 생성 방법

### 4.1 옵션 비교

| 방법 | 도구 | 장점 | 단점 | 비용 |
|------|------|------|------|------|
| **A: AI 이미지 편집** | Gemini / GPT-4o 이미지 편집 | seed 이미지 입력 → 입만 변경 요청, 캐릭터 일관성 높음 | 세밀한 입 제어 어려울 수 있음 | 무료~저가 |
| **B: VEED Fabric** | fal.ai VEED Fabric 1.0 | 음소별 립싱크 영상 → 프레임 추출, 가장 정확 | 영상 비용, 정적 이미지 추출 추가 작업 | ~$17 |
| **C: 수동 포토샵** | Photoshop / GIMP | 완벽한 제어 | 시간 많이 걸림 | 무료 (시간비용) |
| **D: Stable Diffusion img2img** | SD + ControlNet | seed 이미지 기반 변형, 입 영역만 inpainting | 셋업 필요, 일관성 관리 | 무료 |

### 4.2 추천: 옵션 A (AI 이미지 편집)

**이유:**
1. seed_final.jpeg를 직접 입력으로 사용 가능
2. "이 이미지에서 입만 /θ/ 발음 모양으로 변경해줘" 식의 자연어 프롬프트
3. Gemini 2.0 Flash / GPT-4o 모두 이미지 편집 지원
4. 15장 × 수 분 = **1시간 이내** 완료 가능
5. 비용 거의 없음

### 4.3 프롬프트 템플릿 (Gemini/GPT-4o용)

```
[공통 프리픽스]
이 이미지의 캐릭터와 스타일을 완벽히 유지하면서,
입 부분만 다음 발음을 내는 모습으로 변경해주세요.
나머지 (피부, 코, 볼, 머리카락, 배경) 모두 동일하게 유지.

[viseme별 설명]
- dental (th): 혀끝이 윗니와 아랫니 사이로 살짝 나와 보이는 모습. 입은 약간 벌려져 있음.
- labiodental (f): 윗 앞니가 아랫입술 위에 살짝 올라간 모습.
- open_front (æ): 턱을 최대한 내리고 입을 가장 크게 세로로 벌린 모습. 위아래 치아 보임.
- close_front (iː): 입꼬리를 양 옆으로 넓게 당긴 모습. "치즈~" 웃을 때처럼. 윗니 약간 보임.
- close_back (oʊ): 입술을 작고 둥글게 오므린 모습. 뽀뽀할 때처럼 입술을 앞으로 내밈.
- postalveolar (sh): 입술을 둥글게 앞으로 약간 내밈. "쉬~" 할 때의 입 모양.
- open_back (ɒ): 입을 크고 둥글게 벌림. 세로로 길쭉한 O 모양.
- mid_front (ɛ): 입을 중간 정도 벌림. /æ/보다 적게 벌리되 확실히 열려 있음.
- mid_central (ʌ): 입에 힘을 빼고 자연스럽게 약간 벌린 모습. 가장 편안한 입.
- alveolar_fric (s): 윗니와 아랫니가 거의 맞닿은 모습. 입이 좁게 열린 상태.
- alveolar_stop (t): 입 약간 벌림. 혀끝이 위쪽에 닿는 느낌.
- bilabial (p): 두 입술을 꽉 다문 모습. 약간 힘이 들어간 느낌.
- velar (k): 입을 크게 벌림. 혀 뒤쪽이 올라간 느낌.
- glottal (h): 입을 크게 벌리고 "하~" 숨을 내쉬는 모습.
```

---

## 5. 파일 구조 및 코드 통합

### 5.1 이미지 파일 구조

```
public/assets/images/mouth/
├── rest.webp              ← seed_final.jpeg를 webp로 변환
├── bilabial.webp
├── labiodental.webp       ← f, v
├── dental.webp            ← th (★ 혀 이빨 사이)
├── alveolar_stop.webp
├── alveolar_fric.webp
├── postalveolar.webp      ← sh, ch
├── velar.webp
├── glottal.webp
├── open_front.webp        ← æ (가장 크게)
├── mid_front.webp         ← ɛ
├── close_front.webp       ← iː (웃기)
├── open_back.webp         ← ɒ (둥근 O)
├── close_back.webp        ← oʊ (오므리기)
└── mid_central.webp       ← ʌ (편안)
```

**파일 사양:**
- 포맷: WebP (용량 절감) 또는 JPEG
- 크기: 512×300px (seed와 동일 비율) 또는 400×400px 정사각
- 용량: 각 20-50KB 예상, 총 ~500KB

### 5.2 코드 변경

**HumanMouthCharacter.tsx → 완전 교체**

```typescript
// 기존: SVG path 데이터로 렌더링
// 변경: viseme별 이미지 파일 로드

const MOUTH_IMAGES: Record<VisemeId, string> = {
    rest: '/assets/images/mouth/rest.webp',
    bilabial: '/assets/images/mouth/bilabial.webp',
    dental: '/assets/images/mouth/dental.webp',
    // ... 15개
};

export default function HumanMouthCharacter({ viseme, isSpeaking }: Props) {
    const src = MOUTH_IMAGES[viseme] || MOUTH_IMAGES.rest;
    return (
        <img src={src} alt="발음 입모양"
             className="w-full h-full object-cover rounded-xl" />
    );
}
```

**MouthVisualizer.tsx — 변경 최소**
- HumanMouthCharacter import 유지
- props 인터페이스 동일 유지
- LessonClient.tsx **변경 불필요**

### 5.3 기존 SVG 코드 정리

| 파일 | 조치 |
|------|------|
| `HumanMouthCharacter.tsx` | MOUTH_STATES 데이터 → 이미지 매핑으로 교체 |
| `MouthCrossSection.tsx` | 유지 (사이드뷰 토글용) |
| `public/assets/images/pronunciation/*.svg` | 이미 코드에서 미참조, 보존 |

---

## 6. 실행 계획

### Phase 1: 이미지 생성 (Antigravity / 사용자)

| 순서 | 작업 | 소요 |
|------|------|------|
| 1-1 | seed_final.jpeg를 Gemini/GPT-4o에 업로드 | 1분 |
| 1-2 | 최우선 6개 viseme 이미지 생성 (dental, labiodental, open_front, close_front, close_back, postalveolar) | 30분 |
| 1-3 | 품질 확인 → 불만족 시 재생성 | 15분 |
| 1-4 | 나머지 8개 viseme 생성 | 30분 |
| 1-5 | 전체 15장 WebP 변환, `public/assets/images/mouth/`에 배치 | 10분 |

**소요: ~1.5시간**

### Phase 2: 코드 통합 (Claude Code)

| 순서 | 작업 | 소요 |
|------|------|------|
| 2-1 | HumanMouthCharacter.tsx를 이미지 기반으로 교체 | 15분 |
| 2-2 | 빌드 검증 | 5분 |
| 2-3 | Playwright 스크린샷 QA (16개 유닛) | 10분 |

**소요: ~30분**

### Phase 3: QA (하이브리드)

| 순서 | 작업 | 소요 |
|------|------|------|
| 3-1 | 브라우저에서 전체 유닛 순회 테스트 | 30분 |
| 3-2 | 모바일 반응형 확인 | 15분 |
| 3-3 | 이미지 로딩 성능 확인 | 10분 |

**소요: ~1시간**

---

## 7. 일정 및 비용

| 항목 | 담당 | 소요 | 비용 |
|------|------|------|------|
| 이미지 생성 | Antigravity/사용자 | 1.5시간 | 무료 (Gemini/GPT-4o) |
| 코드 통합 | Claude Code | 30분 | — |
| QA | 하이브리드 | 1시간 | — |
| **합계** | | **~3시간** | **0원** |

---

## 8. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| AI 이미지 편집이 입 변형을 정확히 못함 | 중간 | 여러 도구 시도 (Gemini → GPT-4o → SD inpainting) |
| 캐릭터 일관성 깨짐 (얼굴이 달라짐) | 중간 | inpainting 마스크로 입 영역만 변경 |
| 특정 viseme가 구별 안 됨 (/ɛ/ vs /æ/) | 높음 | 텍스트 오버레이로 보조 (턱 벌림 정도 표시) |
| WebP 로딩 지연 | 낮음 | 이미지 프리로딩, 용량 최적화 |

---

## 9. 기존 Plan과의 관계

| 기존 Plan | 상태 | 본 Plan과의 관계 |
|-----------|------|-----------------|
| `pronunciation-character-animation` | SVG 기반 → **폐기** | 본 Plan으로 완전 교체 |
| `LIPSYNC_PLAN.md` (VEED Fabric 영상) | 보류 | 본 Plan 완료 후 선택적 추가 |
| `pronunciation-image-v2` (정적 이미지) | 보류 | seed 기반 이미지가 이를 대체 |
