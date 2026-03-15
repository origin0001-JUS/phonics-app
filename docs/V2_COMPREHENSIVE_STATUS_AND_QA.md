# V2 종합 현황 보고서 & 정밀 QA 테스트 계획서

> **작성일**: 2026-03-14
> **프로젝트**: Phonics 300 (소리로 읽는 영어 300)
> **기준**: v2_handover_context.md + Git History + PDCA 분석 보고서 전수 종합

---

## Part 1: 프로젝트 종합 현황

### 1.1 기술 스택 현황

| 항목 | 버전 | 상태 |
|------|------|------|
| Next.js | 16.1.6 (App Router) | ✅ 안정 |
| React | 19.2.3 | ✅ 안정 |
| TypeScript | ^5 (strict mode) | ✅ 안정 |
| Tailwind CSS | 4 (CSS-first config) | ✅ 안정 |
| Zustand | 5.0.11 | ✅ 안정 |
| Dexie.js | 4.3.0 (IndexedDB) | ✅ 안정 |
| Framer Motion | 12.34.4 | ✅ 안정 |
| Supabase JS | 2.98.0 (B2G 대시보드) | ⚠️ UI만 완료, DB 미연동 |
| Recharts | 3.8.0 (리포트 차트) | ✅ 안정 |
| Capacitor | 8.1.0 (Android) | ⏳ APK 빌드 대기 |

### 1.2 V2 기능별 개발 완료 현황 (Track A / B / C)

#### Track A: UI/UX 직관성 향상

| Feature | 설명 | 상태 | Match Rate | 비고 |
|---------|------|:----:|:----------:|------|
| **V2-8** | 홈 화면 이중 언어 비디오 시퀀서 | ✅ | 99% | Audio→Video 방식 전환 완료. `Foxy_english.mp4` + 말풍선 UI |
| **V2-9** | 300단어 3D 이미지 + 팝업 UI | ✅ | 99% | 815개 이미지, 0 missing. WordImage 컴포넌트 5곳 통합 |
| **V2-10** | 온보딩 3D Foxy + ElevenLabs TTS | ✅ | — | 3D 마스코트 교체 + 고품질 한국어 안내 음성 |
| **V2-11** | Viseme 입모양 시각화 + 발음 듀얼뷰 | ✅ | — | MouthVisualizer, MouthCrossSection, AudioVisualizer 컴포넌트 |

#### Track B: 코어 인터랙션 게임화

| Feature | 설명 | 상태 | 비고 |
|---------|------|:----:|------|
| **V2-1** | Magic e 드래그 퀴즈 | ✅ | `MagicEStep.tsx` — CVC→CVCe 변환 인터랙션 |
| **V2-2** | Decodable Stories 확장 (만화 패널) | ✅ | `StoryReaderStep.tsx` — 6유닛 x 6패널 = 36장 에셋 |
| **V2-3** | Word Family Builder 미니게임 | ✅ | `WordFamilyBuilder.tsx` — Rime 고정 + Onset 조합 |

#### Track C: 인프라 & 커리큘럼 확장

| Feature | 설명 | 상태 | 비고 |
|---------|------|:----:|------|
| **V2-4** | Wasm AI 발음 평가 엔진 (MFCC/DTW) | ✅ | 실시간 파형 + 매칭률 게이지 UI |
| **V2-5** | B2G 대시보드 (Supabase) | ⚠️ | UI/SDK 완료, 실제 Supabase DB 미연동 (Stage 4) |
| **V2-6** | 학부모용 취약 음소 리포트 | ✅ | PDF/CSV Export + Recharts 차트 |
| **V2-7** | L3/L4 커리큘럼 확장 | ✅ | 자음군/이중모음 단어 데이터 매핑 완료 |

### 1.3 에셋 현황

