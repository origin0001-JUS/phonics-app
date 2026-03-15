"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { phonemeToViseme, visemeGuide, type VisemeId } from "@/data/visemeMap";
import MouthCrossSection from "./MouthCrossSection";

interface MouthVisualizerProps {
    currentPhoneme?: string;
    currentWord?: string;
    wordPhonemes?: string[];
    isSpeaking?: boolean;
    compact?: boolean;
}

// Phoneme sequence hook — cycles through phonemes while speaking
function usePhonemeSequence(phonemes: string[], isSpeaking: boolean) {
    const [currentIndex, setCurrentIndex] = useState(-1);

    useEffect(() => {
        if (!isSpeaking || phonemes.length === 0) {
            setCurrentIndex(-1);
            return;
        }

        let i = 0;
        setCurrentIndex(0);

        const interval = setInterval(() => {
            i++;
            if (i >= phonemes.length) {
                clearInterval(interval);
                setTimeout(() => setCurrentIndex(-1), 300);
            } else {
                setCurrentIndex(i);
            }
        }, 400);

        return () => clearInterval(interval);
    }, [isSpeaking, phonemes]);

    return currentIndex >= 0 ? phonemes[currentIndex] : undefined;
}

// Front view placeholder — shows viseme label with stylized mouth shape
function FrontViewPlaceholder({ viseme, isSpeaking }: { viseme: VisemeId; isSpeaking?: boolean }) {
    // Simplified mouth SVG shapes per viseme category
    const mouthShape: Record<string, { d: string; fill: string }> = {
        rest:           { d: 'M 25,52 Q 50,56 75,52', fill: 'none' },
        bilabial:       { d: 'M 25,52 Q 50,50 75,52', fill: 'none' },
        labiodental:    { d: 'M 25,50 Q 50,56 75,50', fill: 'none' },
        dental:         { d: 'M 30,50 Q 50,60 70,50 Z', fill: '#ef4444' },
        alveolar_stop:  { d: 'M 28,50 Q 50,62 72,50 Z', fill: '#ef4444' },
        alveolar_fric:  { d: 'M 30,50 Q 50,58 70,50 Z', fill: '#ef4444' },
        postalveolar:   { d: 'M 35,48 Q 50,62 65,48 Z', fill: '#ef4444' },
        velar:          { d: 'M 28,48 Q 50,68 72,48 Z', fill: '#ef4444' },
        glottal:        { d: 'M 26,48 Q 50,72 74,48 Z', fill: '#ef4444' },
        open_front:     { d: 'M 22,46 Q 50,80 78,46 Z', fill: '#ef4444' },
        mid_front:      { d: 'M 26,48 Q 50,68 74,48 Z', fill: '#ef4444' },
        close_front:    { d: 'M 28,50 Q 50,58 72,50 Z', fill: '#ef4444' },
        open_back:      { d: 'M 32,46 Q 38,78 50,80 Q 62,78 68,46 Z', fill: '#ef4444' },
        close_back:     { d: 'M 38,48 Q 42,60 50,62 Q 58,60 62,48 Z', fill: '#ef4444' },
        mid_central:    { d: 'M 30,48 Q 50,64 70,48 Z', fill: '#ef4444' },
    };

    const mouth = mouthShape[viseme] || mouthShape.rest;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Face background */}
            <circle cx="50" cy="50" r="48" fill="#fde8d8" />
            <circle cx="50" cy="50" r="44" fill="#fef0e4" />

            {/* Nose */}
            <ellipse cx="50" cy="32" rx="5" ry="3.5" fill="#e8b4a0" />

            {/* Upper teeth (subtle) */}
            {viseme !== 'rest' && viseme !== 'bilabial' && (
                <rect x="38" y="46" width="24" height="6" rx="2" fill="white" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.8" />
            )}

            {/* Mouth shape — animated */}
            <motion.path
                d={mouth.d}
                fill={mouth.fill}
                stroke={mouth.fill === 'none' ? '#94a3b8' : 'none'}
                strokeWidth={mouth.fill === 'none' ? 2.5 : 0}
                strokeLinecap="round"
                animate={{ d: mouth.d }}
                transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.15 }}
            />

            {/* Tongue hint for open mouths */}
            {['open_front', 'open_back', 'velar', 'glottal', 'mid_front', 'mid_central'].includes(viseme) && (
                <motion.ellipse
                    cx="50" cy={viseme === 'open_front' || viseme === 'open_back' ? 68 : 60}
                    rx="8" ry="4"
                    fill="#f87171"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                />
            )}

            {/* Dental: tongue tip between teeth */}
            {viseme === 'dental' && (
                <motion.ellipse cx="50" cy="50" rx="4" ry="3" fill="#e85d75"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
            )}

            {/* Speaking pulse */}
            {isSpeaking && (
                <circle cx="50" cy="50" r="46" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.4">
                    <animate attributeName="r" from="44" to="50" dur="0.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="0.6s" repeatCount="indefinite" />
                </circle>
            )}
        </svg>
    );
}

