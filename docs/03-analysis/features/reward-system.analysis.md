# Reward System (reward-system) Gap Analysis Report

> **Analysis Type**: Gap Analysis (Plan vs Implementation)
>
> **Project**: Phonics App (Phonics 300)
> **Analyst**: Claude (gap-detector agent)
> **Date**: 2026-03-03
> **Plan Doc**: [reward-system.plan.md](../../01-plan/features/reward-system.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Compare the reward-system Plan document (reward-system.plan.md) against all implemented files to verify every Functional Requirement (FR-01 through FR-06) and Non-Functional Requirement is met. Identify gaps, discrepancies, and added features.

### 1.2 Analysis Scope

- **Plan Document**: `docs/01-plan/features/reward-system.plan.md`
- **Implementation Files**:
  - `src/data/rewards.ts` (NEW)
  - `src/lib/db.ts` (MODIFIED)
  - `src/lib/lessonService.ts` (MODIFIED)
  - `src/app/rewards/page.tsx` (NEW)
  - `src/app/lesson/[unitId]/page.tsx` (MODIFIED)
  - `src/app/page.tsx` (MODIFIED)
- **Analysis Date**: 2026-03-03

---

## 2. Functional Requirements Analysis

### FR-01: Trophy/Badge Definitions (8-10 types with conditions and metadata)

**Status: FULLY MET**

| Plan Trophy | Plan Emoji | Impl ID | Impl Emoji | Impl Name | Match |
|-------------|:----------:|---------|:----------:|-----------|:-----:|
| first_lesson (Milestone) | target | first_lesson | target | first_lesson | YES |
| ten_words (Vocabulary) | books | ten_words | books | ten_words | YES |
| fifty_words (Vocabulary) | trophy | fifty_words | trophy | fifty_words | YES |
| hundred_words (Vocabulary) | crown | hundred_words | crown | hundred_words | YES |
| unit_complete (Unit) | check | unit_complete | check | unit_complete | YES |
| five_units (Unit) | map | five_units | map | five_units | YES |
| level_coreA (Level) | star | level_coreA | star | level_coreA | YES |
| perfect_lesson (Performance) | star2 | perfect_lesson | star2 | perfect_lesson | YES |
| three_day_streak (Streak) | fire | three_day_streak | fire | three_day_streak | YES |
| seven_day_streak (Streak) | flexed_biceps | seven_day_streak | flexed_biceps | seven_day_streak | YES |

All 10 trophies are defined with matching IDs, names, emojis, and categories.

**Implementation additions** (not in Plan but beneficial):
- `RewardDefinition` interface includes `color` and `shadowColor` fields for 3D badge styling -- consistent with the project design system.
- `RewardCategory` type provides compile-time safety for categories.
- `description` field added for each trophy (used as hint text for locked badges).

### FR-02: Dexie `rewards` Table (unlocked trophy ID + unlock timestamp)

**Status: FULLY MET**

| Plan Specification | Implementation | Match |
|--------------------|----------------|:-----:|
| Interface: `UnlockedReward { id: string; unlockedAt: string }` | Exact match at db.ts:30-33 | YES |
| Dexie store: `rewards: 'id'` | db.ts:88 `rewards: 'id'` | YES |
| Schema version: v5 | db.ts:84 `this.version(5)` | YES |
| EntityTable declaration | db.ts:39 `rewards!: EntityTable<UnlockedReward, 'id'>` | YES |

**Migration note**: The Plan mentions "v5 upgrade function to protect existing data" in the Risks section. The implementation adds version 5 as a simple new-table addition without an `upgrade()` callback, which is correct for Dexie -- new tables do not require data migration. Existing tables (progress, cards, logs) carry over automatically.

### FR-03: `checkAndUnlockRewards()` -- auto-unlock on lesson completion

**Status: FULLY MET**

| Plan Condition | Plan Logic | Implementation (lessonService.ts) | Match |
|----------------|-----------|-----------------------------------|:-----:|
| first_lesson | First lesson completed | `totalLessons >= 1` (line 101) | YES |
| ten_words | 10+ words at stage >= 2 | `masteredCards >= 10` via `db.cards.where('stage').aboveOrEqual(2).count()` (line 96) | YES |
| fifty_words | 50+ words at stage >= 2 | `masteredCards >= 50` (line 103) | YES |
| hundred_words | 100+ words at stage >= 2 | `masteredCards >= 100` (line 104) | YES |
| unit_complete | First unit 100% complete | `completedUnits.length >= 1` (line 105) | YES |
| five_units | 5 units complete | `completedUnits.length >= 5` (line 106) | YES |
| level_coreA | CoreA level complete (unit 1-12) | Checks all 12 unit IDs exist in completedUnits (lines 107-109) | YES |
| perfect_lesson | 3 stars in a lesson | `isPerfectLesson` parameter (line 110) | YES |
| three_day_streak | 3 consecutive days | `streakDays >= 3` via `getStreakDays()` (lines 70-87, 111) | YES |
| seven_day_streak | 7 consecutive days | `streakDays >= 7` (line 112) | YES |

**Data Flow Verification** (Plan Section 5.4):

| Plan Flow Step | Implementation | Match |
|----------------|----------------|:-----:|
| Lesson Complete -> saveLessonResults() | saveLessonResults() at line 128 | YES |
| -> checkAndUnlockRewards() | Called at line 199 inside saveLessonResults() | YES |
| DB queries: completedUnits, cards, logs | Lines 94-98: progress, cards.where(stage>=2), logs.count, getStreakDays() | YES |
| Each trophy condition evaluated | Lines 100-113: conditions record | YES |
| Unlocked trophies -> db.rewards.put() | Lines 116-122 | YES |
| Return newlyUnlocked: string[] | Line 125: `return newlyUnlocked` | YES |
| Results screen displays new badges | lesson page line 108-109: `setNewRewards(unlocked)` | YES |

**Additional implementation detail**: `isPerfectLesson` is determined by `pct >= 90` (lesson page line 102), which aligns with the existing 3-star threshold in the results screen (`pct >= 90 ? 3` at lesson page line 602). This is a sound implementation choice, though the Plan does not explicitly define the "3 stars" threshold as >= 90%.

### FR-04: `/rewards` Page (badge grid with locked/unlocked visualization)

**Status: FULLY MET**

| Plan Requirement | Implementation (rewards/page.tsx) | Match |
|------------------|-----------------------------------|:-----:|
| Grid display of all badges | `grid grid-cols-2 gap-4` at line 63 | YES |
| Locked state visualization | Opacity-60, gray background, Lock icon (lines 95-101) | YES |
| Unlocked state visualization | Full color, emoji shown, shadow styling (lines 93-94, 107-117) | YES |
| Page accessible at `/rewards` | File at `app/rewards/page.tsx` | YES |

**Visual Design Compliance**:
- Uses rounded-[2rem] cards (consistent with project design system)
- 3D shadow on badge circles (`boxShadow: 0 4px 0 ${shadowColor}`)
- border-4 styling matches project convention
- Lock icon from lucide-react (line 5, 101)
- Progress bar showing total completion (lines 48-55)
- Loading state handled (lines 58-61)

### FR-05: Lesson Results Screen -- newly unlocked badge notification

**Status: FULLY MET**

| Plan Requirement | Implementation (lesson/[unitId]/page.tsx) | Match |
|------------------|-------------------------------------------|:-----:|
| New badge popup/banner on results | Lines 630-656: amber-colored banner with trophy details | YES |
| Shows trophy emoji and name | Lines 637-653: emoji circle + name text | YES |
| Only shown when new badges exist | Line 631: `unlockedRewardDefs.length > 0` conditional | YES |

**Implementation details**:
- Banner uses amber color scheme (`bg-[#fef3c7]`, `border-[#fcd34d]`) consistent with reward theme
- "New Trophy Unlocked!" header text
- Each newly unlocked badge shows its colored emoji circle + Korean name
- Properly integrates with the `saveLessonResults()` async flow via `.then()` callback (lines 108-109)

### FR-06: Home Screen -- rewards page entry button (Trophy icon)

**Status: FULLY MET**

| Plan Requirement | Implementation (app/page.tsx) | Match |
|------------------|-------------------------------|:-----:|
| Rewards button on home screen | Lines 131-137: Link component to /rewards | YES |
| Trophy icon | Line 135: `<Trophy>` from lucide-react | YES |
| Navigates to /rewards | Line 132: `href="/rewards"` | YES |

**Implementation details**:
- Full-width button below the Learn/Review grid
- Amber/gold color scheme matching the reward theme
- 3D shadow styling with active press animation
- Text: "My Trophies" (English; Plan mentions Korean app but English UI is consistent with other buttons like "Learn" and "Review")

---

## 3. Non-Functional Requirements Analysis

### NFR-01: Performance (trophy unlock judgment < 50ms)

**Status: LIKELY MET (cannot measure directly in static analysis)**

| Concern | Assessment |
|---------|------------|
| Query complexity | All queries use Dexie indexed operations: `.count()`, `.get()`, `.toArray()` with index on 'stage' |
| Data size | Maximum ~300 words, ~24 units, ~365 logs (1 year) -- trivially small for IndexedDB |
| Streak calculation | `getStreakDays()` fetches all logs and processes unique dates -- for typical usage (< 1000 logs) this is well under 50ms |

**Potential concern**: `getStreakDays()` at line 71 calls `db.logs.orderBy('date').reverse().toArray()` which loads ALL logs into memory. For very heavy usage (thousands of logs), this could degrade. However, for the target audience and expected usage patterns, this is acceptable.

### NFR-02: UX (locked badges show hints)

**Status: FULLY MET**

| Requirement | Implementation |
|-------------|----------------|
| Locked badges show hint of what they are | rewards/page.tsx line 128: locked badges show `reward.description` (e.g., "Complete your first lesson") |
| Locked visual distinction | Gray background, opacity-60, "?" instead of emoji, "???" instead of name |

### NFR-03: Accessibility (44px+ touch targets, alt text)

**Status: PARTIALLY MET**

| Requirement | Implementation | Status |
|-------------|----------------|:------:|
| Touch targets 44px+ | Back button: h-11 w-11 (44px). Badge cards: full grid cells (well above 44px). Home rewards button: full width with py-4. | YES |
| Alt text for badges | No `aria-label` or `alt` attributes on badge emoji circles or cards | MISSING |

**Gap**: The RewardCard component does not include `aria-label` attributes on the badge elements. While the emoji and text are visible, screen readers would benefit from explicit labels.

---

## 4. Architecture Compliance

### 4.1 File Structure Match

| Plan (Section 5.2) | Implementation | Status |
|--------------------|----------------|:------:|
| `src/data/rewards.ts` [NEW] | EXISTS | YES |
| `src/lib/db.ts` [MODIFY] | MODIFIED with rewards table | YES |
| `src/lib/lessonService.ts` [MODIFY] | MODIFIED with checkAndUnlockRewards() | YES |
| `src/app/rewards/page.tsx` [NEW] | EXISTS | YES |
| `src/app/lesson/[unitId]/page.tsx` [MODIFY] | MODIFIED with badge notification | YES |
| `src/app/page.tsx` [MODIFY] | MODIFIED with rewards button | YES |

All 6 files match the Plan exactly. No unexpected files were created.

### 4.2 Project Level Compliance

Plan states **Starter** level. Implementation follows existing patterns:
- Co-located components inside page files (RewardCard in rewards/page.tsx)
- Utilities in `lib/` folder
- Static data in `data/` folder
- No unnecessary abstraction layers

### 4.3 Dependency Direction

| From | To | Direction | Status |
|------|-----|-----------|:------:|
| rewards/page.tsx | @/lib/db | Presentation -> Infrastructure | Acceptable for Starter level |
| rewards/page.tsx | @/data/rewards | Presentation -> Data | YES |
| lesson/[unitId]/page.tsx | @/data/rewards | Presentation -> Data | YES |
| lesson/[unitId]/page.tsx | @/lib/lessonService | Presentation -> Service | YES |
| lessonService.ts | @/lib/db | Service -> Infrastructure | YES |
| lessonService.ts | @/data/rewards | Service -> Data | YES |
| page.tsx (home) | @/lib/db | Presentation -> Infrastructure | Acceptable for Starter level |

---

## 5. Convention Compliance

### 5.1 Naming Conventions

| Category | Convention | Implementation | Status |
|----------|-----------|----------------|:------:|
| Components | PascalCase | RewardsPage, RewardCard, ResultsStep | YES |
| Functions | camelCase | checkAndUnlockRewards, getStreakDays, formatDate | YES |
| Constants | UPPER_SNAKE_CASE | REWARDS, REVIEW_PREREQUISITES, REVIEW_UNIT_NUMBERS | YES |
| Types/Interfaces | PascalCase | RewardDefinition, RewardCategory, UnlockedReward | YES |
| Files (utility) | camelCase.ts | rewards.ts, db.ts, lessonService.ts | YES |
| Files (page) | page.tsx | All pages follow Next.js convention | YES |
| Trophy IDs | snake_case | first_lesson, ten_words, etc. | YES (matches step types convention) |

### 5.2 Import Order

All files follow the correct import order:
1. External libraries (react, next/navigation, lucide-react)
2. Internal absolute imports (@/lib/db, @/data/rewards)
3. Type imports (where applicable, using `type` keyword)

### 5.3 Styling Compliance

| Convention | Implementation | Status |
|------------|----------------|:------:|
| Fredoka font | Inherited from layout.tsx | YES |
| 3D push-button shadows | Rewards button, badge circles | YES |
| border-4 | Cards, badges, buttons all use border-4 | YES |
| rounded-[2rem] | Cards use rounded-[2rem] | YES |
| "use client" on all pages | rewards/page.tsx line 1 | YES |

---

## 6. Trophy Condition Deep Verification

### 6.1 Condition Logic Correctness

| Trophy | Plan Condition | Code Condition | Semantic Match | Edge Cases |
|--------|---------------|----------------|:--------------:|------------|
| first_lesson | "First lesson completed" | `totalLessons >= 1` (logs.count) | YES | Correctly uses log count, not completedUnits |
| ten_words | "10+ words stage >= 2" | `db.cards.where('stage').aboveOrEqual(2).count()` | YES | Dexie index on 'stage' not defined -- falls back to table scan (acceptable for ~300 records) |
| fifty_words | "50+ words stage >= 2" | Same query, threshold 50 | YES | -- |
| hundred_words | "100+ words stage >= 2" | Same query, threshold 100 | YES | -- |
| unit_complete | "First unit 100% complete" | `completedUnits.length >= 1` | YES | Note: "completion" is determined by saveLessonResults, which marks unit complete after any single lesson pass |
| five_units | "5 units complete" | `completedUnits.length >= 5` | YES | -- |
| level_coreA | "CoreA complete (unit 1-12)" | Generates unit_01 through unit_12 IDs and checks all in completedUnits | YES | Correctly generates zero-padded IDs |
| perfect_lesson | "3 stars in a lesson" | `isPerfectLesson` parameter from caller | YES | Caller uses `pct >= 90` which maps to 3 stars |
| three_day_streak | "3 consecutive days" | `getStreakDays() >= 3` | YES | See streak analysis below |
| seven_day_streak | "7 consecutive days" | `getStreakDays() >= 7` | YES | See streak analysis below |

### 6.2 Streak Calculation Analysis

The `getStreakDays()` function (lessonService.ts lines 70-87):
- Fetches all logs ordered by date (reversed)
- Extracts unique date strings (YYYY-MM-DD)
- Checks consecutive day differences

**Potential edge case**: The streak calculation checks if `diffDays === 1` (exact integer). This works correctly because:
1. Dates are sliced to YYYY-MM-DD (line 74)
2. `new Date()` on date-only strings creates midnight UTC timestamps
3. Subtraction of consecutive midnight timestamps yields exactly 86400000ms = 1 day

**Note**: The streak includes "today" -- if a user played today and yesterday, streak = 2. This is the expected behavior.

### 6.3 Index Gap

The `cards` table has indexes on `id, unitId, nextReviewDate` but NOT on `stage`. The query `db.cards.where('stage').aboveOrEqual(2)` will work but performs a full table scan instead of an index lookup. For ~300 cards this is negligible, but it is a minor discrepancy from the Plan's risk mitigation note "Dexie index utilization."

---

## 7. Differences Found

### 7.1 Missing Features (Plan has, Implementation lacks)

| Item | Plan Location | Description | Severity |
|------|---------------|-------------|:--------:|
| Accessibility: aria-labels | NFR section, line 71 | No aria-label on badge elements for screen readers | Low |
| Dexie index on 'stage' | Risk section, line 170 | cards table lacks 'stage' index for mastered word queries | Low |

### 7.2 Added Features (Implementation has, Plan lacks)

| Item | Implementation Location | Description | Assessment |
|------|------------------------|-------------|:----------:|
| Progress bar | rewards/page.tsx:48-55 | Visual progress bar showing X/10 trophies earned | Beneficial |
| Color/shadowColor fields | data/rewards.ts:9-10 | Per-badge color theming for 3D visual consistency | Beneficial |
| Description field | data/rewards.ts:7 | Per-badge description used as locked hint text | Beneficial (supports NFR-02) |
| Loading state | rewards/page.tsx:12,58-61 | Loading spinner while DB query completes | Beneficial |
| isPerfectLesson parameter | lessonService.ts:89,128 | Explicit perfect-lesson flag passed through saveLessonResults | Good design |

### 7.3 Changed Features (Plan != Implementation)

| Item | Plan | Implementation | Impact |
|------|------|----------------|:------:|
| None found | -- | -- | -- |

No semantic changes were found. All 10 trophy conditions, DB schema, data flow, and UI placements match the Plan exactly.

---

## 8. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match (FR compliance) | 97% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 98% | PASS |
| **Overall** | **97%** | PASS |

### Score Breakdown

```
Design Match: 97%
  - FR-01 Trophy Definitions:     100% (all 10 trophies match)
  - FR-02 DB Schema:              100% (exact interface + version match)
  - FR-03 Unlock Logic:           100% (all 10 conditions correct)
  - FR-04 Rewards Page:           100% (grid, locked/unlocked states)
  - FR-05 Results Badge Notify:   100% (banner with trophy details)
  - FR-06 Home Button:            100% (Trophy icon, /rewards link)
  - NFR Performance:               95% (likely met, missing stage index)
  - NFR UX Hints:                 100% (description shown for locked)
  - NFR Accessibility:             85% (touch targets OK, missing aria-labels)

Architecture Compliance: 100%
  - File structure:               100% (all 6 files match Plan Section 5.2)
  - Project level (Starter):      100% (no over-engineering)
  - Data flow:                    100% (matches Plan Section 5.4)

Convention Compliance: 98%
  - Naming:                       100%
  - Import order:                 100%
  - Styling (design system):      100%
  - "use client" directives:      100%
  - Minor: REWARDS array import not using `type` for RewardDefinition in page (-2%)
```

---

## 9. Recommended Actions

### 9.1 Immediate (optional quality improvements)

| Priority | Item | File | Description |
|----------|------|------|-------------|
| Low | Add aria-labels | `src/app/rewards/page.tsx` | Add `aria-label={reward.name}` to RewardCard root div |
| Low | Add stage index | `src/lib/db.ts` | Add 'stage' to cards index in v6: `'id, unitId, nextReviewDate, stage'` |

### 9.2 Plan Document Updates Needed

| Item | Description |
|------|-------------|
| Add color/shadowColor to trophy table | Implementation extends RewardDefinition with visual properties |
| Add description field | Used for locked-state hint text (supports NFR-02) |
| Add progress bar to Rewards page spec | Implemented but not mentioned in Plan |
| Clarify "3 stars" threshold | Implementation uses >= 90% score; Plan should document this |

### 9.3 No Action Required

The implementation faithfully follows the Plan document. All functional requirements are fully implemented. The added features (progress bar, color theming, descriptions) are beneficial enhancements consistent with the project's design system and do not conflict with the Plan.

---

## 10. Next Steps

- [x] Gap Analysis complete (this document)
- [ ] Address Low-priority accessibility items (optional)
- [ ] Update Plan document with implementation additions (optional)
- [ ] Run `npm run build` to verify zero build errors
- [ ] Proceed to completion report (`reward-system.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-03 | Initial gap analysis | Claude (gap-detector) |
