# TTS Version History (소리로 읽는 영어 300 - 음성 생성 이력)

> 이 문서는 phonics-app 프로젝트의 TTS(Text-to-Speech) 음성 파일 생성 전체 여정을 기록합니다.
> 최신순(reverse chronological)으로 정리되어 있습니다.

---

## 1. Overview (개요)

**대상 파일**: 192개 phoneme(음소) 오디오 파일 (MP3)
**현재 상태**: Round 3 완료 (21개 개별 맞춤 재생성) — 수동 QA 확인 대기 중

| 카테고리 | 파일 수 | 설명 | 예시 |
|----------|---------|------|------|
| **core** | 22개 | 기본 자음/모음 음소 | `core_a.mp3`, `core_sh.mp3` |
| **onset** | 30+개 | 단어 첫소리(초성) 음소 | `onset_bl.mp3`, `onset_str.mp3` |
| **rime** | 130+개 | 단어 끝소리(각운) 음소 | `rime_at.mp3`, `rime_ight.mp3` |

**저장 경로**: `public/assets/audio/phonemes/`

**목적**: 한국 초등학생 대상 영어 파닉스 앱에서 개별 음소 발음을 들려주기 위한 오디오 자산

---

## 2. Version History (버전 이력)

### V3: Gemini Flash TTS Regeneration (2026-04-07)

**NG(불량) 파일 재생성 — Gemini 2.5 Flash Preview TTS 도입**

| 항목 | 내용 |
|------|------|
| **Tool** | Gemini 2.5 Flash Preview TTS (Google AI Studio API) |
| **Voice** | Aoede (American female) |
| **Model** | `gemini-2.5-flash-preview-tts` |
| **Script** | `scripts/regenerate-ng-phonemes.ts` |
| **Data** | `scripts/ng-phoneme-data.ts` (78 entries) |

#### 핵심 개선점: Phonics-Aware Prompting

V2(ElevenLabs)에서 41% NG가 발생한 근본 원인은 TTS 모델이 "이것이 파닉스 음소"라는 맥락을 모르고 일반 단어처럼 읽으려 했기 때문입니다. V3에서는 각 음소마다 다음 정보를 프롬프트에 포함했습니다:

- **IPA 표기**: 정확한 국제음성기호 (예: `/bl/`, `/aɪt/`)
- **Example words**: 해당 음소가 포함된 실제 단어 (예: "blue, black, blend")
- **Sound position context**: 음소가 단어에서 나타나는 위치 설명
- **Explicit instruction**: "This is an isolated phonics sound, not a word"

```
예시 프롬프트:
"Say the phonics onset sound 'bl' (IPA: /bl/) as in 'blue, black, blend'.
 Pronounce ONLY the isolated sound, not the full word.
 This is a phonics teaching audio for children."
```

#### 기술적 발견사항

- **systemInstruction 미지원**: Flash TTS는 `systemInstruction` 파라미터를 지원하지 않음 (500 error 발생). 시스템 프롬프트를 user prompt에 inline으로 병합하여 해결.
- **Kore voice 비호환**: Kore voice는 empty audio를 반환. Aoede voice로 변경하여 해결.

#### 생성 결과

| 단계 | 결과 |
|------|------|
| Round 1 생성 | 74/78 성공, 4개 실패 (API 일일 할당량 100/day 초과) |
| Manual QA Round 1 (Ver1) | 57/74 OK, 17개 여전히 NG |
| 최종 잔여 NG (Round 1) | 21개 (17 재생성 실패 + 4 미생성) |

#### Round 2: 재생성 2차 + 수동 QA Ver2 (2026-04-07)
- **대상**: Round 1에서 NG였던 21개 재생성 (2차)
- **결과**: 21개 전부 생성 성공
- **수동 QA Ver2 결과**:
  - OK: 171/192 (89%)
  - NG: 21/192 (11%) — 전부 재생성된 파일
