# 추가 구현 가이드 (6개 통합본)
# ChatGPT 제안에서 추출한 추가 활용 아이디어를 코드로 구현

---

## 프롬프트 (이 파일과 함께 Antigravity에 던져주세요)

```
이 프로젝트에 첨부한 MD 파일의 구현 1~6을 모두 적용해줘.

1. src/data/sentenceFrames.ts 신규 생성 — 22개 Sentence Frame + generateSentenceFromFrame() 함수
2. types/index.ts의 Word 인터페이스에 textbookTags?, isSightWord?, sightWordNote? 필드 추가
3. lib/srs.ts에 getReviewPriority() 함수 추가 — 교과서 태그 단어 복습 우선순위 +0.5
4. src/data/sightWords.ts 신규 생성 — 레벨별 Sight Words 27개 + getSightWordsByLevel(), isSightWord() 함수
5. scripts/generate-vocab-csv.ts 신규 생성 — 전체 단어 데이터를 vocab_master.csv로 내보내기
6. src/data/decodableReaders.ts 신규 생성 — 유닛별 디코더블 스토리 템플릿 8개 + generateStoryPrompt() 함수

각 구현의 상세 코드는 아래 MD 파일 내용을 그대로 따라줘.
```

---

## 구현 1: Sentence Frame DB

### 목적
교과서 3~4학년 표현을 "프레임(틀)+슬롯(빈칸)"으로 분리하여 DB화.
SentenceFillBlank 게임에서 동일 프레임으로 수십 개 연습 문장을 자동 생성.

### 파일: `src/data/sentenceFrames.ts` (신규 생성)

```typescript
export interface SentenceFrame {
    id: string;
    function: string;
    frame: string;
    slotType: 'noun' | 'verb' | 'adjective' | 'any';
    slotConstraints?: string[];
    grade: '3' | '4' | 'both';
    textbookSource: string[];
}

export const sentenceFrames: SentenceFrame[] = [
    // ─── 3학년 공통 ───
    { id: 'sf_01', function: '사물 묻기', frame: "What's this? It's a ___.", slotType: 'noun', grade: '3', textbookSource: ['3-대교-L2', '3-YBM-L3'] },
    { id: 'sf_02', function: '교실 지시', frame: "___, please.", slotType: 'verb', grade: '3', textbookSource: ['3-대교-L3', '3-YBM-L2'] },
    { id: 'sf_03', function: '수량 묻기', frame: "How many ___?", slotType: 'noun', grade: '3', textbookSource: ['3-대교-L4', '3-YBM-L5'] },
    { id: 'sf_04', function: '선호 표현', frame: "I like ___.", slotType: 'noun', grade: '3', textbookSource: ['3-대교-L5', '3-YBM-L4'] },
    { id: 'sf_05', function: '색깔 묻기', frame: "What color is it? It's ___.", slotType: 'adjective', grade: '3', textbookSource: ['3-대교-L6', '3-YBM-L7'] },
    { id: 'sf_06', function: '동물/사물 확인', frame: "Is it a ___? Yes, it is. / No, it isn't.", slotType: 'noun', grade: '3', textbookSource: ['3-대교-L7'] },
    { id: 'sf_07', function: '소지 여부', frame: "Do you have a ___? Yes, I do. / No, I don't.", slotType: 'noun', grade: '3', textbookSource: ['3-대교-L8', '3-YBM-L8'] },
    { id: 'sf_08', function: '능력', frame: "Can you ___? Yes, I can. / No, I can't.", slotType: 'verb', grade: '3', textbookSource: ['3-대교-L9', '3-YBM-L6'] },
    { id: 'sf_09', function: '가족 소개', frame: "She's my ___. / He's my ___.", slotType: 'noun', grade: '3', textbookSource: ['3-대교-L10', '3-YBM-L10'] },
    { id: 'sf_10', function: '날씨', frame: "It's ___.", slotType: 'adjective', grade: '3', textbookSource: ['3-대교-L11', '3-YBM-L11'] },
    { id: 'sf_11', function: '나이', frame: "How old are you? I'm ___.", slotType: 'any', grade: '3', textbookSource: ['3-YBM-L9'] },

    // ─── 4학년 공통 ───
    { id: 'sf_12', function: '자기소개', frame: "My name is ___.", slotType: 'noun', grade: '4', textbookSource: ['4-대교-L1'] },
    { id: 'sf_13', function: '친구소개', frame: "This is my ___.", slotType: 'noun', grade: '4', textbookSource: ['4-대교-L2'] },
    { id: 'sf_14', function: '감정', frame: "Are you ___? Yes, I am.", slotType: 'adjective', grade: '4', textbookSource: ['4-대교-L3', '4-YBM-L4'] },
    { id: 'sf_15', function: '제안', frame: "Let's ___.", slotType: 'verb', grade: '4', textbookSource: ['4-대교-L4', '4-YBM-L2'] },
    { id: 'sf_16', function: '금지', frame: "Don't ___!", slotType: 'verb', grade: '4', textbookSource: ['4-대교-L5', '4-YBM-L5'] },
    { id: 'sf_17', function: '시간', frame: "What time is it? It's ___ o'clock.", slotType: 'any', grade: '4', textbookSource: ['4-대교-L6', '4-YBM-L7'] },
    { id: 'sf_18', function: '위치', frame: "Where is ___? It's on/in/under the ___.", slotType: 'noun', grade: '4', textbookSource: ['4-대교-L7', '4-YBM-L3'] },
    { id: 'sf_19', function: '요일', frame: "What day is it? It's ___.", slotType: 'noun', grade: '4', textbookSource: ['4-대교-L8', '4-YBM-L9'] },
    { id: 'sf_20', function: '소유', frame: "Is this your ___?", slotType: 'noun', grade: '4', textbookSource: ['4-대교-L9', '4-YBM-L6'] },
    { id: 'sf_21', function: '현재진행', frame: "What are you doing? I'm ___ing.", slotType: 'verb', grade: '4', textbookSource: ['4-대교-L10', '4-YBM-L8'] },
    { id: 'sf_22', function: '가격', frame: "How much is it? It's ___.", slotType: 'any', grade: '4', textbookSource: ['4-대교-L11', '4-YBM-L11'] },
];

export function generateSentenceFromFrame(frame: SentenceFrame, wordPool: string[]): string {
    const slot = wordPool[Math.floor(Math.random() * wordPool.length)];
    return frame.frame.replace('___', slot);
}
```

