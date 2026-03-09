# V2-6 & V2-7 Design: 리포트 고도화 + L3/L4 커리큘럼 확장

> **Feature ID**: v2-6-v2-7
> **Phase**: Design
> **Created**: 2026-03-09
> **Plan Reference**: `docs/01-plan/features/v2-6-v2-7-report-curriculum.plan.md`

---

## 1. 파일 변경 맵 (File Change Map)

### 수정 파일
| 파일 | 변경 유형 | 요약 |
|------|----------|------|
| `src/lib/exportReport.ts` | 확장 | PhonemeWeakness 분석, WeeklyStats, PDF 생성, CSV 개선 |
| `src/app/report/page.tsx` | 확장 | Recharts 차트 2개, PDF 버튼, 탭(전체/주간) |
| `src/data/curriculum.ts` | 확장 | level 타입 확장, l3l4Units import + spread |
| `package.json` | 의존성 | recharts, jspdf, html2canvas 추가 |

### 신규 파일
| 파일 | 목적 |
|------|------|
| `src/data/l3l4Words.ts` | L3 6유닛 + L4 7유닛 단어 데이터 |
| `src/scripts/merge-l3l4.ts` | L3/L4 데이터 무결성 검증 스크립트 |

### 수정 금지 파일 (Gap 분석 시 검증 대상)
- `src/app/lesson/[unitId]/page.tsx`
- `src/app/units/page.tsx`
- `src/lib/db.ts`
- `src/lib/srs.ts`
- `src/lib/store.ts`
- `src/lib/audio.ts`
- `src/lib/lessonService.ts`
- `src/app/page.tsx`
- `src/app/onboarding/page.tsx`

---

## 2. V2-6 상세 설계: 리포트 고도화

### 2.1 인터페이스 확장 (`exportReport.ts`)

```typescript
// ─── 신규 타입 ───

export interface PhonemeWeakness {
    phoneme: string;        // IPA 표기: "æ", "ɛ", "tʃ"
    displayLabel: string;   // 표시명: "short a", "ch"
    weakCount: number;      // stage 0~1 카드 수
    totalCount: number;     // 해당 음소 포함 전체 카드 수
    weaknessRate: number;   // 0~100 (소수점 없음)
}

export interface WeeklyStats {
    weekLabel: string;      // "3/3~3/9" 형태
    totalMinutes: number;
    sessionCount: number;
    wordsLearned: number;
}

// ─── OverallReport 확장 ───
export interface OverallReport {
    // ... 기존 필드 유지 ...
    phonemeWeaknesses: PhonemeWeakness[];  // 상위 10개
    weeklyStats: WeeklyStats[];            // 최근 4주
}
```

### 2.2 음소 분석 로직 (`analyzePhonemeWeakness`)

```typescript
// phoneme → displayLabel 매핑 (exportReport.ts 내부 상수)
const PHONEME_LABELS: Record<string, string> = {
    'æ': 'short a', 'ɛ': 'short e', 'ɪ': 'short i',
    'ɒ': 'short o', 'ʌ': 'short u',
    'eɪ': 'long a', 'aɪ': 'long i', 'oʊ': 'long o',
    'uː': 'long u', 'iː': 'long e/ee',
    'tʃ': 'ch', 'ʃ': 'sh', 'θ': 'th (voiceless)',
    'ð': 'th (voiced)', 'ŋ': 'ng',
    'ɑːr': 'ar', 'ɔːr': 'or', 'ɜːr': 'er/ir/ur',
    'aʊ': 'ow/ou', 'ɔɪ': 'oi/oy',
};

export function analyzePhonemeWeakness(
    allCards: VocabularyCard[],
    allWords: WordData[]
): PhonemeWeakness[]
```

**알고리즘**:
1. `allWords`에서 `{ wordId → phonemes[] }` 맵 생성
2. `allCards`를 순회하며 각 카드의 phonemes를 집계:
   - `stage <= 1` 또는 `easeFactor < 2.0` → weakCount++
   - totalCount++ (무조건)
