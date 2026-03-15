# Claude Code 프롬프트 (V2-9 에셋 자동화)

사용자 지시문: `claude -p "Please execute CLAUDE_PROMPT_V2-9_ASSETS.md"`

## 작업 1: 누락된 파닉스 단어 이미지 일괄 생성 (Image Audit & Generation)

1. `src/data/curriculum.ts` 파일을 읽어 모든 `units`의 `words[]` 배열에 있는 `id` 목록을 추출하세요.
2. `public/assets/images/` 폴더를 스캔하여 존재하는 `.png` 파익 목록과 비교하세요 (예: `cat` -> `cat.png`).
3. 누락된(매칭되지 않는) `id` 문자열 배열을 찾으세요.
4. 누락된 이미지들에 대해 프로젝트에 존재하는 이미지 생성 스크립트(`scripts/generate-images.ts` 또는 `dalle` 관련 라이브러리)를 활용하거나, 직접 DALL-E/Gemini API 요청 코드를 임시로 작성하여 `public/assets/images/` 에 해당 `.png` 파일들을 생성 및 저장하세요. (스타일 프롬프트 예시: "3D cartoon style, claymation style, cute, [단어 뜻] object, solid light blue background, highly detailed, soft lighting").

## 작업 2: 고음질 Onset 및 Rime (음소) 오디오 생성 (High-Quality Phoneme Audio)

1. `src/data/curriculum.ts` 파일을 읽어 모든 단어의 `onset`과 `rime` 속성값을 중복 없이 고유하게 추출하세요 (예: `['b', 'c', 'ed', 'at', ...]`).
2. 추출된 고유값들에 대해 ElevenLabs TTS 기반 스크립트를 작성하거나 또는 기존 `scripts/generate-tts.ts`를 활용하여 생성하세요.
3. 파일 저장 경로는 `public/assets/audio/phonemes/` 디렉터리입니다.
4. 발음 시 주의사항: `onset`은 뒤에 짧은 모음이 섞이지 않도록 자음 본연의 소리만 내도록 유도하고, `rime`은 해당 철자의 파닉스 규칙에 맞는 소리로 발음하게 하세요.
5. 파일명 규칙: 
   - onset의 경우: `onset_{소문자 알파벳}.mp3` (예: `onset_b.mp3`, `onset_sh.mp3`)
   - rime의 경우: `rime_{소문자 알파벳}.mp3` (예: `rime_ed.mp3`, `rime_at.mp3`)

## 작업 3: AI 립싱크 아바타 영상 자동화 생성 (Google VEO API 사용)

이 작업은 기존의 번거로운 Flow AI 생성을 대체하기 위한 강력한 자동화 작업입니다.

1. `src/data/representativeWords.ts` (없을 경우 Antigravity가 작성한 로직이나 `curriculum.ts`를 직접 참조하여 92개 대표 단어 목록 도출)를 확인하여 92개의 대상 단어 목록을 추출하세요.
2. `public/assets/images/base_image_girl.png` 이미지를 기준 이미지(Base Image)로 사용하십시오.
3. `scripts/generate-lipsync-videos.ts` 스크립트를 생성 및 작성하세요.
   - 이 스크립트는 Google Developer API 또는 Vertex AI의 최신 동영상 생성 모델 (예: `veo-3.1-fast` 등 가장 적합한 모델)을 사용하여, 기준 이미지가 해당 대상 단어를 말하는 립싱크 영상을 생성해야 합니다.
   - 프롬프트 예시: "Pronounce the word '[단어명]' very clearly and warmly, looking directly at the camera."
   - 생성되는 영상 길이는 한 단어 발음에 적합하도록 약 **2초 길이**로 설정하세요.
4. 스크립트를 실행하여 생성된 92개의 영상을 `public/assets/video/[단어명].mp4` 에 저장하세요.

작업 과정에서 스크립트 에러나 제한(API Key 등)이 발생할 경우 즉시 사용자에게 상황을 텍스트로 보고하십시오. 모든 파일이 성공적으로 생성되었는지 디렉터리를 스캔하여 콘솔에 요약 출력해 주세요.