---

## 구현 2: Word 타입에 교과서 태그 + Sight Word 플래그 추가

### 목적
단어에 교과서 출처 태그와 Sight Word 여부를 추가하여 교과서 연계 마케팅 수치화 + 불규칙 단어 별도 학습 경로 지원.

### 파일: `types/index.ts` (기존 Word 인터페이스에 필드 추가)

```typescript
export interface Word {
    // ... 기존 필드 유지 ...
    textbookTags?: string[];   // NEW: ['3-대교', '3-YBM', '4-대교'] 등
    isSightWord?: boolean;     // NEW: 파닉스 규칙으로 디코딩 불가능한 단어
    sightWordNote?: string;    // NEW: "th는 /ð/로 발음" 등 불규칙 설명
}
```

### 활용
- `textbookTags`가 있는 단어 수를 세면 → "교과서 핵심 어휘 85% 탑재" 마케팅 수치
- `isSightWord === true`인 단어는 BlendingSlider를 건너뛰고 "통째로 기억하기" 모드로 분기

---

## 구현 3: SRS 교과서 가중치

### 목적
교과서에 나오는 단어의 복습 우선순위를 높여서 학교 시험/단원평가 직전 체감효과 극대화.

### 파일: `lib/srs.ts` (함수 추가)

```typescript
import type { Word, VocabCard } from '@/types';

/**
 * 복습 우선순위 계산.
 * 교과서 태그 단어는 가중치를 더해 복습 페이지에서 먼저 노출.
 */
export function getReviewPriority(card: VocabCard, word?: Word): number {
    let priority = 0;

    // 기본: due 날짜 초과 일수
    const now = new Date();
    const due = new Date(card.due);
    const daysOverdue = Math.max(0, (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    priority += daysOverdue;

    // 교과서 가중치
    if (word?.textbookTags && word.textbookTags.length > 0) {
        priority += 0.5;
        if (word.textbookTags.length >= 2) {
            priority += 0.3; // 교과서 2종 이상 공통 등장 시 추가
        }
    }

    return priority;
}
```

---

## 구현 4: Sight Words 목록

### 목적
파닉스 규칙으로 읽을 수 없는 고빈도 불규칙 단어를 별도 카테고리로 분리.

### 파일: `src/data/sightWords.ts` (신규 생성)

