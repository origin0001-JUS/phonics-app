# V2-11: Pronunciation Visualization Dual View Upgrade - Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Phonics App (phonics-app)
> **Analyst**: gap-detector
> **Date**: 2026-03-09
> **Design Doc**: `upgrade_guide.md.md` (project root)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify that the V2-11 pronunciation visualization upgrade -- replacing the Foxy (VisemeAvatar) character with a dual-view human mouth system (front lip shape + sagittal cross-section) -- has been correctly implemented per the design spec.

### 1.2 Analysis Scope

- **Design Document**: `upgrade_guide.md.md` (6 steps)
- **Implementation Files**:
  - `src/data/visemeMap.ts`
  - `src/app/lesson/[unitId]/MouthCrossSection.tsx`
  - `src/app/lesson/[unitId]/MouthVisualizer.tsx`
  - `src/app/lesson/[unitId]/LessonClient.tsx`
  - `src/app/lesson/[unitId]/VisemeAvatar.tsx` (legacy)

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Step 1: visemeMap.ts (Phoneme-to-Viseme Mapping)

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| File location | `data/visemeMap.ts` | `src/data/visemeMap.ts` | Implemented |
| 15 VisemeId types | 15 union members | 15 union members (rest through mid_central) | Implemented |
| phonemeToViseme mapping | 44 phoneme keys | 44 phoneme keys (exact match) | Implemented |
| Consonant mappings (p,b,m,f,v,th,...) | 22 entries | 22 entries, identical | Implemented |
| Short vowel mappings | 11 entries | 11 entries, identical | Implemented |
| Long vowel mappings | 8 entries | 8 entries, identical | Implemented |
| R-controlled mappings | 3 entries | 3 entries, identical | Implemented |
| visemeGuide (Korean tips) | 15 entries with lipDesc, tongueDesc, tipKo | 15 entries, all 3 fields present, identical text | Implemented |

**Score: 100%** -- All 44 phoneme mappings and 15 viseme guides match the design exactly.

### 2.2 Step 2: MouthCrossSection SVG Component

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| File location | `src/components/MouthCrossSection.tsx` | `src/app/lesson/[unitId]/MouthCrossSection.tsx` | Implemented |
| SVG sagittal cross-section | viewBox 0 0 120 120 | viewBox 0 0 120 120 | Implemented |
| Tongue path per viseme (TONGUE_PATHS) | 8 sample paths in design | All 15 visemes covered | Implemented |
| Jaw drop per viseme (JAW_DROP) | All 15 values specified | All 15 values present, values match | Implemented |
| Upper palate (fixed) | Hard palate path | Hard palate + soft palate/velum | Implemented |
| Teeth | Upper teeth rect | Upper teeth + lower teeth (with jaw group) | Implemented |
| Lips | Upper + lower lip paths | Upper lip + lower lip, lip gap varies by viseme | Implemented |
| Airflow arrows for fricatives | dental only | dental, alveolar_fric, glottal | Implemented |
| Tongue CSS transition | `transition-all duration-300 ease-in-out` | `transition: 'all 0.3s ease-in-out'` (inline style) | Implemented |
| LIP_GAP record | Not in design | Added: 15-entry LIP_GAP for lip separation | Implemented |
| Nasal cavity | Not in design | Added: subtle nasal cavity path | Implemented |

**Score: 100%** -- All design requirements met. Implementation adds refinements beyond spec (LIP_GAP, nasal cavity, soft palate) that enhance the educational value.

### 2.3 Step 3: MouthVisualizer Component (Dual View)

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| File location | `src/components/MouthVisualizer.tsx` | `src/app/lesson/[unitId]/MouthVisualizer.tsx` | Implemented |
| Props: currentPhoneme | string, optional | string, optional | Implemented |
| Props: currentWord | string, optional | string, optional | Implemented |
| Props: isSpeaking | boolean, optional | boolean, optional | Implemented |
| Props: compact | boolean, optional | boolean, optional | Implemented |
| Dual view layout (front + cross-section) | flex gap-4, side-by-side | flex gap-3, side-by-side | Implemented |
| Front view: AI-generated mouth image | `<img src="/assets/mouth/front_{viseme}.png">` | FrontViewPlaceholder SVG component | Partially Implemented |
| Cross-section view | `<MouthCrossSection viseme={viseme} />` | `<MouthCrossSection viseme={viseme} />` | Implemented |
| Phoneme label (`/{phoneme}/`) | Indigo badge with `in "word"` | Indigo badge with `in "word"` | Implemented |
| Korean pronunciation tip (tipKo) | AnimatePresence, amber-50 bg | AnimatePresence, amber-50 bg, `viseme !== 'rest'` guard | Implemented |
| Speaking animation (scale pulse) | `scale: [1, 1.02, 1]` | `scale: [1, 1.03, 1]` | Implemented |
| Size: compact w-20 h-20, normal w-32 h-32 | w-20/w-32 | w-20/w-28 | Implemented |
| Status label | Not in design | Added: "Speaking..." / "Mouth Guide" label | Implemented |

