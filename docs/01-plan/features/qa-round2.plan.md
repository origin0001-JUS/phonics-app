# QA Round 2 Bug Fix Plan

> **Feature**: qa-round2
> **Type**: Bug Fix
> **Priority**: Critical
> **Date**: 2026-03-15
> **Design Doc**: [CLAUDE_PROMPT_QA_ROUND2.md](../../CLAUDE_PROMPT_QA_ROUND2.md)

---

## 1. Overview

QA Round 2 addresses 2 critical bugs discovered during local browser testing after v2-bugfix completion.

## 2. Requirements

### 2.1 Bug 1: Progress Volatility (Task 1 - Most Urgent)

**Problem**: Lesson progress (step position) is lost when the user navigates away mid-lesson and returns. The user restarts from step 1/8 instead of continuing from their last step.

**Root Cause**: `sessionStorage` is used for lesson state persistence. On mobile devices, the OS may kill the browser tab when backgrounded, clearing `sessionStorage`. Also, quiz word results (`wordResultsRef`) are not persisted at all.

**Fix**: Switch from `sessionStorage` to `localStorage` for lesson state persistence. Also persist `wordResults` so quiz progress survives navigation.

### 2.2 Bug 2: SRS Review Queue Not Updated (Task 1)

**Problem**: Wrong answers during quizzes do not immediately update the Review badge count on the home screen. The badge shows "All caught up!" even after multiple wrong answers.

**Root Cause**: SRS cards are only updated in `saveLessonResults()` which runs at lesson completion (Results screen). During the lesson, wrong answers are tracked only in `wordResultsRef` (in-memory), not written to Dexie/IndexedDB.

**Fix**: Immediately write SRS card updates to Dexie when `addScore` records a wrong answer (Rating 0 = Again), setting `nextReviewDate` to today so the card appears in the review queue.

### 2.3 Bug 3: Sub-step Session Restore (Task 2 - Previously Deferred Bug #4)

**Problem**: Session restore only works at step-level granularity. If a user leaves during quiz question 3/6, they return to question 1/6 of the same step.

**Fix**: Add `subStepIndex` to the persisted state. Pass it to child step components (`DecodeWordsStep`, `SayCheckStep`, `ExitTicketStep`) as `initialSubStep` and report changes back via `onSubStepChange` callback.

## 3. Implementation Summary

### Files Modified
| File | Changes |
|------|---------|
| `src/app/lesson/[unitId]/LessonClient.tsx` | All 3 fixes (localStorage, SRS immediate update, subStepIndex) |

### Key Changes
1. **sessionStorage → localStorage** for `lesson_state_{unitId}`
2. **New state**: `subStepIndex` with save/restore in localStorage
3. **wordResults persistence**: Serialize/restore `wordResultsRef` Map
4. **Immediate SRS update**: `addScore` writes wrong answers to Dexie immediately via `calculateNextReview(card, 0)`
5. **New imports**: `db`, `createNewCard`, `calculateNextReview`, `vocabCardToSRSCard`, `srsCardToVocabCard`
6. **Step component props**: `initialSubStep` + `onSubStepChange` added to DecodeWordsStep, SayCheckStep, ExitTicketStep
7. **goNext reset**: `setSubStepIndex(0)` on step advance

## 4. Testing Checklist

- [ ] Start lesson, progress to step 5/8, navigate home, return — should resume at step 5/8
- [ ] Start decode quiz, answer 3/6 questions, navigate home, return — should resume at question 4/6
- [ ] Answer quiz question wrong → navigate to home → Review badge count should be > 0
- [ ] Complete full lesson → localStorage key should be cleared
- [ ] Close browser tab completely, reopen lesson — should still resume (localStorage persists)
- [ ] Build passes with 0 errors
