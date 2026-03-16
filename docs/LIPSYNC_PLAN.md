# 입모양 실사화 계획서 (Lip-Sync Realism Upgrade)

> 작성: 2026-03-16 | 상태: 계획 수립 완료, 실행 대기

---

## 1. 현재 상태

### 앱 내 입모양 시스템
- **MouthVisualizer.tsx**: SVG 기반 15개 viseme 플레이스홀더 (입 모양 + 단면도 듀얼 뷰)
- **MouthCrossSection.tsx**: 혀 위치 단면도 SVG
- **visemeMap.ts**: 음소 → viseme 매핑 (15종)
- **usePhonemeSequence 훅**: 음소 순차 애니메이션 (400ms 간격)

### 적용 중인 레슨 스텝
| 스텝 | 현재 상태 |
|------|-----------|
| Sound Focus | viseme 없음 (소리 소개만) |
| Blend & Tap | viseme 없음 |
| Say & Check | MouthVisualizer 사용 중 (SVG) |

### 이미 준비된 코드 인프라 (AI_avatar_guide.md.md 기반)
- `representativeWords.ts` 설계 완료 (아직 미생성)
- `MouthVisualizer.tsx` 비디오 레이어 추가 방안 설계 완료
- `LessonClient.tsx` 삽입 위치 식별 완료
- **영상이 없으면 기존 SVG 폴백** 구조 설계됨

---

## 2. 기술 옵션 비교 (립싱크 영상)

### 옵션 A: VEED Fabric 1.0 — 추천

| 항목 | 내용 |
|------|------|
| **서비스** | fal.ai 경유 VEED Fabric 1.0 (`veed/fabric-1.0`) |
| **입력** | 기준 이미지 1장 + 텍스트 또는 오디오 |
| **출력** | MP4 영상 (음소 레벨 립싱크 + 미세표정) |
| **비용** | $0.08/초 (480p), $0.15/초 (720p) |
| **총 비용** | 109개 영상 × 2초 = 218초 × $0.08 = **~$17 (약 23,000원, 1회성)** |
| **장점** | 2026 기준 최고 리얼리즘, 음소 레벨 입맵핑, 일러스트/마스코트도 지원, 가장 빠른 생성 |
| **단점** | MultiTalk 대비 4배 비용 (그래도 $17) |

### 옵션 B: fal.ai MultiTalk (기존 가이드 방식) — 비추천

| 항목 | 내용 |
|------|------|
| **비용** | ~$0.02/초, 총 ~$7 |
| **장점** | 가장 저렴, API 간단 |
| **단점** | ⚠️ **이전 테스트에서 품질 조악함 확인됨**. 기본 모델은 품질 하위권. 짧은 단어(1~2초) 영상에서 특히 부자연스러움 |

### 옵션 C: Creatify Aurora

| 항목 | 내용 |
|------|------|
| **비용** | $0.10~0.14/초, 총 ~$22~31 |
| **장점** | 전반적 품질 최상위, 감정 표현 우수 |
| **단점** | VEED Fabric과 가격 비슷하지만 생성 속도가 2.6배 느림 (166초 vs 63초) |

### 옵션 D: Google Veo 3.1

| 항목 | 내용 |
|------|------|
| **비용** | ~$0.75/초, 총 ~$164 또는 월 $249 구독 |
| **장점** | 최상위 품질, 네이티브 오디오 동기화 |
| **단점** | 10배 이상 비싼 가격, 전용 립싱크 도구가 아님 |

### 최종 추천: VEED Fabric 1.0

이유:
1. **음소(phoneme) 분석 → 프레임별 입모양 매핑** 방식 — 파닉스 앱에 가장 적합
2. 일러스트/마스코트 이미지도 원본 스타일 보존하며 애니메이션화
3. 교육용 콘텐츠가 공식 유스케이스 중 하나
4. fal.ai에서 동일 API로 호출 — 기존 스크립트 모델명만 교체하면 됨
5. 480p로도 앱 내 소형 뷰에서 충분 → **총 $17 (23,000원)**
6. MultiTalk 이전 테스트에서 품질 불만족 경험 반영