**Front View Note**: The design spec called for AI-generated PNG images at `/assets/mouth/front_{viseme}.png`. The implementation uses a `FrontViewPlaceholder` SVG component instead -- this is explicitly allowed by the design's "Antigravity prompt" section which says "use placeholder text for now, images will be added later." The placeholder is actually richer than a text label; it renders stylized SVG mouth shapes per viseme with animation.

**Score: 95%** -- Front view uses SVG placeholder instead of PNG images (intentional, per design's own instruction). Normal size is w-28 vs w-32 (minor). All functional requirements met.

### 2.4 Step 4 (design): usePhonemeSequence Hook

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| Hook signature | `usePhonemeSequence(phonemes, isSpeaking)` | `usePhonemeSequence(phonemes, isSpeaking)` | Implemented |
| Returns current phoneme or undefined | Yes | Yes | Implemented |
| 0.4s interval between phonemes | `setInterval(..., 400)` | `setInterval(..., 400)` | Implemented |
| Resets to -1 when not speaking | `setCurrentIndex(-1)` | `setCurrentIndex(-1)` | Implemented |
| Clears interval on unmount | `return () => clearInterval(interval)` | `return () => clearInterval(interval)` | Implemented |
| End of sequence handling | clearInterval + set -1 | clearInterval + setTimeout 300ms + set -1 | Implemented |
| Location | Inline in design (no file specified) | Co-located in MouthVisualizer.tsx, exported | Implemented |

**Score: 100%** -- Hook matches design exactly. Minor enhancement: 300ms delay before resetting to -1 at end of sequence for smoother UX.

### 2.5 Step 5: Integration in LessonClient.tsx

| Item | Design | Implementation | Status |
|------|--------|----------------|--------|
| Import MouthVisualizer | Replace VisemeAvatar import | `import MouthVisualizer, { usePhonemeSequence } from "./MouthVisualizer"` | Implemented |
| VisemeAvatar import removed | No VisemeAvatar import in LessonClient | Confirmed: no VisemeAvatar import | Implemented |
| SayCheckStep uses MouthVisualizer | `<MouthVisualizer currentPhoneme={...} currentWord={...} isSpeaking={...} />` | Line 893-897: exact props passed | Implemented |
| usePhonemeSequence called | `usePhonemeSequence(word.phonemes, isSpeaking)` | Line 799: `usePhonemeSequence(word.phonemes, isSpeaking)` | Implemented |
| currentPhoneme passed to MouthVisualizer | Yes | Yes (line 894) | Implemented |
| currentWord passed | `word.word` | `word.word` (line 895) | Implemented |
| isSpeaking passed | Yes | Yes (line 896) | Implemented |

**Score: 100%** -- Full integration complete. VisemeAvatar is no longer imported in LessonClient.tsx.

### 2.6 Step 6: File Structure

| Design Path | Actual Path | Status |
|-------------|-------------|--------|
| `src/data/visemeMap.ts` | `src/data/visemeMap.ts` | Implemented |
| `src/components/MouthVisualizer.tsx` | `src/app/lesson/[unitId]/MouthVisualizer.tsx` | Implemented |
| `src/components/MouthCrossSection.tsx` | `src/app/lesson/[unitId]/MouthCrossSection.tsx` | Implemented |
| `public/assets/mouth/front_*.png` (15 images) | Not present (SVG placeholder used) | Partially Implemented |

**Note on file location**: The design suggested `src/components/` but the project's established pattern is co-location inside `src/app/lesson/[unitId]/`. All lesson-specific components (VisemeAvatar, MagicEStep, StoryReaderStep, WordFamilyBuilder) follow this co-location pattern. This is the correct decision for a Starter-level architecture.

**Score: 90%** -- Files correctly located per project convention. Mouth PNG images not yet generated (intentionally deferred per design's own fallback instructions).

---

## 3. Legacy File Status

| Item | Status | Notes |
|------|--------|-------|
| `VisemeAvatar.tsx` still exists on disk | Yes | File exists but is NOT imported anywhere in src/ |
| Any remaining VisemeAvatar references in codebase | None | grep confirms zero imports/usage |

**Recommendation**: Delete `VisemeAvatar.tsx` as it is dead code. Not a blocking issue since it has zero references.

---

## 4. Convention Compliance

### 4.1 Naming Convention

| Category | Convention | Compliance |
|----------|-----------|:----------:|
| Components | PascalCase | MouthVisualizer, MouthCrossSection, FrontViewPlaceholder -- all correct |
| Functions | camelCase | usePhonemeSequence -- correct |
| Constants | UPPER_SNAKE_CASE | TONGUE_PATHS, JAW_DROP, LIP_GAP -- correct |
| Types | PascalCase | VisemeId, MouthVisualizerProps, MouthCrossSectionProps -- correct |
| Files | PascalCase.tsx | MouthCrossSection.tsx, MouthVisualizer.tsx -- correct |

**Score: 100%**

### 4.2 Import Order

**MouthVisualizer.tsx** (line 2-6):
```
1. "react" (external)           -- correct position
2. "framer-motion" (external)   -- correct position
3. "@/data/visemeMap" (internal) -- correct position
4. "./MouthCrossSection" (relative) -- correct position
```

**MouthCrossSection.tsx** (line 3):
```
1. import type from "@/data/visemeMap" (type import, single import) -- acceptable
```

**LessonClient.tsx** (lines 1-17): Known recurring issue from Round 7+ -- framer-motion and lucide-react imports are placed after some @/ imports. This is pre-existing and not introduced by this feature.

**Score: 95%** (pre-existing LessonClient import order issue; new files are clean)

---

## 5. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Step 1: visemeMap.ts | 100% | Implemented |
| Step 2: MouthCrossSection | 100% | Implemented |
| Step 3: MouthVisualizer | 95% | Implemented |
| Step 4: usePhonemeSequence | 100% | Implemented |
| Step 5: LessonClient Integration | 100% | Implemented |
| Step 6: File Structure | 90% | Implemented |
| Convention Compliance | 98% | Implemented |
| **Overall Match Rate** | **97%** | Implemented |

---

## 6. Differences Found

### Missing Features (Design present, Implementation absent)

| Item | Design Location | Description | Impact |
|------|-----------------|-------------|--------|
| Front view PNG images | upgrade_guide Step 2, Step 5 | 15 AI-generated mouth images at `public/assets/mouth/front_*.png` | Low -- SVG placeholder is functional and the design explicitly allows deferral |

### Added Features (Design absent, Implementation present)

| Item | Implementation Location | Description |
|------|------------------------|-------------|
| FrontViewPlaceholder SVG | MouthVisualizer.tsx:45-118 | Rich SVG placeholder with per-viseme mouth shapes, teeth, tongue hints, speaking pulse animation |
| LIP_GAP record | MouthCrossSection.tsx:34-40 | 15-entry lip separation map for more realistic cross-section |
| Nasal cavity path | MouthCrossSection.tsx:63 | Subtle nasal cavity in cross-section SVG |
| Soft palate / velum | MouthCrossSection.tsx:70-71 | Additional anatomical detail |
| Status label | MouthVisualizer.tsx:184-190 | "Speaking..." / "Mouth Guide" badge below visualizer |
| End-of-sequence delay | MouthVisualizer.tsx:32 | 300ms delay before resetting phoneme index for smoother transition |

### Changed Features (Design differs from Implementation)

| Item | Design | Implementation | Impact |
|------|--------|----------------|--------|
| Normal size | w-32 h-32 | w-28 h-28 | Low -- slightly smaller default |
| Scale animation | 1.02 | 1.03 | Low -- negligible visual difference |
| Border width | border-3 | border-4 | Low -- matches project convention (border-4 is standard) |
| Airflow arrows | dental only | dental + alveolar_fric + glottal | Positive -- more educational |

---

## 7. Recommended Actions

### Immediate Actions

None required. All functional requirements are fully met.

### Short-term (Optional)

1. **Delete VisemeAvatar.tsx** -- Dead code with zero references. Safe to remove.
2. **Generate front-view mouth images** -- When ready to upgrade from SVG placeholders to AI-generated PNGs, create 15 images at `public/assets/mouth/front_{viseme}.png` and update MouthVisualizer.tsx to use `<img>` tags.

### Known Pre-existing Issues (Not introduced by this feature)

1. **Import order in LessonClient.tsx** -- framer-motion and lucide-react after @/ imports (persists since Round 7).
2. **getMapping() duplication** -- Between onboarding and settings (persists since settings-page analysis).

---

## 8. Conclusion

Match Rate **97%**. The V2-11 pronunciation visualization dual view upgrade is fully implemented and functional. All 6 design steps are satisfied:

- 15 viseme types with 44 phoneme mappings and Korean pronunciation guides (100%)
- Sagittal cross-section SVG with tongue position, jaw drop, lip separation, and airflow arrows (100%)
- Dual-view MouthVisualizer component with front view + cross-section side by side (95%)
- usePhonemeSequence hook cycling through word.phonemes at 0.4s intervals (100%)
- Full integration in SayCheckStep replacing VisemeAvatar (100%)
- Files correctly co-located in lesson directory per project convention (90%)

The only gap is the absence of AI-generated front-view PNG images, which the design document itself explicitly defers. The SVG placeholder implementation exceeds the design's suggestion of "text labels" by providing stylized, animated mouth shapes per viseme.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-09 | Initial gap analysis | gap-detector |
