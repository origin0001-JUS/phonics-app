# Settings Page (설정 페이지) Planning Document

> **Summary**: 학년 변경, 진행 초기화, 리포트 링크를 포함한 설정 페이지 구현
>
> **Project**: Phonics App (소리로 읽는 영어 300)
> **Author**: Claude
> **Date**: 2026-03-03
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

사용자가 학년 변경, 학습 데이터 초기화, 학습 리포트 접근 등 앱 설정을 관리할 수 있는 전용 페이지를 제공한다.

### 1.2 Background

- 홈 화면에 Settings 버튼이 이미 존재하지만 기능 없이 아이콘만 표시됨
- CLAUDE.md의 "Remaining" 항목에 "설정 화면: 학년 변경, 데이터 초기화, 리포트 접근" 명시됨
- 온보딩에서 학년을 선택하지만, 이후 변경할 방법이 없음

---

## 2. Scope

### 2.1 In Scope

- [x] `src/app/settings/page.tsx` 생성
- [x] 학년 변경 기능 (1~4학년, 즉시 반영 + 유닛 언락 재계산)
- [x] 진행 초기화 기능 (확인 다이얼로그 포함)
- [x] 학습 리포트 페이지 링크 (`/report`)
- [x] 홈 화면 Settings 버튼을 `/settings` 링크로 연결

### 2.2 Out of Scope

- 앱 테마/다크모드 변경
- 알림 설정 (오프라인 앱)
- 계정 관리 (계정 시스템 없음)
- 언어 변경 (한국어 전용)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `/settings` 페이지: 설정 항목 목록 UI | High | Pending |
| FR-02 | 학년 변경: 현재 학년 표시 + 선택 UI + DB 업데이트 (gradeLevel, currentLevel, unlockedUnits 재계산) | High | Pending |
| FR-03 | 진행 초기화: 확인 다이얼로그 + 모든 테이블 삭제 후 온보딩으로 리다이렉트 | High | Pending |
| FR-04 | 리포트 링크: `/report` 페이지로 이동하는 버튼 | Medium | Pending |
| FR-05 | 홈 화면 Settings 버튼 → `/settings` 링크로 변경 | Medium | Pending |

---

## 4. Architecture

### 4.1 New/Modified Files

```
src/
├── app/
│   ├── settings/
│   │   └── page.tsx            # [NEW] 설정 페이지
│   └── page.tsx                # [MODIFY] Settings 버튼을 Link로 변경
```

### 4.2 학년 변경 로직

onboarding의 `getMapping()` 로직을 재활용:
- 학년 선택 → `getMapping(grade)` → level, unitCount, units 계산
- `db.progress.put()` 로 gradeLevel, currentLevel, unlockedUnits 업데이트
- Zustand store도 동기화 (setGradeLevel, setLevel)
- completedUnits는 유지 (진행 보존)

### 4.3 진행 초기화 로직

1. 확인 다이얼로그 (2단계: 첫 번째 "초기화하기" → 두 번째 "정말 삭제합니다")
2. `db.progress.clear()` + `db.cards.clear()` + `db.logs.clear()` + `db.rewards.clear()`
3. Zustand store 초기화
4. `router.replace("/onboarding")` 으로 리다이렉트

---

## 5. Implementation Order

1. `src/app/settings/page.tsx` — 설정 페이지 (학년 변경, 초기화, 리포트 링크)
2. `src/app/page.tsx` — 홈 Settings 버튼을 Link로 변경

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-03 | Initial draft | Claude |
