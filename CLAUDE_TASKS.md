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
3. Zustand 혹은 로컬 스토리지(`localStorage` / IndexedDB)를 통해 테마 상태(`light` | `dark`)를 전역으로 유지하고 초기 로딩 타임에 복원.
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

## ~~Round 7: MVP 최종 품질 검증 (QA & 안정화) — 완료~~

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

## ~~Round 8: 사용자 매뉴얼 QA 피드백 반영 — 완료~~

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

## ~~Round 9: 디테일 폴리싱 및 오디오/비주얼 동기화 — 완료~~

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
빌드 에러 0이면 9라운드 완료.

---

## ~~Round 10: 교과서/교재 기반 커리큘럼 데이터 병합 — 완료~~

> 프로젝트 루트의 `phonics300_upgrade_data.json` 파일을 데이터 소스로 사용하세요.
> 이 JSON의 구조를 먼저 읽고 아래 Task를 순서대로 진행해 주세요.

### Task 10-A: microReading 문장 교체 (Claude Code) — 우선순위 1
**설명**:
- `src/data/curriculum.ts`의 각 유닛 오브젝트에 있는 `microReading: string[]` 배열을,
  `phonics300_upgrade_data.json` > `upgraded_micro_readings` 섹션의 데이터로 **교체**하세요.
- JSON에 키가 있는 유닛(unit_01, unit_02, unit_03, unit_04, unit_05, unit_07~unit_11, unit_13~unit_17, unit_19~unit_23)만 교체합니다.
- JSON에 없는 유닛(unit_06, unit_12, unit_18, unit_24 등 리뷰 유닛)은 현재 값을 그대로 유지합니다.

### Task 10-B: 교과서 추가 단어 반영 (Claude Code) — 우선순위 2
**설명**:
- `phonics300_upgrade_data.json` > `additional_words_by_unit` 섹션에 있는 단어들을 해당 유닛의 `words` 배열 **끝에** 추가하세요.
- 기존 `w()` 헬퍼 함수를 사용하여 추가합니다: `w("dad", "dad", ["d", "æ", "d"], "아빠")`
- **중복 체크**: 기존 words 배열에 이미 같은 `id`의 단어가 있다면 추가하지 마세요.
- 영향 유닛: unit_01, unit_02, unit_03, unit_04, unit_05, unit_07, unit_17, unit_20, unit_21

### Task 10-C: WordData 인터페이스에 onset/rime 필드 추가 (Claude Code) — 우선순위 3
**설명**:
1. `src/data/curriculum.ts` 상단의 `WordData` 인터페이스에 **optional** 필드 3개를 추가하세요:
```typescript
export interface WordData {
    id: string;
    word: string;
    phonemes: string[];
    meaning: string;
    imagePath: string;
    audioPath: string;
    onset?: string;     // 추가
    rime?: string;      // 추가
    wordFamily?: string; // 추가
}
```
2. `w()` 헬퍼 함수의 시그니처에도 optional 파라미터를 추가하세요:
```typescript
function w(id: string, word: string, phonemes: string[], meaning: string, onset?: string, rime?: string, wordFamily?: string): WordData {
    return {
        id, word, phonemes, meaning,
        imagePath: `/assets/images/${id}.svg`,
        audioPath: `/assets/audio/${id}.mp3`,
        ...(onset && { onset }),
        ...(rime && { rime }),
        ...(wordFamily && { wordFamily }),
    };
}
```
3. `phonics300_upgrade_data.json` > `onset_rime_data` 섹션에 있는 **기존** 단어들의 `w()` 호출에 onset, rime 인자를 추가하세요. (기존 `w("cat", "cat", ["k","æ","t"], "고양이")` → `w("cat", "cat", ["k","æ","t"], "고양이", "c", "at", "-at")`)
4. Task 10-B에서 추가한 새 단어들에도 JSON의 onset/rime/wordFamily 데이터를 반영하세요.
5. `onset_rime_data`에 없는 단어는 그대로 둡니다 (optional이므로 에러 없음).

