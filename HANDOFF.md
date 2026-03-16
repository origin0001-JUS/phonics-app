# HANDOFF

## 현재 진행 상태 (Current Progress)
- **Round 4 QA (베타 피드백 6종)**: 전면 수정 완료 및 배포됨.
- **Round 5 QA (데코더블 스토리 개편)**: 진행 중 (하이브리드 작업)
  - `docs/ROUND5_CLAUDE_PROMPT.md` 지시에 따라 프론트엔드 UI 개편 완료.
  - `src/data/decodableStories.ts` 생성 및 스토리 데이터 단일화 완료 (하나로 이어지는 서사, 번역 텍스트 추가).
  - `StoryReaderStep.tsx`에 해석 도우미(Translation Tooltip) UI 구현 완료.
  - AI 이미지 생성 프롬프트(`scripts/generate-story-images.ts`) 강화 완료 (일관된 캐릭터 유지, 텍스트 원천 차단).

## 미완료 작업 (Incomplete Tasks)
- **데코더블 스토리 이미지 재생성**:
  - `generate-story-images.ts` 스크립트를 백그라운드에서 실행했으나, `unit_03/panel_6` 이후부터 Gemini API의 `fetch failed` (네트워크 오류 또는 Rate Limit 추정)로 인해 중단되었습니다.
  - **다음 작업자는 `npx tsx scripts/generate-story-images.ts` 명령어를 다시 실행하여 나머지 누락된 스토리보드 이미지들을 모두 마저 생성해야 합니다.**

## 알려진 버그 및 이슈 (Known Bugs & Issues)
- **Gemini 에셋 생성 불안정성**: 한 번에 여러 장의 이미지를 생성할 때 `fetch failed` 또는 `429 Too Many Requests`가 종종 발생합니다. 오류 발생 시 스크립트를 재시행하여 누락된 이미지만 골라서(Skipping 로직 동작) 다시 받는 과정이 필요합니다.
- 스토리 UI와 새로 뽑힌 그림 간의 매칭 퀄리티 테스트 진행이 아직 이루어지지 않았습니다. (이미지 완비 후 UI 검증 필요)

---
*참고: 회사 환경에서 웹 버전 Claude Code로 작업을 이어서 진행하시기 바랍니다.*
