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
