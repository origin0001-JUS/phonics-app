"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { phonemeToViseme, visemeGuide, type VisemeId } from "@/data/visemeMap";
import { getGuideForPhoneme, getConfusionPair, type PronunciationRef } from "@/data/pronunciationGuide";
import { getLipSyncVideoPath } from "@/data/representativeWords";
import HumanMouthCharacter, { isVoicedPhoneme, isAirflowPhoneme } from "./HumanMouthCharacter";

interface MouthVisualizerProps {
    currentPhoneme?: string;
    currentWord?: string;
    wordPhonemes?: string[];
    isSpeaking?: boolean;
    compact?: boolean;
    videoPath?: string | null;
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

// Difficulty badge colors
const difficultyConfig = {
    very_hard: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: '어려워요!' },
    hard: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: '주의!' },
    moderate: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: '연습!' },
    easy: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: '쉬워요' },
} as const;

// Pronunciation reference panel
function PronunciationRefPanel({ guide, confusionGuide }: { guide: PronunciationRef; confusionGuide?: PronunciationRef }) {
    const diff = difficultyConfig[guide.difficulty];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="w-full max-w-[320px]"
        >
            <div className={`${diff.bg} ${diff.border} border-2 rounded-2xl p-4 shadow-inner`}>
                {/* Header: phoneme + difficulty badge */}
                <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-indigo-700 text-base">/{guide.phoneme}/ 발음 가이드</span>
                    <span className={`${diff.bg} ${diff.text} ${diff.border} border text-xs font-bold px-2 py-0.5 rounded-full`}>
                        {diff.label}
                    </span>
                </div>

                {/* Visual key point */}
                <div className="bg-white/70 rounded-xl p-3 mb-2">
                    <p className="text-sm font-black text-slate-700 break-keep leading-relaxed">
                        👀 {guide.visualKey}
                    </p>
                </div>

                {/* Visual tip */}
                <div className="bg-white/70 rounded-xl p-3 mb-2">
                    <p className="text-sm font-bold text-slate-600 break-keep leading-relaxed whitespace-pre-line">
                        🪞 {guide.visualTip}
                    </p>
                </div>

                {/* Common mistake */}
                {guide.commonMistake && (
                    <div className="bg-red-50/70 rounded-xl p-3 mb-2 border border-red-100">
                        <p className="text-sm font-bold text-red-600 break-keep leading-relaxed">
                            ⚠️ {guide.commonMistake}
                        </p>
                    </div>
                )}

                {/* Confusion pair comparison */}
                {confusionGuide && (
                    <div className="bg-purple-50/70 rounded-xl p-3 border border-purple-100">
                        <p className="text-xs font-black text-purple-700 mb-1">
                            🔄 비교: /{guide.phoneme}/ vs /{confusionGuide.phoneme}/
                        </p>
                        <p className="text-sm font-bold text-purple-600 break-keep leading-relaxed">
                            {confusionGuide.visualKey}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function MouthVisualizer({
    currentPhoneme, currentWord, wordPhonemes, isSpeaking, compact, videoPath
}: MouthVisualizerProps) {
    const [showHelp, setShowHelp] = useState(false);
    const [videoError, setVideoError] = useState(false);

    // 복합 음소(예: "θ ð w") → 첫 번째 음소로 viseme 결정
    const resolvedPhoneme = currentPhoneme?.includes(' ')
        ? currentPhoneme.split(' ').find(p => phonemeToViseme[p]) || currentPhoneme
        : currentPhoneme;

    const viseme: VisemeId = resolvedPhoneme
        ? (phonemeToViseme[resolvedPhoneme] || 'rest')
        : 'rest';

    // Look up pronunciation guide for current phoneme
    const pronGuide = currentPhoneme ? getGuideForPhoneme(currentPhoneme) : undefined;
    const confusionGuide = currentPhoneme ? getConfusionPair(currentPhoneme) : undefined;

    // Auto-resolve video path
    const resolvedVideoPath = videoPath || (currentWord ? getLipSyncVideoPath(currentWord) : null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Reset video error when path changes
    useEffect(() => { setVideoError(false); }, [resolvedVideoPath]);

    // Handle video playback
    useEffect(() => {
        if (!videoRef.current) return;
        if (isSpeaking) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
        } else {
            videoRef.current.pause();
        }
    }, [isSpeaking, resolvedVideoPath]);

    const size = compact ? 'w-28 h-28' : 'w-48 h-48';

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center">
                <motion.div
                    className={`${size} rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-[#e8f4f8] relative`}
                    animate={{ scale: isSpeaking && (!resolvedVideoPath || videoError) ? [1, 1.03, 1] : 1 }}
                    transition={{ repeat: isSpeaking && (!resolvedVideoPath || videoError) ? Infinity : 0, duration: 0.6 }}
                >
                    {resolvedVideoPath && !videoError ? (
                        <video
                            ref={videoRef}
                            src={resolvedVideoPath}
                            className="w-full h-full object-cover"
                            playsInline
                            preload="auto"
                            onLoadedData={(e) => {
                                const vid = e.currentTarget;
                                if (!isSpeaking) vid.currentTime = 0.5;
                            }}
                            onPlay={() => {}}
                            onError={() => setVideoError(true)}
                        />
                    ) : (
                        /* ★ 사람 캐릭터 애니메이션 (모든 입모양 이미지 대체) */
                        <HumanMouthCharacter
                            viseme={viseme}
                            isSpeaking={isSpeaking}
                            compact={compact}
                            isVoiced={isVoicedPhoneme(currentPhoneme)}
                            showAirflow={isAirflowPhoneme(currentPhoneme)}
                        />
                    )}
                </motion.div>
            </div>

            {/* Phoneme display */}
            <div className={`mt-2 flex flex-col items-center transition-all ${currentPhoneme ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-600 text-white font-black text-xl px-4 py-1 rounded-xl shadow-md">
                        /{currentPhoneme}/
                    </span>
                    {currentWord && (
                        <span className="text-slate-500 font-bold text-base">
                            in &ldquo;{currentWord}&rdquo;
                        </span>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap justify-center">
                {wordPhonemes && wordPhonemes.length > 0 && (
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-full border-2 border-amber-200 active:scale-95 transition-transform flex items-center gap-1.5 shadow-sm"
                    >
                        💡 {showHelp ? '팁 숨기기' : '발음 팁'}
                    </button>
                )}
            </div>

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
        </div>
    );
}

export { usePhonemeSequence };
