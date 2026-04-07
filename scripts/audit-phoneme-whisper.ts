/**
 * ═══════════════════════════════════════════════════════════════════
 * Phoneme Audio QA — Whisper 기반 자동 감사
 * ───────────────────────────────────────────────────────────────────
 *
 * 192개 phoneme MP3 파일을 Groq Whisper API로 전사(transcribe)하여:
 * 1. 발음이 기대값과 일치하는지 확인 (OK/NG)
 * 2. 전체 오디오 길이 측정
 * 3. 앞뒤 공백(silence) 감지 — Whisper segment 타임스탬프 기반
 *
 * Usage: npx tsx scripts/audit-phoneme-whisper.ts [--only-ng] [--json]
 *
 * --only-ng : NG 결과만 출력
 * --json    : JSON 형태로 결과 저장 (scripts/phoneme-audit-result.json)
 * ═══════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PHONEME_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not set in .env.local');
    process.exit(1);
}

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// ─── 기대값 매핑: 각 phoneme 파일이 어떻게 들려야 하는지 ───
// Whisper transcript가 이 중 하나와 매치되면 OK

const EXPECTED: Record<string, string[]> = {
    // === Core vowels ===
    'core_ae': ['a', 'ah', 'aah', 'aa', 'æ', 'at', 'add', 'and'],
    'core_ar': ['ar', 'are', 'ah', 'r', 'ahr'],
    'core_aw': ['aw', 'ah', 'o', 'oh', 'awe'],
    'core_ay': ['ay', 'a', 'ai', 'aye', 'hey', 'eh'],
    'core_ch': ['ch', 'cha', 'chuh', 'chu', 'tch'],
    'core_ee': ['ee', 'e', 'eee', 'ea'],
    'core_eh': ['eh', 'e', 'uh', 'a'],
    'core_er': ['er', 'ur', 'ir', 'her', 'err'],
    'core_eye': ['eye', 'i', 'ai', 'aye', 'ah'],
    'core_ih': ['ih', 'i', 'it', 'in', 'is', 'ih'],
    'core_j': ['j', 'juh', 'dge', 'jah'],
    'core_ng': ['ng', 'ing', 'ung', 'eng'],
    'core_oh': ['oh', 'o', 'ow', 'ooh'],
    'core_oo': ['oo', 'ooh', 'u', 'ew'],
    'core_or': ['or', 'oar', 'ore', 'oor'],
    'core_ow': ['ow', 'ou', 'ouch', 'out'],
    'core_oy': ['oy', 'oi', 'boy', 'joy'],
    'core_sh': ['sh', 'shh', 'shush', 'sha'],
    'core_th': ['th', 'the', 'thh', 'tha'],
    'core_th_v': ['th', 'the', 'this', 'that', 'them'],
    'core_uh': ['uh', 'u', 'a', 'up', 'us'],
    'core_you': ['you', 'u', 'oo', 'yoo', 'yu'],

    // === Onsets (consonants) ===
    // 음가(phoneme sound)로 들려야 함, 글자 이름이면 NG
    'onset_b': ['buh', 'b', 'ba', 'bah', 'but', 'boo'],
    'onset_bl': ['bluh', 'bl', 'bla', 'blah', 'blue'],
    'onset_br': ['bruh', 'br', 'bra', 'brah'],
    'onset_c': ['kuh', 'k', 'ka', 'cuh', 'cu', 'ca', 'co', 'ke'],
    'onset_ch': ['chuh', 'ch', 'cha', 'chu'],
    'onset_cl': ['cluh', 'cl', 'cla', 'clah'],
    'onset_cr': ['cruh', 'cr', 'cra', 'crah'],
    'onset_d': ['duh', 'd', 'da', 'dah', 'du'],
    'onset_dr': ['druh', 'dr', 'dra', 'drah'],
    'onset_f': ['fff', 'f', 'fa', 'fuh', 'ff'],
    'onset_fl': ['fluh', 'fl', 'fla', 'flah'],
    'onset_fr': ['fruh', 'fr', 'fra', 'frah'],
    'onset_g': ['guh', 'g', 'ga', 'gah', 'gu'],
    'onset_gl': ['gluh', 'gl', 'gla', 'glah'],
    'onset_gr': ['gruh', 'gr', 'gra', 'grah'],
    'onset_h': ['huh', 'h', 'ha', 'hah', 'hu'],
    'onset_j': ['juh', 'j', 'ja', 'jah', 'ju'],
    'onset_k': ['kuh', 'k', 'ka', 'kah', 'ke'],
    'onset_l': ['lll', 'l', 'la', 'luh', 'll', 'le'],
    'onset_m': ['mmm', 'm', 'ma', 'muh', 'mm', 'hm'],
    'onset_n': ['nnn', 'n', 'na', 'nuh', 'nn', 'ne'],
    'onset_p': ['puh', 'p', 'pa', 'pah', 'pu'],
    'onset_pl': ['pluh', 'pl', 'pla', 'plah'],
    'onset_pr': ['pruh', 'pr', 'pra', 'prah'],
    'onset_r': ['rrr', 'r', 'ra', 'ruh', 'rr', 're'],
    'onset_s': ['sss', 's', 'sa', 'suh', 'ss', 'se'],
    'onset_sh': ['shh', 'sh', 'sha', 'shuh'],
    'onset_sk': ['skuh', 'sk', 'ska', 'skah'],
    'onset_sl': ['sluh', 'sl', 'sla', 'slah'],
    'onset_sm': ['smm', 'sm', 'sma', 'smuh'],
    'onset_sn': ['snn', 'sn', 'sna', 'snuh'],
    'onset_sp': ['spuh', 'sp', 'spa', 'spah'],
    'onset_spr': ['spruh', 'spr', 'spra'],
    'onset_st': ['stuh', 'st', 'sta', 'stah'],
    'onset_str': ['struh', 'str', 'stra'],
    'onset_sw': ['swuh', 'sw', 'swa', 'swah'],
    'onset_t': ['tuh', 't', 'ta', 'tah', 'tu'],
    'onset_th': ['thh', 'th', 'tha', 'thuh'],
    'onset_thr': ['thruh', 'thr', 'thra'],
    'onset_tr': ['truh', 'tr', 'tra', 'trah'],
    'onset_v': ['vvv', 'v', 'va', 'vuh', 'vv', 've'],
    'onset_w': ['wuh', 'w', 'wa', 'wah', 'wu'],
    'onset_wh': ['whuh', 'wh', 'wha', 'whah'],
    'onset_z': ['zzz', 'z', 'za', 'zuh', 'zz', 'ze'],
};

// NG patterns: 글자 이름이 나오면 무조건 NG
const LETTER_NAME_NG: Record<string, string[]> = {
    'onset_b': ['bee', 'be'],
    'onset_c': ['see', 'sea', 'cee', 'si'],
    'onset_d': ['dee', 'de'],
    'onset_f': ['ef', 'eff'],
    'onset_g': ['gee', 'ge', 'ji'],
    'onset_h': ['aitch', 'ach', 'aych'],
    'onset_j': ['jay', 'je'],
    'onset_k': ['kay', 'ke'],
    'onset_l': ['el', 'ell'],
    'onset_m': ['em'],
    'onset_n': ['en'],
    'onset_p': ['pee', 'pe'],
    'onset_r': ['are', 'ar'],
    'onset_s': ['es', 'ess'],
    'onset_t': ['tee', 'te', 'tea'],
    'onset_v': ['vee', 've'],
    'onset_w': ['double u', 'double'],
    'onset_z': ['zee', 'ze', 'zed'],
};

interface AuditResult {
    file: string;
    phoneme: string;
    type: 'core' | 'onset' | 'rime';
    transcript: string;
    expected: string[];
    status: 'OK' | 'NG' | 'WARN' | 'EMPTY';
    reason?: string;
    duration_s: number;
    speech_start_s: number;
    speech_end_s: number;
    leading_silence_s: number;
    trailing_silence_s: number;
    silence_issue: boolean;
}

async function transcribeWithWhisper(filePath: string): Promise<{
    text: string;
    segments: { start: number; end: number; text: string }[];
    duration: number;
}> {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
    formData.append('file', blob, path.basename(filePath));
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Whisper API error ${response.status}: ${errText}`);
    }

    const data = await response.json() as any;
    return {
        text: (data.text || '').trim(),
        segments: data.segments || [],
        duration: data.duration || 0,
    };
}

function classifyPhoneme(filename: string): { phoneme: string; type: 'core' | 'onset' | 'rime' } {
    const base = path.basename(filename, '.mp3');
    if (base.startsWith('core_')) return { phoneme: base, type: 'core' };
    if (base.startsWith('onset_')) return { phoneme: base, type: 'onset' };
    if (base.startsWith('rime_')) return { phoneme: base, type: 'rime' };
    return { phoneme: base, type: 'core' };
}

function checkTranscript(phoneme: string, transcript: string): { status: 'OK' | 'NG' | 'WARN' | 'EMPTY'; reason?: string } {
    const clean = transcript.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

    if (!clean || clean.length === 0) {
        return { status: 'EMPTY', reason: 'Whisper가 아무것도 인식 못함 (무음 또는 너무 짧음)' };
    }

    // Check for letter name NG first
    const ngPatterns = LETTER_NAME_NG[phoneme];
    if (ngPatterns) {
        for (const ng of ngPatterns) {
            if (clean === ng || clean.includes(ng)) {
                return { status: 'NG', reason: `글자 이름 발음됨: "${transcript}" (기대: 음가 소리)` };
            }
        }
    }

    // Check against expected values
    const expected = EXPECTED[phoneme];
    if (!expected) {
        // No expected mapping (mostly rimes) — just report transcript
        return { status: 'WARN', reason: `기대값 매핑 없음, transcript: "${transcript}"` };
    }

    for (const exp of expected) {
        if (clean === exp || clean.includes(exp) || exp.includes(clean)) {
            return { status: 'OK' };
        }
    }

    return { status: 'NG', reason: `"${transcript}" ≠ 기대값 [${expected.slice(0, 5).join(', ')}...]` };
}

async function main() {
    const args = process.argv.slice(2);
    const onlyNG = args.includes('--only-ng');
    const saveJSON = args.includes('--json');
    const filesArg = args.find(a => a.startsWith('--files='));
    const filterIds = filesArg ? filesArg.replace('--files=', '').split(',') : null;

    console.log('═══════════════════════════════════════');
    console.log('  Phoneme Audio QA — Whisper 자동 감사');
    console.log('═══════════════════════════════════════\n');

    let files = fs.readdirSync(PHONEME_DIR)
        .filter(f => f.endsWith('.mp3') && !f.includes('.bak'))
        .sort();

    if (filterIds) {
        files = files.filter(f => filterIds.some(id => f === `${id}.mp3`));
        console.log(`🔍 필터 적용: ${filterIds.length}개 ID → ${files.length}개 파일\n`);
    }

    console.log(`📁 감사 대상: ${files.length}개 phoneme 파일\n`);

    const results: AuditResult[] = [];
    let okCount = 0, ngCount = 0, warnCount = 0, emptyCount = 0;
    let silenceIssueCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(PHONEME_DIR, file);
        const { phoneme, type } = classifyPhoneme(file);

        process.stdout.write(`[${i + 1}/${files.length}] ${file} ... `);

        // Groq Whisper rate limit: 20 RPM → 4초 간격 + 429 재시도
        if (i > 0) await new Promise(r => setTimeout(r, 4000));

        try {
            let whisperResult;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    whisperResult = await transcribeWithWhisper(filePath);
                    break;
                } catch (retryErr: any) {
                    if (retryErr.message?.includes('429') && attempt < 2) {
                        console.log(`(429, waiting 10s...)`);
                        await new Promise(r => setTimeout(r, 10000));
                        continue;
                    }
                    throw retryErr;
                }
            }
            const { text, segments, duration } = whisperResult!;

            // Calculate speech timing from segments
            let speechStart = 0;
            let speechEnd = duration;
            if (segments.length > 0) {
                speechStart = segments[0].start;
                speechEnd = segments[segments.length - 1].end;
            }
            const leadingSilence = speechStart;
            const trailingSilence = Math.max(0, duration - speechEnd);

            // Silence thresholds
            const silenceIssue = leadingSilence > 0.3 || trailingSilence > 0.5;
            if (silenceIssue) silenceIssueCount++;

            // Check transcript
            const { status, reason } = checkTranscript(phoneme, text);

            const result: AuditResult = {
                file,
                phoneme,
                type,
                transcript: text,
                expected: EXPECTED[phoneme] || [],
                status,
                reason,
                duration_s: Math.round(duration * 100) / 100,
                speech_start_s: Math.round(speechStart * 100) / 100,
                speech_end_s: Math.round(speechEnd * 100) / 100,
                leading_silence_s: Math.round(leadingSilence * 100) / 100,
                trailing_silence_s: Math.round(trailingSilence * 100) / 100,
                silence_issue: silenceIssue,
            };

            results.push(result);

            if (status === 'OK') okCount++;
            else if (status === 'NG') ngCount++;
            else if (status === 'WARN') warnCount++;
            else emptyCount++;

            const icon = status === 'OK' ? '✅' : status === 'NG' ? '❌' : status === 'WARN' ? '⚠️' : '🔇';
            const silenceFlag = silenceIssue ? ' 🔕' : '';

            if (!onlyNG || status !== 'OK') {
                console.log(`${icon} "${text}" (${duration.toFixed(2)}s, speech: ${speechStart.toFixed(2)}-${speechEnd.toFixed(2)}s)${silenceFlag}${reason ? ` — ${reason}` : ''}`);
            } else {
                console.log(`${icon}`);
            }

            // Rate limiting: Groq free tier = 20 RPM → 3s between calls
            await new Promise(r => setTimeout(r, 3200));

        } catch (err: any) {
            console.log(`💥 ERROR: ${err.message}`);
            results.push({
                file, phoneme, type,
                transcript: '', expected: EXPECTED[phoneme] || [],
                status: 'NG', reason: `API 에러: ${err.message}`,
                duration_s: 0, speech_start_s: 0, speech_end_s: 0,
                leading_silence_s: 0, trailing_silence_s: 0, silence_issue: false,
            });
            ngCount++;
            // Back off on error — wait longer
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    // ─── Summary ───
    console.log('\n═══════════════════════════════════════');
    console.log('  감사 결과 요약');
    console.log('═══════════════════════════════════════');
    console.log(`  전체: ${files.length}개`);
    console.log(`  ✅ OK:    ${okCount}`);
    console.log(`  ❌ NG:    ${ngCount}`);
    console.log(`  ⚠️  WARN:  ${warnCount}`);
    console.log(`  🔇 EMPTY: ${emptyCount}`);
    console.log(`  🔕 공백 문제: ${silenceIssueCount}개 (앞>0.3s 또는 뒤>0.5s)`);

    // ─── NG 상세 목록 ───
    const ngResults = results.filter(r => r.status === 'NG');
    if (ngResults.length > 0) {
        console.log('\n── ❌ NG 파일 목록 (재생성 필요) ──');
        for (const r of ngResults) {
            console.log(`  ${r.file}: "${r.transcript}" — ${r.reason}`);
        }
    }

    // ─── 공백 문제 목록 ───
    const silenceResults = results.filter(r => r.silence_issue);
    if (silenceResults.length > 0) {
        console.log('\n── 🔕 공백 문제 파일 ──');
        for (const r of silenceResults) {
            console.log(`  ${r.file}: 총 ${r.duration_s}s, 앞 공백 ${r.leading_silence_s}s, 뒤 공백 ${r.trailing_silence_s}s`);
        }
    }

    // ─── 너무 짧은/긴 파일 ───
    const tooShort = results.filter(r => r.duration_s > 0 && r.duration_s < 0.3);
    const tooLong = results.filter(r => r.duration_s > 2.0);
    if (tooShort.length > 0) {
        console.log('\n── ⏱️ 너무 짧은 파일 (<0.3s) ──');
        for (const r of tooShort) console.log(`  ${r.file}: ${r.duration_s}s`);
    }
    if (tooLong.length > 0) {
        console.log('\n── ⏱️ 너무 긴 파일 (>2.0s) ──');
        for (const r of tooLong) console.log(`  ${r.file}: ${r.duration_s}s`);
    }

    // ─── JSON 저장 ───
    if (saveJSON) {
        const outPath = path.join(PROJECT_ROOT, 'scripts', 'phoneme-audit-result.json');
        fs.writeFileSync(outPath, JSON.stringify({
            date: new Date().toISOString(),
            total: files.length,
            ok: okCount,
            ng: ngCount,
            warn: warnCount,
            empty: emptyCount,
            silence_issues: silenceIssueCount,
            results,
        }, null, 2));
        console.log(`\n📄 결과 저장: ${outPath}`);
    }

    console.log('\n✅ 감사 완료!');

    // Exit code: NG가 있으면 1
    if (ngCount > 0) process.exit(1);
}

main().catch(console.error);