3. phoneme별 `weaknessRate = Math.round((weakCount / totalCount) * 100)` 계산
4. weaknessRate 내림차순 정렬, 상위 10개 반환
5. `totalCount < 2`인 phoneme은 통계적 의미 없으므로 제외

### 2.3 주간 통계 (`calculateWeeklyStats`)

```typescript
export function calculateWeeklyStats(
    allLogs: ActivityLog[],
    allCards: VocabularyCard[],
    weeksBack: number = 4
): WeeklyStats[]
```

**알고리즘**:
1. 현재 날짜에서 `weeksBack` 주 전까지의 범위 계산
2. 각 주의 월~일 범위로 로그 필터링
3. 주별 totalMinutes, sessionCount 집계
4. wordsLearned: 해당 주에 `stage`가 0→1 이상으로 올라간 카드 수 (근사값으로 `nextReviewDate`가 해당 주 범위에 있는 카드 수 사용)

### 2.4 PDF 내보내기 (`generatePDF`)

```typescript
export async function generatePDF(report: OverallReport): Promise<void>
```

**구현**:
1. `html2canvas`로 `#report-content` DOM 캡처 (scale: 2 for retina)
2. `jspdf`로 A4 사이즈 문서 생성
3. 캔버스 이미지를 PDF에 `addImage` (비율 유지)
4. 페이지 넘침 시 자동 페이지 분할
5. 파일명: `phonics300_report_${studentName}_${YYYY-MM-DD}.pdf`
6. `document.createElement('a')` + `click()` 으로 다운로드

### 2.5 CSV 포맷 개선

기존 CSV 구조에 2개 섹션 추가:

```csv
=== 취약 음소 분석 ===
음소,표시명,취약 단어 수,전체 단어 수,취약률
æ,short a,5,20,25%
...

=== 주간 학습 통계 ===
주차,학습 시간(분),학습 횟수,학습 단어 수
3/3~3/9,45,5,12
...
```

### 2.6 Report Page UI 설계 (`report/page.tsx`)

#### 차트 섹션 추가 순서 (기존 레이아웃 내 삽입)

```
[Student Info Card]        ← 기존 유지
[취약 음소 BarChart]       ← 신규 (Recharts)
[주간 학습 LineChart]      ← 신규 (Recharts)
[유닛별 학습 현황]         ← 기존 유지
[최근 활동 기록]           ← 기존 유지
[Export Buttons]           ← CSV + PDF(jspdf 교체)
```

#### Recharts 컴포넌트 설계

**PhonemeWeaknessChart** (BarChart):
```tsx
// dynamic import로 번들 최적화
const RechartsBar = dynamic(() => import('./RechartsCharts').then(m => m.PhonemeWeaknessChart), { ssr: false });
```

- X축: displayLabel (e.g., "short a", "ch")
- Y축: weaknessRate (0~100%)
- 바 색상: rate >= 60 빨강, >= 30 주황, 나머지 초록
- 높이: 250px
- 반응형: `<ResponsiveContainer>`

**WeeklyStudyChart** (LineChart):
- X축: weekLabel
- Y축: totalMinutes (분)
- 보조 Y축: wordsLearned (단어 수)
- 라인 2개: 학습 시간 (파랑), 학습 단어 (초록)
- 높이: 200px

#### Export 버튼 변경

```tsx
// 기존: printReport() (window.print)
// 변경: generatePDF(report) (jspdf + html2canvas)
<button onClick={() => generatePDF(report)}>
    <FileDown /> PDF 다운로드
</button>
```

---

## 3. V2-7 상세 설계: L3/L4 커리큘럼

### 3.1 타입 확장 (`curriculum.ts`)

```typescript
// 변경 전
level: 'Prep' | 'CoreA' | 'CoreB';

// 변경 후
level: 'Prep' | 'CoreA' | 'CoreB' | 'L3' | 'L4';
```

### 3.2 데이터 파일 구조 (`src/data/l3l4Words.ts`)

