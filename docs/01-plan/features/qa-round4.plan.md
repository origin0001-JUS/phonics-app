# QA Round 4 Bug Fix Plan

> **Feature**: qa-round4
> **Type**: Bug Fix
> **Priority**: Critical
> **Date**: 2026-03-15
> **Design Doc**: [ROUND4_CLAUDE_PROMPT.md](../../ROUND4_CLAUDE_PROMPT.md)

---

## 1. Overview

QA Round 4 addresses 5 bugs discovered during beta testing feedback.

## 2. Requirements

### 2.1 Part O: WordFamily Range Error
**File**: `src/app/lesson/[unitId]/WordFamilyBuilder.tsx`
**Problem**: Family progress text exceeds bounds (e.g., "Family 4 / 3") and UI freezes after last family word is built.
**Fix**: Clamp `familyIdx` to valid range. Add `tapping` guard to prevent double-tap race conditions during state transitions.

### 2.2 Part P: WordFamily Audio Timing & Effect Missing
**File**: `src/app/lesson/[unitId]/WordFamilyBuilder.tsx`
**Problem**: Wrong SFX doesn't play reliably. Word audio gets cut off by premature state transitions.
**Fix**: Add try/catch around `playSFX('wrong')`. Increase delay before state transition from 600ms to 1400ms so word audio plays fully before the correct SFX fires.

### 2.3 Part Q: Say&Check Autoplay Issue
**File**: `src/app/lesson/[unitId]/LessonClient.tsx` (SayCheckStep function)
**Problem**: Word audio doesn't auto-play when entering Say & Check step or when word changes.
**Fix**: Add auto-play logic in the `useEffect` that fires on `idx` change. Play TTS after 300ms delay, set `hasListened=true` after 1500ms so mic button unlocks automatically.

### 2.4 Part S: Pronunciation Assessment Similarity UI
**File**: `src/app/lesson/[unitId]/LessonClient.tsx` (SayCheckStep function)
**Problem**: STT evaluation only silently passes or fails — no visual accuracy score shown.
**Fix**: Add accuracy percentage text + progress bar below the matched/unmatched feedback, using `result.confidence` from the STT engine.

### 2.5 Part T: Review Queue Not Working
**File**: `src/app/lesson/[unitId]/LessonClient.tsx` (addScore function)
**Problem**: SRS review queue appears empty despite wrong answers. Root cause: `calculateNextReview` with rating 0 sets `nextReviewDate = today + 1 day`, so cards aren't due until tomorrow.
**Fix**: Override `nextReviewDate` to today when writing wrong-answer cards immediately to Dexie, so review badge and queue reflect failures right away.

## 3. Implementation Summary

### Files Modified
| File | Changes |
|------|---------|
| `src/app/lesson/[unitId]/WordFamilyBuilder.tsx` | Parts O & P (index clamping, tapping guard, audio timing) |
| `src/app/lesson/[unitId]/LessonClient.tsx` | Parts Q, S, T (autoplay, similarity UI, SRS date override) |

### Key Changes
1. **safeFamilyIdx**: `Math.min(familyIdx, families.length - 1)` clamp
2. **tapping guard**: Prevents double-tap during audio playback (1400ms window)
3. **try/catch on playSFX('wrong')**: Ensures audio errors don't break interaction
4. **Auto-play useEffect**: 300ms delay TTS + 1500ms hasListened unlock on idx change
5. **Accuracy UI**: `result.confidence` displayed as percentage + progress bar
6. **SRS nextReviewDate override**: Set to today instead of tomorrow for immediate review visibility

## 4. Testing Checklist

- [ ] WordFamily progress never shows index > total (e.g., "Family 4/3")
- [ ] WordFamily auto-advances to next family or calls onNext after last family
- [ ] Wrong SFX plays when tapping distractor in WordFamily
- [ ] Word audio plays fully before correct SFX in WordFamily
- [ ] Say&Check auto-plays word audio on mount and word change
- [ ] Mic button unlocks after auto-play completes
- [ ] Accuracy % and progress bar shown after STT recording
- [ ] Wrong quiz answers immediately appear in Review queue (due today)
- [ ] Build passes with 0 errors
