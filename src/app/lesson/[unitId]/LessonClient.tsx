"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { getUnitById, curriculum, microReadingKoMap, type WordData } from "@/data/curriculum";
import { saveLessonResults, type WordResult } from "@/lib/lessonService";
import { REWARDS } from "@/data/rewards";
import { playWordAudio, playSentenceAudio, playSFX, fallbackTTS, listenAndCompare, isSTTSupported, preloadAudioFiles, type STTResult } from "@/lib/audio";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, Volume2, ArrowRight, Check,
    Mic, BookOpen, Star, Trophy, CheckCircle, XCircle
} from "lucide-react";
import VisemeAvatar from "./VisemeAvatar";

// ─── Minimal Pairs Data (for Sound Focus quiz) ───
const MINIMAL_PAIRS: { units: string[]; label: string; items: [string, string][] }[] = [
    { units: ["unit_01", "unit_02"], label: "a vs e", items: [["bat","bet"],["hat","het"],["pan","pen"],["man","men"],["bad","bed"]] },
    { units: ["unit_02", "unit_03"], label: "e vs i", items: [["bed","bid"],["pet","pit"],["net","nit"],["pen","pin"],["set","sit"]] },
    { units: ["unit_03", "unit_04"], label: "i vs o", items: [["dig","dog"],["hip","hop"],["hit","hot"],["big","bog"]] },
    { units: ["unit_04", "unit_05"], label: "o vs u", items: [["hot","hut"],["cop","cup"],["pot","put"],["dog","dug"]] },
    { units: ["unit_07"], label: "short a vs long a", items: [["cap","cape"],["tap","tape"],["hat","hate"],["mat","mate"],["can","cane"]] },
    { units: ["unit_08"], label: "short i vs long i", items: [["bit","bite"],["hid","hide"],["kit","kite"],["pin","pine"],["dim","dime"]] },
    { units: ["unit_09"], label: "short o vs long o", items: [["hop","hope"],["not","note"],["rod","rode"],["cop","cope"]] },
    { units: ["unit_10"], label: "short u vs long u", items: [["cub","cube"],["tub","tube"],["cut","cute"],["hug","huge"]] },
    { units: ["unit_17"], label: "ch vs sh", items: [["chip","ship"],["chop","shop"],["chin","shin"],["cheap","sheep"]] },
    { units: ["unit_19"], label: "th vs s", items: [["think","sink"],["thick","sick"],["thin","sin"]] },
];

function getMinimalPairsForUnit(unitId: string): { label: string; items: [string, string][] } | null {
    const found = MINIMAL_PAIRS.find(mp => mp.units.includes(unitId));
    return found ? { label: found.label, items: found.items } : null;
}

