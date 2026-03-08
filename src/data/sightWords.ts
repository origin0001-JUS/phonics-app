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
