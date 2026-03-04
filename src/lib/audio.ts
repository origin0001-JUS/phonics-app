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
                // Fallback to browser SpeechSynthesis
                fallbackTTS(word);
                resolve();
            });
    });
}

/**
 * Play sentence TTS using pre-generated mp3 file (unit_XX_sentence_N.mp3).
 * Falls back to browser SpeechSynthesis.
 */
export function playSentenceAudio(unitId: string, sentenceIndex: number, sentenceText: string): Promise<void> {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') { resolve(); return; }

        const path = `/assets/audio/${unitId}_sentence_${sentenceIndex + 1}.mp3`;

        const audio = new Audio(path);
        audio.play()
            .then(() => {
                audio.onended = () => resolve();
            })
            .catch(() => {
                fallbackTTS(sentenceText);
                resolve();
            });
    });
}

/**
 * Browser SpeechSynthesis fallback.
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

        recognition.start();
    });
}

/**
 * Check if STT is supported in the current browser.
 */
export function isSTTSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
