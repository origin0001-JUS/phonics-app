# Playwright 브라우저 QA 전체 테스트 — 설계서

> **기능명**: playwright-qa-full
> **Plan 참조**: `docs/01-plan/features/playwright-qa-full.plan.md`
> **날짜**: 2026-03-24
> **실행**: Claude Code 단독

---

## 1. 파일 구조 & 구현 순서

```
phonics-app/
├── playwright.config.ts                    # [1] 설정
├── tests/
│   ├── fixtures/
│   │   └── db-seed.ts                      # [2] IndexedDB 시딩 유틸
│   ├── helpers/
│   │   └── test-utils.ts                   # [3] 공통 헬퍼 (audio mock 등)
│   ├── home.spec.ts                        # [4]
│   ├── onboarding.spec.ts                  # [5]
│   ├── units.spec.ts                       # [6]
│   ├── lesson-flow.spec.ts                 # [7] ⭐ 핵심
│   ├── review.spec.ts                      # [8]
│   ├── rewards.spec.ts                     # [9]
│   ├── settings.spec.ts                    # [10]
│   ├── report.spec.ts                      # [11]
│   ├── admin.spec.ts                       # [12]
│   └── teacher.spec.ts                     # [13]
├── .gitignore                              # playwright-report/, test-results/ 추가
└── package.json                            # "test", "test:ui" 스크립트 추가
```

구현 순서: 번호순 (인프라 → 핵심 → 보조 → 관리)

---

## 2. 인프라 상세 설계

### 2.1 `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,           // IndexedDB 상태 충돌 방지
  retries: 1,
  workers: 1,                     // 순차 실행 (DB 격리)
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4000',
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'on-first-retry',
    actionTimeout: 10_000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 4000,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

**설계 결정**:
- `fullyParallel: false` + `workers: 1` → IndexedDB는 브라우저 컨텍스트 단위이므로 병렬 실행 시 상태 오염 위험
- `reuseExistingServer: true` → 이미 실행 중인 dev 서버 재활용 (빠른 재실행)
- `trace: 'on-first-retry'` → 실패 시 재시도할 때만 trace 기록 (디버깅용)

### 2.2 `tests/fixtures/db-seed.ts`

IndexedDB(Dexie)를 `page.evaluate()` 내에서 직접 시딩하는 유틸리티.

```ts
import { type Page } from '@playwright/test';

/** DB 이름과 버전 (db.ts의 PhonicsDatabase와 동일) */
const DB_NAME = 'PhonicsAppDB';
const DB_VERSION = 6;

/** 온보딩 완료 + unit_01 해금 상태로 시딩 */
export async function seedOnboardingComplete(page: Page, grade: number = 1) {
  await page.evaluate(({ grade, dbName, dbVersion }) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(dbName, dbVersion);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('cards')) db.createObjectStore('cards', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('rewards')) db.createObjectStore('rewards', { keyPath: 'id' });
      };
      req.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        const tx = db.transaction('progress', 'readwrite');
        tx.objectStore('progress').put({
          id: 'user_progress',
          currentLevel: 'CoreA',
          unlockedUnits: ['unit_01'],
          completedUnits: [],
          lastPlayedDate: new Date().toISOString(),
          onboardingCompleted: true,
          gradeLevel: grade,
        });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, { grade, dbName: DB_NAME, dbVersion: DB_VERSION });
}

/** unit_01 완료 + unit_02 해금 상태로 시딩 */
export async function seedUnit01Completed(page: Page) {
  await seedOnboardingComplete(page);
  await page.evaluate(({ dbName, dbVersion }) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(dbName, dbVersion);
      req.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        const tx = db.transaction('progress', 'readwrite');
        tx.objectStore('progress').put({
          id: 'user_progress',
          currentLevel: 'CoreA',
          unlockedUnits: ['unit_01', 'unit_02'],
          completedUnits: ['unit_01'],
          lastPlayedDate: new Date().toISOString(),
          onboardingCompleted: true,
          gradeLevel: 1,
        });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, { dbName: DB_NAME, dbVersion: DB_VERSION });
}

/** SRS 복습 카드 시딩 (오늘 due) */
export async function seedDueCards(page: Page, words: string[] = ['cat', 'bat', 'hat']) {
  await page.evaluate(({ words, dbName, dbVersion }) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(dbName, dbVersion);
      req.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        const tx = db.transaction('cards', 'readwrite');
        const store = tx.objectStore('cards');
        const today = new Date().toISOString().slice(0, 10);
        words.forEach(word => {
          store.put({
            id: word,
            unitId: 'unit_01',
            nextReviewDate: today,
            stage: 1,
            easeFactor: 2.5,
            interval: 1,
            repetitions: 1,
          });
        });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, { words, dbName: DB_NAME, dbVersion: DB_VERSION });
}

/** 보상 해금 시딩 */
export async function seedReward(page: Page, rewardId: string) {
  await page.evaluate(({ rewardId, dbName, dbVersion }) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(dbName, dbVersion);
      req.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        const tx = db.transaction('rewards', 'readwrite');
        tx.objectStore('rewards').put({
          id: rewardId,
          unlockedAt: new Date().toISOString(),
        });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, { rewardId, dbName: DB_NAME, dbVersion: DB_VERSION });
}

/** IndexedDB 완전 삭제 (클린 상태) */
export async function clearDB(page: Page) {
  await page.evaluate(({ dbName }) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }, { dbName: DB_NAME });
}
```

