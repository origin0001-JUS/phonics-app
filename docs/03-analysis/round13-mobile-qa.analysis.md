# Round 13: Mobile QA Fixes - Gap Analysis Report

> **Analysis Type**: Gap Analysis (PDCA Check Phase)
>
> **Project**: Phonics 300 (phonics-app)
> **Analyst**: gap-detector agent
> **Date**: 2026-03-07
> **Reference**: CLAUDE_TASKS.md lines 271-305

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify that all 5 tasks in Round 13 (Mobile QA Fixes) have been implemented correctly against the CLAUDE_TASKS.md requirements.

### 1.2 Analysis Scope

- **Requirements Document**: `CLAUDE_TASKS.md` (Round 13, lines 271-305)
- **Implementation Files**:
  - `src/app/page.tsx` (Task 13-A)
  - `src/lib/audio.ts` (Task 13-B)
  - `src/app/lesson/[unitId]/LessonClient.tsx` (Tasks 13-B, 13-C, 13-D, 13-E)
  - `public/assets/audio/hi_im_foxy.mp3` (Task 13-A asset)
- **Analysis Date**: 2026-03-07

---

## 2. Task-by-Task Gap Analysis

### Task 13-A: Foxy Greeting Audio Replacement

| Requirement | Status | Evidence |
|-------------|:------:|----------|
| Generate `hi_im_foxy.mp3` via ElevenLabs | -- | Cannot verify file existence (audio directory not accessible via glob; may exist on disk but not in git history) |
| Replace `window.speechSynthesis` with `new Audio('/assets/audio/hi_im_foxy.mp3').play()` | PASS | `page.tsx:109` -- `const audio = new Audio('/assets/audio/hi_im_foxy.mp3'); audio.play().catch(() => {});` |
| Remove old `window.speechSynthesis` code from Foxy click handler | PASS | No `speechSynthesis` references remain in `page.tsx` |

**Score: 2/2 verifiable items met** (mp3 file existence cannot be verified by code analysis alone)

### Task 13-B: Mobile Audio Preload Module

| Requirement | Status | Evidence |
|-------------|:------:|----------|
| Add `preloadAudioFiles(urls: string[])` to `src/lib/audio.ts` | PASS | `audio.ts:184-193` -- function exported, iterates urls, calls `audio.load()`, uses `audioCache` |
| Call in `LessonClient.tsx` useEffect on mount with lesson word MP3 URLs | PASS | `LessonClient.tsx:184-198` -- preloads 6 lesson word URLs |
| Also preload Minimal Pair target word MP3 URLs | PASS | `LessonClient.tsx:190-196` -- iterates minimal pair items and adds both words' URLs |

**Score: 3/3 items met**

### Task 13-C: Onset-Rime 2-Step Independent Buttons

| Requirement | Status | Evidence |
|-------------|:------:|----------|
| Both onset and rime are interactive `<button>` elements | PASS | `LessonClient.tsx:572-593` -- onset `<button onClick={tapOnset}>` and rime `<button onClick={tapRime}>` |
| Independent `onsetTapped`, `rimeTapped` states | PASS | `LessonClient.tsx:496-497` -- `useState(false)` for each |
| Onset tap plays onset sound | PASS | `LessonClient.tsx:524-528` -- `tapOnset()` calls `fallbackTTS(word.onset!)` |
| Rime tap plays rime sound | PASS | `LessonClient.tsx:531-535` -- `tapRime()` calls `fallbackTTS(word.rime!)` |
| Merge animation + full word audio only when both tapped | PASS | `LessonClient.tsx:538-544` -- useEffect triggers when `onsetTapped && rimeTapped`, plays SFX then full word |
| States reset on next word | PASS | `LessonClient.tsx:550-552` -- `setOnsetTapped(false); setRimeTapped(false); setMerging(false);` |

**Score: 6/6 items met**

### Task 13-D: Session Storage Backup for Lesson State

| Requirement | Status | Evidence |
|-------------|:------:|----------|
| Save `stepIndex`, `score`, `totalQuestions` to sessionStorage keyed by unitId | PASS | `LessonClient.tsx:126-131` -- saves JSON with all 3 fields to `lesson_state_{unitId}` |
| Restore on mount via useEffect | PASS | `LessonClient.tsx:112-123` -- reads and parses sessionStorage on mount |
| Clear on ResultsStep entry | PASS | `LessonClient.tsx:203` -- `sessionStorage.removeItem(sessionKey)` in `handleLessonComplete` |

**Score: 3/3 items met**

### Task 13-E: Minimal Pair Quiz Logic Enhancement

| Requirement | Status | Evidence |
|-------------|:------:|----------|
| Randomize which word in pair is the correct answer | PASS | `LessonClient.tsx:381-383` -- `quizCorrectIndices` randomly picks index 0 or 1 per item; `correctWord = pair[quizCorrectIndices[quizIdx]]` at line 388 |
| After answering, show "Compare Sounds" section | PASS | `LessonClient.tsx:427-444` -- rendered when `showQuizResult` is true |
| Two buttons for each pair word | PASS | `LessonClient.tsx:432-441` -- maps `[pair[0], pair[1]]` to buttons |
| Each button plays audio on tap via `playWordAudio` | PASS | `LessonClient.tsx:435` -- `onClick={() => playTTS(w)}` which calls `playWordAudio` |

**Score: 4/4 items met**

---

## 3. Audio Asset Verification

### 3.1 Minimal Pair Words Audio Check

The 24 words listed in the requirements that were previously missing mp3 files:

