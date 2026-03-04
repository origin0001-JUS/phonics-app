"use client";

import { useState, useEffect, useRef } from "react";

interface VisemeAvatarProps {
    isSpeaking: boolean;
}

/**
 * Placeholder viseme (lip-sync) avatar component.
 * Shows a simple 2-frame mouth animation when isSpeaking=true.
 * Designed to be upgraded later with real SVG viseme assets from Antigravity.
 */
export default function VisemeAvatar({ isSpeaking }: VisemeAvatarProps) {
    const [mouthOpen, setMouthOpen] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isSpeaking) {
            // Alternate mouth open/closed at ~4Hz for a natural speaking look
            intervalRef.current = setInterval(() => {
                setMouthOpen((prev) => !prev);
            }, 250);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setMouthOpen(false);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isSpeaking]);

    return (
        <div className="flex flex-col items-center gap-1">
            {/* Character face */}
            <div className="relative w-24 h-24 bg-orange-400 rounded-full border-4 border-white dark:border-slate-600 shadow-[0_4px_0_#ea580c] flex items-center justify-center overflow-hidden">
                {/* Eyes */}
                <div className="absolute top-6 left-5 w-4 h-4 bg-slate-800 rounded-full">
                    <div className="w-1.5 h-1.5 bg-white rounded-full mt-0.5 ml-0.5" />
                </div>
                <div className="absolute top-6 right-5 w-4 h-4 bg-slate-800 rounded-full">
                    <div className="w-1.5 h-1.5 bg-white rounded-full mt-0.5 ml-0.5" />
                </div>

                {/* Mouth - 2 frame animation */}
                <div
                    className={`absolute top-14 rounded-full transition-all duration-100 ${
                        mouthOpen
                            ? "w-6 h-5 bg-red-500 border-2 border-red-700"
                            : "w-5 h-2 bg-red-400 border border-red-600"
                    }`}
                />

                {/* Speaking indicator rings */}
                {isSpeaking && (
                    <>
                        <div className="absolute -right-1 top-10 w-3 h-3 border-2 border-sky-400 rounded-full animate-ping opacity-60" />
                        <div className="absolute -right-2 top-12 w-2 h-2 border-2 border-sky-300 rounded-full animate-ping opacity-40" style={{ animationDelay: "150ms" }} />
                    </>
                )}
            </div>

            {/* Label */}
            <span className={`text-xs font-bold transition-colors ${isSpeaking ? "text-sky-300" : "text-white/50"}`}>
                {isSpeaking ? "Speaking..." : "FOXY"}
            </span>
        </div>
    );
}
