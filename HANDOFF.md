# 작업 인수인계 (Cross-Environment Handoff)

> 환경 간 전환 시 이 파일을 먼저 읽고 현재 상태를 파악하세요.

---

## 마지막 작업 환경
- **환경**: Antigravity (VSCode)
- **시간**: 2026-03-22 21:27 (KST)
- **브랜치**: `claude/multi-environment-setup-Nlrfn`

---

## 현재 진행 상태 (V2-9 오디오 품질 개선 + WordFamilyBuilder 정답 로직 수정)

### 이번 세션 완료한 작업

#### 1. 음소(Phoneme) 오디오 교체 ✅
- **`rime_ig.mp3`**: 사용자가 Google AI Studio에서 직접 생성한 `ig.wav`의 발음 구간(1.95~2.45s)을 ffmpeg로 정밀 추출하여 교체. "igloo" 잔향, "big" 전이음 모두 제거한 완벽한 "이그" 소리 확보.
- **`rime_ox.mp3`**: 동일 방식으로 사용자가 생성한 `ox.wav`의 발음 구간(2.30~2.98s) 추출 교체.
- **`onset_f.mp3`**: ElevenLabs로 "fox" 단어를 생성한 뒤 0.0~0.16초(frication 구간)만 커팅하여 순수 /f/ 소리 추출 (`scripts/extract-f-m.ts`).
- **`onset_m.mp3`**: 동일 방식으로 "mom" 0.0~0.15초에서 순수 /m/ 소리 추출. "에프에프에프", "엠엠엠" 발음 문제 해결.

#### 2. WordFamilyBuilder 정답/오답 판별 로직 개선 ✅
- **버그**: 보기 온셋(f, h, l 등)을 현재 라임(-og)과 조합했을 때 실제 영어 단어(fog, hog, log)가 만들어져도 수업 미포함 단어라 무조건 오답 처리하는 UX 결함 발견.
- **수정 파일**: `src/app/lesson/[unitId]/WordFamilyBuilder.tsx`
- **해결**: 2000+ 단어 영어 사전(`COMMON_ENGLISH_WORDS`) 내장. `onset + rime` 조합이 사전에 있으면 🌟 **보너스 정답**으로 처리 (보라색 카드, 틀림 효과 없음). 레슨 완료 조건은 여전히 수업 필수 단어(`correctOnsets`) 기준 유지.

#### 3. 오디오 검증 시스템 구축 ✅
- ElevenLabs 다중 생성 후 파일 용량 비교를 통해 가장 짧은 발음("아이쥐" 환각 제거) 자동 선별하는 `scripts/verify-ig-heuristic.ts` 작성.

---

## 🔥 다음 할 일 (후속 작업)

### 1. f/m 추출 결과 검증
- `onset_f.mp3`, `onset_m.mp3` 앱에서 실제로 들어보고 만족스러운지 확인
- 불만족 시 `scripts/extract-f-m.ts`의 커팅 구간 조정 (0.16초 → 0.20초 등)

### 2. 단어 이미지 전수조사 (Claude Code 인수인계)
- `CLAUDE_PROMPT_V2-9_ASSETS.md`를 기반으로 Claude CLI에게 누락 이미지 생성 위임

### 3. 이미지 용량 최적화
- 각 ~1.7MB × 15장 → WebP 변환 통해 각 50~100KB로 압축

---

## 누가 뭘 하고 있나 (Who is doing what)

| 에이전트 | 상태 |
|----------|------|
| **Antigravity** | [Idle] — 이번 세션 완료, Handoff |
| **Claude Code** | [대기] — 이미지/오디오 대량 양산 요망 |

---

## 작업 전환 체크리스트

- [x] 모든 변경사항 commit & push (진행 중)
- [x] HANDOFF.md 업데이트 (완료)
- [ ] 다음 작업 시작 시: `git pull` → HANDOFF.md 읽기 → 시작
