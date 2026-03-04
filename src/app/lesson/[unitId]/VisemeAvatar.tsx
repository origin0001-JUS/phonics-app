"use client";

import { useState, useEffect, useRef } from "react";

interface VisemeAvatarProps {
    isSpeaking: boolean;
}

/**
 * Foxy Viseme (lip-sync) avatar component.
 * Displays a premium SVG character that animates mouth shapes (visemes) when speaking.
 */
export default function VisemeAvatar({ isSpeaking }: VisemeAvatarProps) {
    // Viseme states: 'idle', 'open', 'wide', 'round'
    const [mouthState, setMouthState] = useState<'idle' | 'open' | 'wide' | 'round'>('idle');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isSpeaking) {
            // Randomly cycle through speaking mouth shapes at ~6Hz
            const speakingStates: ('open' | 'wide' | 'round')[] = ['open', 'wide', 'round', 'open'];
            let step = 0;

            intervalRef.current = setInterval(() => {
                // Occasional idle shape to simulate pauses in speech
                if (Math.random() < 0.2) {
                    setMouthState('idle');
                } else {
                    setMouthState(speakingStates[step % speakingStates.length]);
                    step++;
                }
            }, 150);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setMouthState('idle');
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSpeaking]);

    // Render different mouth shapes based on the current viseme state
    const renderMouth = () => {
        switch (mouthState) {
            case 'open':
                return <path d="M 50 82 Q 60 95 70 82 Z" fill="#ef4444" />;
            case 'wide':
                return <path d="M 45 82 Q 60 100 75 82 Z" fill="#ef4444" />;
            case 'round':
                return <circle cx="60" cy="85" r="5" fill="#ef4444" />;
            case 'idle':
            default:
                return <path d="M 52 85 Q 60 88 68 85" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />;
        }
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Foxy Character SVG */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Speaking indicator rings (pulse behind avatar) */}
                {isSpeaking && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="absolute w-36 h-36 bg-sky-200 dark:bg-sky-500/30 rounded-full animate-ping opacity-60" />
                        <div className="absolute w-40 h-40 bg-sky-100 dark:bg-sky-400/20 rounded-full animate-ping opacity-40" style={{ animationDelay: "200ms" }} />
                    </div>
                )}

                <svg viewBox="0 0 120 120" className="w-full h-full relative z-10 filter drop-shadow-xl transition-transform hover:scale-105">
                    {/* Ears */}
                    <polygon points="20,50 10,12 50,30" fill="#ea580c" />
                    <polygon points="25,45 15,22 40,30" fill="#fed7aa" />
                    <polygon points="100,50 110,12 70,30" fill="#ea580c" />
                    <polygon points="95,45 105,22 80,30" fill="#fed7aa" />

                    {/* Head */}
                    <circle cx="60" cy="65" r="45" fill="#f97316" />

                    {/* Cheeks / Snout area (white) */}
                    <path d="M 18 70 Q 60 115 102 70 Q 95 45 60 45 Q 25 45 18 70 Z" fill="#ffffff" />

                    {/* Nose */}
                    <ellipse cx="60" cy="68" rx="7" ry="4.5" fill="#1e293b" />

                    {/* Eyes */}
                    {/* Left Eye */}
                    <circle cx="40" cy="52" r="7" fill="#1e293b" />
                    <circle cx="38" cy="50" r="2.5" fill="#ffffff" />

                    {/* Right Eye */}
                    <circle cx="80" cy="52" r="7" fill="#1e293b" />
                    <circle cx="78" cy="50" r="2.5" fill="#ffffff" />

                    {/* Mouth */}
                    <g className="transition-all duration-75 ease-in-out">
                        {renderMouth()}
                    </g>
                </svg>
            </div>

            {/* Label */}
            <span className={`text-sm font-bold transition-colors px-4 py-1 rounded-full ${isSpeaking ? "bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300" : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"}`}>
                {isSpeaking ? "Listening / Speaking..." : "FOXY"}
            </span>
        </div>
    );
}
