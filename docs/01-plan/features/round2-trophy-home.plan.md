# Plan: round2-trophy-home

> CLAUDE_TASKS.md Round 2: 트로피 축하 팝업 + 홈 레이아웃 수정

## 1. 개요

레슨 완료 후 트로피 획득 시 축하 모달 팝업을 표시하고, 홈 화면의 하단 잘림 문제를 해결한다.

## 2. 작업 목록

### Task 2-A: 트로피 획득 축하 모달

**파일**: `src/app/lesson/[unitId]/page.tsx` — ResultsStep 컴포넌트

**현재 상태**:
- `newRewards` state 및 `REWARDS` import 이미 존재 (line 7, 54)
- ResultsStep에서 `unlockedRewardDefs`를 이미 계산 (line 678)
- 하단에 인라인 노란 카드로 트로피를 표시 중 (line 704~730)
- `playSFX('trophy')` 이미 호출 (line 671)

**변경 내용**:
1. 인라인 트로피 섹션을 **모달 오버레이**로 변경
   - 반투명 검정 배경 (`bg-black/50`)
   - 중앙 카드: emoji + name + description
   - `framer-motion`의 `motion.div`로 scale 애니메이션 (0→1, spring)
2. 모달 상태 관리
   - `showTrophyModal` state 추가
   - `newRewards` 변경 시 자동으로 모달 열기
   - 배경 클릭 또는 닫기 버튼으로 모달 닫기
3. Confetti 효과
   - CSS 애니메이션 기반 emoji 파티클 (🎉✨🎊)
   - `@keyframes confetti-fall` 정의 (인라인 또는 globals.css)

**참고**: `framer-motion`은 이미 의존성에 포함됨. `motion` import만 추가하면 됨.

### Task 2-B: 홈 화면 하단 잘림 수정

**파일**: `src/app/page.tsx`

**현재 상태**:
- 마스코트 영역이 `flex-1`로 남은 공간을 모두 차지 (line 84)
- w-48 h-48 마스코트 + signboard + "Tap to hear me!" 텍스트
- 375×667 뷰포트에서 "My Trophies" 버튼이 잘릴 수 있음

**변경 내용**:
- 마스코트 영역의 `flex-1` 제거 또는 제한
- 마스코트 크기 축소 (w-48 h-48 → w-36 h-36)
- 상하 간격/마진 축소 (`mb-8` → `mb-4`, `mb-6` → `mb-3` 등)
- 핵심: 375×667 뷰포트에서 스크롤 없이 My Trophies까지 모두 보이도록

## 3. 구현 순서

1. Task 2-A: ResultsStep에 모달 + confetti 추가
2. Task 2-B: 홈 화면 간격/크기 조정
3. `npm run build` 에러 0 확인

## 4. 영향 범위

- **코드 변경**: 2개 파일 (`lesson/[unitId]/page.tsx`, `page.tsx`)
- **새 의존성**: 없음 (framer-motion 이미 설치)
- **위험도**: 낮음 (UI 변경만)

## 5. 완료 기준

- [ ] 트로피 획득 시 모달 오버레이 + scale 애니메이션 + confetti 표시
- [ ] 모달에 emoji + name + description 표시
- [ ] `playSFX('trophy')` 호출
- [ ] 배경 클릭 또는 닫기 버튼으로 모달 닫기
- [ ] 375×667 뷰포트에서 My Trophies 버튼 완전히 보임
- [ ] `npm run build` 에러 0