| 카테고리 | 수량 | 경로 | 상태 |
|----------|:----:|------|:----:|
| 단어 이미지 (PNG) | 815개 | `public/assets/images/` | ✅ |
| 단어 TTS (MP3) | ~372개 | `public/assets/audio/` | ✅ |
| Phoneme 오디오 (Onset/Rime) | 170개 | `public/assets/audio/phonemes/` | ✅ |
| 립싱크 비디오 (MP4) | 59개 | `public/assets/video/` | ✅ |
| 스토리 만화 패널 | 36개+ | `public/assets/stories/` | ✅ |
| Foxy 마스코트 이미지 | 1개 | `public/assets/images/foxy_mascot_3d.jpg` | ✅ |
| 홈 화면 비디오 | 2개 | `Foxy_english.mp4`, `Foxy_korean.mp4` | ✅ |
| 한국어 인사 오디오 | 2개 | `hi_im_foxy.mp3`, `foxy_hello_ko.mp3` | ✅ |

### 1.4 앱 구조 (페이지 라우트)

| 경로 | 설명 | 핵심 기능 |
|------|------|-----------|
| `/` | 홈 화면 | Foxy 비디오 시퀀서, Learn/Review CTA, 스트릭 뱃지, 트로피 링크 |
| `/onboarding` | 온보딩 | Welcome → Grade Select → Level Recommendation (3단계) |
| `/units` | 유닛 선택 | 24+ 유닛 그리드, 잠금/해제 상태, L3/L4 확장 |
| `/lesson/[unitId]` | 레슨 플로우 | 6~10단계 레슨 (Sound Focus → Exit Ticket → Results) |
| `/review` | SRS 복습 | SM-2 알고리즘 기반 플래시카드 |
| `/report` | 학습 리포트 | 취약 음소 차트, PDF/CSV 내보내기 |
| `/rewards` | 트로피 컬렉션 | 10개 배지 정의, 달성 추적 |
| `/settings` | 설정 | 학년 변경, 데이터 초기화, 버전 정보 |

### 1.5 레슨 플로우 상세 (10분 단위)

```
1. Sound Focus    — 목표 음소 소개 + Minimal Pair 퀴즈
2. Blend & Tap    — 음소 결합 탭 + WordImage 팝업 (V2-9)
3. Magic e*       — CVC→CVCe 드래그 퀴즈 (V2-1, *장모음 유닛만)
4. Decode Words   — 단어 해독 퀴즈 + 이미지
5. Word Family*   — Onset+Rime 조합 미니게임 (V2-3, *해당 유닛만)
6. Say & Check    — 발음 녹음 + AI 평가 (V2-4) + MouthVisualizer (V2-11)
7. Micro-Reader   — 3문장 읽기
8. Story Reader*  — 만화 패널 스토리 (V2-2, *해당 유닛만)
9. Exit Ticket    — 최종 퀴즈
10. Results       — 점수, SRS 반영, 보상 확인
```

### 1.6 잔여 작업 (Stage 3 & 4)

| 단계 | 항목 | 담당 | 상태 |
|------|------|------|:----:|
| Stage 3 | AI 립싱크 아바타 영상 통합 (fal.ai) | Antigravity | ⏳ 대기 |
| Stage 3 | 아바타 앵커 이미지 준비 (DALL-E 3) | 사용자 | ⏳ 대기 |
| Stage 4 | Supabase B2G 대시보드 실제 DB 연동 | Claude Code | ⏳ 대기 |
| Stage 4 | Android APK 최종 빌드 (Capacitor) | Claude Code | ⏳ 대기 |
| Stage 4 | 사용자 최종 수동 테스트 | 사용자 | ⏳ 대기 |

### 1.7 Git 커밋 히스토리 (주요)

| 커밋 | 설명 |
|------|------|
| `c4a9c9a` | V2-11 Viseme mouth images (30) & word illustration assets |
| `80e6535` | V2-9 Visual Word Learning & V2-8 Bilingual Home Screen |
| `b8288ef` | V2-6 Report Enhancement & V2-7 L3/L4 Curriculum Expansion |
| `c176f7d` | V2-5 B2G Dashboard & Cloud Sync (Supabase + Recharts) |
| `686d5e1` | V2-11 Pronunciation Dual View & V2-4 AI Assessment Engine |
| `36957f6` | V2 Track B: Magic e, Decodable Stories & Word Family Builder |
| `a82b484` | V2 Track A: Word Image Popup + 3D prompt generator |
| `6c9a2f9` | V1.5 Integration (Sentence Frames, Sight Words, CSV exporter) |

