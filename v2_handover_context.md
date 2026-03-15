# V2 Development: Handover & Context Summary

이 문서는 이전 대화창에서 진행된 V2 개발 및 에셋 생성, QA 과정의 전체 맥락과 결과를 요약한 것입니다. 새로운 대화창(세션)을 시작할 때 이 파일을 AI에게 읽게 하면 이전의 모든 흐름을 즉시 파악하고 작업을 이어갈 수 있습니다.

---

## 1. 프로젝트 현재 상태 (Project Status)

*   **V2 기능 개발 (Track A, B, C)**: 100% 코드 구현 완료.
*   **Stage 1: 에셋 제작**: 100% 완료.
    *   Magic e 대비용 CVC 이미지 7장 전량 보완.
    *   Decodable Stories 확장 만화 패널 36장(6 유닛 x 6 패널) 유료 Gemini API를 통해 전량 생성 및 적용 완료.
*   **Stage 2: 브라우저 E2E QA**: 테스트 완료 (6/7 PASS).
    *   핵심 레슨 뷰, 온보딩, 유닛 목록 정상 작동.
    *   발견된 버그 수정 완료 (Blend & Tap 개별 음소 발음 로직 교체, 단어 이미지 사이즈 30% 확대, 이미지 없을 시 Fallback 텍스트 박스 추가).
    *   단, 교사용 대시보드는 Supabase 연동 전이므로 에러(정상적인 실패) 처리됨.

---

## 2. 잔여 작업 및 다음 단계 (Next Steps)

현재 작업은 V2 최종 마무리 단계인 **Stage 3**와 **Stage 4**를 앞두고 있습니다. 새로운 대화창에서는 아래의 순서대로 작업을 요청 및 진행하면 됩니다.

### [진행해야 할 작업 목록]

**우선 처리 사항 (Claude Code 지시용)**
1.  **V2-8 누락 오디오 생성**: `CLAUDE_PROMPT_V2-8_FIX.md` 파일을 통해 Claude Code에게 누락된 `foxy_hello_ko.mp3` TTS 생성을 지시해야 합니다.
2.  **자동 QA 스크립트 실행 (선택)**: `CLAUDE_PROMPT_QA.md` 파일을 통해 Claude Code 기반의 코드/타입/에셋 자동 검증을 실행할 수 있습니다.

**Stage 3: Round 14 AI 립싱크 아바타 영상 통합**
3.  **아바타 앵커 이미지 준비**: 사용자님께서 DALL-E 3나 Midjourney 등을 통해 투명 배경의 정면 아바타 이미지(`avatar.png`)를 생성하여 `public/assets/avatar/` 폴더에 넣어야 합니다. (참고: `implementation_plan.md` 및 `AI_avatar_guide.md`)
4.  **영상 생성 (Antigravity)**: 아바타 이미지가 준비되면, Antigravity(AI)에게 `scripts/generate-lipsync.py` 또는 fal.ai API를 호출하여 단위별 파닉스 발음 립싱크 영상 109개를 일괄 생성하도록 지시합니다. (유료 fal.ai API 키 필요)
5.  **UI 변경 및 통합 (Claude Code)**: 만들어진 영상 파일들을 `MouthVisualizer` 컴포넌트 등에 매핑하여 재생되도록 코드를 연동합니다.

**Stage 4: 사용자 최종 수동 테스트 및 배포**
6.  사용자님의 최종 기기/브라우저 수동 테스트.
7.  교사용 Teacher Dashboard를 위한 실제 Supabase DB 연동.
8.  Android APK 최종 빌드(`npx cap sync` & Android Studio 빌드).

---

## 3. 핵심 참조 파일 목록 (Key Context Files)

새로운 AI에게 컨텍스트를 제공하거나 작업할 때 참고해야 할 주요 파일들입니다.

*   `task.md` (`.gemini/antigravity/brain/...` 경로): 전체 프로젝트 마스터 체크리스트. (현재 상태는 18번 항목 완료, 19번 진행 중)
*   `implementation_plan.md` (`.gemini/antigravity/brain/...` 경로): AI 아바타 통합(Stage 3)에 대한 구체적인 실행 계획안.
*   `CLAUDE_PROMPT_V2-8_FIX.md` (프로젝트 루트): 누락된 한국어 인사음성 생성용 Claude 프롬프트.
*   `CLAUDE_PROMPT_QA.md` (프로젝트 루트): 전체 앱 무결성 자동 테스트용 Claude 프롬프트.
*   `scripts/generate-lipsync.py`: (추후 사용할) fal.ai 기반 AI 립싱크 영상 생성 파이썬 스크립트.
*   `docs/AI_avatar_guide.md`: AI 립싱크 기능 구현을 위한 초기 가이드 문서.

---

> **💡 Note for the new AI Agent:** 
> Please read this document first. The project is a Next.js offline-first PWA phonics app. We have just finished generating all image assets using the Gemini API and successfully passed browser QA tests (resolving phoneme TTS and image sizing bugs). Your immediate priority is to guide the user through generating the final `foxy_hello_ko.mp3` using Claude Code, and then proceeding to Stage 3: integrating fal.ai lip-sync avatars (`avatar.png`) into the app.
