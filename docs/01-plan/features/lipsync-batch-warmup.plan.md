# Plan: 립싱크 배치 워밍업 방식 v2 (lipsync-batch-warmup)

> 최종 업데이트: 2026-03-17
> 이전 세션에서 TTS 오디오 + 배치 합성까지 완료, VEED Fabric 영상 생성 미완료 상태에서 재개

## 배경

립싱크 AI(VEED Fabric)는 영상 초반 2~3초 동안 입모양 동기화가 부정확하다가, 이후 안정화되어 정밀도가 올라가는 특성이 있음. 단일 단어(1~2초)만으로 영상을 생성하면 항상 "초반 부정확 구간"에 걸려 품질이 낮음.

## 현재 상태 (2026-03-17)

### 기존 완료
- **phonics_split/** 내 mp4: **69개** (기존 Google Flow 분할 + 수작업)
- `representativeWords.ts` 전체 고유 단어: **87개**

### 이전 세션 잔재 (_batch_work/)
- warmup.mp3 (더미 문장)
- word_*.mp3 (23개 개별 단어 TTS — bed 누락!)
- batch_1/2/3.mp3 (배치 오디오 합성 완료)
- batch_1/2/3_timestamps.json (타임스탬프 기록)
- 배치 비디오: **미생성** (세션 끊김)

### 문제점
1. 이전 배치에 `bowl` 포함 (이미 mp4 존재) → 제거 필요
2. `bed` TTS가 `_batch_work/word_bed.mp3`에 없음 → 생성 필요
3. `bee`, `boat`도 이미 mp4 존재 → 제거 필요

## 최종 누락 단어: 24개

기존 phonics_split mp4와 대조하여 정확히 24개 누락:

| # | 단어 | 유닛 |
|---|------|------|
| 1 | bed | unit_02 |
| 2 | cake | unit_07 |
| 3 | cat | unit_01 |
| 4 | chip | unit_28 |
| 5 | chop | unit_17, unit_28 |
| 6 | clap | unit_13, unit_25 |
| 7 | crab | unit_26 |
| 8 | food | unit_37 |
| 9 | hat | unit_01 |
| 10 | hen | unit_02 |
| 11 | man | unit_01 |
| 12 | map | unit_01 |
| 13 | meat | unit_31 |
| 14 | net | unit_02 |
| 15 | red | unit_02 |
| 16 | sea | unit_11 |
| 17 | seed | unit_31 |
| 18 | sing | unit_30 |
| 19 | sled | unit_25 |
| 20 | thin | unit_19, unit_29 |
| 21 | this | unit_19, unit_29 |
| 22 | whale | unit_19, unit_29 |
| 23 | when | unit_19, unit_29 |
| 24 | whip | unit_29 |

## 배치 분할 (8개 × 3배치)

| 배치 | 단어 | 예상 길이 |
|------|------|----------|
| Batch 1 | bed, cake, cat, chip, chop, clap, crab, food | ~26초 |
| Batch 2 | hat, hen, man, map, meat, net, red, sea | ~26초 |
| Batch 3 | seed, sing, sled, thin, this, whale, when, whip | ~26초 |

각 배치: 더미 5초 + 단어 8개 × 2.6초 ≈ **26초**

## 핵심 전략: 더미 워밍업 + 연속 배치

```
[더미 문장 ~5초] → [전환 무음] → [앞0.5s + 단어1 + 뒤0.3s] → [간격1.0s] → [앞0.5s + 단어2 + 뒤0.3s] → ...
```

## 파이프라인

```
Step 1: ElevenLabs TTS
  - 더미 문장 1개 (캐시 재사용)
  - 24개 단어 개별 TTS (Speed 0.6, Sparkles for Kids)
  - bed만 신규 생성, 나머지 23개는 캐시 재사용

Step 2: ffmpeg 오디오 합성
  - 3배치 × [더미 + 전환무음 + (앞무음 + 단어 + 뒤무음 + 간격무음) × 8]
  - 타임스탬프 JSON 저장
  - ⚠️ 이전 배치 캐시 삭제 후 재생성 (단어 구성 변경됨)

Step 3: fal.ai 업로드 + VEED Fabric 영상 생성
  - seed_final.jpeg 시드 이미지
  - 배치별 1개 긴 영상 생성 (3개)

Step 4: ffmpeg 영상 분할
  - timestamps.json 기반 개별 MP4 추출
  - 재인코딩 방식 (-c:v libx264) — keyframe 정확도 보장

Step 5: 출력
  - flow_asset/phonics_split/{word}.mp4에 24개 저장
```

## 설정

| 항목 | 값 |
|------|-----|
| Voice | Sparkles for Kids (`tapn1QwocNXk3viVSowa`) |
| Speed | 0.6 |
| Model | eleven_turbo_v2_5 |
| 더미 워밍업 | "Hello! Let's practice some words together. Are you ready? Here we go!" |
| 단어 앞 무음 | 0.5초 |
| 단어 뒤 무음 | 0.3초 |
| 단어 간 무음 | 1.0초 |
| 워밍업→단어 전환 | 0.5초 |
| 배치 크기 | 8단어/배치 (3배치) |
| Seed image | flow_asset/phonics_split/Seed_final.jpeg |
| VEED Fabric 해상도 | 480p |
| 출력 | flow_asset/phonics_split/{word}.mp4 |

## 캐시 전략

### 재사용 가능
- warmup.mp3 (동일 텍스트/설정)
- 무음 파일 (_sil_*.mp3)
- word_cake/cat/chip/chop/clap/crab/food/hat/hen/man/map/meat/net/red/sea/seed/sing/sled/thin/this/whale/when/whip.mp3 (23개)

### 신규 생성 필요
- word_bed.mp3 (이전 세션에서 누락)

### 삭제 후 재생성
- batch_1/2/3.mp3 (단어 구성 변경)
- batch_1/2/3_timestamps.json (단어 구성 변경)

## 예상 비용
- ElevenLabs: 1개 TTS (bed만) ≈ $0.01
- VEED Fabric: 3배치 × ~26초 × $0.08/초 ≈ **$6.24**
- 총: ~$6.25

## 리스크
- VEED Fabric 큐 대기 시간 (배치당 5~10분)
- ffmpeg 분할 시 프레임 정확도 → 재인코딩 방식으로 해결
- fal.ai 업로드 실패 → 3회 재시도 로직 내장

## 성공 기준
- [ ] 24개 개별 MP4 모두 생성
- [ ] 워밍업 후 구간에서 입모양-발음 동기화 양호
- [ ] 기존 69개 영상과 품질 일관성 유지
- [ ] phonics_split/ 내 총 mp4 = 93개 (69 + 24)