### 1.8 주요 변경 사항 (v2_handover_context.md 대비)

| 항목 | 핸드오버 당시 | 현재 (2026-03-14) |
|------|-------------|-------------------|
| 홈 화면 오디오 | Audio 기반 시퀀서 | **Video 기반 시퀀서**로 전환 (`Foxy_english.mp4`) |
| 단어 이미지 | ~200개 (부분) | **815개** (0 missing, audit 완료) |
| Phoneme 오디오 | 미생성 | **170개** (44 onset + 126 rime) 완료 |
| 립싱크 비디오 | 미생성 | **59개** MP4 파일 생성 완료 |
| `foxy_hello_ko.mp3` | 누락 | **생성 완료** (72.3 KB) |

---

## Part 2: 정밀 QA 테스트 계획서

### 2.1 테스트 범위 개요

총 **8개 테스트 영역**, **40개 테스트 케이스**로 구성.

| # | 테스트 영역 | 관련 기능 | TC 수 |
|:-:|------------|-----------|:-----:|
| A | 홈 화면 & Foxy 비디오 시퀀서 | V2-8 | 5 |
| B | 온보딩 플로우 | V2-10 | 4 |
| C | 유닛 선택 & 잠금 해제 | Core + V2-7 | 4 |
| D | 레슨 코어 플로우 (Sound Focus, Blend&Tap, Decode, Exit Ticket) | Core + V2-9 | 7 |
| E | 특수 레슨 스텝 (Magic e, Word Family, Story Reader) | V2-1, 2, 3 | 6 |
| F | 발음 평가 & 시각화 (Say & Check) | V2-4, V2-11 | 5 |
| G | SRS 복습 & 데이터 영속성 | Core SRS | 4 |
| H | 리포트, 트로피, 설정 | V2-6, Core | 5 |

---

### 영역 A: 홈 화면 & Foxy 비디오 시퀀서 (V2-8)

**품질 확인 포인트:**
- Foxy 마스코트 이미지 렌더링 품질
- 비디오 재생/종료 타이밍과 UI 상태 동기화
- 말풍선 표시/숨김 전환 부드러움
- 마이크 버튼 상태별 색상 변화
- 스트릭 뱃지 및 리뷰 due count 정확도

| TC ID | 테스트 케이스 | 전제 조건 | 실행 단계 | 기대 결과 | 심각도 |
|:-----:|-------------|----------|----------|----------|:------:|
| A-01 | 정상 비디오 재생 | 홈 화면 로드 완료 | 1. 마이크 버튼 탭 → 2. 영어 비디오 재생 관찰 → 3. 비디오 종료 후 상태 확인 | 영어 비디오 재생 → 말풍선 "Hi! I'm Foxy! 🦊" 표시 → 재생 중 마이크 버튼 초록색 + bounce → 종료 후 idle 복귀(흰 버튼, 말풍선 사라짐) | High |
| A-02 | 재생 중 재탭 (인터럽트) | 비디오 재생 중 | 1. 비디오 재생 도중 마이크 버튼 재탭 | 현재 비디오 즉시 중단 → 처음부터 다시 재생 시작 → 상태 정상 초기화 | High |
| A-03 | 비디오 파일 404 Fallback | `Foxy_english.mp4` 파일 이름 변경(시뮬레이션) | 1. 비디오 파일 없는 상태에서 마이크 탭 | 앱 크래시 없음, Foxy 정적 이미지(`foxy_mascot_3d.jpg`) 유지, idle 상태로 안전 복귀 | Medium |
| A-04 | 스트릭 뱃지 정확도 | 3일 연속 학습 기록 존재 | 1. 홈 화면 진입 → 2. "Day X" 텍스트 확인 | "Day 3" 표시. 하루 건너뛰면 스트릭 리셋 | Medium |
| A-05 | 리뷰 due count 뱃지 | SRS 카드 5개가 오늘 복습 예정 | 1. 홈 화면 진입 → 2. Review 카드 우측 상단 뱃지 확인 | 빨간 원형 뱃지에 "5" 표시. 0이면 뱃지 미표시 | Medium |

