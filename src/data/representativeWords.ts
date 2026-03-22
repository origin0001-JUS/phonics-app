/**
 * 유닛별 립싱크 영상이 있는 대표 단어 + Sound Focus 전용 영상
 *
 * 총 영상 수:
 *   L1~L2 대표 단어: 13유닛 × 4개 = 52개
 *   L3 대표 단어:     6유닛 × 4개 = 24개
 *   L4 대표 단어:     7유닛 × 4개 = 28개
 *   Sound Focus 소리 소개:         = 15개
 *   중복 제거 후:                 ≈ 109개
 */

// ─── 유닛별 대표 단어 ───

export const representativeWords: Record<string, string[]> = {
    // L1~L2 (기존)
    'unit_01': ['cat', 'man', 'map', 'hat'],
    'unit_02': ['bed', 'hen', 'net', 'red'],
    'unit_03': ['pig', 'sit', 'pin', 'big'],
    'unit_04': ['dog', 'hot', 'fox', 'hop'],
    'unit_05': ['bug', 'cup', 'sun', 'run'],
    'unit_07': ['cake', 'name', 'lake', 'face'],
    'unit_08': ['bike', 'kite', 'nine', 'ride'],
    'unit_09': ['bone', 'nose', 'home', 'phone'],
    'unit_10': ['cube', 'cute', 'tune', 'flute'],
    'unit_11': ['bee', 'tree', 'sea', 'read'],
    'unit_13': ['black', 'clap', 'flag', 'blue'],
    'unit_17': ['ship', 'shop', 'chin', 'chop'],
    'unit_19': ['thin', 'this', 'whale', 'when'],
    // L3: 자음군·이중자음
    'unit_25': ['black', 'clap', 'flag', 'sled'],
    'unit_26': ['brush', 'crab', 'drum', 'frog'],
    'unit_27': ['swim', 'snap', 'step', 'snow'],
    'unit_28': ['chip', 'ship', 'chop', 'shop'],
    'unit_29': ['thin', 'this', 'whale', 'whip'],
    'unit_30': ['ring', 'sing', 'bank', 'pink'],
    // L4: 이중모음·R통제모음
    'unit_31': ['bee', 'tree', 'meat', 'seed'],
    'unit_32': ['boat', 'coat', 'snow', 'bowl'],
    'unit_33': ['rain', 'train', 'play', 'gray'],
    'unit_34': ['boy', 'coin', 'cow', 'house'],
    'unit_35': ['car', 'star', 'corn', 'fork'],
    'unit_36': ['bird', 'girl', 'nurse', 'burn'],
    'unit_37': ['book', 'moon', 'spoon', 'food'],
};

// ─── Sound Focus 전용 영상 (개별 소리 소개) ───

export interface SoundFocusEntry {
    id: string;
    /** TTS 스크립트 (ElevenLabs에 넣을 텍스트) */
    script: string;
    /** 대표 음소 기호 */
    phoneme: string;
    /** 대응 유닛 ID들 */
    unitIds: string[];
}

export const soundFocusEntries: SoundFocusEntry[] = [
    { id: 'sound_01', script: 'The sound ah, as in cat',          phoneme: 'æ',   unitIds: ['unit_01'] },
    { id: 'sound_02', script: 'The sound eh, as in bed',          phoneme: 'ɛ',   unitIds: ['unit_02'] },
    { id: 'sound_03', script: 'The sound ih, as in sit',          phoneme: 'ɪ',   unitIds: ['unit_03'] },
    { id: 'sound_04', script: 'The sound oh, as in hot',          phoneme: 'ɒ',   unitIds: ['unit_04'] },
    { id: 'sound_05', script: 'The sound uh, as in cup',          phoneme: 'ʌ',   unitIds: ['unit_05'] },
    { id: 'sound_06', script: 'The sound ay, as in cake',         phoneme: 'eɪ',  unitIds: ['unit_07'] },
    { id: 'sound_07', script: 'The sound eye, as in bike',        phoneme: 'aɪ',  unitIds: ['unit_08'] },
    { id: 'sound_08', script: 'The sound oh, as in bone',         phoneme: 'oʊ',  unitIds: ['unit_09'] },
    { id: 'sound_09', script: 'The sound sh, as in ship',         phoneme: 'ʃ',   unitIds: ['unit_17', 'unit_28'] },
    { id: 'sound_10', script: 'The sound th, as in thin',         phoneme: 'θ',   unitIds: ['unit_19', 'unit_29'] },
    { id: 'sound_11', script: 'The sound ch, as in chip',         phoneme: 'tʃ',  unitIds: ['unit_17', 'unit_28'] },
    { id: 'sound_12', script: 'L blends: bl, cl, fl',             phoneme: 'l',   unitIds: ['unit_13', 'unit_25'] },
    { id: 'sound_13', script: 'R blends: br, cr, dr',             phoneme: 'r',   unitIds: ['unit_26'] },
    { id: 'sound_14', script: 'The sound ee, as in bee',          phoneme: 'iː',  unitIds: ['unit_11', 'unit_31'] },
    { id: 'sound_15', script: 'R controlled: ar, as in car',      phoneme: 'ɑːr', unitIds: ['unit_35'] },
];

// ─── 유틸리티 함수 ───

/** 중복 제거된 전체 대표 단어 Set */
export const allVideoWords = new Set(
    Object.values(representativeWords).flat()
);

/** 단어에 대한 립싱크 영상이 존재하는지 */
export function hasLipSyncVideo(word: string): boolean {
    return allVideoWords.has(word.toLowerCase());
}

/** 단어 립싱크 영상 경로 */
export function getLipSyncVideoPath(word: string): string | null {
    if (hasLipSyncVideo(word)) {
        return `/assets/video/${word.toLowerCase()}.mp4`;
    }
    return null;
}

/** Sound Focus 전용 영상 경로 (유닛 ID → sound_XX.mp4)
 *  ⚠️ Sound Focus 영상은 아직 미생성 상태 — 생성 완료 후 아래 주석 해제
 */
export function getSoundFocusVideoPath(unitId: string): string | null {
    // TODO: Sound Focus 영상 파일이 실제로 생성된 후 아래 코드 활성화
    // const entry = soundFocusEntries.find(e => e.unitIds.includes(unitId));
    // if (entry) {
    //     return `/assets/video/${entry.id}.mp4`;
    // }
    return null;
}

/** Sound Focus 엔트리 가져오기 */
export function getSoundFocusEntry(unitId: string): SoundFocusEntry | undefined {
    return soundFocusEntries.find(e => e.unitIds.includes(unitId));
}

/** 전체 영상 수 (대표 단어 + Sound Focus) */
export function getTotalVideoCount(): { words: number; sounds: number; total: number } {
    const words = allVideoWords.size;
    const sounds = soundFocusEntries.length;
    return { words, sounds, total: words + sounds };
}
