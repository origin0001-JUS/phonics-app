/**
 * 발음 참조 사진 & 시각 가이드 데이터
 *
 * 목적: MouthVisualizer에서 음소별 실사/일러스트 참조 사진을 보여주고,
 *       한국 학생이 특히 어려워하는 발음에 대한 시각적 핵심 포인트를 제공
 *
 * 역할 분담 (visemeMap.ts와 중복 방지):
 *   - visemeMap.ts > tipKo: "어떻게 소리내는지" (동작 설명)
 *   - pronunciationGuide.ts: "무엇을 눈으로 봐야 하는지" (시각 참조 + 비교)
 *
 * 참고 자료:
 *   - Rachel's English (rachelsenglish.com/mouth-position-study)
 *   - This Reading Mama: short e vs short i 구분법
 *   - Pronunciation Studio: Korean speakers error catalogue
 *   - BoldVoice: English pronunciation for Korean speakers
 */

// ─── 난이도 레벨 (한국어 화자 기준) ───
export type Difficulty = 'easy' | 'moderate' | 'hard' | 'very_hard';

export interface PronunciationRef {
    /** 음소 기호 (visemeMap의 키와 동일) */
    phoneme: string;
    /** 참조 사진 경로 (public/assets/images/pronunciation/) */
    imagePath: string;
    /** 사진 유형: front(정면 입모양), side(측면 단면), comparison(비교 사진) */
    imageType: 'front' | 'side' | 'comparison';
    /** 시각적으로 주목할 핵심 포인트 (짧고 직관적) */
    visualKey: string;
    /** 한국어 화자가 흔히 하는 실수 */
    commonMistake?: string;
    /** 비교 대상 음소 (예: th → s/d, f → p) */
    confusedWith?: string[];
    /** 구별 팁 (한국어) — visemeMap의 tipKo와 중복하지 않는 "눈으로 구별하는 법" */
    visualTip: string;
    /** 한국 학생 난이도 */
    difficulty: Difficulty;
    /** 관련 예시 단어 */
    exampleWords: string[];
}