```bash
npm run build
```
빌드 에러 0이면 10라운드 완료.

---

## ~~Round 11: 교수법 기반 게임 고도화 — 완료~~

> `phonics300_upgrade_data.json`과 `phonics300_업그레이드_데이터.md`를 참조하세요.

### Task 11-A: Sound Focus에 Minimal Pair 퀴즈 삽입 (Claude Code) — 우선순위 4
**설명**:
- `src/app/lesson/[unitId]/LessonClient.tsx`의 `SoundFocusStep` 컴포넌트를 수정하세요.
- 기존 소리 듣기 후 넘어가는 단순 흐름에, **Minimal Pair 대비 퀴즈**를 추가합니다.
- `phonics300_upgrade_data.json` > `minimal_pairs` 섹션의 데이터를 활용하세요.
- **구현 로직**:
  1. 해당 유닛에 매핑된 minimal pair가 있으면, Sound Focus 마지막 페이지에 퀴즈 추가
  2. 두 단어의 TTS 소리를 재생 → 사용자가 "어떤 소리인지" 선택하는 2지선다 퀴즈
  3. 예: unit_01에서 "bat" vs "bet" 소리 재생 → 올바른 단어 터치
- minimal pair 데이터가 없는 유닛(리뷰 유닛 등)은 기존 흐름 유지

### Task 11-B: Blend & Tap에 Onset-Rime 2단계 모드 추가 (Claude Code) — 우선순위 5
**설명**:
- `src/app/lesson/[unitId]/LessonClient.tsx`의 `BlendTapStep` 컴포넌트를 수정하세요.
- 현재: `[k] [æ] [t]` (phoneme 3타일) → 변경: `[c] + [at]` (onset + rime 2타일, **교재 방식**)
- **구현 로직**:
  1. `word.onset`과 `word.rime`이 존재하면 → **Onset-Rime 모드** (2타일)
  2. 존재하지 않으면 → **기존 Phoneme 모드** (n타일) 폴백
  3. Onset-Rime 모드 시 화면에 먼저 rime 타일(`[at]`)을 보여주고, onset 타일(`[c]`)을 탭하면 합쳐져서 단어가 완성되는 애니메이션 구현
  4. 하단에 같은 rime을 공유하는 Word Family 목록을 작게 표시 (예: `-at family: bat, cat, hat, mat`)
- 타일 색상은 Task 11-C의 컬러코딩을 따름

### Task 11-C: 컬러코딩 시스템 도입 (Claude Code) — 우선순위 6
**설명**:
- `BlendTapStep`, `SoundFocusStep` 등 phoneme/글자 타일을 표시하는 모든 곳에 **컬러코딩**을 적용하세요.
- **규칙** (Tailwind CSS 클래스 사용):
  - 모음(Vowel: a, e, i, o, u): `text-red-500` (빨간 계열)
  - 자음(Consonant): `text-blue-600` (파란 계열)
  - 블렌드/다이그래프(sh, 대h, th, bl, cr 등): `text-emerald-600` (초록 계열)
  - Silent e: `text-gray-300 opacity-50` (흐림 처리)
  - Rime 덩어리: `text-amber-600` (주황 계열) — Onset-Rime 모드에서 rime 타일에 적용
- 유틸 함수를 하나 만들어서 phoneme/글자 문자열을 입력받으면 해당 Tailwind 클래스를 반환하도록 구현하세요.

```bash
npm run build
```
빌드 에러 0이면 11라운드 완료.

---

## ~~Round 12: V2 TTS 전면 업그레이드 (ElevenLabs 멀티 보이스) — 완료~~

