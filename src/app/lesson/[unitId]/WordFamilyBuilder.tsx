"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ArrowRight, Layers, Star } from "lucide-react";
import { playWordAudio, playSFX } from "@/lib/audio";
import type { WordData } from "@/data/curriculum";

interface WordFamilyBuilderProps {
    words: WordData[];
    onNext: () => void;
}

interface BuiltWord {
    word: string;
    onset: string;
    rime: string;
}

export default function WordFamilyBuilder({ words, onNext }: WordFamilyBuilderProps) {
    // Group words by word family (rime)
    const families = useMemo(() => {
        const map = new Map<string, WordData[]>();
        for (const w of words) {
            if (w.wordFamily && w.onset && w.rime) {
                const existing = map.get(w.wordFamily) || [];
                existing.push(w);
                map.set(w.wordFamily, existing);
            }
        }
        // Filter families with at least 2 members
        return Array.from(map.entries())
            .filter(([, members]) => members.length >= 2)
            .slice(0, 3); // max 3 families per session
    }, [words]);

    const [familyIdx, setFamilyIdx] = useState(0);
    const [builtWords, setBuiltWords] = useState<BuiltWord[]>([]);
    const [lastTapped, setLastTapped] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    const currentFamily = families[familyIdx];
    const rime = currentFamily?.[0] || '';
    const familyWords = currentFamily?.[1] || [];

    // All possible onsets from the entire words list to use as distractors
    const allPossibleOnsets = useMemo(() => {
        const set = new Set<string>();
        for (const w of words) {
            if (w.onset) set.add(w.onset);
        }
        return Array.from(set);
    }, [words]);

    // Available onsets for this family
    const correctOnsets = useMemo(() => {
        return familyWords.map(w => ({
            onset: w.onset!,
            word: w.word,
            meaning: w.meaning,
        }));
    }, [familyWords]);

    // Options to display (correct + distractors)
    const [options, setOptions] = useState<string[]>([]);
    
    // Generate mixed options when family changes
    useEffect(() => {
        if (!rime || correctOnsets.length === 0) return;
        
        const corrects = correctOnsets.map(o => o.onset);
        const distractors = allPossibleOnsets.filter(o => !corrects.includes(o));
        
        // Shuffle distractors and pick enough to make total options around 6-8
        // Or at least double the correct onsets if there are many
        const numDistractorsToPick = Math.max(3, 8 - corrects.length);
        const pickedDistractors = [...distractors].sort(() => Math.random() - 0.5).slice(0, numDistractorsToPick);
        
        // Ensure fallback if not enough distractors from current unit words
        const fallbackDistractors = ['b', 'c', 'h', 'm', 'p', 's', 't', 'n', 'r', 'l'].filter(o => !corrects.includes(o));
        while (pickedDistractors.length < numDistractorsToPick && fallbackDistractors.length > 0) {
            const fallback = fallbackDistractors.pop();
            if (fallback && !pickedDistractors.includes(fallback)) {
                pickedDistractors.push(fallback);
            }
        }
        
        const shuffledOptions = [...corrects, ...pickedDistractors].sort(() => Math.random() - 0.5);
        setOptions(shuffledOptions);
    }, [familyIdx, rime, correctOnsets, allPossibleOnsets]);

    // Check if an onset has already been built
    const isBuilt = useCallback((onset: string) => {
        return builtWords.some(bw => bw.onset === onset && bw.rime === rime);
    }, [builtWords, rime]);

    const [wrongTapped, setWrongTapped] = useState<string | null>(null);

    const handleOnsetTap = (onset: string) => {
        if (isBuilt(onset)) return;

        setLastTapped(onset);
        
        // Check if it's a correct onset
        const correctTarget = correctOnsets.find(c => c.onset === onset);

        if (!correctTarget) {
            // Wrong tap
            setWrongTapped(onset);
            playSFX('wrong');
            setTimeout(() => setWrongTapped(null), 600);
            return;
        }

        const word = correctTarget.word;

        // Play the full word
        setTimeout(() => {
            playWordAudio(word);
        }, 200);

        // Add to built words with animation delay
        setTimeout(() => {
            const newBuilt = [...builtWords, { word, onset, rime }];
            setBuiltWords(newBuilt);
            playSFX('correct');

            // Check if all onsets for this family are now built
            const builtCount = newBuilt.filter(bw => bw.rime === rime).length;
            if (builtCount === correctOnsets.length) {
                setTimeout(() => {
                    setShowCelebration(true);
                    playSFX('complete');
                }, 400);
            }
        }, 600);
    };

    const allBuilt = builtWords.filter(bw => bw.rime === rime).length === correctOnsets.length;

    const handleNext = () => {
        setShowCelebration(false);
        if (familyIdx < families.length - 1) {
            setFamilyIdx(i => i + 1);
            setLastTapped(null);
        } else {
            onNext();
        }
    };

    // Fallback if no word families available
    if (families.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                    <Layers className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-400 font-bold text-center">Word Family game coming soon!</p>
                </div>
                <button
                    onClick={onNext}
                    className="w-full bg-[#fcd34d] text-amber-900 font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                >
                    Continue <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-5 h-5 text-amber-500" />
                    <p className="text-slate-400 font-bold text-sm">Word Family Builder</p>
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">
                    Tap an onset to build a word!
                </p>

                {/* Fixed rime block */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-14 border-4 border-dashed border-blue-300 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-black text-blue-300">?</span>
                    </div>
                    <span className="text-xl font-black text-slate-300">+</span>
                    <div className="px-6 h-14 bg-amber-100 dark:bg-amber-900/30 border-4 border-amber-300 dark:border-amber-600 rounded-xl flex items-center justify-center shadow-[0_4px_0_#fbbf24]">
                        <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{rime}</span>
                    </div>
                </div>

                {/* Onset buttons grid */}
                <div className="flex flex-wrap gap-3 justify-center mb-4">
                    {options.map((onset) => {
                        const built = isBuilt(onset);
                        const isWrong = wrongTapped === onset;
                        // Just a subtle tap animation if correct and tapped
                        const justTapped = lastTapped === onset && !built && !isWrong;
                        
                        return (
                            <motion.button
                                key={onset}
                                onClick={() => handleOnsetTap(onset)}
                                disabled={built || isWrong}
                                animate={
                                    isWrong ? { x: [-5, 5, -5, 5, 0], scale: 0.95 }
                                    : justTapped ? { scale: [1, 1.2, 1] } : {}
                                }
                                transition={{ duration: isWrong ? 0.3 : 0.2 }}
                                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black transition-all border-4 relative overflow-hidden ${
                                    built
                                        ? "bg-green-100 border-green-300 text-green-500 opacity-60"
                                        : isWrong
                                        ? "bg-red-50 border-red-300 text-red-500"
                                        : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-300 shadow-[0_4px_0_#93c5fd] active:shadow-none active:translate-y-[4px] active:scale-95 cursor-pointer"
                                }`}
                            >
                                {onset}
                                {isWrong && (
                                    <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                                        <div className="w-10 h-10 text-red-400 opacity-50 text-4xl leading-none rotate-45 flex items-center justify-center font-normal pb-1">+</div>
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Built words card stack */}
                <div className="w-full mt-2">
                    <p className="text-xs font-bold text-slate-400 mb-2 text-center">
                        Built: {builtWords.filter(bw => bw.rime === rime).length} / {correctOnsets.length}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <AnimatePresence>
                            {builtWords
                                .filter(bw => bw.rime === rime)
                                .map((bw, i) => (
                                    <motion.button
                                        key={bw.word}
                                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => playWordAudio(bw.word)}
                                        className="px-4 py-2 bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
                                    >
                                        <Volume2 className="w-3 h-3 text-green-500" />
                                        <span className="font-black text-green-700 dark:text-green-300">{bw.word}</span>
                                    </motion.button>
                                ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Family progress */}
            <p className="text-white/70 font-bold text-sm">
                Family {familyIdx + 1} / {families.length}
            </p>

            {/* Celebration modal */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                        onClick={handleNext}
                    >
                        <motion.div
                            initial={{ scale: 0.5, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: "spring", damping: 12 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] p-8 mx-6 shadow-2xl border-4 border-amber-300 flex flex-col items-center gap-4 max-w-sm"
                        >
                            <div className="flex gap-1">
                                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                                <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                            </div>
                            <p className="text-2xl font-black text-amber-600">Word Family Complete!</p>
                            <p className="text-slate-500 font-bold text-center">
                                You built all the <span className="text-amber-600">{rime}</span> words!
                            </p>
                            <button
                                onClick={handleNext}
                                className="w-full bg-[#fcd34d] text-amber-900 font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {familyIdx < families.length - 1 ? "Next Family" : "Continue"} <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Next button — shown when all onsets are built (fallback if modal dismissed) */}
            {allBuilt && !showCelebration && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                >
                    <button
                        onClick={handleNext}
                        className="w-full bg-[#fcd34d] text-amber-900 font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                    >
                        {familyIdx < families.length - 1 ? "Next Family" : "Continue"} <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            )}
        </div>
    );
}