// ─── 한국 학생 난이도별 전체 발음 참조 데이터 ───
export const pronunciationGuide: PronunciationRef[] = [

    // ============================================================
    // 🔴 VERY HARD — 한국어에 아예 없는 소리
    // ============================================================

    // th (voiceless) — /θ/
    {
        phoneme: 'θ',
        imagePath: '/assets/images/pronunciation/th_voiceless.svg',
        imageType: 'front',
        visualKey: '혀끝이 윗니-아랫니 사이로 보여요',
        commonMistake: 'ㅅ(s) 또는 ㅌ(t)으로 대체 → "think"를 "sink"이나 "tink"으로 발음',
        confusedWith: ['s', 't'],
        visualTip: '거울로 확인! 혀끝이 치아 사이로 살짝 나와 보여야 해요. s/t는 혀가 안 보여요.',
        difficulty: 'very_hard',
        exampleWords: ['thin', 'think', 'three', 'bath'],
    },

    // th (voiced) — /ð/
    {
        phoneme: 'ð',
        imagePath: '/assets/images/pronunciation/th_voiced.svg',
        imageType: 'front',
        visualKey: '혀끝이 치아 사이 + 목이 울려요',
        commonMistake: 'ㄷ(d)으로 대체 → "this"를 "dis"로 발음',
        confusedWith: ['d', 'z'],
        visualTip: '입 모양은 /θ/와 같아요. 목에 손을 대보면 진동이 느껴지면 /ð/!',
        difficulty: 'very_hard',
        exampleWords: ['this', 'that', 'the', 'mother'],
    },

    // r — /r/
    {
        phoneme: 'r',
        imagePath: '/assets/images/pronunciation/r_sound.svg',
        imageType: 'comparison',
        visualKey: '입술이 살짝 둥글게 + 혀가 아무데도 안 닿아요',
        commonMistake: 'ㄹ(l)과 구별 못함 → "right"와 "light" 같게 발음',
        confusedWith: ['l'],
        visualTip: 'r: 입술 둥글고 혀는 뒤로 말려서 공중에 떠있어요\nl: 입술 평평하고 혀끝이 잇몸에 딱 붙어요',
        difficulty: 'very_hard',
        exampleWords: ['red', 'run', 'rain', 'right'],
    },

    // l — /l/
    {
        phoneme: 'l',
        imagePath: '/assets/images/pronunciation/l_sound.svg',
        imageType: 'front',
        visualKey: '혀끝이 윗잇몸에 딱 붙어 보여요',
        commonMistake: 'ㄹ로 대체 (한국어 ㄹ은 탄설음, 영어 l은 설측음)',
        confusedWith: ['r'],
        visualTip: '입을 벌리고 거울 보세요. 혀끝이 윗니 바로 뒤 잇몸에 닿아있으면 OK!',
        difficulty: 'very_hard',
        exampleWords: ['leg', 'lake', 'light', 'bell'],
    },

    // f — /f/
    {
        phoneme: 'f',
        imagePath: '/assets/images/pronunciation/f_sound.svg',
        imageType: 'front',
        visualKey: '윗니가 아랫입술 위에 살짝 올려져요',
        commonMistake: 'ㅍ(p)으로 대체 → "fine"을 "pine"으로 발음',
        confusedWith: ['p'],
        visualTip: 'f: 윗니가 아랫입술에 닿아요 (이빨 보여요)\np: 두 입술이 붙어요 (이빨 안 보여요)',
        difficulty: 'very_hard',
        exampleWords: ['fish', 'fan', 'fun', 'five'],
    },

    // v — /v/
    {
        phoneme: 'v',
        imagePath: '/assets/images/pronunciation/v_sound.svg',
        imageType: 'front',
        visualKey: '윗니 + 아랫입술 + 목 진동',
        commonMistake: 'ㅂ(b)으로 대체 → "very"를 "berry"로 발음',
        confusedWith: ['b'],
        visualTip: 'v: f와 같은 입 모양인데 목이 울려요\nb: 두 입술이 붙어요 (f/v와 완전 다른 모양!)',
        difficulty: 'very_hard',
        exampleWords: ['van', 'very', 'five', 'love'],
    },

    // z — /z/
    {
        phoneme: 'z',
        imagePath: '/assets/images/pronunciation/z_sound.svg',
        imageType: 'front',
        visualKey: '이빨이 거의 닫히고 + 목 진동',
        commonMistake: 'ㅈ(j/ch) 또는 ㅅ(s)으로 대체',
        confusedWith: ['s', 'dʒ'],
        visualTip: 's와 입 모양은 같아요! 목에 손 대서 진동 느끼면 z, 바람만 나오면 s.',
        difficulty: 'very_hard',
        exampleWords: ['zoo', 'zip', 'buzz', 'nose'],
    },

    // ============================================================
    // 🟠 HARD — 한국어에 비슷한 소리가 있지만 다른 소리
    // ============================================================

    // short a /æ/ vs short e /ɛ/
    {
        phoneme: 'æ',
        imagePath: '/assets/images/pronunciation/vowel_ae.svg',
        imageType: 'comparison',
        visualKey: '입을 가장 크게 벌리고 + 입꼬리 살짝 당김',
        commonMistake: '/ɛ/(에)로 대체 → "bat"를 "bet"처럼 발음',
        confusedWith: ['ɛ', 'e'],
        visualTip: '손가락 2개가 들어갈 만큼 입 벌리면 /æ/\n손가락 1개 정도면 /ɛ/\n"I makes you grin, E moves your chin!"',
        difficulty: 'hard',
        exampleWords: ['cat', 'bat', 'man', 'hat'],
    },

    {
        phoneme: 'ɛ',
        imagePath: '/assets/images/pronunciation/vowel_e.svg',
        imageType: 'comparison',
        visualKey: '입을 중간만 벌림 (æ보다 작게)',
        commonMistake: '/æ/(애)와 구별 못함 → "bed"와 "bad" 같게 발음',
        confusedWith: ['æ', 'a'],
        visualTip: '/æ/보다 턱이 덜 내려가요. 거울 보면서 턱 높이 차이를 확인하세요!',
        difficulty: 'hard',
        exampleWords: ['bed', 'red', 'hen', 'net'],
    },

    // short i /ɪ/ vs short e /ɛ/
    {
        phoneme: 'ɪ',
        imagePath: '/assets/images/pronunciation/vowel_i.svg',
        imageType: 'comparison',
        visualKey: '입꼬리가 옆으로 살짝 (웃는 모양)',
        commonMistake: '/ɛ/(에)와 혼동 → "sit"를 "set"처럼 발음',
        confusedWith: ['ɛ', 'iː'],
        visualTip: '/ɪ/: 살짝 웃는 것처럼 입꼬리 당김 (grin!)\n/ɛ/: 턱을 아래로 내림 (chin drops!)',
        difficulty: 'hard',
        exampleWords: ['pig', 'sit', 'pin', 'big'],
    },

    // short o /ɒ/ — 둥근 입
    {
        phoneme: 'ɒ',
        imagePath: '/assets/images/pronunciation/vowel_o.svg',
        imageType: 'front',
        visualKey: '입을 동그랗게 크게 벌림 (하품처럼)',
        commonMistake: '한국어 "오"보다 입이 더 크고 둥글어야 함',
        confusedWith: ['ʌ'],
        visualTip: '한국어 "아"와 "오" 중간이에요. 입을 둥글게 만들되 크게 벌리세요.',
        difficulty: 'hard',
        exampleWords: ['dog', 'hot', 'fox', 'hop'],
    },

    // short u /ʌ/ vs /ʊ/
    {
        phoneme: 'ʌ',
        imagePath: '/assets/images/pronunciation/vowel_u.svg',
        imageType: 'front',
        visualKey: '입을 살짝만 벌리고 힘 빼기',
        commonMistake: '한국어 "어"로 대체하거나 /ɒ/와 혼동',
        confusedWith: ['ɒ', 'ʊ'],
        visualTip: '가장 편한 소리! 힘을 완전히 빼고 "어…" 하면 되는데, 입을 거의 안 벌려요.',
        difficulty: 'hard',
        exampleWords: ['bug', 'cup', 'sun', 'run'],
    },

    // ============================================================
    // 🟡 MODERATE — 입 모양에 주의가 필요한 소리
    // ============================================================

    // sh /ʃ/ vs s /s/
    {
        phoneme: 'ʃ',
        imagePath: '/assets/images/pronunciation/sh_sound.svg',
        imageType: 'comparison',
        visualKey: '입술을 동그랗게 앞으로 내밀어요',
        commonMistake: 's와 구별 없이 발음',
        confusedWith: ['s'],
        visualTip: 'sh: 입술이 동그랗게 나와요 (뽀뽀 입)\ns: 입술이 평평하고 이빨이 보여요',
        difficulty: 'moderate',
        exampleWords: ['ship', 'shop', 'fish', 'she'],
    },

    // ch /tʃ/
    {
        phoneme: 'tʃ',
        imagePath: '/assets/images/pronunciation/ch_sound.svg',
        imageType: 'front',
        visualKey: 'sh와 같은 둥근 입 + 처음에 막힘',
        commonMistake: '한국어 ㅊ보다 입술이 더 둥글어야 함',
        confusedWith: ['ʃ'],
        visualTip: '입술 모양은 sh와 같은데, 혀가 잇몸을 "딱" 쳤다가 떼는 게 차이!',
        difficulty: 'moderate',
        exampleWords: ['chin', 'chop', 'much', 'teacher'],
    },

    // long vowels — /eɪ/ (cake)
    {
        phoneme: 'eɪ',
        imagePath: '/assets/images/pronunciation/vowel_ay.svg',
        imageType: 'front',
        visualKey: '입이 중간에서 시작 → 웃는 모양으로 변해요',
        commonMistake: '한국어 "에이"처럼 끊어서 발음 (매끄럽게 이어져야 함)',
        confusedWith: ['ɛ'],
        visualTip: '이중모음이에요! 입이 움직이는 게 보여야 해요. 안 움직이면 /ɛ/가 되어버려요.',
        difficulty: 'moderate',
        exampleWords: ['cake', 'name', 'lake', 'face'],
    },

    // /aɪ/ (bike)
    {
        phoneme: 'aɪ',
        imagePath: '/assets/images/pronunciation/vowel_ai.svg',
        imageType: 'front',
        visualKey: '입을 크게 → 웃는 모양으로 변화',
        commonMistake: '이중모음 움직임이 부족할 수 있음',
        confusedWith: ['æ'],
        visualTip: '크게 벌린 입(아)에서 웃는 입(이)으로 미끄러지듯 변해요.',
        difficulty: 'moderate',
        exampleWords: ['bike', 'kite', 'nine', 'ride'],
    },

    // /oʊ/ (bone)
    {
        phoneme: 'oʊ',
        imagePath: '/assets/images/pronunciation/vowel_oh.svg',
        imageType: 'front',
        visualKey: '입이 둥근 O에서 더 좁은 U로 변해요',
        commonMistake: '한국어 "오"처럼 고정된 입으로 발음 (움직여야 함)',
        confusedWith: ['ɒ'],
        visualTip: '이것도 이중모음! 입 동그라미가 점점 작아지는 게 보여야 해요.',
        difficulty: 'moderate',
        exampleWords: ['bone', 'nose', 'home', 'phone'],
    },

    // ============================================================
    // 🟢 EASY — 기본 확인만 필요
    // ============================================================

    // /iː/ (bee) vs /ɪ/ (bit)
    {
        phoneme: 'iː',
        imagePath: '/assets/images/pronunciation/vowel_ee.svg',
        imageType: 'comparison',
        visualKey: '입꼬리를 확실하게 옆으로! (치즈~)',
        commonMistake: '/ɪ/와 구별 못해 "sheep"이 "ship"이 됨',
        confusedWith: ['ɪ'],
        visualTip: '/iː/: 입에 힘주고 "치~즈" (길게, 팽팽하게)\n/ɪ/: 힘 빼고 편하게 (짧게, 느슨하게)',
        difficulty: 'easy',
        exampleWords: ['bee', 'tree', 'sea', 'read'],
    },

    // /b/ vs /p/ (무성/유성)
    {
        phoneme: 'b',
        imagePath: '/assets/images/pronunciation/b_p_compare.svg',
        imageType: 'comparison',
        visualKey: '두 입술 붙였다 뗌 (입 모양은 p와 같아요)',
        commonMistake: '단어 끝에서 b→p로 바뀜 (lab→lap)',
        confusedWith: ['p'],
        visualTip: '입 모양은 같아요! 차이는 목 진동. 목에 손 대고 확인하세요.',
        difficulty: 'easy',
        exampleWords: ['bug', 'big', 'bed', 'cab'],
    },

    // /w/ (whale)
    {
        phoneme: 'w',
        imagePath: '/assets/images/pronunciation/w_sound.svg',
        imageType: 'front',
        visualKey: '입술을 쭉 모아서 동그랗게 (휘파람 모양)',
        commonMistake: '비교적 쉬우나 wh- 시작 단어에서 h를 빠뜨리거나 추가',
        confusedWith: [],
        visualTip: 'r보다 입술이 더 둥글고 더 앞으로 나와요. 촛불 끄는 입 모양!',
        difficulty: 'easy',
        exampleWords: ['whale', 'when', 'wet', 'win'],
    },
];