### Task 12-A: ElevenLabs TTS 스크립트 실행 환경 점검 (Claude Code)
**설명**:
- 프로젝트 루트의 `.env.local` 파일에 `ELEVENLABS_API_KEY` 환경 변수가 설정되어 있는지 확인하세요.
- 설정되어 있지 않다면 사용자에게 발급받은 API 키 입력을 요청하여 파일에 추가하세요.

### Task 12-B: 누락된 오디오 자산 파악 (Claude Code)
**설명**:
- 먼저 터미널에서 `npx tsx scripts/audit-audio.ts`를 실행하여 현재 `public/assets/audio/` 폴더 내에 부족하거나 남는 MP3 파일 숫자를 파악하세요. (보고용)

### Task 12-C: ElevenLabs 전체 MP3 일괄 재생성 (Claude Code)
**설명**:
- 기존 구글 보이스와 톤이 섞이지 않도록 전체 오디오를 덮어씁니다.
- 터미널에서 `npx tsx scripts/generate-tts.ts --force` 명령을 실행하세요.
- (참고: API 제한으로 시간이 몇 분 이상 걸릴 수 있습니다. 실행이 완료될 때까지 대기하세요.)
- 완료 후 다시 `npx tsx scripts/audit-audio.ts`를 실행하여 누락된 파일이 '0'개가 되었는지 확인하세요.

### Task 12-D: audio.ts 폴백 핸들링 강화 (Claude Code)
**설명**:
- `src/lib/audio.ts` 파일을 수정하여, `playWordAudio`와 `playSentenceAudio`에서 파일 로드 실패(404 등) 시 콘솔에 `⚠️ Missing audio: {파일이름} — falling back to browser TTS` 형식으로 명시적 경고(warning)를 출력하도록 개선하세요.
- `fallbackTTS` 함수가 실제로는 최대한 호출되지 않아야 한다는 점을 주석으로 남기세요.

### Task 12-E: 최종 빌드 및 검수 (Claude Code)
**설명**:
- 변경사항에 에러가 없는지 `npm run build`를 실행하여 빌드 에러 0건을 확인하세요.
- 사용자에게 `npm run dev`를 통해 브라우저에서 ElevenLabs 오디오(단어는 Rachel, 문장은 Drew/Laura)가 잘 나오는지 확인해 달라고 안내하세요.

---

## Round 13: 모바일 기기 테스트 QA 수정 (하이브리드 R&R) [진행 대기]

### Task 13-A: 홈 화면 Foxy 인사말 음성 교체 (Claude Code)
**설명**:
- `scripts/generate-tts.ts` (또는 수동 API 호출 등)를 사용하여 "Hi I'm Foxy! 안녕! 나는 폭시야! 같이 파닉스를 배워보자!" 라는 내용을 ElevenLabs 고음질 음성으로 변환하여 `public/assets/audio/hi_im_foxy.mp3`로 저장하세요.
- `src/app/page.tsx` 내 Foxy 캐릭터 클릭 시 실행되는 `window.speechSynthesis` 코드를 지우고, 대신 `const audio = new Audio('/assets/audio/hi_im_foxy.mp3'); audio.play();`를 사용하도록 수정하세요.

### Task 13-B: 모바일 오디오 프리로드 모듈 적용 (Claude Code)
**설명**:
- `src/lib/audio.ts` 파단에 여러 URL 배열을 받아 백그라운드에서 `new Audio(url).load()`를 실행해주는 유틸 함수 `preloadAudioFiles(urls: string[])`를 작성하세요.
- `src/app/lesson/[unitId]/LessonClient.tsx`의 마운트 시점(`useEffect`)에서, 이번 레슨에 사용되는 6개 단어(`lessonWords`) 및 Minimal Pair 대상 단어들의 MP3 URL들을 모아 `preloadAudioFiles`에 넘기세요. 이를 통해 모바일 브라우저의 오디오 재생 지연(첫 탭 시 무음 현상)을 해결하세요.

