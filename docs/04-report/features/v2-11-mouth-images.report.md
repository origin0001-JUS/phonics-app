# V2-11 Mouth Images Completion Report

## Feature: V2-11 발음 시각화 입모양 이미지 생성

| 항목 | 값 |
|------|-----|
| 완료일 | 2026-03-11 |
| Match Rate | 100% |
| 반복 횟수 | 1 (모델 변경 후 1회 실행) |

## 작업 요약

V2-11 발음 시각화 듀얼 뷰(MouthVisualizer) 컴포넌트에 사용할 입모양 이미지 30장을 Gemini API로 생성 완료.

## 산출물

### 생성된 이미지 (30장)

| # | Viseme | 정면 뷰 | 단면 뷰 |
|---|--------|---------|---------|
| 1 | sil (Silence) | sil-front.png (1,244 KB) | sil-cross.png (799 KB) |
| 2 | PP (P/B/M) | PP-front.png (1,226 KB) | PP-cross.png (948 KB) |
| 3 | FF (F/V) | FF-front.png (1,209 KB) | FF-cross.png (1,116 KB) |
| 4 | TH (θ/ð) | TH-front.png (1,242 KB) | TH-cross.png (1,074 KB) |
| 5 | DD (T/D/N/L) | DD-front.png (1,258 KB) | DD-cross.png (1,032 KB) |
| 6 | kk (K/G/NG) | kk-front.png (1,231 KB) | kk-cross.png (925 KB) |
| 7 | CH (Ch/J/Sh) | CH-front.png (1,206 KB) | CH-cross.png (1,055 KB) |
| 8 | SS (S/Z) | SS-front.png (1,255 KB) | SS-cross.png (1,051 KB) |
| 9 | RR (R) | RR-front.png (1,158 KB) | RR-cross.png (876 KB) |
| 10 | aa (æ) | aa-front.png (1,469 KB) | aa-cross.png (984 KB) |
| 11 | EE (iː) | EE-front.png (1,260 KB) | EE-cross.png (1,055 KB) |
| 12 | IH (ɪ) | IH-front.png (1,290 KB) | IH-cross.png (1,000 KB) |
| 13 | OH (ɔː) | OH-front.png (1,242 KB) | OH-cross.png (1,008 KB) |
| 14 | OO (uː) | OO-front.png (1,257 KB) | OO-cross.png (912 KB) |
| 15 | schwa (ə) | schwa-front.png (1,307 KB) | schwa-cross.png (900 KB) |

**총 용량: ~33 MB**

## 기술 상세

### 사용 도구
- **스크립트**: `scripts/generate-mouth-images.ts`
- **API**: Gemini 3.1 Flash Image Preview (`gemini-3.1-flash-image-preview`)
- **원래 모델**: `gemini-3-pro-image-preview` (일일 쿼터 250회 초과로 변경)

### 스타일 앵커
- **정면 뷰**: semi-realistic 3D render, Pixar-quality, warm peachy-beige skin, #F5F0EB 배경
- **단면 뷰**: clean vector illustration, sagittal cross-section, soft pink/coral-red/white, #FFFFFF 배경

### Rate Limit 대응
- 자동 재시도 로직 (최대 5회, 지수 백오프 15s → 76s)
- 이미지 간 딜레이 (front→cross: 3s, viseme 간: 5s)
- 이미 존재하는 파일은 자동 스킵

## 문제 및 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| gemini-3-pro-image 429 에러 | 일일 250회 쿼터 초과 | gemini-3.1-flash-image-preview로 모델 변경 |
| responseModalities 미설정 | 기존 스크립트에 누락 | `generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }` 추가 |

## 다음 단계

1. 생성된 이미지 육안 품질 검수 (스타일 일관성 확인)
2. MouthVisualizer 컴포넌트에서 이미지 참조 연동 확인
3. 필요시 품질 미달 이미지 개별 재생성