export default function MouthVisualizer({
    currentPhoneme, currentWord, wordPhonemes, isSpeaking, compact
}: MouthVisualizerProps) {
    const [showHelp, setShowHelp] = useState(false);

    const viseme: VisemeId = currentPhoneme
        ? (phonemeToViseme[currentPhoneme] || 'rest')
        : 'rest';

    const size = compact ? 'w-20 h-20' : 'w-28 h-28';

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Dual view */}
            <div className="flex gap-3 items-center">
                {/* Front view: lip shape */}
                <motion.div
                    className={`${size} rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white`}
                    animate={{ scale: isSpeaking ? [1, 1.03, 1] : 1 }}
                    transition={{ repeat: isSpeaking ? Infinity : 0, duration: 0.5 }}
                >
                    <FrontViewPlaceholder viseme={viseme} isSpeaking={isSpeaking} />
                </motion.div>

                {/* Cross-section view: tongue position */}
                <motion.div
                    className={`${size} rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-[#fef3e2]`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <MouthCrossSection viseme={viseme} />
                </motion.div>
            </div>

            {/* Phoneme display */}
            {currentPhoneme && (
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 font-black text-lg px-3 py-1 rounded-full">
                        /{currentPhoneme}/
                    </span>
                    {currentWord && (
                        <span className="text-slate-500 font-bold text-sm">
                            in &ldquo;{currentWord}&rdquo;
                        </span>
                    )}
                </div>
            )}

            {/* Toggle Help Button */}
            {wordPhonemes && wordPhonemes.length > 0 && (
                <button 
                    onClick={() => setShowHelp(!showHelp)}
                    className="mt-2 text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-full border-2 border-amber-200 active:scale-95 transition-transform flex items-center gap-2 shadow-sm"
                >
                    💡 {showHelp ? "발음 팁 숨기기" : "발음 팁 보기"}
                </button>
            )}

            {/* Collapsible Sequential Help */}
            <AnimatePresence>
                {showHelp && wordPhonemes && wordPhonemes.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden w-full max-w-[320px]"
                    >
                        <div className="bg-amber-50/80 border-2 border-amber-200 rounded-2xl p-4 flex flex-col gap-3 mt-2 shadow-inner">
                            {wordPhonemes.map((p, idx) => {
                                const v = phonemeToViseme[p] || 'rest';
                                const g = visemeGuide[v] || visemeGuide.rest;
                                return (
                                    <div key={`${p}-${idx}`} className="flex items-start gap-3">
                                        <div className="w-6 h-6 shrink-0 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center font-black text-sm mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-indigo-600 mb-0.5">/{p}/</p>
                                            <p className="text-sm font-bold text-slate-600 leading-snug break-keep">{g.tipKo}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Label */}
            <span className={`text-xs font-bold transition-colors px-3 py-1 rounded-full ${
                isSpeaking
                    ? "bg-sky-100 text-sky-600"
                    : "bg-slate-100 text-slate-400"
            }`}>
                {isSpeaking ? "Speaking..." : "Mouth Guide"}
            </span>
        </div>
    );
}

export { usePhonemeSequence };