```typescript
import type { UnitData, WordData } from './curriculum';

// curriculum.ts의 w() 함수와 동일한 헬퍼
function w(id: string, word: string, phonemes: string[], meaning: string,
    onset?: string, rime?: string, wordFamily?: string): WordData {
    return {
        id, word, phonemes, meaning,
        imagePath: `/assets/images/${id}.svg`,
        audioPath: `/assets/audio/${id}.mp3`,
        ...(onset && { onset }),
        ...(rime && { rime }),
        ...(wordFamily && { wordFamily }),
    };
}

export const l3Units: UnitData[] = [ /* unit_25 ~ unit_30 */ ];
export const l4Units: UnitData[] = [ /* unit_31 ~ unit_37 */ ];
export const l3l4MicroReadingKoMap: Record<string, string[]> = { /* unit_25~37 */ };
```

### 3.3 L3 유닛 상세 단어 목록

#### unit_25: l-blends (bl, cl, fl, gl, pl, sl) — 14단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| black | b,l,æ,k | 검은 | bl | ack | -ack |
| blade | b,l,eɪ,d | 칼날 | bl | ade | -ade |
| clap | k,l,æ,p | 박수치다 | cl | ap | -ap |
| class | k,l,æ,s | 수업 | cl | ass | -ass |
| flag | f,l,æ,g | 깃발 | fl | ag | -ag |
| flat | f,l,æ,t | 평평한 | fl | at | -at |
| flip | f,l,ɪ,p | 뒤집다 | fl | ip | -ip |
| glad | g,l,æ,d | 기쁜 | gl | ad | -ad |
| glow | g,l,oʊ | 빛나다 | gl | ow | -ow |
| plan | p,l,æ,n | 계획 | pl | an | -an |
| play | p,l,eɪ | 놀다 | pl | ay | -ay |
| slip | s,l,ɪ,p | 미끄러지다 | sl | ip | -ip |
| slow | s,l,oʊ | 느린 | sl | ow | -ow |
| sled | s,l,ɛ,d | 썰매 | sl | ed | -ed |

#### unit_26: r-blends (br, cr, dr, fr, gr, pr, tr) — 14단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| brick | b,r,ɪ,k | 벽돌 | br | ick | -ick |
| bring | b,r,ɪ,ŋ | 가져오다 | br | ing | -ing |
| crab | k,r,æ,b | 게 | cr | ab | -ab |
| crop | k,r,ɒ,p | 작물 | cr | op | -op |
| drip | d,r,ɪ,p | 물방울 | dr | ip | -ip |
| drum | d,r,ʌ,m | 북 | dr | um | -um |
| frog | f,r,ɒ,g | 개구리 | fr | og | -og |
| free | f,r,iː | 자유로운 | fr | ee | -ee |
| grin | g,r,ɪ,n | 씩 웃다 | gr | in | -in |
| grab | g,r,æ,b | 잡다 | gr | ab | -ab |
| trip | t,r,ɪ,p | 여행 | tr | ip | -ip |
| tree | t,r,iː | 나무 | tr | ee | -ee |
| pray | p,r,eɪ | 기도하다 | pr | ay | -ay |
| press | p,r,ɛ,s | 누르다 | pr | ess | -ess |

#### unit_27: s-blends (sm, sn, st, sw) — 12단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| smell | s,m,ɛ,l | 냄새 | sm | ell | -ell |
| smile | s,m,aɪ,l | 미소 | sm | ile | -ile |
| smoke | s,m,oʊ,k | 연기 | sm | oke | -oke |
| snap | s,n,æ,p | 딱 소리 | sn | ap | -ap |
| snail | s,n,eɪ,l | 달팽이 | sn | ail | -ail |
| snow | s,n,oʊ | 눈 | sn | ow | -ow |
| stop | s,t,ɒ,p | 멈추다 | st | op | -op |
| step | s,t,ɛ,p | 걸음 | st | ep | -ep |
| stem | s,t,ɛ,m | 줄기 | st | em | -em |
| swim | s,w,ɪ,m | 수영하다 | sw | im | -im |
| swing | s,w,ɪ,ŋ | 그네 | sw | ing | -ing |
| sweet | s,w,iː,t | 달콤한 | sw | eet | -eet |

