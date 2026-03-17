"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ArrowRight, BookOpen, Pause, Play, Lightbulb } from "lucide-react";
import { playSentenceAudio, playSFX } from "@/lib/audio";
import { DECODABLE_STORIES } from "@/data/decodableStories";

interface StoryReaderStepProps {
    unitId: string;
    onNext: () => void;
}

export default function StoryReaderStep({ unitId, onNext }: StoryReaderStepProps) {
    const storyPages = useMemo(() => {
        return DECODABLE_STORIES[unitId] || [];
    }, [unitId]);

    const sentences = useMemo(() => storyPages.map(p => p.text), [storyPages]);

    const [currentPanel, setCurrentPanel] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [highlightedWord, setHighlightedWord] = useState(-1);
    const [autoPlay, setAutoPlay] = useState(false);
    const [panelsRead, setPanelsRead] = useState<Set<number>>(new Set());
    const [showTranslation, setShowTranslation] = useState(false);
    const stopRef = useRef(false);

    const sentence = sentences[currentPanel] || "";
    const sentenceWords = sentence.split(' ');
    const translation = storyPages[currentPanel]?.translation || "";

    // 패널 변경 시 번역 숨기기
    useEffect(() => {
        setShowTranslation(false);
    }, [currentPanel]);

    // Karaoke highlight: word-by-word highlighting during TTS playback
    const playWithKaraoke = useCallback(async (text: string) => {
        const words = text.split(' ');
        setIsPlaying(true);
        stopRef.current = false;

        // Play the full sentence audio
        const { promise: audioPromise, audio } = playSentenceAudio(unitId, currentPanel, text);

        let duration = 0;

        // Wait for audio metadata to load to get accurate duration
        if (audio) {
            await new Promise<void>((resolve) => {
                if (audio.readyState >= 1) {
                    duration = audio.duration;
                    resolve();
                } else {
                    audio.addEventListener('loadedmetadata', () => {
                        duration = audio.duration;
                        resolve();
                    });
                    audio.addEventListener('error', () => resolve());
                    setTimeout(resolve, 500);
                }
            });
        }

        const totalMs = duration > 0 ? duration * 1000 : words.length * 300;

        await new Promise(resolve => setTimeout(resolve, 250));

        const effectiveMs = Math.max(0, totalMs - 250);
        const perWordDelay = Math.max(150, effectiveMs / Math.max(1, words.length));

        for (let i = 0; i < words.length; i++) {
            if (stopRef.current) break;
            setHighlightedWord(i);
            await new Promise(resolve => setTimeout(resolve, perWordDelay));
        }

        setHighlightedWord(-1);
        await audioPromise;

        if (!stopRef.current) {
            setIsPlaying(false);
            setPanelsRead(prev => new Set(prev).add(currentPanel));
        }
    }, [currentPanel, unitId]);

    // Auto-play mode
    useEffect(() => {
        if (!autoPlay || isPlaying || sentences.length === 0) return;
        if (currentPanel >= sentences.length) {
            setAutoPlay(false);
            return;
        }
        const timer = setTimeout(() => {
            playWithKaraoke(sentences[currentPanel]);
        }, 600);
        return () => clearTimeout(timer);
    }, [autoPlay, isPlaying, currentPanel, sentences, playWithKaraoke]);

    // Auto-advance after karaoke finishes
    useEffect(() => {
        if (autoPlay && !isPlaying && panelsRead.has(currentPanel) && currentPanel < sentences.length - 1) {
            const timer = setTimeout(() => {
                setCurrentPanel(p => p + 1);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [autoPlay, isPlaying, panelsRead, currentPanel, sentences.length]);

    const handlePanelTap = () => {
        if (isPlaying) {
            stopRef.current = true;
            setIsPlaying(false);
            setHighlightedWord(-1);
            return;
        }
        playWithKaraoke(sentence);
    };

    const handleNext = () => {
        if (currentPanel < sentences.length - 1) {
            setCurrentPanel(p => p + 1);
            setHighlightedWord(-1);
        } else {
            playSFX('correct');
            onNext();
        }
    };

    const toggleAutoPlay = () => {
        if (autoPlay) {
            setAutoPlay(false);
            stopRef.current = true;
            setIsPlaying(false);
            setHighlightedWord(-1);
        } else {
            setAutoPlay(true);
        }
    };

    // 스토리가 없는 유닛 폴백
    if (sentences.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                    <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-400 font-bold text-center">Story coming soon for this unit!</p>
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

    // 패널 스타일 (도입/전개/결말)
    const getPanelStyle = (idx: number): string => {
        const total = sentences.length;
        if (idx < Math.ceil(total * 0.3)) return "from-sky-100 to-sky-50 border-sky-200";
        if (idx < Math.ceil(total * 0.7)) return "from-amber-100 to-amber-50 border-amber-200";
        return "from-green-100 to-green-50 border-green-200";
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {/* 스토리 헤더 */}
            <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-white/80" />
                <p className="text-white/90 font-bold text-sm">Decodable Story</p>
            </div>

            {/* 패널 진행 도트 */}
            <div className="flex gap-1.5">
                {sentences.map((_, i) => (
                    <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                            i === currentPanel
                                ? "bg-yellow-400 scale-125"
                                : panelsRead.has(i)
                                    ? "bg-green-400"
                                    : "bg-white/30"
                        }`}
                    />
                ))}
            </div>

            {/* 메인 스토리 패널 */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPanel}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    onClick={handlePanelTap}
                    className={`bg-gradient-to-b ${getPanelStyle(currentPanel)} rounded-[2rem] p-8 w-full shadow-[0_8px_0_#e2e8f0] border-4 flex flex-col items-center cursor-pointer min-h-[200px] justify-center`}
                >
                    {/* 패널 이미지 영역 */}
                    <div className="w-full aspect-video max-w-[280px] mx-auto bg-white/50 rounded-2xl mb-6 flex items-center justify-center border-4 border-white/60 overflow-hidden shadow-sm relative">
                        <span className="text-4xl absolute z-0 text-slate-300 opacity-50">
                            {currentPanel < Math.ceil(sentences.length * 0.3) ? "🌅" :
                             currentPanel < Math.ceil(sentences.length * 0.7) ? "⚡" : "🌟"}
                        </span>
                        <img
                            key={`/assets/stories/${unitId}/panel_${currentPanel + 1}.png`}
                            src={`/assets/stories/${unitId}/panel_${currentPanel + 1}.png`}
                            alt={`Story panel ${currentPanel + 1}`}
                            className="w-full h-full object-cover absolute inset-0 z-10 transition-opacity duration-300"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.opacity = '0';
                            }}
                        />
                    </div>

                    {/* 카라오케 하이라이트 문장 */}
                    <p className="text-center leading-relaxed">
                        {sentenceWords.map((word, i) => (
                            <motion.span
                                key={i}
                                animate={{
                                    scale: highlightedWord === i ? 1.15 : 1,
                                    color: highlightedWord === i ? '#7c3aed' : '#334155',
                                }}
                                className="inline-block text-2xl font-black mx-1"
                            >
                                {word}
                            </motion.span>
                        ))}
                    </p>

                    {/* 탭하여 듣기 힌트 */}
                    <div className="flex items-center gap-1 mt-4 text-slate-400">
                        <Volume2 className="w-4 h-4" />
                        <span className="text-xs font-bold">
                            {isPlaying ? "Playing..." : "Tap to listen"}
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* 해석 도우미 버블 */}
            <AnimatePresence>
                {showTranslation && translation && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="w-full bg-white/95 dark:bg-slate-800/95 rounded-2xl px-5 py-3 shadow-lg border-2 border-amber-200 dark:border-amber-600 relative"
                    >
                        {/* 말풍선 꼬리 */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 dark:bg-slate-800/95 border-l-2 border-t-2 border-amber-200 dark:border-amber-600 rotate-45" />
                        <p className="text-base font-bold text-slate-700 dark:text-slate-200 text-center leading-relaxed">
                            {translation}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 컨트롤 */}
            <div className="flex gap-3 w-full">
                {/* 자동 재생 토글 */}
                <button
                    onClick={toggleAutoPlay}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all active:scale-95 ${
                        autoPlay
                            ? "bg-purple-500 text-white shadow-[0_4px_0_#7e22ce]"
                            : "bg-white/30 text-white"
                    }`}
                >
                    {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span className="text-sm">{autoPlay ? "Stop" : "Auto"}</span>
                </button>

                {/* 해석 도우미 토글 */}
                <button
                    onClick={() => setShowTranslation(prev => !prev)}
                    className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold transition-all active:scale-95 ${
                        showTranslation
                            ? "bg-amber-400 text-amber-900 shadow-[0_4px_0_#d97706]"
                            : "bg-white/30 text-white"
                    }`}
                >
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-xs">해석</span>
                </button>

                {/* 다음 페이지 버튼 */}
                <button
                    onClick={handleNext}
                    className="flex-1 bg-[#fcd34d] text-amber-900 font-black text-lg py-3 rounded-2xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                >
                    {currentPanel < sentences.length - 1 ? "Next Page" : "Finish Story"} <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            <p className="text-white/50 font-bold text-xs">
                Page {currentPanel + 1} of {sentences.length}
            </p>
        </div>
    );
}
