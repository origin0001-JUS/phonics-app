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

## 2. 기술 옵션 비교

### 옵션 A: fal.ai MultiTalk (기존 가이드 방식) — 추천

| 항목 | 내용 |
|------|------|
| **서비스** | fal.ai MultiTalk (`fal-ai/ai-avatar/single-text`) |
| **입력** | 기준 이미지 1장 + 텍스트 (자동 TTS 변환) |
| **출력** | MP4 영상 (립싱크 + 자연스러운 움직임) |
| **비용** | ~$0.02/초, 총 109개 영상 ≈ $7 (약 9,500원, 1회성) |
| **소요 시간** | 스크립트 자동 실행 약 50분 |
| **장점** | 가장 저렴, API 간단, 카툰 캐릭터도 지원 |
| **단점** | 품질이 프리미엄 서비스 대비 낮을 수 있음 |

### 옵션 B: VEED Fabric 1.0

| 항목 | 내용 |
|------|------|
| **서비스** | fal.ai 경유 VEED Fabric 1.0 |
| **비용** | ~$0.08~0.15/초, 총 ≈ $17~33 |
| **장점** | 2026 기준 가장 높은 리얼리즘, 빠른 생성 속도 |
| **단점** | MultiTalk 대비 4~8배 비용 |

### 옵션 C: HeyGen

| 항목 | 내용 |
|------|------|
| **비용** | ~$0.10/초이지만 월 $100 최소 구독 필요 |
| **장점** | 175개 언어 지원, 감정 표현 우수 |
| **단점** | 1회성 프로젝트에 월구독 부담 |

### 옵션 D: 오픈소스 (SadTalker / Wav2Lip / MuseTalk)

| 항목 | 내용 |
|------|------|
| **비용** | $0 (GPU 필요) |
| **장점** | 완전 무료, 로컬 실행 |
| **단점** | GPU 환경 필요, 품질 편차 큼, 셋업 복잡 |

### 최종 추천: 옵션 A (MultiTalk) → 품질 불만 시 옵션 B로 보정

이유:
1. 1회성 $7 비용으로 전체 영상 생성 가능
2. 기존 `AI_avatar_guide.md.md`에 스크립트 완성본 있음
3. 품질이 부족한 15개 정도만 VEED Fabric으로 재생성 (추가 ~$2.40)
4. 총 비용: **~$10 이내**

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

## 6. 대안적 접근: 단계별 고도화

영상 생성이 당장 어려운 경우의 중간 단계:

### Level 1 (현재): SVG 플레이스홀더 ✅ 완료
### Level 2 (단기): 실사 이미지 기반 viseme 스프라이트
- 실제 입 사진 15장 (viseme별 1장) 촬영/생성
- SVG 대신 이미지 교체 → 영상 없이도 리얼리즘 향상
- 비용: $0, 노력: 이미지 준비 1시간

### Level 3 (중기): AI 립싱크 영상 (이 계획서의 주 내용)
### Level 4 (장기): 실시간 WebRTC 립싱크
- 사용자 카메라로 실시간 입모양 비교
- 난이도 높음, V3+ 고려사항

---

## 7. 즉시 실행 가능한 작업 (웹 Claude Code)

랩탑 없이도 지금 할 수 있는 것:
1. ✅ 이 계획서 작성
2. `src/data/representativeWords.ts` 파일 생성 (Round 14-A)
3. `MouthVisualizer.tsx` 비디오 레이어 코드 추가 (Round 14-B)
   → 영상이 없어도 SVG 폴백으로 정상 동작

---

## 참고 자료

- [fal.ai MultiTalk API](https://fal.ai/models/fal-ai/ai-avatar/single-text/api)
- [fal.ai 가격표](https://fal.ai/pricing)
- [VEED Fabric 1.0](https://blog.fal.ai/veed-fabric-1-0-on-fal-turn-any-image-into-a-talking-video/)
- [2026 Best AI Avatar Models 비교](https://www.teamday.ai/blog/best-ai-avatar-models-2026)
- [AI Lip Sync 21선 비교](https://aifreeforever.com/blog/lip-sync-ai)
- [Best Lip-Sync API 2026 (VEED)](https://www.veed.io/learn/best-lipsync-api)
- [Speech Blubs - 아동 발음 학습 앱](https://speechblubs.com/blog/mastering-cvc-words-for-kids-a-fun-phonics-guide)
- [HeyGen eLearning Lip Sync](https://www.heygen.com/blog/breathing-life-into-elearning-scenarios-with-ai-lip-sync-technology)
- [오픈소스 Lip-Sync 모델 8선](https://www.pixazo.ai/blog/best-open-source-lip-sync-models)
- 프로젝트 내부: `AI_avatar_guide.md.md`, `CLAUDE_TASKS.md` Round 14
