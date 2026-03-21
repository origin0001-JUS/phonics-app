# 작업 인수인계 (Cross-Environment Handoff)

> 환경 간 전환 시 이 파일을 먼저 읽고 현재 상태를 파악하세요.

---

## 마지막 작업 환경
- **환경**: Claude Code (CLI)
- **시간**: 2026-03-21 (KST 기준)
- **브랜치**: `claude/multi-environment-setup-Nlrfn`

---

## 현재 진행 상태 (Seed 기반 발음 입모양 이미지 — PDCA 완료)

### 이번 세션 완료한 작업

- [x] **발음 입모양 시스템 전면 교체**: SVG 코드 기반 → seed_final.jpeg 캐릭터 기반 AI 생성 이미지
- [x] **Gemini 2.5 Flash Image API로 15개 viseme 이미지 생성**: 14/14 성공 (rest는 seed 원본)
- [x] **HumanMouthCharacter.tsx 완전 교체**: SVG 렌더링 → `<img>` 이미지 로드 방식
- [x] **MouthVisualizer.tsx 복합 음소 처리 추가**: "θ ð w" → 첫 번째 매칭 음소 사용
- [x] **Playwright 설치 및 브라우저 자동 QA 체계 구축**: 16개 유닛 자동 스크린샷
- [x] **PDCA 전체 사이클 완료**: Plan → Do → Check (97%) → Report
- [x] **QA 분석 문서 작성**: `docs/pronunciation-qa/PRONUNCIATION_VISUAL_QA_REPORT.md` (16장 스크린샷 포함)
- [x] **npm run build 성공**: 에러 0건

### PDCA 문서

| Phase | 파일 |
|-------|------|
| Plan | `docs/01-plan/features/seed-based-mouth-images.plan.md` |
| Analysis | `docs/03-analysis/seed-based-mouth-images.analysis.md` |
| Report | `docs/04-report/seed-based-mouth-images.report.md` |
| QA 상세 | `docs/pronunciation-qa/PRONUNCIATION_VISUAL_QA_REPORT.md` |

### 변경된 핵심 파일

| 파일 | 변경 |
|------|------|
| `src/app/lesson/[unitId]/HumanMouthCharacter.tsx` | SVG → 이미지 기반 완전 교체 |
| `src/app/lesson/[unitId]/MouthVisualizer.tsx` | 복합 음소 처리, 이미지 fallback |
| `public/assets/images/mouth/*.jpeg` | **15장 신규** (Gemini API 생성) |
| `scripts/gen-mouth.ts` | 이미지 생성 스크립트 |
| `scripts/screenshot-test.ts` | Playwright QA 스크린샷 |

---

## 🔥 다음 할 일 (후속 작업)

### 1. 이미지 용량 최적화 (우선순위 높음)
- 현재: 각 ~1.7MB × 15장 = **~24MB** — PWA 앱에 과다
- 목표: WebP 변환 + 품질 조정으로 각 **50-100KB** (총 ~1MB)
- 방법: `sharp` 또는 `cwebp` 사용, 스크립트 작성 필요

### 2. 차별화 부족 viseme 재생성 (우선순위 중간)
- `bilabial` (m/b/p): rest와 거의 동일 → 입술 더 꽉 다문 모습으로
- `postalveolar` (sh/ch): rest와 비슷 → 입술을 더 둥글게 앞으로
- `open_back` (ɒ): 구별 어려움 → 더 둥근 O 모양으로
- 방법: `scripts/gen-mouth.ts`에서 해당 viseme만 삭제 후 프롬프트 강화 재실행

### 3. L3/L4 오디오 공유 로직 (우선순위 중간)
- 81개 L3/L4 단어에 오디오 미확보 (`l3_black`, `l4_car` 등)
- Core 단어와 동일 발음 → `audio.ts`에서 prefix 제거 fallback 로직 추가
- 예: `l3_black` → `black.mp3` 로 자동 연결

### 4. 폐기된 관련 Plan 정리 (우선순위 낮음)
- `pronunciation-character-animation` (SVG 기반) → 폐기됨
- `pronunciation-image-v2` (정적 이미지) → seed 기반으로 대체됨
- 필요 시 archive 처리

---

## 누가 뭘 하고 있나 (Who is doing what)

| 에이전트 | 상태 |
|----------|------|
| **Claude Code** | [대기 상태] (Idle) — seed-based-mouth-images PDCA 완료 |
| **Antigravity** | [대기 상태] — 합류 시 이미지 용량 최적화 또는 QA |

---

## 작업 전환 체크리스트

### 집 → 회사 전환 시
- [ ] 랩탑에서 모든 변경사항 commit & push
- [ ] HANDOFF.md 업데이트 (현재 상태, 다음 할 일)
- [ ] 회사에서: git pull → HANDOFF.md 읽기 → 작업 시작

### 회사 → 집 전환 시
- [ ] 웹 Claude Code에서 모든 변경사항 commit & push
- [ ] HANDOFF.md 업데이트
- [ ] 집에서: git pull → Antigravity에게 HANDOFF.md 읽게 하기 → 작업 이어가기