// ─── Color Coding Utility (Task 11-C) ───
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const BLENDS_DIGRAPHS = new Set(['sh', 'ch', 'th', 'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'wh', 'wr', 'ng', 'nk', 'ck', 'qu']);
const IPA_VOWELS = new Set(['æ', 'ɛ', 'ɪ', 'ɒ', 'ʌ', 'eɪ', 'aɪ', 'oʊ', 'juː', 'uː', 'iː', 'ɑːr', 'ɔːr', 'ɜːr', 'ɔɪ', 'aʊ']);

type PhonemeCategory = 'vowel' | 'consonant' | 'blend' | 'silent_e' | 'rime';

function getPhonemeCategory(phonemeOrLetter: string, context?: { isRime?: boolean; isSilentE?: boolean }): PhonemeCategory {
    if (context?.isRime) return 'rime';
    if (context?.isSilentE) return 'silent_e';
    const lower = phonemeOrLetter.toLowerCase();
    if (BLENDS_DIGRAPHS.has(lower)) return 'blend';
    if (VOWELS.has(lower) || IPA_VOWELS.has(lower)) return 'vowel';
    return 'consonant';
}

function getPhonemeColorClass(category: PhonemeCategory): string {
    switch (category) {
        case 'vowel': return 'text-red-500';
        case 'consonant': return 'text-blue-600';
        case 'blend': return 'text-emerald-600';
        case 'silent_e': return 'text-gray-300 opacity-50';
        case 'rime': return 'text-amber-600';
    }
}

// ─── Step Types ───
type LessonStep =
    | "sound_focus"
    | "blend_tap"
    | "decode_words"
    | "say_check"
    | "micro_reader"
    | "exit_ticket"
    | "results";

const STEP_ORDER: LessonStep[] = [
    "sound_focus",
    "blend_tap",
    "decode_words",
    "say_check",
    "micro_reader",
    "exit_ticket",
    "results",
];

const STEP_LABELS: Record<LessonStep, string> = {
    sound_focus: "Sound Focus",
    blend_tap: "Blend & Tap",
    decode_words: "Decode Words",
    say_check: "Say & Check",
    micro_reader: "Micro-Reader",
    exit_ticket: "Exit Ticket",
    results: "Results",
};

// ─── Main Lesson Page ───
export default function LessonPage() {
    const params = useParams();
    const router = useRouter();
    const unitId = params.unitId as string;
    const unit = useMemo(() => getUnitById(unitId), [unitId]);

    const [stepIndex, setStepIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [newRewards, setNewRewards] = useState<string[]>([]);
    const wordResultsRef = useRef<Map<string, WordResult>>(new Map());
    const lessonStartRef = useRef<number>(0);

    useEffect(() => {
        lessonStartRef.current = Date.now();
    }, []);

    // ─── Task 13-D: Restore lesson state from sessionStorage ───
    const sessionKey = `lesson_state_${unitId}`;
    const [sessionRestored, setSessionRestored] = useState(false);
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(sessionKey);
            if (saved) {
                const state = JSON.parse(saved);
                if (typeof state.stepIndex === 'number') setStepIndex(state.stepIndex);
                if (typeof state.score === 'number') setScore(state.score);
                if (typeof state.totalQuestions === 'number') setTotalQuestions(state.totalQuestions);
            }
        } catch { /* ignore */ }
        setSessionRestored(true);
    }, [sessionKey]);

    // ─── Task 13-D: Save lesson state to sessionStorage on change ───
    useEffect(() => {
        if (!sessionRestored) return;
        try {
            sessionStorage.setItem(sessionKey, JSON.stringify({ stepIndex, score, totalQuestions }));
        } catch { /* ignore */ }
    }, [stepIndex, score, totalQuestions, sessionKey, sessionRestored]);

    const currentStep = STEP_ORDER[stepIndex];
    const progress = ((stepIndex) / (STEP_ORDER.length - 1)) * 100;

    const recordWordAttempt = useCallback((wordId: string, correct: boolean) => {
        const map = wordResultsRef.current;
        const existing = map.get(wordId);
        if (existing) {
            existing.attempts += 1;
            if (correct) existing.correct += 1;
        } else {
            map.set(wordId, { wordId, unitId, attempts: 1, correct: correct ? 1 : 0 });
        }
    }, [unitId]);

    const goNext = useCallback(() => {
        if (stepIndex < STEP_ORDER.length - 1) {
            setStepIndex((i) => i + 1);
        }
    }, [stepIndex]);

    const addScore = useCallback((wordId: string, correct: boolean) => {
        setTotalQuestions((t) => t + 1);
        if (correct) setScore((s) => s + 1);
        recordWordAttempt(wordId, correct);
    }, [recordWordAttempt]);

    // Pick 6 words for lesson activities (safe even if unit is undefined)
    const lessonWords = useMemo(() => {
        if (unit && unit.words.length > 0) {
            return unit.words.slice(0, 6);
        }
        // Review unit — gather words from prerequisite units
        if (unit) {
            const prereqMap: Record<number, number[]> = {
                6: [1, 2, 3, 4, 5],
                12: [7, 8, 9, 10, 11],
                18: [13, 14, 15, 16, 17],
                24: [19, 20, 21, 22, 23],
            };
            const prereqs = prereqMap[unit.unitNumber] ?? [];
            const allWords = prereqs.flatMap(num => {
                const u = curriculum.find(c => c.unitNumber === num);
                return u?.words ?? [];
            });
            const shuffled = [...allWords].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, 6);
        }
        return [];
    }, [unit]);

    // ─── Task 13-B: Preload audio for lesson words + minimal pairs ───
    useEffect(() => {
        const urls: string[] = [];
        for (const w of lessonWords) {
            urls.push(`/assets/audio/${w.id}.mp3`);
        }
        // Also preload minimal pair words if available
        const mpData = unit?.id ? getMinimalPairsForUnit(unit.id) : null;
        if (mpData) {
            for (const [a, b] of mpData.items) {
                urls.push(`/assets/audio/${a.toLowerCase()}.mp3`);
                urls.push(`/assets/audio/${b.toLowerCase()}.mp3`);
            }
        }
        preloadAudioFiles(urls);
    }, [lessonWords, unit]);

    // Save lesson results when entering Results step
    const handleLessonComplete = useCallback(() => {
        // Task 13-D: Clear session storage on lesson completion
        try { sessionStorage.removeItem(sessionKey); } catch { /* ignore */ }

        // Ensure all lesson words have at least an entry (even without quiz)
        for (const word of lessonWords) {
            if (!wordResultsRef.current.has(word.id)) {
                wordResultsRef.current.set(word.id, {
                    wordId: word.id, unitId, attempts: 0, correct: 0,
                });
            }
        }
        const durationMinutes = Math.round((Date.now() - lessonStartRef.current) / 60000);
        const pct = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
        const isPerfect = pct >= 90;
        saveLessonResults({
            unitId,
            wordResults: wordResultsRef.current,
            durationMinutes,
            completedSteps: STEP_ORDER.filter((_, i) => i < STEP_ORDER.length - 1),
        }, isPerfect).then((unlocked) => {
            if (unlocked.length > 0) setNewRewards(unlocked);
        }).catch(console.error);
    }, [unitId, lessonWords, score, totalQuestions, sessionKey]);

    if (!unit) {
        return (
            <main className="flex-1 flex items-center justify-center z-10 relative">
                <p className="text-white font-bold text-xl">Unit not found</p>
            </main>
        );
    }

    return (
        <main className="flex-1 flex flex-col relative z-10">
            {/* Top Bar */}
            {currentStep !== "results" && (
                <header className="flex items-center gap-3 px-5 pt-6 pb-3">
                    <button
                        onClick={() => router.push("/units")}
                        className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>

                    {/* Progress Bar */}
                    <div className="flex-1 h-4 bg-white/30 rounded-full overflow-hidden border-2 border-white/50">
                        <div
                            className="h-full bg-[#fcd34d] rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <span className="text-white font-bold text-sm drop-shadow-sm">
                        {stepIndex + 1}/{STEP_ORDER.length - 1}
                    </span>
                </header>
            )}

            {/* Step Label */}
            {currentStep !== "results" && (
                <div className="px-5 mb-3">
                    <span className="bg-white/20 text-white font-bold text-xs px-3 py-1.5 rounded-full">
                        {STEP_LABELS[currentStep]}
                    </span>
                </div>
            )}

            {/* Step Content */}
            <div className="flex-1 px-5 pb-6 flex flex-col">
                {currentStep === "sound_focus" && (
                    <SoundFocusStep unit={unit} words={lessonWords} onNext={goNext} />
                )}
                {currentStep === "blend_tap" && (
                    <BlendTapStep words={lessonWords} onNext={goNext} />
                )}
                {currentStep === "decode_words" && (
                    <DecodeWordsStep words={lessonWords} onNext={goNext} addScore={addScore} />
                )}
                {currentStep === "say_check" && (
                    <SayCheckStep words={lessonWords} onNext={goNext} />
                )}
                {currentStep === "micro_reader" && (
                    <MicroReaderStep sentences={unit.microReading} sentencesKo={microReadingKoMap[unit.id]} onNext={goNext} />
                )}
                {currentStep === "exit_ticket" && (
                    <ExitTicketStep words={lessonWords} onNext={goNext} addScore={addScore} />
                )}
                {currentStep === "results" && (
                    <ResultsStep score={score} total={totalQuestions} unitTitle={unit.title} onFinish={() => router.push("/units")} onMount={handleLessonComplete} newRewards={newRewards} />
                )}
            </div>
        </main>
    );
}

