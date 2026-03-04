# Reward System (보상 시스템) Planning Document

> **Summary**: 트로피/뱃지 잠금해제 시스템으로 아이들의 학습 동기를 강화하는 보상 체계 구현
>
> **Project**: Phonics App (소리로 읽는 영어 300)
> **Author**: Claude
> **Date**: 2026-03-03
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

레슨 완료, 단어 습득, 유닛 마스터 등 학습 마일스톤 달성 시 트로피/뱃지를 자동으로 잠금해제하여 아이들에게 성취감과 지속적인 학습 동기를 제공한다.

### 1.2 Background

- 현재 앱은 레슨 결과에서 별점(0~3개)만 표시하고, 누적 성취를 보여주는 시스템이 없음
- CLAUDE.md의 "Remaining" 항목에 "보상 시스템: 트로피/스티커/뱃지 UI + 잠금 해제 로직" 명시됨
- 타겟 사용자(초등 1~4학년)에게 게이미피케이션은 학습 지속률에 핵심적인 역할

### 1.3 Related Documents

- CLAUDE.md (프로젝트 규격)
- `src/lib/lessonService.ts` (레슨 결과 저장 + 유닛 언락 로직)
- `src/lib/db.ts` (Dexie IndexedDB 스키마)

---

## 2. Scope

### 2.1 In Scope

- [x] 트로피/뱃지 정의 데이터 (8~10종, 정적 배열)
- [x] Dexie DB에 `rewards` 테이블 추가 (잠금해제 상태 저장)
- [x] `src/app/rewards/page.tsx` — 트로피 목록 페이지 (잠금/잠금해제 표시)
- [x] `lessonService.ts`에 트로피 잠금해제 판정 로직 추가
- [x] 레슨 결과 화면에서 새로 해제된 뱃지 알림 표시
- [x] 홈 화면에서 보상 페이지 진입 버튼 추가

### 2.2 Out of Scope

- 서버 동기화 (오프라인 전용)
- 스티커 컬렉션 / 앨범 시스템 (추후 확장)
- 애니메이션 이펙트 (confetti 등, 별도 피처)
- 뱃지 공유 기능

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 트로피/뱃지 정의: 8~10종의 성취 조건과 메타데이터 | High | Pending |
| FR-02 | Dexie `rewards` 테이블: 해제된 트로피 ID + 해제 시각 저장 | High | Pending |
| FR-03 | `checkAndUnlockRewards()` — 레슨 완료 시 조건 충족 뱃지 자동 해제 | High | Pending |
| FR-04 | `/rewards` 페이지: 전체 뱃지 그리드, 잠금/해제 상태 시각화 | High | Pending |
| FR-05 | 레슨 결과 화면에 새로 해제된 뱃지 팝업/배너 | Medium | Pending |
| FR-06 | 홈 화면에 보상 페이지 진입 버튼 (Trophy 아이콘) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 트로피 해제 판정 < 50ms | 콘솔 타이밍 |
| UX | 잠금 상태도 어떤 뱃지인지 알 수 있게 (힌트 표시) | 시각적 확인 |
| Accessibility | 터치 타겟 44px+, 뱃지별 alt 텍스트 | 디자인 체크 |

---

## 4. Trophy Definitions (FR-01)

| ID | Name (KO) | Condition | Icon | Category |
|----|-----------|-----------|------|----------|
| `first_lesson` | 첫 발걸음 | 첫 레슨 완료 | 🎯 | Milestone |
| `ten_words` | 단어 수집가 | 10개 이상 단어 습득 (stage >= 2) | 📚 | Vocabulary |
| `fifty_words` | 어휘 달인 | 50개 이상 단어 습득 (stage >= 2) | 🏆 | Vocabulary |
| `hundred_words` | 단어 마스터 | 100개 이상 단어 습득 (stage >= 2) | 👑 | Vocabulary |
| `unit_complete` | 유닛 클리어 | 첫 유닛 100% 완료 | ✅ | Unit |
| `five_units` | 모험가 | 5개 유닛 완료 | 🗺️ | Unit |
| `level_coreA` | CoreA 정복 | CoreA 레벨 전체 완료 (unit 1~12) | 🌟 | Level |
| `perfect_lesson` | 퍼펙트 레슨 | 레슨에서 별 3개 획득 | ⭐ | Performance |
| `three_day_streak` | 3일 연속 | 3일 연속 학습 | 🔥 | Streak |
| `seven_day_streak` | 일주일 챔피언 | 7일 연속 학습 | 💪 | Streak |