```typescript
export interface SightWordEntry {
    word: string;
    note: string;
    level: string;
    frequency: 'high' | 'medium';
}

export const sightWords: SightWordEntry[] = [
    // ─── L0 ───
    { word: 'the', note: 'th는 /ð/, e는 약하게 /ə/', level: 'L0', frequency: 'high' },
    { word: 'a', note: '관사, 약하게 /ə/', level: 'L0', frequency: 'high' },
    { word: 'is', note: 's가 /z/로 발음', level: 'L0', frequency: 'high' },
    { word: 'it', note: '규칙적이지만 매우 고빈도', level: 'L0', frequency: 'high' },
    { word: 'in', note: '규칙적이지만 매우 고빈도', level: 'L0', frequency: 'high' },
    { word: 'on', note: '규칙적이지만 매우 고빈도', level: 'L0', frequency: 'high' },
    { word: 'and', note: '규칙적이지만 매우 고빈도', level: 'L0', frequency: 'high' },

    // ─── L1 ───
    { word: 'I', note: '대문자만, /aɪ/ (파닉스 예외)', level: 'L1', frequency: 'high' },
    { word: 'my', note: 'y가 /aɪ/로 발음', level: 'L1', frequency: 'high' },
    { word: 'you', note: 'ou가 /uː/로 발음', level: 'L1', frequency: 'high' },
    { word: 'he', note: 'e가 /iː/ (Magic e 아닌데 장모음)', level: 'L1', frequency: 'high' },
    { word: 'she', note: 'sh + e(/iː/)', level: 'L1', frequency: 'high' },
    { word: 'we', note: 'e가 /iː/', level: 'L1', frequency: 'medium' },
    { word: 'are', note: 'a가 /ɑːr/', level: 'L1', frequency: 'high' },
    { word: 'was', note: 'a가 /ɒ/ (규칙 예외)', level: 'L1', frequency: 'high' },
    { word: 'do', note: 'o가 /uː/', level: 'L1', frequency: 'high' },
    { word: 'to', note: 'o가 /uː/', level: 'L1', frequency: 'high' },
    { word: 'no', note: 'o가 /oʊ/', level: 'L1', frequency: 'high' },
    { word: 'go', note: 'o가 /oʊ/', level: 'L1', frequency: 'high' },
    { word: 'said', note: 'ai가 /ɛ/ (매우 불규칙)', level: 'L1', frequency: 'medium' },
    { word: 'have', note: 'a_e인데 /æ/ 유지 (Magic e 예외)', level: 'L1', frequency: 'high' },

    // ─── L2 ───
    { word: 'come', note: 'o가 /ʌ/ (Magic e 예외)', level: 'L2', frequency: 'medium' },
    { word: 'some', note: 'o가 /ʌ/ (Magic e 예외)', level: 'L2', frequency: 'medium' },
    { word: 'one', note: 'o가 /wʌ/ (매우 불규칙)', level: 'L2', frequency: 'high' },
    { word: 'two', note: 'w 묵음, o가 /uː/', level: 'L2', frequency: 'high' },
    { word: 'what', note: 'wh + a가 /ɒ/', level: 'L2', frequency: 'high' },
    { word: 'there', note: 'th + ere가 /ɛr/', level: 'L2', frequency: 'medium' },
    { word: 'they', note: 'th + ey가 /eɪ/', level: 'L2', frequency: 'medium' },
];

export function getSightWordsByLevel(level: string): SightWordEntry[] {
    return sightWords.filter(sw => sw.level === level);
}

export function isSightWord(word: string): boolean {
    return sightWords.some(sw => sw.word.toLowerCase() === word.toLowerCase());
}
```

---

## 구현 5: vocab_master.csv 생성 스크립트

### 목적
전체 단어 데이터를 CSV로 내보내어 교재 출처 추적, 커버리지 분석, 데이터 관리에 활용.

### 파일: `scripts/generate-vocab-csv.ts` (신규 생성)

```typescript
// 실행: npx tsx scripts/generate-vocab-csv.ts

import { getAllWords } from '../src/data/curriculum';
import * as fs from 'fs';

const words = getAllWords();

const header = 'word,phonemes,meaning,level,word_family,textbook_tags,sight_word,onset,rime,image_path,audio_path';

const rows = words.map(w => {
    const phonemes = w.phonemes.join('-');
    const textbookTags = (w as any).textbookTags?.join(';') || '';
    const sight = (w as any).isSightWord ? 'Y' : 'N';
    const onset = (w as any).onset || '';
    const rime = (w as any).rime || '';
    const wordFamily = w.wordFamily || '';

    return [
        w.word, phonemes, `"${w.meaning}"`, w.level, wordFamily,
        textbookTags, sight, onset, rime, w.imagePath, w.audioPath
    ].join(',');
});

const csv = [header, ...rows].join('\n');
fs.writeFileSync('vocab_master.csv', csv, 'utf-8');

console.log(`✅ vocab_master.csv 생성 완료 (${rows.length}개 단어)`);
```

---

## 구현 6: DecodableReaderTemplate (V2 스토리 자동생성)

### 목적
V2 스토리 읽기 모드에서, 유닛별로 "배운 패턴 + sight words만 사용한 3막 구조 스토리"를 AI로 자동 생성할 수 있는 템플릿.

### 파일: `src/data/decodableReaders.ts` (신규 생성)