---

## 3. 실행 계획

### Phase 1: 기준 이미지 준비 (Antigravity 담당)

**작업**: 한국 초등학생 캐릭터 이미지 1장 생성

```
프롬프트 (나노바나나프로 또는 Gemini):
A cute Korean elementary school girl (age 8-9) with short black hair,
round cheeks, and bright eyes. Looking directly at camera with a gentle
natural smile. Mouth naturally closed (neutral expression).
Clean white background. Studio lighting. Head and shoulders shot.
Realistic illustration style. 512x512px or higher.
```

**고려사항**:
- 일러스트 스타일 vs 실사 스타일 선택 필요
  - 일러스트: 앱의 BrightFox 톤과 통일감 ↑, 아이들 친근감 ↑
  - 실사: 실제 입모양 학습 효과 ↑, "진짜 사람처럼 따라하기" 교육적 가치
  - **추천**: 반실사(Semi-realistic) 스타일 — 실제 입모양 정확도 확보 + 아이 친화적
- Speech Blubs 앱 사례: 실제 아이들의 영상을 사용하여 교육 효과 극대화

**소요**: 30분

### Phase 2: fal.ai 셋업 + 테스트 생성 (랩탑 필요)

**작업**:
1. fal.ai 계정 생성 + API 키 발급
2. 기준 이미지 업로드 → URL 획득
3. 테스트 영상 5개 생성 (cat, bed, pig, cake, ship)
4. 품질 확인 → 만족 시 전체 배치 진행

```bash
pip install fal-client
export FAL_KEY="your-key"
# 테스트 5개만 먼저
python scripts/generate-lipsync.py --test
```

**소요**: 1시간 (테스트 포함)

### Phase 3: 전체 배치 영상 생성 (랩탑, 자동)

**작업**:
1. `scripts/generate-lipsync.py` 실행 (이미 완성된 스크립트)
2. 109개 영상 자동 생성
3. 품질 검수 → 부족분 VEED Fabric 재생성

```bash
python scripts/generate-lipsync.py
# 약 50분, 자동 실행 (지켜볼 필요 없음)
```

**소요**: 50분 (자동) + 30분 (검수/재생성)

### Phase 4: 앱 코드 통합 (Claude Code 담당)

**작업** (CLAUDE_TASKS.md Round 14 참조):

1. **`src/data/representativeWords.ts` 생성** — 신규 파일
   - 유닛별 대표 단어 매핑
   - `hasLipSyncVideo()`, `getLipSyncVideoPath()`, `getSoundFocusVideoPath()`

2. **`MouthVisualizer.tsx` 수정** — 비디오 레이어 추가
   - `getLipSyncVideoPath(currentWord)` → 영상 있으면 `<video>` 재생
   - 없으면 기존 SVG 플레이스홀더 유지
   - `onError` → SVG 폴백
   - MouthCrossSection(단면도)은 영상 옆에 유지

3. **`LessonClient.tsx` 수정** — 3개 스텝에 적용
   - Sound Focus: `getSoundFocusVideoPath()` 소리 소개 영상
   - Blend & Tap: `<MouthVisualizer currentWord={...}>` 삽입
   - Say & Check: `currentWord` prop 전달 확인 (이미 사용 중)

**소요**: 1~2시간

### Phase 5: 테스트 + 배포 (하이브리드)

**작업**:
1. `npm run build` 빌드 검증 (Claude Code)
2. 브라우저 테스트: 영상 재생, SVG 폴백, 스텝별 동작 확인 (Antigravity)
3. Vercel 배포 후 모바일 테스트 (수동)

**소요**: 1시간

---

## 4. 전체 일정 요약

