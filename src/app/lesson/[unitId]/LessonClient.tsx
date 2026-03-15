"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, Volume2, ArrowRight, Check,
    Mic, BookOpen, Star, Trophy, CheckCircle, XCircle
} from "lucide-react";

import { getUnitById, curriculum, microReadingKoMap, type WordData } from "@/data/curriculum";
import { saveLessonResults, vocabCardToSRSCard, srsCardToVocabCard, type WordResult } from "@/lib/lessonService";
import { db } from "@/lib/db";
import { createNewCard, calculateNextReview } from "@/lib/srs";
import { REWARDS } from "@/data/rewards";
import { playWordAudio, playSentenceAudio, playSFX, fallbackTTS, listenAndCompare, isSTTSupported, preloadAudioFiles, type STTResult } from "@/lib/audio";

import MouthVisualizer, { usePhonemeSequence } from "./MouthVisualizer";
import MagicEStep from "./MagicEStep";
import StoryReaderStep from "./StoryReaderStep";
import WordFamilyBuilder from "./WordFamilyBuilder";

// ─── WordImage: Reusable word illustration with fallback (V2-9) ───

function WordImage({
    wordId,
    alt,
    size = "md",
    animate = true,
}: {
    wordId: string;
    alt: string;
    size?: "sm" | "md" | "lg";
    animate?: boolean;
}) {
    const [error, setError] = useState(false);

    const sizeClasses = {
        sm: "w-28 h-28 min-w-[7rem]", // originally w-20 h-20 (80px -> 112px, +40%)
        md: "w-40 h-40 min-w-[10rem]", // originally w-28 h-28 (112px -> 160px, +42%)
        lg: "w-48 h-48 min-w-[12rem]", // originally w-32 h-32 (128px -> 192px, +50%)
    };

    if (error) {
        return (
            <div className={`${sizeClasses[size]} bg-slate-100 rounded-3xl border-4 border-slate-200 border-dashed shadow-inner flex flex-col items-center justify-center p-2`}>
                <span className="text-slate-400 font-bold text-lg md:text-2xl text-center pb-1">{wordId}</span>
                <span className="text-slate-300 text-xs">No Image</span>
            </div>
        );
    }

    const img = (
        <div className={`${sizeClasses[size]} bg-sky-50 rounded-3xl border-4 border-sky-100 shadow-[0_6px_16px_rgba(0,0,0,0.08)] overflow-hidden flex items-center justify-center p-2 relative`}>
            <img
                src={`/assets/images/${wordId}.png`}
                alt={alt}
                className="w-full h-full object-contain drop-shadow-md"
                onError={() => setError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
        </div>
    );

    if (!animate) return img;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
            {img}
        </motion.div>
    );
}

