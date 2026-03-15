# Claude Code 작업 지시: V2 통합 QA 자동 검증

## 작업 내용

아래 6가지 자동 검증을 순서대로 실행하고 결과를 보고해 줘.

## 검증 체크리스트

### 1. 프로덕션 빌드 테스트
```bash
npx next build
```
에러 없이 성공하는지 확인.

### 2. TypeScript 타입 체크
```bash
npx tsc --noEmit
```
타입 에러가 없는지 확인. 에러가 있으면 목록 제시.

### 3. 핵심 모듈 존재 확인
아래 파일들이 실제로 존재하고 import 에러가 없는지 확인:
- `src/lib/audioAssessment.ts`
- `src/lib/supabaseClient.ts`
- `src/app/teacher/page.tsx`
- `src/lib/exportReport.ts`
- `src/data/l3l4Words.ts`
- `src/data/curriculum.ts` (L3/L4 unit_25~37 포함 여부)

### 4. 스토리 패널 에셋 확인
`public/assets/stories/` 폴더에 unit_01~07의 패널 파일들이 있는지 확인:
```bash
# 각 유닛 폴더와 파일 목록 출력
```

### 5. 이미지 에셋 Magic e 확인
`public/assets/images/` 폴더에 아래 파일들이 있는지 확인:
- cap.png, cape.png, kit.png, kite.png, hop.png, hope.png
- cub.png, cube.png, pin.png, pine.png, tap.png, tape.png

### 6. V2 기능 컴포넌트 검증
아래 컴포넌트 파일들이 존재하고 기본 문법 오류가 없는지 확인:
- `src/app/lesson/[unitId]/MagicEStep.tsx`
- `src/app/lesson/[unitId]/WordFamilyBuilder.tsx`
- `src/app/lesson/[unitId]/StoryReaderStep.tsx` (또는 유사 파일명)
- `src/app/lesson/[unitId]/MouthVisualizer.tsx`
- `src/app/lesson/[unitId]/AudioVisualizer.tsx`

## 산출물 (필수)

검증 완료 후 반드시 아래 파일을 작성해 줘:
- `docs/04-report/v2-qa-auto.report.md` — 각 검증 항목별 결과 (✅통과 / ❌실패 / ⚠️경고) 표 형식으로 작성