// ─── 유틸리티 함수 ───

/** 특정 음소의 참조 데이터 가져오기 */
export function getGuideForPhoneme(phoneme: string): PronunciationRef | undefined {
    return pronunciationGuide.find(g => g.phoneme === phoneme);
}

/** 특정 viseme에 해당하는 모든 참조 가져오기 (여러 음소가 같은 viseme일 수 있음) */
export function getGuidesForViseme(visemeId: string): PronunciationRef[] {
    // visemeMap에서 역매핑이 필요하므로, phoneme 목록으로 필터
    return pronunciationGuide.filter(g => {
        // pronunciationGuide에 있는 음소만 반환
        return g.phoneme !== undefined;
    });
}

/** 난이도별 필터 */
export function getGuidesByDifficulty(difficulty: Difficulty): PronunciationRef[] {
    return pronunciationGuide.filter(g => g.difficulty === difficulty);
}

/** 혼동 쌍 가져오기 — 현재 음소와 혼동되는 음소의 가이드 */
export function getConfusionPair(phoneme: string): PronunciationRef | undefined {
    const guide = getGuideForPhoneme(phoneme);
    if (!guide?.confusedWith?.length) return undefined;
    return getGuideForPhoneme(guide.confusedWith[0]);
}

/** 이미지가 실제로 존재하는지와 무관하게, 가이드 데이터가 있는 음소 목록 */
export const guidedPhonemes = new Set(pronunciationGuide.map(g => g.phoneme));