#### unit_28: ch & sh — 14단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| chick | tʃ,ɪ,k | 병아리 | ch | ick | -ick |
| chest | tʃ,ɛ,s,t | 가슴 | ch | est | -est |
| chain | tʃ,eɪ,n | 사슬 | ch | ain | -ain |
| chalk | tʃ,ɔː,k | 분필 | ch | alk | -alk |
| check | tʃ,ɛ,k | 확인 | ch | eck | -eck |
| cheek | tʃ,iː,k | 볼 | ch | eek | -eek |
| chop | tʃ,ɒ,p | 자르다 | ch | op | -op |
| shell | ʃ,ɛ,l | 조개 | sh | ell | -ell |
| shed | ʃ,ɛ,d | 헛간 | sh | ed | -ed |
| shine | ʃ,aɪ,n | 빛나다 | sh | ine | -ine |
| shop | ʃ,ɒ,p | 가게 | sh | op | -op |
| shut | ʃ,ʌ,t | 닫다 | sh | ut | -ut |
| shade | ʃ,eɪ,d | 그늘 | sh | ade | -ade |
| shake | ʃ,eɪ,k | 흔들다 | sh | ake | -ake |

#### unit_29: th & wh — 13단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| thick | θ,ɪ,k | 두꺼운 | th | ick | -ick |
| thin | θ,ɪ,n | 얇은 | th | in | -in |
| think | θ,ɪ,ŋ,k | 생각하다 | th | ink | -ink |
| three | θ,r,iː | 셋 | th | ree | -ree |
| throne | θ,r,oʊ,n | 왕좌 | th | rone | -rone |
| this | ð,ɪ,s | 이것 | th | is | -is |
| that | ð,æ,t | 저것 | th | at | -at |
| whale | w,eɪ,l | 고래 | wh | ale | -ale |
| wheat | w,iː,t | 밀 | wh | eat | -eat |
| wheel | w,iː,l | 바퀴 | wh | eel | -eel |
| white | w,aɪ,t | 하얀 | wh | ite | -ite |
| whip | w,ɪ,p | 채찍 | wh | ip | -ip |
| whistle | w,ɪ,s,l | 호루라기 | wh | istle | -istle |

#### unit_30: ng & nk — 13단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| ring | r,ɪ,ŋ | 반지 | r | ing | -ing |
| sing | s,ɪ,ŋ | 노래하다 | s | ing | -ing |
| king | k,ɪ,ŋ | 왕 | k | ing | -ing |
| song | s,ɒ,ŋ | 노래 | s | ong | -ong |
| long | l,ɒ,ŋ | 긴 | l | ong | -ong |
| strong | s,t,r,ɒ,ŋ | 강한 | str | ong | -ong |
| hang | h,æ,ŋ | 걸다 | h | ang | -ang |
| bank | b,æ,ŋ,k | 은행 | b | ank | -ank |
| sink | s,ɪ,ŋ,k | 싱크대 | s | ink | -ink |
| drink | d,r,ɪ,ŋ,k | 마시다 | dr | ink | -ink |
| think | θ,ɪ,ŋ,k | 생각하다 | th | ink | -ink |
| trunk | t,r,ʌ,ŋ,k | 나무줄기 | tr | unk | -unk |
| skunk | s,k,ʌ,ŋ,k | 스컹크 | sk | unk | -unk |

### 3.4 L4 유닛 상세 단어 목록

#### unit_31: ea & ee — 13단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| beach | b,iː,tʃ | 해변 | b | each | -each |
| bean | b,iː,n | 콩 | b | ean | -ean |
| clean | k,l,iː,n | 깨끗한 | cl | ean | -ean |
| cream | k,r,iː,m | 크림 | cr | eam | -eam |
| dream | d,r,iː,m | 꿈 | dr | eam | -eam |
| leaf | l,iː,f | 잎 | l | eaf | -eaf |
| meal | m,iː,l | 식사 | m | eal | -eal |
| beef | b,iː,f | 쇠고기 | b | eef | -eef |
| creek | k,r,iː,k | 시냇물 | cr | eek | -eek |
| deer | d,ɪr | 사슴 | d | eer | -eer |
| fleet | f,l,iː,t | 함대 | fl | eet | -eet |
| greet | g,r,iː,t | 인사하다 | gr | eet | -eet |
| sheep | ʃ,iː,p | 양 | sh | eep | -eep |