### 2.3 `tests/helpers/test-utils.ts`

```ts
import { type Page } from '@playwright/test';

/** Audio API mock — SpeechSynthesis + AudioContext stub */
export async function mockAudioAPIs(page: Page) {
  await page.addInitScript(() => {
    // SpeechSynthesis mock
    window.speechSynthesis = {
      speak: () => {},
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      getVoices: () => [],
      speaking: false,
      paused: false,
      pending: false,
      onvoiceschanged: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as unknown as SpeechSynthesis;

    // AudioContext mock
    const MockAudioContext = class {
      state = 'running';
      sampleRate = 44100;
      destination = {} as AudioDestinationNode;
      createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 0 } }; }
      createGain() { return { connect: () => {}, gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
      createAnalyser() { return { connect: () => {}, fftSize: 256, getByteFrequencyData: () => {} }; }
      close() { return Promise.resolve(); }
      resume() { return Promise.resolve(); }
    };
    (window as any).AudioContext = MockAudioContext;
    (window as any).webkitAudioContext = MockAudioContext;

    // HTMLMediaElement play mock (mp3 로드 실패 방지)
    HTMLMediaElement.prototype.play = function() {
      this.dispatchEvent(new Event('ended'));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function() {};
    HTMLMediaElement.prototype.load = function() {};
  });
}

/** Framer Motion 애니메이션 스킵 */
export async function skipAnimations(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

/** localStorage에 활성화 키 설정 (온보딩 bypass용) */
export async function setActivationKey(page: Page, key: string = 'TEST123') {
  await page.evaluate((key) => {
    localStorage.setItem('ACTIVATION_KEY', key);
  }, key);
}

/** 페이지 로드 대기 (Dexie 초기화 완료까지) */
export async function waitForAppReady(page: Page) {
  // Loader2 스피너가 사라질 때까지 대기
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10_000 }).catch(() => {});
  // 추가 안정화 대기
  await page.waitForTimeout(500);
}
```

### 2.4 `package.json` 스크립트 추가

```json
{
  "scripts": {
    "test": "npx playwright test",
    "test:ui": "npx playwright test --ui",
    "test:headed": "npx playwright test --headed",
    "test:report": "npx playwright show-report"
  }
}
```

### 2.5 `.gitignore` 추가 항목

```
# Playwright
playwright-report/
test-results/
blob-report/
```

---

## 3. 테스트 Spec 상세 설계

### 3.1 `home.spec.ts` — 홈 화면 (5 tests)

```
describe('Home Page')
  ├── H-1: 최초 방문 → /onboarding 리다이렉트
  │   setup: clearDB → goto('/')
  │   assert: URL contains '/onboarding'
  │
  ├── H-2: 온보딩 완료 후 홈 렌더링
  │   setup: seedOnboardingComplete → goto('/')
  │   assert: "START" 텍스트 visible, /units 링크 존재
  │
  ├── H-3: 복습 due 카운트 배지 표시
  │   setup: seedOnboardingComplete + seedDueCards(3개)
  │   assert: due count 배지에 "3" 표시 (bg-red-500 badge)
  │
  ├── H-4: "배워요(START)" 클릭 → /units 이동
  │   setup: seedOnboardingComplete → click START link
  │   assert: URL === '/units'
  │
  └── H-5: "복습" 클릭 → /review 이동
      setup: seedOnboardingComplete → click review link
      assert: URL === '/review'
```