// ─── 이미지 생성용 프롬프트 (Antigravity/Gemini에서 사용) ───
export const IMAGE_GENERATION_PROMPTS: Record<string, string> = {
    'th_voiceless': `Close-up of a child's mouth (front view) showing the TH sound /θ/.
The tongue tip is clearly visible between the upper and lower front teeth.
Bright, clean, educational illustration style. Soft pastel colors.
Arrow or highlight pointing to the tongue tip between teeth.
Text label: "th" — 512x512px, white background.`,

    'th_voiced': `Same as th_voiceless but with a small vibration icon near the throat
to indicate voicing. Label: "th (voiced)"`,

    'r_vs_l': `Split comparison illustration showing two mouth positions side by side:
LEFT: "R" sound — lips slightly rounded, tongue curled back not touching anything
RIGHT: "L" sound — lips flat, tongue tip clearly touching the ridge behind upper teeth
Labels: "R" and "L" with arrows. Educational kids style, 512x512px.`,

    'f_vs_p': `Split comparison illustration:
LEFT: "F" sound — upper teeth resting on lower lip, air flowing out
RIGHT: "P" sound — both lips pressed together
Labels and arrows. Kids educational style, 512x512px.`,

    'v_vs_b': `Split comparison illustration:
LEFT: "V" sound — upper teeth on lower lip + vibration icon at throat
RIGHT: "B" sound — both lips pressed together + vibration icon at throat
Labels and arrows. Kids educational style, 512x512px.`,

    'vowel_ae_vs_e': `Split comparison illustration of jaw opening:
LEFT: /æ/ (cat) — jaw dropped wide, "2 fingers" space, corners slightly pulled back
RIGHT: /ɛ/ (bed) — jaw dropped medium, "1 finger" space
Side profile view showing different jaw heights. Labels: "a (cat)" and "e (bed)".
Kids educational style, 512x512px.`,

    'vowel_i_vs_e': `Split comparison illustration:
LEFT: /ɪ/ (sit) — slight smile shape, jaw barely open (grin!)
RIGHT: /ɛ/ (bed) — jaw drops down (chin moves!)
Front view. Labels: "i (sit)" and "e (bed)".
Mnemonic text: "I = grin 😊  E = chin ⬇️"
Kids educational style, 512x512px.`,

    'vowel_ee_vs_i': `Split comparison:
LEFT: /iː/ (bee) — wide smile, tense lips, "cheese!"
RIGHT: /ɪ/ (bit) — relaxed, shorter, loose smile
Labels: "ee (bee) 길고 팽팽!" and "i (bit) 짧고 편안"
Kids educational style, 512x512px.`,

    'sh_vs_s': `Split comparison:
LEFT: "sh" — lips rounded and pushed forward (like blowing a kiss)
RIGHT: "s" — lips flat, teeth visible, like a hissing snake
Labels and arrows. Kids educational style, 512x512px.`,

    'vowel_o': `Child's mouth front view for /ɒ/ (hot):
Mouth open in a round O shape, wider than Korean "오".
Label: "o (hot)" — like a surprised "오!" but bigger.
Kids educational style, 512x512px.`,

    'vowel_u': `Child's mouth front view for /ʌ/ (cup):
Mouth barely open, very relaxed, like a lazy "어".
Label: "u (cup)" — the most relaxed sound!
Kids educational style, 512x512px.`,

    'w_sound': `Child's mouth front view for /w/:
Lips tightly rounded like about to blow out a candle.
Even more rounded than /r/.
Label: "w (whale)" — candle blowing shape!
Kids educational style, 512x512px.`,

    'z_sound': `Child's mouth front view for /z/:
Teeth almost closed (same as "s"), with vibration icon at throat.
Split with "s" for comparison: same mouth, different throat.
Labels: "z (zoo) 🔊" and "s (sun) 🌬️"
Kids educational style, 512x512px.`,

    'ch_sound': `Child's mouth front view for /tʃ/:
Lips rounded like "sh" but with a burst of air.
Small "explosion" graphic to show the initial stop.
Label: "ch (chin)"
Kids educational style, 512x512px.`,

    'diphthong_ay': `Sequence showing mouth shape change for /eɪ/:
Frame 1: medium open → Frame 2: smile shape
Arrow showing the glide movement.
Label: "a_e (cake)" — your mouth moves!
Kids educational style, 512x512px.`,

    'diphthong_ai': `Sequence showing mouth shape change for /aɪ/:
Frame 1: wide open → Frame 2: smile/grin shape
Arrow showing the glide movement.
Label: "i_e (bike)" — big to small!
Kids educational style, 512x512px.`,

    'diphthong_oh': `Sequence showing mouth shape change for /oʊ/:
Frame 1: round O → Frame 2: smaller, tighter O
Arrow showing the shrinking circle.
Label: "o_e (bone)" — circle gets smaller!
Kids educational style, 512x512px.`,

    'b_p_compare': `Split comparison with throat highlight:
LEFT: "b" — lips together, throat vibration icon ✓
RIGHT: "p" — lips together, throat vibration icon ✗
Same mouth shape! Different voice.
Labels: "b (bug) 🔊" and "p (pig) 🌬️"
Kids educational style, 512x512px.`,
};
