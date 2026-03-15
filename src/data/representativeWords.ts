/** 유닛별 립싱크 영상이 있는 대표 단어 (총 92개) */
export const representativeWords: Record<string, string[]> = {
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
    'unit_25': ['black', 'clap', 'flag', 'sled'],
    'unit_26': ['brush', 'crab', 'drum', 'frog'],
    'unit_27': ['swim', 'snap', 'step', 'snow'],
    'unit_28': ['chip', 'ship', 'chop', 'shop'],
    'unit_29': ['thin', 'this', 'whale', 'whip'],
    'unit_30': ['ring', 'sing', 'bank', 'pink'],
    'unit_31': ['bee', 'tree', 'meat', 'seed'],
    'unit_32': ['boat', 'coat', 'snow', 'bowl'],
    'unit_33': ['rain', 'train', 'play', 'gray'],
    'unit_34': ['boy', 'coin', 'cow', 'house'],
    'unit_35': ['car', 'star', 'corn', 'fork'],
    'unit_36': ['bird', 'girl', 'nurse', 'burn'],
    'unit_37': ['book', 'moon', 'spoon', 'food'],
};

const allVideoWords = new Set(
    Object.values(representativeWords).flat()
);

export function hasLipSyncVideo(word: string): boolean {
    return allVideoWords.has(word.toLowerCase());
}

export function getLipSyncVideoPath(word: string): string | null {
    if (hasLipSyncVideo(word)) {
        return `/assets/video/${word.toLowerCase()}.mp4`;
    }
    return null;
}

export function getSoundFocusVideoPath(unitId: string): string | null {
    const words = representativeWords[unitId];
    if (words && words.length > 0) {
        return `/assets/video/${words[0].toLowerCase()}.mp4`;
    }
    return null;
}