| Phase | 담당 | 환경 | 소요 | 선행조건 |
|-------|------|------|------|----------|
| 1. 기준 이미지 | Antigravity | 랩탑 | 30분 | 없음 |
| 2. fal.ai 테스트 | 사용자 | 랩탑 | 1시간 | Phase 1 |
| 3. 배치 생성 | 스크립트 자동 | 랩탑 | 50분 | Phase 2 |
| 4. 코드 통합 | Claude Code | 웹 or 랩탑 | 1~2시간 | Phase 1 이전 가능* |
| 5. 테스트 배포 | 하이브리드 | 둘 다 | 1시간 | Phase 3+4 |

*Phase 4는 영상 없이도 선행 가능 (SVG 폴백이 있으므로)

**총 소요: 반나절 (약 4~5시간)**
**총 비용: ~$10 (약 13,000원, 1회성)**

---

## 5. 교육적 고려사항

### 입모양 실사화가 파닉스 학습에 중요한 이유
1. **시각-청각 연합 학습**: 소리와 입모양을 동시에 보면 음소 인식 정확도 향상
2. **McGurk Effect 활용**: 입모양 시각 정보가 청각 인식을 보강
3. **자기 발음 교정**: "이렇게 생긴 입으로 이 소리가 나는구나" 직관적 이해
4. **Speech Blubs 사례**: 또래 아이의 실제 입모양 영상이 발화 학습에 효과적

### 현재 앱의 강점 (이미 구현됨)
- **듀얼 뷰**: 정면 입모양 + 단면도(혀 위치)를 동시에 보여줌
- **viseme 매핑**: 15개 음소 카테고리별 입 모양 분류
- **발음 팁 보기**: 음소별 한국어 설명 제공

### 실사 영상 추가 시 예상 개선
- SVG 플레이스홀더 → **실제(또는 반실사) 입모양 영상**으로 직관성 대폭 향상
- 특히 한국어에 없는 발음 (/θ/, /ð/, /r/, /l/ 등)의 시각적 차별화

---

## 6. 발음 참조 사진 시스템 (NEW)

> 코드: `src/data/pronunciationGuide.ts` (생성 완료)

### 개요
립싱크 영상과 별도로, **핵심 발음 포인트를 보여주는 정적 참조 사진**을 제공.
한국 학생이 어려워하는 음소에 집중하되, 모음 구분까지 포괄적으로 커버.

### 기존 시스템과의 역할 분담 (중복 방지)

| 시스템 | 역할 | 예시 |
|--------|------|------|
| `visemeMap.ts` > `tipKo` | **어떻게 소리내는지** (동작 설명) | "혀끝을 윗니 아랫니 사이로 살짝 내밀며 소리내요" |
| `pronunciationGuide.ts` > `visualTip` | **눈으로 뭘 봐야 하는지** (시각 비교) | "거울로 확인! 혀끝이 치아 사이로 보여야 해요. s/t는 혀가 안 보여요" |
| `pronunciationGuide.ts` > 참조 사진 | **실제 모습** (이미지/일러스트) | 혀가 치아 사이로 나온 클로즈업 사진 |

### 한국 학생 난이도별 커버 음소 (20개)

#### 🔴 Very Hard (7개) — 한국어에 아예 없는 소리
| 음소 | 핵심 실수 | 참조 사진 유형 |
|------|----------|---------------|
| /θ/ (th voiceless) | s/t로 대체 ("think"→"sink") | 정면: 혀가 치아 사이 |
| /ð/ (th voiced) | d로 대체 ("this"→"dis") | 정면 + 목 진동 표시 |
| /r/ | ㄹ(l)과 혼동 ("right"↔"light") | **비교 사진**: r vs l 나란히 |
| /l/ | ㄹ로 대체 (탄설음≠설측음) | 정면: 혀끝이 잇몸에 닿은 모습 |
| /f/ | p로 대체 ("fine"→"pine") | **비교 사진**: f(윗니+입술) vs p(입술+입술) |
| /v/ | b로 대체 ("very"→"berry") | **비교 사진**: v vs b |
| /z/ | s 또는 ㅈ으로 대체 | 정면 + 유성/무성 비교 |

