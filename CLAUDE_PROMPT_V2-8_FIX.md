# Claude Code 작업 지시: V2-8 한국어 TTS 오디오 파일 생성

## 버그 내용

홈 화면(V2-8 이중 언어 나레이션) QA 중 발견:
- `hi_im_foxy.mp3` (영어) — ✅ 존재함
- `foxy_hello_ko.mp3` (한국어) — ❌ **404 Not Found** (파일 없음)

## 작업 내용

`foxy_hello_ko.mp3` 파일을 생성해서 `public/assets/audio/` 폴더에 저장해 줘.

### 방법 1: 기존 TTS 스크립트 활용 (권장)
`scripts/generate-tts.ts` 스크립트에서 ElevenLabs API를 사용하는 방법을 확인하고,
아래 한국어 텍스트로 TTS 오디오를 생성해줘:

```
텍스트: "안녕! 나는 파닉스 히어로 폭시야. 같이 영어 읽기를 배워볼까?"
목소리: ElevenLabs의 한국어 지원 보이스 (또는 기존에 사용 중인 한국어 TTS 서비스)
출력: public/assets/audio/foxy_hello_ko.mp3
```

### 방법 2: 브라우저 TTS 폴백 코드 (스크립트가 안 되면)
`src/app/page.tsx`에서 `foxy_hello_ko.mp3` 재생 코드를 찾아서,
파일이 없을 경우 Web Speech API (`speechSynthesis`)로 한국어 텍스트를 읽어주는 폴백을 추가해줘.

## 확인 방법
```bash
# 파일 생성 확인
ls public/assets/audio/foxy_hello_ko.mp3
```

## 산출물
작업 완료 후 기존 `docs/04-report/v2-8.report.md`에 해당 버그 수정 내용을 추가로 기록해줘.