- **Ver1→Ver2 판정 변경 (18건)**:
  - NG→OK (9건): core_aw, core_j, onset_st, onset_th, rime_ave, rime_oor, rime_ot, rime_up, rime_urse
  - OK→NG (9건): onset_dr, onset_r, onset_sm, onset_w, onset_wh, rime_eam, rime_eef, rime_ip, rime_irt
- **최종 NG 21개**: core_ih, core_ng, core_th, core_th_v, core_uh, onset_bl, onset_dr, onset_f, onset_fr, onset_l, onset_n, onset_r, onset_sm, onset_w, onset_wh, rime_eam, rime_eef, rime_ep, rime_ip, rime_irt, rime_oap
- **커밋**: `6a99ad9` feat: regenerate remaining 21 NG phoneme audio (round 2)
- **다음 단계**: NG 21개는 Round 3에서 프롬프트 개선 후 재생성 예정

#### Round 3: 개별 맞춤 프롬프트 재생성 (2026-04-07)
- **대상**: Round 2 QA에서 NG였던 21개
- **프롬프트 전략**: 개별 맞춤 (CUSTOM_PROMPTS) — 조음 방법 상세 설명 + "단어 X를 말하고 Y 부분만 발음" 방식
- **결과**: 21/21 생성 성공 (onset_r은 1차 실패 후 재시도 성공)
- **Whisper 자동 QA**: OK 4, WARN 6, NG 10, EMPTY 1
- **수동 QA**: 사용자 확인 대기 중
- **커밋**: `c1c11d7` feat: Round 3 phoneme regeneration with custom prompts

#### Git Commits

| Hash | Message |
|------|---------|
| `1469d35` | feat: add NG phoneme data module and Gemini TTS regeneration script |
| `027a097` | fix: use Aoede voice + inline system prompt for Flash TTS compatibility |
| `e228803` | feat: regenerate 74/78 NG phoneme audio with Gemini Flash TTS |
| `29005f9` | feat: add rate limit handling to whisper audit + update results |
| `6a99ad9` | feat: regenerate remaining 21 NG phoneme audio (round 2) |

---

### V2: ElevenLabs Batch Generation (2026-03 ~ 2026-04)

**전체 192개 phoneme 오디오 최초 일괄 생성**

| 항목 | 내용 |
|------|------|
| **Tool** | ElevenLabs API (`eleven_multilingual_v2` model) |
| **Voices** | Rachel (American Female) — onset/rime, Charlotte — core phonemes |
| **Scripts** | `scripts/generate-core-phonemes.ts`, `scripts/generate-phoneme-tts.ts` |

#### 접근 방식: Phonetic Trick Prompts

IPA나 음소 맥락 없이, 음성학적 트릭 표기법을 사용했습니다:

```
예시: "buh.", "thhhh.", "agg.", "igh."
```

#### 문제 발생: 41% NG Rate

| 지표 | 값 |
|------|-----|
| 전체 파일 | 192개 |
| NG (불량) | 78개 |
| NG 비율 | **41%** |

#### 근본 원인 분석

TTS 모델이 phonics notation을 이해하지 못하고, 일반 단어나 의미 없는 문자열로 해석하여 발음했습니다:

- `"igh"` → "ig" 또는 "eye-gee-aitch"로 읽음 (정답: /aɪ/ 소리)
- `"ck"` → "see-kay"로 읽음 (정답: /k/ 소리)
- `"th"` → 불명확한 발음 (정답: /θ/ 또는 /ð/)

#### 관련 Git Commits

| Hash | Message |
|------|---------|
| `0ad8112` | fix: regenerate all phoneme TTS audio via ElevenLabs |
| `7d9ae2e` | fix: regenerate phoneme TTS (n, r, s, it etc.) with American voice and improved prompts |
| `2a9d7d3` | fix: resolve letter name issue in phonemes by using phonetic spellings and multilingual_v2 |

---

### V2.1: Gemini Pro TTS Experiment (2026-04)

**Gemini Pro TTS 가능성 탐색 (Proof of Concept)**

