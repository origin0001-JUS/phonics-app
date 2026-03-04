# Phonics 300 - 초등 파닉스·필수어휘 학습 앱

## Project Overview
한국 초등 1~4학년 대상 파닉스+필수어휘 학습 PWA 앱. 1인 개발, 1회성 판매(학교 납품) 비즈니스 모델.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: TailwindCSS 4
- **State**: Zustand (`src/lib/store.ts`)
- **Offline DB**: Dexie.js / IndexedDB (`src/lib/db.ts`) — v5 schema
- **Icons**: lucide-react
- **Animation**: framer-motion
- **TTS**: Google Cloud Text-to-Speech (배치 생성 스크립트)
- **Port**: 4000 (`npm run dev` → localhost:4000)

## Architecture
```
src/
├── app/
│   ├── layout.tsx              # Root layout (Fredoka font, sky+grass bg, SW register)
│   ├── page.tsx                # Home screen (onboarding check, Learn/Review, due count badge)
│   ├── globals.css             # Tailwind base, Fredoka font
│   ├── ServiceWorkerRegister.tsx  # PWA service worker registration
│   ├── onboarding/
│   │   └── page.tsx            # 3-screen onboarding (Welcome → Grade → Recommendation)
│   ├── units/
│   │   └── page.tsx            # Unit selection grid (24 units, lock/unlock based on progress)
│   ├── lesson/
│   │   └── [unitId]/
│   │       └── page.tsx        # 10-min lesson flow (6 steps + results)
│   ├── review/
│   │   └── page.tsx            # SRS flashcard review page
│   ├── report/
│   │   └── page.tsx            # Learning report with CSV/PDF export
│   ├── rewards/
│   │   └── page.tsx            # Trophy/badge collection page
│   └── settings/
│       └── page.tsx            # Grade change, data reset, version info
├── data/
│   ├── curriculum.ts           # 24 units, ~300 words, phonemes, meanings, microReading
│   └── rewards.ts              # 10 reward definitions (milestones, streaks, performance)
├── lib/
│   ├── db.ts                   # Dexie.js IndexedDB schema (v5, with rewards table)
│   ├── store.ts                # Zustand global state (includes onboarding/grade)
│   ├── srs.ts                  # SRS engine (SM-2 algorithm)
│   ├── audio.ts                # TTS (mp3 + SpeechSynthesis fallback), SFX, STT
│   ├── lessonService.ts        # Lesson result saving, unit unlock logic, SRS integration
│   └── exportReport.ts         # Report data gathering + CSV/PDF export
├── scripts/
│   └── generate-tts.ts         # Google Cloud TTS batch generator
└── public/
    ├── manifest.json           # PWA manifest
    ├── sw.js                   # Service Worker (offline caching)
    ├── icons/                  # PWA icons (192, 512, maskable)
    └── assets/
        └── audio/              # Generated TTS audio files (~372 files)
```

## Design System
- **Theme**: BrightFox-style kids app (sky blue bg, rounded cards, 3D squishy buttons)
- **Font**: Fredoka (Google Fonts) - rounded, child-friendly
- **Buttons**: 3D shadow (`shadow-[0_Xpx_0_color]` + `active:translate-y` press)
- **Min touch target**: 44px+ for all interactive elements
- **Color palette**: Warm pastels (orange mascot, pink/teal/purple unit cards, yellow CTAs)

## Lesson Flow (10 min, 6 steps)
1. Sound Focus → 2. Blend & Tap → 3. Decode Words → 4. Say & Check → 5. Micro-Reader → 6. Exit Ticket → Results

## Current Status (Updated 2026-03-03)
### ✅ Completed
- Home screen with onboarding redirect + due count badge
- Onboarding: 3-screen flow (Welcome → Grade Select → Level Recommendation)
- Unit selection grid (24 units, lock/unlock based on DB progress)
- Full lesson flow (6 steps + results screen)
- SRS engine (SM-2) connected to Dexie.js via lessonService.ts
- Unit unlock logic (sequential + review unit prerequisites)
- Curriculum data: 24 units / ~300 words (short/long vowels, blends, digraphs, etc.)
- Review/flashcard dedicated page (/review)
- TTS batch generation script (Google Cloud TTS, Neural2-F voice)
- PWA: manifest.json + Service Worker + icons
- PDF/CSV learning report export (/report)
- Rewards/trophy page (/rewards): 10 badge definitions, unlock tracking via Dexie
- Settings page (/settings): grade change, data reset, report link, version info
- Audio utility (audio.ts): TTS mp3 + SpeechSynthesis fallback + procedural SFX
- Build verified: `npm run build` passes (Next.js 16.1.6, Turbopack)

### ⬜ Remaining
- **이미지 에셋 생성**: 300개 단어 일러스트 (SVG 또는 AI 생성)
- **Capacitor 통합**: Android APK 패키징
- **입모양(Viseme) 애니메이션**: SVG 벡터 스와핑 방식
- **S2B 납품 문서**: 교사용 가이드, 개인정보처리방침, 서비스 설계서
- **전체 플로우 QA**: 브라우저 테스트 녹화

## DB Schema (Dexie v5)
- `progress`: id, currentLevel, unlockedUnits[], completedUnits[], lastPlayedDate, onboardingCompleted, gradeLevel
- `cards`: id (word), unitId, nextReviewDate, stage, easeFactor, interval, repetitions
- `logs`: ++id, date, durationMinutes, completedActivities[]
- `rewards`: id (trophy ID), unlockedAt (ISO date string)

## Key Decisions
- Browser SpeechSynthesis as fallback; Google TTS .mp3 files as primary audio
- No server/backend — everything runs locally (IndexedDB)
- No user accounts/login — privacy-first design for kids
- Review unit unlock requires completing all prerequisite content units

## Commands
- `npm run dev` — Dev server on port 4000
- `npm run build` — Production build
- `npm run generate-tts` — Batch generate TTS audio (requires GOOGLE_APPLICATION_CREDENTIALS)
