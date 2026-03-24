# Playwright 브라우저 QA 전체 테스트 계획서

> **기능명**: playwright-qa-full
> **유형**: E2E 브라우저 테스트 (Playwright)
> **우선순위**: 높음
> **날짜**: 2026-03-24
> **실행**: Claude Code 단독

---

## 1. 개요

현재 버전의 phonics-app에 대한 전체 QA를 Playwright 브라우저 테스트로 수행합니다.
기존에 `@playwright/test@^1.58.2`가 devDependency에 설치되어 있으나, config와 테스트 파일이 전무한 상태입니다.

**목표**: 10개 페이지 × 핵심 유저 플로우를 자동화된 E2E 테스트로 커버

### 제약 조건 (Claude Code 단독)
- IndexedDB(Dexie.js) 의존 → 테스트 전 DB 상태 시딩 필요
- SpeechSynthesis / Web Audio API → 브라우저 mock 또는 skip 처리
- localhost:4000에서 dev 서버 실행 필요
- 외부 API(Supabase, Google TTS) 없이 로컬 전용 테스트

---

## 2. 테스트 인프라 셋업

### 2.1 파일 구조
```
phonics-app/
├── playwright.config.ts          # Playwright 설정
├── tests/
│   ├── fixtures/
│   │   └── db-seed.ts            # IndexedDB 시딩 유틸리티
│   ├── helpers/
│   │   └── navigation.ts         # 공통 네비게이션 헬퍼
│   ├── home.spec.ts              # / (홈 화면)
│   ├── onboarding.spec.ts        # /onboarding
│   ├── units.spec.ts             # /units
│   ├── lesson-flow.spec.ts       # /lesson/[unitId] (6단계 풀 플로우)
│   ├── review.spec.ts            # /review (SRS 복습)
│   ├── report.spec.ts            # /report
│   ├── rewards.spec.ts           # /rewards
│   ├── settings.spec.ts          # /settings
│   ├── admin.spec.ts             # /admin
│   └── teacher.spec.ts           # /teacher
└── package.json                  # test 스크립트 추가
```

### 2.2 playwright.config.ts 핵심 설정
| 항목 | 값 |
|------|-----|
| baseURL | `http://localhost:4000` |
| webServer | `npm run dev` (port 4000, reuseExistingServer: true) |
| browsers | chromium only (빠른 실행) |
| timeout | 30초 (lesson flow는 60초) |
| retries | 1 (CI 안정성) |
| screenshot | only-on-failure |
| video | off (용량 절약) |

### 2.3 IndexedDB 시딩 전략
Dexie.js는 클라이언트 전용이므로 `page.evaluate()` 내에서 직접 시딩:
```ts
// 온보딩 완료 상태로 시딩
await page.evaluate(() => {
  const request = indexedDB.open('PhonicsAppDB');
  // progress 테이블에 onboardingCompleted: true 삽입
});
```

---

## 3. 테스트 시나리오 (페이지별)

### 3.1 홈 화면 (`/`) — `home.spec.ts`
| # | 시나리오 | 검증 포인트 |
|---|----------|-------------|
| H-1 | 최초 방문 → 온보딩 리다이렉트 | URL이 `/onboarding`으로 변경됨 |
| H-2 | 온보딩 완료 후 홈 렌더링 | "배워요" / "복습" 버튼 표시 |
| H-3 | 복습 due 카운트 배지 | due > 0이면 배지 숫자 표시 |
| H-4 | "배워요" 클릭 → /units 이동 | 네비게이션 정상 |
| H-5 | "복습" 클릭 → /review 이동 | 네비게이션 정상 |

### 3.2 온보딩 (`/onboarding`) — `onboarding.spec.ts`
| # | 시나리오 | 검증 포인트 |
|---|----------|-------------|
| O-1 | 활성화 키 입력 화면 렌더링 | 입력 필드 + 확인 버튼 존재 |
| O-2 | 환영 화면 표시 | Foxy 캐릭터 / 환영 텍스트 |
| O-3 | 학년 선택 (1~4학년) | 4개 버튼 클릭 가능, 선택 시 하이라이트 |
| O-4 | 레벨 추천 → 시작 | 추천 레벨 표시 + "시작하기" 버튼 → `/` 이동 |
| O-5 | DB에 onboardingCompleted 저장 | `page.evaluate`로 IndexedDB 확인 |