| 항목 | 내용 |
|------|------|
| **Tool** | Gemini 2.5 Pro Preview TTS |
| **Voice** | Aoede |
| **Script** | `scripts/generate-gemini-phoneme-prompted.ts` |

#### 접근 방식

System instruction + 자연어 프롬프트로 음소 발음 생성을 시도했습니다.

#### 결과

- `rime_ig` 1개 파일에 대해 PoC(Proof of Concept) 성공
- 음질과 정확도가 유망했으나, 무료 티어에서 **Pro TTS RPM 제한이 0**으로 배치 생성 불가
- 이 실험 결과를 바탕으로 Flash TTS(V3)로 전환 결정

#### 교훈

- Gemini Pro TTS는 무료 티어에서 사용 불가 (Rate Limit: 0 RPM)
- 하지만 prompting 방식의 유효성은 확인됨 → V3에서 Flash TTS + 동일 전략 적용

---

### V1: Google Cloud TTS (2026-03)

**단어 수준 TTS 최초 생성 — 프로젝트 초기 단계**

| 항목 | 내용 |
|------|------|
| **Tool** | Google Cloud Text-to-Speech API |
| **Voice** | Neural2-F (American female) |
| **Script** | `scripts/generate-tts.ts` |
| **Scope** | 300+ 단어 전체 발음 (phoneme이 아닌 word 단위) |

#### 용도

- 커리큘럼 내 300개 이상 단어의 전체 발음 오디오 생성
- 개별 phoneme(음소)이 아닌, 완전한 단어(예: "cat", "ship", "light") 발음
- Lesson Flow의 Decode Words, Micro-Reader 등에서 사용

#### 참고

이 단계에서는 phoneme 개별 오디오가 필요하지 않았으며, 이후 Sound Focus 스텝 고도화 과정에서 V2(phoneme 단위 생성)가 시작되었습니다.

---

## 3. QA Pipeline (품질 검수 파이프라인)

### 자동화: Groq Whisper API 감사

| 항목 | 내용 |
|------|------|
| **Script** | `scripts/audit-phoneme-whisper.ts` |
| **Engine** | Groq Whisper API (whisper-large-v3-turbo) |
| **방식** | 각 MP3 파일을 transcribe → 기대값과 비교 → OK/NG 판정 |
| **출력** | `scripts/phoneme-audit-report.csv` |

#### Whisper 감사의 한계

- 0.3초 미만의 짧은 음소는 인식 실패율이 높음
- Onset 음소(예: `bl`, `str`)는 단독 발음 시 Whisper가 잘못 인식하는 경우 빈번
- 자동 감사는 1차 필터링 용도이며, 최종 판정은 수동 청취로 확인

### 수동: Browser-based Listening Page

| 항목 | 내용 |
|------|------|
| **Page** | `public/phoneme-audit.html` |
| **기능** | OK/NG 버튼, 카테고리별 탭 필터, 자동 재생, CSV 내보내기 |
| **용도** | 사람이 직접 듣고 OK/NG를 판정하는 최종 QA 도구 |

### 전체 QA 프로세스

```
Whisper 자동 감사 → 수동 청취 검수 → CSV 내보내기 → NG 분석 → NG 파일 재생성 → 반복
```

---

## 4. API Rate Limits (API 요금제 한도 정리)

| API | Free Tier 한도 | 비고 |
|-----|---------------|------|
| **Gemini Flash TTS** (free) | 10 RPM, 100 requests/day | V3에서 사용, 일일 한도로 4개 미생성 |
| **Gemini Pro TTS** (free) | 0 RPM | 사실상 무료 사용 불가 |
| **Groq Whisper** (free) | 20 RPM | QA 감사에 사용, rate limit handler 추가함 |
| **ElevenLabs** | ~100 chars/request, rate varies | V2에서 사용, 월간 문자 수 제한 있음 |
| **Google Cloud TTS** | $0 ~ 일정량 무료 | V1에서 사용, Neural2 voice는 유료 구간 빠름 |

---

## 5. Key Learnings (핵심 교훈)