**셀렉터 전략**:
- START 버튼: `a[href="/units"]` containing "START"
- Review 링크: `a[href="/review"]`
- Due 배지: `text=/\d+/` inside `.bg-red-500.rounded-full`
- 설정 링크: `a[href="/settings"]`

### 3.2 `onboarding.spec.ts` — 온보딩 (5 tests)

```
describe('Onboarding Flow')
  ├── O-1: 활성화 화면 렌더링
  │   setup: clearDB → goto('/onboarding')
  │   assert: code input (maxLength=7) visible
  │
  ├── O-2: 코드 + 이름 입력 → 환영 화면 전환
  │   action: fill code "TEST123", fill nickname "테스트", click 확인
  │   assert: "FOXY" 또는 환영 텍스트 visible
  │
  ├── O-3: 학년 선택 (4개 버튼)
  │   action: click "Level 1" 버튼
  │   assert: 선택된 버튼 border-amber-400, 시작 버튼 enabled
  │
  ├── O-4: 추천 화면 → 학습 시작
  │   action: grade 선택 후 시작 → 추천 화면 → "학습 시작" 클릭
  │   assert: URL === '/'
  │
  └── O-5: DB에 onboardingCompleted 저장 확인
      action: 전체 플로우 완료 후
      assert: page.evaluate로 IndexedDB 조회 → onboardingCompleted === true
```

**셀렉터 전략**:
- 코드 입력: `input[maxlength="7"]`
- 이름 입력: `input[placeholder*="지우"]` 또는 두 번째 input
- 학년 버튼: `text=Level 1`, `text=Level 2` 등
- 시작 버튼: amber 배경 버튼, `text=시작` 또는 `text=Start`

### 3.3 `units.spec.ts` — 유닛 선택 (5 tests)

```
describe('Unit Selection')
  ├── U-1: 24개 유닛 그리드 렌더링
  │   setup: seedOnboardingComplete → goto('/units')
  │   assert: unit card elements count >= 24
  │
  ├── U-2: Unit 1 해금 → 클릭 → /lesson/unit_01
  │   action: click unit_01 card
  │   assert: URL === '/lesson/unit_01'
  │
  ├── U-3: 잠긴 유닛에 Lock 아이콘
  │   assert: unit_02 card에 Lock 아이콘 존재 (pointer-events-none)
  │
  ├── U-4: 완료된 유닛에 체크마크
  │   setup: seedUnit01Completed
  │   assert: unit_01 card에 CheckCircle2 아이콘
  │
  └── U-5: 뒤로가기 → 홈
      action: click back button (a[href="/"])
      assert: URL === '/'
```

**셀렉터 전략**:
- 유닛 카드: `a[href*="/lesson/unit_"]`
- 잠긴 카드: `.pointer-events-none` 또는 Lock SVG 존재
- 완료 체크: CheckCircle2 SVG inside card

### 3.4 `lesson-flow.spec.ts` — 레슨 풀 플로우 (8 tests) ⭐

```
describe('Lesson Flow - unit_01')
  ├── L-1: Sound Focus 렌더링
  │   setup: seedOnboardingComplete → goto('/lesson/unit_01')
  │   assert: "Sound Focus" label visible, play button exists
  │
  ├── L-2: Sound Focus → 다음 단계 전환
  │   action: interact with sound focus (click play, answer quiz if present)
  │   action: click next/continue button
  │   assert: step label changes to next step
  │
  ├── L-3: Blend & Tap 인터랙션
  │   assert: 음소 버튼들 표시
  │   action: 각 음소 버튼 순서대로 클릭
  │   assert: 모든 음소 탭 후 다음 버튼 활성화
  │
  ├── L-4: Decode Words 퀴즈
  │   assert: "What does this word mean?" 텍스트
  │   action: 4개 보기 중 하나 클릭
  │   assert: 정답/오답 피드백 색상 변화
  │
  ├── L-5: Say & Check 스킵 가능
  │   assert: 마이크 버튼 존재
  │   note: STT 없이도 다음 단계로 진행 가능한지 확인
  │
  ├── L-6: Micro-Reader 문장 표시
  │   assert: 영어 문장 텍스트 존재
  │   action: 문장 영역 클릭 (tap to hear)
  │   assert: 다음 문장 버튼 작동
  │
  ├── L-7: Exit Ticket 퀴즈
  │   assert: 선택지 3개 표시
  │   action: 보기 클릭
  │   assert: 정답 피드백
  │
  └── L-8: Results 화면
      assert: "Lesson Done!" 텍스트
      assert: 별점 (Star 아이콘) 표시
      assert: "Back to Units" 버튼 → /units 이동
```

