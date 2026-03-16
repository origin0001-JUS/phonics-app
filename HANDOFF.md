# 작업 인수인계 (Cross-Environment Handoff)

> 환경 간 전환 시 이 파일을 먼저 읽고 현재 상태를 파악하세요.

---

## 마지막 작업 환경
- **환경**: 웹 Claude Code
- **시간**: 2026-03-16 오후
- **브랜치**: `claude/multi-environment-setup-Nlrfn`
- **마지막 커밋**: (이 파일 커밋 참조)

---

## 현재 진행 상태

### 이번 세션 완료한 작업 (03/16 오후)
- [x] `src/data/pronunciationGuide.ts` 생성 — 20개 음소별 발음 참조 데이터
  - 한국 학생 난이도별 분류 (very_hard/hard/moderate/easy)
  - 혼동 쌍 비교 (r vs l, f vs p, æ vs ɛ 등)
  - 17장 이미지 생성 프롬프트 포함
  - visemeMap.ts tipKo와 중복 방지 (동작 vs 시각 포인트 역할 분리)
- [x] `src/data/representativeWords.ts` 보완 — Round 14-A 스펙 완성
  - Sound Focus 15개 엔트리 추가 (`soundFocusEntries`)
  - `getSoundFocusVideoPath()` → `sound_XX.mp4` 경로 반환으로 개선
  - `allVideoWords` export 추가
  - `getTotalVideoCount()` 유틸 추가
- [x] `docs/LIPSYNC_PLAN.md` 대폭 업데이트
  - 립싱크 추천: MultiTalk → **VEED Fabric 1.0** ($0.08/초, 총 ~$17)
  - Section 6 추가: 발음 참조 사진 시스템 설계
  - 참고 자료 확충 (Rachel's English, Pronunciation Studio 등)
- [x] `scripts/test-veed-fabric-sample.ts` 생성 — 샘플 품질 테스트 스크립트

---

## 🔥 랩탑에서 해야 할 일 (즉시)

### 1. VEED Fabric 1.0 샘플 테스트 실행

웹 환경에서 외부 API 호출 차단으로 실행 불가. **랩탑에서 실행 필수.**

```bash
# 1. pull
git pull origin claude/multi-environment-setup-Nlrfn

# 2. 의존성 설치
npm install

# 3. .env.local 생성 (키는 아래 참조)
cat > .env.local << 'EOF'
FAL_KEY=56210070-b594-49c0-9566-369ffd52e219:3f61d5a280cfd9e57d881d943eb97481
ELEVENLABS_API_KEY=59e581133a2ee60c44f65eface9cb8640e5cbcd6e0edca0001c2e6b67c057093
EOF

# 4. 실행
npm run test-fabric-sample
```

**결과**: `public/assets/video/samples/` 에 3개 MP4 생성
**비용**: ~$0.48 (약 650원)
**소요 시간**: 2~3분

### 2. 품질 평가 체크리스트

| 단어 | 확인할 것 |
|------|----------|
| **thin** | th 소리 시 혀끝이 치아 사이로 보이는가? s/t와 구별되는가? |
| **fish** | f 소리 시 윗니가 아랫입술에 닿는가? sh때 입술 둥글어지는가? |
| **cat** | /æ/ 모음 시 입이 크게 벌어지는가? "bet"보다 확실히 큰가? |

### 3. 품질 판단 후 분기

- **OK** → 전체 109개 영상 생성 스크립트 작성 (~$17)
- **아쉬움** → 720p로 재테스트 (추가 ~$0.42) 또는 다른 모델 검토
- **별로** → Google Veo 2.0 (기존 스크립트) 또는 Creatify Aurora 검토

---

## CLAUDE_TASKS.md 기준 진행 상태

- Round 1~12: ✅ 완료
- Round 13: 태스크 정의됨, 진행 대기
- **Round 14**: AI 립싱크 영상 통합
  - **Task 14-A**: ✅ `representativeWords.ts` 완성 (92단어 + Sound Focus 15개)
  - **Task 14-B**: ⏳ 대기 (MouthVisualizer.tsx 비디오 레이어 추가)
  - **Task 14-C**: ⏳ 대기 (LessonClient.tsx에 MouthVisualizer 삽입)
- Round 15: V2 코어 로직, 진행 대기

---

## 환경별 역할 분담

| 작업 유형 | 회사 웹 Claude Code | 집 Antigravity + Claude Code |
|-----------|:---:|:---:|
| 코드 개발 | O | O |
| 계획 수립 | O | O |
| 이미지 생성 | X | O (Gemini) |
| API 호출 (fal.ai, ElevenLabs) | **X (차단됨)** | O |
| 브라우저 테스트 | X | O |
| 빌드 검증 | X (네트워크 제한) | O |
| Git push/pull | O | O |
| 웹 리서치/문서화 | O | O |

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
