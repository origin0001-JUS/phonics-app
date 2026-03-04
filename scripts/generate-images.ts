/**
 * ═══════════════════════════════════════════════════════════════
 * 단어 이미지 에셋 배치 생성 스크립트
 * ───────────────────────────────────────────────────────────────
 * 
 * curriculum.ts의 모든 단어에 대해 스타일링된 SVG 아이콘을 생성합니다.
 * 각 SVG는 부드러운 원형 배경 + 이모지 아이콘으로 구성됩니다.
 * 
 * 실행: npx tsx scripts/generate-images.ts
 * 출력: public/assets/images/[word-id].svg
 * ═══════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMAGE_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'images');

// ─── 단어 → 이모지 매핑 ───
// 모든 300개 단어에 대해 최적의 이모지를 매핑
const WORD_EMOJI_MAP: Record<string, string> = {
    // ═══ Unit 1: Short a ═══
    cat: '🐱', bat: '🦇', hat: '🎩', mat: '🏠', rat: '🐀',
    sat: '🪑', fan: '🪭', van: '🚐', can: '🥫', man: '👨',
    map: '🗺️', cap: '🧢', tap: '🚰', nap: '😴', bag: '👜',

    // ═══ Unit 2: Short e ═══
    bed: '🛏️', red: '🔴', pen: '🖊️', hen: '🐔', ten: '🔟',
    men: '👥', net: '🥅', set: '📦', wet: '💧', jet: '✈️',
    leg: '🦵', peg: '📌', beg: '🙏', fed: '🍽️', den: '🏕️',

    // ═══ Unit 3: Short i ═══
    big: '🐘', pig: '🐷', dig: '⛏️', sit: '🪑', hit: '🥊',
    bit: '🍪', fin: '🦈', pin: '📍', bin: '🗑️', lip: '👄',
    zip: '🤐', tip: '☝️', wig: '💇', six: '6️⃣', kid: '🧒',

    // ═══ Unit 4: Short o ═══
    dog: '🐶', hot: '🌡️', box: '📦', fox: '🦊', pot: '🍲',
    top: '🔝', hop: '🐇', mop: '🧹', log: '🪵', cot: '🛏️',
    dot: '⚫', got: '✅', rod: '🎣', sob: '😢', nod: '😌',

    // ═══ Unit 5: Short u ═══
    bug: '🐛', cup: '☕', sun: '☀️', run: '🏃', fun: '🎉',
    bun: '🍞', nut: '🥜', cut: '✂️', hut: '🛖', mud: '🟤',
    tub: '🛁', rug: '🧶', bus: '🚌', gum: '🫧', jug: '🫗',

    // ═══ Unit 7: Long a (a_e) ═══
    cake: '🎂', bake: '👨‍🍳', lake: '🏞️', make: '🔨', take: '🤲',
    name: '📛', game: '🎮', came: '🚶', gate: '🚪', late: '⏰',
    tape: '📼', cape: '🦸', face: '😊', race: '🏁', wave: '🌊',

    // ═══ Unit 8: Long i (i_e) ═══
    bike: '🚲', like: '❤️', hike: '🥾', time: '⏰', lime: '🍋',
    dime: '🪙', kite: '🪁', bite: '🦷', ride: '🎠', hide: '🫣',
    five: '5️⃣', nine: '9️⃣', pine: '🌲', vine: '🌿', line: '📏',

    // ═══ Unit 9: Long o (o_e) ═══
    bone: '🦴', cone: '🍦', home: '🏠', hope: '🌈', nose: '👃',
    rose: '🌹', hole: '🕳️', pole: '🏇', rope: '🪢', note: '📝',
    vote: '🗳️', joke: '😂', woke: '⏰', stone: '🪨', phone: '📱',

    // ═══ Unit 10: Long u (u_e) ═══
    cute: '🥰', mute: '🔇', cube: '🧊', tube: '🧪', tune: '🎵',
    dune: '🏜️', june: '📅', huge: '🏔️', rude: '😤', rule: '📖',
    mule: '🫏', fuse: '💥', use: '👆', flute: '🎶', prune: '🫐',

    // ═══ Unit 11: ee / ea ═══
    bee: '🐝', see: '👀', tree: '🌳', free: '🕊️', seed: '🌱',
    feed: '🍼', feet: '🦶', meet: '🤝', bead: '📿', read: '📖',
    sea: '🌊', tea: '🍵', leaf: '🍃', team: '👥', dream: '💭',

    // ═══ Unit 13: bl / cl / fl ═══
    black: '⬛', block: '🧱', blue: '🔵', clap: '👏', clam: '🐚',
    clip: '📎', clock: '🕐', class: '🏫', flag: '🏳️', flat: '🫓',
    flip: '🔄', flop: '🐟', flow: '🌊', blend: '🎨', club: '🏌️',

    // ═══ Unit 14: br / cr / dr ═══
    brick: '🧱', brush: '🖌️', bring: '📦', broom: '🧹', crab: '🦀',
    crop: '🌾', crib: '🛏️', cross: '✝️', drip: '💧', drop: '⬇️',
    drum: '🥁', dress: '👗', drill: '🔧', crack: '💔', grab: '🤏',

    // ═══ Unit 15: gr / pr / tr ═══
    green: '💚', grow: '🌱', grip: '✊', grin: '😁', press: '⬇️',
    print: '🖨️', prize: '🏆', price: '💰', trip: '✈️', trick: '🪄',
    truck: '🚛', train: '🚂', grass: '🌿', proud: '💪', track: '🛤️',

    // ═══ Unit 16: sk / sn / sp / st ═══
    skip: '⏭️', skin: '🖐️', sky: '🌤️', snap: '📸', snag: '🪝',
    snow: '❄️', spin: '🔄', spot: '🔴', spoon: '🥄', step: '👣',
    stop: '🛑', star: '⭐', stick: '🏒', stem: '🌿', swim: '🏊',

    // ═══ Unit 17: sh / ch ═══
    ship: '🚢', shop: '🏪', shoe: '👟', shut: '🚪', she: '👩',
    sheep: '🐑', shin: '🦵', shell: '🐚', chat: '💬', chin: '😐',
    chip: '🍟', chop: '🪓', check: '✅', chain: '⛓️', chunk: '🧊',

    // ═══ Unit 19: th / wh ═══
    this: '👉', that: '👈', them: '👥', then: '⏩', thin: '🪡',
    thick: '📕', think: '🤔', three: '3️⃣', whale: '🐋', what: '❓',
    when: '🕐', where: '📍', white: '⬜', wheel: '🛞', whip: '🏇',

    // ═══ Unit 20: ar / or ═══
    car: '🚗', bar: '🍫', jar: '🏺', far: '🔭', arm: '💪',
    park: '🏞️', dark: '🌑', farm: '🚜', for: '➡️', corn: '🌽',
    fork: '🍴', horn: '📯', born: '👶', storm: '⛈️', sort: '🔢',

    // ═══ Unit 21: er / ir / ur ═══
    her: '👩', fern: '🌿', verb: '📝', herd: '🐄', bird: '🐦',
    girl: '👧', sir: '🎩', first: '🥇', fur: '🧸', burn: '🔥',
    turn: '🔄', hurt: '🤕', curl: '💫', nurse: '👩‍⚕️', stir: '🥄',

    // ═══ Unit 22: Diphthongs ═══
    boy: '👦', joy: '😊', toy: '🧸', coin: '🪙', oil: '🛢️',
    boil: '♨️', soil: '🪴', cow: '🐄', now: '⏰', how: '❓',
    town: '🏘️', brown: '🟤', out: '🚪', loud: '📢', cloud: '☁️',

    // ═══ Unit 23: Silent e Mix ═══
    plate: '🍽️', brave: '🦁', slide: '🛝', spoke: '🗣️', chase: '🏃',
    smile: '😊', froze: '🥶', blade: '⚔️', crane: '🏗️', pride: '🦁',
    quote: '💬', stripe: '🦓', throne: '👑', globe: '🌍', grape: '🍇',
};

// ─── 유닛별 색상 팔레트 ───
const UNIT_COLORS: Record<string, { bg: string; accent: string }> = {
    unit_01: { bg: '#FFF0F0', accent: '#FF6B6B' },
    unit_02: { bg: '#F0FAF9', accent: '#4ECDC4' },
    unit_03: { bg: '#FFF8F0', accent: '#FF9F43' },
    unit_04: { bg: '#F5F3FF', accent: '#A29BFE' },
    unit_05: { bg: '#FFF0F6', accent: '#FD79A8' },
    unit_07: { bg: '#FFF3EE', accent: '#E17055' },
    unit_08: { bg: '#EDFAF5', accent: '#00B894' },
    unit_09: { bg: '#F2F0FF', accent: '#6C5CE7' },
    unit_10: { bg: '#FFF0F8', accent: '#E84393' },
    unit_11: { bg: '#FFFCF0', accent: '#FDCB6E' },
    unit_13: { bg: '#F4F5F5', accent: '#636E72' },
    unit_14: { bg: '#FFF0F0', accent: '#D63031' },
    unit_15: { bg: '#EDFAF5', accent: '#00B894' },
    unit_16: { bg: '#EEF5FF', accent: '#0984E3' },
    unit_17: { bg: '#EFFFFE', accent: '#00CEC9' },
    unit_19: { bg: '#F0FFF8', accent: '#55EFC4' },
    unit_20: { bg: '#FFF3EE', accent: '#E17055' },
    unit_21: { bg: '#F5F3FF', accent: '#A29BFE' },
    unit_22: { bg: '#FFFCF0', accent: '#FDCB6E' },
    unit_23: { bg: '#FFF0F6', accent: '#FD79A8' },
};

function getColors(wordId: string): { bg: string; accent: string } {
    // curriculum에서 unitId를 찾아 색상 매칭
    // 간단히 첫 글자 기반 fallback
    return { bg: '#F0F8FF', accent: '#7dd3fc' };
}

// ─── SVG 생성 ───
function generateWordSVG(wordId: string, emoji: string, bgColor: string, accentColor: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bg_${wordId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${accentColor}20;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow_${wordId}">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.15"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="200" height="200" rx="32" fill="url(#bg_${wordId})" />
  <!-- Accent circle -->
  <circle cx="100" cy="88" r="60" fill="${accentColor}15" stroke="${accentColor}30" stroke-width="2"/>
  <!-- Emoji -->
  <text x="100" y="105" font-size="64" text-anchor="middle" dominant-baseline="central" filter="url(#shadow_${wordId})">${emoji}</text>
  <!-- Word label -->
  <rect x="30" y="155" width="140" height="32" rx="16" fill="${accentColor}" opacity="0.9"/>
  <text x="100" y="175" font-family="'Fredoka', 'Segoe UI Emoji', sans-serif" font-size="16" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="central">${wordId}</text>
</svg>`;
}

// ─── 메인 실행 ───
async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🎨 Phonics 300 — Word Image Asset Generator');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    // 출력 디렉토리 생성
    if (!fs.existsSync(IMAGE_DIR)) {
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
        console.log(`📁 Created: ${IMAGE_DIR}`);
    }

    // curriculum 동적 import
    const { curriculum } = await import('../src/data/curriculum');

    let generated = 0;
    let skipped = 0;
    const processedWords = new Set<string>();

    for (const unit of curriculum) {
        const colors = UNIT_COLORS[unit.id] || { bg: '#F0F8FF', accent: '#7dd3fc' };

        for (const word of unit.words) {
            if (processedWords.has(word.id)) continue;
            processedWords.add(word.id);

            const outputPath = path.join(IMAGE_DIR, `${word.id}.svg`);

            // 이미 존재하면 스킵
            if (fs.existsSync(outputPath)) {
                skipped++;
                continue;
            }

            const emoji = WORD_EMOJI_MAP[word.id] || '📝';
            const svg = generateWordSVG(word.id, emoji, colors.bg, colors.accent);

            fs.writeFileSync(outputPath, svg, 'utf-8');
            generated++;
        }
    }

    console.log(`  ✅ Generated: ${generated} SVG files`);
    console.log(`  ⏭ Skipped: ${skipped} (already exist)`);
    console.log(`  📁 Output: ${IMAGE_DIR}`);
    console.log(`  📊 Total unique words: ${processedWords.size}`);
    console.log('');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