### 음소 TTS는 일반 TTS와 다르다

1. **맥락이 핵심**: TTS 모델에게 "이것은 파닉스 음소이며 단어가 아닙니다"라는 명시적 맥락을 제공해야 합니다. IPA 표기, 예시 단어, 위치 정보가 모두 필요합니다.

2. **Gemini Flash TTS는 systemInstruction을 지원하지 않음**: API 호출 시 500 error가 발생합니다. 시스템 프롬프트를 user prompt에 직접 병합해야 합니다.

3. **Voice 호환성 주의**: Kore voice는 Flash TTS에서 empty audio를 반환합니다. Aoede voice는 안정적으로 동작합니다.

4. **짧은 음소의 Whisper 인식 한계**: 0.3초 미만의 짧은 음소는 Whisper가 제대로 인식하지 못하는 경우가 많습니다. 자동 QA 결과를 맹신하지 말고 수동 청취를 병행해야 합니다.

5. **백업 필수**: 재생성 전에 반드시 기존 파일을 `phonemes_backup/`에 백업하세요. 재생성이 항상 개선은 아닙니다.

6. **무료 티어의 한계**: 192개 파일이라도 일일 할당량(100/day)에 걸릴 수 있습니다. 작업을 2일에 걸쳐 분산하거나, 유료 플랜을 고려해야 합니다.

---

## 6. File Reference (파일 참조표)

### TTS 생성 스크립트

| 파일 | Version | 용도 |
|------|---------|------|
| `scripts/generate-tts.ts` | V1 | Google Cloud TTS — 300+ 단어 전체 발음 생성 |
| `scripts/generate-core-phonemes.ts` | V2 | ElevenLabs — 22개 core phoneme 생성 (Charlotte voice) |
| `scripts/generate-phoneme-tts.ts` | V2 | ElevenLabs — onset/rime phoneme 생성 (Rachel voice) |
| `scripts/generate-gemini-phoneme-prompted.ts` | V2.1 | Gemini Pro TTS — PoC 실험 (1개 파일) |
| `scripts/regenerate-ng-phonemes.ts` | V3 | Gemini Flash TTS — NG phoneme 재생성 (Aoede voice) |

### 데이터 파일

| 파일 | 용도 |
|------|------|
| `scripts/ng-phoneme-data.ts` | V3 NG phoneme 목록 (78 entries, IPA + example words 포함) |

### QA 도구

| 파일 | 용도 |
|------|------|
| `scripts/audit-phoneme-whisper.ts` | Groq Whisper API 기반 자동 음소 감사 |
| `public/phoneme-audit.html` | 브라우저 기반 수동 청취 QA 페이지 |
| `scripts/phoneme-audit-report.csv` | Whisper 감사 결과 CSV |

### 오디오 파일 위치

| 경로 | 내용 |
|------|------|
| `public/assets/audio/phonemes/` | 192개 phoneme MP3 파일 (core, onset, rime) |
| `public/assets/audio/words/` | 300+ 단어 MP3 파일 |

---

## 7. Timeline Summary (타임라인 요약)

```
2026-03 초   V1: Google Cloud TTS로 300+ 단어 오디오 생성
2026-03 중   V2: ElevenLabs로 192개 phoneme 오디오 최초 일괄 생성
2026-04 초   QA: Whisper 자동 감사 + 수동 청취 → 78/192 NG 발견 (41%)
2026-04 초   V2.1: Gemini Pro TTS PoC 실험 (성공, 그러나 무료 한도 0)
2026-04-07   V3: Gemini Flash TTS로 78개 NG 파일 재생성 시작
2026-04-07   V3 Round 1: 74/78 생성, 수동 QA Ver1 후 21개 잔여 NG
2026-04-07   V3 Round 2: 21개 재생성, 수동 QA Ver2 → 171 OK / 21 NG (89%)
2026-04-07   V3 Round 3: 21개 개별 맞춤 프롬프트 재생성, Whisper QA 완료, 수동 QA 대기
```

---

*Last updated: 2026-04-07*