---

## 5. Architecture

### 5.1 Project Level

**Starter** — 기존 프로젝트 구조 유지. 새 파일은 기존 패턴 준수.

### 5.2 New/Modified Files

```
src/
├── app/
│   ├── rewards/
│   │   └── page.tsx            # [NEW] 보상 목록 페이지
│   ├── lesson/[unitId]/
│   │   └── page.tsx            # [MODIFY] 결과 화면에 뱃지 알림 추가
│   └── page.tsx                # [MODIFY] 홈에 보상 버튼 추가
├── data/
│   └── rewards.ts              # [NEW] 트로피 정의 데이터
└── lib/
    ├── db.ts                   # [MODIFY] rewards 테이블 추가 (v5)
    └── lessonService.ts        # [MODIFY] checkAndUnlockRewards() 추가
```

### 5.3 DB Schema Addition

```typescript
// db.ts — new table in v5
interface UnlockedReward {
    id: string;          // trophy ID (e.g. 'first_lesson')
    unlockedAt: string;  // ISO date string
}

// Dexie v5 store
rewards: 'id'
```

### 5.4 Data Flow

```
Lesson Complete
    ↓
saveLessonResults() (기존)
    ↓
checkAndUnlockRewards() (신규)
    ↓ DB 조회: completedUnits, cards(stage>=2), logs
    ↓ 각 트로피 조건 판정
    ↓ 미해제 트로피 → db.rewards.put()
    ↓
return newlyUnlocked: string[]
    ↓
Results 화면에서 새 뱃지 표시
```

---

## 6. Success Criteria

### 6.1 Definition of Done

- [x] 모든 Functional Requirements 구현됨
- [x] 레슨 완료 → 조건 충족 뱃지 자동 해제 확인
- [x] `/rewards` 페이지에서 잠금/해제 상태 정상 표시
- [x] 기존 기능(레슨, 유닛 언락, SRS) 영향 없음
- [x] `npm run build` 에러 없음

### 6.2 Quality Criteria

- [x] TypeScript strict mode 에러 없음
- [x] ESLint 경고 없음
- [x] 기존 UI 스타일 일관성 (Fredoka, 3D 버튼, 둥근 카드)

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Dexie 버전 업그레이드 마이그레이션 실패 | High | Low | v5에 upgrade 함수로 기존 데이터 보호 |
| 트로피 조건 판정 쿼리가 느림 | Medium | Low | Dexie 인덱스 활용, 단순 count 쿼리 사용 |
| 레슨 결과 저장 실패 시 뱃지도 누락 | Medium | Low | saveLessonResults() 내부에서 try-catch |

---

## 8. Implementation Order

1. `src/data/rewards.ts` — 트로피 정의 데이터
2. `src/lib/db.ts` — v5 rewards 테이블 추가
3. `src/lib/lessonService.ts` — `checkAndUnlockRewards()` 추가 + `saveLessonResults()` 연동
4. `src/app/rewards/page.tsx` — 보상 목록 페이지
5. `src/app/lesson/[unitId]/page.tsx` — 결과 화면 뱃지 알림
6. `src/app/page.tsx` — 홈 화면 보상 버튼

---

## 9. Next Steps

1. [x] Plan 문서 작성 (현재)
2. [ ] Design 문서 작성 (`reward-system.design.md`)
3. [ ] 구현 시작
4. [ ] Gap Analysis

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-03 | Initial draft | Claude |
