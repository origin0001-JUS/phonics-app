# Gap Analysis: seed-based-mouth-images

> Feature: `seed-based-mouth-images`
> Date: 2026-03-21
> Match Rate: **97%**

---

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 97% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **97%** | **PASS** |

---

## Checklist Results

| # | 항목 | 결과 | 상세 |
|---|------|:----:|------|
| 1 | 15개 viseme 이미지 존재 | ✅ | 15/15 모두 public/assets/images/mouth/ 에 있음 |
| 2 | HumanMouthCharacter.tsx 이미지 기반 | ✅ | SVG 코드 완전 제거, `<img>` 렌더링 |
| 3 | MouthVisualizer.tsx 통합 | ✅ | 비디오 우선 → 이미지 fallback 구조 |
| 4 | LessonClient.tsx 변경 없음 | ✅ | 동일 인터페이스 유지 |
| 5 | 빌드 통과 | ✅ | npm run build 확인 완료 |
| 6 | 복합 targetSound 처리 | ✅ | "θ ð w" → 첫 번째 매칭 음소 사용 |
| 7 | 이미지 없을 시 rest.jpeg fallback | ✅ | 2단계 fallback (매핑 + onError) |

## Gap 발견

| 항목 | Plan | 구현 | 영향 |
|------|------|------|------|
| 이미지 포맷 | .webp | .jpeg | 낮음 — 기능 동일, seed가 JPEG이므로 자연스러운 선택 |

## 미사용 Props (정리 가능)

- `isVoiced`, `showAirflow` props가 HumanMouthCharacter에 존재하나 이미지 모드에서 시각 효과 없음
- 향후 오버레이 표시로 활용 가능하므로 보존 권장

## 결론

Match Rate **97%** — PASS. `/pdca report` 진행 가능.