### 3.3 유닛 선택 (`/units`) — `units.spec.ts`
| # | 시나리오 | 검증 포인트 |
|---|----------|-------------|
| U-1 | 유닛 그리드 렌더링 | 24개 유닛 카드 표시 |
| U-2 | Unit 1 잠금 해제 상태 | 클릭 가능, `/lesson/unit_01` 이동 |
| U-3 | 잠긴 유닛 클릭 불가 | 잠금 아이콘 표시, 클릭 시 이동 안 됨 |
| U-4 | 완료된 유닛 체크마크 | completedUnits에 포함된 유닛에 ✓ 표시 |
| U-5 | 뒤로가기 → 홈 | 네비게이션 정상 |

### 3.4 레슨 풀 플로우 (`/lesson/unit_01`) — `lesson-flow.spec.ts` ⭐ 핵심
| # | 시나리오 | 검증 포인트 |
|---|----------|-------------|
| L-1 | Sound Focus 단계 렌더링 | 타겟 사운드 표시, 다음 버튼 |
| L-2 | Blend & Tap 인터랙션 | 음소 탭 가능, 블렌딩 애니메이션 |
| L-3 | Decode Words 단계 | 단어 카드 표시, 정답/오답 처리 |
| L-4 | Say & Check 단계 | 마이크 권한 없이도 skip 가능 확인 |
| L-5 | Micro-Reader(Story) 단계 | 스토리 패널 렌더링, 넘기기 작동 |
| L-6 | Exit Ticket 퀴즈 | 문제 표시, 정답 선택 시 진행 |
| L-7 | Results 화면 | 점수 표시, "홈으로" / "다음 유닛" 버튼 |
| L-8 | 전체 6단계 → 결과 풀 플로우 | 처음부터 끝까지 한 번에 통과 |

### 3.5 복습 (`/review`) — `review.spec.ts`
| # | 시나리오 | 검증 포인트 |
|---|----------|-------------|
| R-1 | due 카드 없을 때 | "복습할 카드가 없습니다" 메시지 |
| R-2 | due 카드 있을 때 플래시카드 표시 | 단어 + 의미 카드 렌더링 |
| R-3 | 난이도 버튼 (Again/Hard/Good/Easy) | 4개 버튼 표시, 클릭 시 다음 카드 |
| R-4 | 모든 카드 완료 | 완료 메시지 표시 |

### 3.6 리포트 (`/report`) — `report.spec.ts`
| # | 시나리오 | 검증 포인트 |
|---|----------|-------------|
| RP-1 | 리포트 페이지 렌더링 | 학습 통계 영역 표시 |
| RP-2 | CSV 내보내기 버튼 | 클릭 시 다운로드 트리거 |
| RP-3 | PDF 내보내기 버튼 | 클릭 시 다운로드 트리거 |

### 3.7 보상 (`/rewards`) — `rewards.spec.ts`
| # | 시나리오 | 검증 포인트 |
|---|----------|-------------|
| RW-1 | 보상 페이지 렌더링 | 10개 트로피 정의 표시 |
| RW-2 | 잠긴 트로피 | 회색/잠금 상태 표시 |
| RW-3 | 해금된 트로피 | 컬러 + 해금 날짜 표시 |

### 3.8 설정 (`/settings`) — `settings.spec.ts`
| # | 시나리오 | 검증 포인트 |
|---|----------|-------------|
| S-1 | 설정 페이지 렌더링 | 학년 변경, 데이터 초기화 섹션 표시 |
| S-2 | 학년 변경 | 드롭다운/버튼 클릭 → DB 업데이트 |
| S-3 | 데이터 초기화 확인 다이얼로그 | 확인 전 경고 모달 표시 |
| S-4 | 버전 정보 표시 | 앱 버전 텍스트 존재 |

