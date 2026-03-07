/**
 * ═══════════════════════════════════════════════════════════════════
 * 오디오 에셋 감사(Audit) 스크립트 — Round 12
 * ───────────────────────────────────────────────────────────────────
 *
 * `curriculum.ts`의 전체 단어/문장 목록을 읽어 실제 `public/assets/audio/`
 * 폴더에 파일이 존재하는지 검사합니다.
 *
 * ─── 실행 방법 ───
 *    cd phonics-app
 *    npx tsx scripts/audit-audio.ts
 * ═══════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ts-node/tsx 호환성을 위해 직접 TS 파일 파싱을 피사고 정규식으로 추출하거나
// ES Module import를 사용. 여기서는 정규식으로 안전하게 추출.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio');
const CURRICULUM_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'curriculum.ts');

function extractCurriculumData() {
    console.log('📖 Reading curriculum.ts...');
    const content = fs.readFileSync(CURRICULUM_PATH, 'utf-8');

    // 1. 단어 ID 추출 (w("id", ...) 포맷)
    const words = new Set<string>();
    const wordRegex = /w\(\s*["']([^"']+)["']/g;
    let match;
    while ((match = wordRegex.exec(content)) !== null) {
        words.add(match[1]);
    }

    // 2. 문장 추출
    const sentences: string[] = [];
    const microReadingRegex = /microReading:\s*\[([\s\S]*?)\]/g;
    let mrMatch;
    while ((mrMatch = microReadingRegex.exec(content)) !== null) {
        const arrStr = mrMatch[1];
        const stringRegex = /["']([^"']+)["']/g;
        let strMatch;
        while ((strMatch = stringRegex.exec(arrStr)) !== null) {
            sentences.push(strMatch[1]);
        }
    }

    return {
        words: Array.from(words),
        sentences: sentences
    };
}

// 문장을 파일명으로 안전하게 변환하는 로직 (generate-tts.ts와 동일해야 함)
function getSafeFilename(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_') // 영숫자 제외 모두 _
        .replace(/_+/g, '_')        // 연속된 _ 제거
        .replace(/^_|_$/g, '')      // 앞뒤 _ 제거
        .substring(0, 50) + '.mp3'; // 최대 길이 제한
}

async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🔍 Phonics App Audio Asset Audit');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    const data = extractCurriculumData();
    console.log(`✅ Found ${data.words.length} unique words and ${data.sentences.length} sentences in curriculum.`);

    // 물리적 파일 목록 읽기
    let physicalFiles = new Set<string>();
    if (fs.existsSync(AUDIO_DIR)) {
        physicalFiles = new Set(fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3')));
    }

    const missingWords: string[] = [];
    const missingSentences: { text: string, filename: string }[] = [];
    const usedFiles = new Set<string>();

    // 1. 단어 검사
    for (const word of data.words) {
        const filename = `${word}.mp3`;
        usedFiles.add(filename);
        if (!physicalFiles.has(filename)) {
            missingWords.push(word);
        }
    }

    // 2. 문장 검사
    for (const sentence of data.sentences) {
        const filename = getSafeFilename(sentence);
        usedFiles.add(filename);
        if (!physicalFiles.has(filename)) {
            missingSentences.push({ text: sentence, filename });
        }
    }

    // 3. 고아 파일 검사 (물리적으론 있는데 커리큘럼에서 안 씀)
    const orphans = Array.from(physicalFiles).filter(f => !usedFiles.has(f) && !f.startsWith('_'));

    // ─── 결과 출력 ───
    const totalRequired = data.words.length + data.sentences.length;
    const totalMissing = missingWords.length + missingSentences.length;

    console.log('');
    console.log('📊 Audio Coverage Report');
    console.log(`   Total required: ${totalRequired}`);
    console.log(`   ✅ Found: ${totalRequired - totalMissing}`);
    console.log(`   ❌ Missing: ${totalMissing}`);
    console.log(`   ⚠️ Orphan: ${orphans.length}`);
    console.log('');

    if (missingWords.length > 0) {
        console.log(`❌ Missing Words (${missingWords.length}):`);
        // 너무 길면 자르기
        if (missingWords.length > 30) {
            console.log(`   ${missingWords.slice(0, 30).join(', ')} ... and ${missingWords.length - 30} more`);
        } else {
            console.log(`   ${missingWords.join(', ')}`);
        }
        console.log('');
    }

    if (missingSentences.length > 0) {
        console.log(`❌ Missing Sentences (${missingSentences.length}):`);
        let count = 0;
        for (const item of missingSentences) {
            if (count++ < 15) {
                console.log(`   - "${item.text}" -> ${item.filename}`);
            }
        }
        if (missingSentences.length > 15) {
            console.log(`   ... and ${missingSentences.length - 15} more`);
        }
        console.log('');
    }

    if (orphans.length > 0) {
        console.log(`⚠️ Orphan Files (${orphans.length}):`);
        if (orphans.length > 20) {
            console.log(`   ${orphans.slice(0, 20).join(', ')} ... and ${orphans.length - 20} more`);
        } else {
            console.log(`   ${orphans.join(', ')}`);
        }
        console.log('');
    }

    console.log('═══════════════════════════════════════════════════');

    // 이 스크립트는 CI/CD에서 쓸 수 있게 missing 파일이 있으면 에러 코드 리턴 가능
    // process.exit(totalMissing > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
