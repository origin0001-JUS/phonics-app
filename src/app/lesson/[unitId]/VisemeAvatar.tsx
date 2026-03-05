"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VisemeAvatarProps {
    isSpeaking: boolean;
}

/**
 * Foxy lip close-up viseme component.
 * Shows a zoomed-in view of Foxy's mouth area with Framer Motion transitions.
 * Designed for easy SVG path swapping per vowel (a, e, i, o, u) in future.
 */

// Mouth shape definitions — each maps to an SVG path for the lip area.
// Future: add per-vowel visemes (viseme_a, viseme_e, viseme_i, viseme_o, viseme_u)
const MOUTH_SHAPES = {
    idle: {
        d: "M 30 52 Q 50 58 70 52",
        fill: "none",
        stroke: "#1e293b",
        strokeWidth: 3,
    },
    open: {
        d: "M 30 50 Q 50 72 70 50 Z",
        fill: "#ef4444",
        stroke: "none",
        strokeWidth: 0,
    },
    wide: {
        d: "M 25 50 Q 50 78 75 50 Z",
        fill: "#ef4444",
        stroke: "none",
        strokeWidth: 0,
    },
    round: {
        d: "M 40 48 Q 42 62 50 64 Q 58 62 60 48 Q 58 44 50 43 Q 42 44 40 48 Z",
        fill: "#ef4444",
        stroke: "none",
        strokeWidth: 0,
    },
} as const;

type MouthState = keyof typeof MOUTH_SHAPES;

const SPEAKING_CYCLE: MouthState[] = ["open", "wide", "round", "open", "wide"];

export default function VisemeAvatar({ isSpeaking }: VisemeAvatarProps) {
    const [mouthState, setMouthState] = useState<MouthState>("idle");
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isSpeaking) {
            let step = 0;
            intervalRef.current = setInterval(() => {
                if (Math.random() < 0.15) {
                    setMouthState("idle");
                } else {
                    setMouthState(SPEAKING_CYCLE[step % SPEAKING_CYCLE.length]);
                    step++;
                }
            }, 140);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setMouthState("idle");
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSpeaking]);

    const shape = MOUTH_SHAPES[mouthState];

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Lip close-up container */}
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Speaking pulse rings */}
                <AnimatePresence>
                    {isSpeaking && (
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="absolute w-28 h-28 bg-sky-200 dark:bg-sky-500/30 rounded-full animate-ping opacity-50" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 filter drop-shadow-lg">
                    {/* Circular background — Foxy's snout/chin area */}
                    <circle cx="50" cy="50" r="48" fill="#f97316" />
                    <circle cx="50" cy="50" r="42" fill="#ffffff" />

                    {/* Nose */}
                    <ellipse cx="50" cy="34" rx="6" ry="4" fill="#1e293b" />

                    {/* Whiskers */}
                    <line x1="10" y1="42" x2="30" y2="44" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="10" y1="50" x2="30" y2="50" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="70" y1="44" x2="90" y2="42" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="70" y1="50" x2="90" y2="50" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Mouth — animated with Framer Motion */}
                    <motion.path
                        d={shape.d}
                        fill={shape.fill}
                        stroke={shape.stroke}
                        strokeWidth={shape.strokeWidth}
                        strokeLinecap="round"
                        animate={{ d: shape.d }}
                        transition={{ type: "spring", stiffness: 400, damping: 25, duration: 0.1 }}
                    />

                    {/* Tongue hint (visible only when mouth is open) */}
                    {(mouthState === "open" || mouthState === "wide") && (
                        <motion.ellipse
                            cx="50"
                            cy={mouthState === "wide" ? 64 : 60}
                            rx="8"
                            ry="4"
                            fill="#f87171"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 0.7, scale: 1 }}
                            transition={{ duration: 0.08 }}
                        />
                    )}
                </svg>
            </div>

            {/* Label */}
            <span className={`text-xs font-bold transition-colors px-3 py-1 rounded-full ${
                isSpeaking
                    ? "bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
            }`}>
                {isSpeaking ? "Speaking..." : "FOXY"}
            </span>
        </div>
    );
}
