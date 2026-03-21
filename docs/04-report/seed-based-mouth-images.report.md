# Completion Report: seed-based-mouth-images

> Feature: `seed-based-mouth-images`
> Date: 2026-03-21
> Match Rate: **97%**
> Status: **Completed**

---

## 1. 요약

seed_final.jpeg 캐릭터를 기반으로 Gemini API(gemini-2.5-flash-image)를 사용하여 15개 viseme별 입모양 이미지를 생성하고, 기존 SVG 코드 기반 입모양을 완전히 교체했습니다.

```
[Plan] ✅ → [Do] ✅ → [Check] ✅ (97%) → [Report] ✅
```

---

## 2. 변경 내역

### 2.1 신규 파일

| 파일 | 유형 | 크기 |
|------|------|------|
| `public/assets/images/mouth/rest.jpeg` | seed 원본 (입 다문 상태) | ~50KB |
| `public/assets/images/mouth/dental.jpeg` | /θ/ 혀 이빨 사이 | ~1.7MB |
| `public/assets/images/mouth/labiodental.jpeg` | /f/ 윗니↔아랫입술 | ~1.7MB |
| `public/assets/images/mouth/open_front.jpeg` | /æ/ 가장 크게 벌림 | ~1.8MB |
| `public/assets/images/mouth/close_front.jpeg` | /iː/ 넓게 웃기 | ~1.7MB |
| `public/assets/images/mouth/close_back.jpeg` | /oʊ/ 오므린 입 | ~1.7MB |
| `public/assets/images/mouth/postalveolar.jpeg` | /ʃ/ 둥글게 앞으로 | ~1.7MB |
| `public/assets/images/mouth/open_back.jpeg` | /ɒ/ 둥근 O | ~1.7MB |
| `public/assets/images/mouth/mid_front.jpeg` | /ɛ/ 중간 벌림 | ~1.7MB |
| `public/assets/images/mouth/mid_central.jpeg` | /ʌ/ 편안한 입 | ~1.7MB |
| `public/assets/images/mouth/alveolar_fric.jpeg` | /s/ 이빨 맞물림 | ~1.7MB |
| `public/assets/images/mouth/alveolar_stop.jpeg` | /t/ 혀끝 잇몸 | ~1.7MB |
| `public/assets/images/mouth/bilabial.jpeg` | /m/ 입술 다문 | ~1.7MB |
| `public/assets/images/mouth/velar.jpeg` | /k/ 입 크게 | ~1.7MB |
| `public/assets/images/mouth/glottal.jpeg` | /h/ 숨 내쉬기 | ~1.7MB |
| `scripts/gen-mouth.ts` | 이미지 생성 스크립트 | — |

### 2.2 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `HumanMouthCharacter.tsx` | SVG 렌더링 → 이미지 파일 로드 방식으로 완전 교체 |
| `MouthVisualizer.tsx` | 복합 targetSound 처리 추가 (L122-124) |

### 2.3 변경 없는 파일 (인터페이스 호환)

| 파일 | 이유 |
|------|------|
| `LessonClient.tsx` | MouthVisualizer props 동일 |
| `visemeMap.ts` | phonemeToViseme 매핑 그대로 사용 |
| `pronunciationGuide.ts` | 텍스트 가이드 데이터 그대로 |
| `MouthCrossSection.tsx` | 미사용 상태 유지 |

---

## 3. 기술 결정

| 결정 | 선택 | 대안 | 근거 |
|------|------|------|------|
| 이미지 생성 도구 | Gemini 2.5 Flash Image API | GPT-4o, SD Inpainting | API 키 이미 보유, 한 번에 14/14 성공 |
| 이미지 포맷 | JPEG | WebP (Plan에서 권장) | seed가 JPEG, Gemini 출력이 JPEG |
| 렌더링 방식 | `<img>` 태그 | SVG 코드, Canvas | 가장 단순하고 안정적 |
| fallback 전략 | rest.jpeg | 기존 SVG | seed 캐릭터 일관성 유지 |

---

## 4. 품질 평가

### 4.1 캐릭터 일관성

