# Claude Code 작업 지시: V2-11 발음 시각화 입모양 이미지 생성

## 작업 내용

`scripts/generate-mouth-images.ts` 스크립트를 실행해서 V2-11 발음 시각화용 입모양 이미지 30장(15종 정면 뷰 + 15종 단면 뷰)을 생성해 줘.

스크립트 내부에 이미 통일된 스타일 앵커(STYLE_ANCHOR)와 15개 viseme 정의가 들어 있으니 그대로 실행하면 돼.

## 실행 명령어

```bash
npx tsx scripts/generate-mouth-images.ts
```

## 참고 사항

- 만약 Gemini API에서 이미지 생성이 실패하면(429 에러 등), `.env.local`의 `GEMINI_API_KEY`를 확인하고, 대체 키로 교체하거나 Rate limit 대기 후 재실행해 줘.
- 출력 폴더: `public/assets/mouth/`
- 파일명 규칙: `{visemeId}-front.png` (정면 뷰), `{visemeId}-cross.png` (단면 뷰)

## 산출물 (필수)

작업이 완료되면 반드시 아래 파일을 작성해 줘:

1. `docs/03-analysis/features/v2-11-mouth-images.analysis.md` (Gap 분석)
2. `docs/04-report/features/v2-11-mouth-images.report.md` (완료 보고서)
