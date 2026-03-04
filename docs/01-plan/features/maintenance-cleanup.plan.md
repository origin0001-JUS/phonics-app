# Plan: maintenance-cleanup

> 빌드 통과 확인, CLAUDE.md 최신화, Hydration 경고 제거

## 1. 개요

프로덕션 배포 전 코드베이스 정리 작업. 빌드 검증, 문서 최신화, 런타임 경고 제거 3가지를 한 번에 처리한다.

## 2. 작업 목록

### Task A: 빌드 통과 확인

- **현재 상태**: `npm run build` 이미 통과 (Next.js 16.1.6, Turbopack)
- **확인 사항**: TypeScript 에러 없음, 모든 10개 라우트 정상 생성
- **결과**: 추가 수정 불필요 (이미 통과)

### Task B: CLAUDE.md 최신화

**대상 파일**: 루트 `CLAUDE.md` (Claude Code 시스템 컨텍스트로 로드됨)

**반영할 변경사항**:

| 항목 | 현재 (구버전) | 변경 후 |
|------|-------------|---------|
| Project Structure | 3개 페이지만 기재 | 9개 페이지 전체 반영 (onboarding, review, report, rewards, settings 추가) |
| lib/ 파일 | db.ts, srs.ts, store.ts만 | audio.ts, lessonService.ts, exportReport.ts 추가 |
| data/ 파일 | curriculum.ts만 | rewards.ts 추가 |
| components | 없음 | ServiceWorkerRegister.tsx 추가 |
| DB Schema | 언급 없음 | v5 스키마 (progress, cards, logs, rewards 4테이블) 명시 |
| Current Status | "Dexie DB NOT wired" 등 구버전 | 완료된 기능 반영 (보상, 설정, 온보딩, SRS 연동 등) |
| Remaining | 구버전 TODO | 실제 남은 작업만 (이미지 에셋, Capacitor, Viseme 등) |

**phonics-app/CLAUDE.md** 도 동기화:
- "Remaining" 섹션에서 보상 시스템, 설정 화면을 ✅ 완료로 이동

### Task C: Hydration 경고 제거

- **대상**: `src/app/layout.tsx`의 `<html>`, `<body>` 태그
- **방법**: `suppressHydrationWarning` 속성 추가
- **이유**: 브라우저 확장 프로그램/테마가 DOM 속성을 수정할 때 발생하는 Next.js 경고 제거
- **변경 범위**: layout.tsx 2줄 수정 (html, body 태그)

## 3. 구현 순서

1. ~~빌드 통과 확인~~ (이미 완료)
2. `layout.tsx`에 `suppressHydrationWarning` 추가
3. 루트 `CLAUDE.md` 최신화
4. `phonics-app/CLAUDE.md` Current Status 업데이트
5. 최종 빌드 재검증 (`npm run build`)

## 4. 영향 범위

- **코드 변경**: `layout.tsx` 1개 파일 (2줄)
- **문서 변경**: `CLAUDE.md` 2개 파일
- **위험도**: 낮음 (문서 + 속성 추가만)

## 5. 완료 기준

- [x] `npm run build` 에러 없이 통과
- [ ] `suppressHydrationWarning` 적용 → 개발 서버에서 Hydration 경고 없음
- [ ] 루트 CLAUDE.md에 rewards, settings, audio.ts, rewards 테이블 반영
- [ ] phonics-app CLAUDE.md Current Status 동기화
