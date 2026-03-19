import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const VIDEO_DIR = path.join(process.cwd(), 'public', 'assets', 'video');
const NOISE_TOLERANCE = '-35dB'; // Threshold for silence

interface TimingResult {
    file: string;
    duration: number;
    audioStart: number;
    audioEnd: number;
    prefixSilence: number;
    suffixSilence: number;
    passPrefix: boolean;
    passSuffix: boolean;
    error?: string;
}

function checkVideoTiming() {
    console.log(`\n🔍 동영상 오디오 타이밍 자동 검수 시작... (목표: 시작 여유 0.5초, 끝 여유 0.4초)`);
    console.log(`경로: ${VIDEO_DIR}\n`);

    if (!fs.existsSync(VIDEO_DIR)) {
        console.error(`❌ 폴더를 찾을 수 없습니다: ${VIDEO_DIR}`);
        return;
    }

    const files = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.mp4'));
    console.log(`총 ${files.length}개의 MP4 파일을 검사합니다.\n`);

    if (files.length === 0) return;

    // Check if ffmpeg is available
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
    } catch (e) {
        console.error('❌ FFmpeg가 설치되어 있지 않거나 환경 변수에 등록되지 않았습니다.');
        console.error('이 스크립트를 실행하려면 시스템에 FFmpeg가 필요합니다.');
        return;
    }

    const results: TimingResult[] = [];
    let passCount = 0;
    let failCount = 0;

    for (const file of files) {
        const filePath = path.join(VIDEO_DIR, file);
        try {
            // Get duration
            const durationOutput = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf-8' });
            const totalDuration = parseFloat(durationOutput.trim());

            // Run silencedetect filter
            // Output contains lines like: 
            // [silencedetect @ 0x...] silence_start: 0
            // [silencedetect @ 0x...] silence_end: 0.654
            const cmd = `ffmpeg -v info -i "${filePath}" -af silencedetect=noise=${NOISE_TOLERANCE}:d=0.1 -f null - 2>&1`;
            const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).toString();

            const silenceStarts = [...output.matchAll(/silence_start: ([\d.]+)/g)].map(m => parseFloat(m[1]));
            const silenceEnds = [...output.matchAll(/silence_end: ([\d.]+)/g)].map(m => parseFloat(m[1]));

            let audioStart = 0;
            let audioEnd = totalDuration;

            // Analyze silence to find actual audio region
            if (silenceEnds.length > 0 && silenceStarts.length > 0) {
                // If the first silence starts at ~0, audio starts when the first silence ends
                if (silenceStarts[0] < 0.1) {
                    audioStart = silenceEnds[0];
                }
                
                // If there is silence at the end, audio ends when the last silence starts
                const lastStart = silenceStarts[silenceStarts.length - 1];
                if (lastStart > audioStart && lastStart < totalDuration) {
                    audioEnd = lastStart;
                }
            } else if (silenceStarts.length === 1 && silenceStarts[0] > 0) {
                 // Only one silence block at the end
                 audioEnd = silenceStarts[0];
            } else if (silenceEnds.length === 1 && output.indexOf('silence_start: 0') === -1) {
                 // Silence only at the beginning
                 audioStart = silenceEnds[0];
            }

            const prefixSilence = audioStart;
            const suffixSilence = totalDuration - audioEnd;

            // Tolerance: allow 0.05s margin of error
            const passPrefix = prefixSilence >= 0.45;
            const passSuffix = suffixSilence >= 0.35;

            const res: TimingResult = {
                file,
                duration: totalDuration,
                audioStart,
                audioEnd,
                prefixSilence,
                suffixSilence,
                passPrefix,
                passSuffix
            };

            results.push(res);

            if (passPrefix && passSuffix) {
                passCount++;
                process.stdout.write('✅');
            } else {
                failCount++;
                process.stdout.write('❌');
            }

        } catch (e: any) {
            console.error(`\n❌ Error processing ${file}: ${e.message}`);
            results.push({
                file, duration: 0, audioStart: 0, audioEnd: 0, prefixSilence: 0, suffixSilence: 0,
                passPrefix: false, passSuffix: false, error: e.message
            });
            failCount++;
        }
    }

    console.log(`\n\n📊 완료: 총 ${files.length}개 중 [ 합격: ${passCount} | 불합격: ${failCount} ]\n`);

    if (failCount > 0) {
        console.log(`⚠️ 타이밍 규칙 불합격 파일 목록 (목표: 앞 0.5초 / 뒤 0.4초)`);
        console.log(`--------------------------------------------------------`);
        const failed = results.filter(r => !r.passPrefix || !r.passSuffix || r.error);
        failed.forEach(f => {
            if (f.error) {
                console.log(`- ${f.file}: 변환 에러`);
                return;
            }
            console.log(`- ${f.file.padEnd(15)} │ 앞 여유: ${f.prefixSilence.toFixed(2)}s ${f.passPrefix ? '✅' : '❌'} │ 뒤 여유: ${f.suffixSilence.toFixed(2)}s ${f.passSuffix ? '✅' : '❌'}`);
        });
    }

    console.log(`\n💡 립싱크 및 오디오 선명도 점검 안내`);
    console.log(`--------------------------------------------------------`);
    console.log(`스크립트는 오디오 파형을 기준으로 타이밍만 정확히 검사했습니다.`);
    console.log(`AI가 92개 영상의 '자연스러운 립싱크 여부'를 사람의 눈처럼 시각적으로 판단하는 것은 한계가 있으므로,`);
    console.log(`개발자님께서 폴더의 파일들을 빠르게 스키밍(Skimming)하시면서 립싱크가 심하게 어긋난 것만 추려내는 것을 권장합니다.`);
}

checkVideoTiming();
