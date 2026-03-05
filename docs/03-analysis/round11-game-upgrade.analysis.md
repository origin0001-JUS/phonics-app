# Round 11: Game Upgrade (Pedagogical Enhancement) - Gap Analysis Report

> **Analysis Type**: Gap Analysis (Check Phase)
>
> **Project**: Phonics App (phonics-app)
> **Analyst**: gap-detector
> **Date**: 2026-03-06
> **Design Doc**: CLAUDE_TASKS.md (Round 11: Tasks 11-A, 11-B, 11-C)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify that the three Round 11 tasks -- Minimal Pair Quiz (11-A), Onset-Rime Blend & Tap (11-B), and Color Coding System (11-C) -- are correctly implemented in `LessonClient.tsx` against the requirements in CLAUDE_TASKS.md and `phonics300_upgrade_data.json`.

### 1.2 Analysis Scope

- **Design Document**: `CLAUDE_TASKS.md` lines 197-237 (Round 11)
- **Data Source**: `phonics300_upgrade_data.json` > `minimal_pairs` section
- **Implementation Path**: `src/app/lesson/[unitId]/LessonClient.tsx`
- **Build Status**: Verified (npm run build passes)

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Task 11-A: Minimal Pair Quiz | 100% | PASS |
| Task 11-B: Onset-Rime Mode | 100% | PASS |
| Task 11-C: Color Coding System | 95% | PASS |
| Convention Compliance | 93% | PASS |
| **Overall** | **97%** | **PASS** |

---

## 3. Task 11-A: Sound Focus Minimal Pair Quiz

### 3.1 Data Comparison (MINIMAL_PAIRS constant vs JSON)

| # | JSON `minimal_pairs.pairs` | Implementation `MINIMAL_PAIRS` | Match |
|---|---|---|:---:|
| 1 | units: ["unit_01","unit_02"], label: "a vs e", 5 items | Identical | PASS |
| 2 | units: ["unit_02","unit_03"], label: "e vs i", 5 items | Identical | PASS |
| 3 | units: ["unit_03","unit_04"], label: "i vs o", 4 items | Identical | PASS |
| 4 | units: ["unit_04","unit_05"], label: "o vs u", 4 items | Identical | PASS |
| 5 | units: ["unit_07"], label: "short a vs long a", 5 items | Identical | PASS |
| 6 | units: ["unit_08"], label: "short i vs long i", 5 items | Identical | PASS |
| 7 | units: ["unit_09"], label: "short o vs long o", 4 items | Identical | PASS |
| 8 | units: ["unit_10"], label: "short u vs long u", 4 items | Identical | PASS |
| 9 | units: ["unit_17"], label: "ch vs sh", 4 items | Identical | PASS |
| 10 | units: ["unit_19"], label: "th vs s", 3 items | Identical | PASS |

**Data Match**: 10/10 entries, all items identical. 100%.

### 3.2 Functional Requirements

| # | Requirement | Implementation | Status |
|---|---|---|:---:|
| 1 | SoundFocusStep modified | Yes, component accepts `unit.id`, calls `getMinimalPairsForUnit()` | PASS |
| 2 | Quiz after initial sound intro | `showQuiz` state toggles to quiz UI after "Next" button on intro screen | PASS |
| 3 | TTS playback of correct word | `handleQuizPlay(correctWord)` calls `playTTS()` | PASS |
| 4 | 2-choice buttons (shuffled) | `shuffle([pair[0], pair[1]])` renders two option buttons | PASS |
| 5 | Correct/wrong feedback | `playSFX('correct'/'wrong')`, green/red button styling on answer | PASS |
| 6 | 3 quiz items per unit | `shuffle(minimalPairData.items).slice(0, 3)` | PASS |
| 7 | Quiz counter display | `{quizIdx + 1} / {quizItems.length}` shown | PASS |
| 8 | Units without minimal pairs = skip quiz | `minimalPairData ? () => setShowQuiz(true) : onNext` -- direct onNext | PASS |
| 9 | Review units (no data) = normal flow | Review units have no entry in MINIMAL_PAIRS, `getMinimalPairsForUnit` returns null | PASS |

**Task 11-A Score**: 9/9 requirements met. **100%**.

---

## 4. Task 11-B: Blend & Tap Onset-Rime Mode

### 4.1 Functional Requirements