### 3.9 관리자 (`/admin`) — `admin.spec.ts`
| # | 시나리오 | 검증 포인트 |
|---|----------|-------------|
| A-1 | PIN 입력 화면 | 4자리 입력 필드 표시 |
| A-2 | 잘못된 PIN → 에러 | 에러 메시지 표시 |
| A-3 | 올바른 PIN(1234) → 대시보드 | 라이선스 생성 UI 표시 |
| A-4 | 라이선스 키 생성 | PHONICS-YEAR-XXX-XXXX 형식 확인 |

### 3.10 교사 대시보드 (`/teacher`) — `teacher.spec.ts`
| # | 시나리오 | 검증 포인트 |
|---|----------|-------------|
| T-1 | 로그인 폼 렌더링 | 이메일/비밀번호 필드 표시 |
| T-2 | Supabase 미연결 시 에러 핸들링 | 크래시 없이 에러 메시지 표시 |

---

## 4. 구현 순서 (우선순위)

### Phase 1: 인프라 셋업 (필수 선행)
1. `playwright.config.ts` 생성
2. `package.json`에 `test`, `test:ui` 스크립트 추가
3. `tests/fixtures/db-seed.ts` — IndexedDB 시딩 유틸리티
4. `tests/helpers/navigation.ts` — 공통 헬퍼
5. `npx playwright install chromium` 실행

### Phase 2: 핵심 플로우 테스트 (높은 우선순위)
1. `home.spec.ts` — 홈 + 온보딩 리다이렉트
2. `onboarding.spec.ts` — 온보딩 풀 플로우
3. `units.spec.ts` — 유닛 선택 + 잠금 상태
4. `lesson-flow.spec.ts` — **레슨 6단계 풀 플로우** (가장 중요)

### Phase 3: 보조 페이지 테스트 (중간 우선순위)
5. `review.spec.ts` — SRS 복습
6. `rewards.spec.ts` — 보상/트로피
7. `settings.spec.ts` — 설정

### Phase 4: 관리 페이지 테스트 (낮은 우선순위)
8. `report.spec.ts` — 리포트 + 내보내기
9. `admin.spec.ts` — 관리자 PIN + 라이선스
10. `teacher.spec.ts` — 교사 대시보드 (Supabase 미연결 상태)

---

## 5. 기술적 고려사항

### 5.1 Audio/TTS 처리
- `SpeechSynthesis` API → `page.evaluate`로 mock (빈 함수 대체)
- Web Audio API SFX → `AudioContext` stub
- MP3 파일 없어도 테스트 통과하도록 fallback 확인

### 5.2 IndexedDB 시딩 패턴
```ts
// 공통 fixture: 온보딩 완료 + unit_01 해금 상태
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    // Dexie DB 직접 시딩
  });
});
```

### 5.3 애니메이션 처리
- Framer Motion 애니메이션 → `prefers-reduced-motion` 미디어 쿼리 또는
- `page.emulateMedia({ reducedMotion: 'reduce' })` 설정으로 스킵

### 5.4 마이크 권한 (Say & Check)
- Playwright에서 마이크 접근 불가 → Say & Check 단계는 skip 버튼 존재 확인만 테스트
- STT 기능은 수동 QA 영역으로 분리

---

## 6. 성공 기준

| 기준 | 목표 |
|------|------|
| 테스트 파일 수 | 10개 (페이지당 1개) |
| 총 테스트 케이스 | 최소 40개 |
| 핵심 플로우 커버 | 홈 → 온보딩 → 유닛 → 레슨(6단계) → 결과 |
| 빌드 통과 | `npm run build` 성공 |
| 테스트 통과율 | 100% (모든 테스트 green) |
| 실행 시간 | < 3분 (chromium only) |
| CI 호환 | `npx playwright test --reporter=html` 리포트 생성 |

---

## 7. 산출물

| 산출물 | 경로 |
|--------|------|
| Playwright 설정 | `playwright.config.ts` |
| 테스트 파일 10개 | `tests/*.spec.ts` |
| DB 시딩 유틸 | `tests/fixtures/db-seed.ts` |
| 네비게이션 헬퍼 | `tests/helpers/navigation.ts` |
| 테스트 스크립트 | `package.json` → `test`, `test:ui` |
| HTML 리포트 | `playwright-report/` (gitignore) |