// ─── Shuffle Utility ───
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Shared Button ───
function BigButton({ children, onClick, color = "bg-[#fcd34d]", shadow = "shadow-[0_6px_0_#d97706]" }: {
    children: React.ReactNode;
    onClick: () => void;
    color?: string;
    shadow?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full ${color} text-amber-900 font-black text-lg py-4 rounded-2xl ${shadow} active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2`}
        >
            {children}
        </button>
    );
}

function playTTS(text: string) {
    playWordAudio(text);
}

/** Map IPA phonemes to speakable approximations for TTS */
const PHONEME_SPEAK_MAP: Record<string, string> = {
    'æ': 'ah', 'ɛ': 'eh', 'ɪ': 'ih', 'ɒ': 'aw', 'ʌ': 'uh',
    'eɪ': 'ay', 'aɪ': 'eye', 'oʊ': 'oh', 'juː': 'you', 'uː': 'oo',
    'iː': 'ee', 'ɑːr': 'ar', 'ɔːr': 'or', 'ɜːr': 'er',
    'ɔɪ': 'oy', 'aʊ': 'ow',
    'ʃ': 'sh', 'tʃ': 'ch', 'θ': 'th', 'ð': 'th',
    'dʒ': 'j', 'ŋ': 'ng',
};

function playPhonemeSound(phoneme: string) {
    const text = PHONEME_SPEAK_MAP[phoneme] || phoneme;
    fallbackTTS(text);
}

// ═══════════════════════════════════════
// STEP 1: Sound Focus (1 min)
// ═══════════════════════════════════════
function SoundFocusStep({ unit, words, onNext }: { unit: { targetSound: string; title: string; id?: string }; words: WordData[]; onNext: () => void }) {
    const exampleWord = words[0];
    const minimalPairData = useMemo(() => unit.id ? getMinimalPairsForUnit(unit.id) : null, [unit.id]);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizIdx, setQuizIdx] = useState(0);
    const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
    const [showQuizResult, setShowQuizResult] = useState(false);

    const quizItems = useMemo(() => {
        if (!minimalPairData) return [];
        return shuffle(minimalPairData.items).slice(0, 3);
    }, [minimalPairData]);

    const handleQuizPlay = (word: string) => {
        playTTS(word);
    };

    const handleQuizAnswer = (chosen: string, correct: string) => {
        if (showQuizResult) return;
        setQuizAnswer(chosen);
        setShowQuizResult(true);
        playSFX(chosen === correct ? 'correct' : 'wrong');
    };

    const handleQuizNext = () => {
        if (quizIdx < quizItems.length - 1) {
            setQuizIdx(i => i + 1);
            setQuizAnswer(null);
            setShowQuizResult(false);
        } else {
            onNext();
        }
    };

    // Task 13-E: Pre-compute random correct word per quiz item (stable across re-renders)
    const quizCorrectIndices = useMemo(() => {
        return quizItems.map(() => Math.random() < 0.5 ? 0 : 1);
    }, [quizItems]);

    // Show quiz after initial sound intro
    if (showQuiz && quizItems.length > 0) {
        const pair = quizItems[quizIdx];
        const correctWord = pair[quizCorrectIndices[quizIdx]];
        const options = shuffle([pair[0], pair[1]]);

        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                    <p className="text-slate-400 font-bold text-sm mb-1">Minimal Pair Quiz</p>
                    <p className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-4">{minimalPairData!.label}</p>

                    {/* Play button */}
                    <button
                        onClick={() => handleQuizPlay(correctWord)}
                        className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg active:scale-95 transition-transform"
                    >
                        <Volume2 className="w-10 h-10 text-white" />
                    </button>
                    <p className="text-slate-500 font-medium text-sm mb-6">Tap to listen, then pick the word!</p>

                    {/* 2-choice buttons */}
                    <div className="flex gap-4 w-full">
                        {options.map((opt) => {
                            let cls = "bg-slate-50 border-slate-200 text-slate-700 shadow-[0_4px_0_#cbd5e1]";
                            if (showQuizResult && opt === correctWord) {
                                cls = "bg-green-100 border-green-400 text-green-800 shadow-[0_4px_0_#16a34a]";
                            } else if (showQuizResult && opt === quizAnswer && opt !== correctWord) {
                                cls = "bg-red-100 border-red-400 text-red-700 shadow-[0_4px_0_#dc2626]";
                            }
                            return (
                                <button
                                    key={opt}
                                    onClick={() => handleQuizAnswer(opt, correctWord)}
                                    className={`flex-1 py-4 rounded-2xl font-black text-xl border-4 transition-all active:scale-95 ${cls}`}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>

                    {/* Task 13-E: Compare Sounds — shown after answering */}
                    {showQuizResult && (
                        <div className="mt-5 w-full">
                            <p className="text-slate-400 font-bold text-xs text-center mb-2">Compare Sounds</p>
                            <div className="flex gap-3 w-full">
                                {[pair[0], pair[1]].map((w) => (
                                    <button
                                        key={w}
                                        onClick={() => playTTS(w)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold active:scale-95 transition-transform"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                        {w}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-white/70 font-bold text-sm">{quizIdx + 1} / {quizItems.length}</p>

                {showQuizResult && (
                    <BigButton onClick={handleQuizNext}>
                        {quizIdx < quizItems.length - 1 ? <>Next <ArrowRight className="w-5 h-5" /></> : <>Continue <ArrowRight className="w-5 h-5" /></>}
                    </BigButton>
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {/* Giant Sound Display */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 w-full max-w-xs shadow-[0_10px_0_#e2e8f0] dark:shadow-[0_10px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                <p className="text-slate-400 dark:text-slate-500 font-bold mb-2">Today&apos;s Sound</p>
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-6xl font-black text-white drop-shadow-md">
                        {unit.title.split(" ").pop()}
                    </span>
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">{unit.title}</p>
                <p className="text-slate-500 font-medium text-sm">/{unit.targetSound}/</p>
            </div>

            {/* Listen Button */}
            {exampleWord && (
                <button
                    onClick={() => playTTS(exampleWord.word)}
                    className="flex items-center gap-3 bg-white/40 px-6 py-3 rounded-full"
                >
                    <Volume2 className="w-6 h-6 text-white" />
                    <span className="text-white font-bold">Listen: &quot;{exampleWord.word}&quot;</span>
                </button>
            )}

            <BigButton onClick={minimalPairData ? () => setShowQuiz(true) : onNext}>
                Next <ArrowRight className="w-5 h-5" />
            </BigButton>
        </div>
    );
}

// ═══════════════════════════════════════
// STEP 2: Blend & Tap (2 min)
// ═══════════════════════════════════════
function BlendTapStep({ words, onNext }: { words: WordData[]; onNext: () => void }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [tappedPhonemes, setTappedPhonemes] = useState<number[]>([]);
    const [onsetTapped, setOnsetTapped] = useState(false);
    const [rimeTapped, setRimeTapped] = useState(false);
    const [merging, setMerging] = useState(false);
    const word = words[currentIdx];

    const useOnsetRime = !!(word.onset && word.rime);

    // Find words sharing the same rime in this word set
    const wordFamily = useMemo(() => {
        if (!word.wordFamily) return [];
        return words
            .filter(w => w.wordFamily === word.wordFamily && w.id !== word.id)
            .map(w => w.word);
    }, [word, words]);

    const tapPhoneme = (idx: number) => {
        if (!tappedPhonemes.includes(idx)) {
            setTappedPhonemes([...tappedPhonemes, idx]);
            playPhonemeSound(word.phonemes[idx]);
        }

        if (tappedPhonemes.length + 1 === word.phonemes.length) {
            setTimeout(() => playSFX('correct'), 600);
            setTimeout(() => playTTS(word.word), 1200);
        }
    };

    // Task 13-C: Independent onset tap — plays onset sound only
    const tapOnset = () => {
        if (onsetTapped) return;
        setOnsetTapped(true);
        fallbackTTS(word.onset!);
    };

    // Task 13-C: Independent rime tap — plays rime sound only
    const tapRime = () => {
        if (rimeTapped) return;
        setRimeTapped(true);
        fallbackTTS(word.rime!);
    };

    // Task 13-C: When both onset and rime are tapped, merge and play full word
    useEffect(() => {
        if (onsetTapped && rimeTapped && !merging) {
            setMerging(true);
            setTimeout(() => playSFX('correct'), 400);
            setTimeout(() => playTTS(word.word), 800);
        }
    }, [onsetTapped, rimeTapped, merging, word.word]);

    const handleNext = () => {
        if (currentIdx < Math.min(words.length, 4) - 1) {
            setCurrentIdx((i) => i + 1);
            setTappedPhonemes([]);
            setOnsetTapped(false);
            setRimeTapped(false);
            setMerging(false);
        } else {
            onNext();
        }
    };

    const allTapped = useOnsetRime ? (onsetTapped && rimeTapped) : tappedPhonemes.length === word.phonemes.length;

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                <p className="text-slate-400 font-bold mb-4 text-sm">
                    {useOnsetRime ? "Tap both parts to blend!" : "Tap each sound!"} 👆
                </p>
                <p className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-1">{word.meaning}</p>

                {useOnsetRime ? (
                    /* Onset-Rime Mode (2 tiles) */
                    <div className="flex gap-4 my-6 items-center">
                        {/* Onset tile */}
                        <button
                            onClick={tapOnset}
                            className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black transition-all border-4 ${onsetTapped
                                ? "bg-green-400 border-green-500 text-white scale-110 shadow-[0_4px_0_#16a34a]"
                                : `bg-blue-50 border-blue-200 shadow-[0_4px_0_#93c5fd] ${getPhonemeColorClass(getPhonemeCategory(word.onset!, { isRime: false }))}`
                            } active:scale-95`}
                        >
                            {word.onset}
                        </button>

                        <span className="text-2xl font-black text-white/60">+</span>

                        {/* Rime tile (interactive button) */}
                        <button
                            onClick={tapRime}
                            className={`w-24 h-20 rounded-2xl flex items-center justify-center text-3xl font-black transition-all border-4 ${rimeTapped
                                ? "bg-green-400 border-green-500 text-white scale-110 shadow-[0_4px_0_#16a34a]"
                                : `bg-amber-50 border-amber-200 shadow-[0_4px_0_#fbbf24] ${getPhonemeColorClass('rime')}`
                            } active:scale-95`}
                        >
                            {word.rime}
                        </button>
                    </div>
                ) : (
                    /* Phoneme Mode (n tiles) with color coding */
                    <div className="flex gap-3 my-6">
                        {word.phonemes.map((p, i) => {
                            const isTapped = tappedPhonemes.includes(i);
                            const category = getPhonemeCategory(p);
                            const colorClass = getPhonemeColorClass(category);
                            return (
                                <button
                                    key={i}
                                    onClick={() => tapPhoneme(i)}
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black transition-all border-4 ${isTapped
                                        ? "bg-green-400 border-green-500 text-white scale-110 shadow-[0_4px_0_#16a34a]"
                                        : `bg-slate-100 border-slate-200 shadow-[0_4px_0_#cbd5e1] ${colorClass}`
                                    } active:scale-95`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Blended result */}
                {allTapped && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl px-6 py-3 flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="font-black text-green-700 text-xl">{word.word}</span>
                    </div>
                )}

                {/* Word Family display (onset-rime mode) */}
                {useOnsetRime && word.wordFamily && (
                    <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">{word.wordFamily} family</p>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                            {[word.word, ...wordFamily].join(', ')}
                        </p>
                    </div>
                )}
            </div>

            <p className="text-white/70 font-bold text-sm">{currentIdx + 1} / {Math.min(words.length, 4)}</p>

            <BigButton onClick={handleNext}>
                {allTapped ? <>Next <ArrowRight className="w-5 h-5" /></> : useOnsetRime ? "Tap both parts!" : "Tap the sounds!"}
            </BigButton>
        </div>
    );
}

// ═══════════════════════════════════════
// STEP 3: Decode Words — Match word to meaning (3 min)
// ═══════════════════════════════════════
function DecodeWordsStep({ words, onNext, addScore }: { words: WordData[]; onNext: () => void; addScore: (wordId: string, c: boolean) => void }) {
    const [idx, setIdx] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const word = words[idx];

    // Shuffle 3 wrong + 1 correct
    const options = useMemo(() => {
        const others = words.filter((w) => w.id !== word.id).slice(0, 3);
        const all = [...others.map((o) => o.meaning), word.meaning];
        return shuffle(all);
    }, [idx, word, words]);

    const handleSelect = (opt: string) => {
        if (showResult) return;
        setSelected(opt);
        setShowResult(true);
        const correct = opt === word.meaning;
        addScore(word.id, correct);
        playSFX(correct ? 'correct' : 'wrong');
        setTimeout(() => playTTS(word.word), 500);
    };

    const handleNext = () => {
        if (idx < words.length - 1) {
            setIdx((i) => i + 1);
            setSelected(null);
            setShowResult(false);
        } else {
            onNext();
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                <p className="text-slate-400 font-bold text-sm mb-2">What does this word mean?</p>

                {/* Big word display */}
                <button onClick={() => playTTS(word.word)} className="flex items-center gap-2 mb-6">
                    <span className="text-4xl font-black text-slate-800">{word.word}</span>
                    <Volume2 className="w-6 h-6 text-sky-400" />
                </button>

                {/* Options Grid */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    {options.map((opt) => {
                        let btnClass = "bg-slate-50 border-slate-200 text-slate-700 shadow-[0_4px_0_#cbd5e1]";
                        if (showResult && opt === word.meaning) {
                            btnClass = "bg-green-100 border-green-400 text-green-800 shadow-[0_4px_0_#16a34a]";
                        } else if (showResult && opt === selected && opt !== word.meaning) {
                            btnClass = "bg-red-100 border-red-400 text-red-700 shadow-[0_4px_0_#dc2626]";
                        }
                        return (
                            <button
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                className={`py-4 rounded-2xl font-bold border-4 transition-all active:scale-95 ${btnClass}`}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className="text-white/70 font-bold text-sm">{idx + 1} / {words.length}</p>

            {showResult && (
                <BigButton onClick={handleNext}>
                    {selected === word.meaning ? "Correct! 🎉" : "Got it!"} <ArrowRight className="w-5 h-5" />
                </BigButton>
            )}
        </div>
    );
}

// ═══════════════════════════════════════
// STEP 4: Say & Check (2 min) — Real STT
// ═══════════════════════════════════════
function SayCheckStep({ words, onNext }: { words: WordData[]; onNext: () => void }) {
    const [idx, setIdx] = useState(0);
    const [listening, setListening] = useState(false);
    const [result, setResult] = useState<STTResult | null>(null);
    const [sttAvailable] = useState(() => isSTTSupported());
    const [isSpeaking, setIsSpeaking] = useState(false);
    const word = words[idx];

    const handleListen = () => {
        setIsSpeaking(true);
        playTTS(word.word);
        // Approximate TTS duration, then stop speaking animation
        setTimeout(() => setIsSpeaking(false), 1500);
    };

    const handleRecord = async () => {
        if (listening) return;
        setListening(true);
        setIsSpeaking(true);
        setResult(null);

        const sttResult = await listenAndCompare(word.word, 4000);
        setListening(false);
        setIsSpeaking(false);
        setResult(sttResult);

        if (sttResult.matched) {
            playSFX('correct');
        } else {
            playSFX('wrong');
        }
    };

    const handleNext = () => {
        setResult(null);
        setIsSpeaking(false);
        if (idx < Math.min(words.length, 4) - 1) {
            setIdx((i) => i + 1);
        } else {
            onNext();
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                <p className="text-slate-400 font-bold text-sm mb-4">Listen, then say it! 🎤</p>

                <span className="text-5xl font-black text-slate-800 dark:text-slate-100 mb-2">{word.word}</span>
                <p className="text-slate-500 font-medium mb-4">{word.meaning}</p>

                <div className="flex gap-4 mb-4">
                    {/* Listen */}
                    <button
                        onClick={handleListen}
                        className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center border-4 border-sky-200 shadow-[0_4px_0_#7dd3fc] active:shadow-none active:translate-y-[4px] transition-all"
                    >
                        <Volume2 className="w-7 h-7 text-sky-600" />
                    </button>

                    {/* Record */}
                    <button
                        onClick={handleRecord}
                        disabled={listening}
                        className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all ${listening
                            ? "bg-red-400 border-red-500 shadow-[0_4px_0_#dc2626] animate-pulse"
                            : "bg-orange-100 border-orange-200 shadow-[0_4px_0_#fb923c] active:shadow-none active:translate-y-[4px]"
                            }`}
                    >
                        <Mic className={`w-7 h-7 ${listening ? "text-white" : "text-orange-600"}`} />
                    </button>
                </div>

                {/* STT Feedback */}
                {listening && (
                    <div className="flex items-center gap-2 text-red-500 font-bold text-sm animate-pulse">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        Listening...
                    </div>
                )}

                {result && !listening && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${result.matched
                            ? "bg-green-50 text-green-700 border-2 border-green-200"
                            : "bg-orange-50 text-orange-700 border-2 border-orange-200"
                        }`}>
                        {result.matched ? (
                            <><CheckCircle className="w-5 h-5" /> Great pronunciation! 🎉</>
                        ) : (
                            <><XCircle className="w-5 h-5" /> Try again! Tap 🔊 to listen first</>
                        )}
                    </div>
                )}

                {!sttAvailable && !listening && !result && (
                    <p className="text-xs text-slate-400 mt-1">🎤 Speech recognition may not work in this browser</p>
                )}
            </div>

            {/* Viseme Avatar - positioned below the card */}
            <VisemeAvatar isSpeaking={isSpeaking} />

            <p className="text-white/70 font-bold text-sm">{idx + 1} / {Math.min(words.length, 4)}</p>

            <BigButton onClick={handleNext}>
                Next <ArrowRight className="w-5 h-5" />
            </BigButton>
        </div>
    );
}

// ═══════════════════════════════════════
// STEP 5: Micro-Reader (1 min)
// ═══════════════════════════════════════
function MicroReaderStep({ sentences, sentencesKo, onNext }: { sentences: string[]; sentencesKo?: string[]; onNext: () => void }) {
    const [sentIdx, setSentIdx] = useState(0);
    const [showKo, setShowKo] = useState(false);

    const handleTap = () => {
        playTTS(sentences[sentIdx]);
        // Show Korean translation after hearing the sentence
        if (!showKo) setTimeout(() => setShowKo(true), 1200);
    };

    const handleNext = () => {
        setShowKo(false);
        if (sentIdx < sentences.length - 1) {
            setSentIdx((i) => i + 1);
        } else {
            onNext();
        }
    };

    const koText = sentencesKo?.[sentIdx];

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                <BookOpen className="w-10 h-10 text-indigo-400 mb-3" />
                <p className="text-slate-400 font-bold text-sm mb-6">Read along! 📖</p>

                <button onClick={handleTap} className="mb-2">
                    <p className="text-3xl font-black text-slate-800 dark:text-slate-100 text-center leading-relaxed">
                        {sentences[sentIdx]}
                    </p>
                </button>

                {/* Korean translation */}
                {showKo && koText && (
                    <p className="text-base text-slate-500 dark:text-slate-400 font-semibold mb-2 text-center">
                        {koText}
                    </p>
                )}

                <button onClick={handleTap} className="flex items-center gap-2 text-sky-500 font-bold mt-2">
                    <Volume2 className="w-5 h-5" /> Tap to hear
                </button>
            </div>

            <p className="text-white/70 font-bold text-sm">{sentIdx + 1} / {sentences.length}</p>

            <BigButton onClick={handleNext}>
                {sentIdx < sentences.length - 1 ? <>Next Sentence <ArrowRight className="w-5 h-5" /></> : <>Finish Reading <ArrowRight className="w-5 h-5" /></>}
            </BigButton>
        </div>
    );
}

// ═══════════════════════════════════════
// STEP 6: Exit Ticket (1 min) — Quick 3-question quiz
// ═══════════════════════════════════════
function ExitTicketStep({ words, onNext, addScore }: { words: WordData[]; onNext: () => void; addScore: (wordId: string, c: boolean) => void }) {
    const quizWords = words.slice(0, 3);
    const [qIdx, setQIdx] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [wasCorrect, setWasCorrect] = useState(false);
    const word = quizWords[qIdx];

    const options = useMemo(() => {
        const others = words.filter((w) => w.id !== word.id).slice(0, 2);
        return shuffle([...others.map((o) => o.word), word.word]);
    }, [qIdx, word, words]);

    const handleAnswer = (opt: string) => {
        if (answered) return;
        const correct = opt === word.word;
        setWasCorrect(correct);
        setAnswered(true);
        addScore(word.id, correct);
        playSFX(correct ? 'correct' : 'wrong');
        setTimeout(() => playTTS(word.word), 500);
    };

    const handleNext = () => {
        if (qIdx < quizWords.length - 1) {
            setQIdx((i) => i + 1);
            setAnswered(false);
            setWasCorrect(false);
        } else {
            onNext();
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                <p className="text-slate-400 font-bold text-sm mb-1">Exit Ticket 🎫</p>
                <p className="text-lg font-bold text-slate-600 mb-6">Which word means &quot;{word.meaning}&quot;?</p>

                <div className="flex flex-col gap-3 w-full">
                    {options.map((opt) => {
                        let cls = "bg-slate-50 border-slate-200 text-slate-700 shadow-[0_4px_0_#cbd5e1]";
                        if (answered && opt === word.word) {
                            cls = "bg-green-100 border-green-400 text-green-800 shadow-[0_4px_0_#16a34a]";
                        } else if (answered && opt !== word.word) {
                            cls = "bg-slate-50 border-slate-100 text-slate-400 shadow-none";
                        }
                        return (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(opt)}
                                className={`py-4 rounded-2xl font-black text-xl border-4 transition-all ${cls}`}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>

                {answered && (
                    <div className={`mt-4 px-4 py-2 rounded-xl font-bold ${wasCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {wasCorrect ? "✅ Correct!" : `❌ It was "${word.word}"`}
                    </div>
                )}
            </div>

            <p className="text-white/70 font-bold text-sm">{qIdx + 1} / {quizWords.length}</p>

            {answered && (
                <BigButton onClick={handleNext}>
                    Next <ArrowRight className="w-5 h-5" />
                </BigButton>
            )}
        </div>
    );
}

