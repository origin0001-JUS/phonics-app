import * as fs from 'fs';
import * as path from 'path';
import Replicate from 'replicate';

function loadEnv() {
    const p = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(p)) return;
    for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
    }
}
loadEnv();

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const img = path.join(process.cwd(), 'photo_AQADkQ5rG6J6QVZ9.jpg');
const aud = path.join(process.cwd(), 'public/assets/audio/cat.mp3');
const outDir = path.join(process.cwd(), 'pilot_lipsync_output');
fs.mkdirSync(outDir, { recursive: true });

function toUri(p: string, m: string) {
    return `data:${m};base64,${fs.readFileSync(p).toString('base64')}`;
}

async function main() {
    console.log('SadTalker 테스트: "cat"');
    console.log('요청 중... (1~2분 소요)');

    const output = await replicate.run(
        'cjwbw/sadtalker' as `${string}/${string}:${string}`,
        {
            input: {
                source_image: toUri(img, 'image/jpeg'),
                driven_audio: toUri(aud, 'audio/mpeg'),
                still_mode: true,
                preprocess: 'crop',
            },
        }
    );

    console.log('응답 타입:', typeof output);
    const raw = JSON.stringify(output);
    console.log('응답 미리보기:', raw.substring(0, 300));

    // output이 URL 문자열 또는 ReadableStream
    let url: string | null = null;
    if (typeof output === 'string') {
        url = output;
    } else if (output && typeof (output as any).url === 'string') {
        url = (output as any).url;
    } else if (output && typeof (output as any).output === 'string') {
        url = (output as any).output;
    }

    if (url && url.startsWith('http')) {
        const res = await fetch(url);
        const out = path.join(outDir, 'sadtalker_cat.mp4');
        fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
        console.log(`✅ 저장: ${out} (${(fs.statSync(out).size / 1024).toFixed(0)}KB)`);
    } else {
        // ReadableStream인 경우
        try {
            const chunks: Buffer[] = [];
            for await (const chunk of output as any) {
                chunks.push(Buffer.from(chunk));
            }
            const out = path.join(outDir, 'sadtalker_cat.mp4');
            fs.writeFileSync(out, Buffer.concat(chunks));
            console.log(`✅ 저장 (stream): ${out} (${(fs.statSync(out).size / 1024).toFixed(0)}KB)`);
        } catch {
            console.log('⚠️ 응답 형식을 파싱할 수 없습니다. raw:', raw.substring(0, 500));
        }
    }
}

main().catch(e => console.error('❌', e));