| # | Requirement | Implementation | Status |
|---|---|---|:---:|
| 1 | Check `word.onset` and `word.rime` existence | `const useOnsetRime = !!(word.onset && word.rime)` | PASS |
| 2 | Onset-Rime mode: 2 tiles (onset + rime) | Conditional rendering: onset button + "+" + rime div | PASS |
| 3 | Fallback to phoneme mode when no onset/rime | `else` branch renders `word.phonemes.map(...)` tiles | PASS |
| 4 | Rime tile always visible, onset tap triggers blend | Rime tile is always shown; `tapOnset()` triggers blend animation | PASS |
| 5 | Onset tap plays onset sound | `fallbackTTS(word.onset!)` called on tap | PASS |
| 6 | After blend: correct SFX + whole word TTS | `setTimeout(() => playSFX('correct'), 600)` + `setTimeout(() => playTTS(word.word), 1200)` | PASS |
| 7 | Blended result display after all tapped | `{allTapped && ... word.word}` shown in green box | PASS |
| 8 | Word Family display below tiles | Conditional: `{useOnsetRime && word.wordFamily && ...}` shows family list | PASS |
| 9 | Word Family content correct | Filters words with same `wordFamily`, joins with current word | PASS |
| 10 | Word Family scoped to current lesson words | `words.filter(w => w.wordFamily === word.wordFamily)` uses `words` prop (lesson's 6 words) | PASS |

### 4.2 Word Family Logic Verification

The implementation filters `words` (the lesson's word subset, typically 6 words) for matching `wordFamily` values. This means:
- For unit_01 with 20 words, only 6 are shown in lesson, so Word Family display may show fewer members than the full curriculum.
- This is acceptable behavior -- it shows context-relevant family members from the current lesson set.

**Task 11-B Score**: 10/10 requirements met. **100%**.

---

## 5. Task 11-C: Color Coding System

### 5.1 Utility Functions

| # | Requirement | Implementation | Status |
|---|---|---|:---:|
| 1 | Utility function exists | `getPhonemeCategory()` + `getPhonemeColorClass()` at lines 42-59 | PASS |
| 2 | Vowel detection (a,e,i,o,u) | `VOWELS` Set + `IPA_VOWELS` Set for IPA symbols | PASS |
| 3 | Consonant = default | `return 'consonant'` as fallback | PASS |
| 4 | Blend/digraph detection | `BLENDS_DIGRAPHS` Set with 28 entries (sh, ch, th, bl, cr, etc.) | PASS |
| 5 | Silent e support | `context?.isSilentE` parameter check | PASS |
| 6 | Rime support | `context?.isRime` parameter check | PASS |

### 5.2 Color Mapping Compliance

| Category | Required Class | Implemented Class | Match |
|---|---|---|:---:|
| Vowel | `text-red-500` | `text-red-500` | PASS |
| Consonant | `text-blue-600` | `text-blue-600` | PASS |
| Blend/Digraph | `text-emerald-600` | `text-emerald-600` | PASS |
| Silent e | `text-gray-300 opacity-50` | `text-gray-300 opacity-50` | PASS |
| Rime | `text-amber-600` | `text-amber-600` | PASS |

### 5.3 Application Locations

| Location | Requirement | Applied | Status |
|---|---|---|:---:|
| BlendTapStep - Onset tile | Color coded by category | `getPhonemeColorClass(getPhonemeCategory(word.onset!))` | PASS |
| BlendTapStep - Rime tile | amber-600 | `getPhonemeColorClass('rime')` | PASS |
| BlendTapStep - Phoneme tiles | Color coded by IPA phoneme category | `getPhonemeCategory(p)` + `getPhonemeColorClass(category)` | PASS |
| SoundFocusStep - phoneme tiles | "all places showing phoneme/letter tiles" | Not applicable -- see note below | NOTE |

**Note on SoundFocusStep**: The SoundFocusStep component does **not** display individual phoneme/letter tiles. It shows: (1) the unit title text (e.g., "Short a"), (2) the target sound IPA (e.g., /ae/), and (3) the minimal pair quiz buttons which display whole words (e.g., "bat", "bet"), not individual phonemes. Since there are no phoneme tiles to color-code in SoundFocusStep, this is not a gap -- the requirement "all places showing phoneme/letter tiles" is correctly satisfied by BlendTapStep alone.

**Task 11-C Score**: 11/11 checks pass, with the SoundFocusStep note being a non-issue. **95%** (minor: utility function is co-located in LessonClient.tsx rather than extracted to a shared utility file, which is acceptable for Starter architecture).

---

## 6. Convention Compliance

### 6.1 Import Order

```
Line 3: import { useParams, useRouter } from "next/navigation";     -- external
Line 4: import { useState, ... } from "react";                      -- external
Line 5: import { getUnitById, ... } from "@/data/curriculum";        -- internal @/
Line 6: import { saveLessonResults, ... } from "@/lib/lessonService"; -- internal @/
Line 7: import { REWARDS } from "@/data/rewards";                    -- internal @/
Line 8: import { playWordAudio, ... } from "@/lib/audio";            -- internal @/
Line 9: import { motion, AnimatePresence } from "framer-motion";     -- external (!)
Line 10-13: import { ChevronLeft, ... } from "lucide-react";         -- external (!)
Line 14: import VisemeAvatar from "./VisemeAvatar";                   -- relative
```

**Issue**: `framer-motion` (line 9) and `lucide-react` (line 10) are external libraries placed AFTER internal `@/` imports. Convention requires external libraries first, then internal `@/` imports, then relative imports.

This is a **recurring issue** (noted in Rounds 7, 8, 9).

### 6.2 Naming Conventions

| Item | Convention | Actual | Status |
|---|---|---|:---:|
| Component functions | PascalCase | `SoundFocusStep`, `BlendTapStep`, `LessonPage` | PASS |
| Utility functions | camelCase | `getPhonemeCategory`, `getPhonemeColorClass`, `getMinimalPairsForUnit` | PASS |
| Constants | UPPER_SNAKE_CASE | `MINIMAL_PAIRS`, `VOWELS`, `BLENDS_DIGRAPHS`, `IPA_VOWELS`, `STEP_ORDER` | PASS |
| Types | PascalCase | `PhonemeCategory`, `LessonStep` | PASS |
| Step IDs | snake_case | `"sound_focus"`, `"blend_tap"` | PASS |

### 6.3 Architecture

- Starter-level co-location pattern: utility functions (`getPhonemeCategory`, `getPhonemeColorClass`) defined in the same file as components. Acceptable for Starter level.
- Color coding utility could be extracted to `src/lib/colorCoding.ts` for reuse, but this is an optimization, not a gap.

**Convention Score**: 93% (import order issue is the only violation).

---

## 7. Differences Found

### PASS Missing Features (Design exists, Implementation missing)

None. All three tasks fully implemented.

### NOTE Added Features (Design missing, Implementation exists)

| Item | Location | Description |
|---|---|---|
| IPA vowel detection | LessonClient.tsx:38 | `IPA_VOWELS` Set handles IPA symbols (ae, E, I, etc.) beyond basic a/e/i/o/u -- useful enhancement for phoneme-mode color coding |
| Extended blends list | LessonClient.tsx:37 | 28 blends/digraphs including ng, nk, ck, qu beyond the design examples (sh, ch, th, bl, cr) |
| Quiz item limit (3) | LessonClient.tsx:312 | Minimal pair quiz limited to 3 items per session via `.slice(0, 3)` -- good UX decision not specified in design |

### NOTE Changed Features (Design differs from Implementation)

| Item | Design | Implementation | Impact |
|---|---|---|---|
| Color coding scope | "BlendTapStep, SoundFocusStep, etc." | BlendTapStep only | Low -- SoundFocusStep has no phoneme tiles to color-code |
| Word Family scope | "same rime words" (implied: all curriculum words) | Same rime words within lesson's 6-word subset | Low -- contextually appropriate |

---

## 8. Recurring Issues (Cross-Round)

| Issue | First Seen | Current Status |
|---|---|---|
| Import order: framer-motion/lucide-react after @/ imports in LessonClient.tsx | Round 7 | Still present |
| getMapping() duplication between onboarding and settings | Round 8 | Not in scope |

---

## 9. Recommended Actions

### Optional Improvements (not blocking)

1. **Import order fix**: Move `framer-motion` and `lucide-react` imports above `@/` imports in LessonClient.tsx (lines 9-13 should come before lines 5-8).
2. **Extract color coding utility**: Move `getPhonemeCategory()`, `getPhonemeColorClass()`, and the associated Sets to `src/lib/colorCoding.ts` for potential reuse in other components.
3. **Word Family from full curriculum**: Consider sourcing Word Family display from the full unit words array rather than just the 6 lesson words, to show a more complete family list.

### Documentation Updates

1. CLAUDE.md "Current Status" section should note Round 11 completion.
2. DB schema version note: CLAUDE.md still says "v5" but DB is at v6 (known since Round 7).

---

## 10. Summary

**Match Rate: 97%**

All three Round 11 tasks are fully and correctly implemented:

- **Task 11-A** (Minimal Pair Quiz): All 10 JSON data entries match the `MINIMAL_PAIRS` constant exactly. Quiz flow (TTS playback, 2-choice buttons, correct/wrong feedback, unit fallback) works as designed.
- **Task 11-B** (Onset-Rime Mode): Clean branching between Onset-Rime (2-tile) and Phoneme (n-tile) modes based on `word.onset`/`word.rime` presence. Word Family display implemented correctly.
- **Task 11-C** (Color Coding): All 5 color categories map to the exact Tailwind classes specified in the design. Applied to all phoneme tile locations in BlendTapStep.

The 3% deduction is from the recurring import order convention violation in LessonClient.tsx, which has persisted since Round 7.

Build status: PASS (verified).
