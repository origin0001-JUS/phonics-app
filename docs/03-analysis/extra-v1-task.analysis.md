# extra-v1-task Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Phonics App (phonics-app)
> **Analyst**: gap-detector
> **Date**: 2026-03-08
> **Design Doc**: [extra_v1_task.md](../../extra_v1_task.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

extra_v1_task.md 에 정의된 6개 구현 항목이 실제 코드에 올바르게 반영되었는지 검증한다.

### 1.2 Analysis Scope

- **Design Document**: `extra_v1_task.md` (프로젝트 루트)
- **Implementation Paths**: `src/data/`, `src/lib/srs.ts`, `scripts/`
- **Analysis Date**: 2026-03-08

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 33% | ❌ |
| Architecture Compliance | 100% | ✅ |
| Convention Compliance | 100% | ✅ |
| **Overall** | **44%** | ❌ |

---

## 3. Per-Item Gap Analysis

### Item 1: Sentence Frame DB

| Check Item | Design | Implementation | Status |
|------------|--------|----------------|--------|
| File exists | `src/data/sentenceFrames.ts` | -- | ❌ Missing |
| SentenceFrame interface | 7 fields (id, function, frame, slotType, slotConstraints?, grade, textbookSource) | -- | ❌ |
| Data count | 22 frames (sf_01 ~ sf_22) | -- | ❌ |
| generateSentenceFromFrame() | (frame, wordPool) => string | -- | ❌ |

**Status: NOT IMPLEMENTED** -- File does not exist.

---

### Item 2: Word Type Textbook Tags

| Check Item | Design | Implementation | Status |
|------------|--------|----------------|--------|
| Target file | `types/index.ts` (design says) / `src/data/curriculum.ts` (actual project) | `src/data/curriculum.ts` | ✅ Adapted |
| textbookTags? field | `string[]` | `string[]` (line 11) | ✅ Match |
| isSightWord? field | `boolean` | `boolean` (line 12) | ✅ Match |
| sightWordNote? field | `string` | `string` (line 13) | ✅ Match |
| w() helper updated | Should pass new fields | No -- w() does not propagate textbookTags/isSightWord/sightWordNote | ⚠️ Partial |

**Details on w() helper gap**: The `w()` factory function at line 30 only accepts `(id, word, phonemes, meaning, onset?, rime?, wordFamily?)`. The 3 new optional fields (`textbookTags`, `isSightWord`, `sightWordNote`) are defined on the interface but cannot be set through `w()`. To actually tag words, either `w()` needs additional parameters or words must be tagged separately. Since no words currently carry these tags, the fields exist on the type but are never populated.

**Status: PARTIALLY IMPLEMENTED (type only, no data populated)**

---

### Item 3: SRS Textbook Weight

| Check Item | Design | Implementation | Status |
|------------|--------|----------------|--------|
| Target file | `lib/srs.ts` | `src/lib/srs.ts` (lines 80-100) | ✅ |
| Function name | `getReviewPriority()` | `getReviewPriority()` | ✅ Match |
| Parameter: card | `VocabCard` (design) | `SRSCard` (actual) | ✅ Adapted |
| Parameter: word | `Word` (design) | `{ textbookTags?: string[] }` (inline type) | ✅ Adapted |
| Due date field | `card.due` (design) | `card.nextReviewDate` (actual) | ✅ Adapted |
| Base priority: daysOverdue | `(now - due) / msPerDay` | Same formula | ✅ Match |
| Textbook weight +0.5 | `textbookTags.length > 0` => +0.5 | Same logic | ✅ Match |
| Multi-textbook +0.3 | `textbookTags.length >= 2` => +0.3 | Same logic | ✅ Match |
| JSDoc comment | Present | Present (Korean, matches design) | ✅ Match |

**Adaptation notes**: The design referenced `VocabCard` and `Word` types from a hypothetical `@/types` module. The implementation correctly adapted to use the project's actual `SRSCard` type and an inline type for the word parameter. The `card.due` field was correctly mapped to `card.nextReviewDate`. These are appropriate project-specific adjustments.

**Status: FULLY IMPLEMENTED** -- 100% match with proper project adaptation.

---

### Item 4: Sight Words List

| Check Item | Design | Implementation | Status |
|------------|--------|----------------|--------|
| File exists | `src/data/sightWords.ts` | -- | ❌ Missing |
| SightWordEntry interface | 4 fields (word, note, level, frequency) | -- | ❌ |
| Data count | 27 sight words (L0: 7, L1: 13, L2: 7) | -- | ❌ |
| getSightWordsByLevel() | (level) => SightWordEntry[] | -- | ❌ |
| isSightWord() | (word) => boolean | -- | ❌ |

**Status: NOT IMPLEMENTED** -- File does not exist.

---

### Item 5: vocab_master.csv Script

| Check Item | Design | Implementation | Status |
|------------|--------|----------------|--------|
| File exists | `scripts/generate-vocab-csv.ts` | -- | ❌ Missing |
| getAllWords() dependency | Required in `curriculum.ts` | `getAllWords()` exists (line 619-621) | ✅ Prereq met |
| CSV header | 11 columns (word, phonemes, meaning, ...) | -- | ❌ |
| fs.writeFileSync output | `vocab_master.csv` | -- | ❌ |

**Status: NOT IMPLEMENTED** -- Script file does not exist. However, the prerequisite `getAllWords()` function has been added to `curriculum.ts`.

---

### Item 6: DecodableReaderTemplate

| Check Item | Design | Implementation | Status |
|------------|--------|----------------|--------|
| File exists | `src/data/decodableReaders.ts` | -- | ❌ Missing |
| DecodableReaderTemplate interface | 5 fields (unitId, readerLength, allowedPatterns, sightWordsAllowed, storyBeats) | -- | ❌ |
| Data count | 8 templates (L1_U1 ~ L2_U3) | -- | ❌ |
| generateStoryPrompt() | (template) => string | -- | ❌ |

**Status: NOT IMPLEMENTED** -- File does not exist.

---

## 4. Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 33%                     |
+---------------------------------------------+
|  Item 1 (sentenceFrames.ts)    :  0% -- ❌   |
|  Item 2 (WordData fields)      : 80% -- ⚠️   |
|  Item 3 (getReviewPriority)    :100% -- ✅   |
|  Item 4 (sightWords.ts)        :  0% -- ❌   |
|  Item 5 (generate-vocab-csv.ts):  0% -- ❌   |
|  Item 6 (decodableReaders.ts)  :  0% -- ❌   |
+---------------------------------------------+
|  Fully implemented:   1/6 items              |
|  Partially impl:      1/6 items              |
|  Not implemented:     4/6 items              |
+---------------------------------------------+
```

---

## 5. Differences Found

### Missing Features (Design O, Implementation X)

| Item | Design Location | Description |
|------|-----------------|-------------|
| sentenceFrames.ts | extra_v1_task.md L29-74 | 22 sentence frames + generateSentenceFromFrame() -- entire file missing |
| sightWords.ts | extra_v1_task.md L143-195 | 27 sight words + getSightWordsByLevel() + isSightWord() -- entire file missing |
| generate-vocab-csv.ts | extra_v1_task.md L205-234 | CSV export script -- entire file missing |
| decodableReaders.ts | extra_v1_task.md L246-325 | 8 decodable reader templates + generateStoryPrompt() -- entire file missing |
| WordData tag data | extra_v1_task.md L86-91 | textbookTags/isSightWord/sightWordNote fields exist on type but no words are tagged |

### Implemented with Adaptation (Design ~ Implementation)

| Item | Design | Implementation | Impact |
|------|--------|----------------|--------|
| WordData location | `types/index.ts` | `src/data/curriculum.ts` | Low -- correct for project |
| getReviewPriority card type | `VocabCard` | `SRSCard` | Low -- project's actual type |
| getReviewPriority word type | `Word` import | Inline `{ textbookTags?: string[] }` | Low -- avoids circular deps |
| getReviewPriority due field | `card.due` | `card.nextReviewDate` | Low -- matches SRSCard |

---

## 6. Architecture & Convention Compliance

### 6.1 Architecture (Starter Level)

The 2 implemented items follow the project's Starter-level architecture correctly:
- Type extension in `src/data/curriculum.ts` -- appropriate (co-located with data)
- Function addition in `src/lib/srs.ts` -- appropriate (utility layer)

### 6.2 Convention Compliance

| Category | Status | Notes |
|----------|--------|-------|
| Naming: functions | ✅ | `getReviewPriority`, `getAllWords` -- camelCase |
| Naming: interfaces | ✅ | `WordData` -- PascalCase |
| Naming: files | ✅ | `srs.ts`, `curriculum.ts` -- camelCase |
| Import style | ✅ | No violations in modified files |
| TypeScript strict | ✅ | Optional fields use `?` correctly |

---

## 7. Recommended Actions

### 7.1 Immediate -- Create Missing Files (4 files)

| Priority | File | Items | Description |
|----------|------|:-----:|-------------|
| 1 | `src/data/sentenceFrames.ts` | 22 frames | SentenceFrame interface + data + generateSentenceFromFrame() |
| 2 | `src/data/sightWords.ts` | 27 words | SightWordEntry interface + data + 2 utility functions |
| 3 | `src/data/decodableReaders.ts` | 8 templates | DecodableReaderTemplate interface + data + generateStoryPrompt() |
| 4 | `scripts/generate-vocab-csv.ts` | 1 script | CSV export using getAllWords() |

### 7.2 Short-term -- Populate Word Tags

| Priority | File | Description |
|----------|------|-------------|
| 1 | `src/data/curriculum.ts` | Update `w()` helper to accept textbookTags/isSightWord/sightWordNote, or add tags post-creation |
| 2 | `src/data/curriculum.ts` | Tag words with actual textbook sources and sight word flags |

### 7.3 Design Document Update

| Item | Description |
|------|-------------|
| Import paths | Update `types/index.ts` references to `src/data/curriculum.ts` |
| Type names | Update `VocabCard` / `Word` references to `SRSCard` / `WordData` |

---

## 8. Synchronization Options

Given the 33% match rate, the following options are recommended:

1. **Implement missing files** -- Create the 4 missing files following the design spec exactly, adapting type names to project conventions (WordData instead of Word, etc.)
2. **Populate word tags** -- Extend the `w()` helper or add a post-processing step to tag words with textbookTags and isSightWord data
3. **Update design doc** -- Reflect the project-specific adaptations (file locations, type names) in extra_v1_task.md

**Recommended approach**: Option 1 + 2 (implement to match design), then Option 3 (update design to reflect adaptations).

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-08 | Initial analysis | gap-detector |