### Task 13-C: Onset-Rime UI 독립 버튼 2-Step 분리 (Claude Code)
**설명**:
- `LessonClient.tsx` 내부 `BlendTapStep` 컴포넌트의 Onset-Rime 모드를 개편하세요.
- 현재 `<button>`(Onset) 버튼 하나만 존재하는데, `<button onClick={tapRime}>` 형태로 Rime 타일도 상호작용 가능한 버튼으로 만드세요.
- Onset 탭 시 초성 소리 재생, Rime 탭 시 종성 소리 재생하도록 `onsetTapped`, `rimeTapped` 상태를 각각 독립 관리하세요.
- 두 상태가 모두 `true`가 될 때에만 병합 애니메이션과 함께 전체 단어(예: Cat)가 소리나도록 타이밍 로직을 수정하세요.

### Task 13-D: 레슨 진행 상태 Session Storage 백업 (Claude Code)
**설명**:
- `LessonClient.tsx`의 `stepIndex`, `score`, `totalQuestions` 등 진단 상태를 로컬 `useState`로만 관리하지 말고, 렌더링 후 `useEffect`에서 `sessionStorage.getItem('lesson_state_' + unitId)`를 읽어 복원하는 로직을 추가하세요.
- 사용자가 진행할 때마다 해당 상태를 `sessionStorage.setItem`으로 저장하세요. (모바일 브라우저 메모리 회수에 의한 강제 새로고침 방어)
- `ResultsStep`으로 진입하여 레슨이 정상 종료되면, `sessionStorage.removeItem`으로 해당 세션을 파기하여 깔끔하게 정리하세요.

### Task 13-E: Minimal Pair 퀴즈 로직 고도화 (Claude Code)
**설명**:
- `LessonClient.tsx` 내 `SoundFocusStep` 컴포넌트의 퀴즈 로직을 대대적으로 수정하세요.
- 첫째, 현재 접속 중인 레슨 유닛의 소리가 들어간 단어만 무조건 정답이 되지 않도록 퀴즈 데이터를 섞은 뒤 정답을 무작위로 1개 선택하세요 (예: a vs e 학습에서 e 단어가 정답으로 스피커에서 나올 수도 있음).
- 둘째, 사용자가 정답/오답을 고른 후 하단에 "Compare Sounds" 명목으로 두 대비쌍 단어를 나란히 `<button>`으로 배치하여, 각각 탭하면 소리(`playWordAudio`)가 나오게 만들어 직접 차이를 귀로 습득하게 설계하세요.

```bash
npm run build
```
빌드 에러 0이면 13라운드 완료.


---

## Round 14: AI 립싱크 영상 재생 통합 (하이브리드 R&R)

> ⚠️ **진행 일정 (Phased Approach)**
> 현재 수기(수작업) 영상 80여개가 제작 중입니다. 따라서 이번 접속에서는 **Phase 1(샘플 테스트)**만 진행하고 멈춥니다.
> 앱 통합 코딩 및 누락분 일괄 생성은 80개 영상이 모두 확보된 후 **Phase 2**에서 진행합니다.

### --- Phase 1: 샘플 테스트 (현재 진행) ---

### ~~Task 14-A: representativeWords.ts 신규 생성 (Claude Code) — 완료~~
**설명**:
- `HANDOFF.md`에 기재된 대로 웹 세션에 이미 완료되었습니다.

### Task 14-A-2: VEED Fabric 샘플 테스트 스크립트 실행 (Claude Code)
**설명**:
- 터미널에서 `npm run test-fabric-sample` (또는 `npx tsx scripts/test-veed-fabric-sample.ts`)을 실행하세요.
- 이 스크립트는 `thin`, `cat`, `fish` 3개 단어에 대한 MP4 샘플을 `public/assets/video/samples/` 경로에 생성합니다.
- 실행 중 에러가 발생하면 스크립트를 디버깅하고, 완료되면 Antigravity 챗(사용자)에게 **"샘플 생성이 완료되었습니다. 품질을 확인해 주세요"**라고 알린 후 **이번 세션(Round 14)을 일시정지** 하세요.