#### 🟠 Hard (5개) — 비슷하지만 다른 소리 (특히 모음!)
| 음소 | 핵심 실수 | 참조 사진 유형 |
|------|----------|---------------|
| /æ/ (cat) | /ɛ/로 대체 ("bat"→"bet") | **비교**: 턱 높이 차이 (2손가락 vs 1손가락) |
| /ɛ/ (bed) | /æ/와 혼동 | 위와 나란히 비교 |
| /ɪ/ (sit) | /ɛ/와 혼동 ("sit"→"set") | **비교**: grin(ɪ) vs chin drop(ɛ) |
| /ɒ/ (hot) | 한국어 "오"보다 크고 둥글어야 | 정면: 큰 동그라미 |
| /ʌ/ (cup) | "어"로 대체, /ɒ/와 혼동 | 정면: 가장 편한(relaxed) 입 |

#### 🟡 Moderate (5개)
| 음소 | 참조 사진 유형 |
|------|---------------|
| /ʃ/ (sh) | **비교**: sh(둥근 입) vs s(평평한 입) |
| /tʃ/ (ch) | sh와 같은 입 + 막힘 표시 |
| /eɪ/ (cake) | 연속 프레임: 입 변화 과정 |
| /aɪ/ (bike) | 연속 프레임: 크게→작게 |
| /oʊ/ (bone) | 연속 프레임: O→좁은 O |

#### 🟢 Easy (3개)
| 음소 | 참조 사진 유형 |
|------|---------------|
| /iː/ vs /ɪ/ | **비교**: 팽팽(cheese) vs 느슨 |
| /b/ vs /p/ | 같은 입 모양, 목 진동 차이 |
| /w/ | 촛불 끄는 입 모양 |

### 교육학적 아이디어 차용 (리서치 기반)

1. **"I makes you grin, E moves your chin!"** (This Reading Mama)
   → /ɪ/ vs /ɛ/ 구별용 니모닉. `visualTip`에 반영 완료.

