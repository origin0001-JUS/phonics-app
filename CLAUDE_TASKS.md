# Claude Code 작업 지시서

> 각 라운드별로 순차 진행. 완료되면 다음 라운드로 넘어갈 것.

---

## ~~이전 작업 (완료)~~
~~Task 1-5: streakDays, 마이크버튼, 리뷰유닛, 퀴즈셔플, BlendTap 수정 — 완료~~
~~Round 1: 빌드 검증 + CLAUDE.md 동기화 + Hydration 해소 — 완료~~

---

## ~~Round 2: 트로피 축하 팝업 + 홈 레이아웃 수정 — 완료~~

### Task 2-A: 트로피 획득 축하 모달 추가

**관련 파일**: `src/app/lesson/[unitId]/page.tsx` (결과 화면 부분)

**현재 상태**: `saveLessonResults()`가 `newlyUnlocked: string[]` (해금된 트로피 ID 배열)을 반환함. 하지만 결과 화면에서 이를 사용자에게 보여주지 않음.

**수정 요구사항**:
1. 결과 화면(ResultsScreen)에서 `newlyUnlocked` 배열이 비어있지 않으면 **축하 모달**을 표시
2. 모달 UI:
   - 반투명 오버레이 배경
   - 중앙에 카드: 해금된 트로피의 emoji + name + description (REWARDS 데이터에서 가져옴)
   - framer-motion으로 scale 애니메이션 (0 → 1, spring)
   - 배경에 confetti 효과 (간단한 CSS 애니메이션이나 emoji 파티클)
3. `playSFX('trophy')` 호출 (`src/lib/audio.ts`에서 import)
4. 모달 닫기 버튼 또는 배경 클릭으로 닫기

**참고 코드**:
```typescript
import { REWARDS } from '@/data/rewards';
import { playSFX } from '@/lib/audio';

// 결과 화면에서:
const rewardDefs = newlyUnlocked.map(id => REWARDS.find(r => r.id === id)).filter(Boolean);
if (rewardDefs.length > 0) {
    playSFX('trophy');
    // 모달 표시
}
```

---

### Task 2-B: 홈 화면 하단 잘림 수정

**파일**: `src/app/page.tsx`

**문제**: 모바일 화면(375px 너비)에서 하단의 "My Trophies" 버튼이 뷰포트 아래로 잘림.

**수정 방법**:
- 전체 레이아웃을 `min-h-[100dvh]`에서 스크롤 가능하게 하거나
- 마스코트 영역(`flex-1`)의 크기를 줄여서 버튼 영역이 보이도록 패딩/간격 조정
- 핵심: 스크롤 없이도 375×667 뷰포트에서 My Trophies까지 보여야 함

---

### 완료 후 확인

```bash
npm run build
```
빌드 에러 0이면 완료.

---

## Round 4: Capacitor Android 패키징 (Round 3은 Antigravity가 수행)

### Task 4-A: Capacitor 설치 및 초기화

**수정 요구사항**:
1. `@capacitor/core`, `@capacitor/cli` 설치
2. `npx cap init "Phonics 300" "com.phonics300.app"` 실행
3. `capacitor.config.ts` 생성 (webDir: 'out')
4. `next.config.ts`에 `output: 'export'` 추가 (정적 빌드)
5. `@capacitor/android` 설치 + `npx cap add android`
6. `npm run build` → `npx cap sync`
7. Android 프로젝트가 생성되었는지 확인

> ⚠️ Round 2 완료 후에 진행할 것. Round 3은 Antigravity가 브라우저 테스트를 수행하므로 건너뜀.
