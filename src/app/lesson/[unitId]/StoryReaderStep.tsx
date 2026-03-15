"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ArrowRight, BookOpen, Pause, Play } from "lucide-react";
import { playSentenceAudio, playSFX } from "@/lib/audio";
import { decodableReaderTemplates } from "@/data/decodableReaders";
import { EXTENDED_STORIES } from "@/data/extendedStories";

// Fallback stories for units not covered by phonics300_upgrade_data.json extended_stories.
// The JSON-sourced EXTENDED_STORIES (keyed by unit_XX) takes priority when available.
const DECODABLE_STORIES_FALLBACK: Record<string, string[]> = {
    'L1_U2': [
        "A pig is big.",
        "The pig did a jig.",
        "It hid in a pit.",
        "A kid bit a fig.",
        "The pig and the kid sit.",
        "It is a big pig!",
    ],
    'L1_U3': [
        "A dog sat on a log.",
        "It is hot on top.",
        "A fox got a box.",
        "The dog is not on the log.",
        "The fox hid in the box.",
        "The dog and the fox jog.",
    ],
    'L1_U5': [
        "A hen is in a pen.",
        "The hen is red.",
        "A net is on the bed.",
        "The hen got wet.",
        "Ten men met the hen.",
        "The red hen is in bed.",
    ],
    'L2_U3': [
        "I am home.",
        "A bone is by the rose.",
        "He woke and spoke.",
        "A mole is in a hole!",
        "He used a rope.",
        "She called on the phone.",
        "The cute mole is home.",
    ],
};

interface StoryReaderStepProps {
    unitId: string;
    onNext: () => void;
}

export default function StoryReaderStep({ unitId, onNext }: StoryReaderStepProps) {
    // Map unit_XX format to L?_U? format
    const template = useMemo(() => {
        const unitNum = parseInt(unitId.replace('unit_', ''), 10);
        // unit_01~05 = L1_U1~U5, unit_07~11 = L2_U1~U5 (approximate mapping)
        let templateId = '';
        if (unitNum >= 1 && unitNum <= 5) {
            templateId = `L1_U${unitNum}`;
        } else if (unitNum >= 7 && unitNum <= 9) {
            templateId = `L2_U${unitNum - 6}`;
        }
        return decodableReaderTemplates.find(t => t.unitId === templateId) || null;
    }, [unitId]);

    const sentences = useMemo(() => {
        // Priority 1: phonics300_upgrade_data.json extended_stories (keyed by raw unitId)
        if (EXTENDED_STORIES[unitId]) {
            return EXTENDED_STORIES[unitId];
        }
        // Priority 2: fallback hardcoded stories (keyed by template L?_U? id)
        if (!template) return [];
        return DECODABLE_STORIES_FALLBACK[template.unitId] || [];
    }, [unitId, template]);

    const [currentPanel, setCurrentPanel] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [highlightedWord, setHighlightedWord] = useState(-1);
    const [autoPlay, setAutoPlay] = useState(false);
    const [panelsRead, setPanelsRead] = useState<Set<number>>(new Set());
    const stopRef = useRef(false);

    const sentence = sentences[currentPanel] || "";
    const sentenceWords = sentence.split(' ');

    // Karaoke highlight: word-by-word highlighting during TTS playback
    const playWithKaraoke = useCallback(async (text: string) => {
        const words = text.split(' ');
        setIsPlaying(true);
        stopRef.current = false;

        // Play the full sentence audio
        const audioPromise = playSentenceAudio(unitId, currentPanel, text);

        // Initial delay to let the audio buffer and start playing (fixes text being ahead)
        await new Promise(resolve => setTimeout(resolve, 300));

        // Calculate a slightly more dynamic timing or use a larger base (450ms seems more natural for slowly spoken stories)
        for (let i = 0; i < words.length; i++) {
            if (stopRef.current) break;
            setHighlightedWord(i);
            
            // Adjust delay slightly based on word length for a natural feel, base 350ms + 30ms per char
            const wordDelay = Math.max(300, words[i].length * 30 + 350);
            await new Promise(resolve => setTimeout(resolve, wordDelay));
        }

        setHighlightedWord(-1);
        
        // Wait for the actual audio to finish before re-enabling controls or auto-playing next
        await audioPromise;

        if (!stopRef.current) {
            setIsPlaying(false);
            setPanelsRead(prev => new Set(prev).add(currentPanel));
        }
    }, [currentPanel, unitId]);

    // Auto-play mode: advance through panels automatically
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

    // When karaoke finishes and autoplay is on, advance to next panel
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

    // Fallback if no story for this unit
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

    // Panel color based on story beat (setup/conflict/resolution)
    const getPanelStyle = (idx: number): string => {
        const total = sentences.length;
        if (idx < Math.ceil(total * 0.3)) return "from-sky-100 to-sky-50 border-sky-200";
        if (idx < Math.ceil(total * 0.7)) return "from-amber-100 to-amber-50 border-amber-200";
        return "from-green-100 to-green-50 border-green-200";
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {/* Story header */}
            <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-white/80" />
                <p className="text-white/90 font-bold text-sm">Decodable Story</p>
            </div>

            {/* Panel progress dots */}
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

            {/* Main story panel */}
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
                    {/* Placeholder illustration area */}
                    <div className="w-full h-24 bg-white/50 rounded-xl mb-6 flex items-center justify-center border-2 border-dashed border-slate-200">
                        <span className="text-4xl">
                            {currentPanel < Math.ceil(sentences.length * 0.3) ? "🌅" :
                             currentPanel < Math.ceil(sentences.length * 0.7) ? "⚡" : "🌟"}
                        </span>
                    </div>

                    {/* Sentence with karaoke highlighting */}
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

                    {/* Tap to listen hint */}
                    <div className="flex items-center gap-1 mt-4 text-slate-400">
                        <Volume2 className="w-4 h-4" />
                        <span className="text-xs font-bold">
                            {isPlaying ? "Playing..." : "Tap to listen"}
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex gap-3 w-full">
                {/* Auto-play toggle */}
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

                {/* Next button */}
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
