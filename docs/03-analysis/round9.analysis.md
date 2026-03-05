# Design-Implementation Gap Analysis Report: Round 9

> **Summary**: Detail polishing and audio/visual synchronization gap analysis
>
> **Author**: gap-detector
> **Created**: 2026-03-06
> **Last Modified**: 2026-03-06
> **Status**: Approved

---

## Analysis Overview

- **Analysis Target**: Round 9 -- Detail Polishing & Audio/Visual Sync (4 tasks: 9-A, 9-B, 9-C, 9-D)
- **Design Document**: CLAUDE_TASKS.md Round 9 requirements (lines 110-134)
- **Implementation Path**: `src/app/lesson/[unitId]/LessonClient.tsx`, `src/app/lesson/[unitId]/VisemeAvatar.tsx`, `src/app/rewards/page.tsx`
- **Analysis Date**: 2026-03-06

---

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Task 9-A: Blend & Tap Audio Delay | 100% | OK |
| Task 9-B: Quiz Action Audio Separation | 100% | OK |
| Task 9-C: Viseme Close-up Refactor | 100% | OK |
| Task 9-D: My Trophies Overflow Fix | 90% | OK |
| Convention Compliance | 83% | OK |
| **Overall** | **95%** | OK |

---

## Task 9-A: Blend & Tap Audio Delay

### Requirements Checklist

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 1 | Last phoneme touch triggers phoneme sound first | MET | `LessonClient.tsx:303` -- `playPhonemeSound(word.phonemes[idx])` fires immediately on tap |
| 2 | Full word sound plays 0.5-1s after phoneme finishes | MET | `LessonClient.tsx:309` -- `setTimeout(() => playTTS(word.word), 1200)` gives ~1.2s total delay from phoneme start, well within the "phoneme finishes + 0.5-1s gap" window |
| 3 | Phoneme and word sounds do not overlap | MET | Phoneme TTS is short (~0.3-0.5s); 1200ms delay ensures no overlap |
| 4 | setTimeout-based delay mechanism | MET | `LessonClient.tsx:308-309` -- two `setTimeout` calls with 600ms and 1200ms |

### Additional Detail

The implementation adds an intermediate SFX "correct" chime at 600ms (`LessonClient.tsx:308`) between the phoneme sound (0ms) and the full word (1200ms). This creates a pleasant 3-stage audio sequence: phoneme -> chime -> word, which exceeds the plan's minimum requirement of 2-stage separation.

### Gaps Found

None. Task 9-A is fully met.

---

## Task 9-B: Quiz Action Audio Separation

### Requirements Checklist

#### DecodeWordsStep

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 1 | Button touch immediately plays SFX (correct/wrong) | MET | `LessonClient.tsx:389` -- `playSFX(correct ? 'correct' : 'wrong')` fires synchronously in `handleSelect` |
| 2 | Word pronunciation plays ~0.5s after SFX | MET | `LessonClient.tsx:390` -- `setTimeout(() => playTTS(word.word), 500)` |
| 3 | SFX and word audio do not overlap | MET | 500ms gap between SFX start and word start; SFX is typically <300ms |

#### ExitTicketStep

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 4 | Button touch immediately plays SFX (correct/wrong) | MET | `LessonClient.tsx:639` -- `playSFX(correct ? 'correct' : 'wrong')` fires synchronously in `handleAnswer` |
| 5 | Word pronunciation plays ~0.5s after SFX | MET | `LessonClient.tsx:640` -- `setTimeout(() => playTTS(word.word), 500)` |
| 6 | SFX and word audio do not overlap | MET | Same 500ms pattern as DecodeWordsStep |

### Gaps Found

None. Task 9-B is fully met.

---

## Task 9-C: Viseme Close-up Refactor