2. **거울 사용 유도** (Rachel's English)
   → 참조 사진 옆에 "거울로 확인!" 메시지 표시

3. **비교 사진(Comparison) 우선** (Speech Blubs 방식론)
   → 혼동 쌍을 항상 나란히 배치 (r vs l, f vs p, æ vs ɛ 등)

4. **유성/무성 쌍은 목 진동 표시** (Pronunciation Studio)
   → 사진에 목 부분 진동 아이콘으로 시각화

5. **이중모음은 연속 프레임** (Rachel's English)
   → 단일 사진이 아닌 "입이 변하는 과정" 2~3컷

### 이미지 생성 방법

`pronunciationGuide.ts` 하단에 `IMAGE_GENERATION_PROMPTS` 포함.
Antigravity/Gemini에 이 프롬프트를 넣어 일러스트 생성.
총 **17장** (비교 사진은 1장에 2개 음소 포함).

```
파일 위치: public/assets/images/pronunciation/
파일 형식: .webp (용량 절감)
크기: 512x512px
스타일: 아이 친화적 교육 일러스트
```

### MouthVisualizer 통합 방안

```
기존 MouthVisualizer 듀얼 뷰
┌──────────────┬──────────────┐
│  정면 입모양   │  단면도(혀)   │  ← SVG or 립싱크 영상
└──────────────┴──────────────┘

📸 참조 사진 (조건부 표시)
┌─────────────────────────────┐
│  [비교 사진: th vs s]       │  ← pronunciationGuide 데이터
│  "혀끝이 치아 사이로 보여야  │     해당 음소일 때만 표시
│   해요. s는 혀가 안 보여요"  │     이미지 없으면 텍스트만
└─────────────────────────────┘

💡 발음 팁 보기 (기존 토글)
┌─────────────────────────────┐
│  visemeMap.ts tipKo 내용     │  ← 기존 유지
└─────────────────────────────┘
```

---

## 7. 단계별 고도화 로드맵

### Level 1 (현재): SVG 플레이스홀더 ✅ 완료
### Level 2 (즉시 가능): 발음 참조 사진 시스템
- `pronunciationGuide.ts` 데이터 ✅ 생성 완료
- Antigravity로 17장 일러스트 생성 (프롬프트 준비됨)
- MouthVisualizer에 참조 사진 표시 UI 추가
- **이미지 없어도 visualTip 텍스트만으로도 작동**

### Level 3 (중기): AI 립싱크 영상 (VEED Fabric 1.0)
### Level 4 (장기): 실시간 WebRTC 립싱크
- 사용자 카메라로 실시간 입모양 비교
- 난이도 높음, V3+ 고려사항

---

## 8. 즉시 실행 가능한 작업 (웹 Claude Code)

랩탑 없이도 지금 할 수 있는 것:
1. ✅ 이 계획서 작성 & 업데이트
2. ✅ `src/data/pronunciationGuide.ts` 생성 (20개 음소, 이미지 프롬프트 포함)
3. `src/data/representativeWords.ts` 파일 생성 (Round 14-A)
4. `MouthVisualizer.tsx` 비디오 레이어 + 참조 사진 UI 추가 (Round 14-B 확장)
   → 영상/이미지 없어도 텍스트 폴백으로 정상 동작

---

## 참고 자료

### 립싱크 기술
- [fal.ai MultiTalk API](https://fal.ai/models/fal-ai/ai-avatar/single-text/api)
- [fal.ai 가격표](https://fal.ai/pricing)
- [VEED Fabric 1.0 on fal.ai](https://blog.fal.ai/veed-fabric-1-0-on-fal-turn-any-image-into-a-talking-video/)
- [VEED Fabric 1.0 모델 페이지](https://fal.ai/models/veed/fabric-1.0)
- [2026 Best AI Avatar Models 비교](https://www.teamday.ai/blog/best-ai-avatar-models-2026)
- [Best Lip-Sync API 2026 (VEED 벤치마크)](https://www.veed.io/learn/best-lipsync-api)
- [AI Lip Sync 21선 비교](https://aifreeforever.com/blog/lip-sync-ai)

### 발음 교육 & 참조 사진
- [Rachel's English - Mouth Position Study](https://rachelsenglish.com/mouth-position-study/)
- [Rachel's English - 모든 자음 발음](https://rachelsenglish.com/pronunciation-compilation-2/)
- [Rachel's English - 모음과 이중모음](https://rachelsenglish.com/pronunciation-compilation/)
- [This Reading Mama - Short e vs Short i 구별법](https://thisreadingmama.com/tips-teaching-short-e-short-i/)
- [Little Minds at Work - Mouth Formation 무료 자료](https://littlemindsatwork.org/understanding-mouth-formation-with-six-free-resources/)
- [Expressable - R Sound Tongue Positions](https://www.expressable.com/learning-center/speech-sounds/teaching-tongue-positions-for-the-r-sound)
- [Home Speech Home - Speech Helpers](https://www.home-speech-home.com/speech-helpers.html)
- [Speech Blubs - CVC Words for Kids](https://speechblubs.com/blog/mastering-cvc-words-for-kids-a-fun-phonics-guide)

### 한국어 화자 발음 난이도
- [Pronunciation Studio - Korean Speakers Errors](https://pronunciationstudio.com/korean-speakers-english-pronunciation-errors/)
- [BoldVoice - English Pronunciation for Korean Speakers](https://boldvoice.com/blog/english-pronunciation-korean-speakers)
- [Hadar Shemesh - English for Korean Speakers](https://hadarshemesh.com/magazine/english-for-korean-speakers/)

### 프로젝트 내부
- `AI_avatar_guide.md.md` — 립싱크 영상 통합 가이드
- `CLAUDE_TASKS.md` Round 14 — 립싱크 개발 태스크
- `src/data/pronunciationGuide.ts` — 발음 참조 사진 데이터 (NEW)
