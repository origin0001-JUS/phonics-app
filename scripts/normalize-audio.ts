import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio');

// 대상 LUFS 레벨 설정 (일반적인 팟캐스트/오디오북 권장 레벨 -16 ~ -14 LUFS)
const TARGET_LUFS = -15.0;

/**
 * 모든 mp3 파일을 재귀적으로 검색하는 함수
 */
function getAllAudioFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllAudioFiles(filePath, fileList);
        } else if (file.endsWith('.mp3')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

/**
 * FFmpeg loudnorm 필터를 사용하여 파일을 정규화
 * @param inputPath 원본 파일 경로
 * @param outputPath 임시 저장 경로
 */
async function normalizeFile(inputPath: string, outputPath: string) {
    try {
        // -y : 덮어쓰기 허용
        // -af "loudnorm=I=-15:TP=-1.5:LRA=11" : LUFS 정규화 필터 적용
        const cmd = `ffmpeg -y -i "${inputPath}" -af "loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11" -c:a libmp3lame -b:a 128k "${outputPath}"`;
        await execAsync(cmd);
        return true;
    } catch (err) {
        console.error(`Error normalizing ${inputPath}:`, err);
        return false;
    }
}

async function main() {
    console.log(`Searching for audio files in: ${AUDIO_DIR}`);
    const files = getAllAudioFiles(AUDIO_DIR);
    console.log(`Found ${files.length} audio files.\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = path.relative(PROJECT_ROOT, file);
        console.log(`[${i + 1}/${files.length}] Normalizing: ${relativePath}`);

        const tempFile = file.replace('.mp3', '_normalized.mp3');
        
        const success = await normalizeFile(file, tempFile);
        
        if (success) {
            // 원본 파일을 대체
            fs.renameSync(tempFile, file);
            successCount++;
        } else {
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
            failCount++;
        }
    }

    console.log(`\n=================================================`);
    console.log(`Normalization Complete!`);
    console.log(`Total: ${files.length} | Success: ${successCount} | Failed: ${failCount}`);
    console.log(`=================================================`);
}

main().catch(console.error);