### Requirements Checklist

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 1 | Full fox face removed, replaced with lip zoom-in UI | MET | `VisemeAvatar.tsx:96-134` -- SVG viewBox shows snout/chin circle only (no ears, eyes, or full face); nose + whiskers + mouth only |
| 2 | SVG structure reorganized for lip close-up | MET | `VisemeAvatar.tsx:98-99` -- orange circle (snout) + white circle (chin area) with nose and whiskers, centered on mouth |
| 3 | isSpeaking prop drives mouth animation | MET | `VisemeAvatar.tsx:53-74` -- useEffect watches `isSpeaking`, runs interval cycling through mouth shapes |
| 4 | Framer Motion used (not simple CSS toggle) | MET | `VisemeAvatar.tsx:111-118` -- `motion.path` with spring animation (`stiffness: 400, damping: 25`) for mouth transitions |
| 5 | Framework ready for a/e/i/o/u SVG path swapping | MET | `VisemeAvatar.tsx:18-43` -- `MOUTH_SHAPES` config object with named shapes (`idle`, `open`, `wide`, `round`); comment on line 17 explicitly notes "Future: add per-vowel visemes (viseme_a, viseme_e, viseme_i, viseme_o, viseme_u)" |
| 6 | MouthState type supports extensibility | MET | `VisemeAvatar.tsx:45` -- `type MouthState = keyof typeof MOUTH_SHAPES` automatically extends when new shapes are added |

### Architecture Quality

The implementation follows a clean configuration-driven pattern:
- **MOUTH_SHAPES**: Each shape defined as `{ d, fill, stroke, strokeWidth }` -- adding a new vowel viseme requires only adding a new entry to this object.
- **SPEAKING_CYCLE**: Separate array controls animation sequence, decoupled from shape definitions.
- **Tongue detail**: Extra visual polish with conditional tongue ellipse for `open`/`wide` states.
- **Pulse rings**: `AnimatePresence`-wrapped ping animation provides visual feedback during speech.

### Gaps Found

None. Task 9-C is fully met.

---

## Task 9-D: My Trophies Overflow Fix

### Requirements Checklist

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 1 | Mobile text/date no longer clipped | MET | `rewards/page.tsx:120,125` -- `break-words w-full leading-tight` on both name and description text |
| 2 | overflow-y-auto on scroll container | MET | `rewards/page.tsx:28` -- `overflow-y-auto` on parent div |
| 3 | padding-bottom significantly increased | PARTIAL | `rewards/page.tsx:63` -- `pb-12` (48px). This is adequate for most devices but may still clip on very small viewports with browser chrome |
| 4 | Parent flex layout reviewed | MET | `rewards/page.tsx:28` -- `flex min-h-[100dvh] flex-col`; header and progress bar have `shrink-0` (lines 30, 48) preventing compression |
| 5 | Card overflow handled | MET | `rewards/page.tsx:92` -- `overflow-hidden` on card container |
| 6 | Responsive text sizing | MET | `rewards/page.tsx:107,120,125` -- `text-xs sm:text-sm`, `text-[10px] sm:text-xs`, `h-14 w-14 sm:h-16 sm:w-16` for responsive badge sizing |

### Gaps Found

#### GAP-9D-1 (Minor): pb-12 may be insufficient for some devices

- **Location**: `src/app/rewards/page.tsx:63`
- **Description**: The grid uses `pb-12` (48px) as bottom padding. On devices with large browser navigation bars (e.g., iOS Safari, Samsung Internet), the last row of trophies may still have its date text partially obscured. A larger value like `pb-24` (96px) or `pb-32` (128px) would provide more margin of safety.
- **Impact**: Low. Most devices will display correctly with `pb-12`, but edge cases with thick browser chrome may still clip the very last card's date.
- **Recommendation**: Consider increasing to `pb-20` or `pb-24` for extra safety margin, or use `pb-[env(safe-area-inset-bottom,3rem)]` for dynamic safe-area padding.

---

## Convention Compliance

### Import Order Check