---

### 영역 B: 온보딩 플로우 (V2-10)

**품질 확인 포인트:**
- 첫 진입 시 온보딩으로 리다이렉트
- 3D Foxy 이미지 렌더링
- 학년 선택 → 레벨 추천 로직
- 온보딩 완료 후 홈 화면 정상 이동 + DB 저장

| TC ID | 테스트 케이스 | 전제 조건 | 실행 단계 | 기대 결과 | 심각도 |
|:-----:|-------------|----------|----------|----------|:------:|
| B-01 | 첫 진입 리다이렉트 | IndexedDB 초기화 (데이터 없음) | 1. 앱 첫 진입 (`/`) | 자동으로 `/onboarding`으로 리다이렉트 | Critical |
| B-02 | 온보딩 완료 플로우 | 온보딩 화면 진입 | 1. Welcome 확인 → 2. 학년 선택 (1학년) → 3. 레벨 추천 확인 → 4. 시작 버튼 탭 | `onboardingCompleted = true` DB 저장, 홈 화면 이동, 이후 재방문 시 온보딩 미표시 | Critical |
| B-03 | 학년별 레벨 추천 | 온보딩 학년 선택 단계 | 1. 1학년 선택 → 추천 확인 → 2. 뒤로 → 4학년 선택 → 추천 확인 | 1학년: Prep/CoreA 추천, 4학년: CoreB/L3 이상 추천. 학년별 차등 추천 | High |
| B-04 | 온보딩 중 뒤로가기/새로고침 | 온보딩 2단계 (학년 선택) | 1. 브라우저 뒤로가기 또는 새로고침 | 앱 크래시 없음. 온보딩 첫 화면으로 복귀하거나 현재 단계 유지 | Medium |

---

### 영역 C: 유닛 선택 & 잠금 해제 (Core + V2-7)

**품질 확인 포인트:**
- 24개 기본 유닛 + L3/L4 확장 유닛 그리드 렌더링
- 순차적 잠금 해제 로직
- 리뷰 유닛(6, 12, 18, 24) 선행 조건 체크
- 완료된 유닛 시각적 구분 (체크마크 등)

| TC ID | 테스트 케이스 | 전제 조건 | 실행 단계 | 기대 결과 | 심각도 |
|:-----:|-------------|----------|----------|----------|:------:|
| C-01 | 초기 상태 유닛 잠금 | 신규 사용자 (Unit 1만 해제) | 1. `/units` 진입 → 2. Unit 2~24 상태 확인 | Unit 1만 활성(탭 가능), Unit 2~24는 잠금(자물쇠 아이콘, 탭 시 이동 안됨) | Critical |
| C-02 | 순차 잠금 해제 | Unit 1 완료 상태 | 1. Unit 1 레슨 완료 → 2. `/units` 복귀 → 3. Unit 2 상태 확인 | Unit 2 잠금 해제, 나머지 유지. Unit 1에 완료 표시 | Critical |
| C-03 | 리뷰 유닛 선행 조건 | Unit 1~4 완료, Unit 5 미완료 | 1. Unit 6 (리뷰 유닛) 상태 확인 | Unit 6 여전히 잠금. Unit 1~5 모두 완료해야 Unit 6 해제 | High |
| C-04 | L3/L4 확장 유닛 표시 | L3/L4 데이터 존재 | 1. 유닛 그리드 스크롤 → 2. Unit 25+ 존재 확인 | L3/L4 유닛 카드 렌더링, 잠금 상태 정상, 레벨 라벨(L3/L4) 구분 표시 | Medium |

---

### 영역 D: 레슨 코어 플로우 (Core + V2-9)

**품질 확인 포인트:**
- 각 스텝 순차 진행 (프로그레스 바 반영)
- Sound Focus: 음소 소개 + Minimal Pair 퀴즈
- Blend & Tap: 음소 결합 + WordImage 팝업
- Decode Words: 단어 해독 퀴즈 + 이미지
- Exit Ticket: 최종 퀴즈 점수 반영
- 세션 복원 (sessionStorage)