**핵심 셀렉터**:
- 스텝 라벨: `text=Sound Focus`, `text=Blend & Tap` 등
- BigButton (다음): 큰 amber/sky 버튼, 주로 마지막 버튼
- 음소 버튼: step 영역 내 작은 rounded 버튼들
- 퀴즈 보기: `grid` 내 버튼들
- Results: `text=Lesson Done`, `text=Back to Units`

**Say & Check 처리 전략**:
- STT API 불가 → `handleNext()`가 match 없이도 호출 가능한지 확인
- 또는 `page.evaluate`로 STT result를 mock 주입
- 최악의 경우 이 단계는 렌더링 확인만 수행

**timeout**: 이 spec만 `test.setTimeout(120_000)` 설정 (전체 플로우)

### 3.5 `review.spec.ts` — SRS 복습 (4 tests)

```
describe('Review Page')
  ├── R-1: due 카드 없을 때 빈 상태
  │   setup: seedOnboardingComplete (카드 없음)
  │   assert: "All caught up" 또는 빈 상태 메시지
  │
  ├── R-2: 플래시카드 렌더링 + 플립
  │   setup: seedOnboardingComplete + seedDueCards(['cat','bat','hat'])
  │   action: 카드 영역 클릭 (플립)
  │   assert: 의미(한국어) 텍스트 표시
  │
  ├── R-3: 난이도 버튼 4개 표시 (플립 후)
  │   assert: Again, Hard, Good, Easy 버튼 visible
  │   action: "Good" 클릭
  │   assert: 다음 카드로 전환
  │
  └── R-4: 모든 카드 완료
      action: 3장 모두 rating
      assert: 완료 메시지 또는 "Back to Home" 버튼
```

**셀렉터**:
- 플래시카드: 큰 클릭 영역 (main card area)
- Rating 버튼: `text=Again`, `text=Hard`, `text=Good`, `text=Easy`
- 빈 상태: `text=caught up` 또는 `text=Learn More Words`
- 완료: `text=Back to Home`

### 3.6 `rewards.spec.ts` — 보상 (3 tests)

```
describe('Rewards Page')
  ├── RW-1: 10개 트로피 렌더링
  │   setup: seedOnboardingComplete → goto('/rewards')
  │   assert: 트로피 카드 count >= 10
  │
  ├── RW-2: 잠긴 트로피 표시
  │   assert: "???" 텍스트 또는 Lock 아이콘 존재
  │
  └── RW-3: 해금된 트로피 표시
      setup: seedReward('first_lesson')
      assert: 해당 카드에 날짜 텍스트 ("획득") 표시
```

### 3.7 `settings.spec.ts` — 설정 (4 tests)

```
describe('Settings Page')
  ├── S-1: 페이지 렌더링
  │   assert: 학년 변경 섹션, 데이터 초기화 섹션, 버전 정보 존재
  │
  ├── S-2: 학년 변경
  │   action: 학년 선택 드롭다운 열기 → Level 2 클릭
  │   assert: 선택 반영 (border-amber-400)
  │
  ├── S-3: 데이터 초기화 2단계 확인
  │   action: 초기화 버튼 → 1차 확인 → 2차 확인
  │   assert: 각 단계별 경고 텍스트 변화
  │
  └── S-4: 버전 정보
      assert: "v0.1.0" 텍스트 존재
```

### 3.8 `report.spec.ts` — 리포트 (3 tests)

```
describe('Report Page')
  ├── RP-1: 데이터 없을 때
  │   assert: "데이터가 아직 없습니다" 메시지
  │
  ├── RP-2: 데이터 있을 때 렌더링
  │   setup: seedUnit01Completed + seedDueCards
  │   assert: progress ring, stat badges 표시
  │
  └── RP-3: 내보내기 버튼 존재
      assert: CSV 버튼 + PDF 버튼 visible
```

### 3.9 `admin.spec.ts` — 관리자 (4 tests)