#### unit_32: oa & ow (long o) — 13단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| boat | b,oʊ,t | 배 | b | oat | -oat |
| coat | k,oʊ,t | 코트 | c | oat | -oat |
| goat | g,oʊ,t | 염소 | g | oat | -oat |
| road | r,oʊ,d | 길 | r | oad | -oad |
| load | l,oʊ,d | 짐 | l | oad | -oad |
| soap | s,oʊ,p | 비누 | s | oap | -oap |
| toast | t,oʊ,s,t | 토스트 | t | oast | -oast |
| blow | b,l,oʊ | 불다 | bl | ow | -ow |
| crow | k,r,oʊ | 까마귀 | cr | ow | -ow |
| flow | f,l,oʊ | 흐르다 | fl | ow | -ow |
| grow | g,r,oʊ | 자라다 | gr | ow | -ow |
| show | ʃ,oʊ | 보여주다 | sh | ow | -ow |
| throw | θ,r,oʊ | 던지다 | thr | ow | -ow |

#### unit_33: ai & ay — 13단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| rain | r,eɪ,n | 비 | r | ain | -ain |
| train | t,r,eɪ,n | 기차 | tr | ain | -ain |
| brain | b,r,eɪ,n | 뇌 | br | ain | -ain |
| chain | tʃ,eɪ,n | 사슬 | ch | ain | -ain |
| snail | s,n,eɪ,l | 달팽이 | sn | ail | -ail |
| tail | t,eɪ,l | 꼬리 | t | ail | -ail |
| paint | p,eɪ,n,t | 페인트 | p | aint | -aint |
| wait | w,eɪ,t | 기다리다 | w | ait | -ait |
| day | d,eɪ | 날 | d | ay | -ay |
| play | p,l,eɪ | 놀다 | pl | ay | -ay |
| spray | s,p,r,eɪ | 뿌리다 | spr | ay | -ay |
| stay | s,t,eɪ | 머물다 | st | ay | -ay |
| clay | k,l,eɪ | 점토 | cl | ay | -ay |

#### unit_34: oi, oy, ou, ow (diphthongs) — 13단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| boil | b,ɔɪ,l | 끓이다 | b | oil | -oil |
| coin | k,ɔɪ,n | 동전 | c | oin | -oin |
| join | dʒ,ɔɪ,n | 합류하다 | j | oin | -oin |
| point | p,ɔɪ,n,t | 점 | p | oint | -oint |
| boy | b,ɔɪ | 소년 | b | oy | -oy |
| joy | dʒ,ɔɪ | 기쁨 | j | oy | -oy |
| toy | t,ɔɪ | 장난감 | t | oy | -oy |
| cloud | k,l,aʊ,d | 구름 | cl | oud | -oud |
| house | h,aʊ,s | 집 | h | ouse | -ouse |
| mouse | m,aʊ,s | 쥐 | m | ouse | -ouse |
| cow | k,aʊ | 소 | c | ow | -ow |
| town | t,aʊ,n | 마을 | t | own | -own |
| crown | k,r,aʊ,n | 왕관 | cr | own | -own |

#### unit_35: ar & or — 13단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| car | k,ɑːr | 자동차 | c | ar | -ar |
| far | f,ɑːr | 먼 | f | ar | -ar |
| star | s,t,ɑːr | 별 | st | ar | -ar |
| park | p,ɑːr,k | 공원 | p | ark | -ark |
| dark | d,ɑːr,k | 어두운 | d | ark | -ark |
| farm | f,ɑːr,m | 농장 | f | arm | -arm |
| card | k,ɑːr,d | 카드 | c | ard | -ard |
| corn | k,ɔːr,n | 옥수수 | c | orn | -orn |
| fork | f,ɔːr,k | 포크 | f | ork | -ork |
| horn | h,ɔːr,n | 뿔 | h | orn | -orn |
| port | p,ɔːr,t | 항구 | p | ort | -ort |
| sport | s,p,ɔːr,t | 스포츠 | sp | ort | -ort |
| storm | s,t,ɔːr,m | 폭풍 | st | orm | -orm |