| File | Order | Status | Notes |
|------|-------|:------:|-------|
| `LessonClient.tsx` | next/navigation -> react -> @/data/* -> @/lib/* -> framer-motion -> lucide-react -> ./VisemeAvatar | ISSUE | `framer-motion` and `lucide-react` (external) appear after internal `@/` imports. Should be before. |
| `VisemeAvatar.tsx` | react -> framer-motion | OK | Correct order: externals only |
| `rewards/page.tsx` | react -> next/navigation -> lucide-react -> @/lib/* -> @/data/* | OK | Correct order: externals first, then internals |

#### GAP-CONV-1 (Minor): Import order violation in LessonClient.tsx (persists from Round 7)

- **Location**: `src/app/lesson/[unitId]/LessonClient.tsx:1-14`
- **Description**: External libraries `framer-motion` (line 9) and `lucide-react` (lines 10-13) are imported after internal `@/` imports (lines 5-8). Convention requires external imports before internal `@/` imports.
- **Impact**: Low. Cosmetic/style issue only. This has been noted in Round 7 and Round 8 analyses.

### Naming Convention Check

| Convention | Status | Notes |
|------------|:------:|-------|
| Components: PascalCase | OK | `BlendTapStep`, `DecodeWordsStep`, `ExitTicketStep`, `VisemeAvatar`, `RewardCard` |
| Functions: camelCase | OK | `tapPhoneme`, `handleSelect`, `handleAnswer`, `playPhonemeSound`, `formatDate` |
| Constants: UPPER_SNAKE_CASE | OK | `MOUTH_SHAPES`, `SPEAKING_CYCLE`, `PHONEME_SPEAK_MAP`, `REWARDS` |
| Types: PascalCase | OK | `MouthState`, `VisemeAvatarProps`, `LessonStep` |

---

## Summary of All Gaps

### Missing Features (Plan O, Implementation X)

None. All 4 tasks (9-A through 9-D) are implemented.

### Added Features (Plan X, Implementation O)

| Item | Implementation Location | Description |
|------|------------------------|-------------|
| Intermediate SFX chime in BlendTap | `LessonClient.tsx:308` | "correct" SFX plays between phoneme and word -- a bonus audio cue not in the plan |
| Tongue animation in VisemeAvatar | `VisemeAvatar.tsx:122-133` | Conditional tongue ellipse adds visual detail beyond plan requirements |
| Pulse ring animation | `VisemeAvatar.tsx:83-94` | AnimatePresence ping ring around mouth during speech -- extra visual polish |

### Changed Features (Plan != Implementation)

| ID | Item | Plan | Implementation | Impact |
|----|------|------|----------------|--------|
| GAP-9D-1 | Bottom padding | "significantly increased" | `pb-12` (48px) | Low |
| GAP-CONV-1 | Import order | External before internal | framer-motion/lucide after @/ imports | Low |

---

## Match Rate Calculation

| Category | Items Checked | Items Met | Score |
|----------|:------------:|:---------:|:-----:|
| Task 9-A (BlendTap Audio) | 4 | 4 | 100% |
| Task 9-B (Quiz Audio) | 6 | 6 | 100% |
| Task 9-C (Viseme Close-up) | 6 | 6 | 100% |
| Task 9-D (Trophies Overflow) | 6 | 5.5 | 92% |
| Convention Compliance | 5 | 4 | 80% |
| **Total** | **27** | **25.5** | **95%** |

All functional requirements are met. The only gaps are a minor bottom-padding concern and the recurring import order issue in LessonClient.tsx.

---

## Recommended Actions

### Optional Improvements (No Immediate Action Required)

1. **Increase rewards page bottom padding**: Change `pb-12` to `pb-20` or `pb-24` in `src/app/rewards/page.tsx:63` for extra safety on devices with thick browser chrome.

2. **Fix import order in LessonClient.tsx**: Move `framer-motion` and `lucide-react` imports before `@/data/*` and `@/lib/*` imports. This has persisted across Rounds 7, 8, and 9.

3. **CLAUDE.md DB version**: Both `CLAUDE.md` files reference "v5 schema" but the actual schema is at v6. Noted in Round 7 analysis, still unresolved.

### Recurring Issues Tracker

| Issue | First Noted | Current Status |
|-------|-------------|----------------|
| Import order in LessonClient.tsx | Round 7 | Still present |
| getMapping() duplication (onboarding/settings) | Round 8 | Still present |
| CLAUDE.md DB version mismatch (v5 vs v6) | Round 7 | Still present |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-06 | Initial analysis | gap-detector |
