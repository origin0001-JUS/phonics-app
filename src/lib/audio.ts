/**
 * Audio Utilities — TTS (mp3 + fallback), SFX, STT
 * ──────────────────────────────────────────────────
 * Shared across lesson, review, and home pages.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Web Speech API type declarations for cross-browser support
declare global {
    interface Window {
        webkitSpeechRecognition?: any;
        SpeechRecognition?: any;
    }
}

const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Play word TTS using pre-generated mp3 file.
 * Falls back to browser SpeechSynthesis if mp3 not found.
 */
export function playWordAudio(word: string): Promise<void> {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') { resolve(); return; }

        const path = `/assets/audio/${word.toLowerCase()}.mp3`;

        // Check cache first
        let audio = audioCache.get(path);
        if (!audio) {
            audio = new Audio(path);
            audioCache.set(path, audio);
        }

        audio.currentTime = 0;
        audio.play()
            .then(() => {
                audio!.onended = () => resolve();
            })
            .catch(() => {
                console.warn(`⚠️ Missing audio: ${word}.mp3 — falling back to browser TTS`);
                fallbackTTS(word);
                resolve();
            });
    });
}

/**
 * Convert sentence text to safe filename (must match generate-tts.ts logic).
 */
function getSafeFilename(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 50) + '.mp3';
}

export function playSentenceAudio(unitId: string, sentenceIndex: number, sentenceText: string): { promise: Promise<void>, audio: HTMLAudioElement | null } {
    let audioRef: HTMLAudioElement | null = null;
    const promise = new Promise<void>((resolve) => {
        if (typeof window === 'undefined') { resolve(); return; }

        const filename = getSafeFilename(sentenceText);
        const path = `/assets/audio/${filename}`;

        const audio = new Audio(path);
        audioRef = audio;
        audio.play()
            .then(() => {
                audio.onended = () => resolve();
            })
            .catch(() => {
                console.warn(`⚠️ Missing audio: ${path} — falling back to browser TTS`);
                fallbackTTS(sentenceText);
                resolve();
            });
    });
    return { promise, audio: audioRef };
}

/**
 * Browser SpeechSynthesis fallback.
 * This should rarely be called in production — all words/sentences
 * should have pre-generated ElevenLabs MP3 files in public/assets/audio/.
 * If this is being called frequently, run `npx tsx scripts/audit-audio.ts`
 * to identify missing audio files.
 */
export function fallbackTTS(text: string): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.75;
        window.speechSynthesis.speak(u);
    }
}

// ─── Sound Effects ───

type SFXType = 'correct' | 'wrong' | 'complete' | 'tap' | 'flip' | 'trophy';

/**
 * Procedurally generate sound effects using Web Audio API.
 * No external files needed — all synthesized on the fly.
 */
export function playSFX(type: SFXType): void {
    if (typeof window === 'undefined') return;

    try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        switch (type) {
            case 'correct':
                playTone(ctx, 523.25, 0.1, 'sine');   // C5
                setTimeout(() => playTone(ctx, 659.25, 0.1, 'sine'), 100);  // E5
                setTimeout(() => playTone(ctx, 783.99, 0.15, 'sine'), 200); // G5
                break;
            case 'wrong':
                playTone(ctx, 200, 0.15, 'sawtooth');
                setTimeout(() => playTone(ctx, 150, 0.2, 'sawtooth'), 150);
                break;
            case 'complete':
                playTone(ctx, 523.25, 0.1, 'sine');    // C5
                setTimeout(() => playTone(ctx, 587.33, 0.1, 'sine'), 100);  // D5
                setTimeout(() => playTone(ctx, 659.25, 0.1, 'sine'), 200);  // E5
                setTimeout(() => playTone(ctx, 783.99, 0.1, 'sine'), 300);  // G5
                setTimeout(() => playTone(ctx, 1046.5, 0.2, 'sine'), 400);  // C6
                break;
            case 'tap':
                playTone(ctx, 800, 0.05, 'sine');
                break;
            case 'flip':
                playTone(ctx, 400, 0.05, 'sine');
                setTimeout(() => playTone(ctx, 600, 0.05, 'sine'), 50);
                break;
            case 'trophy':
                playTone(ctx, 523.25, 0.08, 'sine');
                setTimeout(() => playTone(ctx, 659.25, 0.08, 'sine'), 80);
                setTimeout(() => playTone(ctx, 783.99, 0.08, 'sine'), 160);
                setTimeout(() => playTone(ctx, 1046.5, 0.08, 'sine'), 240);
                setTimeout(() => playTone(ctx, 1318.5, 0.15, 'sine'), 320);
                setTimeout(() => playTone(ctx, 1046.5, 0.2, 'sine'), 450);
                break;
        }
    } catch {
        // Audio context not available — silently ignore
    }
}

