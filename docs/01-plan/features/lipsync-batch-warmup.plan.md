# Plan: 립싱크 배치 워밍업 방식 (lipsync-batch-warmup)

## 배경

립싱크 AI(VEED Fabric 등)는 영상 초반 2~3초 동안 입모양 동기화가 부정확하다가, 이후 안정화되어 정밀도가 올라가는 특성이 있음. 단일 단어(1~2초)만으로 영상을 생성하면 항상 "초반 부정확 구간"에 걸려 품질이 낮음.

## 핵심 전략: 더미 워밍업 + 연속 배치

하나의 긴 오디오 파일을 만들어 립싱크 AI에 넣고, 결과 영상을 단어별로 분할(split)한다.

```
[더미 문장 ~5초] → [단어1] → [간격] → [단어2] → [간격] → ... → [단어N]
```

- 더미 구간: AI가 입모양을 안정화하는 "워밍업" 역할
- 실제 단어들은 워밍업 이후 구간에 위치 → 정밀 립싱크 확보
- 최종 영상에서 단어별 타임스탬프로 개별 MP4를 ffmpeg split

## 오디오 구성

### 더미 워밍업 (앞 ~5초)
- ElevenLabs TTS로 자연스러운 문장 생성
- 예: "Hello! Let's practice some words together. Ready?"
- 같은 Voice (Sparkles for Kids), 같은 Speed (0.6)

### 단어 구간
- 각 단어 사이 **1.0초 무음 간격** (분할 기준점)
- 각 단어 앞 **0.5초 무음**, 뒤 **0.3초 무음** (자연스러운 호흡감)
- 단어 자체는 Speed 0.6으로 약 0.5~1.0초

### 구조 예시 (27단어 기준)
```
[0.0s ~ 5.0s]  더미 워밍업 문장
[5.0s ~ 5.5s]  무음 (전환)
[5.5s ~ 6.0s]  0.5초 무음 (단어1 앞)
[6.0s ~ 6.8s]  "bed" 발음
[6.8s ~ 7.1s]  0.3초 무음 (단어1 뒤)
[7.1s ~ 8.1s]  1.0초 무음 (간격)
[8.1s ~ 8.6s]  0.5초 무음 (단어2 앞)
[8.6s ~ 9.4s]  "bee" 발음
[9.4s ~ 9.7s]  0.3초 무음 (단어2 뒤)
...반복...
```

### 예상 총 길이
- 더미: ~5초
- 단어당: ~0.8초(발음) + 0.5초(앞) + 0.3초(뒤) + 1.0초(간격) = ~2.6초
- 27단어 × 2.6초 = ~70초
- **총: ~75초 (1분 15초)**

## 배치 분할 전략

27개를 한 번에 넣으면 영상이 너무 길어질 수 있으므로 **9개씩 3배치**로 분할:

| 배치 | 단어 | 예상 길이 |
|------|------|----------|
| Batch 1 | bed, bee, boat, bowl, cake, cat, chip, chop, clap | ~28초 |
| Batch 2 | crab, food, hat, hen, man, map, meat, net, red | ~28초 |
| Batch 3 | sea, seed, sing, sled, thin, this, whale, when, whip | ~28초 |

각 배치: 더미 5초 + 단어 9개 × 2.6초 ≈ **28초**

## 파이프라인

```
Step 1: ElevenLabs TTS
  - 더미 문장 1개 생성
  - 27개 단어 개별 TTS 생성 (Speed 0.6)

Step 2: ffmpeg 오디오 합성
  - 배치별로 [더미 + 무음 + 단어1 + 무음 + 단어2 + ...] 연결
  - 각 단어의 시작/끝 타임스탬프 기록 → timestamps.json

Step 3: fal.ai 업로드 + VEED Fabric 영상 생성
  - 배치별 1개 긴 영상 생성 (3개 영상)
  - seed_final.jpeg 사용

Step 4: ffmpeg 영상 분할
  - timestamps.json 기반으로 각 단어 구간을 개별 MP4로 추출
  - ffmpeg -ss {start} -t {duration} -i batch_N.mp4 -c copy {word}.mp4
  - 더미 구간은 버림

Step 5: 출력
  - flow_asset/phonics_split/{word}.mp4 에 27개 저장
```

## 설정

| 항목 | 값 |
|------|-----|
| Voice | Sparkles for Kids (`tapn1QwocNXk3viVSowa`) |
| Speed | 0.6 |
| 더미 워밍업 | ~5초 자연스러운 문장 |
| 단어 앞 무음 | 0.5초 |
| 단어 뒤 무음 | 0.3초 |
| 단어 간 무음 | 1.0초 |
| 배치 크기 | 9단어/배치 (3배치) |
| Seed image | flow_asset/phonics_split/seed_final.jpeg |
| 해상도 | 480p |
| 출력 | flow_asset/phonics_split/{word}.mp4 |

## 예상 비용
- ElevenLabs: 28개 TTS (더미1 + 단어27) ≈ $0.10
- VEED Fabric: 3배치 × ~28초 × $0.08/초 ≈ **$6.72**
- 총: ~$7 (약 9,000원)

## 리스크
- 배치 영상이 너무 길면 VEED Fabric 큐 대기 시간 증가
- 분할 시 프레임 정확도 (ffmpeg keyframe 이슈) → `-c copy` 대신 재인코딩 필요할 수 있음

## 성공 기준
- 워밍업 후 단어 구간에서 입모양이 발음과 정확히 동기화
- 분할된 개별 MP4가 자연스럽게 시작/종료
- 기존 65개 영상과 품질 일관성 유지
