# qa-round2 Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: phonics-app
> **Analyst**: gap-detector
> **Date**: 2026-03-15
> **Design Doc**: [CLAUDE_PROMPT_QA_ROUND2.md](../CLAUDE_PROMPT_QA_ROUND2.md)
> **Plan Doc**: [qa-round2.plan.md](../01-plan/features/qa-round2.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify that the 3 QA Round 2 requirements (2 bugs + 1 deferred feature) from `CLAUDE_PROMPT_QA_ROUND2.md` and `qa-round2.plan.md` are correctly implemented in `LessonClient.tsx`.

### 1.2 Analysis Scope

- **Design Documents**: `docs/CLAUDE_PROMPT_QA_ROUND2.md`, `docs/01-plan/features/qa-round2.plan.md`
- **Implementation Path**: `src/app/lesson/[unitId]/LessonClient.tsx`
- **Analysis Date**: 2026-03-15

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Bug 1: Progress Volatility (localStorage Migration)

| # | Requirement | Implementation | Location | Status |
|---|------------|----------------|----------|--------|
| 1 | Switch from `sessionStorage` to `localStorage` | `localStorage.getItem(storageKey)` / `localStorage.setItem(...)` | L203, L231 | PASS |
| 2 | Storage key format `lesson_state_{unitId}` | `const storageKey = \`lesson_state_${unitId}\`` | L199 | PASS |
| 3 | Persist `stepIndex` | Saved in JSON payload, restored via `setStepIndex` | L206, L232 | PASS |
| 4 | Persist `score` and `totalQuestions` | Both saved and restored | L208-209, L232 | PASS |
| 5 | Persist `wordResults` (Map serialization) | Serialized to `Record<string, WordResult>` on save, deserialized to Map on restore | L211-216, L227-230 | PASS |
| 6 | Guard against restore before hydration (`sessionRestored` flag) | `setSessionRestored(true)` after restore; save effect skipped until `sessionRestored` is true | L200, L220, L225 | PASS |
| 7 | Clear localStorage on lesson completion | `localStorage.removeItem(storageKey)` in `handleLessonComplete` | L326 | PASS |

**Bug 1 Score: 7/7 (100%)**

### 2.2 Bug 2: SRS Review Queue Immediate Update

| # | Requirement | Implementation | Location | Status |
|---|------------|----------------|----------|--------|
| 1 | Wrong answers must immediately write to Dexie | `addScore` fires async IIFE on `!correct` branch | L265-278 | PASS |
| 2 | Import `db` from `@/lib/db` | `import { db } from "@/lib/db"` | L7 | PASS |
| 3 | Import `createNewCard`, `calculateNextReview` from `@/lib/srs` | `import { createNewCard, calculateNextReview } from "@/lib/srs"` | L8 | PASS |
| 4 | Import `vocabCardToSRSCard`, `srsCardToVocabCard` from `@/lib/lessonService` | Both imported | L6 | PASS |
| 5 | Lookup existing card via `db.cards.get(wordId)` | `const existing = await db.cards.get(wordId)` | L269 | PASS |
| 6 | Create new card if none exists via `createNewCard(wordId, unitId)` | Ternary: `existing ? vocabCardToSRSCard(existing) : createNewCard(wordId, unitId)` | L270-272 | PASS |
| 7 | Apply `calculateNextReview(srsCard, 0)` (Rating 0 = Again) | `const updated = calculateNextReview(srsCard, 0)` | L273 | PASS |
| 8 | Write back via `db.cards.put(srsCardToVocabCard(updated))` | Exact call present | L274 | PASS |
| 9 | Error handling (non-blocking) | `try/catch` with `console.warn` | L267, L275-277 | PASS |

**Bug 2 Score: 9/9 (100%)**

### 2.3 Task 2: Sub-step Granularity (subStepIndex)

| # | Requirement | Implementation | Location | Status |
|---|------------|----------------|----------|--------|
| 1 | New state: `subStepIndex` | `const [subStepIndex, setSubStepIndex] = useState(0)` | L187 | PASS |
| 2 | Persist `subStepIndex` in localStorage payload | Included in JSON: `{ stepIndex, subStepIndex, score, ... }` | L232 | PASS |
| 3 | Restore `subStepIndex` from localStorage | `if (typeof state.subStepIndex === 'number') setSubStepIndex(state.subStepIndex)` | L207 | PASS |
| 4 | Reset `subStepIndex` to 0 on `goNext` | `setSubStepIndex(0)` inside `goNext` callback | L255 | PASS |
| 5 | `DecodeWordsStep` accepts `initialSubStep` prop | `initialSubStep = 0` in destructured props | L836 | PASS |
| 6 | `DecodeWordsStep` accepts `onSubStepChange` prop | `onSubStepChange?: (idx: number) => void` in props | L836 | PASS |
| 7 | `DecodeWordsStep` initializes `idx` from `initialSubStep` | `const [idx, setIdx] = useState(initialSubStep)` | L837 | PASS |
| 8 | `DecodeWordsStep` reports changes via `onSubStepChange` | `useEffect(() => { onSubStepChange?.(idx); }, ...)` | L843 | PASS |
| 9 | `SayCheckStep` accepts `initialSubStep` + `onSubStepChange` | Both present in props | L920 | PASS |
| 10 | `SayCheckStep` initializes from `initialSubStep` | `const [idx, setIdx] = useState(initialSubStep)` | L921 | PASS |
| 11 | `SayCheckStep` reports via `onSubStepChange` | `useEffect(() => { onSubStepChange?.(idx); }, ...)` | L930 | PASS |
| 12 | `ExitTicketStep` accepts `initialSubStep` + `onSubStepChange` | Both present in props | L1108 | PASS |
| 13 | `ExitTicketStep` initializes from `initialSubStep` | `const [qIdx, setQIdx] = useState(initialSubStep)` | L1110 | PASS |
| 14 | `ExitTicketStep` reports via `onSubStepChange` | `useEffect(() => { onSubStepChange?.(qIdx); }, ...)` | L1116 | PASS |
| 15 | Parent passes `initialSubStep={subStepIndex}` to DecodeWordsStep | `<DecodeWordsStep ... initialSubStep={subStepIndex} onSubStepChange={setSubStepIndex} />` | L404 | PASS |
| 16 | Parent passes `initialSubStep={subStepIndex}` to SayCheckStep | `<SayCheckStep ... initialSubStep={subStepIndex} onSubStepChange={setSubStepIndex} />` | L410 | PASS |
| 17 | Parent passes `initialSubStep={subStepIndex}` to ExitTicketStep | `<ExitTicketStep ... initialSubStep={subStepIndex} onSubStepChange={setSubStepIndex} />` | L419 | PASS |

**Task 2 Score: 17/17 (100%)**

---

## 3. Convention Compliance

### 3.1 Import Order Check

| Rule | Expected | Actual | Status |
|------|----------|--------|--------|
| External libraries first | react, next, framer-motion, lucide-react | Lines 3-4 (next), then Lines 5-8 (@/ imports), then L11-12 (framer-motion, lucide-react) | FAIL |
| Internal `@/` imports second | After externals | Lines 5-8 are `@/` imports sandwiched between externals | FAIL |
| Relative imports third | After `@/` | Lines 16-19 (relative `./` imports) are after externals | PASS |

**Violation**: `framer-motion` (L11) and `lucide-react` (L12-15) are placed after `@/` imports (L5-8). They should precede `@/` imports.

This is a persistent issue noted since Round 7.

### 3.2 Naming Convention

| Category | Convention | Compliance |
|----------|-----------|:----------:|
| Components | PascalCase | 100% |
| Functions | camelCase | 100% |
| State vars | camelCase | 100% |
| Step types | snake_case strings | 100% |

---

## 4. Overall Scores

| Category | Items | Passed | Score | Status |
|----------|:-----:|:------:|:-----:|:------:|
| Bug 1 (Progress Volatility) | 7 | 7 | 100% | PASS |
| Bug 2 (SRS Immediate Update) | 9 | 9 | 100% | PASS |
| Task 2 (Sub-step Granularity) | 17 | 17 | 100% | PASS |
| Convention (Import Order) | 3 | 1 | 33% | FAIL |
| **Functional Total** | **33** | **33** | **100%** | **PASS** |

### Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 97%                    |
+---------------------------------------------+
|  Functional Requirements: 33/33 (100%)      |
|  Convention Compliance:    1/3  (33%)        |
|  Total:                   34/36 (94%)        |
+---------------------------------------------+
```

**Weighted Match Rate: 97%** (functional items weighted 3x vs convention items)

---

## 5. Differences Found

### Missing Features (Design has, Implementation missing)

None. All 3 requirements are fully implemented.

### Added Features (Implementation has, Design missing)

| Item | Location | Description |
|------|----------|-------------|
| `recordWordAttempt` helper | L240-249 | Separate function for tracking word attempts in `wordResultsRef`; not specified in plan but supports wordResults persistence |

### Changed Features (Design differs from Implementation)

None. Implementation matches plan exactly.

---

## 6. Known Persistent Issues

| Issue | Since | Impact | File:Line |
|-------|-------|--------|-----------|
| Import order (framer-motion/lucide after @/ imports) | Round 7 | Low (cosmetic) | LessonClient.tsx:L11-15 |
| `getMapping()` duplication (onboarding vs settings) | Round 8 | Low (tech debt) | Not in scope |

---

## 7. Testing Checklist Status

Based on `qa-round2.plan.md` Section 4:

| # | Test Case | Implementation Support | Verdict |
|---|-----------|----------------------|---------|
| 1 | Start lesson, go to step 5/8, navigate home, return -- resume at step 5/8 | localStorage saves/restores `stepIndex` | Supported |
| 2 | Start decode quiz, answer 3/6, navigate home, return -- resume at question 4/6 | `subStepIndex` saved/restored, `initialSubStep` passed to DecodeWordsStep | Supported |
| 3 | Answer wrong, navigate home -- Review badge count > 0 | `addScore` writes to Dexie immediately on wrong answer | Supported |
| 4 | Complete full lesson -- localStorage key cleared | `localStorage.removeItem(storageKey)` in `handleLessonComplete` | Supported |
| 5 | Close browser tab, reopen lesson -- resume | localStorage persists across tab kills | Supported |
| 6 | Build passes with 0 errors | Not verified in static analysis | Needs manual check |

---

## 8. Recommended Actions

### Immediate

None required. All functional requirements are met.

### Short-term (backlog)

| Priority | Item | File | Impact |
|----------|------|------|--------|
| Low | Fix import order (externals before @/ imports) | LessonClient.tsx:L1-19 | Convention compliance |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-15 | Initial analysis | gap-detector |
