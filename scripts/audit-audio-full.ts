/**
 * Full Audio QA Script with Whisper STT Verification
 * 
 * This script:
 * 1. Checks all word MP3 files exist and are non-corrupt (size check)
 * 2. Checks all phoneme (onset/rime) files exist
 * 3. Uses Groq Whisper API to TRANSCRIBE each audio file and 
 *    compares the transcript to the expected word
 * 
 * Usage: npx tsx scripts/audit-audio-full.ts
 * 
 * Uses Groq's free Whisper API (faster & free):
 *   https://console.groq.com → create API key → add GROQ_API_KEY to .env.local
 * 
 * If no GROQ_API_KEY, falls back to file-only checks (no transcription).
 */
import { curriculum } from '../src/data/curriculum';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(PROJECT_ROOT, 'public');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const REPORT_PATH = path.join(PROJECT_ROOT, 'docs', 'audio-qa', 'AUDIO_QA_REPORT.md');

// ─── Types ───────────────────────────────────────────────────────────────────
type IssueType = 'MISSING' | 'CORRUPT' | 'WRONG_PRONUNCIATION' | 'OK' | 'SKIP';

interface WordResult {
    unitId: string;
    word: string;
    file: string;
    exists: boolean;
    sizeBytes: number;
    transcript?: string;
    expected?: string;
    status: IssueType;
    note?: string;
}

interface PhonemeResult {
    type: 'onset' | 'rime';
    sound: string;
    file: string;
    exists: boolean;
    transcript?: string;
    status: IssueType;
}

// ─── Whisper Transcription via Groq (free, fast) ─────────────────────────────
async function transcribeWithGroq(audioPath: string): Promise<string | null> {
    if (!GROQ_API_KEY) return null;

    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath), {
        filename: path.basename(audioPath),
        contentType: 'audio/mpeg',
    });
    form.append('model', 'whisper-large-v3');
    form.append('language', 'en');
    form.append('response_format', 'json');

    try {
        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                ...form.getHeaders(),
            },
            body: form,
        });
        if (!res.ok) {
            const err = await res.text();
            console.error(`  Groq error: ${res.status} ${err.slice(0, 100)}`);
            return null;
        }
        const json = await res.json() as { text: string };
        return json.text.trim().toLowerCase().replace(/[^a-z\s]/g, '').trim();
    } catch (e) {
        return null;
    }
}