| 항목 | 평가 |
|------|------|
| 피부 톤/질감 | ✅ 15장 전부 동일 |
| 코/볼/머리카락 | ✅ 변형 없음 |
| 귀걸이/옷깃 | ✅ 유지 |
| 입술 색상/질감 | ✅ 자연스러운 변화 |
| 전체 일관성 | ⭐⭐⭐⭐⭐ |

### 4.2 Viseme별 입모양 정확도

| Viseme | 음소 | 시각적 차별화 | 평가 |
|--------|------|-------------|------|
| open_front | /æ/ | 입 크게 벌림, 치아 보임 | ⭐⭐⭐⭐⭐ |
| close_front | /iː/ | 넓게 웃기, 치아 보임 | ⭐⭐⭐⭐⭐ |
| close_back | /oʊ/ | 오므린 입 | ⭐⭐⭐⭐ |
| glottal | /h/ | 크게 벌림 | ⭐⭐⭐⭐⭐ |
| dental | /θ/ | 치아 사이 혀 | ⭐⭐⭐⭐ |
| labiodental | /f/ | 윗니 아랫입술 | ⭐⭐⭐⭐ |
| postalveolar | /ʃ/ | 둥글게 앞으로 | ⭐⭐⭐ |
| bilabial | /m/ | 입술 다문 | ⭐⭐⭐ |
| open_back | /ɒ/ | 둥근 O | ⭐⭐⭐ |
| mid_front | /ɛ/ | 중간 벌림 | ⭐⭐⭐ |

### 4.3 이전 SVG 대비 개선도

| 항목 | SVG v5 (이전) | Seed 이미지 (현재) |
|------|-------------|------------------|
| 사실감 | 도형 조합 — 이질적 | 반실사 일러스트 — 자연스러움 |
| 캐릭터 느낌 | 살색 배경 + 빨간 타원 | 실제 사람 얼굴 일부 |
| 입모양 표현력 | path morphing 한계 | AI 기반 자연스러운 변형 |
| 파일 크기 | ~3KB (코드) | ~24MB (15장) → 최적화 필요 |
| 유지보수 | 코드 수정 필요 | 이미지 교체만으로 가능 |

---

## 5. 알려진 이슈 및 후속 작업

### 5.1 즉시 개선 가능

| # | 이슈 | 심각도 | 해결 방법 |
|---|------|--------|----------|
| 1 | 이미지 용량 과다 (각 ~1.7MB, 총 ~24MB) | 중 | WebP 변환 또는 JPEG 품질 조정으로 각 50-100KB 목표 |
| 2 | 일부 viseme 차별화 부족 (bilabial, postalveolar ≈ rest) | 중 | 프롬프트 강화 후 해당 이미지만 재생성 |
| 3 | `isVoiced`/`showAirflow` props 미사용 | 낮 | 이미지 위 오버레이로 활용 가능 |

### 5.2 중기 개선

| # | 항목 | 설명 |
|---|------|------|
| 1 | 이중모음 전환 표시 | /eɪ/, /aɪ/ 등 — 화살표 오버레이 또는 2장 연속 |
| 2 | 혼동 쌍 비교 모드 | /æ/ vs /ɛ/, /r/ vs /l/ 나란히 표시 |
| 3 | L3/L4 오디오 공유 | `l3_black` → `black.mp3` fallback 로직 |

---

## 6. 도구 및 비용

| 도구 | 용도 | 비용 |
|------|------|------|
| Gemini 2.5 Flash Image API | 14장 이미지 생성 | 무료 (API 크레딧 범위) |
| Playwright + Chromium | 16개 유닛 자동 스크린샷 QA | 무료 |
| npm run build | 빌드 검증 | — |

**총 비용: 0원**

---

## 7. PDCA 흐름 요약

| Phase | 일시 | 산출물 |
|-------|------|--------|
| Plan | 2026-03-21 | `docs/01-plan/features/seed-based-mouth-images.plan.md` |
| Do | 2026-03-21 | HumanMouthCharacter.tsx 교체, 15장 이미지 생성 |
| Check | 2026-03-21 | `docs/03-analysis/seed-based-mouth-images.analysis.md` (97%) |
| Report | 2026-03-21 | 본 문서 |
