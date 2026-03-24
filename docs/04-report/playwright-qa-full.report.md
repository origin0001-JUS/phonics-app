# playwright-qa-full 완료 리포트

> **기능명**: playwright-qa-full
> **완료일**: 2026-03-24
> **실행**: Claude Code 단독
> **PDCA**: Plan → Design → Do → Check (95%) → Act (Iteration 1) → Report

---

## 1. 요약

phonics-app 전체 10개 페이지에 대한 Playwright E2E 브라우저 테스트를 구축했습니다.
**43개 테스트 케이스 전부 통과 (100%)**, 실행 시간 4.8분.

기존에 `@playwright/test`가 devDependency에만 있고 config/테스트가 전무했던 상태에서,
완전한 테스트 인프라와 10개 spec 파일을 새로 작성했습니다.

---

## 2. PDCA 진행 이력

| 단계 | 산출물 | 상태 |
|------|--------|------|
| Plan | `docs/01-plan/features/playwright-qa-full.plan.md` | ✅ |
| Design | `docs/02-design/features/playwright-qa-full.design.md` | ✅ |
| Do | 13개 파일 생성 (config + seed + utils + 10 specs) | ✅ |
| Check | `docs/03-analysis/playwright-qa-full.analysis.md` — **95%** | ✅ |
| Act | Assertion 정밀도 강화 (15개 테스트, 82% → ~95%) | ✅ |
| Report | 이 문서 | ✅ |

---

## 3. 구현 산출물

### 3.1 생성된 파일 (13개)

| 파일 | 용도 |
|------|------|
| `playwright.config.ts` | Playwright 설정 (chromium, workers:1, webServer) |
| `tests/fixtures/db-seed.ts` | IndexedDB 시딩 유틸 (5개 함수 + waitForDB) |
| `tests/helpers/test-utils.ts` | Audio/STT mock, 애니메이션 스킵, 헬퍼 |
| `tests/home.spec.ts` | 홈 화면 5개 테스트 |
| `tests/onboarding.spec.ts` | 온보딩 5개 테스트 |
| `tests/units.spec.ts` | 유닛 선택 5개 테스트 |
| `tests/lesson-flow.spec.ts` | 레슨 풀 플로우 8개 테스트 |
| `tests/review.spec.ts` | SRS 복습 4개 테스트 |
| `tests/rewards.spec.ts` | 보상/트로피 3개 테스트 |
| `tests/settings.spec.ts` | 설정 4개 테스트 |
| `tests/report.spec.ts` | 리포트 3개 테스트 |
| `tests/admin.spec.ts` | 관리자 4개 테스트 |
| `tests/teacher.spec.ts` | 교사 대시보드 2개 테스트 |

### 3.2 수정된 파일 (2개)

| 파일 | 변경 |
|------|------|
| `package.json` | `test`, `test:ui`, `test:headed`, `test:report` 스크립트 추가 |
| `.gitignore` | `playwright-report/`, `test-results/`, `blob-report/` 추가 |

---

## 4. 테스트 결과

### 최종 실행: 43/43 passed (4.8분)

| Spec | 테스트 수 | 결과 |
|------|:---------:|:----:|
| admin.spec.ts | 4 | PASS |
| home.spec.ts | 5 | PASS |
| lesson-flow.spec.ts | 8 | PASS |
| onboarding.spec.ts | 5 | PASS |
| report.spec.ts | 3 | PASS |
| review.spec.ts | 4 | PASS |
| rewards.spec.ts | 3 | PASS |
| settings.spec.ts | 4 | PASS |
| teacher.spec.ts | 2 | PASS |
| units.spec.ts | 5 | PASS |

### 성공 기준 달성

| 기준 | 목표 | 실제 | 달성 |
|------|:----:|:----:|:----:|
| 테스트 파일 | 10 | 10 | ✅ |
| 테스트 케이스 | 43 | 43 | ✅ |
| 통과율 | 100% | 100% | ✅ |
| 실행 시간 | < 5분 | 4.8분 | ✅ |
| 빌드 통과 | `npm run build` | 통과 | ✅ |

---

## 5. 해결한 기술적 난관

### 5.1 Dexie v4 IndexedDB 버전 충돌
- **문제**: Dexie `.version(6)` → 내부 IDB version = 60. 시딩에서 version 6 요청 시 `VersionError`
- **해결**: version-less `indexedDB.open(dbName)` + `waitForDB()` 폴링으로 Dexie 초기화 대기

### 5.2 Supabase 활성화 키 리다이렉트
- **문제**: `.env.local`에 Supabase 키가 있어 `isCloudEnabled() === true` → localStorage `phonics_device_activated` 필수
- **해결**: `setActivationKey()` 헬퍼로 테스트 전 localStorage에 키 설정

### 5.3 Audio/STT API 헤드리스 환경
- **문제**: SpeechSynthesis, AudioContext, SpeechRecognition, MediaDevices 전부 unavailable
- **해결**: `addInitScript()`로 전체 Audio API mock 주입 (play 즉시 ended 이벤트, STT 자동 결과 반환)

### 5.4 시딩 타이밍 (Race Condition)
- **문제**: `goto('/')` → 앱이 리다이렉트 → `/onboarding` 상태에서 `reload()` → 여전히 onboarding
- **해결**: `goto('/') → seed → goto('/')` 패턴 (reload 대신 명시적 재방문)

---

## 6. 실행 방법

```bash
# 전체 테스트 실행
npm test

# 브라우저 표시 모드
npm run test:headed

# UI 인터랙티브 모드
npm run test:ui

# HTML 리포트 보기
npm run test:report

# 특정 파일만
npx playwright test tests/lesson-flow.spec.ts
```

---

## 7. 향후 개선 가능 사항

| 항목 | 설명 | 우선순위 |
|------|------|:--------:|
| `data-testid` 추가 | 컴포넌트에 testid 속성 → 셀렉터 안정성 향상 | 중 |
| CI 통합 | GitHub Actions에서 자동 실행 | 중 |
| Firefox/WebKit 추가 | 크로스 브라우저 테스트 | 낮음 |
| 시각 회귀 테스트 | Playwright 스크린샷 비교 | 낮음 |
| 레슨 단계별 자동 진행 | 정답 하드코딩으로 L-3~L-7 단계 진입 보장 | 낮음 |