#### unit_36: er, ir, ur — 12단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| fern | f,ɜːr,n | 고사리 | f | ern | -ern |
| herd | h,ɜːr,d | 떼 | h | erd | -erd |
| clerk | k,l,ɜːr,k | 점원 | cl | erk | -erk |
| bird | b,ɜːr,d | 새 | b | ird | -ird |
| girl | g,ɜːr,l | 소녀 | g | irl | -irl |
| first | f,ɜːr,s,t | 첫째 | f | irst | -irst |
| dirt | d,ɜːr,t | 흙 | d | irt | -irt |
| stir | s,t,ɜːr | 젓다 | st | ir | -ir |
| burn | b,ɜːr,n | 태우다 | b | urn | -urn |
| turn | t,ɜːr,n | 돌리다 | t | urn | -urn |
| nurse | n,ɜːr,s | 간호사 | n | urse | -urse |
| purse | p,ɜːr,s | 지갑 | p | urse | -urse |

#### unit_37: oo (short/long) — 13단어
| word | phonemes | meaning | onset | rime | wordFamily |
|------|----------|---------|-------|------|------------|
| book | b,ʊ,k | 책 | b | ook | -ook |
| cook | k,ʊ,k | 요리하다 | c | ook | -ook |
| hook | h,ʊ,k | 갈고리 | h | ook | -ook |
| look | l,ʊ,k | 보다 | l | ook | -ook |
| wood | w,ʊ,d | 나무 | w | ood | -ood |
| good | g,ʊ,d | 좋은 | g | ood | -ood |
| foot | f,ʊ,t | 발 | f | oot | -oot |
| moon | m,uː,n | 달 | m | oon | -oon |
| spoon | s,p,uː,n | 숟가락 | sp | oon | -oon |
| room | r,uː,m | 방 | r | oom | -oom |
| broom | b,r,uː,m | 빗자루 | br | oom | -oom |
| pool | p,uː,l | 수영장 | p | ool | -ool |
| cool | k,uː,l | 시원한 | c | ool | -ool |

### 3.5 microReading 및 한국어 번역

```typescript
// l3l4Words.ts에 포함
// 각 유닛 3문장씩

unit_25: ["A blue flag.", "Clap and play in the flat plan.", "The sled slid on the slow slope."]
unit_26: ["A frog on a brick.", "Bring the drum and trip!", "The crab grabs the free press."]
unit_27: ["Stop and smell the smoke.", "A snail on a stem in the snow.", "Swim and swing in the sweet sun."]
unit_28: ["A chick on the chest.", "Check the shell in the shed.", "She shakes the chain in the shade."]
unit_29: ["Three thin whales.", "Think about the white wheel.", "This thick wheat is on the throne."]
unit_30: ["The king can sing a song.", "A strong ring for the bank.", "Drink from the sink, skunk!"]
unit_31: ["A bean on the beach.", "Clean the cream dream.", "The sheep greet the deer by the creek."]
unit_32: ["A goat on a boat.", "Show the crow the road.", "Throw the soap and toast!"]
unit_33: ["Rain on the train.", "A snail's tail in the paint.", "Play and stay in the clay all day."]
unit_34: ["A boy with a coin.", "The cow joins the toy town.", "A cloud over the mouse house."]
unit_35: ["A car in the dark park.", "The star is far from the farm.", "A storm at the port with corn."]
unit_36: ["A bird on a fern.", "The girl stirs the dirt first.", "The nurse turns the purple purse."]
unit_37: ["A good book by the wood.", "The cook looks at the hook.", "A cool moon over the pool room."]
```