### --- Phase 2: 실제 통합 및 일괄 생성 (추후 대기) ---
- `src/data/representativeWords.ts` 파일을 새로 만드세요.
- `AI_avatar_guide.md.md` 파일의 `src/data/representativeWords.ts` 코드 블록을 **그대로** 사용하세요.
- 포함 내용:
  - `representativeWords`: unit_01~unit_37 전체 대표 단어 맵 (Record<string, string[]>)
  - `allVideoWords`: Set으로 중복 제거된 전체 대표 단어
  - `hasLipSyncVideo(word: string): boolean`
  - `getLipSyncVideoPath(word: string): string | null` → `/assets/video/{word}.mp4`
  - `getSoundFocusVideoPath(unitId: string): string | null` → `/assets/video/sound_XX.mp4`

### Task 14-B: 발음 참조 이미지 17장 일괄 생성 (Claude Code - Local API Key 활용)
**설명**:
- `docs/PRONUNCIATION_IMAGE_GUIDE.md` 파일에 정의된 17개의 발음 이미지 프롬프트 목록과 스타일 가이드를 확인하세요. (모든 프롬프트는 텍스트 라벨 포함 필수 규칙이 추가되어 있습니다.)
- 현재 사용자의 터미널 환경에 유료 API 설정(예: `GEMINI_API_KEY` 또는 기타 이미지 생성 API 환경 변수)이 되어 있습니다.
- `scripts/generate-pronunciation-images.ts` 스크립트를 새로 작성하여, 가이드 문서의 프롬프트를 바탕으로 17장의 이미지를 자동 생성하고 `public/assets/images/pronunciation/` 경로에 `.webp` 형식으로 저장하는 일괄 자동화 파이프라인을 구축 및 실행하세요.
- 실행이 완료되면 Antigravity 챗(사용자)에게 "발음 이미지 17장 생성이 완료되었습니다. 품질 및 텍스트 포함 여부를 검수해 주세요"라고 알리세요.

### Task 14-C: MouthVisualizer.tsx 비디오 레이어 추가 (Claude Code)
**설명**:
- `src/app/lesson/[unitId]/MouthVisualizer.tsx`를 수정하세요.
- 상단에 `import { getLipSyncVideoPath } from '@/data/representativeWords';` 추가
- `MouthVisualizer` 컴포넌트 내부에서:
  1. `const videoPath = currentWord ? getLipSyncVideoPath(currentWord) : null;` 계산
  2. `const [videoError, setVideoError] = useState(false);` 상태 추가
  3. `currentWord`가 바뀔 때마다 `setVideoError(false)` 리셋하는 `useEffect` 추가
  4. 프론트 뷰 컨테이너(Line 135~141) 내부를 조건부 렌더링으로 교체:
     - `videoPath && isSpeaking && !videoError` 이면 → `<video src={videoPath} autoPlay playsInline muted={false} className="w-full h-full object-cover rounded-2xl" onError={() => setVideoError(true)} />` 재생
     - 그 외 → 기존 `<FrontViewPlaceholder viseme={viseme} isSpeaking={isSpeaking} />` 유지
- **기존 MouthCrossSection(단면도)은 영상 옆에 그대로 유지**하세요. 절대 제거하지 마세요.

### Task 14-D: LessonClient.tsx에 MouthVisualizer 삽입 (Claude Code)
**설명**:
- `src/app/lesson/[unitId]/LessonClient.tsx`를 수정하세요.
- 상단 import에 `import { getSoundFocusVideoPath } from '@/data/representativeWords';` 추가