// ═══════════════════════════════════════
// Results Screen
// ═══════════════════════════════════════
// ─── Confetti Particle ───
const CONFETTI_EMOJIS = ["🎉", "✨", "🎊", "⭐", "🏆", "💛"];

function ConfettiParticles() {
    // Pre-compute random values to avoid hydration mismatch
    const particles = useMemo(() =>
        Array.from({ length: 18 }, (_, i) => ({
            left: 5 + Math.random() * 90,
            delay: Math.random() * 1.2,
            size: 16 + Math.random() * 14,
            emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
        })), []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p, i) => (
                <span
                    key={i}
                    className="absolute text-2xl animate-[confetti-fall_2.5s_ease-in_forwards]"
                    style={{
                        left: `${p.left}%`,
                        top: `-8%`,
                        animationDelay: `${p.delay}s`,
                        fontSize: `${p.size}px`,
                    }}
                >
                    {p.emoji}
                </span>
            ))}
        </div>
    );
}

function ResultsStep({ score, total, unitTitle, onFinish, onMount, newRewards }: { score: number; total: number; unitTitle: string; onFinish: () => void; onMount: () => void; newRewards: string[] }) {
    const savedRef = useRef(false);
    const [showTrophyModal, setShowTrophyModal] = useState(false);

    useEffect(() => {
        if (!savedRef.current) {
            savedRef.current = true;
            onMount();
            playSFX('complete');
        }
    }, [onMount]);

    // Show trophy modal when new rewards appear
    useEffect(() => {
        if (newRewards.length > 0) {
            setTimeout(() => {
                playSFX('trophy');
                setShowTrophyModal(true);
            }, 600);
        }
    }, [newRewards]);

    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;

    const unlockedRewardDefs = REWARDS.filter((r) => newRewards.includes(r.id));

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 w-full shadow-[0_10px_0_#e2e8f0] dark:shadow-[0_10px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
                <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">Lesson Done!</h2>
                <p className="text-slate-500 font-medium mb-6">{unitTitle}</p>

                {/* Stars */}
                <div className="flex gap-2 mb-6">
                    {[1, 2, 3].map((s) => (
                        <Star
                            key={s}
                            className={`w-12 h-12 ${s <= stars ? "text-yellow-400 fill-yellow-300" : "text-slate-200"}`}
                        />
                    ))}
                </div>

                {/* Score */}
                <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl px-8 py-4 flex flex-col items-center">
                    <span className="text-5xl font-black text-sky-600">{pct}%</span>
                    <span className="text-sky-500 font-bold text-sm mt-1">{score} / {total} correct</span>
                </div>
            </div>

            <BigButton onClick={onFinish} color="bg-green-400" shadow="shadow-[0_6px_0_#16a34a]">
                <span className="text-white">Back to Units</span>
            </BigButton>

            {/* Trophy Celebration Modal */}
            <AnimatePresence>
                {showTrophyModal && unlockedRewardDefs.length > 0 && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowTrophyModal(false)}
                    >
                        <ConfettiParticles />
                        <motion.div
                            className="bg-[#fef3c7] rounded-[2rem] p-8 mx-6 max-w-sm w-full border-4 border-[#fcd34d] shadow-[0_10px_0_#d97706] relative"
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <p className="text-center text-3xl font-black text-amber-800 mb-6">
                                New Trophy!
                            </p>
                            <div className="flex flex-col items-center gap-5">
                                {unlockedRewardDefs.map((r) => (
                                    <div key={r.id} className="flex flex-col items-center gap-2">
                                        <motion.div
                                            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4"
                                            style={{
                                                backgroundColor: r.color,
                                                borderColor: r.shadowColor,
                                                boxShadow: `0 6px 0 ${r.shadowColor}`,
                                            }}
                                            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                                            transition={{ duration: 0.6, delay: 0.3 }}
                                        >
                                            {r.emoji}
                                        </motion.div>
                                        <span className="font-black text-amber-800 text-lg">
                                            {r.name}
                                        </span>
                                        <span className="text-amber-600 text-sm font-medium text-center">
                                            {r.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowTrophyModal(false)}
                                className="mt-6 w-full bg-[#fcd34d] text-amber-900 font-black text-lg py-3 rounded-2xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all"
                            >
                                Awesome!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
