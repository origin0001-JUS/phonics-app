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
  - Capacitor Android 빌드 커맨드(`npx cap sync`) 무결성 재확인 하세요.

---

## Round 8: 사용자 매뉴얼 QA 피드백 반영 [현재]

### Task 8-A: 온보딩 진입 기준 명칭 변경 (Claude Code)
**설명**: 
- 기존 온보딩 화면에서 '몇 학년이세요?' 및 '1학년', '2학년' 등으로 표기되던 기준을 학습자의 실제 '수준(Level)' 기반으로 변경합니다.
- `src/app/onboarding/page.tsx` 등 관련 파일에서 텍스트를 "현재 학습 수준을 선택해 주세요." 및 "Level 1 (처음 시작)", "Level 2" 등으로 자연스럽게 수정하세요. 

### Task 8-B: 온보딩 안내 음성 개선 (Claude Code)
**설명**:
- 온보딩 화면 진입 시 나오는 음성 안내(TTS)가 영어만 나오거나 한국어만 나오지 않고, **"영어 안내 후 한국어 안내"**가 연달아 나오도록 수정하세요.
- 예: "Choose your level! 현재 학습 수준을 선택해 주세요." 와 같이 하나의 텍스트 스트링 또는 순차적 재생 로직을 구현하세요.

### Task 8-C: Blend & Tap 개별 음소 사운드 연동 (Claude Code)
**설명**:
- `Blend & Tap` 단계(`src/app/lesson/[unitId]/BlendTap.tsx` 또는 관련 컴포넌트)에서 개별 알파벳 박스를 누를 때 단순한 '띡(효과음)' 소리가 나는 문제를 수정합니다.
- 각 박스를 탭할 때마다 **해당 알파벳의 정확한 파닉스 음가 오디오**가 재생되도록 로직을 추가하세요. (TTS 호출 또는 기존 오디오 파일 매핑 방식 활용) 알파벳을 다 누른 후 전체 단어 소리가 나오는 기존 로직은 유지합니다.

### Task 8-D: Micro-Reader 한국어 번역 추가 (Claude Code)
**설명**:
- 문장 읽기 단계(`src/app/lesson/[unitId]/MicroReader.tsx` 또는 관련 컴포넌트)에서 사용자가 문장을 읽고 발음(음성)을 들은 후, 화면에 해당 문장의 **한국어 번역(뜻)**이 노출되도록 추가하세요.
- 번역 데이터는 아마도 `units.json` 내의 `sentence.ko` 속성 등을 활용하면 됩니다.

### Task 8-E: 보상(My Trophies) 화면 UI 잘림 현상 해결 (Claude Code)
**설명**:
- `src/app/rewards/page.tsx` 화면에서 기기 해상도나 테마에 따라 트로피 타이틀 텍스트나 날짜가 박스 영역을 벗어나거나 잘리는(Overflow) 현상을 수정하세요.
- Tailwind CSS의 `truncate`, `whitespace-normal`, 패딩/마진 조절, 반응형 텍스트 크기 단위 등을 통해 모바일/웹 환경 모두에서 글자가 온전히 표시되도록 레이아웃을 최적화하세요.

```bash
npm run build
```
빌드 에러 0이면 8라운드 완료.

---

## Round 9: 디테일 폴리싱 및 오디오/비주얼 동기화 [진행 대기]

### Task 9-A: Blend & Tap 오디오 시차 적용 (Claude Code)
**설명**:
- `src/app/lesson/[unitId]/BlendTap.tsx` 컴포넌트에서 사용자가 마지막 음소(음절)를 터치할 때, "해당 음소의 소리가 완전히 재생된 후"에 전체 단어 소리가 약 0.5초~1초 뒤에 재생되도록 분리하세요.
- 마지막 음소 소리와 전체 단어 뜻 발음이 동시에 섞여 들리지 않도록 `setTimeout`을 활용하여 딜레이 처리하세요.

### Task 9-B: 퀴즈 액션 오디오 분리 (Claude Code)
**설명**:
- `src/app/lesson/[unitId]/DecodeWords.tsx` 및 `ExitTicket.tsx`에서 정답/오답 버튼을 눌렀을 때 작동하는 사운드 오버랩 발생을 수정하세요.
- 버튼 터치 즉시 '효과음(Correct/Wrong)'이 **먼저** 재생되고, 그로부터 약 `0.5초` 뒤에 실제 해당 단어의 발음 오디오가 이어서 나오도록 분리 연출하세요.

### Task 9-C: 입모양(Viseme) 클로즈업 정밀 구현 준비 (Claude Code)
**설명**:
- `src/app/lesson/[unitId]/VisemeAvatar.tsx` 내에서 기존의 고정형 여우 얼굴을 걷어내고, "여우의 입술 부분만 줌인(Zoom-in) 된 UI"로 SVG 구조를 개편하세요.
- 음원이 재생될 때 `isSpeaking` 상태에 맞춰 입술 모양 트랜지션 애니메이션 프레임워크를 잡아두세요. (단순 CSS 토글이 아닌 Framer Motion 방식 등을 사용하여, 향후 a, e, i, o, u 발음에 맞춘 SVG Path를 교체하기 쉽도록 틀을 짭니다.)

### Task 9-D: My Trophies 화면 통째로 잘림 해결 (Claude Code)
**설명**:
- `src/app/rewards/page.tsx` 모바일 해상도에서 리스트 하단 텍스트 및 날짜가 짤리는 현상을 근원적으로 해결하세요. 스크롤 뷰(`overflow-y-auto`) 영역의 padding-bottom을 대폭 늘리거나 부모 flex 레이아웃 구조를 검토하세요.

```bash
npm run build
```
빌드 에러 0이면 완료.

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