| TC ID | 테스트 케이스 | 전제 조건 | 실행 단계 | 기대 결과 | 심각도 |
|:-----:|-------------|----------|----------|----------|:------:|
| D-01 | 레슨 전체 완주 (Unit 1) | Unit 1 잠금 해제 | 1. Unit 1 진입 → 2. 모든 스텝 순서대로 완료 → 3. Results 화면 확인 | 모든 스텝 정상 전환, Results에 점수 표시, "Lesson Complete!" 확인. 홈으로 복귀 가능 | Critical |
| D-02 | Sound Focus 음소 퀴즈 | Unit 1 Sound Focus 진입 | 1. 목표 음소 /æ/ 발음 듣기 → 2. Minimal Pair 퀴즈 (bat vs bet) → 3. 정/오답 확인 | 정답 시 초록 피드백 + 효과음, 오답 시 빨간 피드백 + 재시도 | High |
| D-03 | Blend & Tap 이미지 팝업 (V2-9) | Blend & Tap 스텝 | 1. 음소 카드 탭하여 결합 → 2. 성공 시 이미지 표시 확인 | WordImage 컴포넌트 Scale-in 애니메이션으로 등장 (spring stiffness:300, damping:22). 이미지 크기 +40% 확대 적용 | High |
| D-04 | 이미지 Fallback (V2-9) | 이미지 없는 단어 | 1. 이미지 누락 단어 진입 (혹은 네트워크 차단) | 앱 크래시 없음. "No Image" Fallback 텍스트 박스 표시 (단어ID + "No Image" 라벨) | High |
| D-05 | 프로그레스 바 정확도 | 레슨 진행 중 | 1. 각 스텝 완료 시 상단 프로그레스 바 진행 확인 | 스텝 수에 비례하여 정확히 채워짐. 마지막 스텝에서 100% | Medium |
| D-06 | 레슨 중 이탈 후 복원 | 레슨 3번째 스텝까지 진행 | 1. 브라우저 새로고침 → 2. 같은 레슨 재진입 | sessionStorage에서 복원하여 마지막 진행 스텝부터 재개 (또는 처음부터 시작, 정책에 따라) | Medium |
| D-07 | Exit Ticket 점수 반영 | Exit Ticket 스텝 | 1. 5문제 중 4문제 정답 → 2. Results 화면 확인 | 정확한 점수(80% or 4/5) 표시. SRS 카드에 결과 반영 | High |

---

### 영역 E: 특수 레슨 스텝 (V2-1, V2-2, V2-3)

**품질 확인 포인트:**
- Magic e: 드래그 앤 드롭 정확도, CVC→CVCe 이미지/오디오 전환
- Word Family: Onset 조합 직관성, TTS 재생 큐잉
- Story Reader: 만화 패널 슬라이드, TTS 타이밍/중첩 방지

| TC ID | 테스트 케이스 | 전제 조건 | 실행 단계 | 기대 결과 | 심각도 |
|:-----:|-------------|----------|----------|----------|:------:|
| E-01 | Magic e 정상 드래그 | Unit 7 (장모음 유닛) Magic e 스텝 | 1. 'e' 타일 드래그 → CVC 단어 옆 드롭존에 놓기 | 'e' 결합 → "cap" → "cape" 변환. 이미지 쌍 전환 (모자 → 망토). 단모음→장모음 오디오 재생 | High |
| E-02 | Magic e 잘못된 드래그 | Magic e 스텝 | 1. 'e' 타일을 엉뚱한 위치로 드래그 후 놓기 | 타일이 원래 위치로 스냅백. 단어 변환 안됨. 재시도 가능 | High |
| E-03 | Word Family 정상 조합 | Unit 1 Word Family 스텝 | 1. Rime "-at" 고정 → 2. Onset "b" 탭 → 3. 결과 확인 | "bat" 생성 → TTS 발음 재생 → 의미 표시. 이미지 표시 | High |
| E-04 | Word Family 빠른 연타 | Word Family 스텝 | 1. Onset 버튼 "b", "c", "h" 빠르게 연타 (0.3초 간격) | TTS 음성 중첩 없음. 이전 재생 취소 후 마지막 탭 단어만 발음 | High |
| E-05 | Story Reader 정상 완독 | Unit 1 Story Reader 스텝 | 1. 첫 패널 TTS 재생 확인 → 2. 모든 패널 순서대로 넘기기 → 3. 마지막 패널 완료 | 각 패널에 만화 이미지 표시, 문장 TTS 재생, 하이라이트 동기화. 완독 시 다음 스텝으로 진행 | High |
| E-06 | Story Reader TTS 중첩 방지 | Story Reader 스텝 TTS 재생 중 | 1. 문장 TTS 재생 도중 → 2. 강제 다음 패널 넘김 | 이전 문장 TTS 즉시 중단 → 새 패널 문장 TTS 시작. 음성 겹침 없음 | High |