```
describe('Admin Page')
  ├── A-1: PIN 입력 화면
  │   assert: 4개 원형 + 숫자 키패드 (0~9, ⌫)
  │
  ├── A-2: 잘못된 PIN → shake 애니메이션
  │   action: 0000 입력
  │   assert: 에러 표시, PIN 리셋
  │
  ├── A-3: 올바른 PIN → 대시보드
  │   action: 1234 입력
  │   assert: "라이선스 관리" 텍스트 visible
  │
  └── A-4: 라이선스 생성 모달
      action: 새 학교 등록 버튼 클릭
      assert: 모달에 학교명 입력 + 좌석 수 + 만료일 필드
```

**셀렉터**:
- 키패드 숫자: `text=1`, `text=2` 등 (grid 내 버튼)
- PIN 원형: 4개 div (filled vs empty 스타일)
- 대시보드: `text=라이선스 관리`

### 3.10 `teacher.spec.ts` — 교사 (2 tests)

```
describe('Teacher Dashboard')
  ├── T-1: 페이지 렌더링 (크래시 없음)
  │   action: goto('/teacher')
  │   assert: 페이지 로드 성공, console error 없음 (Supabase 연결 에러 제외)
  │
  └── T-2: 로그인 폼 또는 에러 핸들링
      assert: 이메일/비밀번호 입력 필드 또는 에러 메시지 표시
```

---

## 4. 셀렉터 전략 (data-testid 없는 환경)

현재 코드에 `data-testid`나 `aria-label`이 **없으므로** 아래 우선순위로 셀렉터 사용:

| 우선순위 | 방법 | 예시 | 용도 |
|---------|------|------|------|
| 1 | 텍스트 기반 | `page.getByText('Sound Focus')` | 버튼 라벨, 제목 |
| 2 | Role 기반 | `page.getByRole('link', { name: 'START' })` | 링크, 버튼 |
| 3 | href/src | `page.locator('a[href="/units"]')` | 네비게이션 링크 |
| 4 | 구조 기반 | `page.locator('.grid > button').nth(0)` | 퀴즈 보기, 키패드 |
| 5 | CSS 클래스 | `page.locator('.bg-red-500.rounded-full')` | 배지, 상태 표시 |

> **참고**: 향후 유지보수를 위해 테스트 과정에서 가장 취약한 셀렉터를 발견하면,
> 해당 컴포넌트에 `data-testid` 추가를 별도 PR로 제안할 수 있음.

---

## 5. Audio Mock 전략 상세

### 문제
앱이 Audio API에 크게 의존:
- `audio.ts`: `playTTS()` → MP3 로드 시도 → 실패 시 SpeechSynthesis fallback
- `audio.ts`: `playSFX()` → Web Audio API (AudioContext + OscillatorNode)
- `audio.ts`: `listenAndCompare()` → SpeechRecognition API

### 해결
`test-utils.ts`의 `mockAudioAPIs()`가 모든 Audio API를 stub:
- `HTMLMediaElement.prototype.play` → 즉시 resolve + `ended` 이벤트 발생
- `AudioContext` → 빈 노드 체인 반환
- `SpeechSynthesis` → 모든 메서드 no-op
- `SpeechRecognition` → mock 불필요 (Say & Check에서 skip 전략)

### Say & Check 특수 처리
```ts
// 방법 1: STT result를 직접 주입
await page.evaluate(() => {
  // SpeechRecognition mock: 즉시 결과 반환
  (window as any).SpeechRecognition = class {
    onresult: any;
    start() {
      setTimeout(() => {
        this.onresult?.({ results: [[{ transcript: 'cat', confidence: 0.95 }]] });
      }, 100);
    }
    stop() {}
    abort() {}
  };
  (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
});

// 방법 2: 단순히 다음 단계 버튼 클릭 (UI 렌더링만 확인)
```

---

## 6. 테스트 실행 & 리포트

### 실행 명령어
```bash
# 전체 테스트
npm test

# 특정 파일
npx playwright test tests/lesson-flow.spec.ts

# headed 모드 (브라우저 표시)
npm run test:headed

# UI 모드 (인터랙티브)
npm run test:ui

# HTML 리포트 보기
npm run test:report
```

### 성공 기준 (Plan 문서와 동일)
| 기준 | 목표 |
|------|------|
| 테스트 파일 | 10개 |
| 총 테스트 케이스 | 43개 (H:5 + O:5 + U:5 + L:8 + R:4 + RW:3 + S:4 + RP:3 + A:4 + T:2) |
| 통과율 | 100% |
| 실행 시간 | < 3분 |