// ─── Minimal Pairs Data (for Sound Focus quiz) ───
const MINIMAL_PAIRS: { units: string[]; label: string; items: [string, string][] }[] = [
    { units: ["unit_01", "unit_02"], label: "a vs e", items: [["bat", "bet"], ["hat", "hit"], ["pan", "pen"], ["man", "men"], ["bad", "bed"]] },
    { units: ["unit_02", "unit_03"], label: "e vs i", items: [["bed", "bid"], ["pet", "pit"], ["net", "nit"], ["pen", "pin"], ["set", "sit"]] },
    { units: ["unit_03", "unit_04"], label: "i vs o", items: [["dig", "dog"], ["hip", "hop"], ["hit", "hot"], ["big", "bog"]] },
    { units: ["unit_04", "unit_05"], label: "o vs u", items: [["hot", "hut"], ["cop", "cup"], ["pot", "put"], ["dog", "dug"]] },
    { units: ["unit_07"], label: "short a vs long a", items: [["cap", "cape"], ["tap", "tape"], ["hat", "hate"], ["mat", "mate"], ["can", "cane"]] },
    { units: ["unit_08"], label: "short i vs long i", items: [["bit", "bite"], ["hid", "hide"], ["kit", "kite"], ["pin", "pine"], ["dim", "dime"]] },
    { units: ["unit_09"], label: "short o vs long o", items: [["hop", "hope"], ["not", "note"], ["rod", "rode"], ["cop", "cope"]] },
    { units: ["unit_10"], label: "short u vs long u", items: [["cub", "cube"], ["tub", "tube"], ["cut", "cute"], ["hug", "huge"]] },
    { units: ["unit_17"], label: "ch vs sh", items: [["chip", "ship"], ["chop", "shop"], ["chin", "shin"], ["cheap", "sheep"]] },
    { units: ["unit_19"], label: "th vs s", items: [["think", "sink"], ["thick", "sick"], ["thin", "sin"]] },
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
    | "magic_e"
    | "decode_words"
    | "word_family"
    | "say_check"
    | "micro_reader"
    | "story_reader"
    | "exit_ticket"
    | "results";

// Long vowel units that get the Magic E step
const MAGIC_E_UNITS = new Set(["unit_07", "unit_08", "unit_09", "unit_10", "unit_11", "unit_23"]);

// Units that have decodable stories
const STORY_READER_UNITS = new Set(["unit_01", "unit_02", "unit_03", "unit_04", "unit_05", "unit_07", "unit_08", "unit_09"]);

function buildStepOrder(unitId: string, hasWordFamilies: boolean): LessonStep[] {
    const steps: LessonStep[] = ["sound_focus", "blend_tap"];
    if (MAGIC_E_UNITS.has(unitId)) steps.push("magic_e");
    steps.push("decode_words");
    if (hasWordFamilies) steps.push("word_family");
    steps.push("say_check", "micro_reader");
    if (STORY_READER_UNITS.has(unitId)) steps.push("story_reader");
    steps.push("exit_ticket", "results");
    return steps;
}

const STEP_LABELS: Record<LessonStep, string> = {
    sound_focus: "Sound Focus",
    blend_tap: "Blend & Tap",
    magic_e: "Magic e",
    decode_words: "Decode Words",
    word_family: "Word Family",
    say_check: "Say & Check",
    micro_reader: "Micro-Reader",
    story_reader: "Story Time",
    exit_ticket: "Exit Ticket",
    results: "Results",
};

// ─── Main Lesson Page ───
export default function LessonPage() {
    const params = useParams();
    const router = useRouter();
    const unitId = params.unitId as string;
    const unit = useMemo(() => getUnitById(unitId), [unitId]);

    // Check if unit has word families (for conditional Word Family step)
    const hasWordFamilies = useMemo(() => {
        if (!unit) return false;
        const familyMap = new Map<string, number>();
        for (const w of unit.words) {
            if (w.wordFamily && w.onset && w.rime) {
                familyMap.set(w.wordFamily, (familyMap.get(w.wordFamily) || 0) + 1);
            }
        }
        // Need at least one family with 2+ members
        return Array.from(familyMap.values()).some(count => count >= 2);
    }, [unit]);

    const stepOrder = useMemo(() => buildStepOrder(unitId, hasWordFamilies), [unitId, hasWordFamilies]);

    const [stepIndex, setStepIndex] = useState(0);
    const [subStepIndex, setSubStepIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [newRewards, setNewRewards] = useState<string[]>([]);
    const wordResultsRef = useRef<Map<string, WordResult>>(new Map());
    const lessonStartRef = useRef<number>(0);

    useEffect(() => {
        lessonStartRef.current = Date.now();
    }, []);

    // ─── QA-R2: Restore lesson state from localStorage (was sessionStorage) ───
    const storageKey = `lesson_state_${unitId}`;
    const [sessionRestored, setSessionRestored] = useState(false);
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const state = JSON.parse(saved);
                if (typeof state.stepIndex === 'number') setStepIndex(state.stepIndex);
                if (typeof state.subStepIndex === 'number') setSubStepIndex(state.subStepIndex);
                if (typeof state.score === 'number') setScore(state.score);
                if (typeof state.totalQuestions === 'number') setTotalQuestions(state.totalQuestions);
                // Restore word results
                if (state.wordResults && typeof state.wordResults === 'object') {
                    const map = new Map<string, WordResult>();
                    for (const [k, v] of Object.entries(state.wordResults)) {
                        map.set(k, v as WordResult);
                    }
                    wordResultsRef.current = map;
                }
            }
        } catch { /* ignore */ }
        setSessionRestored(true);
    }, [storageKey]);

    // ─── QA-R2: Save lesson state to localStorage on change ───
    useEffect(() => {
        if (!sessionRestored) return;
        try {
            const wordResultsObj: Record<string, WordResult> = {};
            for (const [k, v] of wordResultsRef.current) {
                wordResultsObj[k] = v;
            }
            localStorage.setItem(storageKey, JSON.stringify({
                stepIndex, subStepIndex, score, totalQuestions, wordResults: wordResultsObj,
            }));
        } catch { /* ignore */ }
    }, [stepIndex, subStepIndex, score, totalQuestions, storageKey, sessionRestored]);

    const currentStep = stepOrder[stepIndex];
    const progress = ((stepIndex) / (stepOrder.length - 1)) * 100;

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

    // Reset subStepIndex when moving to the next step
    const goNext = useCallback(() => {
        if (stepIndex < stepOrder.length - 1) {
            setStepIndex((i) => i + 1);
            setSubStepIndex(0);
        }
    }, [stepIndex]);

    // QA-R2 Bug 2: Immediately update SRS card on wrong answer so review queue reflects it
    const addScore = useCallback((wordId: string, correct: boolean) => {
        setTotalQuestions((t) => t + 1);
        if (correct) setScore((s) => s + 1);
        recordWordAttempt(wordId, correct);

        if (!correct) {
            // Push wrong answer to SRS review queue immediately — due TODAY so review badge updates
            (async () => {
                try {
                    const today = new Date().toISOString().split('T')[0];
                    const existing = await db.cards.get(wordId);
                    const srsCard = existing
                        ? vocabCardToSRSCard(existing)
                        : createNewCard(wordId, unitId);
                    const updated = calculateNextReview(srsCard, 0); // Rating 0 = Again
                    // Override nextReviewDate to today so the card appears in review queue immediately
                    updated.nextReviewDate = today;
                    await db.cards.put(srsCardToVocabCard(updated));
                } catch (err) {
                    console.warn('SRS immediate update failed:', err);
                }
            })();
        }
    }, [recordWordAttempt, unitId]);

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
        // QA-R2: Clear localStorage on lesson completion
        try { localStorage.removeItem(storageKey); } catch { /* ignore */ }

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
            completedSteps: stepOrder.filter((_, i) => i < stepOrder.length - 1),
        }, isPerfect).then((unlocked) => {
            if (unlocked.length > 0) setNewRewards(unlocked);
        }).catch(console.error);
    }, [unitId, lessonWords, score, totalQuestions, storageKey]);

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
                        {stepIndex + 1}/{stepOrder.length - 1}
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
                {currentStep === "magic_e" && (
                    <MagicEStep words={lessonWords} onNext={goNext} />
                )}
                {currentStep === "decode_words" && (
                    <DecodeWordsStep words={lessonWords} onNext={goNext} addScore={addScore} initialSubStep={subStepIndex} onSubStepChange={setSubStepIndex} />
                )}
                {currentStep === "word_family" && (
                    <WordFamilyBuilder words={unit.words} onNext={goNext} />
                )}
                {currentStep === "say_check" && (
                    <SayCheckStep words={lessonWords} onNext={goNext} initialSubStep={subStepIndex} onSubStepChange={setSubStepIndex} />
                )}
                {currentStep === "micro_reader" && (
                    <MicroReaderStep sentences={unit.microReading} sentencesKo={microReadingKoMap[unit.id]} onNext={goNext} />
                )}
                {currentStep === "story_reader" && (
                    <StoryReaderStep unitId={unitId} onNext={goNext} />
                )}
                {currentStep === "exit_ticket" && (
                    <ExitTicketStep words={lessonWords} onNext={goNext} addScore={addScore} initialSubStep={subStepIndex} onSubStepChange={setSubStepIndex} />
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
            // 터치 시작 시 바로 반응하도록 개선, `touch-manipulation` 속성으로 모바일 브라우저의 더블탭 줌 딜레이 300ms 방지
            className={`w-full ${color} text-amber-900 font-black text-lg py-4 rounded-2xl ${shadow} active:shadow-none active:translate-y-[6px] transition-all duration-75 touch-manipulation cursor-pointer flex items-center justify-center gap-2`}
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

/** Convert onset/rime text into phonics-friendly TTS spellings */
function getPhonicsTTS(text: string): string {
    const t = text.toLowerCase();
    const map: Record<string, string> = {
        'a': 'ah', 'e': 'eh', 'i': 'ih', 'o': 'aw', 'u': 'uh',
        'b': 'buh', 'c': 'kuh', 'd': 'duh', 'f': 'fuh', 'g': 'guh',
        'h': 'huh', 'j': 'juh', 'k': 'kuh', 'l': 'lll', 'm': 'mmm',
        'n': 'nnn', 'p': 'puh', 'q': 'kwuh', 'r': 'rrr', 's': 'sss',
        't': 'tuh', 'v': 'vuh', 'w': 'wuh', 'x': 'ks', 'y': 'yuh', 'z': 'zzz',
        'sh': 'shh', 'ch': 'ch', 'th': 'th', 'wh': 'wuh', 'ph': 'fff',
        'bl': 'bll', 'cl': 'kll', 'fl': 'fll', 'gl': 'gll', 'pl': 'pll', 'sl': 'sll',
        'br': 'brr', 'cr': 'krr', 'dr': 'drr', 'fr': 'frr', 'gr': 'grr', 'pr': 'prr', 'tr': 'trr',
        'sk': 'skk', 'sm': 'smm', 'sn': 'snn', 'sp': 'spp', 'st': 'stt', 'sw': 'sww',
        // Rimes
        'ag': 'ag', 'ig': 'igg', 'og': 'og', 'ug': 'ug', 'eg': 'eg',
        'ad': 'ad', 'id': 'idd', 'od': 'od', 'ud': 'ud', 'ed': 'ed',
        'at': 'at', 'it': 'it', 'ot': 'ot', 'ut': 'ut', 'et': 'et',
        'ap': 'ap', 'ip': 'ip', 'op': 'op', 'up': 'up', 'ep': 'ep',
        'am': 'am', 'im': 'imm', 'om': 'om', 'um': 'um', 'em': 'em',
        'an': 'an', 'in': 'in', 'on': 'on', 'un': 'un', 'en': 'en',
        'ab': 'ab', 'ib': 'ibb', 'ob': 'ob', 'ub': 'ub', 'eb': 'eb',
        'ack': 'ack', 'ick': 'ick', 'ock': 'ock', 'uck': 'uck', 'eck': 'eck',
        'ash': 'ash', 'ish': 'ish', 'osh': 'osh', 'ush': 'ush', 'esh': 'esh',
    };
    return map[t] || t;
}

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
                                        className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold active:scale-95 transition-transform"
                                    >
                                        <WordImage wordId={w} alt={w} size="sm" />
                                        <span className="flex items-center gap-1"><Volume2 className="w-4 h-4" />{w}</span>
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

            {/* Example word with image (V2-9) */}
            {exampleWord && (
                <div className="flex flex-col items-center gap-3">
                    <WordImage wordId={exampleWord.id} alt={exampleWord.word} size="md" />
                    <button
                        onClick={() => playTTS(exampleWord.word)}
                        className="flex items-center gap-3 bg-white/40 px-6 py-3 rounded-full"
                    >
                        <Volume2 className="w-6 h-6 text-white" />
                        <span className="text-white font-bold">Listen: &quot;{exampleWord.word}&quot;</span>
                    </button>
                </div>
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

    // Fallback image handling
    const [imageError, setImageError] = useState(false);

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
        const audio = new Audio(`/assets/audio/phonemes/onset_${word.onset?.toLowerCase()}.mp3`);
        audio.play().catch(() => fallbackTTS(getPhonicsTTS(word.onset!)));
    };

    // Task 13-C: Independent rime tap — plays rime sound only
    const tapRime = () => {
        if (rimeTapped) return;
        setRimeTapped(true);
        const audio = new Audio(`/assets/audio/phonemes/rime_${word.rime?.toLowerCase()}.mp3`);
        audio.play().catch(() => fallbackTTS(getPhonicsTTS(word.rime!)));
    };

    // Task 13-C: When both onset and rime are tapped, merge and play full word
    useEffect(() => {
        if (onsetTapped && rimeTapped && !merging) {
            setMerging(true);
            setTimeout(() => playSFX('correct'), 800);
            setTimeout(() => playTTS(word.word), 1800);
        }
    }, [onsetTapped, rimeTapped, merging, word.word]);

    const handleNext = () => {
        if (currentIdx < Math.min(words.length, 4) - 1) {
            setCurrentIdx((i) => i + 1);
            setTappedPhonemes([]);
            setOnsetTapped(false);
            setRimeTapped(false);
            setMerging(false);
            setImageError(false);
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

                {/* Blended result with 3D Image Popup */}
                {allTapped && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="flex flex-col items-center mt-2 w-full"
                    >
                        {!imageError && (
                            <div className="w-32 h-32 mb-4 bg-sky-50 rounded-3xl border-4 border-sky-100 shadow-[0_8px_20px_rgba(0,0,0,0.1)] overflow-hidden flex items-center justify-center p-2 relative">
                                <img
                                    src={`/assets/images/${word.id}.png`}
                                    alt={word.word}
                                    className="w-full h-full object-contain drop-shadow-md"
                                    onError={() => setImageError(true)}
                                />
                                {/* Optional: Subtle shine effect overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 animate-[shine_2s_ease-in-out_infinite]" />
                            </div>
                        )}
                        <div className="bg-green-50 border-4 border-green-200 shadow-[0_4px_0_#bbf7d0] rounded-2xl px-8 py-3 flex items-center gap-3">
                            <Check className="w-6 h-6 text-green-500" strokeWidth={4} />
                            <span className="font-black text-green-700 text-2xl tracking-wide">{word.word}</span>
                        </div>
                    </motion.div>
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
function DecodeWordsStep({ words, onNext, addScore, initialSubStep = 0, onSubStepChange }: { words: WordData[]; onNext: () => void; addScore: (wordId: string, c: boolean) => void; initialSubStep?: number; onSubStepChange?: (idx: number) => void }) {
    const [idx, setIdx] = useState(initialSubStep);
    const [selected, setSelected] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const word = words[idx];

    // Report sub-step changes to parent for persistence
    useEffect(() => { onSubStepChange?.(idx); }, [idx, onSubStepChange]);

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

                {/* Big word display with image (V2-9) */}
                <WordImage wordId={word.id} alt={word.word} size="sm" animate={false} />
                <button onClick={() => playTTS(word.word)} className="flex items-center gap-2 mb-4 mt-2">
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
function SayCheckStep({ words, onNext, initialSubStep = 0, onSubStepChange }: { words: WordData[]; onNext: () => void; initialSubStep?: number; onSubStepChange?: (idx: number) => void }) {
    const [idx, setIdx] = useState(initialSubStep);
    const [listening, setListening] = useState(false);
    const [result, setResult] = useState<STTResult | null>(null);
    const [sttAvailable] = useState(() => isSTTSupported());
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [hasListened, setHasListened] = useState(false);
    const word = words[idx];
    const currentPhoneme = usePhonemeSequence(word.phonemes, isSpeaking);

    // Reset when word changes + auto-play word audio (Part Q fix)
    useEffect(() => {
        setHasListened(false);
        setResult(null);
        // Auto-play word audio with small delay for browser autoplay policy
        const timer = setTimeout(() => {
            setIsSpeaking(true);
            playTTS(words[idx]?.word ?? '');
            setTimeout(() => {
                setIsSpeaking(false);
                setHasListened(true);
            }, 1500);
        }, 300);
        return () => clearTimeout(timer);
    }, [idx, words]);

    // Report sub-step changes to parent for persistence
    useEffect(() => { onSubStepChange?.(idx); }, [idx, onSubStepChange]);

    const handleListen = () => {
        setIsSpeaking(true);
        playTTS(word.word);
        // Approximate TTS duration, then stop speaking animation and enable mic
        setTimeout(() => {
            setIsSpeaking(false);
            setHasListened(true);
        }, 1500);
    };

    const handleRecord = async () => {
        if (listening) return;
        setListening(true);
        setIsSpeaking(true);
        setResult(null);

        try {
            const sttResult = await listenAndCompare(word.word, 4000);
            setResult(sttResult);

            if (sttResult.matched) {
                playSFX('correct');
            } else {
                playSFX('wrong');
            }
        } catch (err) {
            console.warn('STT failed:', err);
            setResult({ matched: false, transcript: '', confidence: 0 });
        } finally {
            setListening(false);
            setIsSpeaking(false);
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
                <p className="text-slate-400 font-bold text-sm mb-3">Listen, then say it! 🎤</p>

                {/* Word image (V2-9) */}
                <WordImage wordId={word.id} alt={word.word} size="md" />

                <span className="text-5xl font-black text-slate-800 dark:text-slate-100 mt-2 mb-1">{word.word}</span>
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
                        disabled={listening || !hasListened}
                        className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all ${
                            !hasListened
                                ? "bg-slate-100 border-slate-200 shadow-none cursor-not-allowed opacity-50"
                                : listening
                                    ? "bg-red-400 border-red-500 shadow-[0_4px_0_#dc2626] animate-pulse"
                                    : "bg-orange-100 border-orange-200 shadow-[0_4px_0_#fb923c] active:shadow-none active:translate-y-[4px]"
                        }`}
                    >
                        <Mic className={`w-7 h-7 ${!hasListened ? "text-slate-400" : listening ? "text-white" : "text-orange-600"}`} />
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
                    <div className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm ${result.matched
                        ? "bg-green-50 text-green-700 border-2 border-green-200"
                        : "bg-orange-50 text-orange-700 border-2 border-orange-200"
                        }`}>
                        <div className="flex items-center gap-2">
                            {result.matched ? (
                                <><CheckCircle className="w-5 h-5" /> Great pronunciation!</>
                            ) : (
                                <><XCircle className="w-5 h-5" /> Try again! Tap the speaker first</>
                            )}
                        </div>
                        {/* Similarity score display (Part S fix) */}
                        <div className="w-full mt-1">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span>Accuracy</span>
                                <span>{Math.round((result.confidence || 0) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${result.matched ? "bg-green-500" : "bg-orange-400"}`}
                                    style={{ width: `${Math.round((result.confidence || 0) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {!sttAvailable && !listening && !result && (
                    <p className="text-xs text-slate-400 mt-1">🎤 Speech recognition may not work in this browser</p>
                )}
            </div>

            {/* Mouth Visualizer - dual view (front + cross-section) */}
            <MouthVisualizer
                currentPhoneme={currentPhoneme}
                currentWord={word.word}
                wordPhonemes={word.phonemes}
                isSpeaking={isSpeaking}
            />

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
function ExitTicketStep({ words, onNext, addScore, initialSubStep = 0, onSubStepChange }: { words: WordData[]; onNext: () => void; addScore: (wordId: string, c: boolean) => void; initialSubStep?: number; onSubStepChange?: (idx: number) => void }) {
    const quizWords = words.slice(0, 3);
    const [qIdx, setQIdx] = useState(initialSubStep);
    const [answered, setAnswered] = useState(false);
    const [wasCorrect, setWasCorrect] = useState(false);
    const word = quizWords[qIdx];

    // Report sub-step changes to parent for persistence
    useEffect(() => { onSubStepChange?.(qIdx); }, [qIdx, onSubStepChange]);

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
