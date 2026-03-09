export type VisemeId =
    | 'rest'
    | 'bilabial'
    | 'labiodental'
    | 'dental'
    | 'alveolar_stop'
    | 'alveolar_fric'
    | 'postalveolar'
    | 'velar'
    | 'glottal'
    | 'open_front'
    | 'mid_front'
    | 'close_front'
    | 'open_back'
    | 'close_back'
    | 'mid_central';

// phoneme → viseme mapping (44 phonemes → 15 visemes)
export const phonemeToViseme: Record<string, VisemeId> = {
    // ─── Consonants ───
    'p': 'bilabial',       'b': 'bilabial',       'm': 'bilabial',
    'f': 'labiodental',    'v': 'labiodental',
    'θ': 'dental',         'ð': 'dental',         'th': 'dental',
    't': 'alveolar_stop',  'd': 'alveolar_stop',  'n': 'alveolar_stop',  'l': 'alveolar_stop',
    's': 'alveolar_fric',  'z': 'alveolar_fric',
    'ʃ': 'postalveolar',   'ʒ': 'postalveolar',   'tʃ': 'postalveolar',  'dʒ': 'postalveolar',
    'sh': 'postalveolar',  'ch': 'postalveolar',
    'k': 'velar',          'g': 'velar',           'ŋ': 'velar',          'ng': 'velar',
    'h': 'glottal',        'w': 'close_back',      'r': 'postalveolar',
    'j': 'close_front',    'y': 'close_front',

    // ─── Short vowels ───
    'æ': 'open_front',     'a': 'open_front',
    'ɛ': 'mid_front',      'e': 'mid_front',
    'ɪ': 'close_front',    'i': 'close_front',
    'ɒ': 'open_back',      'o': 'open_back',
    'ʌ': 'mid_central',    'u': 'mid_central',
    'ʊ': 'close_back',

    // ─── Long vowels ───
    'iː': 'close_front',
    'eɪ': 'mid_front',
    'aɪ': 'open_front',
    'oʊ': 'close_back',
    'uː': 'close_back',
    'juː': 'close_front',
    'ɔɪ': 'open_back',
    'aʊ': 'open_front',

    // ─── R-controlled ───
    'ɑːr': 'open_back',
    'ɔːr': 'open_back',
    'ɜːr': 'mid_central',
};

// Korean pronunciation guide per viseme
export const visemeGuide: Record<VisemeId, {
    lipDesc: string;
    tongueDesc: string;
    tipKo: string;
}> = {
    'rest':           { lipDesc: '입 다문 상태', tongueDesc: '혀 편안히', tipKo: '편하게 입을 다물어요' },
    'bilabial':       { lipDesc: '두 입술을 붙였다 뗌', tongueDesc: '혀는 가만히', tipKo: '입술을 꽉 붙였다 "빠" 하고 떼요' },
    'labiodental':    { lipDesc: '윗니가 아랫입술에 닿음', tongueDesc: '혀는 가만히', tipKo: '윗니를 아랫입술에 살짝 대요' },
    'dental':         { lipDesc: '입을 살짝 벌림', tongueDesc: '혀끝이 윗니 사이로 나옴', tipKo: '혀를 윗니 사이로 살짝 내밀어요' },
    'alveolar_stop':  { lipDesc: '입을 살짝 벌림', tongueDesc: '혀끝이 윗잇몸에 닿음', tipKo: '혀끝을 윗잇몸에 톡 대요' },
    'alveolar_fric':  { lipDesc: '이빨 살짝 보이게', tongueDesc: '혀끝이 윗잇몸 가까이', tipKo: '이빨 사이로 "쓰" 바람을 내요' },
    'postalveolar':   { lipDesc: '입술을 앞으로 약간 모음', tongueDesc: '혀 앞부분을 올림', tipKo: '입술을 동그랗게 하고 "쉬" 해요' },
    'velar':          { lipDesc: '입을 벌림', tongueDesc: '혀 뒷부분이 올라감', tipKo: '혀 뒤쪽을 올려서 "크" 해요' },
    'glottal':        { lipDesc: '입을 벌림', tongueDesc: '혀는 가만히, 목에서 소리', tipKo: '입을 벌리고 "하" 숨을 내쉬어요' },
    'open_front':     { lipDesc: '입을 크게 벌림', tongueDesc: '혀를 낮추고 앞에', tipKo: '입을 크~게 벌려요! "애"' },
    'mid_front':      { lipDesc: '입을 중간 정도 벌림', tongueDesc: '혀가 중간 높이', tipKo: '입을 반쯤 벌려요. "에"' },
    'close_front':    { lipDesc: '입꼬리를 옆으로 당김', tongueDesc: '혀를 높이 올리고 앞에', tipKo: '웃는 입 모양! "이"' },
    'open_back':      { lipDesc: '입을 크게 벌리고 둥글게', tongueDesc: '혀를 낮추고 뒤에', tipKo: '입을 동그랗게 크게! "아"' },
    'close_back':     { lipDesc: '입을 둥글게 오므림', tongueDesc: '혀를 뒤로 올림', tipKo: '입을 쭈~욱 모아요! "우"' },
    'mid_central':    { lipDesc: '입을 살짝 벌림 (자연스럽게)', tongueDesc: '혀가 중간 위치', tipKo: '편하게 "어" 해요' },
};
