# Gap Detector Agent Memory

## Project: Phonics App (phonics-app)

### Architecture
- **Level**: Starter (simple components/lib/types structure)
- **DB**: Dexie.js IndexedDB, currently at schema v6 (v5 added rewards table, v6 added stage index on cards)
- **State**: Zustand (store.ts) + Dexie for persistence
- **Styling**: Tailwind CSS 4, kid-friendly 3D buttons, Fredoka font, rounded-[2rem] cards

### Key File Locations
- DB schema: `src/lib/db.ts`
- Lesson logic: `src/lib/lessonService.ts`
- Curriculum data: `src/data/curriculum.ts`
- Reward definitions: `src/data/rewards.ts`
- Home: `src/app/page.tsx`
- Lesson flow: `src/app/lesson/[unitId]/page.tsx`
- Rewards page: `src/app/rewards/page.tsx`

### Analysis History
- **reward-system** (2026-03-03): Match Rate 97%. All 6 FRs fully met. Minor gaps: missing aria-labels on badges, missing Dexie index on 'stage' column.
- **settings-page** (2026-03-03): Match Rate 99%. All 5 FRs fully met. Minor gap: import order (Link after @/ imports). Note: getMapping() duplicated between onboarding and settings.
- **maintenance-cleanup** (2026-03-03): Match Rate 97%. 3 tasks (build verify, CLAUDE.md update, hydration fix). Root CLAUDE.md 100% aligned. phonics-app/CLAUDE.md has minor internal inconsistencies: Tech Stack says "v4" but DB Schema section says "v5"; Architecture tree missing audio.ts and rewards.ts entries.
- **round2-trophy-home** (2026-03-03): Match Rate 98%. 16/16 plan requirements fully met (Task 2-A: trophy modal, Task 2-B: home cutoff fix). Minor gaps: import order in page.tsx (next/link after @/ imports), missing ARIA attributes on trophy modal. Implementation includes bonus animations (rotate wobble, badge shake) beyond plan scope.
- **capacitor-android** (2026-03-04): Match Rate 92%. Config+code 100% (output:"export", capacitor.config.ts, 3 packages, page.tsx Server/Client split, generateStaticParams for 24 units). Gap: `android/` dir missing (npx cap add android not run). `out/` absent but git-ignored (expected).
- **round6** (2026-03-05): Match Rate 99% (v2, after fixes). v1 was 92%. Task 6-A (Dark Mode) 98%: all screens now have dark: classes (80 total). Task 6-B (Viseme Avatar) 100%. Convention 100% (import order fixed). All 5 gaps from v1 resolved.
- **round7** (2026-03-05): Match Rate 97%. 3 tasks (7-A: reset integrity, 7-B: hydration cleanup, 7-C: capacitor build). All functional requirements 100% met (33/33 items). Minor gaps: import order in LessonClient.tsx (framer-motion/lucide after @/ imports), no loading indicator during reset. CLAUDE.md still says "v5" but DB is at v6.
- **round8-qa** (2026-03-05): Match Rate 99%. 5 tasks (8-A: level naming, 8-B: bilingual TTS, 8-C: phoneme audio, 8-D: Korean translation, 8-E: overflow fix). All 36/36 functional requirements met. Minor: import order in LessonClient.tsx persists, getMapping() still duplicated.
- **round9** (2026-03-06): Match Rate 95%. 4 tasks (9-A: BlendTap audio delay, 9-B: quiz audio separation, 9-C: viseme close-up, 9-D: trophies overflow). All 27 items checked, 25.5 met. Tasks 9-A/B/C 100%. Task 9-D 92% (pb-12 may be thin). Import order in LessonClient.tsx persists (Round 7+).
- **round10-curriculum-merge** (2026-03-06): Match Rate 100%. 3 tasks (10-A: microReading replace, 10-B: additional words, 10-C: onset/rime fields). 20/20 content units updated, 4/4 review units preserved, 36/36 new words added, 75 existing words got onset/rime, WordData interface + w() helper updated. Zero gaps. Total words now ~336.
- **round11-game-upgrade** (2026-03-06): Match Rate 97%. 3 tasks (11-A: Minimal Pair Quiz, 11-B: Onset-Rime mode, 11-C: Color Coding). All functional requirements met. MINIMAL_PAIRS data 100% matches JSON source (10/10 entries). Color coding utility: getPhonemeCategory() + getPhonemeColorClass() with 5 categories. Import order in LessonClient.tsx still not fixed (Round 7+).
- **round12-tts-upgrade** (2026-03-07): Match Rate 99%. 5 tasks (12-A: env check, 12-B: audit script, 12-C: ElevenLabs batch gen, 12-D: fallback handling, 12-E: build verify). All 16/16 items met. getSafeFilename() synchronized across audio.ts, generate-tts.ts, audit-audio.ts. Multi-voice: Rachel(words), Drew/Laura alternating(sentences). Minor: unused unitId/sentenceIndex params in playSentenceAudio, typo env.local (non-blocking).
- **round13-mobile-qa** (2026-03-07): Match Rate 98%. 5 tasks (13-A: Foxy audio, 13-B: audio preload, 13-C: onset-rime 2-step, 13-D: sessionStorage backup, 13-E: minimal pair randomize + compare). All 18/18 functional items met. Minor: import order in LessonClient.tsx and page.tsx persists (Round 7+). Audio file existence unverifiable via static analysis.

