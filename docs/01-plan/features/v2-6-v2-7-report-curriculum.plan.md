# V2-6 & V2-7 Plan: 리포트 고도화 + L3/L4 커리큘럼 확장

> **Feature ID**: v2-6-v2-7
> **Phase**: Plan
> **Created**: 2026-03-09
> **Scope**: Track C 병렬 Step 2 — 터미널 B 전담 영역

---

## 1. 목표 (Goals)

### V2-6: 리포트 고도화 & 내보내기
학부모 전달용 심층 리포트 생성. 취약 음소(Phoneme) 차트 시각화, 주간/월간 리포트 자동 생성, PDF 내보내기(jspdf + html2canvas), CSV 헤더/포맷 최적화.

### V2-7: L3/L4 커리큘럼 확장
Smart Phonics 4~5 기반 심화 커리큘럼 추가. L3 자음군/이중자음 6유닛(~80단어), L4 이중모음/R통제모음 7유닛(~90단어). 총 13유닛, ~170단어를 `curriculum.ts`에 병합.

---

## 2. 수정 범위 (Scope Constraints)

### 수정 허용 파일
| 파일 | 작업 내용 |
|------|----------|
| `src/app/report/page.tsx` | 차트 UI 추가, PDF 다운로드 버튼, 주간/월간 탭 |
| `src/lib/exportReport.ts` | 음소 분석 로직, jspdf PDF 생성, CSV 포맷 개선 |
| `src/data/curriculum.ts` | UnitData level 타입 확장, L3/L4 유닛 추가 |
| `src/data/l3l4Words.ts` (신규) | L3/L4 단어 데이터 모듈 |
| `src/scripts/merge-l3l4.ts` (신규) | L3/L4 데이터 병합 검증 스크립트 |
| `package.json` | recharts, jspdf, html2canvas 의존성 추가 |

### 수정 금지 파일 (절대 수정하지 않음)
- `src/app/lesson/[unitId]/page.tsx` (레슨 플로우)
- `src/app/units/page.tsx` (유닛 선택 그리드)
- `src/lib/db.ts` (DB 스키마)
- `src/lib/srs.ts` (SRS 엔진)
- `src/lib/store.ts` (Zustand 스토어)
- `src/lib/audio.ts` (오디오 유틸리티)
- `src/lib/lessonService.ts` (레슨 서비스)
- `src/app/page.tsx` (홈 화면)
- `src/app/onboarding/page.tsx` (온보딩)

---

## 3. V2-6 상세 설계

### 3.1 음소(Phoneme) 취약점 분석

**데이터 소스**: `db.cards` 테이블의 `stage`, `easeFactor` + `curriculum.ts`의 `phonemes` 배열

**분석 로직**:
```
1. 모든 학습 카드를 순회
2. 각 카드의 단어 → curriculum에서 phonemes 매핑
3. stage가 낮거나 easeFactor < 2.0인 카드의 phonemes를 집계
4. phoneme별 "약점 점수" = (해당 음소를 포함한 약한 카드 수) / (해당 음소를 포함한 전체 카드 수)
5. 상위 5~10개 취약 음소를 BarChart로 시각화
```

**새 인터페이스**:
```typescript
interface PhonemeWeakness {
    phoneme: string;       // e.g. "æ", "ɛ", "tʃ"
    displayLabel: string;  // e.g. "short a", "ch"
    weakCount: number;     // stage 0-1 카드 수
    totalCount: number;    // 해당 음소 포함 전체 카드 수
    weaknessRate: number;  // 0~100%
}
```

### 3.2 차트 시각화 (Recharts)

| 차트 | 위치 | 데이터 |
|------|------|--------|
| 취약 음소 Bar Chart | 유닛 현황 위 | 상위 10개 약한 phoneme |
| 주간 학습 시간 Line Chart | 최근 활동 위 | 최근 4주 일별 학습 시간 |

### 3.3 PDF 내보내기 (jspdf + html2canvas)

- `#report-content` DOM 요소를 캡처
- A4 사이즈 PDF 생성
- 학생 이름, 날짜, 레벨 헤더 포함
- 파일명: `phonics300_report_{학생이름}_{날짜}.pdf`

### 3.4 CSV 포맷 개선

기존 CSV에 추가:
- 음소별 취약점 섹션
- 주간 통계 요약 행

---

## 4. V2-7 상세 설계

### 4.1 레벨 타입 확장

현재: `'Prep' | 'CoreA' | 'CoreB'`
확장: `'Prep' | 'CoreA' | 'CoreB' | 'L3' | 'L4'`

### 4.2 L3 유닛 구성 (6유닛, ~80단어)