// ─── Similarity check ────────────────────────────────────────────────────────
function isPronunciationMatch(expected: string, transcript: string): boolean {
    const e = expected.toLowerCase().trim();
    const t = transcript.toLowerCase().trim();
    // Direct match or transcript contains the expected word
    return t === e || t.startsWith(e) || t.endsWith(e) || t.includes(e);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const wordResults: WordResult[] = [];
    const phonemeResults: PhonemeResult[] = [];
    const processedOnsets = new Set<string>();
    const processedRimes = new Set<string>();

    const useWhisper = !!GROQ_API_KEY;
    console.log(`\n🎙️  Groq Whisper: ${useWhisper ? '✅ ENABLED' : '❌ NOT CONFIGURED (add GROQ_API_KEY to .env.local)'}`);
    console.log(`📂 Scanning all ${curriculum.filter(u => u.words.length > 0).length} units with words...\n`);

    // ── Phase 1: Word audio files ───────────────────────────────────────────
    for (const unit of curriculum) {
        if (unit.words.length === 0) continue; // Skip review units
        
        for (const word of unit.words) {
            const filePath = path.join(PUBLIC, 'assets', 'audio', `${word.id}.mp3`);
            const exists = fs.existsSync(filePath);
            const sizeBytes = exists ? fs.statSync(filePath).size : 0;

            const result: WordResult = {
                unitId: unit.id,
                word: word.word,
                file: `${word.id}.mp3`,
                exists,
                sizeBytes,
                expected: word.word,
                status: 'OK',
            };

            if (!exists) {
                result.status = 'MISSING';
                result.note = 'File not found';
            } else if (sizeBytes < 5000) {
                result.status = 'CORRUPT';
                result.note = `File too small: ${sizeBytes} bytes`;
            } else if (useWhisper) {
                // Transcribe and compare
                process.stdout.write(`  Checking ${word.word}...`);
                try {
                    const transcript = await transcribeWithGroq(filePath);
                    result.transcript = transcript ?? '(error)';
                    if (transcript) {
                        const match = isPronunciationMatch(word.word, transcript);
                        result.status = match ? 'OK' : 'WRONG_PRONUNCIATION';
                        if (!match) {
                            result.note = `Expected: "${word.word}" — Got: "${transcript}"`;
                        }
                    } else {
                        result.status = 'SKIP';
                        result.note = 'Transcription failed (check API key)';
                    }
                } catch (e) {
                    result.status = 'SKIP';
                    result.note = 'Transcription error';
                }
                process.stdout.write(result.status === 'OK' ? ' ✅\n' : ` ❌ ${result.note}\n`);
                // Small delay to avoid rate limits
                await new Promise(r => setTimeout(r, 200));
            }

            wordResults.push(result);
        }
    }

    // ── Phase 2: Phoneme (onset/rime) audio files ────────────────────────────
    for (const unit of curriculum) {
        for (const word of unit.words) {
            if (word.onset && !processedOnsets.has(word.onset)) {
                processedOnsets.add(word.onset);
                const filePath = path.join(PUBLIC, 'assets', 'audio', 'phonemes', `onset_${word.onset.toLowerCase()}.mp3`);
                const exists = fs.existsSync(filePath);
                let transcript: string | undefined = undefined;
                let status: IssueType = exists ? 'OK' : 'MISSING';

                if (exists && useWhisper) {
                    const t = await transcribeWithGroq(filePath);
                    transcript = t ?? undefined;
                    // For onsets, we just want transcript to contain the consonant sound loosely
                    // Don't auto-fail since single consonants are tricky for Whisper
                    status = 'OK'; // Human review required for phonemes
                    await new Promise(r => setTimeout(r, 500));
                }

                phonemeResults.push({ type: 'onset', sound: word.onset, file: `onset_${word.onset.toLowerCase()}.mp3`, exists, transcript, status });
            }
            if (word.rime && !processedRimes.has(word.rime)) {
                processedRimes.add(word.rime);
                const filePath = path.join(PUBLIC, 'assets', 'audio', 'phonemes', `rime_${word.rime.toLowerCase()}.mp3`);
                const exists = fs.existsSync(filePath);
                let transcript: string | undefined = undefined;
                let status: IssueType = exists ? 'OK' : 'MISSING';

                if (exists && useWhisper) {
                    const t = await transcribeWithGroq(filePath);
                    transcript = t ?? undefined;
                    status = 'OK'; // Human review for phonemes
                    await new Promise(r => setTimeout(r, 500));
                }

                phonemeResults.push({ type: 'rime', sound: word.rime, file: `rime_${word.rime.toLowerCase()}.mp3`, exists, transcript, status });
            }
        }
    }

    // ── Phase 3: Generate report ─────────────────────────────────────────────
    const missingWords = wordResults.filter(r => r.status === 'MISSING');
    const corruptWords = wordResults.filter(r => r.status === 'CORRUPT');
    const wrongPron = wordResults.filter(r => r.status === 'WRONG_PRONUNCIATION');
    const okWords = wordResults.filter(r => r.status === 'OK');
    const missingOnsets = phonemeResults.filter(r => r.type === 'onset' && !r.exists);
    const missingRimes = phonemeResults.filter(r => r.type === 'rime' && !r.exists);

    const reportLines: string[] = [
        `# 파닉스 앱 오디오 QA 리포트`,
        ``,
        `> 생성: ${new Date().toLocaleString('ko-KR')}  `,
        `> Whisper STT 검증: ${useWhisper ? '✅ Groq Whisper-large-v3 사용' : '❌ 비활성 (GROQ_API_KEY 없음)'}`,
        ``,
        `## 📊 요약`,
        ``,
        `| 항목 | 수치 |`,
        `|------|------|`,
        `| 전체 단어 오디오 | ${wordResults.length}개 |`,
        `| ✅ 정상 | ${okWords.length}개 |`,
        `| ❌ 누락 (파일 없음) | ${missingWords.length}개 |`,
        `| ⚠️ 파일 손상 (<5KB) | ${corruptWords.length}개 |`,
        `| 🗣️ 발음 불일치 (Whisper) | ${wrongPron.length}개 |`,
        `| 🔊 누락 Onset 음소 | ${missingOnsets.length}개 |`,
        `| 🔊 누락 Rime 음소 | ${missingRimes.length}개 |`,
        ``,
    ];

    // Word results by unit
    reportLines.push(`## 📋 단어별 체크리스트`);
    reportLines.push(``);

    const byUnit = new Map<string, WordResult[]>();
    for (const r of wordResults) {
        if (!byUnit.has(r.unitId)) byUnit.set(r.unitId, []);
        byUnit.get(r.unitId)!.push(r);
    }

    for (const unit of curriculum) {
        if (!byUnit.has(unit.id)) continue;
        const unitResults = byUnit.get(unit.id)!;
        const unitOk = unitResults.filter(r => r.status === 'OK').length;
        reportLines.push(`### ${unit.id.replace('_', ' ').toUpperCase()}: ${unit.title} (${unitOk}/${unitResults.length} OK)`);
        reportLines.push(``);
        reportLines.push(`| 단어 | 한국어 | Onset | Rime | 파일 | 크기 | Whisper 전사 | 상태 |`);
        reportLines.push(`|------|--------|-------|------|------|------|-------------|------|`);

        for (const r of unitResults) {
            const wordData = unit.words.find(w => w.word === r.word);
            const onsetStr = wordData?.onset ?? '-';
            const rimeStr = wordData?.rime ?? '-';
            const meaningStr = wordData?.meaning ?? '-';
            
            const onsetFile = wordData?.onset ? path.join(PUBLIC, 'assets', 'audio', 'phonemes', `onset_${wordData.onset.toLowerCase()}.mp3`) : null;
            const rimeFile = wordData?.rime ? path.join(PUBLIC, 'assets', 'audio', 'phonemes', `rime_${wordData.rime.toLowerCase()}.mp3`) : null;
            const onsetOk = onsetFile ? (fs.existsSync(onsetFile) ? '✅' : '❌') : '-';
            const rimeOk = rimeFile ? (fs.existsSync(rimeFile) ? '✅' : '❌') : '-';

            const statusIcon = {
                'OK': '✅',
                'MISSING': '❌ MISSING',
                'CORRUPT': '⚠️ CORRUPT',
                'WRONG_PRONUNCIATION': '🗣️ MISMATCH',
                'SKIP': '⏭️ SKIP',
            }[r.status];

            const transcriptStr = r.transcript ? `\`${r.transcript.slice(0, 20)}\`` : (useWhisper ? 'error' : '-');
            const sizeStr = r.exists ? `${Math.round(r.sizeBytes / 1024)}KB` : '0';

            reportLines.push(`| **${r.word}** | ${meaningStr} | ${onsetStr} ${onsetOk} | ${rimeStr} ${rimeOk} | ${r.file} | ${sizeStr} | ${transcriptStr} | ${statusIcon} |`);
        }
        reportLines.push(``);
    }

    // Issues summary
    if (missingWords.length > 0) {
        reportLines.push(`## ❌ 누락 단어 오디오`);
        for (const r of missingWords) {
            reportLines.push(`- [ ] \`${r.file}\` (${r.unitId}: ${r.word})`);
        }
        reportLines.push(``);
    }

    if (corruptWords.length > 0) {
        reportLines.push(`## ⚠️ 손상 의심 파일`);
        for (const r of corruptWords) {
            reportLines.push(`- [ ] \`${r.file}\` — ${r.sizeBytes} 바이트 (${r.unitId}: ${r.word})`);
        }
        reportLines.push(``);
    }

    if (wrongPron.length > 0) {
        reportLines.push(`## 🗣️ 발음 불일치 (Whisper STT 검증 실패)`);
        reportLines.push(``);
        reportLines.push(`> 이 단어들은 오디오가 존재하지만, Whisper가 다른 단어로 인식했습니다.`);
        reportLines.push(``);
        for (const r of wrongPron) {
            reportLines.push(`- [ ] **${r.word}** (${r.unitId}) — 기대: \`${r.expected}\` / 인식: \`${r.transcript}\``);
        }
        reportLines.push(``);
    }

    if (missingOnsets.length > 0) {
        reportLines.push(`## 🔊 누락 Onset 음소 파일`);
        const unique = [...new Set(missingOnsets.map(r => r.file))].sort();
        for (const f of unique) {
            reportLines.push(`- [ ] \`${f}\``);
        }
        reportLines.push(``);
    }

    if (missingRimes.length > 0) {
        reportLines.push(`## 🔊 누락 Rime 음소 파일`);
        const unique = [...new Set(missingRimes.map(r => r.file))].sort();
        for (const f of unique) {
            reportLines.push(`- [ ] \`${f}\``);
        }
        reportLines.push(``);
    }

    // Phoneme transcription table
    if (useWhisper) {
        reportLines.push(`## 🔬 음소 Whisper 전사 결과 (수동 검토 필요)`);
        reportLines.push(``);
        reportLines.push(`| 파일 | 유형 | 소리 | Whisper 인식 | 상태 |`);
        reportLines.push(`|------|------|------|------------|------|`);
        for (const r of phonemeResults) {
            const icon = r.exists ? '✅' : '❌ MISSING';
            const transcriptStr = r.transcript ? `\`${r.transcript.slice(0, 25)}\`` : '-';
            reportLines.push(`| \`${r.file}\` | ${r.type} | **${r.sound}** | ${transcriptStr} | ${icon} |`);
        }
        reportLines.push(``);
    }

    reportLines.push(`---`);
    reportLines.push(`*자동 생성된 QA 보고서입니다. \`npx tsx scripts/audit-audio-full.ts\` 로 재생성 가능.*`);

    // Save report
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, reportLines.join('\n'), 'utf-8');

    console.log(`\n====== QA SUMMARY ======`);
    console.log(`✅ OK: ${okWords.length} / ${wordResults.length} word files`);
    console.log(`❌ Missing: ${missingWords.length}`);
    console.log(`⚠️  Corrupt: ${corruptWords.length}`);
    console.log(`🗣️  Pronunciation mismatch: ${wrongPron.length}`);
    console.log(`🔊 Missing onsets: ${missingOnsets.length}`);
    console.log(`🔊 Missing rimes: ${missingRimes.length}`);
    console.log(`\n📄 Full report saved to: docs/audio-qa/AUDIO_QA_REPORT.md\n`);
}

main().catch(console.error);