**sound_focus 스텝 수정:**
- `SoundFocusStep` 컴포넌트 내부(퀴즈 전 메인 화면)에서 소리 소개 영상을 추가하세요.
- `getSoundFocusVideoPath(unit.id)`가 null이 아니면:
  - `<video>` 태그로 재생 (autoPlay, playsInline, loop, className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg")
  - `onError` 시 해당 `<video>`를 숨기는 폴백 처리
- 영상이 null이면 기존 UI 그대로 유지

**blend_tap 스텝 수정:**
- `BlendTapStep` 컴포넌트에서 현재 단어 표시 영역 근처(예: 타일들 위)에 `<MouthVisualizer currentWord={word.word} currentPhoneme={...} isSpeaking={...} compact />` 삽입
- 대표 단어이면 자동으로 영상이 나오고, 아니면 기존 SVG가 표시됩니다.

**say_check 스텝:**
- 이미 MouthVisualizer를 사용 중이므로 `currentWord` prop이 전달되고 있는지만 확인하세요. 전달되고 있다면 자동으로 영상이 적용됩니다.

**변경하지 않을 스텝:**
- magic_e, decode_words, word_family, micro_reader, story_reader, exit_ticket → 아바타 추가 금지

### Task 14-E: 나머지 누락 비디오 생성 스크립트 작성 및 실행 (ElevenLabs + VEED Fabric)
**설명**:
- `public/assets/video/` 폴더 내 수작업으로 완성된 80여개의 MP4 파일을 먼저 확인하세요.
- `representativeWords.ts`의 `allVideoWords` 및 `soundFocusEntries` 목록과 대조하여 **아직 생성되지 않은 누락된 단어/소리 쌍**을 추출하는 스크립트 `scripts/generate-missing-lipsync.ts`를 작성하세요.
- **ElevenLabs API**로 음성(MP3)을 1차 생성하고, 이 음성과 기준 이미지 URL을 묶어 **VEED Fabric API(fal.ai)**(`fal-ai/veed-fabric/lipsync`)로 보내 최종 MP4를 받아내도록 파이프라인 연계.
- 모든 누락 MP4 파일을 `public/assets/video/` 에 저장(완전 자동화).

```bash
npm run build
```
빌드 에러 0이면 Phase 2 및 14라운드 최종 완료.

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

---

## Round 15: V2 코어 로직 개발 (Track B) [진행 대기]

> V2 병렬 실행 전략에 따라, 백그라운드용 코어 비즈니스 로직 및 컴포넌트 개발을 진행합니다.

### Task 15-A: V2-1 Magic e 퀴즈 컴포넌트 개발 (Claude Code)
**설명**:
- `src/app/lesson/[unitId]/MagicEStep.tsx` (가칭) 신규 컴포넌트 생성.
- "cap" → 하단 다이내믹 [e] 타일 → 드래그하여 끝에 붙이면 "cape"로 변환되는 UI 및 로직 구현.
- `framer-motion`을 활용한 드래그 앤 드롭 애니메이션 프레임워크 작성.
- (이미지는 임시 플레이스홀더를 사용. 에셋은 안티그래비티가 교체 예정)

### Task 15-B: V2-2 Decodable 스토리북 엔진 구성 (Claude Code)
**설명**:
- `src/app/lesson/[unitId]/StoryReaderStep.tsx` 신규 컴포넌트 생성.
- `src/data/decodableReaders.ts` 템플릿 구조를 읽어와, 5~8문장 분할 만화 패널 렌더링 로직 작성.
- TTS 문장별 자동 순차 재생 (Karaoke 하이라이팅) 동기화 코드 작성.

### Task 15-C: V2-3 Word Family Builder 기초 조립 (Claude Code)
**설명**:
- Rime 블록을 고정하고 여러 Onset을 터치하여 단어를 생산하는 Word Family 게임의 메인 상태 머신(Zustand 또는 로컬 state) 작성.
- 생성된 단어들이 카드스택 형태로 쌓이는 CSS / 레이아웃 틀 구성.

```bash
npm run build
```
빌드 에러 0이면 15라운드 완료.
