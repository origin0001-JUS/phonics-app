"use client";

import { useState, useEffect, useCallback } from "react";
import { db, type VocabularyCard } from "@/lib/db";
import { getUnitById } from "@/data/curriculum";
import type { WordData } from "@/data/curriculum";
import { vocabCardToSRSCard, srsCardToVocabCard } from "@/lib/lessonService";
import { calculateNextReview, type Rating } from "@/lib/srs";
import { playWordAudio, playSFX } from "@/lib/audio";
import { ChevronLeft, Volume2, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";

function playTTS(text: string) {
    playWordAudio(text);
}

interface DueCard {
    vocabCard: VocabularyCard;
    wordData: WordData | undefined;
}

const RATING_BUTTONS: { label: string; rating: Rating; color: string; shadow: string }[] = [
    { label: "Again", rating: 0, color: "#ef4444", shadow: "#b91c1c" },
    { label: "Hard", rating: 1, color: "#f97316", shadow: "#c2410c" },
    { label: "Good", rating: 2, color: "#22c55e", shadow: "#15803d" },
    { label: "Easy", rating: 3, color: "#3b82f6", shadow: "#1d4ed8" },
];

export default function ReviewPage() {
    const [dueCards, setDueCards] = useState<DueCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewedCount, setReviewedCount] = useState(0);

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        db.cards
            .where("nextReviewDate")
            .belowOrEqual(today)
            .toArray()
            .then((cards) => {
                const mapped: DueCard[] = cards.map((vc) => {
                    const unit = getUnitById(vc.unitId);
                    const wordData = unit?.words.find((w) => w.id === vc.id);
                    return { vocabCard: vc, wordData };
                });
                setDueCards(mapped);
                setLoading(false);
            });
    }, []);

    const handleRate = useCallback(
        async (rating: Rating) => {
            const card = dueCards[currentIndex];
            if (!card) return;

            const srsCard = vocabCardToSRSCard(card.vocabCard);
            const updated = calculateNextReview(srsCard, rating);
            await db.cards.put(srsCardToVocabCard(updated));

            setReviewedCount((c) => c + 1);
            setIsFlipped(false);
            setCurrentIndex((i) => i + 1);
        },
        [dueCards, currentIndex]
    );

    if (loading) {
        return (
            <main className="flex-1 flex items-center justify-center relative z-10">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
            </main>
        );
    }

    // All done
    if (currentIndex >= dueCards.length && dueCards.length > 0) {
        return <ReviewComplete count={reviewedCount} />;
    }

    // No cards due
    if (dueCards.length === 0) {
        return <EmptyState />;
    }

    const current = dueCards[currentIndex];

    return (
        <main className="flex-1 flex flex-col pb-10 relative z-10">
            {/* Header */}
            <header className="flex items-center gap-3 px-5 pt-8 pb-4">
                <Link
                    href="/"
                    className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-[0_4px_0_#d1d5db] active:shadow-[0_0px_0_#d1d5db] active:translate-y-[4px] transition-all border-2 border-slate-100"
                >
                    <ChevronLeft className="w-6 h-6 text-slate-500" />
                </Link>
                <h1 className="text-2xl font-bold text-white drop-shadow-md">Review</h1>
                <span className="ml-auto bg-white/30 px-3 py-1 rounded-full text-sm font-bold text-white">
                    {currentIndex + 1} / {dueCards.length}
                </span>
            </header>

            {/* Flashcard */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
                <button
                    onClick={() => {
                        if (!isFlipped) {
                            playTTS(current.vocabCard.id);
                            playSFX('flip');
                            setIsFlipped(true);
                        } else {
                            playSFX('flip');
                            setIsFlipped(false);
                        }
                    }}
                    className="w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-[0_10px_0_#e2e8f0] border-4 border-white flex flex-col items-center justify-center min-h-[280px] active:scale-[0.98] transition-transform"
                >
                    {!isFlipped ? (
                        /* Front — word */
                        <>
                            <p className="text-5xl font-black text-slate-800 mb-4">
                                {current.wordData?.word ?? current.vocabCard.id}
                            </p>
                            <div className="flex items-center gap-2 text-sky-500">
                                <Volume2 className="w-6 h-6" />
                                <span className="text-sm font-bold">Tap to flip</span>
                            </div>
                        </>
                    ) : (
                        /* Back — meaning + phonemes */
                        <>
                            <p className="text-4xl font-black text-slate-800 mb-3">
                                {current.wordData?.word ?? current.vocabCard.id}
                            </p>
                            {current.wordData && (
                                <>
                                    <p className="text-2xl text-slate-600 mb-3">
                                        {current.wordData.meaning}
                                    </p>
                                    <div className="flex gap-2 flex-wrap justify-center">
                                        {current.wordData.phonemes.map((p, i) => (
                                            <span
                                                key={i}
                                                className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-bold"
                                            >
                                                /{p}/
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                            <div className="flex items-center gap-1 mt-4 text-slate-400">
                                <RotateCcw className="w-4 h-4" />
                                <span className="text-xs font-bold">Tap to flip back</span>
                            </div>
                        </>
                    )}
                </button>

                {/* Rating buttons — only visible after flip */}
                {isFlipped && (
                    <div className="grid grid-cols-4 gap-3 mt-8 w-full max-w-sm">
                        {RATING_BUTTONS.map((btn) => (
                            <button
                                key={btn.rating}
                                onClick={() => handleRate(btn.rating)}
                                className="py-3 rounded-xl font-bold text-white text-sm border-2 border-white active:translate-y-[6px] active:shadow-none transition-all"
                                style={{
                                    backgroundColor: btn.color,
                                    boxShadow: `0 6px 0 ${btn.shadow}`,
                                }}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

function EmptyState() {
    return (
        <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
            <div className="bg-white rounded-[2rem] p-10 shadow-[0_10px_0_#e2e8f0] border-4 border-white text-center max-w-sm">
                <p className="text-6xl mb-4">🎉</p>
                <h2 className="text-2xl font-black text-slate-800 mb-2">All caught up!</h2>
                <p className="text-slate-500 mb-6">No cards due today. Keep learning!</p>
                <Link
                    href="/units"
                    className="inline-block w-full bg-[#fcd34d] text-amber-900 font-black py-4 rounded-xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all text-center"
                >
                    Learn More Words
                </Link>
            </div>
        </main>
    );
}

function ReviewComplete({ count }: { count: number }) {
    return (
        <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
            <div className="bg-white rounded-[2rem] p-10 shadow-[0_10px_0_#e2e8f0] border-4 border-white text-center max-w-sm">
                <p className="text-6xl mb-4">⭐</p>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Great job!</h2>
                <p className="text-slate-500 mb-6">
                    You reviewed <span className="font-bold text-slate-800">{count}</span> card{count !== 1 ? "s" : ""}!
                </p>
                <Link
                    href="/"
                    className="inline-block w-full bg-[#fcd34d] text-amber-900 font-black py-4 rounded-xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all text-center"
                >
                    Back to Home
                </Link>
            </div>
        </main>
    );
}