```typescript
// l3l4MicroReadingKoMap
unit_25: ["파란 깃발.", "박수치고 평평한 계획에서 놀아요.", "썰매가 느린 경사면을 미끄러졌어요."]
unit_26: ["벽돌 위의 개구리.", "북을 가져오고 여행해요!", "게가 자유로운 신문을 잡아요."]
unit_27: ["멈추고 연기 냄새를 맡아요.", "눈 속의 줄기 위에 달팽이.", "달콤한 햇빛 아래 수영하고 그네 타요."]
unit_28: ["가슴 위의 병아리.", "헛간에서 조개를 확인해요.", "그녀는 그늘에서 사슬을 흔들어요."]
unit_29: ["세 마리 얇은 고래.", "하얀 바퀴를 생각해 봐요.", "이 두꺼운 밀은 왕좌 위에 있어요."]
unit_30: ["왕이 노래를 불러요.", "은행을 위한 강한 반지.", "싱크대에서 마셔, 스컹크야!"]
unit_31: ["해변의 콩.", "깨끗한 크림 꿈.", "양이 시냇물 옆에서 사슴에게 인사해요."]
unit_32: ["배 위의 염소.", "까마귀에게 길을 보여줘요.", "비누와 토스트를 던져요!"]
unit_33: ["기차 위의 비.", "페인트 속 달팽이의 꼬리.", "하루 종일 점토에서 놀고 머물러요."]
unit_34: ["동전을 가진 소년.", "소가 장난감 마을에 합류해요.", "쥐 집 위의 구름."]
unit_35: ["어두운 공원의 자동차.", "별은 농장에서 멀어요.", "옥수수와 항구의 폭풍."]
unit_36: ["고사리 위의 새.", "소녀가 먼저 흙을 저어요.", "간호사가 보라색 지갑을 돌려요."]
unit_37: ["나무 옆의 좋은 책.", "요리사가 갈고리를 봐요.", "수영장 방 위의 시원한 달."]
```

### 3.6 유닛 색상 팔레트

| Unit | Color | Shadow | Emoji |
|------|-------|--------|-------|
| 25 l-blends | #5B8DEE | #3a6bc5 | /bl/ |
| 26 r-blends | #E8734A | #c0593a | /br/ |
| 27 s-blends | #4BC6B9 | #349e93 | /sn/ |
| 28 ch & sh | #FF6B9D | #cc5580 | /tʃ/ |
| 29 th & wh | #9B59B6 | #7d4792 | /θ/ |
| 30 ng & nk | #2ECC71 | #25a35b | /ŋ/ |
| 31 ea & ee | #1ABC9C | #149a80 | /iː/ |
| 32 oa & ow | #F39C12 | #c27d0e | /oʊ/ |
| 33 ai & ay | #E74C3C | #c0392b | /eɪ/ |
| 34 diphthongs | #8E44AD | #6f3587 | /ɔɪ/ |
| 35 ar & or | #D4A574 | #b08a5e | /ɑːr/ |
| 36 er/ir/ur | #7F8C8D | #637172 | /ɜːr/ |
| 37 oo | #3498DB | #2a7ab0 | /uː/ |

### 3.7 curriculum.ts 통합 패턴

```typescript
// curriculum.ts 맨 아래 변경

import { l3Units, l4Units, l3l4MicroReadingKoMap } from './l3l4Words';

// 기존 24유닛 배열 끝에 spread
export const curriculum: UnitData[] = [
    // ... 기존 unit_01 ~ unit_24 ...
    ...l3Units,
    ...l4Units,
];

// microReadingKoMap도 병합
export const microReadingKoMap: Record<string, string[]> = {
    // ... 기존 unit_01 ~ unit_24 ...
    ...l3l4MicroReadingKoMap,
};
```

### 3.8 중복 단어 ID 처리

L3/L4 단어 중 기존 유닛과 ID가 겹칠 수 있는 단어:
- `blade` (unit_23에 존재) → L3에서 `l3_blade`로 prefix
- `smile` (unit_23에 존재) → L3에서 `l3_smile`로 prefix
- `tree` (신규이나 안전을 위해 확인)