### Patterns Observed
- Co-located components inside page files (Starter-level pattern)
- Snake_case for step/trophy IDs, PascalCase for components, camelCase for functions
- "use client" on all page files EXCEPT lesson/[unitId]/page.tsx (now Server Component wrapper for static export)
- saveLessonResults() is the main hook point for post-lesson actions
- lesson/[unitId]/ split: page.tsx (Server, generateStaticParams) + LessonClient.tsx (Client, lesson logic)
- Plan documents are in Korean, UI text is in English/Korean mix
- Dark mode: Zustand `theme` state + localStorage `phonics-theme` + ThemeInitializer.tsx for DOM sync
- VisemeAvatar: standalone component at lesson/[unitId]/VisemeAvatar.tsx with isSpeaking prop, now lip close-up (no full face), config-driven MOUTH_SHAPES for future vowel visemes
- Dark mode coverage: ALL screens now have dark: classes (80 total across 10 files). Import order issue in settings resolved.
- Color coding system: getPhonemeCategory() + getPhonemeColorClass() in LessonClient.tsx. 5 categories: vowel(red), consonant(blue), blend(emerald), silent_e(gray), rime(amber). IPA_VOWELS Set for phoneme-mode detection.
- Minimal Pairs: 10 pair sets covering units 1-5, 7-10, 17, 19. Data hardcoded in MINIMAL_PAIRS const (matches phonics300_upgrade_data.json exactly).
- Onset-Rime mode: BlendTapStep branches on word.onset/word.rime presence. Word Family display scoped to lesson's 6-word subset.
- TTS: ElevenLabs multi-voice (Round 12). Rachel=words, Drew/Laura=sentences (alternating by unit parity). SDK: @elevenlabs/elevenlabs-js v2.38+, stream API. Model: eleven_turbo_v2_5. getSafeFilename() shared across 3 files for sentence filename consistency.
- audio.ts: fallbackTTS has JSDoc noting it should rarely fire. Both playWordAudio and playSentenceAudio log console.warn on 404.
- audio.ts: preloadAudioFiles() added (Round 13-B). Uses shared audioCache Map, sets preload='auto' and calls .load(). Called from LessonClient.tsx on mount.
- BlendTapStep onset-rime: Now 2-step independent buttons (Round 13-C). onsetTapped/rimeTapped states, useEffect merges when both true.
- sessionStorage backup: lesson_state_{unitId} key stores stepIndex/score/totalQuestions (Round 13-D). Cleared on ResultsStep.
- Minimal Pair quiz: correctWord randomly selected from pair (Round 13-E). "Compare Sounds" section shown post-answer with 2 audio buttons.