| Unit ID | # | Title | Target Sound | 단어 수 |
|---------|---|-------|-------------|---------|
| unit_25 | 25 | l-blends | bl, cl, fl, gl, pl, sl | ~14 |
| unit_26 | 26 | r-blends | br, cr, dr, fr, gr, pr, tr | ~14 |
| unit_27 | 27 | s-blends | sm, sn, st, sw | ~12 |
| unit_28 | 28 | ch & sh | tʃ, ʃ | ~14 |
| unit_29 | 29 | th & wh | θ, ð, w | ~13 |
| unit_30 | 30 | ng & nk | ŋ, ŋk | ~13 |

> 참고: 기존 unit_13~19에도 blends/digraphs가 있으나, L3는 더 많은 단어와 심화 조합을 다룸

### 4.3 L4 유닛 구성 (7유닛, ~90단어)

| Unit ID | # | Title | Target Sound | 단어 수 |
|---------|---|-------|-------------|---------|
| unit_31 | 31 | ea & ee | iː | ~13 |
| unit_32 | 32 | oa & ow (long) | oʊ | ~13 |
| unit_33 | 33 | ai & ay | eɪ | ~13 |
| unit_34 | 34 | oi, oy, ou, ow | ɔɪ, aʊ | ~13 |
| unit_35 | 35 | ar & or | ɑːr, ɔːr | ~13 |
| unit_36 | 36 | er, ir, ur | ɜːr | ~12 |
| unit_37 | 37 | oo (short/long) | ʊ, uː | ~13 |

### 4.4 데이터 파일 구조

`src/data/l3l4Words.ts`:
- `curriculum.ts`와 동일한 `w()` 헬퍼 함수 패턴 사용
- `l3Units: UnitData[]`, `l4Units: UnitData[]` export
- 각 유닛에 `microReading` 3문장 포함
- 모든 단어에 `onset`, `rime`, `wordFamily` 필드 포함

`curriculum.ts` 수정:
- level 타입에 `'L3' | 'L4'` 추가
- 마지막에 `...l3Units, ...l4Units` 스프레드
- `microReadingKoMap`에 unit_25~37 한국어 번역 추가

### 4.5 병합 검증 스크립트

`src/scripts/merge-l3l4.ts`:
- 중복 단어 ID 검출
- 누락 필드(phonemes, meaning, onset, rime) 검증
- 총 단어 수 출력
- 유닛 번호 연속성 검증

---

## 5. 구현 순서

### Phase 1: 의존성 설치 + 데이터 준비
1. `npm install recharts jspdf html2canvas`
2. `src/data/l3l4Words.ts` 작성 (L3 6유닛 + L4 7유닛)
3. `curriculum.ts` level 타입 확장 및 l3l4Words import

### Phase 2: 리포트 로직 강화
4. `exportReport.ts`에 `analyzePhonemeWeakness()` 함수 추가
5. `exportReport.ts`에 `generatePDF()` 함수 추가 (jspdf + html2canvas)
6. `OverallReport` 인터페이스에 `phonemeWeaknesses` 필드 추가
7. CSV 포맷에 음소 분석 섹션 추가

### Phase 3: 리포트 UI 업그레이드
8. `report/page.tsx`에 Recharts 취약 음소 BarChart 추가
9. `report/page.tsx`에 주간 학습 시간 LineChart 추가
10. PDF 다운로드 버튼 (브라우저 인쇄 → jspdf 교체)

### Phase 4: 검증
11. `merge-l3l4.ts` 검증 스크립트 실행
12. `npm run build` 통과 확인
13. L3/L4 유닛이 curriculum에 올바르게 추가되었는지 확인

---

## 6. 성공 기준

| 항목 | 기준 |
|------|------|
| 취약 음소 차트 | 상위 10개 phoneme BarChart 렌더링 |
| 주간 학습 차트 | 최근 4주 LineChart 렌더링 |
| PDF 내보내기 | jspdf로 A4 PDF 파일 다운로드 |
| CSV 개선 | 음소 분석 섹션 포함 |
| L3 유닛 | 6개 유닛, ~80단어 정상 추가 |
| L4 유닛 | 7개 유닛, ~90단어 정상 추가 |
| 빌드 | `npm run build` 에러 없음 |
| 무수정 파일 | 금지 목록 파일 변경 없음 |

---

## 7. 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| recharts 번들 크기 증가 | dynamic import로 lazy loading |
| html2canvas 차트 캡처 실패 | 차트를 SVG로 렌더링하여 호환성 확보 |
| L3/L4 단어가 기존 단어와 ID 중복 | 병합 스크립트에서 자동 검출 |
| UnitData level 타입 확장 시 기존 코드 영향 | union 타입 확장이므로 하위 호환 |