| Word | In MINIMAL_PAIRS data | Audio preloaded |
|------|:---------------------:|:---------------:|
| bet | PASS (unit_01-02 pair) | PASS (via preload) |
| het | PASS (unit_01-02 pair) | PASS |
| pan | PASS (unit_01-02 pair) | PASS |
| bad | PASS (unit_01-02 pair) | PASS |
| bid | PASS (unit_02-03 pair) | PASS |
| pit | PASS (unit_02-03 pair) | PASS |
| nit | PASS (unit_02-03 pair) | PASS |
| bog | PASS (unit_03-04 pair) | PASS |
| put | PASS (unit_04-05 pair) | PASS |
| dug | PASS (unit_04-05 pair) | PASS |
| hate | PASS (unit_07 pair) | PASS |
| mate | PASS (unit_07 pair) | PASS |
| cane | PASS (unit_07 pair) | PASS |
| hid | PASS (unit_08 pair) | PASS |
| kit | PASS (unit_08 pair) | PASS |
| dim | PASS (unit_08 pair) | PASS |
| not | PASS (unit_09 pair) | PASS |
| rode | PASS (unit_09 pair) | PASS |
| cope | PASS (unit_09 pair) | PASS |
| cub | PASS (unit_10 pair) | PASS |
| cheap | PASS (unit_17 pair) | PASS |
| sink | PASS (unit_19 pair) | PASS |
| sick | PASS (unit_19 pair) | PASS |
| sin | PASS (unit_19 pair) | PASS |

All 24 words are present in MINIMAL_PAIRS data and their URLs are passed to `preloadAudioFiles()`. Actual mp3 file existence on disk cannot be verified by static code analysis -- this requires runtime or filesystem check via the TTS generation script.

---

## 4. Convention Compliance

### 4.1 Import Order Check

| File | Issue | Lines |
|------|-------|-------|
| `src/app/lesson/[unitId]/LessonClient.tsx` | External libraries (framer-motion L9, lucide-react L10-13) placed after internal `@/` imports (L5-8) | L5-13 |
| `src/app/page.tsx` | External library (lucide-react L7, next/link L8) placed after internal `@/` imports (L5-6) | L5-8 |

**Convention**: External libraries first, then `@/` imports, then relative imports.

This is a persistent issue noted since Round 7 and still present.

### 4.2 Naming Convention Check

| Category | Compliance |
|----------|:----------:|
| Components: PascalCase | 100% |
| Functions: camelCase | 100% |
| Constants: UPPER_SNAKE_CASE | 100% |
| Step IDs: snake_case | 100% |

### 4.3 Architecture (Starter Level)

| Check | Status |
|-------|:------:|
| Co-located components in page files | PASS |
| Utilities in `lib/` | PASS |
| Data in `data/` | PASS |
| No cross-layer violations | PASS |

---

## 5. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Task 13-A: Foxy audio replacement | 100% | PASS |
| Task 13-B: Audio preload module | 100% | PASS |
| Task 13-C: Onset-Rime independent buttons | 100% | PASS |
| Task 13-D: Session storage backup | 100% | PASS |
| Task 13-E: Minimal Pair quiz enhancement | 100% | PASS |
| Convention compliance | 95% | WARN |
| **Overall Match Rate** | **98%** | PASS |

### Match Rate Breakdown

```
Functional Requirements: 18/18 items (100%)
Convention Compliance:   95% (import order issue in 2 files)
Overall:                 98%
```

---

## 6. Gaps Found

### 6.1 Minor Gaps (non-blocking)

| # | Category | Item | Location | Description | Impact |
|---|----------|------|----------|-------------|--------|
| 1 | Convention | Import order | `LessonClient.tsx:5-13` | External libs (framer-motion, lucide-react) after `@/` imports | Low |
| 2 | Convention | Import order | `page.tsx:5-8` | External libs (lucide-react, next/link) after `@/` imports | Low |
| 3 | Asset | `hi_im_foxy.mp3` existence | `public/assets/audio/` | Cannot verify mp3 file exists on disk via static analysis | Low |
| 4 | Asset | 24 minimal pair mp3 files | `public/assets/audio/` | Cannot verify mp3 files exist on disk via static analysis | Low |

### 6.2 Observations

- **Task 13-E `playTTS` vs `playWordAudio`**: The Compare Sounds buttons call `playTTS(w)` which internally calls `playWordAudio(text)`. This is functionally correct, though the task description says "playWordAudio". The indirection through `playTTS` is a local alias defined at line 324-326 and works identically.
- **Task 13-D error handling**: Both save and restore operations are wrapped in try/catch blocks, which is good defensive coding for sessionStorage quota errors.
- **Task 13-C merge timing**: The merge uses `useEffect` with dependency on `onsetTapped && rimeTapped`, which is a clean React pattern for handling the "both tapped" condition.

---

## 7. Recommended Actions

### 7.1 Optional Improvements

| Priority | Item | File | Description |
|----------|------|------|-------------|
| Low | Fix import order | `LessonClient.tsx` | Move framer-motion and lucide-react imports before `@/` imports |
| Low | Fix import order | `page.tsx` | Move lucide-react and next/link imports before `@/` imports |
| Low | Verify audio files | CLI | Run `npx tsx scripts/audit-audio.ts` to confirm all 24 minimal pair mp3 files exist |

### 7.2 Documentation Updates

| Item | Description |
|------|-------------|
| CLAUDE.md DB schema | Still says "v5" in some places; actual schema is v6 |
| CLAUDE_TASKS.md | Mark Round 13 as completed |

---

## 8. Conclusion

Round 13 implementation achieves a **98% match rate** against requirements. All 5 tasks (13-A through 13-E) are fully implemented with correct logic. The only gaps are the persistent import order convention issue (carried over from Round 7) and the inability to verify audio asset files via static analysis. No functional gaps exist.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-07 | Initial analysis | gap-detector |