function playTone(
    ctx: AudioContext,
    frequency: number,
    duration: number,
    waveType: OscillatorType
): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

// ─── Audio Preload (mobile first-tap silence fix) ───

/**
 * Preload audio files in the background so they play instantly on first tap.
 * On mobile browsers, the first Audio.play() can be silent or delayed
 * because the file hasn't been fetched yet. This forces an early fetch.
 */
export function preloadAudioFiles(urls: string[]): void {
    if (typeof window === 'undefined') return;
    for (const url of urls) {
        if (audioCache.has(url)) continue;
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.load();
        audioCache.set(url, audio);
    }
}

// ─── STT (Speech-to-Text) via Web Speech API ───

export interface STTResult {
    transcript: string;
    confidence: number;
    matched: boolean;
}

/**
 * Listen for speech and compare to the target word.
 * Returns a promise that resolves with the STT result.
 * Timeout after `timeoutMs` milliseconds (default 4000).
 */
export function listenAndCompare(
    targetWord: string,
    timeoutMs = 4000
): Promise<STTResult> {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve({ transcript: '', confidence: 0, matched: false });
            return;
        }

        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionCtor) {
            // Browser doesn't support STT — simulate a pass
            setTimeout(() => {
                resolve({ transcript: targetWord, confidence: 0.5, matched: true });
            }, 1500);
            return;
        }

        const recognition = new SpeechRecognitionCtor();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;

        let settled = false;

        const timeout = setTimeout(() => {
            if (!settled) {
                settled = true;
                recognition.stop();
                resolve({ transcript: '', confidence: 0, matched: false });
            }
        }, timeoutMs);

        recognition.onresult = (event: any) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);

            const target = targetWord.toLowerCase().trim();

            // Check all alternatives for a match
            for (let i = 0; i < event.results[0].length; i++) {
                const alt = event.results[0][i];
                const transcript = alt.transcript.toLowerCase().trim();
                if (transcript === target || transcript.includes(target) || target.includes(transcript)) {
                    resolve({
                        transcript: alt.transcript,
                        confidence: alt.confidence,
                        matched: true,
                    });
                    return;
                }
            }

            // No match found — return best result
            const best = event.results[0][0];
            resolve({
                transcript: best.transcript,
                confidence: best.confidence,
                matched: false,
            });
        };

        recognition.onerror = () => {
            if (!settled) {
                settled = true;
                clearTimeout(timeout);
                // On error, be lenient — treat as pass for kids
                resolve({ transcript: '', confidence: 0, matched: true });
            }
        };

        recognition.onend = () => {
            if (!settled) {
                settled = true;
                clearTimeout(timeout);
                resolve({ transcript: '', confidence: 0, matched: false });
            }
        };

        try {
            recognition.start();
        } catch (err) {
            console.warn("SpeechRecognition start failed:", err);
            if (!settled) {
                settled = true;
                clearTimeout(timeout);
                // On error, be lenient — treat as pass for kids
                resolve({ transcript: '', confidence: 0, matched: true });
            }
        }
    });
}

/**
 * Check if STT is supported in the current browser.
 */
export function isSTTSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
