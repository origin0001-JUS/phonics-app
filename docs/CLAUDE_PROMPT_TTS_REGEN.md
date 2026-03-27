# CLAUDE_PROMPT: TTS Phoneme 발음 재생성

## 작업 요약
실기기 QA에서 발견된 phoneme(음소) 개별 발음 이슈를 ElevenLabs TTS로 재생성합니다.

## 참고 문서
1. **이슈 목록**: `docs/TTS_ISSUES_FOR_ANTIGRAVITY.md` — 모든 TTS 문제 정리
2. **기존 스크립트**: `scripts/generate-phoneme-tts.ts` — ElevenLabs 배치 생성 스크립트
3. **IPA 매핑**: 같은 스크립트 내 `ONSET_IPA`, `RIME_IPA` 딕셔너리
4. **오디오 파일 위치**: `public/assets/audio/phonemes/` (onset_*.mp3, rime_*.mp3)

## 작업 내용

### 1. Phoneme 개별 발음 재생성 (긴급)
- **문제**: onset/rime 버튼을 누르면 letter name("엔엔엔")이나 이상한 발음이 남
- **대상 파일**:
  - `onset_n.mp3` — /n/ 비음 (현재: "엔엔엔")
  - `onset_r.mp3` — /ɹ/ (현재: 영어 발음 아닌 듯)
  - `onset_s.mp3` — /s/ (현재: "써"로 발음)
  - `onset_m.mp3` — /m/ (현재: 어색)
  - `onset_b.mp3` — /b/ (점검 필요)
  - `rime_ed.mp3` — /ɛd/ (현재: 이상한 발음)
  - `rime_an.mp3` — /æn/ (현재: 어색)
  - `rime_ap.mp3` — /æp/ (현재: 어색)
  - `rime_it.mp3` — /ɪt/ (현재: "아이트"로 발음)
- **방법**: `scripts/generate-phoneme-tts.ts`의 IPA 매핑 확인 후 `--force` 플래그로 재생성
  ```bash
  npx tsx scripts/generate-phoneme-tts.ts --force --onsets
  npx tsx scripts/generate-phoneme-tts.ts --force --rimes
  ```
- **주의**: IPA 매핑이 잘못된 경우 `ONSET_IPA` / `RIME_IPA` 딕셔너리 수정 필요

### 2. 개별 단어 발음 점검 (높음)
- `public/assets/audio/pan.mp3` — 발음 재생성 필요
- `public/assets/audio/fed.mp3` — 발음 점검 필요
- **방법**: `scripts/generate-tts.ts` 또는 ElevenLabs 직접 생성

### 3. Word Gallery 전수 조사 (보통)
- 모든 단어가 레이첼(Rachel) 목소리 녹음파일로 존재하는지 확인
- 누락 파일 있으면 일괄 생성
- **방법**: `scripts/audit-audio.ts` 실행하여 누락 파일 확인

## 환경 설정
- ElevenLabs API Key: `.env.local`에 `ELEVENLABS_API_KEY` 설정 필요
- Voice: Charlotte (`XB0fDUnXU5powFXDhCwa`) — `generate-phoneme-tts.ts` 기본값
- Model: `eleven_monolingual_v1`

## 성공 기준
- [ ] `onset_n.mp3` 재생 시 /n/ 비음만 들림 (letter name "엔" 아님)
- [ ] `onset_r.mp3` 재생 시 영어 /ɹ/ 발음
- [ ] `rime_ed.mp3` 재생 시 자연스러운 /ɛd/
- [ ] `rime_it.mp3` 재생 시 /ɪt/ ("아이트" 아님)
- [ ] `rime_an.mp3`, `rime_ap.mp3` 자연스러운 발음
- [ ] `pan.mp3`, `fed.mp3` 정상 발음
- [ ] `npm run build` 성공
- [ ] HANDOFF.md 업데이트

## 완료 후
1. `npm run build` 실행
2. HANDOFF.md 업데이트
3. `git add . && git commit -m "fix: regenerate phoneme TTS audio" && git push`