```typescript
export interface DecodableReaderTemplate {
    unitId: string;
    readerLength: number;
    allowedPatterns: string[];
    sightWordsAllowed: string[];
    storyBeats: {
        setup: string;
        conflict: string;
        resolution: string;
    };
}

export const decodableReaderTemplates: DecodableReaderTemplate[] = [
    {
        unitId: 'L1_U1', readerLength: 7,
        allowedPatterns: ['-at', '-an', '-ap', '-am'],
        sightWordsAllowed: ['a', 'the', 'is', 'on', 'and', 'it'],
        storyBeats: { setup: '주인공(cat/man)이 어딘가에 있는 상황', conflict: '물건(hat/map)을 잃어버리거나 새 동물(rat)을 만남', resolution: '찾거나 친구가 됨' },
    },
    {
        unitId: 'L1_U2', readerLength: 6,
        allowedPatterns: ['-it', '-ig', '-in', '-ip'],
        sightWordsAllowed: ['a', 'the', 'is', 'and', 'it', 'in'],
        storyBeats: { setup: '주인공(pig/kid)이 무언가를 하고 있음', conflict: '구덩이에 빠지거나 큰 것 발견', resolution: '도움을 받거나 스스로 해결' },
    },
    {
        unitId: 'L1_U3', readerLength: 6,
        allowedPatterns: ['-ot', '-og', '-op', '-ox'],
        sightWordsAllowed: ['a', 'the', 'is', 'on', 'and', 'it', 'not'],
        storyBeats: { setup: '동물(dog/fox)이 밖에 나옴', conflict: '뜨거운(hot) 것을 발견하거나 높은(top) 곳에 올라감', resolution: '안전하게 돌아옴' },
    },
    {
        unitId: 'L1_U4', readerLength: 6,
        allowedPatterns: ['-ut', '-ug', '-un', '-ub'],
        sightWordsAllowed: ['a', 'the', 'is', 'in', 'and', 'it'],
        storyBeats: { setup: '벌레(bug)나 강아지(pup)가 놀고 있음', conflict: '해(sun) 아래서 뛰다가(run) 더위', resolution: '물을 마시거나 그늘에서 쉼' },
    },
    {
        unitId: 'L1_U5', readerLength: 6,
        allowedPatterns: ['-et', '-en', '-ed', '-eg'],
        sightWordsAllowed: ['a', 'the', 'is', 'in', 'and', 'it', 'on'],
        storyBeats: { setup: '닭(hen)이 빨간(red) 뭔가를 발견', conflict: '그물(net)에 걸리거나 비에 젖음(wet)', resolution: '친구들(men)이 도와줌' },
    },
    {
        unitId: 'L2_U1', readerLength: 7,
        allowedPatterns: ['-ake', '-ame', '-ate', '-ave', '-ape'],
        sightWordsAllowed: ['a', 'the', 'is', 'to', 'and', 'I', 'my', 'she', 'he'],
        storyBeats: { setup: 'Kate가 케이크(cake)를 만들거나 호수(lake)에 감', conflict: '늦게(late) 도착하거나 동굴(cave) 발견', resolution: '경주(race)에서 이기거나 파티를 즐김' },
    },
    {
        unitId: 'L2_U2', readerLength: 7,
        allowedPatterns: ['-ike', '-ine', '-ite', '-ive', '-ide'],
        sightWordsAllowed: ['a', 'the', 'is', 'to', 'and', 'I', 'my', 'in'],
        storyBeats: { setup: 'Mike가 자전거(bike)를 타거나 연(kite)을 날림', conflict: '길을 잃거나(hide) 시간 부족(time)', resolution: '멋진 경험(dive/ride)' },
    },
    {
        unitId: 'L2_U3', readerLength: 7,
        allowedPatterns: ['-one', '-ose', '-ole', '-ome', '-ope', '-ube', '-ute'],
        sightWordsAllowed: ['a', 'the', 'is', 'to', 'and', 'I', 'my', 'he', 'she'],
        storyBeats: { setup: '집(home)에서 뼈(bone) 발견 또는 장미(rose)를 봄', conflict: '구멍(hole)에 빠지거나 밧줄(rope) 필요', resolution: '전화(phone)로 도움 또는 귀여운(cute) 동물 만남' },
    },
];

export function generateStoryPrompt(template: DecodableReaderTemplate): string {
    return `
다음 규칙에 따라 ${template.readerLength}문장짜리 영어 스토리를 만들어줘:

허용 단어 패턴: ${template.allowedPatterns.join(', ')}
허용 Sight Words: ${template.sightWordsAllowed.join(', ')}
위 패턴과 sight words에 해당하는 단어만 사용해. 다른 단어는 절대 사용하지 마.

스토리 구조:
- 1막 (${template.storyBeats.setup}): 1~2문장
- 2막 (${template.storyBeats.conflict}): 2~3문장
- 3막 (${template.storyBeats.resolution}): 1~2문장

문장은 짧고 단순하게. 아이가 혼자 읽을 수 있는 수준으로.
    `.trim();
}
```
