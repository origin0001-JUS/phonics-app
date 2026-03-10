# V2-11 Mouth Images Gap Analysis

## Feature: V2-11 발음 시각화 입모양 이미지 생성

| 항목 | 값 |
|------|-----|
| 분석일 | 2026-03-11 |
| Match Rate | **100%** |
| 상태 | ✅ Complete |

## 설계 요구사항 vs 구현 결과

### 1. 이미지 수량 (30장)

| 요구사항 | 구현 | 일치 |
|----------|------|------|
| 15종 정면 뷰(front) | 15장 생성 완료 | ✅ |
| 15종 단면 뷰(cross) | 15장 생성 완료 | ✅ |
| 총 30장 | 30장 (0 실패) | ✅ |

### 2. 15개 Viseme 커버리지

| Viseme ID | Label | front | cross |
|-----------|-------|:-----:|:-----:|
| sil | Silence / Rest | ✅ | ✅ |
| PP | P / B / M | ✅ | ✅ |
| FF | F / V | ✅ | ✅ |
| TH | Th (θ / ð) | ✅ | ✅ |
| DD | T / D / N / L | ✅ | ✅ |
| kk | K / G / NG | ✅ | ✅ |
| CH | Ch / J / Sh | ✅ | ✅ |
| SS | S / Z | ✅ | ✅ |
| RR | R | ✅ | ✅ |
| aa | Short a (æ) | ✅ | ✅ |
| EE | Long e (iː) | ✅ | ✅ |
| IH | Short i (ɪ) | ✅ | ✅ |
| OH | Long o / aw (ɔː) | ✅ | ✅ |
| OO | oo / u (uː) | ✅ | ✅ |
| schwa | Schwa (ə) | ✅ | ✅ |

### 3. 파일명 규칙

| 요구사항 | 구현 | 일치 |
|----------|------|------|
| `{visemeId}-front.png` | 15파일 모두 규칙 준수 | ✅ |
| `{visemeId}-cross.png` | 15파일 모두 규칙 준수 | ✅ |
| 출력 폴더: `public/assets/mouth/` | 정확히 해당 폴더에 저장 | ✅ |

### 4. 스타일 일관성

| 항목 | 설계 | 구현 | 일치 |
|------|------|------|------|
| 정면 뷰 스타일 | semi-realistic 3D, Pixar-quality | STYLE_ANCHOR_FRONT 적용 | ✅ |
| 단면 뷰 스타일 | vector illustration, soft rounded edges | STYLE_ANCHOR_CROSS 적용 | ✅ |
| 배경 통일 | front: #F5F0EB, cross: #FFFFFF | 프롬프트에 명시 | ✅ |

### 5. API 모델

| 항목 | 설계 | 실제 | 비고 |
|------|------|------|------|
| 원래 모델 | gemini-3-pro-image-preview | 429 쿼터 초과 | 일일 250회 한도 |
| 대체 모델 | gemini-3.1-flash-image-preview | 30/30 성공 | 별도 쿼터, 고품질 |

## Gap 목록

없음. 모든 요구사항이 100% 충족됨.

## 파일 크기 통계

- 정면 뷰 평균: ~1,280 KB/장
- 단면 뷰 평균: ~1,000 KB/장
- 전체 합계: ~33 MB (30장)
