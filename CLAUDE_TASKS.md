# Claude Code 작업 지시서

> 각 라운드별로 순차 진행. 완료되면 다음 라운드로 넘어갈 것.

---

## ~~이전 작업 (완료)~~
~~Task 1-5: streakDays, 마이크버튼, 리뷰유닛, 퀴즈셔플, BlendTap 수정 — 완료~~
~~Round 1: 빌드 검증 + CLAUDE.md 동기화 + Hydration 해소 — 완료~~

---

## ~~Round 2: 트로피 축하 팝업 + 홈 레이아웃 수정 — 완료~~

## ~~Round 3: QA 및 E2E 테스트(Browser Subagent) — 완료~~

## ~~Round 4: Capacitor Android 패키징 — 완료~~

## ~~Round 5: B2B/B2G 납품 문서 (Teacher's Guide / Privacy Policy) — 완료~~

---

## ~~Round 6: 고도화 (Viseme 립싱크 & Dark Mode) — 완료~~

### Task 6-A: 다크 모드 토글 테마 구현 (Claude Code)

**관련 파일**: `src/app/settings/page.tsx`, `src/app/globals.css`, `tailwind.config.ts`

**우선순위**: 높음

**요구사항**:
1. `tailwind.config.ts`에 `darkMode: 'class'` 설정.
2. `src/app/settings/page.tsx`에 '테마 변경' 토글 버튼 추가.
3. Zustand 혹은 로컬 스토리지(`localStorage` / IndexedDB)를 통해 테마 상태(`light` \| `dark`)를 전역으로 유지하고 초기 로딩 타임에 복원.
4. 주요 화면(레슨 화면, 설정, 보상 화면)의 배경색(`bg-white` → `dark:bg-slate-900`)과 텍스트 색상(`text-slate-800` → `dark:text-slate-200`) 대응.

---

### Task 6-B: Viseme(입모양) 뷰 컴포넌트 셋업 (Antigravity & Claude Code 협업)

**관련 파일**: `src/app/lesson/[unitId]/page.tsx`, `public/assets/visemes/`

**우선순위**: 중간

**요구사항 (이번 라운드에서 Claude Code의 목표)**:
1. `Say & Check` 단계에서 STT를 통해 음색을 녹음할 때 또는 TTS 발음 시 화면 중앙 하단 쪽에 **캐릭터 입모양(Viseme)을 표시할 React 요소(Placeholder)**를 삽입.
2. 현재는 TTS의 시간 분할(Timing) 데이터 추출이 어려우므로 **무작위 입모양(또는 단순 애니메이션 2프레임)**으로 말하는 시늉만 하는 컴포넌트 `<VisemeAvatar isSpeaking={true|false} />`를 작성하여 `Say & Check` 단계 UI에 배치.
3. Antigravity가 추후 SVG 에셋을 제공하여 해당 컴포넌트를 고도화할 예정이므로, 상태를 `isSpeaking` prop으로 쉽게 조정할 수 있게 분리.


```bash
npm run build
```
빌드 에러 0이면 완료.

---

## Round 7: MVP 최종 품질 검증 (QA & 안정화) [현재]

### Task 7-A: 데이터 초기화 로직 무결성 검증 (Claude Code)
**설명**: 
- 설정 메뉴의 `초기화(Reset Progress)` 기능 실행 시 Dexie.js DB(`cards`, `units`, `rewards`) 내용과 Zustand 전역 상태가 충돌 없이 완벽히 롤백되는지 확인하세요.
- 필요 시, 초기화 과정 중 UI 피드백(toast나 예외처리)이 들어가 있는지 점검하고 보강하세요.

### Task 7-B: Hydration Warning 및 콘솔 에러 정리 (Claude Code)
**설명**:
- 앱 전체 구동 중 브라우저 콘솔에 찍히는 `Hydration failed` 오류나 Warning을 식별하고 해결하세요.
- `use client` 로드 시점과 SSR 시점 차이에서 오는 문제는 `next/dynamic` 혹은 `useEffect`를 활용해 다듬어주세요.

### Task 7-C: Capacitor 빌드 커맨드 최종 검토 (Claude Code)
**설명**:
- `npm run build` 스크립트 실행 후 `npx cap sync` 커맨드가 에러 없이 떨어지는지(Android 플랫폼 동기화) 로컬 터미널에서 최종 점검 하세요.

---

## ~~Round 4: Capacitor Android 패키징 (Round 3은 Antigravity가 수행)~~

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
