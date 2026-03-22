/**
 * ═══════════════════════════════════════════════════════════════════
 * ElevenLabs Phoneme TTS 배치 생성 스크립트
 * ───────────────────────────────────────────────────────────────────
 *
 * audit-result.json의 onset/rime 목록을 읽어 개별 음소 오디오를 생성합니다.
 *
 * ─── 실행 방법 ───
 *    cd phonics-app
 *    npx tsx scripts/generate-phoneme-tts.ts [--force] [--dry-run]
 *
 * ─── Options ───
 *    --force     : 기존 파일이 존재해도 강제로 재생성
 *    --dry-run   : 실제 과금/생성 없이 생성될 파일 목록만 출력
 *    --onsets    : onset 파일만 생성
 *    --rimes     : rime 파일만 생성
 *
 * ─── Output ───
 *    public/assets/audio/phonemes/onset_{phoneme}.mp3
 *    public/assets/audio/phonemes/rime_{phoneme}.mp3
 * ═══════════════════════════════════════════════════════════════════
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PHONEME_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes');
const AUDIT_FILE = path.join(PROJECT_ROOT, 'scripts', 'audit-result.json');

// ─── .env.local 로드 ───
dotenv.config({ path: path.join(PROJECT_ROOT, 'env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '..', '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey && !process.argv.includes('--dry-run')) {
    console.error('Error: ELEVENLABS_API_KEY is not set in environment variables.');
    console.error('   Please add it to your .env.local file.');
    process.exit(1);
}

// ─── ElevenLabs 클라이언트 설정 ───
const elevenlabs = new ElevenLabsClient({ apiKey });

// ─── Voice & Model ───
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa';
const MODEL_MONO = 'eleven_monolingual_v1';

// ─── IPA 매핑: Onset (자음/자음군) ───
// 각 onset에 대해 자음 소리만 나도록 IPA 표기를 사용합니다.
// ElevenLabs는 SSML을 지원하지 않으므로, 짧은 프롬프트 + IPA hint 방식 사용
const ONSET_IPA: Record<string, string> = {
    'b': 'b',
    'c': 'k',
    'd': 'd',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'j': 'dʒ',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'p': 'p',
    'r': 'ɹ',
    's': 's',
    't': 't',
    'v': 'v',
    'w': 'w',
    'z': 'z',
    'sh': 'ʃ',
    'ch': 'tʃ',
    'th': 'θ',
    'wh': 'w',
    'bl': 'bl',
    'br': 'bɹ',
    'cl': 'kl',
    'cr': 'kɹ',
    'dr': 'dɹ',
    'fl': 'fl',
    'fr': 'fɹ',
    'gl': 'gl',
    'gr': 'gɹ',
    'pl': 'pl',
    'pr': 'pɹ',
    'sk': 'sk',
    'sl': 'sl',
    'sm': 'sm',
    'sn': 'sn',
    'sp': 'sp',
    'st': 'st',
    'sw': 'sw',
    'tr': 'tɹ',
    'str': 'stɹ',
    'thr': 'θɹ',
    'spr': 'spɹ',
};

// ─── IPA 매핑: Rime (모음+자음) ───
// 파닉스 규칙에 따른 발음
const RIME_IPA: Record<string, string> = {
    // Short vowel CVC rimes
    'ab': 'æb', 'ack': 'æk', 'ad': 'æd', 'ag': 'æg', 'am': 'æm',
    'an': 'æn', 'ang': 'æŋ', 'ank': 'æŋk', 'ap': 'æp', 'ash': 'æʃ',
    'ass': 'æs', 'at': 'æt', 'atch': 'ætʃ',
    'ed': 'ɛd', 'eg': 'ɛg', 'ell': 'ɛl', 'em': 'ɛm', 'en': 'ɛn',
    'ench': 'ɛntʃ', 'ep': 'ɛp', 'ess': 'ɛs', 'est': 'ɛst', 'et': 'ɛt',
    'eck': 'ɛk', 'erd': 'ɜːɹd', 'erk': 'ɜːɹk', 'ern': 'ɜːɹn',
    'ib': 'ɪb', 'ick': 'ɪk', 'id': 'ɪd', 'ig': 'ɪg', 'im': 'ɪm',
    'in': 'ɪn', 'ing': 'ɪŋ', 'ink': 'ɪŋk', 'ip': 'ɪp', 'ir': 'ɜːɹ',
    'ird': 'ɜːɹd', 'irl': 'ɜːɹl', 'irst': 'ɜːɹst', 'irt': 'ɜːɹt',
    'is': 'ɪs', 'ish': 'ɪʃ', 'istle': 'ɪsəl', 'it': 'ɪt', 'ix': 'ɪks',
    'ob': 'ɒb', 'od': 'ɒd', 'og': 'ɒɡ', 'om': 'ɒm', 'ong': 'ɒŋ',
    'op': 'ɒp', 'ot': 'ɒt', 'ox': 'ɒks',
    'ub': 'ʌb', 'ud': 'ʌd', 'ug': 'ʌɡ', 'um': 'ʌm', 'un': 'ʌn',
    'unch': 'ʌntʃ', 'unk': 'ʌŋk', 'up': 'ʌp', 'urn': 'ɜːɹn',
    'urse': 'ɜːɹs', 'urtle': 'ɜːɹtəl', 'us': 'ʌs', 'ut': 'ʌt',
    // Long vowel / magic-e rimes
    'ade': 'eɪd', 'ail': 'eɪl', 'ain': 'eɪn', 'aint': 'eɪnt',
    'ait': 'eɪt', 'ake': 'eɪk', 'ale': 'eɪl', 'ase': 'eɪs',
    'ate': 'eɪt', 'ave': 'eɪv', 'ay': 'eɪ',
    'each': 'iːtʃ', 'eaf': 'iːf', 'eal': 'iːl', 'eam': 'iːm',
    'ean': 'iːn', 'eat': 'iːt', 'ee': 'iː', 'eef': 'iːf',
    'eek': 'iːk', 'eel': 'iːl', 'eep': 'iːp', 'eer': 'ɪəɹ',
    'eet': 'iːt', 'ree': 'ɹiː',
    'ile': 'aɪl', 'ine': 'aɪn', 'ite': 'aɪt',
    'oad': 'oʊd', 'oap': 'oʊp', 'oast': 'oʊst', 'oat': 'oʊt',
    'oke': 'oʊk', 'rone': 'ɹoʊn',
    'oil': 'ɔɪl', 'oin': 'ɔɪn', 'oint': 'ɔɪnt', 'oy': 'ɔɪ',
    'oud': 'aʊd', 'ouse': 'aʊs', 'ow': 'aʊ', 'own': 'aʊn',
    // R-controlled
    'ar': 'ɑːɹ', 'ard': 'ɑːɹd', 'ark': 'ɑːɹk', 'arm': 'ɑːɹm',
    'ork': 'ɔːɹk', 'orm': 'ɔːɹm', 'orn': 'ɔːɹn', 'orse': 'ɔːɹs',
    'ort': 'ɔːɹt', 'oor': 'ɔːɹ',
    // /oo/ sounds
    'ook': 'ʊk', 'ood': 'ʊd',
    'ool': 'uːl', 'oom': 'uːm', 'oon': 'uːn', 'oot': 'uːt',
    // misc
    'alk': 'ɔːk',
};

interface PhonemeJob {
    phoneme: string;
    type: 'onset' | 'rime';
    filename: string;
    promptText: string;
}

function buildOnsetPrompt(onset: string): string {
    // 발음 기호(/ipa/) 대신 ElevenLabs가 확실하게 음가 소리로 읽는 단어-보컬 트릭 사용
    const PHONETIC_MAP: Record<string, string> = {
        'b': 'buh.', 'c': 'kuh.', 'd': 'duh.', 'f': 'f f f f', 'g': 'guh.',
        'h': 'huh.', 'j': 'juh.', 'k': 'kuh.', 'l': 'l l l', 'm': 'm m m',
        'n': 'n n n', 'p': 'puh.', 'r': 'ruh.', 's': 'sssss', 't': 'tuh.',
        'v': 'v v v v', 'w': 'wuh.', 'z': 'zzzz',
        'sh': 'shhh', 'ch': 'chuh.', 'th': 'thhhh', 'wh': 'hwuh.',
        // Blends can be sounded out
        'bl': 'bluh.', 'br': 'bruh.', 'cl': 'cluh.', 'cr': 'cruh.',
        'dr': 'druh.', 'fl': 'fluh.', 'fr': 'fruh.', 'gl': 'gluh.',
        'gr': 'gruh.', 'pl': 'pluh.', 'pr': 'pruh.', 'sk': 'skuh.',
        'sl': 'sluh.', 'sm': 'sm sm', 'sn': 'sn sn', 'sp': 'spuh.',
        'st': 'stuh.', 'sw': 'swuh.', 'tr': 'truh.', 'str': 'struh.',
        'thr': 'thruh.', 'spr': 'spruh.'
    };
    
    return PHONETIC_MAP[onset] || onset;
}

function buildRimePrompt(rime: string): string {
    const PHONETIC_MAP: Record<string, string> = {
        'at': 'at.', 'an': 'aaan.', 'ag': 'aaag.', 'ap': 'aaap.', 'am': 'aaam.', 'ad': 'aaad.', 'ab': 'aaab.', 'ack': 'aack.', 'ash': 'aash.', 'ass': 'aass.', 'atch': 'aatch.',
        'ig': 'igg.', 'in': 'ihn.', 'it': 'iht.', 'ip': 'ihp.', 'im': 'ihm.', 'id': 'ihd.', 'ib': 'ihb.', 'ick': 'ihck.', 'ish': 'ihsh.', 'is': 'ihss.', 'ix': 'ihks.',
        'og': 'ahg.', 'op': 'ahp.', 'ot': 'aht.', 'ob': 'ahb.', 'od': 'ahd.', 'om': 'ahm.', 'ong': 'ahng.', 'ox': 'ahks.',
        'ug': 'uhg.', 'un': 'uhn.', 'up': 'uhp.', 'ub': 'uhb.', 'ud': 'uhd.', 'um': 'uhm.', 'us': 'uhss.', 'ut': 'uht.', 'uck': 'uhck.', 'unch': 'uhnch.', 'unk': 'uhnk.',
        'en': 'ehn.', 'et': 'eht.', 'eg': 'ehg.', 'ed': 'ehd.', 'ep': 'ehp.', 'em': 'ehm.', 'ell': 'ehl.', 'ess': 'ehss.', 'est': 'ehst.', 'eck': 'ehck.', 'ench': 'ehnch.',
        // Long vowels
        'ade': 'ayd.', 'ake': 'ayk.', 'ale': 'ayl.', 'ame': 'aym.', 'ane': 'ayn.', 'ape': 'ayp.', 'ate': 'ayt.', 'ave': 'ayv.', 'ase': 'ays.',
        'ee': 'eee.', 'eep': 'eep.', 'eet': 'eet.', 'eek': 'eek.', 'eel': 'eel.', 'eem': 'eem.', 'een': 'een.', 'eef': 'eef.',
        'ea': 'eee.', 'eat': 'eet.', 'each': 'eech.', 'eaf': 'eef.', 'eal': 'eel.', 'eam': 'eem.', 'ean': 'een.',
        'ile': 'eyel.', 'ine': 'eyen.', 'ite': 'eyet.', 'ide': 'eyed.', 'ike': 'eyek.', 'ime': 'eyem.', 'ipe': 'eyep.', 'ive': 'eyev.', 'ize': 'eyez.',
        'oad': 'ohd.', 'oap': 'ohp.', 'oast': 'ohst.', 'oat': 'oht.', 'oke': 'ohk.', 'ole': 'ohl.', 'ome': 'ohm.', 'one': 'ohn.', 'ose': 'ohz.', 'ote': 'oht.',
        'ude': 'ood.', 'uke': 'ook.', 'ule': 'ool.', 'ume': 'oom.', 'une': 'oon.', 'use': 'ooz.', 'ute': 'oot.', 'ay': 'ayy.',
        // R-controlled
        'ar': 'ahr.', 'ark': 'ahrk.', 'art': 'ahrt.', 'ard': 'ahrd.', 'arm': 'ahrm.', 'arn': 'ahrn.', 'arse': 'ahrss.', 'artle': 'ahrtl.',
        'er': 'urr.', 'ir': 'urr.', 'ur': 'urr.', 'erk': 'urrk.', 'irt': 'urrt.', 'urn': 'urrn.', 'urse': 'urss.', 'erd': 'urrd.', 'ern': 'urrnn.', 'irst': 'urrst.', 'irl': 'urrl.', 'urtle': 'urrtl.',
        'or': 'or.', 'ork': 'ork.', 'ort': 'ort.', 'orn': 'orn.', 'orm': 'orm.', 'orse': 'orss.', 'oor': 'or.',
        // Diphthongs
        'ow': 'ow.', 'own': 'own.', 'oud': 'owd.', 'ouse': 'ows.', 'out': 'owt.',
        'oy': 'oy.', 'oil': 'oyl.', 'oin': 'oyn.', 'oint': 'oynt.',
        // Others
        'aw': 'aw.', 'awn': 'awn.', 'awt': 'awt.', 'ought': 'awt.', 'aught': 'awt.',
        'oo': 'ooo.', 'ook': 'uuk.', 'ood': 'uud.', 'oot': 'oot.', 'oom': 'oom.', 'oon': 'oon.', 'oop': 'oop.',
        'all': 'awl.', 'alk': 'awk.', 'alt': 'awlt.', 'ald': 'awld.',
        'ind': 'eyend.', 'ild': 'eyeld.', 'old': 'ohld.', 'olt': 'ohlt.', 'ost': 'ohst.'
    };
    return PHONETIC_MAP[rime] || rime;
}

function buildJobs(audit: { allOnsets: string[]; allRimes: string[] }): PhonemeJob[] {
    const jobs: PhonemeJob[] = [];

    for (const onset of audit.allOnsets) {
        jobs.push({
            phoneme: onset,
            type: 'onset',
            filename: `onset_${onset}.mp3`,
            promptText: buildOnsetPrompt(onset),
        });
    }

    for (const rime of audit.allRimes) {
        jobs.push({
            phoneme: rime,
            type: 'rime',
            filename: `rime_${rime}.mp3`,
            promptText: buildRimePrompt(rime),
        });
    }

    return jobs;
}

async function synthesizePhoneme(job: PhonemeJob, outputPath: string): Promise<void> {
    const responseStream = await elevenlabs.textToSpeech.stream(
        VOICE_CHARLOTTE,
        {
            model_id: MODEL_MONO,
            text: job.promptText,
            voice_settings: {
                stability: 0.85,        // High stability for consistent short sounds
                similarity_boost: 0.75,
            },
        }
    );

    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(outputPath, buffer);
}

async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const dryRun = args.includes('--dry-run');
    const onsetsOnly = args.includes('--onsets');
    const rimesOnly = args.includes('--rimes');

    console.log('');
    console.log('=====================================================');
    console.log(`  Phoneme TTS Generation ${dryRun ? '[DRY RUN]' : ''}`);
    console.log('=====================================================');
    console.log('');

    // Load audit data
    if (!fs.existsSync(AUDIT_FILE)) {
        console.error(`Error: audit-result.json not found at ${AUDIT_FILE}`);
        process.exit(1);
    }
    const audit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
    console.log(`Audit data loaded: ${audit.allOnsets.length} onsets, ${audit.allRimes.length} rimes`);

    // Ensure output directory
    if (!fs.existsSync(PHONEME_DIR)) {
        console.log(`Creating directory: ${PHONEME_DIR}`);
        if (!dryRun) fs.mkdirSync(PHONEME_DIR, { recursive: true });
    }

    // Build jobs
    let jobs = buildJobs(audit);
    if (onsetsOnly) jobs = jobs.filter(j => j.type === 'onset');
    if (rimesOnly) jobs = jobs.filter(j => j.type === 'rime');

    console.log(`Total jobs: ${jobs.length} (Onsets: ${jobs.filter(j => j.type === 'onset').length}, Rimes: ${jobs.filter(j => j.type === 'rime').length})`);
    console.log('');

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const job of jobs) {
        const filePath = path.join(PHONEME_DIR, job.filename);
        const fileExists = fs.existsSync(filePath);

        if (fileExists && !force) {
            skipped++;
            continue;
        }

        if (dryRun) {
            console.log(`[Dry Run] ${job.filename} | type=${job.type} | phoneme="${job.phoneme}" | prompt="${job.promptText}"`);
            generated++;
            continue;
        }

        console.log(`Generating: ${job.filename} | "${job.promptText}"`);
        try {
            await synthesizePhoneme(job, filePath);
            generated++;
            // Rate limit: 200ms between requests
            await new Promise(r => setTimeout(r, 200));
        } catch (err: unknown) {
            console.error(`FAILED: ${job.filename} - ${err}`);
            failed++;
            // On rate limit, wait longer and retry once
            if (err instanceof Error && err.message.includes('429')) {
                console.log('  Rate limited, waiting 5s and retrying...');
                await new Promise(r => setTimeout(r, 5000));
                try {
                    await synthesizePhoneme(job, filePath);
                    generated++;
                    failed--; // undo the failure count
                } catch (retryErr) {
                    console.error(`  Retry also failed: ${retryErr}`);
                }
            }
        }
    }

    console.log('');
    console.log('=====================================================');
    console.log('  SUMMARY');
    console.log(`     Total requested : ${jobs.length}`);
    console.log(`     Generated       : ${generated}`);
    console.log(`     Skipped (exist) : ${skipped}`);
    console.log(`     Failed          : ${failed}`);
    console.log('=====================================================');
    if (!dryRun && failed === 0) {
        console.log('Done! Phoneme audio files saved to public/assets/audio/phonemes/');
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