---

### 영역 F: 발음 평가 & 시각화 (V2-4, V2-11)

**품질 확인 포인트:**
- 마이크 권한 요청 및 거부 처리
- 녹음 → Wasm MFCC/DTW 분석 → 점수 산출
- 파형 UI 실시간 반응
- MouthVisualizer 입모양 이미지 표시
- 무음/소음 예외 처리

| TC ID | 테스트 케이스 | 전제 조건 | 실행 단계 | 기대 결과 | 심각도 |
|:-----:|-------------|----------|----------|----------|:------:|
| F-01 | 마이크 권한 허용 후 녹음 | Say & Check 스텝 | 1. 마이크 권한 "허용" → 2. 녹음 버튼 탭 → 3. 단어 발음 → 4. 결과 확인 | 파형 UI 실시간 표시, 녹음 완료 후 매칭률 점수 표시 (0~100%), 시각적 피드백(초록/노란/빨간) | High |
| F-02 | 마이크 권한 거부 처리 | Say & Check 스텝 | 1. 마이크 권한 "차단" 선택 | "마이크를 켜주세요" 안내 UI 표시. 앱 크래시/화이트 스크린 없음. Skip 버튼으로 다음 스텝 이동 가능 | Critical |
| F-03 | MouthVisualizer 입모양 (V2-11) | Say & Check 스텝 | 1. 단어 발음 시연 버튼 탭 → 2. 입모양 시각화 확인 | 해당 단어의 음소별 Viseme 입모양 이미지 순차 표시. MouthCrossSection 단면도 연동 | Medium |
| F-04 | 무음 입력 처리 | Say & Check 녹음 중 | 1. 녹음 버튼 탭 → 2. 아무 말 안함 (3초 대기) → 3. 녹음 종료 | "다시 시도해주세요" 또는 0점 표시. Wasm 모듈 크래시 없음 | High |
| F-05 | STT 미지원 브라우저 | SpeechRecognition API 미지원 환경 | 1. Say & Check 스텝 진입 | Graceful degradation: 발음 평가 건너뛰기 안내 또는 Skip 옵션 제공 | Medium |

---

### 영역 G: SRS 복습 & 데이터 영속성 (Core)

**품질 확인 포인트:**
- SM-2 알고리즘 정확성 (interval, easeFactor 갱신)
- IndexedDB 데이터 영속성 (앱 재시작 후 유지)
- 복습 카드 필터링 (오늘 날짜 기준)
- 복습 완료 시 다음 복습일 갱신

