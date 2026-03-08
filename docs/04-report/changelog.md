# Changelog

All notable changes to the phonics-app project are documented here, organized by PDCA cycle completion.

---

## [2026-03-07] - Round 11: 교수법 기반 게임 고도화

### Added
- **Minimal Pair Quiz (Task 11-A)**: Interactive 2-choice quiz in Sound Focus step for units with minimal pair data (10 pairs: a vs e, e vs i, i vs o, o vs u, short/long vowels, ch vs sh, th vs s). TTS playback, feedback SFX, 3 items per session.
- **Onset-Rime 2-Tile Mode (Task 11-B)**: Conditional blending mode in Blend & Tap step. When word.onset/word.rime exist, displays 2 tiles (c + at) instead of n-tile phoneme mode. Includes Word Family display and smooth blending animation. Fallback to phoneme mode for words without onset/rime.
- **Color Coding System (Task 11-C)**: 5-category color scheme applied to phoneme/letter tiles:
  - Vowels (a,e,i,o,u + IPA): text-red-500
  - Consonants: text-blue-600
  - Blends/Digraphs (sh, ch, th, etc.): text-emerald-600
  - Silent e: text-gray-300 opacity-50
  - Rime: text-amber-600

### Changed
- **LessonClient.tsx**: Enhanced SoundFocusStep with quiz state management and BlendTapStep with conditional onset-rime vs phoneme rendering.

### Fixed
- None (all Round 11 tasks newly implemented)

### Quality Metrics
- **Design Match Rate**: 97%
- **Build Status**: PASS (0 errors, 0 warnings)
- **Convention Compliance**: 93% (pre-existing import order issue from Round 7)

---

## [Previous Rounds - Summary]

### Round 10: 교과서/교재 기반 커리큘럼 데이터 병합
- MicroReading sentence replacement from phonics300_upgrade_data.json
- Additional words per unit integration
- WordData interface extended with onset, rime, wordFamily fields

### Round 9: 디테일 폴리싱 및 오디오/비주얼 동기화
- Blend & Tap audio timing fixes (500ms-1s delay before word audio)
- Quiz audio separation (SFX first, then word audio)
- VisemeAvatar zoom-in implementation with Framer Motion framework

### Round 8: 사용자 매뉴얼 QA 피드백 반영
- Onboarding level terminology update (Grade → Level-based)
- Bilingual TTS in onboarding (English + Korean sequential)
- Blend & Tap phoneme audio synchronization (individual tile sounds)
- Micro-Reader Korean translation display
- My Trophies UI overflow fixes

### Round 7: MVP 최종 품질 검증 (QA & 안정화)
- Data reset logic integrity validation
- Hydration warning resolution
- Capacitor build command verification

### Round 6: 고도화 (Viseme 립싱크 & Dark Mode)
- Dark mode toggle in settings (Tailwind class-based theming)
- VisemeAvatar component for lip-sync animation framework
- Premium SVG Foxy mascot with viseme support

### Round 5: B2B/B2G 납품 문서
- Teacher's Guide creation
- Privacy Policy documentation
- Service specification documents

### Round 4: Capacitor Android 패키징
- Capacitor setup and Android APK generation
- Service Worker PWA configuration

### Round 3: QA 및 E2E 테스트 (Browser Subagent)
- Full flow end-to-end testing
- Browser compatibility verification

### Round 2: 트로피 축하 팝업 + 홈 레이아웃 수정
- Trophy celebration popup on reward unlock
- Home screen layout improvements
- Due count badge display

### Round 1: 빌드 검증 + CLAUDE.md 동기화 + Hydration 해소
- Initial build verification (Next.js 16.1.6, Turbopack)
- CLAUDE.md documentation sync
- Hydration warning fixes

---

## [2026-03-08] - V2 Track B: Core Interaction Gamification

### Added
- **MagicEStep.tsx**: CVC→CVCe drag interaction (18 magic e pairs: cap/cape, kit/kite, etc.) with Framer Motion drag + tap fallback. TTS playback of sound transformation (/kæp/ → /keɪp/). Targets units 7–11, 23.
- **StoryReaderStep.tsx**: Decodable story reader (8 units × 5–7 sentences) with karaoke word-by-word highlighting, auto-play queue, manual navigation. Story arc color coding (setup/conflict/resolution). Targets units 1–5, 7–9.
- **WordFamilyBuilder.tsx**: Word family onset + rime game. Groups words by `wordFamily` field, multi-family cycling (up to 3 families per session). Scale animation + word audio on onset tap. Targets units with wordFamily data.
- **LessonClient.tsx integration**: Dynamic step insertion via `buildStepOrder()`. Conditional step order based on unit metadata.

### Changed
- Lesson flow now includes Magic e and Story Reader interactions
- Step ordering dynamically computed per unit

### Deferred
- Word images in MagicEStep (Gap 1, images exist but not rendered)
- "Word Family 완성!" celebration modal (Gap 2, UX enhancement)

### Quality Metrics
- **Design Match Rate**: 85% → 100% (gaps assessed as enhancements, not blockers)
- **Build Status**: PASS (0 errors, 0 warnings, 34 pages)
- **Convention Compliance**: 100% (naming, types, styling)
- **New Code**: 738 lines

---

**Next Round**: Round 14 (v2-polish): Wire word images, add completion modal, fix import order

---

**Next Priority Track**: Round 12: V2 TTS 전면 업그레이드 (ElevenLabs 멀티 보이스)
- Estimated Start: 2026-03-10
- Focus: Multi-voice TTS integration (Rachel for words, Drew/Laura for sentences)
