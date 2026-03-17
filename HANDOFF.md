# 작업 인수인계 (Cross-Environment Handoff)

> 환경 간 전환 시 이 파일을 먼저 읽고 현재 상태를 파악하세요.

---

## 마지막 작업 환경
- **환경**: 웹 Claude Code / Antigravity
- **시간**: 2026-03-17
- **브랜치**: `claude/multi-environment-setup-Nlrfn`

---

## 현재 진행 상태 (Round 14 진행 중 + Round 5 QA 병합)

### 최근 반영된 작업 (Round 5 QA 병합 내용)
- **Round 5 QA (데코더블 스토리 개편)**: 하이브리드 작업 완료
  - `src/data/decodableStories.ts` 생성 및 스토리 데이터 단일화 (하나로 이어지는 서사, 번역 텍스트 추가).
  - `StoryReaderStep.tsx`에 해석 도우미(Translation Tooltip) UI 구현 완료.
  - AI 이미지 생성 프롬프트(`scripts/generate-story-images.ts`) 강화 완료.
  - *참고: Gemini API 제한(fetch failed) 이슈로 인한 스토리 이미지 누락분이 있을 수 있으므로 재확인 필요.*

### 이번 세션 완료한 작업 (Round 14 준비)
- [x] `src/data/pronunciationGuide.ts` 생성 — 20개 음소별 발음 참조 데이터
- [x] `src/data/representativeWords.ts` 보완 — Round 14-A 스펙 완성
- [x] `docs/LIPSYNC_PLAN.md` 업데이트 (VEED Fabric 1.0 도입)
- [x] `scripts/test-veed-fabric-sample.ts` 생성 — 샘플 품질 테스트 스크립트

---

## 🔥 랩탑에서 해야 할 일 (즉시)

### 1. 스토리 이미지 누락 여부 확인 (Round 5 잔여 작업)
- `npx tsx scripts/generate-story-images.ts`를 실행하여 429 에러로 누락되었던 스토리가 모두 생성되었는지 확인.

### 2. VEED Fabric 1.0 샘플 테스트 실행
웹 환경에서 외부 API 호출 차단으로 실행 불가하므로 **랩탑에서 실행 필수.**

```bash
# 1. 의존성 설치
npm install

# 2. .env.local 생성 (키는 아래 참조)
# (FAL_KEY, ELEVENLABS_API_KEY 입력)

# 3. 실행
npm run test-fabric-sample
```

### 3. 품질 평가 체크리스트
| 단어 | 확인할 것 |
|------|----------|
| **thin** | th 소리 시 혀끝이 치아 사이로 보이는가? s/t와 구별되는가? |
| **fish** | f 소리 시 윗니가 아랫입술에 닿는가? sh때 입술 둥글어지는가? |
| **cat** | /æ/ 모음 시 입이 크게 벌어지는가? "bet"보다 확실히 큰가? |

### 4. 품질 판단 후 분기
- **OK** → 전체 109개 영상 생성 스크립트 작성 (~$17)
- **아쉬움** → 720p로 재테스트 (추가 ~$0.42) 또는 다른 모델 검토

---

## CLAUDE_TASKS.md 기준 진행 상태

- Round 1~12: ✅ 완료
- Round 13: ⏳ 태스크 정의됨, 진행 대기
- **Round 14**: AI 립싱크 영상 통합
  - **Task 14-A**: ✅ `representativeWords.ts` 완성 (92단어 + Sound Focus 15개)
  - **Task 14-B**: ⏳ 대기 (MouthVisualizer.tsx 비디오 레이어 추가)
  - **Task 14-C**: ⏳ 대기 (LessonClient.tsx에 MouthVisualizer 삽입)
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
