"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ArrowRight, Sparkles } from "lucide-react";
import { playWordAudio, playSFX } from "@/lib/audio";
import type { WordData } from "@/data/curriculum";

// Magic E pairs: base word → magic-e word
const MAGIC_E_PAIRS: { base: string; magic: string; meaning: string; magicMeaning: string }[] = [
    { base: "cap", magic: "cape", meaning: "모자", magicMeaning: "망토" },
    { base: "tap", magic: "tape", meaning: "수도꼭지", magicMeaning: "테이프" },
    { base: "hat", magic: "hate", meaning: "모자", magicMeaning: "싫어하다" },
    { base: "mat", magic: "mate", meaning: "매트", magicMeaning: "친구" },
    { base: "can", magic: "cane", meaning: "캔", magicMeaning: "지팡이" },
    { base: "bit", magic: "bite", meaning: "조각", magicMeaning: "물다" },
    { base: "hid", magic: "hide", meaning: "숨었다", magicMeaning: "숨다" },
    { base: "kit", magic: "kite", meaning: "도구세트", magicMeaning: "연" },
    { base: "pin", magic: "pine", meaning: "핀", magicMeaning: "소나무" },
    { base: "dim", magic: "dime", meaning: "어두운", magicMeaning: "10센트" },
    { base: "hop", magic: "hope", meaning: "깡충", magicMeaning: "희망" },
    { base: "not", magic: "note", meaning: "아닌", magicMeaning: "노트" },
    { base: "rod", magic: "rode", meaning: "막대", magicMeaning: "탔다" },
    { base: "cop", magic: "cope", meaning: "경찰", magicMeaning: "대처하다" },
    { base: "cub", magic: "cube", meaning: "새끼곰", magicMeaning: "정육면체" },
    { base: "tub", magic: "tube", meaning: "욕조", magicMeaning: "튜브" },
    { base: "cut", magic: "cute", meaning: "자르다", magicMeaning: "귀여운" },
    { base: "hug", magic: "huge", meaning: "안다", magicMeaning: "거대한" },
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

interface MagicEStepProps {
    words: WordData[];
    onNext: () => void;
}

export default function MagicEStep({ words, onNext }: MagicEStepProps) {
    // Find relevant magic-e pairs based on lesson words
    const pairs = useMemo(() => {
        const wordIds = new Set(words.map(w => w.id));
        // First try to match with lesson words, then fall back to all pairs
        const matched = MAGIC_E_PAIRS.filter(p => wordIds.has(p.base) || wordIds.has(p.magic));
        const pool = matched.length >= 3 ? matched : MAGIC_E_PAIRS;
        return shuffle(pool).slice(0, 4);
    }, [words]);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [eDragged, setEDragged] = useState(false);
    const [eDropped, setEDropped] = useState(false);
    const [showResult, setShowResult] = useState(false);

    const pair = pairs[currentIdx];

    const handleDragEnd = (_: unknown, info: { point: { x: number; y: number } }) => {
        // Check if dropped near the word area (generous hit zone)
        const wordArea = document.getElementById('magic-e-word-area');
        if (wordArea) {
            const rect = wordArea.getBoundingClientRect();
            const expandedRect = {
                left: rect.left - 60,
                right: rect.right + 60,
                top: rect.top - 60,
                bottom: rect.bottom + 60,
            };
            if (
                info.point.x >= expandedRect.left && info.point.x <= expandedRect.right &&
                info.point.y >= expandedRect.top && info.point.y <= expandedRect.bottom
            ) {
                setEDropped(true);
                setEDragged(true);
                playSFX('correct');
                setTimeout(() => {
                    playWordAudio(pair.magic);
                    setShowResult(true);
                }, 400);
            }
        }
    };

    const handleTapE = () => {
        if (eDropped) return;
        setEDropped(true);
        setEDragged(true);
        playSFX('correct');
        setTimeout(() => {
            playWordAudio(pair.magic);
            setShowResult(true);
        }, 400);
    };

    const handleNext = () => {
        if (currentIdx < pairs.length - 1) {
            setCurrentIdx(i => i + 1);
            setEDragged(false);
            setEDropped(false);
            setShowResult(false);
        } else {
            onNext();
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <p className="text-slate-400 font-bold text-sm">Magic e</p>
                    <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6">
                    Drag the magic <span className="text-purple-500">e</span> to change the word!
                </p>

                {/* Word image */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={showResult ? pair.magic : pair.base}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="w-28 h-28 mb-4 rounded-2xl overflow-hidden bg-white/50 border-4 border-white shadow-md flex items-center justify-center"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/assets/images/${showResult ? pair.magic : pair.base}.png`}
                            alt={showResult ? pair.magic : pair.base}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Word display area */}
                <div id="magic-e-word-area" className="relative mb-8">
                    <motion.div
                        className="flex items-center gap-1"
                        layout
                    >
                        {/* Base word letters */}
                        {pair.base.split('').map((letter, i) => (
                            <motion.span
                                key={`${currentIdx}-${i}`}
                                className="w-16 h-20 bg-blue-50 dark:bg-blue-900/30 border-4 border-blue-200 dark:border-blue-700 rounded-2xl flex items-center justify-center text-4xl font-black text-blue-600 dark:text-blue-300 shadow-[0_4px_0_#93c5fd]"
                                layout
                            >
                                {letter}
                            </motion.span>
                        ))}

                        {/* Dropped magic e */}
                        {eDropped && (
                            <motion.span
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-16 h-20 bg-purple-100 dark:bg-purple-900/30 border-4 border-purple-300 dark:border-purple-600 rounded-2xl flex items-center justify-center text-4xl font-black text-purple-500 shadow-[0_4px_0_#a855f7]"
                            >
                                e
                            </motion.span>
                        )}
                    </motion.div>

                    {/* Meaning label */}
                    <motion.p
                        key={showResult ? 'magic' : 'base'}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mt-3 font-bold text-slate-500 dark:text-slate-400 text-lg"
                    >
                        {showResult ? (
                            <>
                                <span className="text-purple-600">{pair.magic}</span> = {pair.magicMeaning}
                            </>
                        ) : (
                            <>
                                <span className="text-blue-600">{pair.base}</span> = {pair.meaning}
                            </>
                        )}
                    </motion.p>
                </div>

                {/* Draggable magic e tile */}
                {!eDropped && (
                    <motion.button
                        drag
                        dragSnapToOrigin={!eDropped}
                        onDragEnd={handleDragEnd}
                        onClick={handleTapE}
                        whileDrag={{ scale: 1.2, zIndex: 50 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-4xl font-black text-white shadow-[0_6px_0_#7e22ce] cursor-grab active:cursor-grabbing border-4 border-purple-300"
                    >
                        e
                    </motion.button>
                )}

                {/* Result: play both sounds */}
                {showResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 mt-2"
                    >
                        <button
                            onClick={() => playWordAudio(pair.base)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-300 font-bold active:scale-95 transition-transform"
                        >
                            <Volume2 className="w-4 h-4" />
                            {pair.base}
                        </button>
                        <span className="text-2xl text-slate-300 self-center">→</span>
                        <button
                            onClick={() => playWordAudio(pair.magic)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300 font-bold active:scale-95 transition-transform"
                        >
                            <Volume2 className="w-4 h-4" />
                            {pair.magic}
                        </button>
                    </motion.div>
                )}
            </div>

            <p className="text-white/70 font-bold text-sm">{currentIdx + 1} / {pairs.length}</p>

            {showResult && (
                <button
                    onClick={handleNext}
                    className="w-full bg-[#fcd34d] text-amber-900 font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                >
                    {currentIdx < pairs.length - 1 ? "Next" : "Continue"} <ArrowRight className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