| TC ID | 테스트 케이스 | 전제 조건 | 실행 단계 | 기대 결과 | 심각도 |
|:-----:|-------------|----------|----------|----------|:------:|
| G-01 | 복습 카드 날짜 필터 | 5개 카드 중 3개가 오늘 복습 예정 | 1. `/review` 진입 → 2. 표시된 카드 수 확인 | 3개 카드만 표시. 미래 날짜 카드는 미표시 | Critical |
| G-02 | 복습 후 SRS 갱신 | 복습 카드 존재 | 1. 카드 "Easy" 평가 → 2. DB 직접 확인 (DevTools) | interval 증가 (예: 1일→3일), easeFactor 상향, nextReviewDate 갱신 | Critical |
| G-03 | 앱 재시작 후 데이터 유지 | 레슨 1개 완료 + 복습 카드 생성 | 1. 브라우저 완전 종료 → 2. 재실행 → 3. 홈 화면 확인 | 스트릭, 완료 유닛, 복습 카드 수 모두 유지. 데이터 손실 없음 | Critical |
| G-04 | 복습 0건 시 UI | 복습 예정 카드 없음 | 1. `/review` 진입 | "복습할 단어가 없습니다" 또는 빈 상태 UI 표시. 빈 화면 아님 | Medium |

---

### 영역 H: 리포트, 트로피, 설정 (V2-6, Core)

**품질 확인 포인트:**
- 리포트 차트 데이터 정확성
- PDF/CSV 내보내기 정상 동작
- 트로피 달성 조건 + 해제 트리거
- 설정: 학년 변경, 데이터 초기화

| TC ID | 테스트 케이스 | 전제 조건 | 실행 단계 | 기대 결과 | 심각도 |
|:-----:|-------------|----------|----------|----------|:------:|
| H-01 | PDF 리포트 내보내기 | 3개+ 유닛 완료 데이터 | 1. `/report` 진입 → 2. PDF 다운로드 버튼 탭 | PDF 파일 다운로드 완료. 차트/취약음소 데이터 포함. 텍스트 깨짐 없음 | High |
| H-02 | CSV 리포트 내보내기 | 학습 로그 데이터 존재 | 1. `/report` → 2. CSV 다운로드 | CSV 파일 다운로드 완료. 열/행 데이터 정확. 한글 인코딩 정상 (UTF-8 BOM) | High |
| H-03 | 트로피 달성 & 표시 | "첫 레슨 완료" 조건 충족 | 1. Unit 1 첫 완료 → 2. `/rewards` 진입 | 해당 트로피 잠금 해제 상태, 빛남 애니메이션. 미달성 트로피는 회색/잠금 표시 | Medium |
| H-04 | 설정: 데이터 초기화 | 학습 데이터 존재 | 1. `/settings` → 2. 데이터 초기화 버튼 → 3. 확인 대화상자 "예" | IndexedDB 전체 삭제. 홈 진입 시 온보딩 리다이렉트 발생. 완전 초기화 | High |
| H-05 | 차트 모바일 반응형 (V2-6) | 리포트 차트 데이터 존재 | 1. 모바일 해상도 (375px 폭) → 2. `/report` 진입 → 3. 차트 확인 | Recharts 차트 삐져나감 없음, X/Y축 레이블 식별 가능, 터치 인터랙션 정상 | Medium |

---

## Part 3: 테스트 실행 가이드

### 3.1 테스트 환경 준비

```bash
# 개발 서버 시작
npm run dev    # → localhost:4000

# IndexedDB 초기화 (Chrome DevTools)
# Application → Storage → IndexedDB → phonics_db → 우클릭 삭제

# 빌드 검증
npm run build  # 에러 없이 통과 확인
```

### 3.2 우선순위별 테스트 순서

**1순위 (Critical, 5개):** B-01, B-02, C-01, C-02, F-02, G-01, G-02, G-03
**2순위 (High, 20개):** A-01, A-02, B-03, C-03, D-01~D-04, D-07, E-01~E-06, F-01, F-04, H-01, H-02, H-04
**3순위 (Medium, 15개):** 나머지 전체

### 3.3 테스트 결과 기록 양식

```markdown
| TC ID | 결과 | 비고 |
|:-----:|:----:|------|
| A-01  | PASS/FAIL | (발견 사항 기록) |
```

---

> **Note**: 본 문서는 V2 개발 전체 히스토리, v2_handover_context.md, Git 커밋 이력, PDCA 분석 보고서 (v2-8, v2-9 등)를 종합하여 2026-03-14 기준으로 작성되었습니다. Stage 3(AI 립싱크) 및 Stage 4(배포) 진행 시 본 문서를 업데이트하시기 바랍니다.
