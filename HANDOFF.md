# 작업 인수인계 (Cross-Environment Handoff)

> 환경 간 전환 시 이 파일을 먼저 읽고 현재 상태를 파악하세요.

---

## 마지막 작업 환경
- **환경**: 랩탑 Antigravity (GUI)
- **시간**: 2026-03-18
- **브랜치**: `claude/multi-environment-setup-Nlrfn` (또는 현재 브랜치)

---

## 현재 진행 상태 (하이브리드 병렬 개발 오케스트레이션 구축 완료)

### 이번 세션 완료한 작업 (워크플로우 세팅)
- [x] **하이브리드 병렬 개발 가이드 문서 작성**: `docs/HYBRID_DEV_GUIDE.md`
- [x] **전역 슬래시 명령어(단축어) 구현**: `~/.agents/workflows/`
  - `/save`: 컨텍스트 저장 및 `git push` 자동화
  - `/load`: `git pull` 및 컨텍스트 브리핑 자동화
  - `/claude`: 클로드용 프롬프트 생성 (비서 역할)
  - `/plan`: 기획 분석, UI/CLI 업무 배분, `CLAUDE_TASKS.md` 갱신 및 터미널 명령어 자동 생성 (PM 역할)
- [x] **클로드 코드 시스템 프롬프트(`CLAUDE.md`) 업데이트**: 작업 완료 시 `git push` 및 `HANDOFF.md` 작성 강제화

- [x] 누락 24개 단어 립싱크 영상 일괄 생성 완료
  - ElevenLabs TTS (Sparkles for Kids, speed 0.6, 앞 0.5초 + 뒤 0.3초)
  - VEED Fabric 1.0 배치 방식 (더미 워밍업 + 3배치 × 8단어)
  - Seed_final.jpeg 시드 이미지 사용
  - `flow_asset/phonics_split/` 내 **총 92개 mp4** 완성
- [x] `scripts/generate-lipsync-batch.ts` 업데이트 (24개 단어 3배치 구성)
- [x] `docs/01-plan/features/lipsync-batch-warmup.plan.md` v2 업데이트

### 이전 세션 완료 작업 (Round 14 준비)
- [x] `src/data/pronunciationGuide.ts` 생성 — 20개 음소별 발음 참조 데이터
- [x] `src/data/representativeWords.ts` 보완 — Round 14-A 스펙 완성
- [x] `docs/LIPSYNC_PLAN.md` 업데이트 (VEED Fabric 1.0 도입)
- [x] `scripts/test-veed-fabric-sample.ts` 생성 — 샘플 품질 테스트 스크립트

---

## 🔥 다음 할 일

### 1. 생성된 립싱크 영상 품질 확인
- `flow_asset/phonics_split/` 내 새로 생성된 24개 mp4 품질 확인
- 특히 확인: bed, cat, hat, man, thin, whale, sea 등
- 워밍업 배치 방식으로 초반 품질 저하 문제 해결되었는지 확인

### 2. Round 14 앱 통합 (Task 14-C, 14-D)
- `MouthVisualizer.tsx`에 비디오 레이어 통합 (이미 완료됨)
- `LessonClient.tsx`에서 MouthVisualizer 연동 확인
- 전체 빌드 및 브라우저 테스트

### 3. Sound Focus 영상 15개 (선택사항)
- `representativeWords.ts`의 `soundFocusEntries` 15개에 대한 영상은 아직 미생성
- 필요 시 별도 스크립트로 생성 가능

---

## CLAUDE_TASKS.md 기준 진행 상태

- Round 1~12: ✅ 완료
- Round 13: ⏳ 태스크 정의됨, 진행 대기
- **Round 14**: AI 립싱크 영상 통합
  - **Task 14-A**: ✅ `representativeWords.ts` 완성 (92단어 + Sound Focus 15개)
  - **Task 14-B**: ✅ 완료 (MouthVisualizer.tsx 비디오 레이어 추가)
  - **Task 14-C**: ✅ 완료 (LessonClient.tsx에 MouthVisualizer 삽입)
  - **Task 14-E**: ✅ 완료 (누락 24개 립싱크 영상 배치 생성, 총 92개 mp4)
- Round 15: V2 코어 로직, 진행 대기

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
