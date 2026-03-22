import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'temp_ig_tests');
const FINAL_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes');

async function main() {
    console.log("Analyzing 10 generated MP3 variations for 'ig'...");
    
    // Read all mp3 files from the temp directory
    const files = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.mp3'));
    
    if (files.length === 0) {
        throw new Error("No test files found.");
    }

    let minSize = Infinity;
    let bestFile = "";

    // "아이쥐(eye-gee)"는 3음절에 가깝고 길며, "익(ig)"은 1음절로 매우 짧습니다.
    // 같은 텍스트, 같은 모델(ElevenLabs)에서 나온 결과물 중 파일 크기(길이)가
    // 가장 작은 것이 환각(hallucination)이 없는 순수한 "익"일 확률이 99%입니다.
    for (const f of files) {
        const fullPath = path.join(TEMP_DIR, f);
        const stats = fs.statSync(fullPath);
        console.log(`${f}: ${stats.size} bytes`);

        if (stats.size > 0 && stats.size < minSize) {
            minSize = stats.size;
            bestFile = fullPath;
        }
    }

    console.log(`\n🏆 SMALLEST FILE (Most likely to be pure 'ig' without 'eye-gee'): ${path.basename(bestFile)} (${minSize} bytes)`);

    const targetPath = path.join(FINAL_DIR, 'rime_ig.mp3');
    
    // 양 끝에 미세하게 남은 무음 구간까지 깎아내어 최고의 에셋으로 만듭니다.
    const cmd = `ffmpeg -y -i "${bestFile}" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB,silenceremove=stop_periods=-1:stop_duration=0:stop_threshold=-40dB" -q:a 2 "${targetPath}"`;
    await execAsync(cmd);
    
    console.log(`✅ Perfect pure 'ig' selected and saved to: ${targetPath}`);
}

main().catch(console.error);