**규칙**: 기존 curriculum의 모든 word ID와 대조, 겹치면 `l3_` 또는 `l4_` prefix 추가.
검증 스크립트가 이를 자동 검출.

---

## 4. 검증 스크립트 설계 (`src/scripts/merge-l3l4.ts`)

```typescript
// 실행: npx tsx src/scripts/merge-l3l4.ts

import { curriculum } from '../data/curriculum';

function validate() {
    const allIds = new Set<string>();
    const duplicates: string[] = [];
    let totalWords = 0;

    for (const unit of curriculum) {
        for (const word of unit.words) {
            totalWords++;
            if (allIds.has(word.id)) {
                duplicates.push(`${word.id} (${unit.id})`);
            }
            allIds.add(word.id);

            // 필수 필드 검증
            if (!word.phonemes.length) console.warn(`Missing phonemes: ${word.id}`);
            if (!word.meaning) console.warn(`Missing meaning: ${word.id}`);
        }
    }

    // 유닛 번호 연속성
    const unitNumbers = curriculum.map(u => u.unitNumber).sort((a,b) => a-b);
    for (let i = 1; i < unitNumbers.length; i++) {
        if (unitNumbers[i] !== unitNumbers[i-1] + 1) {
            console.warn(`Gap in unit numbers: ${unitNumbers[i-1]} → ${unitNumbers[i]}`);
        }
    }

    console.log(`Total units: ${curriculum.length}`);
    console.log(`Total words: ${totalWords}`);
    console.log(`Duplicates: ${duplicates.length ? duplicates.join(', ') : 'None'}`);
    console.log(`L3 units: ${curriculum.filter(u => u.level === 'L3').length}`);
    console.log(`L4 units: ${curriculum.filter(u => u.level === 'L4').length}`);
}

validate();
```

---

## 5. 구현 순서 (Implementation Order)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| 1 | npm install recharts jspdf html2canvas | package.json | - |
| 2 | L3/L4 단어 데이터 파일 작성 | src/data/l3l4Words.ts | - |
| 3 | curriculum.ts level 타입 확장 + import | src/data/curriculum.ts | #2 |
| 4 | 검증 스크립트 작성 & 실행 | src/scripts/merge-l3l4.ts | #3 |
| 5 | exportReport.ts 인터페이스 확장 | src/lib/exportReport.ts | - |
| 6 | analyzePhonemeWeakness() 구현 | src/lib/exportReport.ts | #5 |
| 7 | calculateWeeklyStats() 구현 | src/lib/exportReport.ts | #5 |
| 8 | generatePDF() 구현 | src/lib/exportReport.ts | #1 |
| 9 | CSV generateCSV() 개선 | src/lib/exportReport.ts | #5 |
| 10 | gatherReportData() 확장 | src/lib/exportReport.ts | #6,#7 |
| 11 | report/page.tsx 차트 추가 | src/app/report/page.tsx | #1,#10 |
| 12 | report/page.tsx PDF 버튼 교체 | src/app/report/page.tsx | #8 |
| 13 | npm run build 검증 | - | ALL |

---

## 6. Gap 분석 체크리스트

Design 완료 후 Check 단계에서 검증할 항목:

- [ ] `l3l4Words.ts`에 L3 6유닛 + L4 7유닛 존재
- [ ] 각 유닛 단어 수: L3 ~80, L4 ~90 (합계 ~170)
- [ ] 모든 단어에 phonemes, meaning, onset, rime 존재
- [ ] curriculum.ts level 타입에 'L3' | 'L4' 포함
- [ ] 중복 word ID 없음
- [ ] PhonemeWeakness 분석 함수 존재 + 정상 동작
- [ ] WeeklyStats 계산 함수 존재
- [ ] Recharts BarChart/LineChart 렌더링
- [ ] jspdf PDF 다운로드 동작
- [ ] CSV에 음소/주간 섹션 포함
- [ ] 수정 금지 파일 미변경
- [ ] `npm run build` 통과
