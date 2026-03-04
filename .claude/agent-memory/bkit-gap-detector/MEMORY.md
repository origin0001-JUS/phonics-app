# Gap Detector Agent Memory

## Project: Phonics App (phonics-app)

### Architecture
- **Level**: Starter (simple components/lib/types structure)
- **DB**: Dexie.js IndexedDB, currently at schema v5 (rewards table added)
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

### Patterns Observed
- Co-located components inside page files (Starter-level pattern)
- Snake_case for step/trophy IDs, PascalCase for components, camelCase for functions
- "use client" on all page files EXCEPT lesson/[unitId]/page.tsx (now Server Component wrapper for static export)
- saveLessonResults() is the main hook point for post-lesson actions
- lesson/[unitId]/ split: page.tsx (Server, generateStaticParams) + LessonClient.tsx (Client, lesson logic)
- Plan documents are in Korean, UI text is in English/Korean mix
- Dark mode: Zustand `theme` state + localStorage `phonics-theme` + ThemeInitializer.tsx for DOM sync
- VisemeAvatar: standalone component at lesson/[unitId]/VisemeAvatar.tsx with isSpeaking prop
- Dark mode coverage: ALL screens now have dark: classes (80 total across 10 files). Import order issue in settings resolved.
